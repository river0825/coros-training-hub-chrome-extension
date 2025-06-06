const { CalendarView } = require('../CalendarView.js');

describe('CalendarView', () => {
  it('should initialize with activities', () => {
    const view = new CalendarView();
    const activities = [{ id: 1, date: '2025-06-06' }];
    view.initialize(activities);
    expect(view.activities).toEqual(activities);
  });
});
