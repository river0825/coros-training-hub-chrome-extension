// Configuration constants for COROS Training Hub Chrome Extension

export const API_CONFIG = {
  baseUrl: 'https://teamapi.coros.com',
  timeout: 5000,
  retryAttempts: 3,
  retryDelay: 1000,
  endpoints: {
    activities: '/activity/query'
  }
};

export const STORAGE_CONFIG = {
  prefix: 'coros_activities_',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  maxEntries: 50, // Maximum number of cached month entries
  version: '1.0'
};

export const SPORT_TYPES = {
  running: { icon: '🏃', color: '#FF6B6B', name: 'Running' },
  cycling: { icon: '🚴', color: '#4ECDC4', name: 'Cycling' },
  swimming: { icon: '🏊', color: '#45B7D1', name: 'Swimming' },
  hiking: { icon: '🥾', color: '#96CEB4', name: 'Hiking' },
  walking: { icon: '🚶', color: '#FECA57', name: 'Walking' },
  strength: { icon: '💪', color: '#FF9FF3', name: 'Strength Training' },
  yoga: { icon: '🧘', color: '#A8E6CF', name: 'Yoga' },
  indoor_cycling: { icon: '🏋️', color: '#6C7CE0', name: 'Indoor Cycling' },
  treadmill: { icon: '🏃', color: '#FF8A80', name: 'Treadmill' },
  elliptical: { icon: '⚡', color: '#81C784', name: 'Elliptical' },
  rowing: { icon: '🚣', color: '#4DB6AC', name: 'Rowing' },
  skiing: { icon: '⛷️', color: '#E1F5FE', name: 'Skiing' },
  snowboarding: { icon: '🏂', color: '#B3E5FC', name: 'Snowboarding' },
  other: { icon: '⚡', color: '#95A5A6', name: 'Other' }
};

export const SPORT_ICON_MAP = {
  100: { icon: 'icon-outrun', color: 'rgb(248, 192, 50)', dataSport: 100 },
  101: { icon: 'icon-indoor_run', color: 'rgb(248, 192, 50)', dataSport: 101 },
  102: { icon: 'icon-trailrun', color: 'rgb(248, 192, 50)', dataSport: 102 },
  103: { icon: 'icon-groundrun', color: 'rgb(248, 192, 50)', dataSport: 103 },
  104: { icon: 'icon-hike', color: 'rgb(250, 225, 60)', dataSport: 104 },
  105: { icon: 'icon-climb', color: 'rgb(48, 201, 202)', dataSport: 105 },
  200: { icon: 'icon-cycle', color: 'rgb(28, 181, 64)', dataSport: 200 },
  201: { icon: 'icon-indoor_bike', color: 'rgb(28, 181, 64)', dataSport: 201 },
  202: { icon: 'icon-road-ebike', color: 'rgb(28, 181, 64)', dataSport: 202 },
  203: { icon: 'icon-gravel-road-riding', color: 'rgb(28, 181, 64)', dataSport: 203 },
  204: { icon: 'icon-mountain-riding', color: 'rgb(28, 181, 64)', dataSport: 204 },
  205: { icon: 'icon-mteb', color: 'rgb(28, 181, 64)', dataSport: 205 },
  299: { icon: 'icon-cycle', color: 'rgb(28, 181, 64)', dataSport: 299 },
  300: { icon: 'icon-poolswim', color: 'rgb(48, 112, 255)', dataSport: 300 },
  301: { icon: 'icon-openwater', color: 'rgb(48, 112, 255)', dataSport: 301 },
  400: { icon: 'icon-Indoor_erobics', color: 'rgb(217, 46, 218)', dataSport: 400 },
  401: { icon: 'icon-outdoor_aerobics', color: 'rgb(217, 46, 218)', dataSport: 401 },
  402: { icon: 'icon-strength', color: 'rgb(217, 46, 218)', dataSport: 402 },
  800: { icon: 'icon-indoor_climb', color: 'rgb(48, 201, 202)', dataSport: 800 },
  801: { icon: 'icon-bouldering_w', color: 'rgb(48, 201, 202)', dataSport: 801 },
  900: { icon: 'icon-walk', color: 'rgb(250, 225, 60)', dataSport: 900 },
  901: { icon: 'icon-jump', color: 'rgb(217, 46, 218)', dataSport: 901 },
  10000: { icon: 'icon-triathlon', color: 'rgb(255, 159, 64)', dataSport: 10000 },
  10003: { icon: 'icon-PitchClimb', color: 'rgb(48, 201, 202)', dataSport: 10003 },
  other: { icon: 'icon-other', color: 'rgb(200, 200, 200)', dataSport: '' }
};

export const SPORT_TYPE_MAP = {
  100: 'running',        // 跑步
  101: 'running',        // 室內跑步
  102: 'running',        // 越野跑
  103: 'running',        // 田徑
  104: 'walking',        // 步行
  105: 'hiking',         // 爬山
  200: 'cycling',        // 自行車
  201: 'indoor_cycling', // 室內自行車
  202: 'cycling',        // 電動自行車
  203: 'cycling',        // 礫石路騎行
  204: 'cycling',        // 山地騎行
  205: 'cycling',        // 電動山地車
  299: 'cycling',        // 其他騎行
  300: 'swimming',       // 泳池游泳
  301: 'swimming',       // 開放水域
  400: 'other',          // 有氧運動
  401: 'other',          // 戶外有氧
  402: 'strength',       // 力量訓練
  800: 'hiking',         // 室內攀岩
  801: 'hiking',         // 抱石
  900: 'walking',        // 步行
  901: 'other',          // 跳躍
  10000: 'other',        // 鐵人三項
  10003: 'hiking'        // 攀岩
};

export const UI_CONFIG = {
  calendar: {
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
  },
  theme: {
    colors: {
      primary: '#ffb300',
      background: '#181a1b',
      foreground: '#f5f6fa',
      cellBackground: '#232527',
      cellHover: '#292b2e',
      border: '#333'
    }
  },
  extension: {
    containerClass: 'coros-extension-container',
    tabClass: 'coros-tab-btn',
    activeTabClass: 'active'
  }
};

export const CACHE_STRATEGY = {
  ALWAYS_REFRESH: 'always_refresh',
  CACHE_CURRENT_MONTH: 'cache_current_month',
  CACHE_PAST_MONTHS: 'cache_past_months'
};