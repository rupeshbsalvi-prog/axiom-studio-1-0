export type EventCallback = (data: any) => void;

export class EventBus {
  private listeners: Record<string, EventCallback[]> = {};

  subscribe(event: string, callback: EventCallback): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter((cb) => cb !== callback);
    };
  }

  publish(event: string, data: any): void {
    if (!this.listeners[event]) return;
    for (const callback of this.listeners[event]) {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event handler for event "${event}":`, error);
      }
    }
  }

  clear(): void {
    this.listeners = {};
  }
}

export const eventBus = new EventBus();
