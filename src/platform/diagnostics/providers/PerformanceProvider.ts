import { DiagnosticsProvider } from "../../services/DiagnosticsService";
import { eventBus } from "../../services/EventBus";

export class PerformanceProvider implements DiagnosticsProvider {
  id = "performance";
  private unsubscribe: (() => void) | null = null;
  private data = {
    fps: 60,
    frameTime: 0.0,
    gpuTime: 0.0,
    cpuTime: 0.0,
  };

  initialize(): void {
    this.unsubscribe = eventBus.subscribe("telemetry:updated", (payload: any) => {
      if (payload.fps !== undefined) this.data.fps = payload.fps;
      if (payload.frameTime !== undefined) this.data.frameTime = payload.frameTime;
      if (payload.gpuTime !== undefined) this.data.gpuTime = payload.gpuTime;
      if (payload.cpuTime !== undefined) this.data.cpuTime = payload.cpuTime;
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
