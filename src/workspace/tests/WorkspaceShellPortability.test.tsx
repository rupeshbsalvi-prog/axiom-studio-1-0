import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WorkspaceShell } from "../WorkspaceShell";
import { createProjectDraft } from "../../app/projects/projectDraft";
import { createAxpkgEnvelope } from "../../app/projects/axpkg/AxpkgSerializer";
import { serializeAxpkgEnvelope } from "../../app/projects/axpkg/AxpkgExportService";

describe("WorkspaceShell Portability integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock URL methods for JSDOM
    window.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
    window.URL.revokeObjectURL = vi.fn();
  });

  it("Export button triggers envelope creation and triggers browser download link click", () => {
    const project = createProjectDraft({
      name: "Export Test Shell",
      intent: "Check export UI",
      targetStudioId: "photo",
    });

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<WorkspaceShell project={project} />);

    const exportBtn = screen.getByTestId("export-axpkg-button");
    expect(exportBtn).not.toBeDisabled();
    fireEvent.click(exportBtn);

    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it("Import button triggers file upload and updates active project, showing success banner", async () => {
    const project = createProjectDraft({
      name: "Import Test Shell",
      intent: "Check import UI",
      targetStudioId: "photo",
    });
    const envelope = createAxpkgEnvelope(project);
    const jsonStr = serializeAxpkgEnvelope(envelope);

    const onSaveProject = vi.fn();
    render(<WorkspaceShell onSaveProject={onSaveProject} />);

    const fileInput = screen.getByTestId("axpkg-file-input") as HTMLInputElement;

    // Simulate file upload
    const file = new File([jsonStr], "axiom-project.axpkg.json", {
      type: "application/json",
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("import-diagnostics-banner")).toBeInTheDocument();
    });

    expect(screen.getByText(/Import Success/i)).toBeInTheDocument();
    expect(screen.getByText(/Successfully imported project 'Import Test Shell'/i)).toBeInTheDocument();
    expect(onSaveProject).toHaveBeenCalled();
  });

  it("Failed import displays error diagnostics in the banner", async () => {
    render(<WorkspaceShell />);

    const fileInput = screen.getByTestId("axpkg-file-input") as HTMLInputElement;

    // Upload corrupted/empty JSON
    const file = new File(["{ invalid json }"], "invalid.axpkg.json", {
      type: "application/json",
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("import-diagnostics-banner")).toBeInTheDocument();
    });

    expect(screen.getByText(/Import Failed/i)).toBeInTheDocument();
    expect(screen.getByText(/Failed to parse imported package: Invalid JSON format/i)).toBeInTheDocument();
  });
});
