import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { WorkspaceShell } from "../WorkspaceShell";
import { createProjectDraft } from "../../app/projects/projectDraft";
import { loadLocalManifests } from "../../runtime/manifest/LocalRuntimeManifestLoader";
import { serializeRuntimeState } from "../../runtime/RuntimePersistenceService";
import {
  clearCanvasPreviewIntakeState,
  intakeDryRunPreview,
} from "../CanvasPreviewIntakeService";

// Mock the manifest loader to control loading completion in tests
vi.mock("../../runtime/manifest/LocalRuntimeManifestLoader", () => ({
  loadLocalManifests: vi.fn().mockResolvedValue([]),
}));

describe("WorkspaceShell Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearCanvasPreviewIntakeState();
  });

  it("renders correctly with default props", () => {
    render(<WorkspaceShell />);
    expect(screen.getByText("Mission Control Draft")).toBeInTheDocument();
  });

  it("keeps every Studio inside the shared aligned workspace frame", () => {
    render(<WorkspaceShell />);

    const shell = screen.getByTestId("studio-shell");
    expect(shell).toHaveAttribute("data-layout", "studio-shell-v2");

    const navigation = screen.getByRole("complementary", { name: "Studio navigation" });
    expect(within(navigation).getByRole("img", { name: "Axiom Studio brand logo" })).toHaveAttribute(
      "src",
      expect.stringMatching(/axiom-logo-ui-512\.webp$/),
    );

    const commandBar = screen.getByRole("banner", { name: "Studio command bar" });
    expect(within(commandBar).getByRole("toolbar", { name: "Workspace commands" })).toBeInTheDocument();

    const productionSurface = screen.getByRole("region", { name: "Studio production surface" });
    expect(productionSurface).toHaveAttribute("data-layout", "canvas-inspector");
    expect(within(productionSurface).getByRole("article", { name: "Mission Control workspace" })).toBeInTheDocument();
    expect(within(productionSurface).getByRole("complementary", { name: "Inspector" })).toBeInTheDocument();
  });

  it("reserves the Mission Control draft form for Mission Control", () => {
    render(<WorkspaceShell />);

    expect(screen.getByText("Mission Control Draft")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Photo Studio" }));

    expect(screen.queryByText("Mission Control Draft")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Studio utility dock")).toBeInTheDocument();
  });

  it("passes trusted workspace learning policy to the Brain X runtime", async () => {
    const project = createProjectDraft({
      name: "Workspace policy",
      intent: "",
      targetStudioId: "brain-x",
    });
    project.brain.learningControl = {
      contractVersion: "imagine-x-learning-control.v1",
      enabled: true,
      scope: "local_workspace",
      consent: "granted",
      updatedAtUtc: "2026-08-01T00:00:00.000Z",
    };

    render(<WorkspaceShell
      project={project}
      workspaceLearningPolicy={{ status: "required_unavailable" }}
    />);
    fireEvent.click(screen.getByRole("button", { name: "Brain X" }));

    expect(await screen.findByRole(
      "region",
      { name: "Learning authority" },
      { timeout: 10000 },
    )).toHaveTextContent(
      "Required workspace policy is unavailable.",
    );
  }, 10000);

  it("Save Runtime State does not mutate the original project object and calls onSaveProject", async () => {
    const onSaveProject = vi.fn();
    const originalProject = createProjectDraft({
      name: "Test Axiom Campaign",
      intent: "Validation test for immutability",
      targetStudioId: "photo",
    });
    
    // Set a baseline runtime block
    const initialRuntime = originalProject.runtime;
    expect(initialRuntime).toBeDefined();

    // Render with project
    render(
      <WorkspaceShell project={originalProject} onSaveProject={onSaveProject} />
    );

    // Open Registry sidebar
    const registryToggle = screen.getByTestId("registry-toggle");
    fireEvent.click(registryToggle);

    // Click Save State button (wait for render)
    const saveStateButton = await screen.findByText("Save");
    fireEvent.click(saveStateButton);

    // Assertions
    expect(originalProject.runtime).toBe(initialRuntime); // No direct mutation!
    expect(onSaveProject).toHaveBeenCalledTimes(1);
    expect(onSaveProject).toHaveBeenCalledWith(
      expect.objectContaining({
        runtime: expect.any(Object),
      })
    );

    // Ensure the saved runtime block has correct schema version
    const savedProject = onSaveProject.mock.calls[0][0];
    expect(savedProject.runtime.schemaVersion).toBe("0.3.0");
    expect(savedProject.canvasPreview.schemaVersion).toBe("0.5.0");
  });

  it("Save Runtime State persists queued canvas preview candidates", async () => {
    const onSaveProject = vi.fn();
    const originalProject = createProjectDraft({
      name: "Preview Persistence",
      intent: "Persist dry-run preview state",
      targetStudioId: "photo",
    });

    render(<WorkspaceShell project={originalProject} onSaveProject={onSaveProject} />);
    fireEvent.click(screen.getByTestId("registry-toggle"));
    await screen.findByText("Save");

    intakeDryRunPreview({
      runtimeId: "mock-motion-studio",
      actionId: "renderMotionFrame",
      preview: {
        contractVersion: "runtime-dry-run-preview.v1",
        kind: "canvas_preview",
        title: "Persisted Preview",
        summary: "Workspace save persistence test.",
        studioId: "motion",
        canvas: { width: 1920, height: 1080, aspectRatio: "16:9", background: "transparent" },
        layers: [
          {
            id: "layer-1",
            label: "Layer",
            type: "motion",
            bounds: { x: 0, y: 0, width: 100, height: 100 },
            opacity: 1,
            blendMode: "normal",
            source: "runtime-mock",
          },
        ],
        assemblySteps: ["Persist candidate"],
        exportTargets: ["canvas-preview-json"],
        estimatedDurationMs: 10,
        approvedForCanvasAssembly: false,
        security: {
          dryRun: true,
          noExecutionPerformed: true,
          runtimeCodeLoaded: false,
          moduleUrlExecuted: false,
        },
      },
    });

    fireEvent.click(await screen.findByText("Save"));

    const savedProject = onSaveProject.mock.calls[0][0];
    expect(savedProject.canvasPreview.schemaVersion).toBe("0.5.0");
    expect(savedProject.canvasPreview.candidates).toHaveLength(1);
    expect(savedProject.canvasPreview.candidates[0].preview.title).toBe("Persisted Preview");
  });

  it("Restore button plans and applies hydration, and triggers panel reload", async () => {
    const onSaveProject = vi.fn();
    const originalProject = createProjectDraft({
      name: "Test Axiom Campaign",
      intent: "Validation test for hydration",
      targetStudioId: "photo",
    });
    
    const serializedBlock = serializeRuntimeState([], [], []);
    const projectWithRuntime = {
      ...originalProject,
      runtime: serializedBlock,
    };

    render(
      <WorkspaceShell project={projectWithRuntime} onSaveProject={onSaveProject} />
    );

    // Open Registry sidebar
    const registryToggle = screen.getByTestId("registry-toggle");
    fireEvent.click(registryToggle);

    // Click Restore button (wait for render)
    const restoreButton = await screen.findByText("Restore");
    fireEvent.click(restoreButton);

    // Check that manifests were loaded as part of restore flow
    expect(loadLocalManifests).toHaveBeenCalled();
  });
});
