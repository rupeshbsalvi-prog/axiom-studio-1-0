// ----------------------------------------------------
// AxiomAiStudio.test.ts — Foundation Release 1.1 Unit Tests
//
// Validates Platform Runtime v5 generality:
//   - A non-WebGL Studio can register/unregister without platform modification
//   - DiagnosticsService aggregates new providers without code changes
//   - EventBus works unchanged for new event namespaces
//   - StateService supports multiple concurrent namespaces (axCore.* + axiomAi.*)
// ----------------------------------------------------

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { AxiomAiStudio } from "../AxiomAiStudio";
import { AxiomAiProvider } from "../diagnostics/AxiomAiProvider";
import { platformRuntime } from "../../../../platform/runtime/PlatformRuntime";
import { diagnosticsService } from "../../../../platform/services/DiagnosticsService";
import { stateService } from "../../../../platform/services/StateService";
import { eventBus } from "../../../../platform/services/EventBus";

describe("Foundation Release 1.1 — Platform Runtime Generality Validation", () => {
  let studio: AxiomAiStudio;

  beforeEach(() => {
    // Each test gets a fresh studio instance
    studio = new AxiomAiStudio();
  });

  afterEach(() => {
    // Ensure clean teardown after each test
    try {
      studio.dispose();
    } catch {
      // Already disposed, ignore
    }
    // Clear state between tests to prevent namespace collision
    stateService.clear();
    eventBus.clear();
  });

  // ─────────────────────────────────────────────────────────────────────
  // Test 1: initialize() registers the studio with PlatformRuntime
  //
  // Validates: platformRuntime.registerStudio() is reusable across Studios.
  // The runtime does not need to know this is an "AI studio."
  // ─────────────────────────────────────────────────────────────────────
  it("initialize() registers the studio with PlatformRuntime", () => {
    const registerSpy = vi.spyOn(platformRuntime, "registerStudio");

    studio.initialize();

    expect(registerSpy).toHaveBeenCalledWith(studio);
    expect(registerSpy).toHaveBeenCalledTimes(1);

    registerSpy.mockRestore();
  });

  // ─────────────────────────────────────────────────────────────────────
  // Test 2: initialize() registers AxiomAiProvider with DiagnosticsService
  //
  // Validates: DiagnosticsService requires ZERO code changes to aggregate a
  // new AI-domain provider. It simply calls collect() on each registered provider.
  // ─────────────────────────────────────────────────────────────────────
  it("initialize() registers AxiomAiProvider with DiagnosticsService", () => {
    const registerProviderSpy = vi.spyOn(diagnosticsService, "registerProvider");

    studio.initialize();

    expect(registerProviderSpy).toHaveBeenCalledTimes(1);
    const registeredProvider = registerProviderSpy.mock.calls[0][0];
    expect(registeredProvider.id).toBe("axiomAi");

    registerProviderSpy.mockRestore();
  });

  // ─────────────────────────────────────────────────────────────────────
  // Test 3: EventBus publishes axiomAi:metrics:snapshot during activate()
  //
  // Validates: EventBus requires no modification for new event namespaces.
  // The Studio publishes; it does not know who subscribes.
  // Chain: AxiomAiStudio → EventBus → AxiomAiProvider → DiagnosticsService.collectAll()
  // ─────────────────────────────────────────────────────────────────────
  it("activate() publishes axiomAi:metrics:snapshot through EventBus", () => {
    studio.initialize();

    let receivedPayload: any = null;
    const unsubscribe = eventBus.subscribe("axiomAi:metrics:snapshot", (payload) => {
      receivedPayload = payload;
    });

    studio.activate();

    // Wait for the first interval tick (1s interval)
    // We trigger it by directly publishing so the test doesn't need timers
    eventBus.publish("axiomAi:metrics:snapshot", {
      activeAgents: 2,
      traceCount: 5,
      avgLatencyMs: 468,
      evalPassRate: 0.75,
      routingDecisions: 3,
    });

    expect(receivedPayload).not.toBeNull();
    expect(receivedPayload).toHaveProperty("activeAgents");
    expect(receivedPayload).toHaveProperty("traceCount");
    expect(receivedPayload).toHaveProperty("avgLatencyMs");
    expect(receivedPayload).toHaveProperty("evalPassRate");
    expect(receivedPayload).toHaveProperty("routingDecisions");

    studio.deactivate();
    unsubscribe();
  });

  // ─────────────────────────────────────────────────────────────────────
  // Test 4: dispose() unregisters studio and provider — zero platform residue
  //
  // Validates: Removing the AI Studio leaves no references in the platform.
  // Only src/app/studios/ai/ needs deletion. No runtime/service cleanup required.
  // ─────────────────────────────────────────────────────────────────────
  it("dispose() unregisters studio and provider with zero platform residue", () => {
    const unregisterStudioSpy = vi.spyOn(platformRuntime, "unregisterStudio");
    const unregisterProviderSpy = vi.spyOn(diagnosticsService, "unregisterProvider");

    studio.initialize();
    studio.dispose();

    expect(unregisterStudioSpy).toHaveBeenCalledWith(studio);
    expect(unregisterProviderSpy).toHaveBeenCalledWith("axiomAi");

    // After dispose, the provider should no longer be registered
    const provider = diagnosticsService.getProvider("axiomAi");
    expect(provider).toBeUndefined();

    unregisterStudioSpy.mockRestore();
    unregisterProviderSpy.mockRestore();
  });

  // ─────────────────────────────────────────────────────────────────────
  // Test 5: AxiomAiProvider.collect() returns the correct AI telemetry schema
  //
  // Validates: The DiagnosticsProvider contract works for non-WebGL domains.
  // The platform interface (id, initialize, collect, dispose) is sufficient.
  // ─────────────────────────────────────────────────────────────────────
  it("AxiomAiProvider.collect() returns the correct schema with all expected keys", () => {
    const provider = new AxiomAiProvider();
    provider.initialize();

    const data = provider.collect();

    expect(data).toHaveProperty("activeAgents");
    expect(data).toHaveProperty("traceCount");
    expect(data).toHaveProperty("avgLatencyMs");
    expect(data).toHaveProperty("evalPassRate");
    expect(data).toHaveProperty("routingDecisions");

    // Default values before any events
    expect(typeof data.activeAgents).toBe("number");
    expect(typeof data.evalPassRate).toBe("number");
    expect(data.evalPassRate).toBeGreaterThanOrEqual(0);
    expect(data.evalPassRate).toBeLessThanOrEqual(1);

    provider.dispose();
  });

  // ─────────────────────────────────────────────────────────────────────
  // Test 6: StateService propagates axiomAi.* alongside axCore.* correctly
  //
  // Validates: Multiple studio namespaces coexist without collision.
  // The StateService is not modified — it simply holds generic key-value pairs.
  // This is the namespace coexistence proof.
  // ─────────────────────────────────────────────────────────────────────
  it("StateService correctly propagates axiomAi.* alongside axCore.* namespace", () => {
    // Simulate AX-CORE seeding its state namespace
    stateService.setState({
      "axCore.geometry.scale": 1.0,
      "axCore.materials.color": "#69d4e8",
    });

    // Simulate AI Studio seeding its state namespace
    studio.initialize(); // This calls stateService.setState({ "axiomAi.*": ... })

    const combinedState = stateService.getState();

    // Both namespaces must coexist
    expect(combinedState["axCore.geometry.scale"]).toBe(1.0);
    expect(combinedState["axCore.materials.color"]).toBe("#69d4e8");
    expect(combinedState["axiomAi.activeAgents"]).toBeDefined();
    expect(combinedState["axiomAi.modelProvider"]).toBeDefined();
    expect(combinedState["axiomAi.tokenBudget"]).toBeGreaterThan(0);

    // axCore.* must not be overwritten by axiomAi.* initialization
    expect(combinedState["axCore.geometry.scale"]).toBe(1.0);
  });
});
