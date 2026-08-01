import { afterEach, describe, expect, it, vi } from "vitest";
import {
  establishConfiguredPhotoGatewaySession,
  establishPhotoGatewaySession,
} from "../PhotoProviderGatewaySessionService";

describe("PhotoProviderGatewaySessionService", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("resolves the configured gateway without exposing the token in its URL", async () => {
    vi.stubEnv("VITE_PHOTO_DEV_GATEWAY", "http://127.0.0.1:8000/api/photo/provider-gateway");
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await establishConfiguredPhotoGatewaySession("bootstrap-token");

    expect(result.success).toBe(true);
    expect(fetchSpy.mock.calls[0][0]).not.toContain("bootstrap-token");
  });

  it("exchanges a bootstrap token for an HttpOnly server session", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await establishPhotoGatewaySession({
      gatewayUrl: "http://127.0.0.1:8000/api/photo/provider-gateway",
      accessToken: "bootstrap-token",
    });

    expect(result.success).toBe(true);
    expect(fetchSpy).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/photo/provider-session",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: { Authorization: "Bearer bootstrap-token" },
      })
    );
  });

  it("fails closed for an invalid gateway URL", async () => {
    const result = await establishPhotoGatewaySession({ gatewayUrl: "not-a-url", accessToken: "token" });
    expect(result.success).toBe(false);
    expect(result.code).toBe("gateway_session_url_invalid");
  });
});
