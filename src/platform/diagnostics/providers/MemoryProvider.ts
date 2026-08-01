import { DiagnosticsProvider } from "../../services/DiagnosticsService";
import { eventBus } from "../../services/EventBus";

export class MemoryProvider implements DiagnosticsProvider {
  id = "memory";
  private unsubscribe: (() => void) | null = null;
  private data = {
    gpuMemory: 0.0,
    textureMemory: 0.0,
    geometryMemory: 0.0,
  };

  initialize(): void {
    this.unsubscribe = eventBus.subscribe("telemetry:updated", (payload: any) => {
      if (payload.gpuMemory !== undefined) this.data.gpuMemory = payload.gpuMemory;
      if (payload.textureMemory !== undefined) this.data.textureMemory = payload.textureMemory;
      if (payload.geometryMemory !== undefined) this.data.geometryMemory = payload.geometryMemory;
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
