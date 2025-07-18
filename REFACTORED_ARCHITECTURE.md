# COROS Training Hub Chrome Extension - Refactored Architecture

This document describes the refactored architecture of the COROS Training Hub Chrome Extension, which follows Clean Architecture principles for better modularity, maintainability, and testability.

## Architecture Overview

The refactored codebase follows a layered architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
├─────────────────────────────────────────┤
│            Business Layer               │
├─────────────────────────────────────────┤
│           Integration Layer             │
├─────────────────────────────────────────┤
│            Data Access Layer            │
└─────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── core/                    # Core application layer
│   └── CorosExtensionApp.js # Main application coordinator
├── services/                # Business logic layer
│   ├── ActivityDataProcessor.js
│   ├── CalendarService.js
│   └── StatisticsService.js
├── adapters/                # Integration layer
│   ├── StorageAdapter.js
│   ├── CorosApiAdapter.js
│   └── DomAdapter.js
├── repositories/            # Data access layer
│   ├── ActivityRepository.js
│   └── ConfigRepository.js
├── views/                   # Presentation layer
│   ├── CalendarView.js
│   └── StatisticsView.js
├── utils/                   # Utility functions
│   ├── dateUtils.js
│   ├── formatUtils.js
│   ├── sportUtils.js
│   └── domUtils.js
├── config/                  # Configuration
│   └── constants.js
├── tests/                   # Test files
│   └── architecture-test.js
└── content-refactored.js    # Main content script
```

## Layer Responsibilities

### Core Layer
- **CorosExtensionApp**: Main application coordinator that orchestrates all components
- Handles application lifecycle, dependency injection, and error management
- Manages state and coordinates between different layers

### Business Layer (Services)
- **ActivityDataProcessor**: Processes and formats activity data from API
- **CalendarService**: Handles calendar-related business logic and data generation
- **StatisticsService**: Calculates statistics, trends, and insights

### Integration Layer (Adapters)
- **StorageAdapter**: Unified interface for localStorage and Chrome extension storage
- **CorosApiAdapter**: Handles communication with COROS API
- **DomAdapter**: Abstracts DOM manipulation operations

### Data Access Layer (Repositories)
- **ActivityRepository**: Manages activity data storage and retrieval with caching
- **ConfigRepository**: Handles extension configuration and settings

### Presentation Layer (Views)
- **CalendarView**: Renders calendar UI and handles calendar-specific interactions
- **StatisticsView**: Renders statistics UI and handles statistics display

### Utilities
- **dateUtils**: Date formatting and manipulation functions
- **formatUtils**: Data formatting utilities (time, distance, calories)
- **sportUtils**: Sport type mapping and normalization
- **domUtils**: DOM manipulation and validation utilities

## Key Principles Applied

### 1. Separation of Concerns
Each layer has a specific responsibility:
- Presentation layer handles UI rendering
- Business layer contains domain logic
- Integration layer handles external integrations
- Data layer manages data persistence

### 2. Dependency Inversion
- High-level modules don't depend on low-level modules
- Both depend on abstractions (interfaces)
- Dependencies are injected through constructors

### 3. Single Responsibility Principle
Each class has one reason to change:
- ActivityDataProcessor only handles data processing
- CalendarService only handles calendar logic
- StorageAdapter only handles storage operations

### 4. Open/Closed Principle
The system is open for extension but closed for modification:
- New sport types can be added without modifying existing code
- New storage backends can be added through adapters
- New view modes can be implemented without changing core logic

## Benefits of the Refactored Architecture

### 1. Modularity
- Clear module boundaries
- Independent components
- Easy to understand and navigate

### 2. Testability
- Each component can be tested in isolation
- Dependencies can be mocked
- Clear test boundaries

### 3. Maintainability
- Changes are localized to specific layers
- Clear responsibilities reduce complexity
- Easier to debug and fix issues

### 4. Extensibility
- New features can be added without affecting existing code
- Support for new data sources through adapters
- Easy to add new view types

### 5. Reusability
- Components can be reused in different contexts
- Utilities are shared across the application
- Business logic is independent of UI

## Usage

### Basic Usage
```javascript
import { CorosExtensionApp } from './src/core/CorosExtensionApp.js';

// Create and initialize the application
const app = new CorosExtensionApp();
await app.initialize();

// Get application status
const status = app.getStatus();
console.log('App status:', status);

// Cleanup when done
app.cleanup();
```

### Adding New Sport Types
```javascript
// Add to src/config/constants.js
export const SPORT_TYPE_MAP = {
  // ... existing mappings
  999: 'new_sport_type'
};

export const SPORT_TYPES = {
  // ... existing types
  new_sport_type: { 
    icon: '🏃', 
    color: '#FF6B6B', 
    name: 'New Sport' 
  }
};
```

### Adding New Storage Backends
```javascript
// Create a new adapter
class NewStorageAdapter {
  async set(key, value) { /* implementation */ }
  async get(key) { /* implementation */ }
  async remove(key) { /* implementation */ }
}

// Use in application
const app = new CorosExtensionApp();
app.storageAdapter = new NewStorageAdapter();
```

## Testing

The refactored architecture includes basic testing infrastructure:

```javascript
// Run architecture tests
import { testRefactoredArchitecture } from './src/tests/architecture-test.js';

const results = await testRefactoredArchitecture();
console.log('Test results:', results);
```

## Migration from Original Code

The refactored code maintains the same functionality while improving structure:

### Before (Original)
- Monolithic files with mixed responsibilities
- Global namespace pollution
- Tight coupling between components
- Difficult to test and maintain

### After (Refactored)
- Modular components with clear responsibilities
- Proper encapsulation and abstraction
- Loose coupling through dependency injection
- Comprehensive testing infrastructure

## Performance Considerations

The refactored architecture includes several performance optimizations:

### 1. Caching Strategy
- Intelligent caching of activity data
- Configurable cache strategies
- Automatic cache cleanup

### 2. Lazy Loading
- Components are loaded only when needed
- Views are rendered on demand
- Services are initialized lazily

### 3. Memory Management
- Proper cleanup of event listeners
- Cache size limits
- Garbage collection friendly patterns

## Future Enhancements

The architecture supports future enhancements:

1. **TypeScript Migration**: Easy to add type definitions
2. **Unit Testing**: Comprehensive test coverage
3. **New View Types**: Week view, year view, etc.
4. **Data Export**: Export functionality through services
5. **Offline Support**: Enhanced caching and sync
6. **Performance Monitoring**: Metrics and analytics
7. **Plugin System**: Extensible architecture for plugins

## Contributing

When contributing to the refactored codebase:

1. Follow the established layer structure
2. Maintain clear separation of concerns
3. Add appropriate tests for new functionality
4. Document new components and utilities
5. Follow the established coding patterns

## Conclusion

The refactored architecture provides a solid foundation for the COROS Training Hub Chrome Extension, making it more maintainable, testable, and extensible while preserving all original functionality.