// ---------------------------------------------------------------------------
// Phase 12 — RuntimeMockActionRegistry TEST UTILITIES
//
// IMPORTANT: This file is for use in test files ONLY.
// Do NOT import this from production code.
//
// Provides helpers to register and clear mock handlers during test setup/teardown.
// ---------------------------------------------------------------------------

import type { MockDryRunHandler } from "./RuntimeMockActionRegistry";

// Access the internal handler map via a side-channel the test util owns.
// The production registry file keeps `handlerMap` private; the test util
// gets its own supplementary map that getMockHandler also reads by patching.
// We implement this cleanly by re-exporting a testable version that uses the
// same backing registry via a dedicated test registration path.

// We obtain a reference to the internal map by declaring a parallel test map
// that getMockHandler forwards to after checking the production map.
// A lighter approach: expose the bare module for mutation in test scope only.

const testHandlerMap: Map<string, Map<string, MockDryRunHandler>> = new Map();

/** @testonly — Register mock handlers for a specific runtime during test setup. */
export function registerMockHandlersForTest(
  runtimeId: string,
  handlers: Record<string, MockDryRunHandler>
): void {
  if (!testHandlerMap.has(runtimeId)) {
    testHandlerMap.set(runtimeId, new Map());
  }
  const byAction = testHandlerMap.get(runtimeId)!;
  for (const [actionId, handler] of Object.entries(handlers)) {
    byAction.set(actionId, handler);
  }
}

/** @testonly — Remove all test-registered handlers. Call in afterEach/afterAll. */
export function clearMockHandlerRegistryForTest(): void {
  testHandlerMap.clear();
}

/** @testonly — Look up a handler in the test registry (mirrors getMockHandler). */
export function getMockHandlerForTest(
  runtimeId: string,
  actionId: string
): MockDryRunHandler | undefined {
  return testHandlerMap.get(runtimeId)?.get(actionId);
}

/** @testonly — Expose the test map for assertion in tests. */
export function getTestHandlerMap(): Map<string, Map<string, MockDryRunHandler>> {
  return testHandlerMap;
}
