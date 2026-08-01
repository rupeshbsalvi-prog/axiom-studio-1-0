/**
 * Phase 28 — Photo Provider Live Request Types
 *
 * Defines the wire payload sent to the first-party gateway.
 * These types describe the SHAPE of data sent to the gateway only.
 *
 * RULES:
 *   - No endpoint URLs, credentials, or secrets appear in these types.
 *   - promptText is length-capped before transmission (see PROMPT_LENGTH_CAP).
 *   - All layer content is metadata-only (label, type, opacity, blendMode).
 *     No raw image bytes, binary content, or base64-encoded data is sent.
 *   - canvasHint carries dimensions only; no pixel data.
 */

/** Maximum prompt character length before truncation. */
export const PROMPT_LENGTH_CAP = 500;

/**
 * Metadata-only layer descriptor sent to the gateway.
 * No pixel data, base64 content, or binary blobs permitted.
 */
export interface PhotoProviderLiveLayerV1 {
  index: number;
  label: string;
  type: string;
  blendMode: string;
  opacity: number;
  /** Always true for Phase 28 adapter boundary. */
  transparentBackgroundRequired: true;
}

/**
 * The request payload sent through the first-party gateway by routeId.
 * This is the boundary-safe representation of the provider job.
 *
 * Constructed by PhotoProviderLiveExecutionService from the approved job record.
 * The gateway resolves the actual target from environment configuration.
 */
export interface PhotoProviderLiveRequestPayload {
  contractVersion: "photo-provider-live-request.v1";
  routeId: "photo.generate.dev";
  /** Truncated to PROMPT_LENGTH_CAP characters. */
  promptText: string;
  canvasHint: {
    width: number;
    height: number;
    aspectRatio: string;
    transparentBackground: boolean;
  };
  layers: PhotoProviderLiveLayerV1[];
  security: {
    dryRunPreview: false;
    noRealProviderCalled: false;
    /** Always "mock-photo-provider" in Phase 28. */
    providerId: "mock-photo-provider";
    secretsIncluded: false;
    endpointUrlIncluded: false;
  };
}

/**
 * The structured response received from the gateway.
 * All fields are metadata-only. No binary image data is permitted.
 */
export interface PhotoProviderLiveResponsePayload {
  contractVersion: "photo-provider-live-response.v1";
  routeId: "photo.generate.dev";
  status: "success" | "error";
  /**
   * Metadata-only output layers. Each layer is a descriptor only;
   * no image bytes, blobs, or data URIs are included in this response.
   * Phase 28: A single metadata layer is returned with a deterministic
   * placeholder source referencing the routeId.
   */
  outputLayers: Array<{
    index: number;
    label: string;
    type: string;
    /** Placeholder source — not a URL, not binary content. */
    source: string;
    width: number;
    height: number;
    opacity: number;
    blendMode: string;
  }>;
  diagnostics: Array<{
    severity: "info" | "warning" | "error";
    code: string;
    message: string;
  }>;
}
