import { useEffect, useRef, useState } from "react";
import type { StudioId } from "../app/studios/registry";
import { getStudioRuntimeEntry, type StudioRuntimeEntry, type StudioRuntimeModule } from "./StudioRuntimeRegistry";
import {
  recordWorkspaceAuditEvent,
  createWorkspaceLifecycleEvent,
} from "./WorkspaceAuditService";

export type StudioRuntimeStatus = "fallback" | "loading" | "loaded";

export type ActiveStudioRuntimeRecord = Pick<
  StudioRuntimeEntry,
  "id" | "runtimeKey" | "source" | "status" | "phase" | "capabilities" | "authority" | "notes"
>;

export type StudioRuntimeManifest = {
  studioId: StudioId;
  status: StudioRuntimeStatus;
  hasRuntimeEntry: boolean;
  runtimeRecord: ActiveStudioRuntimeRecord | null;
  loadedStudioIds: StudioId[];
};

function toRuntimeRecord(entry: StudioRuntimeEntry | undefined): ActiveStudioRuntimeRecord | null {
  if (!entry) {
    return null;
  }

  return {
    id: entry.id,
    runtimeKey: entry.runtimeKey,
    source: entry.source,
    status: entry.status,
    phase: entry.phase,
    capabilities: entry.capabilities,
    authority: entry.authority,
    notes: entry.notes,
  };
}

export function useStudioLifecycle(activeStudioId: StudioId): StudioRuntimeManifest {
  const loadedModulesRef = useRef(new Map<StudioId, StudioRuntimeModule>());
  const initializedModulesRef = useRef(new Set<StudioId>());
  const activeStudioRef = useRef<StudioId | null>(null);
  const [manifest, setManifest] = useState<StudioRuntimeManifest>({
    studioId: activeStudioId,
    status: getStudioRuntimeEntry(activeStudioId) ? "loading" : "fallback",
    hasRuntimeEntry: Boolean(getStudioRuntimeEntry(activeStudioId)),
    runtimeRecord: toRuntimeRecord(getStudioRuntimeEntry(activeStudioId)),
    loadedStudioIds: [],
  });

  useEffect(() => {
    let cancelled = false;
    const runtimeEntry = getStudioRuntimeEntry(activeStudioId);
    const loadedStudioIds = Array.from(loadedModulesRef.current.keys());
    setManifest({
      studioId: activeStudioId,
      status: runtimeEntry ? (loadedModulesRef.current.has(activeStudioId) ? "loaded" : "loading") : "fallback",
      hasRuntimeEntry: Boolean(runtimeEntry),
      runtimeRecord: toRuntimeRecord(runtimeEntry),
      loadedStudioIds,
    });

    loadedModulesRef.current.forEach((module, studioId) => {
      if (studioId !== activeStudioId) {
        module.deactivate();
        recordWorkspaceAuditEvent(
          createWorkspaceLifecycleEvent({
            id: `lifecycle_deactivate_${studioId}_${Date.now()}`,
            studioId,
            title: "Studio Deactivated",
            message: `Studio runtime for ${studioId} deactivated.`,
            timestamp: new Date().toISOString(),
          })
        );
      }
    });

    if (!runtimeEntry) {
      activeStudioRef.current = null;
      return () => {
        cancelled = true;
      };
    }

    void runtimeEntry.loadModule().then((module) => {
      if (cancelled) {
        return;
      }

      loadedModulesRef.current.set(activeStudioId, module);

      if (!initializedModulesRef.current.has(activeStudioId)) {
        module.initialize();
        initializedModulesRef.current.add(activeStudioId);
        recordWorkspaceAuditEvent(
          createWorkspaceLifecycleEvent({
            id: `lifecycle_init_${activeStudioId}_${Date.now()}`,
            studioId: activeStudioId,
            title: "Studio Initialized",
            message: `Studio runtime for ${activeStudioId} initialized.`,
            timestamp: new Date().toISOString(),
          })
        );
      }

      if (activeStudioRef.current && activeStudioRef.current !== activeStudioId) {
        const prevId = activeStudioRef.current;
        loadedModulesRef.current.get(prevId)?.deactivate();
        recordWorkspaceAuditEvent(
          createWorkspaceLifecycleEvent({
            id: `lifecycle_deactivate_${prevId}_${Date.now()}`,
            studioId: prevId,
            title: "Studio Deactivated",
            message: `Studio runtime for ${prevId} deactivated.`,
            timestamp: new Date().toISOString(),
          })
        );
      }

      activeStudioRef.current = activeStudioId;
      module.activate();
      recordWorkspaceAuditEvent(
        createWorkspaceLifecycleEvent({
          id: `lifecycle_activate_${activeStudioId}_${Date.now()}`,
          studioId: activeStudioId,
          title: "Studio Activated",
          message: `Studio runtime for ${activeStudioId} activated.`,
          timestamp: new Date().toISOString(),
        })
      );

      setManifest({
        studioId: activeStudioId,
        status: "loaded",
        hasRuntimeEntry: true,
        runtimeRecord: toRuntimeRecord(runtimeEntry),
        loadedStudioIds: Array.from(loadedModulesRef.current.keys()),
      });
    });

    return () => {
      cancelled = true;
    };
  }, [activeStudioId]);

  useEffect(() => {
    return () => {
      loadedModulesRef.current.forEach((module, studioId) => {
        module.deactivate();
        module.dispose();
        recordWorkspaceAuditEvent(
          createWorkspaceLifecycleEvent({
            id: `lifecycle_dispose_${studioId}_${Date.now()}`,
            studioId,
            title: "Studio Disposed",
            message: `Studio runtime for ${studioId} disposed.`,
            timestamp: new Date().toISOString(),
          })
        );
      });
      loadedModulesRef.current.clear();
      initializedModulesRef.current.clear();
      activeStudioRef.current = null;
    };
  }, []);

  return manifest;
}
