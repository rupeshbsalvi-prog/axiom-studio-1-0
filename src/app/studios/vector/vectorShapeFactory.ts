import type { VectorShape } from "../../services/vectorTypes";

export function createRectShape(name: string, x: number, y: number, width: number, height: number): VectorShape {
  return {
    id: `shape_rect_${Math.random().toString(36).substring(2, 8)}`,
    name,
    type: "rect",
    visible: true,
    locked: false,
    opacity: 1.0,
    fill: "#818cf8",
    stroke: "#4f46e5",
    strokeWidth: 2,
    x,
    y,
    width,
    height,
    rx: 4,
    transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 }
  };
}

export function createCircleShape(name: string, cx: number, cy: number, r: number): VectorShape {
  return {
    id: `shape_circle_${Math.random().toString(36).substring(2, 8)}`,
    name,
    type: "circle",
    visible: true,
    locked: false,
    opacity: 1.0,
    fill: "#34d399",
    stroke: "#059669",
    strokeWidth: 2,
    cx,
    cy,
    r,
    transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 }
  };
}

export function createTextShape(name: string, x: number, y: number, text: string): VectorShape {
  return {
    id: `shape_text_${Math.random().toString(36).substring(2, 8)}`,
    name,
    type: "text",
    visible: true,
    locked: false,
    opacity: 1.0,
    fill: "#cbd5e1",
    stroke: "#475569",
    strokeWidth: 0,
    x,
    y,
    text,
    fontSize: 24,
    fontFamily: "sans-serif",
    transform: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 }
  };
}
