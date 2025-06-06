// 運動圖示渲染器
export class ActivityIconRenderer {
  constructor() {
    this.sportIconMap = this.initializeSportIconMap();
  }
  initializeSportIconMap() {
    return {
      100: { icon: 'icon-outrun', color: 'rgb(248, 192, 50)' },
      103: { icon: 'icon-groundrun', color: 'rgb(255, 99, 132)' },
      200: { icon: 'icon-cycle', color: 'rgb(75, 192, 192)' },
      201: { icon: 'icon-indoor_bike', color: 'rgb(75, 192, 192)' },
      300: { icon: 'icon-poolswim', color: 'rgb(54, 162, 235)' },
      301: { icon: 'icon-openwater', color: 'rgb(0, 204, 204)' },
      400: { icon: 'icon-Indoor_erobics', color: 'rgb(217, 46, 218)' },
      402: { icon: 'icon-strength', color: 'rgb(153, 102, 255)' },
      10000: { icon: 'icon-triathlon', color: 'rgb(255, 159, 64)' },
      other: { icon: 'icon-other', color: 'rgb(200,200,200)' }
    };
  }
}
