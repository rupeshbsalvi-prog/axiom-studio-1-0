// ----------------------------------------------------
// StudioTemplate.ts — Platform Runtime v5 Studio Scaffold
//
// USAGE: Copy this file into src/app/studios/<studio-id>/
// Rename the class and singleton. Replace all TODO blocks.
//
// This template demonstrates:
//   1. StudioModule lifecycle (initialize → activate → deactivate → dispose)
//   2. Reactive Observer Rule + re-entrancy guard (RT-001)
//   3. Cross-Studio observation via EventBus only
//   4. Provider registration
//   5. State namespace isolation
//   6. Zero platform residue on dispose()
//
// Platform Runtime v5 behavioral guarantees this template relies on:
//   - EventBus is synchronous and FIFO.
//   - StateService.setState() publishes the FULL merged state (not a delta).
//     → See RT-001 in PLATFORM_RUNTIME_V5_SPEC.md.
//     → The re-entrancy guard below is mandatory for any subscriber
//       that also writes state inside the handler.
//   - DiagnosticsService accepts providers additively (zero service changes).
//   - PlatformRuntime accepts Studios additively (zero runtime changes).
// ----------------------------------------------------

import { platformRuntime } from "../../../platform/runtime/PlatformRuntime";
import { diagnosticsService } from "../../../platform/services/DiagnosticsService";
import { eventBus } from "../../../platform/services/EventBus";
import { stateService } from "../../../platform/services/StateService";

// TODO: Replace with this Studio's DiagnosticsProvider implementation.
// See BrainXProvider.ts or AxiomAiProvider.ts for examples.
import { TemplateProvider } from "./diagnostics/TemplateProvider";

// TODO: Replace with this Studio's state contract file.
// Define STUDIO_INITIAL_STATE and all state types there.
import { STUDIO_INITIAL_STATE } from "./TemplateState";

export class StudioTemplate {

  // ── Private fields ──────────────────────────────────────────────────

  private provider: TemplateProvider | null = null;

  /** All EventBus unsubscribe functions collected here for clean disposal. */
  private unsubscribers: Array<() => void> = [];

  /**
   * RT-001 — Re-entrancy guard.
   *
   * StateService.setState() publishes the FULL merged state on every write,
   * not just the delta. If this Studio subscribes to "state:changed" and also
   * calls setState() inside the handler, the merged snapshot will trigger the
   * subscriber again — causing a stack overflow.
   *
   * The try/finally pattern ensures the flag resets even if setState() throws.
   *
   * Required for: any subscriber that writes state inside a "state:changed" handler.
   * Not required for: subscribers that only read state or publish events.
   */
  private isProcessingObservation = false;

  // ── initialize() ────────────────────────────────────────────────────
  //
  // Called once on workspace mount.
  // Register with platform + seed state + register diagnostics provider.
  // Do NOT start timers or observers here — that belongs in activate().

  initialize(): void {
    // Register with PlatformRuntime.
    // The runtime has no knowledge of this Studio's domain.
    platformRuntime.registerStudio(this);

    // Register diagnostics provider.
    // DiagnosticsService is not modified — it accepts providers additively.
    this.provider = new TemplateProvider();
    diagnosticsService.registerProvider(this.provider);
    this.provider.initialize();

    // Seed state namespace.
    // Use a namespace prefix unique to this Studio (e.g., "myStudio.*").
    // StateService requires no modification to hold this namespace.
    stateService.setState({
      "myStudio.exampleKey": STUDIO_INITIAL_STATE.exampleKey,
      // TODO: seed all initial state keys here
    });

    eventBus.publish("studio:myStudio:ready", { studioId: "my-studio" });
  }

  // ── activate() ──────────────────────────────────────────────────────
  //
  // Called when this Studio becomes the active Studio.
  // Start observers, timers, rendering loops — anything Studio-specific.
  // All subscriptions must be stored in this.unsubscribers.

  activate(): void {

    // ── Example: observe another Studio's state via EventBus ──────────
    //
    // CROSS-STUDIO RULE: Never import another Studio's class directly.
    // Always use the EventBus. The event contract is the only coupling.
    //
    // RT-001 — Re-entrancy guard is required here because this handler
    // calls setState(), which publishes the full merged state, which
    // would re-trigger this subscriber on every write.
    this.unsubscribers.push(
      eventBus.subscribe("state:changed", (newState: Record<string, any>) => {

        // ── Re-entrancy guard (RT-001) ────────────────────────────────
        // Prevents recursive publication when this handler calls setState().
        if (this.isProcessingObservation) return;

        // ── Early exit if the observed key is not present ─────────────
        // Check the specific key(s) this Studio cares about.
        if (newState["otherStudio.someKey"] === undefined) return;

        // ── Safe state mutation ───────────────────────────────────────
        try {
          this.isProcessingObservation = true;
          stateService.setState({
            "myStudio.observedValue": newState["otherStudio.someKey"],
          });
        } finally {
          // Always resets — even if setState() throws.
          this.isProcessingObservation = false;
        }

        // ── Publish a Studio-specific event ───────────────────────────
        // Other consumers can observe this without coupling to the handler above.
        eventBus.publish("myStudio:observation:updated", {
          value: newState["otherStudio.someKey"],
        });
      }),
    );

    // ── Example: subscribe to a platform event ────────────────────────
    // No re-entrancy guard needed here — this handler does not write state.
    this.unsubscribers.push(
      eventBus.subscribe("telemetry:updated", (data: Record<string, number>) => {
        // Read-only observation — no guard required.
        eventBus.publish("myStudio:telemetry:received", { fps: data.fps });
      }),
    );

    eventBus.publish("studio:myStudio:activated", { studioId: "my-studio" });
  }

  // ── deactivate() ────────────────────────────────────────────────────
  //
  // Called when this Studio loses focus.
  // Stop all observers and clear all timer handles.
  // State is preserved — only active subscriptions are torn down.

  deactivate(): void {
    // Unsubscribe all EventBus listeners.
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];

    // TODO: Clear any setTimeout / setInterval handles here.

    eventBus.publish("studio:myStudio:deactivated", { studioId: "my-studio" });
  }

  // ── dispose() ───────────────────────────────────────────────────────
  //
  // Full teardown. Called on workspace unmount.
  // After this call, no platform reference to this Studio should remain.
  // Deleting src/app/studios/<studio-id>/ must be sufficient to fully
  // remove this Studio from the platform.

  dispose(): void {
    // Deactivate first — clears subscriptions and timers.
    this.deactivate();

    // Unregister diagnostics provider.
    if (this.provider) {
      this.provider.dispose();
      diagnosticsService.unregisterProvider("myStudio"); // must match provider.id
      this.provider = null;
    }

    // Unregister from PlatformRuntime.
    platformRuntime.unregisterStudio(this);

    eventBus.publish("studio:myStudio:disposed", { studioId: "my-studio" });

    // After this point: zero platform residue.
    // No timer handles. No subscriptions. No provider. No runtime entry.
  }
}

// Singleton export — consistent with axiomAiStudio and brainXStudio patterns.
export const studioTemplate = new StudioTemplate();
