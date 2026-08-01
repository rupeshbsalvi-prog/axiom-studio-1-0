export interface DiagnosticsProvider {
  id: string;
  initialize(): Promise<void> | void;
  collect(): Record<string, any>;
  dispose(): void;
}

export class DiagnosticsService {
  private providers: Map<string, DiagnosticsProvider> = new Map();

  registerProvider(provider: DiagnosticsProvider): void {
    if (this.providers.has(provider.id)) {
      this.providers.get(provider.id)!.dispose();
    }
    this.providers.set(provider.id, provider);
  }

  unregisterProvider(id: string): void {
    const provider = this.providers.get(id);
    if (provider) {
      provider.dispose();
      this.providers.delete(id);
    }
  }

  getProvider(id: string): DiagnosticsProvider | undefined {
    return this.providers.get(id);
  }

  async initializeAll(): Promise<void> {
    for (const provider of this.providers.values()) {
      await provider.initialize();
    }
  }

  collectAll(): Record<string, any> {
    let result: Record<string, any> = {};
    for (const provider of this.providers.values()) {
      try {
        result = { ...result, ...provider.collect() };
      } catch (error) {
        console.error(`Error collecting from diagnostics provider ${provider.id}:`, error);
      }
    }
    return result;
  }

  dispose(): void {
    for (const provider of this.providers.values()) {
      provider.dispose();
    }
    this.providers.clear();
  }
}

export const diagnosticsService = new DiagnosticsService();
