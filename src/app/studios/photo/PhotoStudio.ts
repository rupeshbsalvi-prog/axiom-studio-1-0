import { platformRuntime } from "../../../platform/runtime/PlatformRuntime";
import { eventBus } from "../../../platform/services/EventBus";
import { stateService } from "../../../platform/services/StateService";
import type { StudioModule } from "../ai/AxiomAiStudio";
import { PHOTO_INITIAL_STATE } from "./PhotoState";

export class PhotoStudio implements StudioModule {
  readonly id = "photo";
  private sessionStartTime = 0;
  private metricsInterval: ReturnType<typeof setInterval> | null = null;

  initialize(): void {
    this.sessionStartTime = Date.now();
    platformRuntime.registerStudio(this);
    
    // Seed initial state
    stateService.setState({
      "photo.state": PHOTO_INITIAL_STATE
    });

    eventBus.publish("studio:photo:ready", {
      studioId: this.id,
      timestamp: this.sessionStartTime
    });
  }

  activate(): void {
    this.metricsInterval = setInterval(() => {
      this._publishTelemetrySnapshot();
    }, 1000);

    eventBus.publish("studio:photo:activated", { studioId: this.id });
  }

  deactivate(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    eventBus.publish("studio:photo:deactivated", { studioId: this.id });
  }

  dispose(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    platformRuntime.unregisterStudio(this);
    eventBus.publish("studio:photo:disposed", { studioId: this.id });
  }

  private _publishTelemetrySnapshot(): void {
    const s = stateService.getState()["photo.state"] || PHOTO_INITIAL_STATE;
    eventBus.publish("photo:metrics:snapshot", {
      layerCount: s.layers.length,
      projectId: s.projectId,
      timestamp: Date.now()
    });
  }
}

export const photoStudio = new PhotoStudio();
