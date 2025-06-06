const { CalendarTabManager } = require('../CalendarTabManager.js');

describe('CalendarTabManager', () => {
  it('should have injectCalendarTab method', () => {
    const manager = new CalendarTabManager();
    expect(typeof manager.injectCalendarTab).toBe('function');
  });
});
