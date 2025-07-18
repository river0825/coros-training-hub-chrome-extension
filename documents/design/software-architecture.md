# COROS Chrome Extension - Software Architecture Design

## 概述

基於 COROS 活動資料提取與日曆總覽功能的 Chrome Extension 軟體架構設計文件。採用 Clean Architecture 原則與 TypeScript 實作，提供可維護、可測試的企業級架構。

## 1. 整體架構模式

- **Architecture Pattern**: Clean Architecture + Domain-Driven Design (DDD)
- **Programming Language**: TypeScript with strict type checking
- **Deployment Model**: Chrome Extension (Manifest V3)
- **Testing Strategy**: BDD-style tests with Jest

## 2. Clean Architecture 分層設計

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│    (Chrome Extension UI & Controllers)  │
├─────────────────────────────────────────┤
│         Application Layer               │
│     (Use Cases & Application Services)  │
├─────────────────────────────────────────┤
│         Infrastructure Layer            │
│   (API Adapters, Storage, Repositories) │
├─────────────────────────────────────────┤
│            Domain Layer                 │
│  (Entities, Value Objects, Services)    │
└─────────────────────────────────────────┘
```

## 3. 領域模型設計 (Domain Layer)

### 3.1 核心實體 (Entities)

```typescript
// 活動實體
class Activity {
  constructor(
    private readonly id: ActivityId,
    private readonly dateTime: DateTime,
    private readonly sportType: SportType,
    private readonly distance: Distance,
    private readonly duration: Duration,
    private readonly calories: Calories
  ) {}

  // 業務邏輯方法
  isInMonth(year: number, month: number): boolean
  isSameDate(other: Activity): boolean
  calculatePace(): number
}

// 日曆實體
class Calendar {
  constructor(
    private readonly year: number,
    private readonly month: number,
    private readonly activities: Activity[]
  ) {}

  // 業務邏輯方法
  getDaysInMonth(): number
  getFirstDayOfWeek(): number
  getActivitiesForDate(date: Date): Activity[]
}

// 統計實體
class Statistics {
  constructor(
    private readonly activities: Activity[],
    private readonly period: { year: number; month: number }
  ) {}

  // 統計業務邏輯
  getTotalDistance(): Distance
  getTotalDuration(): Duration
  getActivityCount(): number
  getStatsByType(): Map<SportType, StatisticsSummary>
}
```

### 3.2 值物件 (Value Objects)

```typescript
// 活動 ID
class ActivityId {
  constructor(private readonly value: string) {
    if (!value) throw new Error('Activity ID cannot be empty');
  }
  
  toString(): string { return this.value; }
  equals(other: ActivityId): boolean { return this.value === other.value; }
}

// 日期時間
class DateTime {
  constructor(private readonly value: Date) {
    if (!value || isNaN(value.getTime())) {
      throw new Error('Invalid date');
    }
  }
  
  toISOString(): string { return this.value.toISOString(); }
  getYear(): number { return this.value.getFullYear(); }
  getMonth(): number { return this.value.getMonth(); }
  getDate(): number { return this.value.getDate(); }
  isSameDate(other: DateTime): boolean
}

// 距離
class Distance {
  constructor(private readonly meters: number) {
    if (meters < 0) throw new Error('Distance cannot be negative');
  }
  
  toKilometers(): number { return this.meters / 1000; }
  toMeters(): number { return this.meters; }
  add(other: Distance): Distance { return new Distance(this.meters + other.meters); }
}

// 運動類型
class SportType {
  constructor(private readonly code: number) {}
  
  getName(): string { return SportType.getNameByCode(this.code); }
  getIcon(): string { return SportType.getIconByCode(this.code); }
  getColor(): string { return SportType.getColorByCode(this.code); }
  
  static getNameByCode(code: number): string {
    // 運動類型對應邏輯
  }
}
```

### 3.3 領域服務 (Domain Services)

```typescript
// 活動聚合服務
class ActivityAggregationService {
  groupByDate(activities: Activity[]): Map<string, Activity[]>
  groupBySportType(activities: Activity[]): Map<SportType, Activity[]>
  filterByMonth(activities: Activity[], year: number, month: number): Activity[]
}

// 統計計算服務
class StatisticsCalculationService {
  calculateMonthlyStats(activities: Activity[], year: number, month: number): Statistics
  calculateDailyAverages(activities: Activity[]): DailyAverages
  calculateTrends(activities: Activity[]): TrendAnalysis
}

// 日曆渲染服務
class CalendarRenderingService {
  generateCalendarData(year: number, month: number, activities: Activity[]): CalendarData
  generateMonthNavigation(currentYear: number, currentMonth: number): NavigationData
}
```

## 4. 應用層設計 (Application Layer)

### 4.1 用例 (Use Cases)

```typescript
// 載入月度活動用例
class LoadMonthlyActivitiesUseCase {
  constructor(
    private readonly activityRepository: ActivityRepository,
    private readonly cacheRepository: CacheRepository
  ) {}

  async execute(year: number, month: number): Promise<Activity[]> {
    // 實現快取邏輯
    const isCurrentMonth = this.isCurrentMonth(year, month);
    
    if (!isCurrentMonth) {
      const cached = await this.cacheRepository.getActivities(year, month);
      if (cached) return cached;
    }
    
    const activities = await this.activityRepository.getActivitiesByMonth(year, month);
    
    if (!isCurrentMonth) {
      await this.cacheRepository.saveActivities(year, month, activities);
    }
    
    return activities;
  }
}

// 顯示日曆用例
class DisplayCalendarUseCase {
  constructor(
    private readonly loadActivitiesUseCase: LoadMonthlyActivitiesUseCase,
    private readonly calendarRenderingService: CalendarRenderingService
  ) {}

  async execute(year: number, month: number): Promise<CalendarViewModel> {
    const activities = await this.loadActivitiesUseCase.execute(year, month);
    const calendarData = this.calendarRenderingService.generateCalendarData(year, month, activities);
    
    return {
      year,
      month,
      calendarData,
      activities
    };
  }
}

// 計算統計用例
class CalculateStatisticsUseCase {
  constructor(
    private readonly statisticsCalculationService: StatisticsCalculationService
  ) {}

  async execute(activities: Activity[], year: number, month: number): Promise<StatisticsViewModel> {
    const statistics = this.statisticsCalculationService.calculateMonthlyStats(activities, year, month);
    
    return {
      totalDistance: statistics.getTotalDistance().toKilometers(),
      totalDuration: statistics.getTotalDuration().toHours(),
      activityCount: statistics.getActivityCount(),
      statsByType: statistics.getStatsByType()
    };
  }
}
```

### 4.2 應用服務 (Application Services)

```typescript
// 活動應用服務
class ActivityApplicationService {
  constructor(
    private readonly loadMonthlyActivitiesUseCase: LoadMonthlyActivitiesUseCase,
    private readonly calculateStatisticsUseCase: CalculateStatisticsUseCase
  ) {}

  async getMonthlyData(year: number, month: number): Promise<MonthlyDataViewModel> {
    const activities = await this.loadMonthlyActivitiesUseCase.execute(year, month);
    const statistics = await this.calculateStatisticsUseCase.execute(activities, year, month);
    
    return {
      activities,
      statistics
    };
  }
}

// 日曆應用服務
class CalendarApplicationService {
  constructor(
    private readonly displayCalendarUseCase: DisplayCalendarUseCase,
    private readonly activityApplicationService: ActivityApplicationService
  ) {}

  async displayMonth(year: number, month: number): Promise<CalendarPageViewModel> {
    const calendarData = await this.displayCalendarUseCase.execute(year, month);
    const monthlyData = await this.activityApplicationService.getMonthlyData(year, month);
    
    return {
      calendar: calendarData,
      statistics: monthlyData.statistics
    };
  }
}
```

## 5. 基礎設施層設計 (Infrastructure Layer)

### 5.1 API 適配器

```typescript
// COROS API 適配器
class CorosApiAdapter {
  constructor(private readonly baseUrl: string = 'https://teamapi.coros.com') {}

  async fetchActivities(token: string, page: number, size: number): Promise<ActivityDTO[]> {
    const response = await fetch(`${this.baseUrl}/activity/query`, {
      headers: {
        'accesstoken': token,
        'accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new ApiError(`Failed to fetch activities: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data.dataList;
  }
}
```

### 5.2 儲存適配器

```typescript
// Chrome 儲存適配器
class ChromeStorageAdapter {
  async save(key: string, data: any): Promise<void> {
    await chrome.storage.local.set({ [key]: data });
  }

  async load(key: string): Promise<any> {
    const result = await chrome.storage.local.get([key]);
    return result[key];
  }

  async remove(key: string): Promise<void> {
    await chrome.storage.local.remove([key]);
  }
}
```

### 5.3 儲存庫實作

```typescript
// 活動儲存庫實作
class ActivityRepositoryImpl implements ActivityRepository {
  constructor(
    private readonly apiAdapter: CorosApiAdapter,
    private readonly authService: AuthService
  ) {}

  async getActivitiesByMonth(year: number, month: number): Promise<Activity[]> {
    const token = await this.authService.getToken();
    const dtos = await this.apiAdapter.fetchActivities(token, 1, 300);
    
    return dtos
      .filter(dto => this.isInMonth(dto, year, month))
      .map(dto => this.mapToActivity(dto));
  }

  private mapToActivity(dto: ActivityDTO): Activity {
    return new Activity(
      new ActivityId(dto.id),
      new DateTime(this.parseDate(dto.date)),
      new SportType(dto.sportType),
      new Distance(dto.distance),
      new Duration(dto.totalTime),
      new Calories(dto.calories)
    );
  }
}
```

## 6. 表現層設計 (Presentation Layer)

### 6.1 控制器

```typescript
// 內容腳本控制器
class ContentScriptController {
  constructor(
    private readonly calendarApplicationService: CalendarApplicationService,
    private readonly dependencyContainer: DependencyContainer
  ) {}

  async initialize(): Promise<void> {
    await this.injectCalendarTab();
    await this.setupEventListeners();
  }

  private async handleMonthNavigation(year: number, month: number): Promise<void> {
    const viewModel = await this.calendarApplicationService.displayMonth(year, month);
    this.renderCalendarView(viewModel);
  }

  private renderCalendarView(viewModel: CalendarPageViewModel): void {
    const container = document.getElementById('calendar-container');
    container.innerHTML = this.buildCalendarHtml(viewModel);
  }
}

// 後台腳本控制器
class BackgroundScriptController {
  constructor(
    private readonly configurationService: ConfigurationService
  ) {}

  async initialize(): Promise<void> {
    await this.setupMessageListeners();
    await this.setupContextMenus();
  }

  private async handleMessage(message: Message): Promise<any> {
    switch (message.type) {
      case 'GET_CONFIGURATION':
        return await this.configurationService.getConfiguration();
      case 'UPDATE_CONFIGURATION':
        return await this.configurationService.updateConfiguration(message.data);
      default:
        throw new Error(`Unknown message type: ${message.type}`);
    }
  }
}
```

## 7. 依賴注入設計

```typescript
// 依賴注入容器
class DependencyContainer {
  private instances = new Map<string, any>();

  register<T>(token: string, factory: () => T): void {
    this.instances.set(token, factory);
  }

  resolve<T>(token: string): T {
    const factory = this.instances.get(token);
    if (!factory) {
      throw new Error(`No factory registered for token: ${token}`);
    }
    return factory();
  }
}

// 容器配置
class ContainerConfig {
  static configure(container: DependencyContainer): void {
    // 基礎設施層
    container.register('CorosApiAdapter', () => new CorosApiAdapter());
    container.register('ChromeStorageAdapter', () => new ChromeStorageAdapter());
    
    // 儲存庫
    container.register('ActivityRepository', () => new ActivityRepositoryImpl(
      container.resolve('CorosApiAdapter'),
      container.resolve('AuthService')
    ));
    
    // 領域服務
    container.register('ActivityAggregationService', () => new ActivityAggregationService());
    container.register('StatisticsCalculationService', () => new StatisticsCalculationService());
    
    // 用例
    container.register('LoadMonthlyActivitiesUseCase', () => new LoadMonthlyActivitiesUseCase(
      container.resolve('ActivityRepository'),
      container.resolve('CacheRepository')
    ));
    
    // 應用服務
    container.register('CalendarApplicationService', () => new CalendarApplicationService(
      container.resolve('DisplayCalendarUseCase'),
      container.resolve('ActivityApplicationService')
    ));
    
    // 控制器
    container.register('ContentScriptController', () => new ContentScriptController(
      container.resolve('CalendarApplicationService'),
      container
    ));
  }
}
```

## 8. 測試策略

### 8.1 測試金字塔

```
    ┌─────────────┐
    │  E2E Tests  │  Integration tests with Chrome APIs
    ├─────────────┤
    │   Unit Tests │  Domain logic and use cases
    ├─────────────┤
    │  BDD Tests   │  Behavior-driven development
    └─────────────┘
```

### 8.2 測試覆蓋率

- **Domain Layer**: 90%+ 覆蓋率，純函數測試
- **Application Layer**: 用例測試，模擬依賴項
- **Infrastructure Layer**: 整合測試，Chrome API 測試
- **Presentation Layer**: UI 組件測試

### 8.3 測試範例

```typescript
// BDD 樣式測試
describe('Activity Entity', () => {
  describe('Given an activity with valid data', () => {
    const activity = new Activity(
      new ActivityId('123'),
      DateTime.fromString('2025-01-15'),
      new SportType(100),
      new Distance(5000),
      new Duration(1800),
      new Calories(300)
    );

    describe('When checking if activity is in January 2025', () => {
      it('Then it should return true', () => {
        expect(activity.isInMonth(2025, 0)).toBe(true);
      });
    });

    describe('When calculating pace', () => {
      it('Then it should return correct pace per kilometer', () => {
        expect(activity.calculatePace()).toBeCloseTo(360); // 6 min/km
      });
    });
  });
});
```

## 9. 效能優化策略

### 9.1 智能快取機制

```typescript
class CacheStrategy {
  // 非當月資料快取策略
  async getCachedData(year: number, month: number): Promise<Activity[] | null> {
    const isCurrentMonth = this.isCurrentMonth(year, month);
    
    if (isCurrentMonth) {
      // 當月資料永遠從 API 獲取
      return null;
    }
    
    // 非當月資料優先使用快取
    const cacheKey = `activities-${year}-${month}`;
    return await this.storageAdapter.load(cacheKey);
  }
  
  async saveToCache(year: number, month: number, data: Activity[]): Promise<void> {
    const isCurrentMonth = this.isCurrentMonth(year, month);
    
    if (!isCurrentMonth) {
      const cacheKey = `activities-${year}-${month}`;
      await this.storageAdapter.save(cacheKey, data);
    }
  }
}
```

### 9.2 渲染優化

- **虛擬 DOM**: 最小化實際 DOM 操作
- **批次更新**: 將 DOM 更新合併為批次操作
- **延遲載入**: 按需載入日曆資料
- **記憶化**: 快取計算結果

### 9.3 記憶體管理

```typescript
class MemoryManager {
  private eventListeners: Map<string, Function[]> = new Map();
  
  cleanup(): void {
    // 清理事件監聽器
    this.eventListeners.forEach((listeners, element) => {
      listeners.forEach(listener => {
        document.removeEventListener(element, listener);
      });
    });
    this.eventListeners.clear();
    
    // 清理定時器
    this.clearAllTimers();
    
    // 清理快取
    this.clearCache();
  }
}
```

## 10. 部署架構

### 10.1 Chrome Extension 架構

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chrome Store  │    │  User Browser   │    │   COROS API     │
│                 │    │                 │    │                 │
│  Extension      │───▶│  Service Worker │───▶│  Activity Data  │
│  Package        │    │  Content Script │    │                 │
│                 │    │  Popup UI       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 10.2 建置流程

```typescript
// 建置配置
const buildConfig = {
  entry: {
    background: './src/presentation/chrome/background.ts',
    content: './src/presentation/chrome/content.ts',
    popup: './src/presentation/chrome/popup.ts'
  },
  output: {
    path: './dist',
    filename: '[name].js'
  },
  optimization: {
    minimize: true,
    splitChunks: false // Chrome Extension 不支援程式碼分割
  }
};
```

## 11. 安全性設計

### 11.1 權限最小化

```json
{
  "permissions": [
    "activeTab",
    "scripting",
    "storage",
    "contextMenus",
    "cookies"
  ],
  "host_permissions": [
    "https://t.coros.com/*",
    "https://teamapi.coros.com/*"
  ]
}
```

### 11.2 資料安全

- **本地處理**: 所有資料僅在本地端處理
- **加密儲存**: 敏感資料使用 Chrome 安全儲存
- **令牌管理**: 安全的身份驗證令牌處理
- **輸入驗證**: 嚴格的輸入驗證與清理

### 11.3 內容安全政策

```typescript
class SecurityPolicy {
  static readonly CSP_RULES = {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", "data:", "https:"],
    'connect-src': ["'self'", "https://teamapi.coros.com"]
  };
  
  static validateInput(input: string): boolean {
    // 輸入驗證邏輯
    return this.sanitizeHtml(input) === input;
  }
}
```

## 12. 監控與錯誤處理

### 12.1 錯誤處理策略

```typescript
class ErrorHandler {
  static handleDomainError(error: DomainError): void {
    console.error('[Domain Error]', error.message);
    // 記錄領域錯誤
  }
  
  static handleInfrastructureError(error: InfrastructureError): void {
    console.error('[Infrastructure Error]', error.message);
    // 處理基礎設施錯誤
  }
  
  static handleUnexpectedError(error: Error): void {
    console.error('[Unexpected Error]', error);
    // 處理未預期錯誤
  }
}
```

### 12.2 日誌記錄

```typescript
class Logger {
  private static instance: Logger;
  
  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data);
    }
  }
  
  info(message: string, data?: any): void {
    console.info(`[INFO] ${message}`, data);
  }
  
  error(message: string, error?: Error): void {
    console.error(`[ERROR] ${message}`, error);
  }
}
```

## 13. 未來擴展方向

### 13.1 技術演進

- **Progressive Web App**: 支援 PWA 特性
- **WebAssembly**: 效能關鍵部分使用 WASM
- **AI 整合**: 智能活動分析與建議
- **雲端同步**: 多設備資料同步

### 13.2 功能擴展

- **多語言支援**: 國際化功能
- **主題系統**: 可自訂 UI 主題
- **進階分析**: 趨勢分析與預測
- **社群功能**: 活動分享與比較

---

**文件版本**: 2.0  
**建立日期**: 2025-06-06  
**最後更新**: 2025-07-18  
**架構版本**: TypeScript Clean Architecture
