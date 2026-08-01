import { DiagnosticsProvider } from "../../services/DiagnosticsService";
import { eventBus } from "../../services/EventBus";

export class ValidationProvider implements DiagnosticsProvider {
  id = "validation";
  private unsubscribe: (() => void) | null = null;
  private logs: string[] = [];

  initialize(): void {
    this.unsubscribe = eventBus.subscribe("validation:log", (message: string) => {
      this.logs.push(`[${new Date().toLocaleTimeString()}] ${message}`);
      if (this.logs.length > 50) this.logs.shift(); // Keep last 50 entries
    });
  }

  collect(): Record<string, any> {
    return {
      validationLogs: [...this.logs],
    };
  }

  dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.logs = [];
  }
}
