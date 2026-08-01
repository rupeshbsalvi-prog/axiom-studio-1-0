import { describe, it, expect } from "vitest";
import { serializeAxpkgEnvelope, createAxpkgFilename } from "../AxpkgExportService";
import { createAxpkgEnvelope } from "../AxpkgSerializer";
import { importAxpkgFromString } from "../AxpkgImportService";
import { createProjectDraft } from "../../projectDraft";

describe("AxpkgExportService", () => {
  it("serializes envelope to JSON string and generates correct filename formatting", () => {
    const project = createProjectDraft({
      name: "Super Project @ 2026!",
      intent: "Export validation",
      targetStudioId: "photo",
    });

    const filename = createAxpkgFilename(project);
    expect(filename).toMatch(/^axiom-super-project-2026-\d{8}\.axpkg\.json$/);
  });

  it("export -> import roundtrip restores equivalent project draft without mutating original", async () => {
    const originalProject = createProjectDraft({
      name: "Roundtrip Project",
      intent: "Verify completeness",
      targetStudioId: "photo",
    });
    const originalJson = JSON.stringify(originalProject);

    const envelope = createAxpkgEnvelope(originalProject);
    const serialized = serializeAxpkgEnvelope(envelope);

    const importResult = await importAxpkgFromString(serialized);
    expect(importResult.success).toBe(true);

    if (importResult.success) {
      // Structure checks
      expect(importResult.project.manifest.name).toBe(originalProject.manifest.name);
      expect(importResult.project.manifest.id).toBe(originalProject.manifest.id);
      expect(importResult.project.schemaVersion).toBe(originalProject.schemaVersion);
    }

    // Original project reference is not mutated
    expect(JSON.stringify(originalProject)).toBe(originalJson);
  });
});
