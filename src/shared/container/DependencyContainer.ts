// Dependency injection container
export class DependencyContainer {
  private bindings = new Map<string, () => unknown>();
  private instances = new Map<string, unknown>();

  bind<T>(key: string, factory: () => T): void {
    this.bindings.set(key, factory);
  }

  bindSingleton<T>(key: string, factory: () => T): void {
    this.bindings.set(key, () => {
      if (!this.instances.has(key)) {
        this.instances.set(key, factory());
      }
      return this.instances.get(key)!;
    });
  }

  resolve<T>(key: string): T {
    const factory = this.bindings.get(key);
    if (!factory) {
      throw new Error(`No binding found for ${key}`);
    }
    return factory() as T;
  }

  has(key: string): boolean {
    return this.bindings.has(key);
  }

  clear(): void {
    this.bindings.clear();
    this.instances.clear();
  }
}

// Service locator pattern for global access
export class ServiceLocator {
  private static instance: ServiceLocator;
  private container: DependencyContainer;

  private constructor() {
    this.container = new DependencyContainer();
  }

  static getInstance(): ServiceLocator {
    if (!ServiceLocator.instance) {
      ServiceLocator.instance = new ServiceLocator();
    }
    return ServiceLocator.instance;
  }

  getContainer(): DependencyContainer {
    return this.container;
  }

  resolve<T>(key: string): T {
    return this.container.resolve<T>(key);
  }
}