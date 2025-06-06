const { AuthManager } = require('../AuthManager.js');

describe('AuthManager', () => {
  it('should return token from cookie', async () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'CPL-coros-token=abc123; other=val',
    });
    const manager = new AuthManager();
    const token = await manager.getAuthToken();
    expect(token).toBe('abc123');
  });

  it('should return null if token not found', async () => {
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'other=val',
    });
    const manager = new AuthManager();
    const token = await manager.getAuthToken();
    expect(token).toBeNull();
  });
});
