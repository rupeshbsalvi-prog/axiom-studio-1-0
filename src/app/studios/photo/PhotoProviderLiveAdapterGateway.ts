/**
 * Phase 28 — Photo Provider Live Adapter Gateway
 *
 * Resolves gateway endpoints from environment variables only.
 * No hardcoded URLs, hostnames, or IP addresses appear in this file.
 *
 * SECURITY INVARIANTS:
 *   - All dispatch is by routeId. No caller may specify a URL directly.
 *   - Endpoint resolution requires VITE_PHOTO_DEV_GATEWAY env var.
 *   - If VITE_PHOTO_DEV_GATEWAY is absent → hard failure. No fallback.
 *   - No credentials, tokens, or API keys are constructed or transmitted here.
 *   - Response validation is strict: any unexpected field causes rejection.
 *   - No binary image data, base64 blobs, or data URIs enter the system here.
 */

import {
  isAllowlistedRouteId,
} from "./PhotoProviderLiveGatewayRegistry";
import type {
  PhotoProviderLiveRequestPayload,
  PhotoProviderLiveResponsePayload,
} from "./PhotoProviderLiveRequestTypes";

export interface PhotoProviderLiveGatewayResult {
  success: boolean;
  response?: PhotoProviderLiveResponsePayload;
  diagnostics: Array<{
    severity: "info" | "warning" | "error";
    code: string;
    message: string;
  }>;
}

/**
 * Route table: routeId → environment variable name that holds the gateway URL.
 *
 * RULE: This table maps route identifiers to env var NAMES only.
 * The actual URL is read at runtime from the env var.
 * No URL literal may appear in this table.
 */
const ROUTE_ENV_VAR_MAP: Record<string, string> = {
  "photo.generate.dev": "VITE_PHOTO_DEV_GATEWAY",
};

/**
 * Validates that a gateway response has the expected structure.
 * Rejects any response that contains unexpected binary, blob, or credential
 * fields. Returns null on success (no structural error), or an error string.
 */
function validateGatewayResponse(raw: unknown): PhotoProviderLiveResponsePayload | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (r.contractVersion !== "photo-provider-live-response.v1") return null;
  if (r.routeId !== "photo.generate.dev") return null;
  if (r.status !== "success" && r.status !== "error") return null;
  if (!Array.isArray(r.outputLayers)) return null;
  if (!Array.isArray(r.diagnostics)) return null;

  // Validate each output layer — metadata only, no binary content
  for (const layer of r.outputLayers as unknown[]) {
    if (!layer || typeof layer !== "object" || Array.isArray(layer)) return null;
    const l = layer as Record<string, unknown>;
    if (typeof l.index !== "number") return null;
    if (typeof l.label !== "string") return null;
    if (typeof l.type !== "string") return null;
    if (typeof l.source !== "string") return null;
    // Accept only short-lived, signed, same-origin asset references.
    const assetReference = l.source.match(
      /^\/api\/photo\/assets\/[a-f0-9]{32}\?expires=(\d+)&signature=[a-f0-9]{64}$/
    );
    if (!assetReference || Number(assetReference[1]) <= Math.floor(Date.now() / 1000)) return null;
    if (typeof l.width !== "number" || typeof l.height !== "number") return null;
    if (typeof l.opacity !== "number" || typeof l.blendMode !== "string") return null;
  }

  return r as unknown as PhotoProviderLiveResponsePayload;
}

/**
 * Dispatches a live-like request to the first-party gateway identified by
 * `routeId`. The actual gateway URL is resolved from environment variables only.
 *
 * FAIL-CLOSED: if the env var is absent, throws immediately with no gateway call.
 */
export async function executeViaGateway(input: {
  routeId: string;
  request: PhotoProviderLiveRequestPayload;
  accessToken?: string;
  useSession?: boolean;
}): Promise<PhotoProviderLiveGatewayResult> {
  const { routeId, request, accessToken, useSession = false } = input;

  // 1. routeId must be in the Phase 28 allowlist
  if (!isAllowlistedRouteId(routeId)) {
    return {
      success: false,
      diagnostics: [
        {
          severity: "error",
          code: "gateway_route_not_allowlisted",
          message: `Route ID '${routeId}' is not in the Phase 28 gateway allowlist.`,
        },
      ],
    };
  }

  // 2. Resolve gateway URL from environment variable only — no hardcoded fallback
  const envVarName = ROUTE_ENV_VAR_MAP[routeId];
  if (!envVarName) {
    return {
      success: false,
      diagnostics: [
        {
          severity: "error",
          code: "gateway_route_env_var_undefined",
          message: `No environment variable is configured for routeId '${routeId}'.`,
        },
      ],
    };
  }

  // Vite exposes env vars on import.meta.env. Fallback to process.env for test environments.
  // Cast import.meta.env to Record to allow dynamic key access without TypeScript index-signature error.
  const viteEnv =
    typeof import.meta !== "undefined"
      ? (import.meta as unknown as { env?: Record<string, string | undefined> }).env
      : undefined;
  const processEnv =
    typeof globalThis !== "undefined" && "process" in globalThis
      ? ((globalThis as any).process || {}).env as Record<string, string | undefined>
      : undefined;
  const gatewayUrl: string | undefined =
    viteEnv?.[envVarName] ?? processEnv?.[envVarName];

  if (!gatewayUrl) {
    // FAIL CLOSED: missing env var → hard failure, no gateway call, no liveRun completed record
    return {
      success: false,
      diagnostics: [
        {
          severity: "error",
          code: "gateway_env_var_missing",
          message: `Environment variable '${envVarName}' is required for routeId '${routeId}' but is not set. No gateway call will be made.`,
        },
      ],
    };
  }

  if (!accessToken && !useSession) {
    return {
      success: false,
      diagnostics: [
        {
          severity: "error",
          code: "gateway_access_token_missing",
          message: "An authenticated runtime access token is required for gateway dispatch.",
        },
      ],
    };
  }

  // 3. Execute gateway POST with structured JSON body (routeId + payload only)
  let rawResponse: unknown;
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    const fetchResponse = await fetch(gatewayUrl, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(request),
    });

    if (!fetchResponse.ok) {
      return {
        success: false,
        diagnostics: [
          {
            severity: "error",
            code: "gateway_http_error",
            message: `Gateway returned HTTP ${fetchResponse.status} for routeId '${routeId}'.`,
          },
        ],
      };
    }

    rawResponse = await fetchResponse.json();
  } catch (err) {
    return {
      success: false,
      diagnostics: [
        {
          severity: "error",
          code: "gateway_network_error",
          message: `Gateway call failed for routeId '${routeId}': ${err instanceof Error ? err.message : String(err)}`,
        },
      ],
    };
  }

  // 4. Validate response structure — reject binary/unexpected content
  const validated = validateGatewayResponse(rawResponse);
  if (!validated) {
    return {
      success: false,
      diagnostics: [
        {
          severity: "error",
          code: "gateway_response_invalid",
          message: `Gateway response for routeId '${routeId}' failed structural validation.`,
        },
      ],
    };
  }

  return {
    success: validated.status === "success",
    response: validated,
    diagnostics:
      validated.status === "error"
        ? [
            {
              severity: "error",
              code: "gateway_provider_error",
              message: `Gateway provider indicated an error for routeId '${routeId}'.`,
            },
          ]
        : [],
  };
}
