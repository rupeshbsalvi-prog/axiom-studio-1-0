/**
 * Phase 29 — PhotoProviderJobPollingService tests (7 tests)
 *
 * Tests cover: interval polling, terminal-state auto-stop, timeout behavior,
 * stopPolling, and credential/binary safety of poll results.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  startPolling,
  stopPolling,
  isPolling,
  type PhotoProviderJobStatus,
} from "../PhotoProviderJobPollingService";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeJobResponse(
  jobId: string,
  status: PhotoProviderJobStatus["status"],
  overrides: Partial<PhotoProviderJobStatus> = {}
): PhotoProviderJobStatus {
  return {
    jobId,
    status,
    retryCount: 0,
    diagnostics: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function mockFetch(responses: Array<PhotoProviderJobStatus | { error: true }>) {
  let callIndex = 0;
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(() => {
      const resp = responses[Math.min(callIndex++, responses.length - 1)];
      if ("error" in resp && resp.error) {
        return Promise.reject(new Error("Network error"));
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(resp),
      } as Response);
    })
  );
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  // Stop any lingering polls
  for (const id of ["job-1", "job-2", "job-timeout", "job-stop"]) {
    stopPolling(id);
  }
});

// ---------------------------------------------------------------------------
// Test 1 — startPolling calls the status endpoint on each interval
// ---------------------------------------------------------------------------
describe("PhotoProviderJobPollingService", () => {
  it("calls the status endpoint on each 2-second interval", async () => {
    const jobId = "job-1";
    const onUpdate = vi.fn();
    const onTerminal = vi.fn();

    mockFetch([
      makeJobResponse(jobId, "queued"),
      makeJobResponse(jobId, "processing"),
      makeJobResponse(jobId, "completed", {
        assetRef: "/api/photo/assets/" + "a".repeat(32) + "?expires=9999999999&signature=" + "b".repeat(64),
      }),
    ]);

    startPolling(jobId, onUpdate, onTerminal);

    // Tick 1 fires on the immediate first call (not via interval)
    await vi.advanceTimersByTimeAsync(0);
    expect(fetch).toHaveBeenCalledTimes(1);

    // Tick 2 at 2s (first interval tick)
    await vi.advanceTimersByTimeAsync(2000);
    expect(fetch).toHaveBeenCalledTimes(2);

    stopPolling(jobId);
  });

  // -------------------------------------------------------------------------
  // Test 2 — Polling stops on "completed" terminal state
  // -------------------------------------------------------------------------
  it("stops polling automatically on completed terminal state", async () => {
    const jobId = "job-1";
    const onUpdate = vi.fn();
    const onTerminal = vi.fn();

    const completedStatus = makeJobResponse(jobId, "completed", {
      assetRef: "/api/photo/assets/" + "a".repeat(32) + "?expires=9999999999&signature=" + "b".repeat(64),
    });
    mockFetch([completedStatus]);

    startPolling(jobId, onUpdate, onTerminal);
    await vi.runAllTimersAsync();

    expect(onTerminal).toHaveBeenCalledOnce();
    expect(onTerminal.mock.calls[0][0].status).toBe("completed");
    expect(onTerminal.mock.calls[0][1]).toBe(false); // not timed out

    // Poll should be stopped — no more fetch calls
    const callsBefore = (fetch as ReturnType<typeof vi.fn>).mock.calls.length;
    await vi.advanceTimersByTimeAsync(6000);
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsBefore);
  });

  // -------------------------------------------------------------------------
  // Test 3 — Polling stops on "failed" terminal state
  // -------------------------------------------------------------------------
  it("stops polling automatically on failed terminal state", async () => {
    const jobId = "job-1";
    const onTerminal = vi.fn();

    mockFetch([makeJobResponse(jobId, "failed", {
      diagnostics: [{ severity: "error", code: "provider_timeout", message: "Timed out." }],
    })]);

    startPolling(jobId, vi.fn(), onTerminal);
    await vi.runAllTimersAsync();

    expect(onTerminal).toHaveBeenCalledOnce();
    expect(onTerminal.mock.calls[0][0].status).toBe("failed");
  });

  // -------------------------------------------------------------------------
  // Test 4 — Polling stops on "cancelled" terminal state
  // -------------------------------------------------------------------------
  it("stops polling automatically on cancelled terminal state", async () => {
    const jobId = "job-1";
    const onTerminal = vi.fn();

    mockFetch([makeJobResponse(jobId, "cancelled")]);

    startPolling(jobId, vi.fn(), onTerminal);
    await vi.runAllTimersAsync();

    expect(onTerminal).toHaveBeenCalledOnce();
    expect(onTerminal.mock.calls[0][0].status).toBe("cancelled");
  });

  // -------------------------------------------------------------------------
  // Test 5 — Polling times out after 120s and does NOT emit a cancel call
  // -------------------------------------------------------------------------
  it("stops after 120s and does not emit a cancel call to the backend", async () => {
    const jobId = "job-timeout";
    const onTerminal = vi.fn();

    // Always return "processing" so polling reaches limit
    mockFetch(Array(70).fill(makeJobResponse(jobId, "processing")));

    startPolling(jobId, vi.fn(), onTerminal);

    // Advance well past 120s (60 polls × 2s = 120s)
    await vi.runAllTimersAsync();
    for (let i = 0; i < 70; i++) {
      await vi.advanceTimersByTimeAsync(2000);
    }

    expect(onTerminal).toHaveBeenCalled();
    const [terminalStatus, timedOut] = onTerminal.mock.calls[0];
    expect(timedOut).toBe(true);

    // Verify no DELETE call was made (no cancel)
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    const deleteCalls = fetchMock.mock.calls.filter(
      (call: unknown[]) =>
        typeof call[1] === "object" &&
        (call[1] as RequestInit)?.method === "DELETE"
    );
    expect(deleteCalls).toHaveLength(0);

    // Timeout diagnostic message is informative, not a failure provenance
    const diag = terminalStatus.diagnostics[0];
    expect(diag.code).toBe("polling_timeout");
    expect(diag.message).toContain("Refresh or check status later");
  });

  // -------------------------------------------------------------------------
  // Test 6 — stopPolling clears the interval and stops future calls
  // -------------------------------------------------------------------------
  it("stopPolling clears the interval", async () => {
    const jobId = "job-stop";
    const onUpdate = vi.fn();

    mockFetch(Array(20).fill(makeJobResponse(jobId, "processing")));

    startPolling(jobId, onUpdate, vi.fn());
    await vi.runAllTimersAsync(); // first tick

    stopPolling(jobId);
    expect(isPolling(jobId)).toBe(false);

    const callsAfterStop = (fetch as ReturnType<typeof vi.fn>).mock.calls.length;
    await vi.advanceTimersByTimeAsync(10000);
    expect((fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsAfterStop);
  });

  // -------------------------------------------------------------------------
  // Test 7 — Poll results contain no binary data or credentials
  // -------------------------------------------------------------------------
  it("poll results contain no binary data or credentials", async () => {
    const jobId = "job-1";
    const onUpdate = vi.fn();

    const validStatus = makeJobResponse(jobId, "completed", {
      assetRef:
        "/api/photo/assets/" + "c".repeat(32) + "?expires=9999999999&signature=" + "d".repeat(64),
    });
    mockFetch([validStatus]);

    startPolling(jobId, onUpdate, vi.fn());
    await vi.runAllTimersAsync();

    expect(onUpdate).toHaveBeenCalled();
    const received: PhotoProviderJobStatus = onUpdate.mock.calls[0][0];

    // assetRef must be a relative signed path only
    expect(received.assetRef).toMatch(/^\/api\/photo\/assets\//);
    expect(received.assetRef).not.toMatch(/^https?:\/\//);
    expect(received.assetRef).not.toContain("base64");

    // No credential data in the parsed object
    const serialized = JSON.stringify(received);
    expect(serialized).not.toContain("apiKey");
    expect(serialized).not.toContain("endpointUrl");
    expect(serialized).not.toContain("signingSecret");
    expect(serialized).not.toContain("AXIOM_PHOTO_PROVIDER");
    expect(serialized).not.toContain("data:");
  });
});
