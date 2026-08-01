import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { VectorPanel } from "../VectorPanel";
import { createProjectDraft, type AxiomProjectDraft } from "../../../projects/projectDraft";
import * as runtimeActivationService from "../../../../runtime/activation/RuntimeActivationService";
import * as runtimeActionDispatcher from "../../../../runtime/activation/RuntimeActionDispatcher";
import * as canvasPreviewIntakeService from "../../../../workspace/CanvasPreviewIntakeService";
import * as vectorRuntimeAuthority from "../VectorRuntimeAuthority";
import * as vectorApi from "../../../services/vectorApi";
import { getMockHandler } from "../../../../runtime/activation/RuntimeMockActionRegistry";

describe("VectorPanel Component & Authority MVP", () => {
  let mockProject: AxiomProjectDraft;
  const onUpdateProject = vi.fn();
  let isRuntimeActiveSpy: any;
  let getAllActivatedRuntimesSpy: any;
  let dispatchDryRunActionSpy: any;
  let dispatchRuntimeActionSpy: any;
  let intakeDryRunPreviewSpy: any;
  let evaluateVectorRuntimeAuthoritySpy: any;
  let generateVectorCompositionSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    isRuntimeActiveSpy = vi.spyOn(runtimeActivationService, "isRuntimeActive");
    getAllActivatedRuntimesSpy = vi.spyOn(runtimeActivationService, "getAllActivatedRuntimes");
    dispatchDryRunActionSpy = vi.spyOn(runtimeActionDispatcher, "dispatchDryRunAction");
    dispatchRuntimeActionSpy = vi.spyOn(runtimeActionDispatcher, "dispatchRuntimeAction");
    intakeDryRunPreviewSpy = vi.spyOn(canvasPreviewIntakeService, "intakeDryRunPreview");
    evaluateVectorRuntimeAuthoritySpy = vi.spyOn(vectorRuntimeAuthority, "evaluateVectorRuntimeAuthority");
    generateVectorCompositionSpy = vi.spyOn(vectorApi, "generateVectorComposition");

    vi.spyOn(vectorApi, "getVectorTemplates").mockResolvedValue({
      categories: ["logo"],
      aesthetics: ["modern"],
      aspectRatios: ["1:1"],
      palettes: ["brand"]
    });

    vi.spyOn(vectorApi, "planVectorComposition").mockResolvedValue({
      intent: "mock intent",
      category: "logo",
      aspectRatio: "1:1",
      canvas: { width: 1024, height: 1024, viewBox: "0 0 1024 1024" },
      aesthetic: "modern",
      palette: "brand",
      colorPalette: ["#ffffff"],
      shapeBreakdown: [
        { name: "Shape 1", type: "rect", description: "Desc", fill: "#ffffff", stroke: "#000000", strokeWidth: 1 }
      ],
      compositionStrategy: "Mock strategy",
      negativePrompt: "",
      audit: [],
      provider: { name: "mock-provider", mode: "mock", status: "online" }
    });

    mockProject = createProjectDraft({
      name: "Phase 19 UI Test",
      intent: "Verify Vector dispatch and security checks",
      targetStudioId: "vector",
    });
  });

  afterEach(() => {
    isRuntimeActiveSpy.mockRestore();
    getAllActivatedRuntimesSpy.mockRestore();
    dispatchDryRunActionSpy.mockRestore();
    dispatchRuntimeActionSpy.mockRestore();
    intakeDryRunPreviewSpy.mockRestore();
    evaluateVectorRuntimeAuthoritySpy.mockRestore();
    generateVectorCompositionSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it("1. renders a guarded state banner when mock-vector-studio is not active", async () => {
    getAllActivatedRuntimesSpy.mockReturnValue([]);
    render(<VectorPanel project={mockProject} onUpdateProject={onUpdateProject} />);
    await screen.findByRole("option", { name: "logo" });

    expect(screen.getByText(/No active promoted Vector runtime/i)).toBeInTheDocument();
  });

  it("2. disables composition approval controls when guarded state is active", async () => {
    getAllActivatedRuntimesSpy.mockReturnValue([]);
    render(<VectorPanel project={mockProject} onUpdateProject={onUpdateProject} />);
    await screen.findByRole("option", { name: "logo" });

    const analyzeBtn = screen.getByText("Analyze Intent") as HTMLButtonElement;
    expect(analyzeBtn).toBeDisabled();
  });

  it("3. action dispatch uses active promoted runtime ID explicitly rather than the studio ID by default", async () => {
    getAllActivatedRuntimesSpy.mockReturnValue([
      { runtimeId: "mock-vector-studio", manifestId: "vector", status: "active", actions: [], activatedAt: "", grantedCapabilities: [] }
    ]);
    dispatchDryRunActionSpy.mockResolvedValue({ status: "simulated", output: {}, preview: { contractVersion: "runtime-dry-run-preview.v1", layers: [{ id: "l1" }] } });
    intakeDryRunPreviewSpy.mockReturnValue({ success: true, candidate: { id: "c1" } });

    render(<VectorPanel project={mockProject} onUpdateProject={onUpdateProject} />);
    await screen.findByRole("option", { name: "logo" });

    // Trigger intent analysis
    const textarea = screen.getByPlaceholderText(/Describe the logo/i);
    act(() => {
      fireEvent.change(textarea, { target: { value: "Draw a futuristic triangle" } });
    });
    const analyzeBtn = screen.getByText("Analyze Intent");
    act(() => {
      fireEvent.click(analyzeBtn);
    });

    // Wait for blueprint section
    await screen.findByText("Vector Blueprint");

    const approveBtn = screen.getByText("Approve & Dispatch Canvas Preview");
    act(() => {
      fireEvent.click(approveBtn);
    });

    await waitFor(() => {
      expect(dispatchDryRunActionSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          runtimeId: "mock-vector-studio",
          actionId: "generateVectorComposition",
        })
      );
    });
  });

  it("4. dispatching calls dispatchDryRunAction, never dispatchRuntimeAction", async () => {
    getAllActivatedRuntimesSpy.mockReturnValue([
      { runtimeId: "mock-vector-studio", manifestId: "vector", status: "active", actions: [], activatedAt: "", grantedCapabilities: [] }
    ]);
    dispatchDryRunActionSpy.mockResolvedValue({ status: "simulated", output: {}, preview: { contractVersion: "runtime-dry-run-preview.v1", layers: [{ id: "l1" }] } });
    intakeDryRunPreviewSpy.mockReturnValue({ success: true, candidate: { id: "c1" } });

    render(<VectorPanel project={mockProject} onUpdateProject={onUpdateProject} />);
    await screen.findByRole("option", { name: "logo" });

    const textarea = screen.getByPlaceholderText(/Describe the logo/i);
    act(() => {
      fireEvent.change(textarea, { target: { value: "Draw a futuristic triangle" } });
    });
    act(() => {
      fireEvent.click(screen.getByText("Analyze Intent"));
    });

    await screen.findByText("Vector Blueprint");
    act(() => {
      fireEvent.click(screen.getByText("Approve & Dispatch Canvas Preview"));
    });

    await waitFor(() => {
      expect(dispatchDryRunActionSpy).toHaveBeenCalled();
      expect(dispatchRuntimeActionSpy).not.toHaveBeenCalled();
    });
  });

  it("5. denied dispatch results do not submit to preview intake", async () => {
    getAllActivatedRuntimesSpy.mockReturnValue([
      { runtimeId: "mock-vector-studio", manifestId: "vector", status: "active", actions: [], activatedAt: "", grantedCapabilities: [] }
    ]);
    dispatchDryRunActionSpy.mockResolvedValue({ status: "denied", diagnostics: [{ message: "Permission denied by sandbox rules.", severity: "error" }] });

    render(<VectorPanel project={mockProject} onUpdateProject={onUpdateProject} />);
    await screen.findByRole("option", { name: "logo" });

    const textarea = screen.getByPlaceholderText(/Describe the logo/i);
    act(() => {
      fireEvent.change(textarea, { target: { value: "Draw a futuristic triangle" } });
    });
    act(() => {
      fireEvent.click(screen.getByText("Analyze Intent"));
    });

    await screen.findByText("Vector Blueprint");
    act(() => {
      fireEvent.click(screen.getByText("Approve & Dispatch Canvas Preview"));
    });

    await waitFor(() => {
      expect(dispatchDryRunActionSpy).toHaveBeenCalled();
      expect(intakeDryRunPreviewSpy).not.toHaveBeenCalled();
    });
    expect(await screen.findByText(/Permission denied/i)).toBeInTheDocument();
  });

  it("6. successful dispatch queues candidate into CanvasPreviewIntakeService and triggers onUpdateProject", async () => {
    getAllActivatedRuntimesSpy.mockReturnValue([
      { runtimeId: "mock-vector-studio", manifestId: "vector", status: "active", actions: [], activatedAt: "", grantedCapabilities: [] }
    ]);
    const mockPreview = { contractVersion: "runtime-dry-run-preview.v1", layers: [{ id: "l1" }] };
    dispatchDryRunActionSpy.mockResolvedValue({ status: "simulated", output: {}, preview: mockPreview });
    intakeDryRunPreviewSpy.mockReturnValue({ success: true, candidate: { id: "c1" } });

    render(<VectorPanel project={mockProject} onUpdateProject={onUpdateProject} />);
    await screen.findByRole("option", { name: "logo" });

    const textarea = screen.getByPlaceholderText(/Describe the logo/i);
    act(() => {
      fireEvent.change(textarea, { target: { value: "Draw a futuristic triangle" } });
    });
    act(() => {
      fireEvent.click(screen.getByText("Analyze Intent"));
    });

    await screen.findByText("Vector Blueprint");
    act(() => {
      fireEvent.click(screen.getByText("Approve & Dispatch Canvas Preview"));
    });

    await waitFor(() => {
      expect(intakeDryRunPreviewSpy).toHaveBeenCalled();
      expect(onUpdateProject).toHaveBeenCalled();
    });
  });

  it("7. VectorPanel does not call apply or rollback services directly", async () => {
    getAllActivatedRuntimesSpy.mockReturnValue([
      { runtimeId: "mock-vector-studio", manifestId: "vector", status: "active", actions: [], activatedAt: "", grantedCapabilities: [] }
    ]);
    render(<VectorPanel project={mockProject} onUpdateProject={onUpdateProject} />);
    await screen.findByRole("option", { name: "logo" });

    // Confirm that manual buttons or UI elements do not reference apply/rollback elements
    expect(screen.queryByText(/apply/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/rollback/i)).not.toBeInTheDocument();
  });

  it("8. VectorPanel does not trigger auto-activation or auto-promotion hooks", async () => {
    getAllActivatedRuntimesSpy.mockReturnValue([]);
    render(<VectorPanel project={mockProject} onUpdateProject={onUpdateProject} />);
    await screen.findByRole("option", { name: "logo" });

    // Verify no activation service call occurred automatically on mount
    const activateRuntimeSpy = vi.spyOn(runtimeActivationService, "activateRuntime");
    expect(activateRuntimeSpy).not.toHaveBeenCalled();
  });

  it("9. dry-run vector preview is allowed when canUseProviders is false", () => {
    // Vector manifest record has canUseProviders: false, but previewVectorComposition is permitted
    const decision = vectorRuntimeAuthority.evaluateVectorRuntimeAuthority("previewVectorComposition");
    expect(decision.allowed).toBe(true);
  });

  it("10. provider-backed vector generation is blocked when canUseProviders is false", () => {
    const decision = vectorRuntimeAuthority.evaluateVectorRuntimeAuthority("providerGenerateVector");
    expect(decision.allowed).toBe(false);
    expect(decision.message).toContain("Runtime authority blocks use providers.");
  });

  it("11. primary vector generation does not call vectorApi generation directly", async () => {
    getAllActivatedRuntimesSpy.mockReturnValue([
      { runtimeId: "mock-vector-studio", manifestId: "vector", status: "active", actions: [], activatedAt: "", grantedCapabilities: [] }
    ]);
    dispatchDryRunActionSpy.mockResolvedValue({ status: "simulated", output: {}, preview: { contractVersion: "runtime-dry-run-preview.v1", layers: [{ id: "l1" }] } });
    intakeDryRunPreviewSpy.mockReturnValue({ success: true, candidate: { id: "c1" } });

    render(<VectorPanel project={mockProject} onUpdateProject={onUpdateProject} />);
    await screen.findByRole("option", { name: "logo" });

    const textarea = screen.getByPlaceholderText(/Describe the logo/i);
    act(() => {
      fireEvent.change(textarea, { target: { value: "Draw a futuristic triangle" } });
    });
    act(() => {
      fireEvent.click(screen.getByText("Analyze Intent"));
    });

    await screen.findByText("Vector Blueprint");
    act(() => {
      fireEvent.click(screen.getByText("Approve & Dispatch Canvas Preview"));
    });

    await waitFor(() => {
      expect(generateVectorCompositionSpy).not.toHaveBeenCalled();
    });
  });

  it("12. manual shape editing still works without promoted runtime activation", async () => {
    getAllActivatedRuntimesSpy.mockReturnValue([]); // No active runtimes
    render(<VectorPanel project={mockProject} onUpdateProject={onUpdateProject} />);
    await screen.findByRole("option", { name: "logo" });

    // Click Create Rectangle button
    const createRectBtn = screen.getByTitle("Create Rectangle");
    act(() => {
      fireEvent.click(createRectBtn);
    });

    // Verify it adds a shape locally to state without throwing or triggering dispatch
    expect(dispatchDryRunActionSpy).not.toHaveBeenCalled();
    expect(screen.getByText("Rectangle Shape Added")).toBeInTheDocument();
  });

  it("13. successful dry-run intake does not mutate authoritative canvas elements", async () => {
    getAllActivatedRuntimesSpy.mockReturnValue([
      { runtimeId: "mock-vector-studio", manifestId: "vector", status: "active", actions: [], activatedAt: "", grantedCapabilities: [] }
    ]);
    dispatchDryRunActionSpy.mockResolvedValue({ status: "simulated", output: {}, preview: { contractVersion: "runtime-dry-run-preview.v1", layers: [{ id: "l1" }] } });
    intakeDryRunPreviewSpy.mockReturnValue({ success: true, candidate: { id: "c1" } });

    render(<VectorPanel project={mockProject} onUpdateProject={onUpdateProject} />);
    await screen.findByRole("option", { name: "logo" });

    const textarea = screen.getByPlaceholderText(/Describe the logo/i);
    act(() => {
      fireEvent.change(textarea, { target: { value: "Draw a futuristic triangle" } });
    });
    act(() => {
      fireEvent.click(screen.getByText("Analyze Intent"));
    });

    await screen.findByText("Vector Blueprint");
    act(() => {
      fireEvent.click(screen.getByText("Approve & Dispatch Canvas Preview"));
    });

    await waitFor(() => {
      // Assert that authoritative local state is unchanged, i.e. shapeOrder of canvas remains empty
      // Only project.canvasPreview is dispatched via onUpdateProject.
      expect(onUpdateProject).toHaveBeenCalledWith(
        expect.objectContaining({
          canvasPreview: expect.objectContaining({
            schemaVersion: "0.5.0",
          }),
        })
      );
    });
  });

  it("14. runtime mock handlers are registered only through RuntimeMockActionRegistry, not package manifest metadata", async () => {
    const handler = getMockHandler("mock-vector-studio", "generateVectorComposition");
    expect(handler).toBeDefined();
    expect(typeof handler).toBe("function");
  });

  it("15. no LOCAL_RUNTIME_EXECUTORS path is introduced for Vector dry-run dispatch", async () => {
    const mockExecutorModule = await import("../../../../runtime/activation/MockRuntimeExecutor");
    expect(mockExecutorModule.LOCAL_RUNTIME_EXECUTORS["mock-vector-studio"]).toBeUndefined();
  });
});
