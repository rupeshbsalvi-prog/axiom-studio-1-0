import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WorkspaceShell } from "../WorkspaceShell";
import { createProjectDraft } from "../../app/projects/projectDraft";
import { createAxpkgEnvelope } from "../../app/projects/axpkg/AxpkgSerializer";
import { serializeAxpkgEnvelope } from "../../app/projects/axpkg/AxpkgExportService";
import { generateDevKeyPair, signAxpkgEnvelope } from "../../app/projects/axpkg/dev/AxpkgDevSigner";

describe("WorkspaceShell Trust & Signature Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("unsigned package opens with warning and UNSIGNED badge", async () => {
    const project = createProjectDraft({ name: "Unsigned UI Test", intent: "Check", targetStudioId: "photo" });
    const envelope = createAxpkgEnvelope(project);
    const jsonStr = serializeAxpkgEnvelope(envelope);

    const onSaveProject = vi.fn();
    render(<WorkspaceShell onSaveProject={onSaveProject} />);

    const fileInput = screen.getByTestId("axpkg-file-input") as HTMLInputElement;
    const file = new File([jsonStr], "unsigned.axpkg.json", { type: "application/json" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("import-diagnostics-banner")).toBeInTheDocument();
    });

    expect(screen.getByText("UNSIGNED")).toBeInTheDocument();
    expect(screen.getByText(/This package does not contain a cryptographic signature/i)).toBeInTheDocument();
    expect(onSaveProject).toHaveBeenCalled();
  });

  it("tampered package fingerprint mismatch blocks import and does not save", async () => {
    const project = createProjectDraft({ name: "Tampered UI Test", intent: "Check", targetStudioId: "photo" });
    const envelope = createAxpkgEnvelope(project);
    envelope.integrity.projectFingerprint = "corrupted-signature-fingerprint";
    const jsonStr = serializeAxpkgEnvelope(envelope);

    const onSaveProject = vi.fn();
    render(<WorkspaceShell onSaveProject={onSaveProject} />);

    const fileInput = screen.getByTestId("axpkg-file-input") as HTMLInputElement;
    const file = new File([jsonStr], "tampered.axpkg.json", { type: "application/json" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("import-diagnostics-banner")).toBeInTheDocument();
    });

    expect(screen.getByText("TAMPERED")).toBeInTheDocument();
    expect(screen.getByText(/Import Failed/i)).toBeInTheDocument();
    expect(onSaveProject).not.toHaveBeenCalled();
  });

  it("untrusted key prompts user and does not replace project until confirmed", async () => {
    const project = createProjectDraft({ name: "Untrusted Key UI Test", intent: "Check", targetStudioId: "photo" });
    const envelope = createAxpkgEnvelope(project);

    const keyPair = await generateDevKeyPair();
    const signedEnvelope = await signAxpkgEnvelope({
      envelope,
      privateKey: keyPair.privateKey,
      keyId: "untrusted-key-id",
    });
    const jsonStr = serializeAxpkgEnvelope(signedEnvelope);

    const onSaveProject = vi.fn();
    render(<WorkspaceShell onSaveProject={onSaveProject} />);

    const fileInput = screen.getByTestId("axpkg-file-input") as HTMLInputElement;
    const file = new File([jsonStr], "untrusted.axpkg.json", { type: "application/json" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("import-diagnostics-banner")).toBeInTheDocument();
    });

    expect(screen.getByText("UNTRUSTED")).toBeInTheDocument();
    expect(screen.getByText(/Open anyway\?/i)).toBeInTheDocument();
    
    // Project should NOT be saved yet
    expect(onSaveProject).not.toHaveBeenCalled();

    // Click confirm open anyway
    const confirmBtn = screen.getByTestId("confirm-untrusted-open-btn");
    fireEvent.click(confirmBtn);

    expect(onSaveProject).toHaveBeenCalledWith(expect.objectContaining({
      manifest: expect.objectContaining({ name: "Untrusted Key UI Test" }),
    }));
  });
});
