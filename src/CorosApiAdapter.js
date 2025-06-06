// COROS API 適配器
export class CorosApiAdapter {
  constructor() {
    this.baseUrl = 'https://teamapi.coros.com';
    this.defaultPageSize = 100;
  }

  async fetchActivities(token, page = 1, size = this.defaultPageSize) {
    const url = `${this.baseUrl}/activity/query?size=${size}&pageNumber=${page}&modeList=`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accesstoken': token,
      },
      credentials: 'include',
    });
    if (!response.ok) throw new Error('API 請求失敗');
    return await response.json();
  }
}
