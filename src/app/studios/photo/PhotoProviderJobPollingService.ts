/**
 * Phase 29 — Photo Provider Job Polling Service
 *
 * Stateless polling service for async provider jobs.
 * Calls GET /api/photo/provider-jobs/{jobId} on a fixed interval.
 *
 * SECURITY INVARIANTS:
 *   - No binary data, credentials, endpoint URLs, or raw provider output stored.
 *   - assetRef is a signed relative path only (/api/photo/assets/... with expires + signature).
 *   - Polling timeout (120s) stops UI polling ONLY — does NOT cancel the backend job.
 *   - On timeout: UI displays "Job still running. Refresh or check status later."
 *   - retryCount is transient state only — never written to liveRuns or project draft.
 *   - diagnostics contain only severity/code/message — no credentials or provider details.
 */

const POLL_INTERVAL_MS = 2000; // 2 seconds
const MAX_POLL_COUNT = 60; // 60 × 2s = 120s max

export type PhotoProviderJobLifecycleStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export interface PhotoProviderJobDiagnostic {
  severity: "info" | "warning" | "error";
  code: string;
  message: string;
}

/**
 * Transient job status — UI state only.
 * Must NOT be written to project.photoProvider.liveRuns or project draft.
 * retryCount is backend-only provenance — displayed in UI but never persisted.
 */
export interface PhotoProviderJobStatus {
  jobId: string;
  status: PhotoProviderJobLifecycleStatus;
  /** Present only when status === "completed". Signed path — never binary/base64/raw URL. */
  assetRef?: string;
  /** Transient only — not stored in liveRuns or AXPKG. */
  retryCount: number;
  /** Redacted — severity/code/message only. No credentials or endpoint details. */
  diagnostics: PhotoProviderJobDiagnostic[];
  createdAt: string;
  updatedAt: string;
}

export type JobUpdateCallback = (status: PhotoProviderJobStatus) => void;
export type JobTerminalCallback = (
  status: PhotoProviderJobStatus,
  timedOut: boolean
) => void;

interface ActivePoll {
  intervalHandle: ReturnType<typeof setInterval>;
  pollCount: number;
}

const _activePolls = new Map<string, ActivePoll>();

/**
 * Starts polling for jobId. Calls onUpdate on every poll result.
 * Calls onTerminal when status reaches a terminal state or the 120s limit.
 *
 * On timeout: onTerminal is called with timedOut=true.
 *   - The backend job is NOT cancelled.
 *   - The UI should show "Job still running. Refresh or check status later."
 *
 * Session authentication is handled by the cookie (credentials: "include").
 */
export function startPolling(
  jobId: string,
  onUpdate: JobUpdateCallback,
  onTerminal: JobTerminalCallback
): void {
  if (_activePolls.has(jobId)) {
    return; // already polling
  }

  const poll: ActivePoll = {
    intervalHandle: undefined as any,
    pollCount: 0,
  };

  const tick = async () => {
    poll.pollCount += 1;

    // Timeout check before making the request
    if (poll.pollCount > MAX_POLL_COUNT) {
      _clearPoll(jobId);
      // IMPORTANT: no backend cancel call. Backend job continues.
      const timeoutStatus: PhotoProviderJobStatus = {
        jobId,
        status: "processing", // last known active state
        retryCount: 0,
        diagnostics: [
          {
            severity: "info",
            code: "polling_timeout",
            message: "Job still running. Refresh or check status later.",
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onTerminal(timeoutStatus, true);
      return;
    }

    try {
      const response = await fetch(`/api/photo/provider-jobs/${jobId}`, {
        method: "GET",
        credentials: "include", // session cookie auth
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        const errorStatus: PhotoProviderJobStatus = {
          jobId,
          status: "failed",
          retryCount: 0,
          diagnostics: [
            {
              severity: "error",
              code: "poll_http_error",
              message: `Poll request returned HTTP ${response.status}.`,
            },
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        _clearPoll(jobId);
        onTerminal(errorStatus, false);
        return;
      }

      const raw = await response.json();
      const jobStatus = _parseJobStatus(raw);

      onUpdate(jobStatus);

      if (_isTerminal(jobStatus.status)) {
        _clearPoll(jobId);
        onTerminal(jobStatus, false);
      }
    } catch {
      // Network error — continue polling (counted toward limit)
    }
  };

  poll.intervalHandle = setInterval(tick, POLL_INTERVAL_MS);
  _activePolls.set(jobId, poll);

  // Fire immediately on start
  tick();
}

/**
 * Stops polling for jobId. Safe to call if not polling.
 */
export function stopPolling(jobId: string): void {
  _clearPoll(jobId);
}

/**
 * Returns true if this service is currently polling for jobId.
 */
export function isPolling(jobId: string): boolean {
  return _activePolls.has(jobId);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function _clearPoll(jobId: string): void {
  const poll = _activePolls.get(jobId);
  if (poll) {
    clearInterval(poll.intervalHandle);
    _activePolls.delete(jobId);
  }
}

function _isTerminal(status: PhotoProviderJobLifecycleStatus): boolean {
  return status === "completed" || status === "failed" || status === "cancelled";
}

function _parseJobStatus(raw: unknown): PhotoProviderJobStatus {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return _errorStatus("poll_parse_error", "Unexpected job status response format.");
  }
  const r = raw as Record<string, unknown>;

  const jobId = typeof r.jobId === "string" ? r.jobId : "unknown";
  const status: PhotoProviderJobLifecycleStatus =
    _isValidStatus(r.status) ? r.status : "failed";
  const retryCount = typeof r.retryCount === "number" ? r.retryCount : 0;
  const createdAt = typeof r.createdAt === "string" ? r.createdAt : new Date().toISOString();
  const updatedAt = typeof r.updatedAt === "string" ? r.updatedAt : new Date().toISOString();

  // assetRef: only accept relative /api/photo/assets/... paths with expires + signature
  let assetRef: string | undefined;
  if (status === "completed" && typeof r.assetRef === "string") {
    const ref = r.assetRef;
    if (
      ref.startsWith("/api/photo/assets/") &&
      ref.includes("expires=") &&
      ref.includes("signature=") &&
      !ref.includes("http://") &&
      !ref.includes("https://") &&
      !ref.includes("base64")
    ) {
      assetRef = ref;
    }
  }

  const diagnostics: PhotoProviderJobDiagnostic[] = Array.isArray(r.diagnostics)
    ? (r.diagnostics as unknown[])
        .filter(
          (d): d is Record<string, unknown> =>
            !!d && typeof d === "object" && !Array.isArray(d)
        )
        .map((d) => ({
          severity: _isValidSeverity(d.severity) ? d.severity : "error",
          code: typeof d.code === "string" ? d.code : "unknown",
          message: typeof d.message === "string" ? d.message : "",
        }))
    : [];

  return { jobId, status, assetRef, retryCount, diagnostics, createdAt, updatedAt };
}

function _isValidStatus(v: unknown): v is PhotoProviderJobLifecycleStatus {
  return (
    v === "queued" ||
    v === "processing" ||
    v === "completed" ||
    v === "failed" ||
    v === "cancelled"
  );
}

function _isValidSeverity(v: unknown): v is "info" | "warning" | "error" {
  return v === "info" || v === "warning" || v === "error";
}

function _errorStatus(
  code: string,
  message: string
): PhotoProviderJobStatus {
  return {
    jobId: "unknown",
    status: "failed",
    retryCount: 0,
    diagnostics: [{ severity: "error", code, message }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
