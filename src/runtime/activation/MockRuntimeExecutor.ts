import {
  type RuntimeActionDefinition,
  type JsonValue,
} from "./RuntimeActivationTypes";

export type MockActionExecutor = (payload?: JsonValue) => Promise<JsonValue>;

export const LOCAL_RUNTIME_ACTIONS: Record<string, RuntimeActionDefinition[]> = {
  "mock-motion-studio": [
    {
      id: "renderMotionFrame",
      label: "Render Motion Frame",
      description: "Simulates rendering a single motion frame.",
      requiredCapabilities: ["readProject", "writeProject"],
    },
    {
      id: "exportLottie",
      label: "Export Lottie",
      description: "Simulates exporting a Lottie animation JSON.",
      requiredCapabilities: ["readProject", "export"],
    },
  ],
  "mock-vector-studio": [
    {
      id: "generateVectorComposition",
      label: "Generate Vector Composition",
      description: "Simulates generating a vector composition.",
      requiredCapabilities: ["readProject", "writeProject"],
    },
    {
      id: "exportSvg",
      label: "Export SVG",
      description: "Simulates exporting an SVG asset.",
      requiredCapabilities: ["readProject", "export"],
    },
  ],
  "mock-photo-studio": [
    {
      id: "generatePhotoLayout",
      label: "Generate Photo Layout",
      description: "Simulates generating a photo composition layout plan.",
      requiredCapabilities: ["readProject", "writeProject"],
    },
  ],
};

export function getNumberFromPayload(
  payload: JsonValue | undefined,
  key: string,
  fallback: number
): number {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return fallback;
  }
  const value = (payload as Record<string, JsonValue>)[key];
  return typeof value === "number" ? value : fallback;
}

export const LOCAL_RUNTIME_EXECUTORS: Record<string, Record<string, MockActionExecutor>> = {
  "mock-motion-studio": {
    renderMotionFrame: async (payload) => {
      // Simulate quick rendering of a frame
      const frame = getNumberFromPayload(payload, "frame", 0);
      return {
        frame,
        status: "rendered",
        durationMs: 45,
      };
    },
    exportLottie: async () => {
      // Simulate export
      return {
        path: "/exports/motion-composition.json",
        type: "Lottie",
        bytes: 1420,
      };
    },
  },
};
