# COROS Training Hub Chrome Extension

A Chrome extension for training and COROS integration, built with TypeScript.

## Features
- Calendar and date utilities
- Sport icons
- Background and content scripts
- TypeScript support with type safety

## Getting Started

### Prerequisites
- Node.js and npm
- Chrome browser

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Build the TypeScript code: `npm run build`
4. Load the extension in Chrome via `chrome://extensions`

### Development
- `npm run build` - Build for production
- `npm run build:dev` - Build for development
- `npm run watch` - Watch for changes and rebuild
- `npm run type-check` - Type check without building
- `npm run clean` - Clean build artifacts

## Project Structure
- `src/background.ts` - Background service worker (TypeScript)
- `src/content.ts` - Content script (TypeScript)
- `dist/` - Compiled JavaScript files
- `manifest.json` - Chrome extension manifest
- `tsconfig.json` - TypeScript configuration
- `webpack.config.js` - Build configuration

## Development Notes
The project uses TypeScript with strict type checking. All source files are in the `src/` directory and compiled to `dist/` for the Chrome extension to use.

## License
MIT
