import { lazy, type ComponentType, type LazyExoticComponent } from "react";
import type { StudioId } from "../app/studios/registry";
import { STUDIO_RUNTIME_MANIFEST, type StudioRuntimeManifestRecord } from "./StudioRuntimeManifest";

import { type AxiomProjectDraft } from "../app/projects/projectDraft";
import type { ImagineXWorkspaceLearningPolicyState } from "../app/services/ImagineXLearningAuthority";

export type StudioRuntimeModule = {
  initialize(): Promise<void> | void;
  activate(): void;
  deactivate(): void;
  dispose(): void;
};

type StudioModuleLoader = () => Promise<StudioRuntimeModule>;

export type StudioRuntimeEntry = {
  loadModule: StudioModuleLoader;
  Panel: LazyExoticComponent<ComponentType<{
    project?: AxiomProjectDraft | null;
    onUpdateProject?: (project: AxiomProjectDraft) => void;
    workspaceLearningPolicy?: ImagineXWorkspaceLearningPolicyState;
  }>>;
} & StudioRuntimeManifestRecord;

const moduleCache = new Map<StudioId, Promise<StudioRuntimeModule>>();

function cacheModule(id: StudioId, loader: StudioModuleLoader): StudioModuleLoader {
  return () => {
    const cached = moduleCache.get(id);
    if (cached) {
      return cached;
    }

    const next = loader();
    moduleCache.set(id, next);
    return next;
  };
}

type StudioRuntimeAdapter = {
  loadModule: StudioModuleLoader;
  Panel: LazyExoticComponent<ComponentType>;
};

const STUDIO_RUNTIME_ADAPTERS: Record<string, StudioRuntimeAdapter> = {
  "axiom-ai": {
    loadModule: cacheModule("axiom-ai", async () => (await import("../app/studios/ai/AxiomAiStudio")).axiomAiStudio),
    Panel: lazy(async () => ({ default: (await import("../app/studios/ai/AxiomAiPanel")).AxiomAiPanel })),
  },
  "brain-x": {
    loadModule: cacheModule("brain-x", async () => (await import("../app/studios/brain-x/BrainXStudio")).brainXStudio),
    Panel: lazy(async () => ({ default: (await import("../app/studios/brain-x/BrainXPanel")).BrainXPanel })),
  },
  photo: {
    loadModule: cacheModule("photo", async () => (await import("../app/studios/photo/PhotoStudio")).photoStudio),
    Panel: lazy(async () => ({ default: (await import("../app/studios/photo/PhotoPanel")).PhotoPanel })),
  },
  vector: {
    loadModule: cacheModule("vector", async () => (await import("../app/studios/vector/VectorStudio")).vectorStudio),
    Panel: lazy(async () => ({ default: (await import("../app/studios/vector/VectorPanel")).VectorPanel })),
  },
  motion: {
    loadModule: cacheModule("motion", async () => (await import("../app/studios/motion/MotionStudio")).motionStudio),
    Panel: lazy(async () => ({ default: (await import("../app/studios/motion/MotionPanel")).MotionPanel })),
  },
};

export const STUDIO_RUNTIME_REGISTRY: StudioRuntimeEntry[] = STUDIO_RUNTIME_MANIFEST.flatMap((record) => {
  const adapter = STUDIO_RUNTIME_ADAPTERS[record.runtimeKey];
  return adapter ? [{ ...record, ...adapter }] : [];
});

export function getStudioRuntimeEntry(studioId: StudioId): StudioRuntimeEntry | undefined {
  return STUDIO_RUNTIME_REGISTRY.find((entry) => entry.id === studioId);
}
