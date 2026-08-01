import { BodyScrollLock } from "./BodyScrollLock";

export interface OverlayOptions {
  zIndex?: number;
  type?: string;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  restoreFocus?: boolean;
  lockScroll?: boolean;
  onDismiss?: () => void;
  element?: HTMLElement | null;
}

export interface OverlayInstance {
  id: string;
  zIndex: number;
  options: OverlayOptions;
}

type Listener = (stack: OverlayInstance[]) => void;

class OverlayManagerClass {
  private stack: OverlayInstance[] = [];
  private listeners = new Set<Listener>();
  private isScrollLocked = false;

  constructor() {
    if (typeof window !== "undefined") {
      // Use capture phase to handle events before standard handlers
      window.addEventListener("keydown", this.handleKeyDown, true);
      window.addEventListener("pointerdown", this.handlePointerDown, true);
    }
  }

  register(id: string, options: OverlayOptions = {}): void {
    const zIndex = options.zIndex ?? 1000;
    this.stack = this.stack.filter((item) => item.id !== id);
    this.stack.push({ id, zIndex, options });
    this.sortStack();
    this.notify();
    this.updateScrollLock();
  }

  update(id: string, newOptions: Partial<OverlayOptions>): void {
    const item = this.stack.find((item) => item.id === id);
    if (item) {
      item.options = { ...item.options, ...newOptions };
      if (newOptions.zIndex !== undefined) {
        item.zIndex = newOptions.zIndex;
        this.sortStack();
      }
      this.notify();
      this.updateScrollLock();
    }
  }

  unregister(id: string): void {
    this.stack = this.stack.filter((item) => item.id !== id);
    this.notify();
    this.updateScrollLock();
  }

  bringToFront(id: string): void {
    const item = this.stack.find((item) => item.id === id);
    if (item) {
      this.stack = this.stack.filter((item) => item.id !== id);
      this.stack.push(item);
      this.notify();
    }
  }

  getTop(): OverlayInstance | undefined {
    return this.stack[this.stack.length - 1];
  }

  getStack(): OverlayInstance[] {
    return [...this.stack];
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private sortStack() {
    this.stack.sort((a, b) => a.zIndex - b.zIndex);
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.getStack()));
  }

  private updateScrollLock() {
    const shouldLock = this.stack.some((item) => item.options.lockScroll);
    if (shouldLock && !this.isScrollLocked) {
      BodyScrollLock.lock();
      this.isScrollLocked = true;
    } else if (!shouldLock && this.isScrollLocked) {
      BodyScrollLock.unlock();
      this.isScrollLocked = false;
    }
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      const top = this.getTop();
      if (top && top.options.closeOnEscape !== false) {
        event.preventDefault();
        event.stopPropagation();
        top.options.onDismiss?.();
      }
    }
  };

  private handlePointerDown = (event: PointerEvent) => {
    const top = this.getTop();
    if (!top || top.options.closeOnOutsideClick === false) return;

    const element = top.options.element;
    if (element && event.target instanceof Node) {
      if (!element.contains(event.target)) {
        top.options.onDismiss?.();
      }
    }
  };
}

export const OverlayManager = new OverlayManagerClass();
