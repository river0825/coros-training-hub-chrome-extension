// COROS Chrome Extension 主應用程式入口
// 負責協調各模組初始化與運作

import { AuthManager } from './AuthManager.js';
import { CorosApiAdapter } from './CorosApiAdapter.js';
import { ActivityDataProcessor } from './ActivityDataProcessor.js';
import { UIManager } from './UIManager.js';
import { EventHandler } from './EventHandler.js';

export class CorosExtensionApp {
  constructor() {
    this.authManager = new AuthManager();
    this.apiAdapter = new CorosApiAdapter();
    this.dataProcessor = new ActivityDataProcessor();
    this.uiManager = new UIManager();
    this.eventHandler = new EventHandler(this.uiManager);
  }

  async initialize() {
    try {
      const token = await this.authManager.getAuthToken();
      if (!token) {
        this.uiManager.showError('無法取得認證令牌');
        return;
      }
      const activities = await this.loadActivities(token);
      await this.uiManager.initialize(activities);
      this.eventHandler.bindEvents();
    } catch (error) {
      this.uiManager.showError('應用程式初始化失敗: ' + error);
    }
  }

  async loadActivities(token) {
    const rawData = await this.apiAdapter.fetchActivities(token);
    return this.dataProcessor.processActivities(rawData);
  }
}
