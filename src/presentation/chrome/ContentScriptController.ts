import { getContainer } from '@shared/container/ContainerConfig';
import { CalendarApplicationService } from '@application/services/CalendarApplicationService';
import { StatisticsApplicationService } from '@application/services/StatisticsApplicationService';
import { ExtensionState } from '@shared/types/ViewModels';

// Extension state manager
class ExtensionStateManager {
  private state: ExtensionState = {
    isInitialized: false,
    currentView: 'calendar',
    currentDate: new Date(),
    isLoading: false
  };

  isInitialized(): boolean {
    return this.state.isInitialized;
  }

  markAsInitialized(): void {
    this.state.isInitialized = true;
  }

  getCurrentView(): 'calendar' | 'statistics' {
    return this.state.currentView;
  }

  setCurrentView(view: 'calendar' | 'statistics'): void {
    this.state.currentView = view;
  }

  getCurrentDate(): Date {
    return this.state.currentDate;
  }

  setCurrentDate(date: Date): void {
    this.state.currentDate = date;
  }

  isLoading(): boolean {
    return this.state.isLoading;
  }

  setLoading(loading: boolean): void {
    this.state.isLoading = loading;
  }
}

// Content Script Controller
export class ContentScriptController {
  private container = getContainer();
  private stateManager = new ExtensionStateManager();

  async initialize(): Promise<void> {
    if (this.stateManager.isInitialized()) {
      return;
    }

    try {
      if (!this.isCorosPage()) {
        return;
      }

      await this.injectUI();
      this.bindGlobalEventListeners();
      this.stateManager.markAsInitialized();

      console.log('COROS Activity Calendar extension initialized');
    } catch (error) {
      console.error('Failed to initialize COROS extension:', error);
    }
  }

  private isCorosPage(): boolean {
    return window.location.hostname.includes('coros.com') &&
           (window.location.pathname.includes('/activities') ||
            window.location.pathname.includes('/admin/views/activities'));
  }

  private async injectUI(): Promise<void> {
    const injectionPoint = this.findInjectionPoint();
    if (!injectionPoint) {
      console.warn('Could not find injection point for COROS extension');
      return;
    }

    const extensionContainer = this.createExtensionContainer();
    injectionPoint.appendChild(extensionContainer);

    await this.renderInitialView();
  }

  private findInjectionPoint(): HTMLElement | null {
    // Look for common injection points on COROS website
    const selectors = [
      '.main-content',
      '.content-area',
      '#app',
      '.container',
      'main',
      'body'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        return element;
      }
    }

    return null;
  }

  private createExtensionContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'coros-calendar-extension';
    container.style.cssText = `
      margin: 20px 0;
      padding: 20px;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Create tabs
    const tabContainer = document.createElement('div');
    tabContainer.className = 'coros-tabs';
    tabContainer.style.cssText = `
      display: flex;
      border-bottom: 1px solid #e0e0e0;
      margin-bottom: 20px;
    `;

    const calendarTab = this.createTab('calendar', 'Calendar', true);
    const statisticsTab = this.createTab('statistics', 'Statistics', false);

    tabContainer.appendChild(calendarTab);
    tabContainer.appendChild(statisticsTab);

    // Create content area
    const contentContainer = document.createElement('div');
    contentContainer.id = 'coros-content';
    contentContainer.style.cssText = `
      min-height: 400px;
      position: relative;
    `;

    container.appendChild(tabContainer);
    container.appendChild(contentContainer);

    return container;
  }

  private createTab(id: string, text: string, active: boolean): HTMLElement {
    const tab = document.createElement('button');
    tab.id = `coros-tab-${id}`;
    tab.textContent = text;
    tab.dataset['tab'] = id;
    tab.className = active ? 'coros-tab active' : 'coros-tab';
    tab.style.cssText = `
      padding: 12px 24px;
      border: none;
      background: ${active ? '#007bff' : 'transparent'};
      color: ${active ? '#ffffff' : '#666666'};
      cursor: pointer;
      border-radius: 4px 4px 0 0;
      margin-right: 8px;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
    `;

    tab.addEventListener('click', () => this.switchTab(id as 'calendar' | 'statistics'));

    return tab;
  }

  private async switchTab(tabId: 'calendar' | 'statistics'): Promise<void> {
    this.stateManager.setCurrentView(tabId);
    this.updateTabAppearance(tabId);
    await this.renderCurrentView();
  }

  private updateTabAppearance(activeTab: string): void {
    const tabs = document.querySelectorAll('.coros-tab');
    tabs.forEach(tab => {
      const isActive = tab.getAttribute('data-tab') === activeTab;
      (tab as HTMLElement).className = isActive ? 'coros-tab active' : 'coros-tab';
      (tab as HTMLElement).style.background = isActive ? '#007bff' : 'transparent';
      (tab as HTMLElement).style.color = isActive ? '#ffffff' : '#666666';
    });
  }

  private async renderInitialView(): Promise<void> {
    await this.renderCurrentView();
  }

  private async renderCurrentView(): Promise<void> {
    const contentContainer = document.getElementById('coros-content');
    if (!contentContainer) {
      return;
    }

    this.stateManager.setLoading(true);
    this.showLoadingState(contentContainer);

    try {
      const currentView = this.stateManager.getCurrentView();
      const currentDate = this.stateManager.getCurrentDate();

      if (currentView === 'calendar') {
        await this.renderCalendarView(contentContainer, currentDate);
      } else {
        await this.renderStatisticsView(contentContainer, currentDate);
      }
    } catch (error) {
      this.showErrorState(contentContainer, error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.stateManager.setLoading(false);
    }
  }

  private async renderCalendarView(container: HTMLElement, date: Date): Promise<void> {
    const calendarService = this.container.resolve<CalendarApplicationService>('CalendarApplicationService');
    const viewModel = await calendarService.displayCalendar(date.getFullYear(), date.getMonth());
    
    container.innerHTML = this.generateCalendarHTML(viewModel);
  }

  private async renderStatisticsView(container: HTMLElement, date: Date): Promise<void> {
    const statisticsService = this.container.resolve<StatisticsApplicationService>('StatisticsApplicationService');
    const viewModel = await statisticsService.calculateMonthlyStatistics(date.getFullYear(), date.getMonth());
    
    container.innerHTML = this.generateStatisticsHTML(viewModel);
  }

  private generateCalendarHTML(viewModel: any): string {
    return `
      <div class="coros-calendar">
        <div class="calendar-header">
          <h3>${viewModel.monthName} ${viewModel.year}</h3>
        </div>
        <div class="calendar-grid">
          ${viewModel.days.map((day: any) => `
            <div class="calendar-day ${day.isCurrentMonth ? 'current-month' : 'other-month'} ${day.isToday ? 'today' : ''}">
              <div class="day-number">${day.date}</div>
              <div class="day-activities">
                ${day.activities.map((activity: any) => `
                  <div class="activity-indicator" style="background-color: ${activity.sportType.color};">
                    ${activity.sportType.icon}
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        <div class="calendar-summary">
          <div class="summary-item">
            <span class="label">Total Activities:</span>
            <span class="value">${viewModel.summary.totalActivities}</span>
          </div>
          <div class="summary-item">
            <span class="label">Total Distance:</span>
            <span class="value">${viewModel.summary.totalDistance}</span>
          </div>
          <div class="summary-item">
            <span class="label">Active Days:</span>
            <span class="value">${viewModel.summary.activeDays}</span>
          </div>
        </div>
      </div>
    `;
  }

  private generateStatisticsHTML(viewModel: any): string {
    return `
      <div class="coros-statistics">
        <div class="stats-header">
          <h3>Statistics for ${viewModel.period}</h3>
        </div>
        <div class="stats-overview">
          <div class="stat-card">
            <div class="stat-value">${viewModel.overall.totalActivities}</div>
            <div class="stat-label">Total Activities</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${viewModel.overall.totalDistance}</div>
            <div class="stat-label">Total Distance</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${viewModel.overall.activeDays}</div>
            <div class="stat-label">Active Days</div>
          </div>
        </div>
        <div class="stats-by-sport">
          ${viewModel.bySport.map((sport: any) => `
            <div class="sport-stat">
              <div class="sport-icon" style="background-color: ${sport.color};">${sport.icon}</div>
              <div class="sport-details">
                <div class="sport-name">${sport.sportType}</div>
                <div class="sport-metrics">
                  ${sport.count} activities • ${sport.distance} • ${sport.duration}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private showLoadingState(container: HTMLElement): void {
    container.innerHTML = `
      <div class="coros-loading">
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading...</div>
      </div>
    `;
  }

  private showErrorState(container: HTMLElement, message: string): void {
    container.innerHTML = `
      <div class="coros-error">
        <div class="error-icon">⚠️</div>
        <div class="error-message">${message}</div>
        <button onclick="location.reload()" class="retry-button">Retry</button>
      </div>
    `;
  }

  private bindGlobalEventListeners(): void {
    // Listen for navigation events
    window.addEventListener('popstate', () => {
      if (this.isCorosPage()) {
        this.renderCurrentView();
      }
    });

    // Listen for extension-specific events
    document.addEventListener('corosExtensionRefresh', () => {
      this.renderCurrentView();
    });
  }
}

// Initialize extension when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const controller = new ContentScriptController();
    controller.initialize();
  });
} else {
  const controller = new ContentScriptController();
  controller.initialize();
}