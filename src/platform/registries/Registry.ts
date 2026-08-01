export interface Registry<T> {
  register(id: string, entry: T): void;
  unregister(id: string): void;
  lookup(id: string): T | undefined;
  list(): Record<string, T>;
  validate(entry: T): boolean;
}

export class BaseRegistry<T> implements Registry<T> {
  protected entries: Record<string, T> = {};

  register(id: string, entry: T): void {
    if (!this.validate(entry)) {
      throw new Error(`Invalid registry entry for ID: ${id}`);
    }
    this.entries[id] = entry;
  }

  unregister(id: string): void {
    delete this.entries[id];
  }

  lookup(id: string): T | undefined {
    return this.entries[id];
  }

  list(): Record<string, T> {
    return { ...this.entries };
  }

  validate(entry: T): boolean {
    return entry !== undefined && entry !== null;
  }
}
