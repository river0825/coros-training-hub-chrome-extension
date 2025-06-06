# COROS Chrome Extension - Software Architecture Design

## 概述

基於 COROS 活動資料提取與日曆總覽功能的 Chrome Extension 軟體架構設計文件。

## 1. 整體架構模式

- **Architecture Pattern**: Layered Architecture + Content Script Pattern
- **Deployment Model**: Browser Extension (Chrome/Edge)

## 2. 系統分層設計

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
├─────────────────────────────────────────┤
│            Business Layer               │
├─────────────────────────────────────────┤
│           Integration Layer             │
├─────────────────────────────────────────┤
│            Data Access Layer            │
└─────────────────────────────────────────┘
```

## 3. 組件設計

### Presentation Layer

```javascript
// Components
- CalendarTabManager: 管理 Tab 切換邏輯
- CalendarView: 日曆 UI 渲染
- StatisticsView: 統計報表顯示
- ActivityIconRenderer: 運動類型圖示渲染
```

### Business Layer

```javascript
// Services
- ActivityDataProcessor: 活動資料格式化與處理
- CalendarLogicService: 日曆邏輯處理
- StatisticsCalculator: 統計計算服務
- DateTimeUtility: 日期時間工具
```

### Integration Layer

```javascript
// Adapters
- CorosApiAdapter: COROS API 整合適配器
- DomManipulator: DOM 操作適配器
- CookieManager: Cookie 管理器
```

### Data Access Layer

```javascript
// Repositories
- ActivityRepository: 活動資料存取
- ConfigurationRepository: 設定資料存取
- CacheManager: 快取管理
```

## 4. 核心模組設計

### 4.1 Data Flow Architecture

```
Cookie Token → API Request → Raw Data → Data Processing → UI Rendering
```

### 4.2 主要 Classes/Modules

```javascript
class CorosExtensionApp {
  constructor() {
    this.apiAdapter = new CorosApiAdapter();
    this.dataProcessor = new ActivityDataProcessor();
    this.calendarView = new CalendarView();
    this.tabManager = new CalendarTabManager();
  }
  
  async initialize() {
    const token = await this.getAuthToken();
    if (!token) return;
    
    const activities = await this.loadActivities(token);
    await this.injectCalendarUI(activities);
  }
}

class CorosApiAdapter {
  async fetchActivities(token, page = 1, size = 300) {
    // API 呼叫邏輯
  }
}

class ActivityDataProcessor {
  formatActivities(rawActivities) {
    // 資料格式化邏輯
  }
  
  groupActivitiesByDate(activities) {
    // 按日期分組邏輯
  }
}

class CalendarView {
  render(activities, currentMonth) {
    // 日曆 UI 渲染邏輯
  }
  
  generateMonthlyStats(activities) {
    // 月統計生成邏輯
  }
}

class CalendarTabManager {
  injectCalendarTab() {
    // Tab 注入邏輯
  }
  
  handleTabSwitch(tabType) {
    // Tab 切換邏輯
  }
}
```

## 5. Business Logic 分析

### 5.1 活動資料提取流程

1. **驗證階段**: 從 cookies 取得 `CPL-coros-token`
2. **API 呼叫**: 向 COROS API 請求活動資料
3. **資料處理**: 格式化日期、距離、時間等資料
4. **資料儲存**: 將處理後資料存入 `window.corosActivities`

### 5.2 日曆 UI 注入流程

1. **DOM 偵測**: 尋找「活動列表」Tab 位置
2. **UI 注入**: 複製並建立「日曆總覽」Tab
3. **事件綁定**: 設定 Tab 切換邏輯
4. **日曆渲染**: 生成月曆檢視與統計報表

## 6. 設計原則

### 6.1 SOLID 原則

- **Single Responsibility**: 每個類別專注單一職責
- **Open/Closed**: 可擴展新運動類型而不修改現有代碼
- **Dependency Inversion**: 依賴抽象介面而非具體實作

### 6.2 設計模式

- **Adapter Pattern**: CorosApiAdapter 適配外部 API
- **Observer Pattern**: UI 組件監聽資料變化
- **Factory Pattern**: 運動類型圖示工廠
- **Singleton Pattern**: 應用程式主實例

## 7. 非功能性需求

### 7.1 效能需求

- API 回應時間 < 3 秒
- UI 渲染時間 < 1 秒
- 記憶體使用 < 50MB

### 7.2 安全性需求

- Token 安全儲存
- API 請求加密
- XSS 防護

### 7.3 可用性需求

- 支援 Chrome/Edge 瀏覽器
- 響應式設計
- 錯誤處理與用戶友善提示

## 8. 部署架構

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chrome Store  │    │  User Browser   │    │   COROS API     │
│                 │    │                 │    │                 │
│  Extension      │───▶│  Content Script │───▶│  Activity Data  │
│  Package        │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 9. 模組職責對應表

| 模組 | 職責 | 對應現有程式碼 |
|------|------|----------------|
| CorosApiAdapter | API 資料取得 | extractActivitiesFromAPI() |
| ActivityDataProcessor | 資料格式化 | formatDate(), formatTime(), mapSport() |
| CalendarTabManager | Tab 管理 | injectCalendarTab() |
| CalendarView | 日曆渲染 | showCalendarTab() |
| StatisticsCalculator | 統計計算 | 月報表生成邏輯 |

## 10. 未來擴展方向

### 10.1 功能擴展

- 支援更多運動類型
- 年度統計檢視
- 資料匯出功能
- 目標設定與追蹤

### 10.2 技術改進

- TypeScript 重構
- 單元測試導入
- 效能優化
- 離線快取機制

---

**文件版本**: 1.0  
**建立日期**: 2025-06-06  
**最後更新**: 2025-06-06
