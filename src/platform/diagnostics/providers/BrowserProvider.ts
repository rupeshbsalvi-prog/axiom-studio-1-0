import { DiagnosticsProvider } from "../../services/DiagnosticsService";
import { eventBus } from "../../services/EventBus";

export class BrowserProvider implements DiagnosticsProvider {
  id = "browser";
  private unsubscribe: (() => void) | null = null;
  private data = {
    webglVersion: "WebGL 2.0",
    webglRenderer: "Standard",
    vendor: "Google Inc.",
    dpr: 1.0,
    canvasSize: "1920x1080",
    refreshRate: 60,
  };

  initialize(): void {
    this.unsubscribe = eventBus.subscribe("telemetry:updated", (payload: any) => {
      if (payload.webglVersion !== undefined) this.data.webglVersion = payload.webglVersion;
      if (payload.webglRenderer !== undefined) this.data.webglRenderer = payload.webglRenderer;
      if (payload.vendor !== undefined) this.data.vendor = payload.vendor;
      if (payload.dpr !== undefined) this.data.dpr = payload.dpr;
      if (payload.canvasSize !== undefined) this.data.canvasSize = payload.canvasSize;
      if (payload.refreshRate !== undefined) this.data.refreshRate = payload.refreshRate;
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
