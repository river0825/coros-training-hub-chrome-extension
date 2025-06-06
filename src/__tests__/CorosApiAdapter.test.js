const { CorosApiAdapter } = require('../CorosApiAdapter.js');

describe('CorosApiAdapter', () => {
  it('should throw error if response is not ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });
    const adapter = new CorosApiAdapter();
    await expect(adapter.fetchActivities('token')).rejects.toThrow('API 請求失敗');
  });

  it('should return json if response is ok', async () => {
    const mockJson = { data: { dataList: [] } };
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => mockJson });
    const adapter = new CorosApiAdapter();
    const result = await adapter.fetchActivities('token');
    expect(result).toEqual(mockJson);
  });
});
