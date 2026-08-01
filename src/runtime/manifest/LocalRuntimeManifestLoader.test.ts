import { describe, it, expect, beforeEach } from "vitest";
import { loadLocalManifests } from "./LocalRuntimeManifestLoader";
import { getRegisteredManifests, clearRuntimeRegistry, getRegistryEntry } from "../RuntimeRegistry";
import { getWorkspaceAuditEvents, clearWorkspaceAuditEvents } from "../../workspace/WorkspaceAuditService";

describe("LocalRuntimeManifestLoader", () => {
  beforeEach(() => {
    clearRuntimeRegistry();
    clearWorkspaceAuditEvents();
  });

  const createMockFetch = (responses: Record<string, { ok: boolean; status: number; body?: any }>) => {
    return async (input: RequestInfo | URL): Promise<Response> => {
      const url = typeof input === "string" ? input : ((input as any).url || input.toString());
      const resp = responses[url];
      if (!resp) {
        return {
          ok: false,
          status: 404,
          json: async () => ({ error: "Not found" }),
        } as unknown as Response;
      }
      return {
        ok: resp.ok,
        status: resp.status,
        json: async () => resp.body || {},
      } as unknown as Response;
    };
  };

  it("should successfully fetch index and register valid manifests", async () => {
    const mockResponses = {
      "/runtime-manifests/index.json": {
        ok: true,
        status: 200,
        body: {
          manifests: [
            "/runtime-manifests/studio-a.json",
            "/runtime-manifests/studio-b.json",
          ],
        },
      },
      "/runtime-manifests/studio-a.json": {
        ok: true,
        status: 200,
        body: {
          manifestVersion: "1.0",
          id: "studio-a",
          name: "Studio A",
          version: "1.0.0",
          publisher: "Axiom",
          runtimeType: "studio",
          entry: { moduleUrl: "/runtime-modules/studio-a.js", signatureMode: "development" },
          capabilities: ["readProject"],
          compatibility: { axiomVersion: "1.0", apiVersion: "1" },
        },
      },
      "/runtime-manifests/studio-b.json": {
        ok: true,
        status: 200,
        body: {
          manifestVersion: "1.0",
          id: "studio-b",
          name: "Studio B",
          version: "1.0.0",
          publisher: "Axiom",
          runtimeType: "studio",
          entry: { moduleUrl: "/runtime-modules/studio-b.js", signatureMode: "development" },
          capabilities: ["writeProject"],
          compatibility: { axiomVersion: "1.0", apiVersion: "1" },
        },
      },
    };

    const mockFetch = createMockFetch(mockResponses);
    await loadLocalManifests({ isDevelopment: true }, mockFetch);

    const registered = getRegisteredManifests();
    expect(registered).toHaveLength(2);
    expect(getRegistryEntry("studio-a")?.status).toBe("registered");
    expect(getRegistryEntry("studio-b")?.status).toBe("registered");

    const logs = getWorkspaceAuditEvents();
    // 2 discovered, 2 validated, 2 registered = 6 total events
    expect(logs.filter((l) => l.type === "runtime_manifest_discovered")).toHaveLength(2);
    expect(logs.filter((l) => l.type === "runtime_manifest_registered")).toHaveLength(2);
  });

  it("should fail and record audit event when index cannot be loaded", async () => {
    const mockFetch = createMockFetch({}); // 404 for index
    await expect(loadLocalManifests({ isDevelopment: true }, mockFetch)).rejects.toThrow(
      "Failed to load manifest index"
    );

    const logs = getWorkspaceAuditEvents();
    expect(logs.some((l) => l.type === "runtime_manifest_rejected")).toBe(true);
    expect(getRegisteredManifests()).toHaveLength(0);
  });

  it("should fail when index format is invalid", async () => {
    const mockResponses = {
      "/runtime-manifests/index.json": {
        ok: true,
        status: 200,
        body: {
          // missing manifests array
          foo: "bar",
        },
      },
    };

    const mockFetch = createMockFetch(mockResponses);
    await expect(loadLocalManifests({ isDevelopment: true }, mockFetch)).rejects.toThrow(
      "Invalid index format"
    );

    const logs = getWorkspaceAuditEvents();
    expect(logs.some((l) => l.type === "runtime_manifest_rejected")).toBe(true);
  });

  it("should reject manifest paths not starting with /runtime-manifests/ or traversal path", async () => {
    const mockResponses = {
      "/runtime-manifests/index.json": {
        ok: true,
        status: 200,
        body: {
          manifests: [
            "/unsafe/studio-a.json", // bad prefix
          ],
        },
      },
    };

    const mockFetch = createMockFetch(mockResponses);
    await expect(loadLocalManifests({ isDevelopment: true }, mockFetch)).rejects.toThrow(
      "Invalid manifest path"
    );
  });

  it("should handle partial failures where one manifest fails to fetch but others succeed", async () => {
    const mockResponses = {
      "/runtime-manifests/index.json": {
        ok: true,
        status: 200,
        body: {
          manifests: [
            "/runtime-manifests/studio-valid.json",
            "/runtime-manifests/studio-missing.json",
          ],
        },
      },
      "/runtime-manifests/studio-valid.json": {
        ok: true,
        status: 200,
        body: {
          manifestVersion: "1.0",
          id: "studio-valid",
          name: "Valid Studio",
          version: "1.0.0",
          publisher: "Axiom",
          runtimeType: "studio",
          entry: { moduleUrl: "/runtime-modules/valid.js", signatureMode: "development" },
          capabilities: ["readProject"],
          compatibility: { axiomVersion: "1.0", apiVersion: "1" },
        },
      },
      // studio-missing.json is not mocked -> returns 404
    };

    const mockFetch = createMockFetch(mockResponses);
    await loadLocalManifests({ isDevelopment: true }, mockFetch);

    // Register count should be 1
    expect(getRegisteredManifests()).toHaveLength(1);
    expect(getRegistryEntry("studio-valid")?.status).toBe("registered");

    const logs = getWorkspaceAuditEvents();
    expect(logs.some((l) => l.type === "runtime_manifest_rejected" && l.message?.includes("Failed to fetch"))).toBe(true);
  });
});
