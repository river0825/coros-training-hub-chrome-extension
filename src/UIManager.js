// UI 管理器
import { CalendarView } from './CalendarView.js';
import { ActivityIconRenderer } from './ActivityIconRenderer.js';

export class UIManager {
  constructor() {
    this.calendarView = new CalendarView();
    this.iconRenderer = new ActivityIconRenderer();
    this.isInitialized = false;
  }

  async initialize(activities) {
    if (this.isInitialized) return;
    await this.injectStyles();
    this.calendarView.initialize(activities);
    this.isInitialized = true;
  }

  async injectStyles() {
    if (document.getElementById('coros-calendar-styles')) return;
    const styleElement = document.createElement('style');
    styleElement.id = 'coros-calendar-styles';
    styleElement.textContent = this.getCalendarStyles();
    document.head.appendChild(styleElement);
  }

  getCalendarStyles() {
    return `/* ...日曆樣式... */`;
  }

  showError(message) {
    alert(message);
  }
}
