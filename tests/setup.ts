// Test setup file
import { DependencyContainer } from '../src/shared/container/DependencyContainer';

// Mock Chrome APIs
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn(),
    },
  },
  tabs: {
    query: jest.fn(),
  },
  scripting: {
    executeScript: jest.fn(),
  },
} as any;

// Test container for dependency injection
export class TestContainer {
  private static container: DependencyContainer;

  static getContainer(): DependencyContainer {
    if (!TestContainer.container) {
      TestContainer.container = new DependencyContainer();
    }
    return TestContainer.container;
  }

  static resolve<T>(key: string): T {
    return TestContainer.getContainer().resolve<T>(key);
  }

  static bind<T>(key: string, factory: () => T): void {
    TestContainer.getContainer().bind(key, factory);
  }

  static clear(): void {
    if (TestContainer.container) {
      TestContainer.container.clear();
    }
  }
}

// Setup test environment
beforeEach(() => {
  TestContainer.clear();
  jest.clearAllMocks();
});

// Clean up after each test
afterEach(() => {
  TestContainer.clear();
});