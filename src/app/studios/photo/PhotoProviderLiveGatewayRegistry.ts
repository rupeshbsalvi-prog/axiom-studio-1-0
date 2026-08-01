/**
 * Phase 28 — Photo Provider Live Gateway Registry
 *
 * Allowlist of provider adapter routeIds approved for live-like boundary
 * execution in Phase 28. All routeIds are first-party gateway route
 * identifiers. No endpoint URLs, hostnames, or credentials appear here.
 *
 * RULES:
 *   - Only routeIds listed here may be dispatched via PhotoProviderLiveAdapterGateway.
 *   - Only "mock-photo-provider" is approved for Phase 28.
 *   - No external provider routeIds may be added without a new phase lock.
 *   - No HTTP literal, localhost reference, or IP address may appear in this file.
 */

export const ALLOWLISTED_PROVIDER_ADAPTERS = [
  "mock-photo-provider",
] as const;

export type AllowlistedProviderAdapterId =
  (typeof ALLOWLISTED_PROVIDER_ADAPTERS)[number];

/**
 * Allowlisted gateway routeIds for Phase 28.
 * Each routeId maps to a first-party internal route, resolved at runtime
 * by PhotoProviderLiveAdapterGateway from environment configuration only.
 */
export const ALLOWLISTED_GATEWAY_ROUTE_IDS = [
  "photo.generate.dev",
] as const;

export type AllowlistedGatewayRouteId =
  (typeof ALLOWLISTED_GATEWAY_ROUTE_IDS)[number];

/**
 * Returns true if the given providerId is in the Phase 28 allowlist.
 */
export function isAllowlistedProvider(
  providerId: string
): providerId is AllowlistedProviderAdapterId {
  return (ALLOWLISTED_PROVIDER_ADAPTERS as readonly string[]).includes(providerId);
}

/**
 * Returns true if the given routeId is in the Phase 28 gateway allowlist.
 */
export function isAllowlistedRouteId(
  routeId: string
): routeId is AllowlistedGatewayRouteId {
  return (ALLOWLISTED_GATEWAY_ROUTE_IDS as readonly string[]).includes(routeId);
}
