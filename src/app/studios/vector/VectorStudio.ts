import { platformRuntime } from "../../../platform/runtime/PlatformRuntime";
import { eventBus } from "../../../platform/services/EventBus";
import { stateService } from "../../../platform/services/StateService";
import type { StudioModule } from "../ai/AxiomAiStudio";
import { VECTOR_INITIAL_STATE } from "./VectorState";

export class VectorStudio implements StudioModule {
  readonly id = "vector";
  private sessionStartTime = 0;
  private metricsInterval: ReturnType<typeof setInterval> | null = null;

  initialize(): void {
    this.sessionStartTime = Date.now();
    platformRuntime.registerStudio(this);
    
    // Seed initial state
    stateService.setState({
      "vector.state": VECTOR_INITIAL_STATE
    });

    eventBus.publish("studio:vector:ready", {
      studioId: this.id,
      timestamp: this.sessionStartTime
    });
  }

  activate(): void {
    this.metricsInterval = setInterval(() => {
      this._publishTelemetrySnapshot();
    }, 1000);

    eventBus.publish("studio:vector:activated", { studioId: this.id });
  }

  deactivate(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    eventBus.publish("studio:vector:deactivated", { studioId: this.id });
  }

  dispose(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    platformRuntime.unregisterStudio(this);
    eventBus.publish("studio:vector:disposed", { studioId: this.id });
  }

  private _publishTelemetrySnapshot(): void {
    const s = stateService.getState()["vector.state"] || VECTOR_INITIAL_STATE;
    eventBus.publish("vector:metrics:snapshot", {
      shapeCount: s.shapeOrder.length,
      projectId: s.projectId,
      timestamp: Date.now()
    });
  }
}

export const vectorStudio = new VectorStudio();
