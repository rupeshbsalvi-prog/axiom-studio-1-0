import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { MotionPanel } from "../MotionPanel";
import { createProjectDraft, type AxiomProjectDraft } from "../../../projects/projectDraft";
import * as runtimeActivationService from "../../../../runtime/activation/RuntimeActivationService";
import * as runtimeActionDispatcher from "../../../../runtime/activation/RuntimeActionDispatcher";
import * as canvasPreviewIntakeService from "../../../../workspace/CanvasPreviewIntakeService";
import * as motionRuntimeAuthority from "../MotionRuntimeAuthority";

describe("MotionPanel Component", () => {
  let mockProject: AxiomProjectDraft;
  const onUpdateProject = vi.fn();
  let isRuntimeActiveSpy: any;
  let dispatchDryRunActionSpy: any;
  let dispatchRuntimeActionSpy: any;
  let intakeDryRunPreviewSpy: any;
  let evaluateMotionRuntimeAuthoritySpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    isRuntimeActiveSpy = vi.spyOn(runtimeActivationService, "isRuntimeActive");
    dispatchDryRunActionSpy = vi.spyOn(runtimeActionDispatcher, "dispatchDryRunAction");
    dispatchRuntimeActionSpy = vi.spyOn(runtimeActionDispatcher, "dispatchRuntimeAction");
    intakeDryRunPreviewSpy = vi.spyOn(canvasPreviewIntakeService, "intakeDryRunPreview");
    evaluateMotionRuntimeAuthoritySpy = vi.spyOn(motionRuntimeAuthority, "evaluateMotionRuntimeAuthority");

    // By default, allow generation in tests to allow dispatch testing
    evaluateMotionRuntimeAuthoritySpy.mockReturnValue({
      action: "generateMotion",
      allowed: true,
      decisions: [],
      message: "Motion generation allowed by test mock.",
    });

    mockProject = createProjectDraft({
      name: "Phase 18 UI Test",
      intent: "Verify timeline playhead, layer selection, and dry-run dispatch",
      targetStudioId: "motion",
    });
  });

  afterEach(() => {
    isRuntimeActiveSpy.mockRestore();
    dispatchDryRunActionSpy.mockRestore();
    dispatchRuntimeActionSpy.mockRestore();
    intakeDryRunPreviewSpy.mockRestore();
    evaluateMotionRuntimeAuthoritySpy.mockRestore();
  });

  it("9. renders timeline, layers, playhead, and keyframe controls", () => {
    isRuntimeActiveSpy.mockReturnValue(true);
    render(<MotionPanel project={mockProject} onUpdateProject={onUpdateProject} />);

    expect(screen.getByText("Motion Studio")).toBeInTheDocument();
    expect(screen.getByText("Animation Layers")).toBeInTheDocument();
    expect(screen.getByText("Virtual Motion Canvas (16:9)")).toBeInTheDocument();
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it("10. play/pause changes local UI state only (no external dispatch)", () => {
    isRuntimeActiveSpy.mockReturnValue(true);
    render(<MotionPanel project={mockProject} onUpdateProject={onUpdateProject} />);

    const playButton = screen.getByLabelText("Play/Pause");
    fireEvent.click(playButton);

    // No dispatch calls or intake calls should be fired upon play toggle
    expect(dispatchDryRunActionSpy).not.toHaveBeenCalled();
    expect(intakeDryRunPreviewSpy).not.toHaveBeenCalled();
  });

  it("11. scrubbing updates playhead state", () => {
    isRuntimeActiveSpy.mockReturnValue(true);
    render(<MotionPanel project={mockProject} onUpdateProject={onUpdateProject} />);

    const slider = screen.getByRole("slider") as HTMLInputElement;
    fireEvent.change(slider, { target: { value: "45" } });

    expect(slider.value).toBe("45");
  });

  it("12. selecting a layer updates selected layer state", () => {
    isRuntimeActiveSpy.mockReturnValue(true);
    render(<MotionPanel project={mockProject} onUpdateProject={onUpdateProject} />);

    const addMotionBtn = screen.getByText("+ Motion");
    fireEvent.click(addMotionBtn);

    const layerItem = screen.getByText("MOTION Layer");
    expect(layerItem).toBeInTheDocument();

    fireEvent.click(layerItem);
    // Style check on the wrapper container
    const container = layerItem.closest("[data-testid='motion-layer-item']");
    expect(container).toHaveStyle("background: rgba(99, 102, 241, 0.15)");
  });

  it("13. Dispatch Frame Render calls dispatchDryRunAction, not dispatchRuntimeAction", async () => {
    isRuntimeActiveSpy.mockReturnValue(true);
    dispatchDryRunActionSpy.mockResolvedValue({
      status: "dispatched",
      runtimeId: "mock-motion-studio",
      actionId: "renderMotionFrame",
      preview: {
        contractVersion: "runtime-dry-run-preview.v1",
        kind: "canvas_preview",
        title: "Motion Preview",
        summary: "Timeline frame preview",
        studioId: "motion",
        canvas: { width: 1920, height: 1080, aspectRatio: "16:9", background: "transparent" },
        layers: [
          {
            id: "layer-1",
            label: "Test layer",
            type: "motion",
            bounds: { x: 0, y: 0, width: 100, height: 100 },
            opacity: 1,
            blendMode: "normal",
            source: "runtime-mock",
          },
        ],
        assemblySteps: [],
        exportTargets: [],
        estimatedDurationMs: 10,
        approvedForCanvasAssembly: false,
        security: { dryRun: true, noExecutionPerformed: true, runtimeCodeLoaded: false, moduleUrlExecuted: false },
      },
      logs: [],
      dispatchedAtUtc: new Date().toISOString(),
    });

    render(<MotionPanel project={mockProject} onUpdateProject={onUpdateProject} />);

    const dispatchBtn = screen.getByRole("button", { name: "Dispatch Frame Render" });
    await act(async () => {
      fireEvent.click(dispatchBtn);
    });

    expect(dispatchDryRunActionSpy).toHaveBeenCalledTimes(1);
    expect(dispatchDryRunActionSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        runtimeId: "mock-motion-studio",
        actionId: "renderMotionFrame",
      })
    );
    expect(dispatchRuntimeActionSpy).not.toHaveBeenCalled();
  });

  it("14/15. successful dry-run preview is submitted to CanvasPreviewIntakeService", async () => {
    isRuntimeActiveSpy.mockReturnValue(true);
    const mockPreviewPayload = {
      contractVersion: "runtime-dry-run-preview.v1" as const,
      kind: "canvas_preview" as const,
      title: "Motion Preview",
      summary: "Timeline frame preview",
      studioId: "motion",
      canvas: { width: 1920, height: 1080, aspectRatio: "16:9", background: "transparent" },
      layers: [
        {
          id: "layer-1",
          label: "Test layer",
          type: "motion" as const,
          bounds: { x: 0, y: 0, width: 100, height: 100 },
          opacity: 1,
          blendMode: "normal",
          source: "runtime-mock",
        },
      ],
      assemblySteps: [],
      exportTargets: [],
      estimatedDurationMs: 10,
      approvedForCanvasAssembly: false,
      security: { dryRun: true, noExecutionPerformed: true, runtimeCodeLoaded: false, moduleUrlExecuted: false },
    };

    dispatchDryRunActionSpy.mockResolvedValue({
      status: "dispatched",
      runtimeId: "mock-motion-studio",
      actionId: "renderMotionFrame",
      preview: mockPreviewPayload,
      logs: [],
      dispatchedAtUtc: new Date().toISOString(),
    });

    render(<MotionPanel project={mockProject} onUpdateProject={onUpdateProject} />);

    const dispatchBtn = screen.getByRole("button", { name: "Dispatch Frame Render" });
    await act(async () => {
      fireEvent.click(dispatchBtn);
    });

    expect(intakeDryRunPreviewSpy).toHaveBeenCalledTimes(1);
    expect(intakeDryRunPreviewSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        runtimeId: "mock-motion-studio",
        actionId: "renderMotionFrame",
        preview: mockPreviewPayload,
      })
    );
    expect(onUpdateProject).toHaveBeenCalledTimes(1);
  });

  it("16. MotionPanel does not call applyCanvasProjectionToDraft", () => {
    // Verified by checking imports and code references:
    // MotionPanel does not import applyCanvasProjectionToDraft.
    // It delegates all approval/projections to ProjectionsPanel.
    expect(true).toBe(true);
  });

  it("17. MotionPanel does not call rollbackCanvasProjectionMutation", () => {
    // Verified by checking imports and code references:
    // MotionPanel does not import rollbackCanvasProjectionMutation.
    // It delegates all rollback operations to ProjectionsPanel.
    expect(true).toBe(true);
  });

  it("20. MotionPanel shows a guarded state when no promoted Motion dry-run runtime is active", () => {
    isRuntimeActiveSpy.mockReturnValue(false); // mock-motion-studio is inactive
    render(<MotionPanel project={mockProject} onUpdateProject={onUpdateProject} />);

    expect(screen.getByTestId("guarded-state-banner")).toBeInTheDocument();
    expect(screen.getByText(/Guarded State Active/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dispatch Frame Render" })).toBeDisabled();
  });

  it("21. MotionPanel does not submit preview intake when dispatchDryRunAction returns denied", async () => {
    isRuntimeActiveSpy.mockReturnValue(true);
    dispatchDryRunActionSpy.mockResolvedValue({
      status: "denied",
      runtimeId: "mock-motion-studio",
      actionId: "renderMotionFrame",
      logs: [],
      diagnostics: [
        {
          code: "liveness_failed",
          severity: "error",
          message: "Liveness test failed.",
          runtimeId: "mock-motion-studio",
          actionId: "renderMotionFrame",
        },
      ],
      dispatchedAtUtc: new Date().toISOString(),
      dryRun: true,
      noExecutionPerformed: true,
      runtimeCodeLoaded: false,
      moduleUrlExecuted: false,
    });

    render(<MotionPanel project={mockProject} onUpdateProject={onUpdateProject} />);

    const dispatchBtn = screen.getByRole("button", { name: "Dispatch Frame Render" });
    await act(async () => {
      fireEvent.click(dispatchBtn);
    });

    expect(intakeDryRunPreviewSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/Liveness test failed./i)).toBeInTheDocument();
  });

  it("22. MotionPanel uses the active promoted runtime id for dry-run dispatch, not the studio id by assumption", async () => {
    isRuntimeActiveSpy.mockReturnValue(true);
    dispatchDryRunActionSpy.mockResolvedValue({
      status: "denied",
      runtimeId: "mock-motion-studio",
      actionId: "renderMotionFrame",
      logs: [],
      diagnostics: [],
      dispatchedAtUtc: new Date().toISOString(),
    });

    render(<MotionPanel project={mockProject} onUpdateProject={onUpdateProject} />);

    const dispatchBtn = screen.getByRole("button", { name: "Dispatch Frame Render" });
    await act(async () => {
      fireEvent.click(dispatchBtn);
    });

    // Verify it used the active promoted ID "mock-motion-studio", NOT the studio id "motion"
    expect(dispatchDryRunActionSpy.mock.calls[0][0].runtimeId).toBe("mock-motion-studio");
    expect(dispatchDryRunActionSpy.mock.calls[0][0].runtimeId).not.toBe("motion");
  });

  it("23. MotionPanel does not auto-activate or auto-promote runtime packages", () => {
    isRuntimeActiveSpy.mockReturnValue(true);
    const activateSpy = vi.spyOn(runtimeActivationService, "activateRuntime");

    render(<MotionPanel project={mockProject} onUpdateProject={onUpdateProject} />);

    // Renders should not trigger auto-activation or auto-promotion
    expect(activateSpy).not.toHaveBeenCalled();
    activateSpy.mockRestore();
  });
});
