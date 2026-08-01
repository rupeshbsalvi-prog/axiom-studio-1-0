import { STUDIO_REGISTRY, type StudioId } from "../app/studios/registry";
import rawStudioRuntimeManifest from "./studio-runtime.manifest.json";

export type StudioRuntimeSource = "first-party" | "plugin" | "marketplace";
export type StudioRuntimeAvailability = "implemented" | "planned";

export type StudioRuntimeAuthority = {
  canReadProject: boolean;
  canWriteCanvas: boolean;
  canExport: boolean;
  canUseProviders: boolean;
  requiresApproval: boolean;
};

export type StudioRuntimeManifestRecord = {
  id: StudioId;
  runtimeKey: string;
  source: StudioRuntimeSource;
  status: StudioRuntimeAvailability;
  phase: string;
  capabilities: string[];
  authority: StudioRuntimeAuthority;
  notes: string;
};

const allowedStudioIds = new Set(STUDIO_REGISTRY.map((studio) => studio.id));
const allowedSources = new Set<StudioRuntimeSource>(["first-party", "plugin", "marketplace"]);
const allowedStatuses = new Set<StudioRuntimeAvailability>(["implemented", "planned"]);
const authorityKeys = ["canReadProject", "canWriteCanvas", "canExport", "canUseProviders", "requiresApproval"] as const;

function assertRuntimeAuthority(value: unknown, studioId: StudioId): StudioRuntimeAuthority {
  if (!value || typeof value !== "object") {
    throw new Error(`Studio runtime manifest entry ${studioId} must define authority.`);
  }

  const authority = value as Partial<StudioRuntimeAuthority>;

  authorityKeys.forEach((key) => {
    if (typeof authority[key] !== "boolean") {
      throw new Error(`Studio runtime manifest entry ${studioId} authority.${key} must be boolean.`);
    }
  });

  const validatedAuthority = authority as Record<(typeof authorityKeys)[number], boolean>;

  return {
    canReadProject: validatedAuthority.canReadProject,
    canWriteCanvas: validatedAuthority.canWriteCanvas,
    canExport: validatedAuthority.canExport,
    canUseProviders: validatedAuthority.canUseProviders,
    requiresApproval: validatedAuthority.requiresApproval,
  };
}

function assertRuntimeManifestRecord(value: unknown, index: number): StudioRuntimeManifestRecord {
  if (!value || typeof value !== "object") {
    throw new Error(`Studio runtime manifest entry ${index} must be an object.`);
  }

  const record = value as Partial<StudioRuntimeManifestRecord>;

  if (!record.id || !allowedStudioIds.has(record.id)) {
    throw new Error(`Studio runtime manifest entry ${index} uses an unknown studio id.`);
  }

  if (!record.runtimeKey || typeof record.runtimeKey !== "string") {
    throw new Error(`Studio runtime manifest entry ${record.id} must define a runtimeKey.`);
  }

  if (!record.source || !allowedSources.has(record.source)) {
    throw new Error(`Studio runtime manifest entry ${record.id} must define a valid source.`);
  }

  if (!record.status || !allowedStatuses.has(record.status)) {
    throw new Error(`Studio runtime manifest entry ${record.id} must define a valid status.`);
  }

  if (!record.phase || typeof record.phase !== "string") {
    throw new Error(`Studio runtime manifest entry ${record.id} must define a phase.`);
  }

  if (!Array.isArray(record.capabilities) || record.capabilities.some((capability) => typeof capability !== "string")) {
    throw new Error(`Studio runtime manifest entry ${record.id} must define string capabilities.`);
  }

  const authority = assertRuntimeAuthority(record.authority, record.id);

  if (!record.notes || typeof record.notes !== "string") {
    throw new Error(`Studio runtime manifest entry ${record.id} must define notes.`);
  }

  return {
    id: record.id,
    runtimeKey: record.runtimeKey,
    source: record.source,
    status: record.status,
    phase: record.phase,
    capabilities: record.capabilities,
    authority,
    notes: record.notes,
  };
}

function parseRuntimeManifest(value: unknown): StudioRuntimeManifestRecord[] {
  if (!Array.isArray(value)) {
    throw new Error("Studio runtime manifest must be an array.");
  }

  const seenStudioIds = new Set<StudioId>();
  const records = value.map((entry, index) => {
    const record = assertRuntimeManifestRecord(entry, index);

    if (seenStudioIds.has(record.id)) {
      throw new Error(`Studio runtime manifest declares ${record.id} more than once.`);
    }

    seenStudioIds.add(record.id);
    return record;
  });

  return records;
}

export const STUDIO_RUNTIME_MANIFEST = parseRuntimeManifest(rawStudioRuntimeManifest);

export function getStudioRuntimeManifestRecord(studioId: StudioId): StudioRuntimeManifestRecord | undefined {
  return STUDIO_RUNTIME_MANIFEST.find((record) => record.id === studioId);
}
