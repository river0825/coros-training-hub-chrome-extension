const { ActivityDataProcessor } = require('../ActivityDataProcessor.js');

describe('ActivityDataProcessor', () => {
  it('should process activities correctly', () => {
    const processor = new ActivityDataProcessor();
    const rawData = {
      data: {
        dataList: [
          { id: 1, date: 20250101, sportType: 100, distance: 10000, totalTime: 3600 },
        ]
      }
    };
    const result = processor.processActivities(rawData);
    expect(result[0]).toMatchObject({
      id: 1,
      date: '2025-01-01',
      sportType: 100,
      sport: '跑步',
      distance: 10,
      time: 3600,
      timeFormatted: '01:00:00',
    });
  });

  it('should format date and time correctly', () => {
    const processor = new ActivityDataProcessor();
    expect(processor.formatDate(20250606)).toBe('2025-06-06');
    expect(processor.formatTime(3661)).toBe('01:01:01');
  });
});
