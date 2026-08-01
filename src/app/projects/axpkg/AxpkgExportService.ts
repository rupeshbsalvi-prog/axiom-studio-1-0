import type { AxiomProjectDraft } from "../projectDraft";
import type { AxiomPackageEnvelope } from "./AxpkgTypes";

export function serializeAxpkgEnvelope(envelope: AxiomPackageEnvelope): string {
  return JSON.stringify(envelope, null, 2);
}

export function createAxpkgFilename(project: AxiomProjectDraft): string {
  const sanitizedName = project.manifest.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const timestamp = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");

  return `axiom-${sanitizedName || "untitled"}-${timestamp}.axpkg.json`;
}
