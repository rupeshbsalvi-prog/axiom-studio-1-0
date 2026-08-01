export interface FocusScopeInstance {
  id: string;
  element: HTMLElement | null;
  paused: boolean;
}

class FocusManagerClass {
  private stack: FocusScopeInstance[] = [];
  private listeners = new Set<() => void>();

  register(id: string, element: HTMLElement | null): void {
    this.stack = this.stack.filter((s) => s.id !== id);
    this.stack.push({ id, element, paused: false });
    this.notify();
  }

  updateElement(id: string, element: HTMLElement | null): void {
    const scope = this.stack.find((s) => s.id === id);
    if (scope) {
      scope.element = element;
      this.notify();
    }
  }

  unregister(id: string): void {
    this.stack = this.stack.filter((s) => s.id !== id);
    this.notify();
  }

  pause(id: string): void {
    const scope = this.stack.find((s) => s.id === id);
    if (scope) {
      scope.paused = true;
      this.notify();
    }
  }

  resume(id: string): void {
    const scope = this.stack.find((s) => s.id === id);
    if (scope) {
      scope.paused = false;
      this.notify();
    }
  }

  getTop(): FocusScopeInstance | undefined {
    for (let i = this.stack.length - 1; i >= 0; i--) {
      const scope = this.stack[i];
      if (scope && !scope.paused) {
        return scope;
      }
    }
    return undefined;
  }

  isTop(id: string): boolean {
    return this.getTop()?.id === id;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

export const FocusManager = new FocusManagerClass();
