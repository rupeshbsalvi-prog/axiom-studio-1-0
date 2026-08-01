import { DiagnosticsProvider } from "../../services/DiagnosticsService";
import { eventBus } from "../../services/EventBus";

export class RuntimeProvider implements DiagnosticsProvider {
  id = "runtime";
  private unsubscribe: (() => void) | null = null;
  private data = {
    activeState: "Idle",
    particleCount: 0,
  };

  initialize(): void {
    this.unsubscribe = eventBus.subscribe("telemetry:updated", (payload: any) => {
      if (payload.activeState !== undefined) this.data.activeState = payload.activeState;
      if (payload.particleCount !== undefined) this.data.particleCount = payload.particleCount;
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
