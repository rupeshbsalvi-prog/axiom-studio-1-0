import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

/**
 * jsdom does not implement window.matchMedia.
 * Stub it globally so any test that renders a component using
 * useBreakpoint (Stack, Grid, etc.) does not crash.
 *
 * Default: all queries return matches:false → "mobile" breakpoint.
 * Individual tests can override with vi.fn() and restore afterwards.
 */
if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

/**
 * Default test fetch behavior: reject immediately.
 *
 * Studio panels call fetch() inside useEffect hooks (e.g. getVectorTemplates,
 * getPhotoTemplates).  Those functions contain an 8-second AbortController
 * timeout before falling back to local mock data.  Without this stub, the
 * JSDOM environment would wait up to 8 seconds per panel before the fallback
 * fired, causing findByText assertions to time out.
 *
 * Rules for test authors:
 *   1. DEFAULT — API fallback / offline paths
 *      Rely on this global stub.  The component will catch the rejection and
 *      render its local mock fallback immediately.
 *
 *   2. OVERRIDE — API success paths
 *      Mock fetch success locally inside the individual test, e.g.:
 *
 *        vi.mocked(fetch).mockResolvedValueOnce(
 *          new Response(JSON.stringify(payload), {
 *            status: 200,
 *            headers: { "Content-Type": "application/json" },
 *          }),
 *        );
 *
 *      Always assert that fetch was called so the override is not silently
 *      skipped:  expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/api/..."))
 *
 *   3. This stub does NOT reflect the runtime application's fetch support.
 *      The production app has full fetch available via the browser.
 */
vi.stubGlobal(
  "fetch",
  vi.fn().mockRejectedValue(new TypeError("fetch is not available in jsdom")),
);
