/**
 * Phase 28 — PhotoProviderLiveAdapterGateway Tests
 *
 * Tests gateway dispatch behavior: fail-closed on missing env var, routeId
 * allowlist enforcement, response validation, and successful dispatch.
 *
 * fetch is mocked — no real network calls are made in any test.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { executeViaGateway } from "../PhotoProviderLiveAdapterGateway";
import type { PhotoProviderLiveRequestPayload } from "../PhotoProviderLiveRequestTypes";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeValidRequest = (): PhotoProviderLiveRequestPayload => ({
  contractVersion: "photo-provider-live-request.v1",
  routeId: "photo.generate.dev",
  promptText: "generate a test image",
  canvasHint: {
    width: 1024,
    height: 1024,
    aspectRatio: "1:1",
    transparentBackground: true,
  },
  layers: [],
  security: {
    dryRunPreview: false,
    noRealProviderCalled: false,
    providerId: "mock-photo-provider",
    secretsIncluded: false,
    endpointUrlIncluded: false,
  },
});

const makeValidGatewayResponse = () => ({
  contractVersion: "photo-provider-live-response.v1",
  routeId: "photo.generate.dev",
  status: "success",
  outputLayers: [
    {
      index: 0,
      label: "generated-layer",
      type: "image",
      source: "/api/photo/assets/0123456789abcdef0123456789abcdef?expires=1999999999&signature=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      width: 1024,
      height: 1024,
      opacity: 1,
      blendMode: "normal",
    },
  ],
  diagnostics: [],
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("PhotoProviderLiveAdapterGateway", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubGlobal("fetch", undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe("fail-closed on missing env var", () => {
    it("returns failure when VITE_PHOTO_DEV_GATEWAY is not set", async () => {
      // env var not set
      const result = await executeViaGateway({
        routeId: "photo.generate.dev",
        request: makeValidRequest(),
        accessToken: "user-session-token",
      });
      expect(result.success).toBe(false);
      expect(result.diagnostics.some((d) => d.code === "gateway_env_var_missing")).toBe(true);
    });

    it("does NOT call fetch when env var is missing", async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);

      await executeViaGateway({
        routeId: "photo.generate.dev",
        request: makeValidRequest(),
        accessToken: "user-session-token",
      });

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe("routeId allowlist enforcement", () => {
    it("rejects a routeId not in the allowlist", async () => {
      const result = await executeViaGateway({
        routeId: "photo.generate.prod" as any,
        request: makeValidRequest() as any,
        accessToken: "user-session-token",
      });
      expect(result.success).toBe(false);
      expect(result.diagnostics.some((d) => d.code === "gateway_route_not_allowlisted")).toBe(true);
    });

    it("does NOT call fetch for non-allowlisted routeId", async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);

      await executeViaGateway({
        routeId: "http://localhost:8000/api" as any,
        request: makeValidRequest() as any,
        accessToken: "user-session-token",
      });
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe("successful dispatch with mocked fetch", () => {
    it("returns success and validated response", async () => {
      vi.stubEnv("VITE_PHOTO_DEV_GATEWAY", "http://test-gateway.local/dispatch");

      const gatewayResponse = makeValidGatewayResponse();
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValueOnce({
          ok: true,
          json: async () => gatewayResponse,
        })
      );

      const result = await executeViaGateway({
        routeId: "photo.generate.dev",
        request: makeValidRequest(),
        accessToken: "user-session-token",
      });

      expect(result.success).toBe(true);
      expect(result.response?.outputLayers.length).toBe(1);
      expect(result.diagnostics.length).toBe(0);
    });

    it("sends POST request with correct Content-Type", async () => {
      vi.stubEnv("VITE_PHOTO_DEV_GATEWAY", "http://test-gateway.local/dispatch");

      const fetchSpy = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => makeValidGatewayResponse(),
      });
      vi.stubGlobal("fetch", fetchSpy);

      await executeViaGateway({
        routeId: "photo.generate.dev",
        request: makeValidRequest(),
        accessToken: "user-session-token",
      });

      expect(fetchSpy).toHaveBeenCalledOnce();
      const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(options.method).toBe("POST");
      expect((options.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
    });

    it("does NOT include endpoint URL literal in the request body", async () => {
      vi.stubEnv("VITE_PHOTO_DEV_GATEWAY", "http://test-gateway.local/dispatch");

      const fetchSpy = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => makeValidGatewayResponse(),
      });
      vi.stubGlobal("fetch", fetchSpy);

      await executeViaGateway({
        routeId: "photo.generate.dev",
        request: makeValidRequest(),
        accessToken: "user-session-token",
      });

      const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
      const body = JSON.parse(options.body as string);
      expect(body.security.endpointUrlIncluded).toBe(false);
      expect(body.security.secretsIncluded).toBe(false);
      // No URL literals should appear in the body
      const bodyStr = JSON.stringify(body);
      expect(bodyStr).not.toContain("http://test-gateway.local");
      expect(bodyStr).not.toContain("localhost");
    });
  });

  describe("response validation", () => {
    it("rejects an expired signed asset reference", async () => {
      vi.stubEnv("VITE_PHOTO_DEV_GATEWAY", "http://test-gateway.local/dispatch");
      const expired = makeValidGatewayResponse();
      expired.outputLayers[0].source = "/api/photo/assets/0123456789abcdef0123456789abcdef?expires=1&signature=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
      vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: true, json: async () => expired }));

      const result = await executeViaGateway({
        routeId: "photo.generate.dev",
        request: makeValidRequest(),
        accessToken: "user-session-token",
      });

      expect(result.success).toBe(false);
      expect(result.diagnostics.some((d) => d.code === "gateway_response_invalid")).toBe(true);
    });

    it("rejects response with data: URI in source field", async () => {
      vi.stubEnv("VITE_PHOTO_DEV_GATEWAY", "http://test-gateway.local/dispatch");

      const badResponse = {
        ...makeValidGatewayResponse(),
        outputLayers: [
          {
            index: 0,
            label: "image",
            type: "image",
            source: "data:image/png;base64,ABC123", // VIOLATION: data URI
            width: 1024,
            height: 1024,
            opacity: 1,
            blendMode: "normal",
          },
        ],
      };

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValueOnce({
          ok: true,
          json: async () => badResponse,
        })
      );

      const result = await executeViaGateway({
        routeId: "photo.generate.dev",
        request: makeValidRequest(),
        accessToken: "user-session-token",
      });

      expect(result.success).toBe(false);
      expect(result.diagnostics.some((d) => d.code === "gateway_response_invalid")).toBe(true);
    });

    it("rejects response with wrong contractVersion", async () => {
      vi.stubEnv("VITE_PHOTO_DEV_GATEWAY", "http://test-gateway.local/dispatch");

      const badResponse = { ...makeValidGatewayResponse(), contractVersion: "wrong.v1" };
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValueOnce({ ok: true, json: async () => badResponse })
      );

      const result = await executeViaGateway({
        routeId: "photo.generate.dev",
        request: makeValidRequest(),
        accessToken: "user-session-token",
      });
      expect(result.success).toBe(false);
      expect(result.diagnostics.some((d) => d.code === "gateway_response_invalid")).toBe(true);
    });
  });

  describe("HTTP error handling", () => {
    it("returns failure on HTTP 500", async () => {
      vi.stubEnv("VITE_PHOTO_DEV_GATEWAY", "http://test-gateway.local/dispatch");

      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValueOnce({ ok: false, status: 500 })
      );

      const result = await executeViaGateway({
        routeId: "photo.generate.dev",
        request: makeValidRequest(),
        accessToken: "user-session-token",
      });
      expect(result.success).toBe(false);
      expect(result.diagnostics.some((d) => d.code === "gateway_http_error")).toBe(true);
    });

    it("returns failure on network error (fetch throws)", async () => {
      vi.stubEnv("VITE_PHOTO_DEV_GATEWAY", "http://test-gateway.local/dispatch");

      vi.stubGlobal("fetch", vi.fn().mockRejectedValueOnce(new Error("Network failure")));

      const result = await executeViaGateway({
        routeId: "photo.generate.dev",
        request: makeValidRequest(),
        accessToken: "user-session-token",
      });
      expect(result.success).toBe(false);
      expect(result.diagnostics.some((d) => d.code === "gateway_network_error")).toBe(true);
    });
  });

  describe("request authentication", () => {
    it("dispatches through an established HttpOnly session without an Authorization header", async () => {
      vi.stubEnv("VITE_PHOTO_DEV_GATEWAY", "http://test-gateway.local/dispatch");
      const fetchSpy = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => makeValidGatewayResponse() });
      vi.stubGlobal("fetch", fetchSpy);

      const result = await executeViaGateway({
        routeId: "photo.generate.dev",
        request: makeValidRequest(),
        useSession: true,
      });

      expect(result.success).toBe(true);
      const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(options.credentials).toBe("include");
      expect((options.headers as Record<string, string>).Authorization).toBeUndefined();
    });

    it("fails closed without a runtime access token", async () => {
      vi.stubEnv("VITE_PHOTO_DEV_GATEWAY", "http://test-gateway.local/dispatch");
      const fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);

      const result = await executeViaGateway({
        routeId: "photo.generate.dev",
        request: makeValidRequest(),
      });

      expect(result.success).toBe(false);
      expect(result.diagnostics.some((d) => d.code === "gateway_access_token_missing")).toBe(true);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("sends the runtime token as a bearer credential", async () => {
      vi.stubEnv("VITE_PHOTO_DEV_GATEWAY", "http://test-gateway.local/dispatch");
      const fetchSpy = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => makeValidGatewayResponse() });
      vi.stubGlobal("fetch", fetchSpy);

      await executeViaGateway({
        routeId: "photo.generate.dev",
        request: makeValidRequest(),
        accessToken: "user-session-token",
      });

      const [, options] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect((options.headers as Record<string, string>).Authorization).toBe("Bearer user-session-token");
      expect(options.body).not.toContain("user-session-token");
    });
  });
});
