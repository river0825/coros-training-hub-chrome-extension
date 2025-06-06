// 活動資料處理器
export class ActivityDataProcessor {
  constructor() {
    this.sportTypeMap = this.initializeSportTypeMap();
  }

  processActivities(rawData) {
    const dataList = rawData?.data?.dataList || [];
    return dataList.map(item => ({
      id: item.id,
      date: this.formatDate(item.date),
      dateObj: new Date(this.formatDate(item.date)),
      sportType: item.sportType,
      sport: this.mapSportType(item.sportType),
      distance: Number(item.distance) / 1000,
      time: item.totalTime,
      timeFormatted: this.formatTime(item.totalTime),
      originalData: item
    }));
  }

  formatDate(dateNum) {
    if (!dateNum) return '';
    const str = dateNum.toString();
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }

  formatTime(seconds) {
    if (typeof seconds !== 'number' || isNaN(seconds)) return '00:00:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  }

  mapSportType(sportType) {
    return this.sportTypeMap[sportType] || '其他';
  }

  initializeSportTypeMap() {
    return {
      100: '跑步', 103: '田徑', 200: '自行車', 201: '室內自行車',
      300: '游泳', 301: '開放水域', 400: '有氧運動', 402: '力量訓練', 10000: '鐵人三項',
    };
  }
}
