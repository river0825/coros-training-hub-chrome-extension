const { UIManager } = require('../UIManager.js');

describe('UIManager', () => {
  it('should inject styles only once', async () => {
    document.body.innerHTML = '';
    const manager = new UIManager();
    await manager.injectStyles();
    expect(document.getElementById('coros-calendar-styles')).not.toBeNull();
    // Try inject again, should not duplicate
    await manager.injectStyles();
    expect(document.querySelectorAll('#coros-calendar-styles').length).toBe(1);
  });

  it('should show error with alert', () => {
    window.alert = jest.fn();
    const manager = new UIManager();
    manager.showError('錯誤訊息');
    expect(window.alert).toHaveBeenCalledWith('錯誤訊息');
  });
});
