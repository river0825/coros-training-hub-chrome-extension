# Technology Stack

## Core Technologies
- **Platform**: Chrome Extension (Manifest V3)
- **Languages**: JavaScript (ES2021), HTML5, CSS3
- **Architecture**: Content Script Pattern with Service Worker

## Key Libraries & Dependencies
- **jQuery**: DOM manipulation and utilities (`jquery.min.js`)
- **Jest**: Testing framework with JSDOM environment
- **ESLint**: Code linting with web extensions support
- **Prettier**: Code formatting

## Development Tools
- **Node.js**: Package management and build tooling
- **npm**: Dependency management
- **ESBuild**: Fast JavaScript bundling (via dependencies)

## Browser Extension Structure
- **Manifest V3**: Modern Chrome extension format
- **Service Worker**: Background script (`background.js`)
- **Content Scripts**: Injected into COROS website pages
- **Popup**: Extension popup interface (`popup.html`, `popup.js`)

## Build & Development Commands

### Linting & Formatting
```bash
npm run lint          # Run ESLint
npm run format        # Format code with Prettier
```

### Testing
```bash
npm test              # Run Jest tests (currently placeholder)
```

### Build & Package
```bash
./tools/build-zip.sh  # Create distribution package
```

## Code Quality Standards
- **ESLint Config**: `eslint:recommended` with web extensions globals
- **Prettier Config**: Single quotes, 100 char width, trailing commas
- **Browser Support**: Chrome/Edge with Manifest V3

## API Integration
- **COROS API**: RESTful endpoints for activity data
- **Authentication**: Cookie-based token extraction
- **Caching**: Chrome storage API for local data persistence

## Performance Considerations
- Lazy loading of extension components
- Smart caching strategy (current month fresh, past months cached)
- Minimal memory footprint (<50MB target)
- Fast UI rendering (<1 second target)