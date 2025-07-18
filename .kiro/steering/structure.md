# Project Structure

## Root Files
- `manifest.json` - Chrome extension manifest (Manifest V3)
- `package.json` - Node.js dependencies and scripts
- `.eslintrc.js` - ESLint configuration
- `.prettierrc` - Prettier formatting rules
- `README.md` - Project documentation

## Core Extension Files
- `background.js` - Service worker for extension lifecycle
- `content.js` - Main content script injected into COROS pages
- `popup.html` / `popup.js` - Extension popup interface
- `styles.css` - Extension UI styling

## Modular JavaScript Components
- `api.js` - COROS API integration and data fetching
- `calendar.js` - Calendar view rendering and logic
- `statistics.js` - Statistics calculation and display
- `storage.js` - Local storage management and caching
- `jquery.min.js` - jQuery library for DOM manipulation

## Assets & Resources
- `images/` - Extension icons and UI assets
  - `chrome_icon.png` - Extension icon
  - `coros.png` - COROS branding
  - `screen-shoot.png` - Screenshots

## Documentation
- `documents/` - Project documentation
  - `prd.md` - Product requirements document
  - `design/` - Design specifications
    - `software-architecture.md` - Technical architecture
    - `software-design.md` - Detailed design specs
    - `STYLE_GUIDE.md` - UI/UX guidelines
    - `privacy-policy.md` - Privacy documentation

## Development & Build
- `tools/` - Build and deployment scripts
  - `build-zip.sh` - Package extension for distribution
- `tasks/` - Development task tracking
- `logs/` - Runtime logs and debugging info
- `coverage/` - Test coverage reports
- `dist/` - Built extension files
- `node_modules/` - npm dependencies

## Configuration Files
- `.kiro/` - Kiro AI assistant configuration
- `.git/` - Git version control
- `.github/` - GitHub workflows and templates

## File Organization Principles
- **Separation of Concerns**: Each JS file handles a specific domain (API, UI, storage)
- **Modular Architecture**: Components can be loaded independently
- **Clear Naming**: File names reflect their primary responsibility
- **Documentation Co-location**: Design docs live alongside code
- **Build Separation**: Source files separate from distribution files

## Content Script Loading Order
1. `storage.js` - Storage utilities first
2. `api.js` - API layer
3. `calendar.js` - Calendar rendering
4. `statistics.js` - Statistics processing
5. `content.js` - Main orchestration script

## Development Workflow
- Source files in root directory for easy access
- Documentation in `documents/` for reference
- Build tools in `tools/` for packaging
- Logs and temporary files in respective directories