/**
 * ui-core test setup
 *
 * jsdom does not implement window.matchMedia. We install a minimal stub here
 * so every test module that renders Stack / Grid (which call useBreakpoint)
 * does not throw "window.matchMedia is not a function".
 *
 * Individual tests that need to simulate a specific viewport size can override
 * window.matchMedia with vi.fn() inside the test body and restore it afterwards.
 */

import { vi } from "vitest";

// Default stub: all media queries return `matches: false` (→ mobile breakpoint).
Object.defineProperty(window, "matchMedia", {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),   // deprecated but still called by some libs
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Accessibility CI Matchers Setup
import "vitest-axe/extend-expect";

