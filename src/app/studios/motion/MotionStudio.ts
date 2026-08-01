import { platformRuntime } from "../../../platform/runtime/PlatformRuntime";
import { eventBus } from "../../../platform/services/EventBus";
import { stateService } from "../../../platform/services/StateService";
import type { StudioModule } from "../ai/AxiomAiStudio";
import { MOTION_INITIAL_STATE } from "./MotionState";

export class MotionStudio implements StudioModule {
  readonly id = "motion";
  private sessionStartTime = 0;
  private metricsInterval: ReturnType<typeof setInterval> | null = null;

  initialize(): void {
    this.sessionStartTime = Date.now();
    platformRuntime.registerStudio(this);

    // Seed initial state
    stateService.setState({
      "motion.state": MOTION_INITIAL_STATE,
    });

    eventBus.publish("studio:motion:ready", {
      studioId: this.id,
      timestamp: this.sessionStartTime,
    });
  }

  activate(): void {
    if (!this.metricsInterval) {
      this.metricsInterval = setInterval(() => {
        this._publishTelemetrySnapshot();
      }, 1000);
    }

    eventBus.publish("studio:motion:activated", { studioId: this.id });
  }

  deactivate(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    eventBus.publish("studio:motion:deactivated", { studioId: this.id });
  }

  dispose(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    platformRuntime.unregisterStudio(this);
    eventBus.publish("studio:motion:disposed", { studioId: this.id });
  }

  private _publishTelemetrySnapshot(): void {
    const s = stateService.getState()["motion.state"] || MOTION_INITIAL_STATE;
    eventBus.publish("motion:metrics:snapshot", {
      layerCount: s.layers.length,
      playheadFrame: s.playheadFrame,
      isPlaying: s.isPlaying,
      timestamp: Date.now(),
    });
  }
}

export const motionStudio = new MotionStudio();
