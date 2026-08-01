import type { HardwareTier } from "../director/ExperienceDirector";

export interface SignatureFlags {
  monochrome: boolean;
  wireframe: boolean;
  flatDiffuse: boolean;
  basicShader: boolean;
  paused: boolean;
  opaque: boolean;
  noLights: boolean;
  noBloom: boolean;
  scaleMode: "favicon32" | "favicon64" | "thumbnail" | "hero";
}

export interface CinematicStats {
  fps: number;
  frameTime: number;
  gpuTime: number;
  cpuTime: number;
  drawCalls: number;
  triangles: number;
  vertices: number;
  meshCount: number;
  gpuMemory: number;
  textureMemory: number;
  geometryMemory: number;
  activeState: string;
  particleCount: number;
  webglVersion: string;
  webglRenderer: string;
  vendor: string;
  dpr: number;
  canvasSize: string;
  refreshRate: number;
}

export type LifecycleTestStatus =
  | "idle"
  | "running"
  | "passed"
  | "failed"
  | "cancelled"
  | string; // to accommodate backward compatibility if needed

export interface LifecycleTestMetrics {
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
  cyclesCompleted?: number;
  errors?: string[];
  initialMetrics?: {
    geometries: number;
    programs: number;
  };
  finalMetrics?: {
    geometries: number;
    programs: number;
  };
  passed?: boolean;
}
