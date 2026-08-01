import type { VectorShape, VectorCanvasState, VectorPlanResponse, VectorAuditEvent } from "../../services/vectorTypes";

export interface VectorStudioState {
  projectId: string;
  activePlan: VectorPlanResponse | null;
  selectedShapeId: string | null;
  canvas: VectorCanvasState;
  shapes: Record<string, VectorShape>;
  shapeOrder: string[];
  audit: VectorAuditEvent[];
}

export const VECTOR_INITIAL_STATE: VectorStudioState = {
  projectId: "",
  activePlan: null,
  selectedShapeId: null,
  canvas: {
    width: 1024,
    height: 1024,
    viewBox: "0 0 1024 1024",
    background: "#0b0f19"
  },
  shapes: {},
  shapeOrder: [],
  audit: []
};
