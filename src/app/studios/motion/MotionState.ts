import type { MotionLayer, MotionCanvasState, MotionAuditEvent } from "../../services/motionTypes";

export interface MotionStudioState {
  projectId: string;
  selectedLayerId: string | null;
  canvas: MotionCanvasState;
  layers: MotionLayer[];
  layerOrder: string[];
  playheadFrame: number;
  isPlaying: boolean;
  durationFrames: number;
  audit: MotionAuditEvent[];
}

export const MOTION_INITIAL_STATE: MotionStudioState = {
  projectId: "",
  selectedLayerId: null,
  canvas: {
    width: 1920,
    height: 1080,
    aspectRatio: "16:9",
    background: "#090d16",
  },
  layers: [],
  layerOrder: [],
  playheadFrame: 0,
  isPlaying: false,
  durationFrames: 100,
  audit: [],
};
