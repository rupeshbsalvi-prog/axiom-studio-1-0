/**
 * Phase 28 — PhotoProviderLiveGatewayRegistry Tests
 *
 * Validates the registry allowlist enforcement.
 */

import { describe, it, expect } from "vitest";
import {
  isAllowlistedProvider,
  isAllowlistedRouteId,
  ALLOWLISTED_PROVIDER_ADAPTERS,
  ALLOWLISTED_GATEWAY_ROUTE_IDS,
} from "../PhotoProviderLiveGatewayRegistry";

describe("PhotoProviderLiveGatewayRegistry", () => {
  describe("ALLOWLISTED_PROVIDER_ADAPTERS", () => {
    it("contains only mock-photo-provider in Phase 28", () => {
      expect(ALLOWLISTED_PROVIDER_ADAPTERS.length).toBe(1);
      expect(ALLOWLISTED_PROVIDER_ADAPTERS[0]).toBe("mock-photo-provider");
    });
  });

  describe("ALLOWLISTED_GATEWAY_ROUTE_IDS", () => {
    it("contains only photo.generate.dev in Phase 28", () => {
      expect(ALLOWLISTED_GATEWAY_ROUTE_IDS.length).toBe(1);
      expect(ALLOWLISTED_GATEWAY_ROUTE_IDS[0]).toBe("photo.generate.dev");
    });
  });

  describe("isAllowlistedProvider", () => {
    it("returns true for mock-photo-provider", () => {
      expect(isAllowlistedProvider("mock-photo-provider")).toBe(true);
    });

    it("returns false for any other provider", () => {
      expect(isAllowlistedProvider("external-provider")).toBe(false);
      expect(isAllowlistedProvider("real-photo-api")).toBe(false);
      expect(isAllowlistedProvider("")).toBe(false);
      expect(isAllowlistedProvider("MOCK-PHOTO-PROVIDER")).toBe(false); // case-sensitive
    });
  });

  describe("isAllowlistedRouteId", () => {
    it("returns true for photo.generate.dev", () => {
      expect(isAllowlistedRouteId("photo.generate.dev")).toBe(true);
    });

    it("returns false for any other routeId", () => {
      expect(isAllowlistedRouteId("photo.generate.prod")).toBe(false);
      expect(isAllowlistedRouteId("http://localhost:8000/api/photo/generate")).toBe(false);
      expect(isAllowlistedRouteId("")).toBe(false);
    });

    it("does not allow URL literals to match", () => {
      // Guard: no raw URL can masquerade as a routeId
      expect(isAllowlistedRouteId("http://localhost:8000")).toBe(false);
      expect(isAllowlistedRouteId("https://api.example.com/generate")).toBe(false);
    });
  });
});
