# COROS Activity Calendar Chrome Extension

A modern Chrome extension built with TypeScript and clean architecture principles that enhances the COROS website with calendar visualization and statistics for sports activity data.

## 🚀 Features

### Core Functionality
- **Calendar Visualization**: Monthly calendar view with daily activity indicators
- **Activity Statistics**: Comprehensive monthly reports with distance, time, and activity counts
- **Multi-Sport Support**: Support for running, cycling, swimming, and other sports
- **Data Caching**: Intelligent caching strategy for optimal performance
- **Responsive Design**: Clean, modern UI that matches COROS website styling

### Technical Features
- **TypeScript**: Fully typed codebase with strict type checking
- **Clean Architecture**: Domain-driven design with proper separation of concerns
- **Dependency Injection**: Modular, testable architecture
- **Comprehensive Testing**: BDD-style tests with Jest
- **Modern Chrome Extension**: Manifest V3 support

## 🏗️ Architecture

This extension follows clean architecture principles with clear separation of concerns:

```
src/
├── domain/                 # Business logic and entities
│   ├── entities/          # Core business entities (Activity, Calendar, Statistics)
│   ├── value-objects/     # Immutable domain concepts (DateTime, Distance, etc.)
│   ├── services/          # Domain business logic
│   └── repositories/      # Data access interfaces
├── application/           # Use cases and application services
│   ├── use-cases/         # Application use cases
│   └── services/          # Application orchestration
├── infrastructure/        # External integrations
│   ├── api/               # External API adapters
│   ├── storage/           # Storage implementations
│   └── repositories/      # Repository implementations
├── presentation/          # UI and Chrome extension integration
│   └── chrome/            # Chrome extension UI controllers
└── shared/                # Shared utilities
    ├── container/         # Dependency injection
    ├── types/             # Shared type definitions
    └── exceptions/        # Error handling
```

## 🛠️ Development Setup

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Chrome browser for testing

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/river0825/coros-training-hub-chrome-extension.git
   cd coros-training-hub-chrome-extension
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project folder

### Available Scripts

- `npm run build` - Build the TypeScript code
- `npm run build:watch` - Watch mode for development
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run clean` - Clean build artifacts

## 🧪 Testing

The project includes comprehensive BDD-style tests:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📁 Project Structure

### Domain Layer
- **Entities**: Core business objects with rich behavior
- **Value Objects**: Immutable domain concepts
- **Services**: Domain business logic
- **Repositories**: Data access interfaces

### Application Layer
- **Use Cases**: Application-specific business rules
- **Services**: Application orchestration and coordination

### Infrastructure Layer
- **API Adapters**: External service integration
- **Storage Adapters**: Data persistence
- **Repository Implementations**: Concrete data access

### Presentation Layer
- **Controllers**: Chrome extension UI controllers
- **Views**: User interface components

## 🔧 Configuration

### TypeScript Configuration
The project uses strict TypeScript configuration with:
- `strictNullChecks`: true
- `noImplicitAny`: true
- Path aliases for clean imports

### Testing Configuration
- Jest with TypeScript support
- BDD-style test structure
- Comprehensive coverage reporting

### Build Configuration
- esbuild for fast compilation
- ES2021 target for modern browsers
- Source maps for debugging

## 📦 Extension Structure

### Chrome Extension Files
- `manifest.json` - Extension manifest (v3)
- `background.js` - Service worker
- `content.js` - Content script for COROS website
- `popup.html` - Extension popup UI
- `content.css` - Styles for content script

### Legacy Files
The original JavaScript implementation is preserved in the `legacy/` folder for reference.

## 🎯 Usage

1. **Navigate to COROS Website**: Go to `https://t.coros.com`
2. **View Calendar**: Click on the "Calendar Overview" tab
3. **Navigate Months**: Use the previous/next buttons to navigate between months
4. **View Statistics**: Scroll down to see monthly activity statistics

## 🚀 Performance

- **Caching Strategy**: Intelligent caching for non-current month data
- **Lazy Loading**: Components loaded on demand
- **Optimized Rendering**: Efficient DOM manipulation
- **Memory Management**: Proper cleanup and garbage collection

## 🔐 Privacy & Security

- **Local Processing**: All data processing happens locally
- **No Third-Party Servers**: No data sent to external servers
- **Minimal Permissions**: Only required Chrome permissions
- **Secure Storage**: Uses Chrome's secure storage APIs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run tests and ensure they pass
6. Submit a pull request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Email: riverlin.tw@gmail.com

---

**Version**: 1.1.0  
**Last Updated**: July 2025
