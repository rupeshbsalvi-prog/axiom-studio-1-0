import { describe, it, expect } from "vitest";
import {
  getNumberFromPayload,
  LOCAL_RUNTIME_ACTIONS,
  LOCAL_RUNTIME_EXECUTORS,
} from "../MockRuntimeExecutor";

describe("MockRuntimeExecutor", () => {
  describe("getNumberFromPayload", () => {
    it("returns correct number when key exists", () => {
      const payload = { frame: 42, name: "test" };
      expect(getNumberFromPayload(payload, "frame", 0)).toBe(42);
    });

    it("returns fallback when key is not a number", () => {
      const payload = { frame: "42", name: "test" };
      expect(getNumberFromPayload(payload, "frame", 0)).toBe(0);
    });

    it("returns fallback when payload is undefined or array", () => {
      expect(getNumberFromPayload(undefined, "frame", 5)).toBe(5);
      expect(getNumberFromPayload([1, 2, 3], "frame", 5)).toBe(5);
    });
  });

  describe("LOCAL_RUNTIME_ACTIONS", () => {
    it("defines actions for mock-motion-studio", () => {
      const actions = LOCAL_RUNTIME_ACTIONS["mock-motion-motion-studio" as any] || LOCAL_RUNTIME_ACTIONS["mock-motion-studio"];
      expect(actions).toBeDefined();
      expect(actions.length).toBeGreaterThan(0);
      expect(actions[0].id).toBe("renderMotionFrame");
    });
  });

  describe("LOCAL_RUNTIME_EXECUTORS", () => {
    it("successfully runs renderMotionFrame", async () => {
      const executor = LOCAL_RUNTIME_EXECUTORS["mock-motion-studio"]?.["renderMotionFrame"];
      expect(executor).toBeDefined();
      const result = await executor({ frame: 10 });
      expect(result).toEqual({
        frame: 10,
        status: "rendered",
        durationMs: 45,
      });
    });

    it("successfully runs exportLottie", async () => {
      const executor = LOCAL_RUNTIME_EXECUTORS["mock-motion-studio"]?.["exportLottie"];
      expect(executor).toBeDefined();
      const result = await executor();
      expect(result).toEqual({
        path: "/exports/motion-composition.json",
        type: "Lottie",
        bytes: 1420,
      });
    });
  });
});
