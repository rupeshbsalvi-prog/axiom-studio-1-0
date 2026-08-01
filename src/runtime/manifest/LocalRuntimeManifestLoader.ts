import {
  type SignatureVerificationContext,
  type RuntimeManifest,
} from "./RuntimeManifestTypes";
import { registerRuntimeManifest } from "../RuntimeRegistry";
import {
  recordWorkspaceAuditEvent,
  createRuntimeManifestDiscoveredEvent,
  createRuntimeManifestRejectedEvent,
} from "../../workspace/WorkspaceAuditService";

export interface RuntimeManifestIndex {
  manifests: string[];
}

export async function loadLocalManifests(
  context: SignatureVerificationContext,
  fetchFn: typeof fetch = fetch
): Promise<void> {
  const timestamp = new Date().toISOString();

  let indexData: any;
  try {
    const res = await fetchFn("/runtime-manifests/index.json");
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    indexData = await res.json();
  } catch (error: any) {
    const errorMsg = `Failed to load manifest index: ${error.message}`;
    recordWorkspaceAuditEvent(
      createRuntimeManifestRejectedEvent({
        id: `manifest_index_load_fail_${Date.now()}`,
        title: "Runtime Manifest Index Load Failure",
        message: errorMsg,
        timestamp,
        metadata: { reason: error.message },
      })
    );
    throw new Error(errorMsg);
  }

  // 1. Validate index.manifests
  if (!indexData || typeof indexData !== "object" || !Array.isArray(indexData.manifests)) {
    const errorMsg = "Invalid index format: 'manifests' is missing or not an array.";
    recordWorkspaceAuditEvent(
      createRuntimeManifestRejectedEvent({
        id: `manifest_index_invalid_${Date.now()}`,
        title: "Runtime Manifest Index Invalid",
        message: errorMsg,
        timestamp,
        metadata: { reason: errorMsg },
      })
    );
    throw new Error(errorMsg);
  }

  // Validate and clean paths
  const uniquePaths = new Set<string>();
  for (const path of indexData.manifests) {
    if (typeof path !== "string") {
      const errorMsg = `Invalid manifest path in index: path must be a string. Got '${typeof path}'`;
      recordWorkspaceAuditEvent(
        createRuntimeManifestRejectedEvent({
          id: `manifest_index_path_invalid_${Date.now()}`,
          title: "Runtime Manifest Index Invalid Path",
          message: errorMsg,
          timestamp,
          metadata: { path, reason: errorMsg },
        })
      );
      throw new Error(errorMsg);
    }

    if (!path.startsWith("/runtime-manifests/") || !path.endsWith(".json")) {
      const errorMsg = `Invalid manifest path: '${path}'. Paths must start with '/runtime-manifests/' and end with '.json'.`;
      recordWorkspaceAuditEvent(
        createRuntimeManifestRejectedEvent({
          id: `manifest_index_path_invalid_${Date.now()}`,
          title: "Runtime Manifest Index Invalid Path",
          message: errorMsg,
          timestamp,
          metadata: { path, reason: errorMsg },
        })
      );
      throw new Error(errorMsg);
    }

    if (path.includes("..") || path.includes("\\")) {
      const errorMsg = `Unsafe path traversal detected in manifest path: '${path}'.`;
      recordWorkspaceAuditEvent(
        createRuntimeManifestRejectedEvent({
          id: `manifest_index_path_traversal_${Date.now()}`,
          title: "Runtime Manifest Index Traversal Warning",
          message: errorMsg,
          timestamp,
          metadata: { path, reason: errorMsg },
        })
      );
      throw new Error(errorMsg);
    }

    uniquePaths.add(path);
  }

  // 2. Discover and fetch each manifest
  for (const path of uniquePaths) {
    const discoverTime = new Date().toISOString();
    recordWorkspaceAuditEvent(
      createRuntimeManifestDiscoveredEvent({
        id: `manifest_discover_${path.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}`,
        title: "Runtime Manifest Discovered",
        message: `Discovered manifest at path: '${path}'.`,
        timestamp: discoverTime,
        metadata: { path },
      })
    );

    try {
      const res = await fetchFn(path);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const manifest = await res.json();
      registerRuntimeManifest(manifest, context);
    } catch (error: any) {
      const errorMsg = `Failed to fetch or parse manifest at '${path}': ${error.message}`;
      recordWorkspaceAuditEvent(
        createRuntimeManifestRejectedEvent({
          id: `manifest_load_fail_${path.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}`,
          title: "Runtime Manifest Load Failure",
          message: errorMsg,
          timestamp: new Date().toISOString(),
          metadata: { path, reason: error.message },
        })
      );
    }
  }
}
