const { EventHandler } = require('../EventHandler.js');

describe('EventHandler', () => {
  it('should have bindEvents method', () => {
    const handler = new EventHandler({});
    expect(typeof handler.bindEvents).toBe('function');
  });
});
