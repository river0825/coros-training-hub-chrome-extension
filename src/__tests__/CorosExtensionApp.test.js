import { CorosExtensionApp } from '../CorosExtensionApp.js';

describe('CorosExtensionApp', () => {
  it('should initialize without error if token is missing', async () => {
    // Mock AuthManager to return null
    const app = new CorosExtensionApp();
    app.authManager.getAuthToken = async () => null;
    app.uiManager.showError = jest.fn();
    await app.initialize();
    expect(app.uiManager.showError).toHaveBeenCalledWith('無法取得認證令牌');
  });
});
