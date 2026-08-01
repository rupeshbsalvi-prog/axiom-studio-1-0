import { DiagnosticsProvider } from "../../services/DiagnosticsService";
import { eventBus } from "../../services/EventBus";

export class GeometryProvider implements DiagnosticsProvider {
  id = "geometry";
  private unsubscribe: (() => void) | null = null;
  private data = {
    drawCalls: 0,
    triangles: 0,
    vertices: 0,
    meshCount: 0,
  };

  initialize(): void {
    this.unsubscribe = eventBus.subscribe("telemetry:updated", (payload: any) => {
      if (payload.drawCalls !== undefined) this.data.drawCalls = payload.drawCalls;
      if (payload.triangles !== undefined) this.data.triangles = payload.triangles;
      if (payload.vertices !== undefined) this.data.vertices = payload.vertices;
      if (payload.meshCount !== undefined) this.data.meshCount = payload.meshCount;
    });
  }

  collect(): Record<string, any> {
    return { ...this.data };
  }

  dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
