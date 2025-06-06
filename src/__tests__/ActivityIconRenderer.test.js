const { ActivityIconRenderer } = require('../ActivityIconRenderer.js');

describe('ActivityIconRenderer', () => {
  it('should return correct icon config for known sportType', () => {
    const renderer = new ActivityIconRenderer();
    const icon = renderer.sportIconMap[100];
    expect(icon).toMatchObject({ icon: 'icon-outrun', color: 'rgb(248, 192, 50)' });
  });

  it('should return default icon config for unknown sportType', () => {
    const renderer = new ActivityIconRenderer();
    const icon = renderer.sportIconMap[99999] || renderer.sportIconMap.other;
    expect(icon).toMatchObject({ icon: 'icon-other', color: 'rgb(200,200,200)' });
  });
});
