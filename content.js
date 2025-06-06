import { CorosExtensionApp } from './src/CorosExtensionApp.js';

(async () => {
  const app = new CorosExtensionApp();
  await app.initialize();
})();