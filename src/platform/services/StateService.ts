import { eventBus } from "./EventBus";

export class StateService {
  private state: Record<string, any> = {};

  setState(newState: Record<string, any>): void {
    this.state = { ...this.state, ...newState };
    eventBus.publish("state:changed", this.state);
  }

  updateState(key: string, val: any): void {
    this.state[key] = val;
    eventBus.publish(`state:changed:${key}`, val);
    eventBus.publish("state:changed", this.state);
  }

  getState(): Record<string, any> {
    return { ...this.state };
  }

  clear(): void {
    this.state = {};
  }
}

export const stateService = new StateService();
