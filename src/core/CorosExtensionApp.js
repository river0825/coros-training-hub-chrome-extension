// Main application class for COROS Training Hub Chrome Extension

import { StorageAdapter } from '../adapters/StorageAdapter.js';
import { CorosApiAdapter } from '../adapters/CorosApiAdapter.js';
import { DomAdapter } from '../adapters/DomAdapter.js';
import { ActivityRepository } from '../repositories/ActivityRepository.js';
import { ConfigRepository } from '../repositories/ConfigRepository.js';
import { ActivityDataProcessor } from '../services/ActivityDataProcessor.js';
import { CalendarService } from '../services/CalendarService.js';
import { StatisticsService } from '../services/StatisticsService.js';
import { CalendarView } from '../views/CalendarView.js';
import { StatisticsView } from '../views/StatisticsView.js';
import { getMonthKey, isCurrentMonth } from '../utils/dateUtils.js';
import { isCorosActivityPage } from '../utils/domUtils.js';
import { CACHE_STRATEGY } from '../config/constants.js';

/**
 * Main application class that coordinates all components
 */
export class CorosExtensionApp {
  constructor() {
    this.isInitialized = false;
    this.currentView = 'calendar';
    this.currentDate = new Date();
    this.activities = {};
    this.isLoading = false;
    
    // Initialize adapters
    this.storageAdapter = new StorageAdapter();
    this.apiAdapter = new CorosApiAdapter();
    this.domAdapter = new DomAdapter();
    
    // Initialize repositories
    this.activityRepository = new ActivityRepository(this.storageAdapter);
    this.configRepository = new ConfigRepository(this.storageAdapter);
    
    // Initialize services
    this.activityDataProcessor = new ActivityDataProcessor();
    this.calendarService = new CalendarService(this.activityDataProcessor);
    this.statisticsService = new StatisticsService(this.activityDataProcessor);
    
    // Initialize views
    this.calendarView = new CalendarView(this.calendarService, this.domAdapter);
    this.statisticsView = new StatisticsView(this.statisticsService, this.domAdapter);
    
    // Event listeners cleanup functions
    this.eventCleanupFunctions = [];
  }

  /**
   * Initialize the application
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('[CorosExtensionApp] Already initialized');
      return true;
    }

    try {
      console.log('[CorosExtensionApp] Starting initialization...');

      // Check if we're on the right page
      if (!isCorosActivityPage()) {
        console.log('[CorosExtensionApp] Not on COROS activity page, skipping initialization');
        return false;
      }

      // Initialize DOM adapter
      const domInitialized = await this.domAdapter.initialize();
      if (!domInitialized) {
        throw new Error('Failed to initialize DOM adapter');
      }

      // Create extension UI
      await this.createExtensionUI();

      // Initialize views
      this.calendarView.initialize();
      this.statisticsView.initialize();

      // Bind event listeners
      this.bindEventListeners();

      // Load initial data
      await this.loadInitialData();

      this.isInitialized = true;
      console.log('[CorosExtensionApp] Initialization completed successfully');
      return true;

    } catch (error) {
      console.error('[CorosExtensionApp] Initialization failed:', error);
      await this.handleInitializationError(error);
      return false;
    }
  }

  /**
   * Create extension UI
   * @private
   */
  async createExtensionUI() {
    try {
      // Inject styles
      const styles = await this.getExtensionStyles();
      this.domAdapter.injectStyles(styles, 'coros-extension-styles');

      // Create main container
      const container = this.domAdapter.createExtensionContainer('coros-calendar-extension');
      if (!container) {
        throw new Error('Failed to create extension container');
      }

      // Create tabs
      const tabs = [
        { id: 'calendar', label: 'Calendar', active: true },
        { id: 'statistics', label: 'Statistics', active: false }
      ];
      const tabContainer = this.domAdapter.createTabNavigation(tabs);
      
      // Create content container
      const contentContainer = this.domAdapter.createContentContainer('coros-extension-content');
      
      // Create loading indicator
      const loadingIndicator = this.domAdapter.createLoadingIndicator();

      // Assemble UI
      const headerContainer = this.domAdapter.createElement('div', {
        classes: ['coros-extension-header']
      });
      headerContainer.appendChild(tabContainer);

      container.appendChild(headerContainer);
      container.appendChild(contentContainer);
      container.appendChild(loadingIndicator);

      console.log('[CorosExtensionApp] Extension UI created successfully');
    } catch (error) {
      console.error('[CorosExtensionApp] Error creating extension UI:', error);
      throw error;
    }
  }

  /**
   * Bind event listeners
   * @private
   */
  bindEventListeners() {
    // Main click event listener
    const clickCleanup = this.domAdapter.addEventListener(document, 'click', (e) => {
      const target = e.target;

      if (target.id === 'coros-refresh-btn') {
        this.handleRefreshData();
      } else if (target.classList.contains('coros-tab-btn')) {
        this.handleTabSwitch(target.dataset.tab);
      } else if (target.classList.contains('coros-calendar-nav')) {
        this.handleCalendarNavigation(target.dataset.action);
      }
    });

    // View mode change listener
    const changeCleanup = this.domAdapter.addEventListener(document, 'change', (e) => {
      if (e.target.id === 'coros-view-mode') {
        this.handleViewModeChange(e.target.value);
      }
    });

    // Store cleanup functions
    this.eventCleanupFunctions.push(clickCleanup, changeCleanup);
  }

  /**
   * Load initial data
   * @private
   */
  async loadInitialData() {
    try {
      const defaultDate = this.calendarService.getDefaultDate();
      this.currentDate = new Date(defaultDate.year, defaultDate.month);
      
      await this.loadMonthData(defaultDate.year, defaultDate.month);
      this.showCalendarView();
      
      console.log('[CorosExtensionApp] Initial data loaded successfully');
    } catch (error) {
      console.error('[CorosExtensionApp] Error loading initial data:', error);
      this.showErrorState(`Failed to load initial data: ${error.message}`);
    }
  }

  /**
   * Load data for specific month
   * @param {number} year - Year
   * @param {number} month - Month (0-11)
   * @param {boolean} forceRefresh - Force refresh from API
   * @returns {Promise<void>}
   */
  async loadMonthData(year, month, forceRefresh = false) {
    const monthKey = getMonthKey(new Date(year, month));
    const isCurrentMonthData = isCurrentMonth(year, month);

    try {
      this.setLoadingState(true);
      console.log(`[CorosExtensionApp] Loading data for ${monthKey}, forceRefresh: ${forceRefresh}`);

      let activities;

      // Determine caching strategy
      const cacheStrategy = await this.configRepository.get('cacheStrategy', CACHE_STRATEGY.CACHE_PAST_MONTHS);
      
      if (!forceRefresh && cacheStrategy !== CACHE_STRATEGY.ALWAYS_REFRESH) {
        if (cacheStrategy === CACHE_STRATEGY.CACHE_PAST_MONTHS && !isCurrentMonthData) {
          activities = await this.activityRepository.getActivities(monthKey);
        } else if (cacheStrategy === CACHE_STRATEGY.CACHE_CURRENT_MONTH) {
          activities = await this.activityRepository.getActivities(monthKey);
        }
      }

      // Fetch from API if needed
      if (!activities || forceRefresh || isCurrentMonthData) {
        console.log(`[CorosExtensionApp] Fetching activities from API for ${monthKey}`);
        activities = await this.apiAdapter.fetchActivitiesForMonth(year, month);
        
        // Save to cache if appropriate
        if (cacheStrategy !== CACHE_STRATEGY.ALWAYS_REFRESH) {
          await this.activityRepository.saveActivities(monthKey, activities);
        }
      }

      // Process activities
      const processedActivities = this.activityDataProcessor.processActivities(activities);
      
      // Store in memory
      this.activities[monthKey] = processedActivities;

      // Update views
      this.updateCurrentView();

      console.log(`[CorosExtensionApp] Successfully loaded ${processedActivities.length} activities for ${monthKey}`);

    } catch (error) {
      console.error(`[CorosExtensionApp] Error loading data for ${monthKey}:`, error);
      this.showErrorState(`Failed to load activity data: ${error.message}`);
    } finally {
      this.setLoadingState(false);
    }
  }

  /**
   * Handle tab switching
   * @param {string} tabName - Tab name
   */
  handleTabSwitch(tabName) {
    if (!['calendar', 'statistics'].includes(tabName)) {
      console.warn(`[CorosExtensionApp] Invalid tab name: ${tabName}`);
      return;
    }

    this.currentView = tabName;
    this.domAdapter.updateActiveTab(tabName);
    this.updateCurrentView();
    
    console.log(`[CorosExtensionApp] Switched to ${tabName} view`);
  }

  /**
   * Handle calendar navigation
   * @param {string} action - Navigation action ('prev' or 'next')
   */
  async handleCalendarNavigation(action) {
    const currentDate = new Date(this.currentDate);

    if (action === 'prev') {
      currentDate.setMonth(currentDate.getMonth() - 1);
    } else if (action === 'next') {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else {
      console.warn(`[CorosExtensionApp] Invalid navigation action: ${action}`);
      return;
    }

    this.currentDate = currentDate;

    // Update view-specific navigation
    if (this.currentView === 'calendar') {
      this.calendarView.navigateToMonth(currentDate.getFullYear(), currentDate.getMonth());
    } else if (this.currentView === 'statistics') {
      this.statisticsView.navigateToDate(currentDate);
    }

    await this.loadMonthData(currentDate.getFullYear(), currentDate.getMonth());
    
    console.log(`[CorosExtensionApp] Navigated to ${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`);
  }

  /**
   * Handle view mode change
   * @param {string} mode - View mode ('month' or 'week')
   */
  handleViewModeChange(mode) {
    if (this.currentView === 'calendar') {
      this.calendarView.setViewMode(mode);
      this.updateCurrentView();
    }
  }

  /**
   * Handle refresh data
   */
  async handleRefreshData() {
    const currentDate = this.currentDate;
    await this.loadMonthData(currentDate.getFullYear(), currentDate.getMonth(), true);
    console.log('[CorosExtensionApp] Data refreshed');
  }

  /**
   * Show calendar view
   */
  showCalendarView() {
    const container = document.getElementById('coros-extension-content');
    if (!container) return;

    const monthKey = getMonthKey(this.currentDate);
    const activities = this.activities[monthKey] || [];
    
    this.calendarView.render(container, activities, this.calendarView.viewMode);
  }

  /**
   * Show statistics view
   */
  showStatisticsView() {
    const container = document.getElementById('coros-extension-content');
    if (!container) return;

    const monthKey = getMonthKey(this.currentDate);
    const activities = this.activities[monthKey] || [];
    
    this.statisticsView.render(container, activities, this.currentDate);
  }

  /**
   * Update current view
   */
  updateCurrentView() {
    if (this.currentView === 'calendar') {
      this.showCalendarView();
    } else if (this.currentView === 'statistics') {
      this.showStatisticsView();
    }
  }

  /**
   * Set loading state
   * @param {boolean} isLoading - Loading state
   */
  setLoadingState(isLoading) {
    this.isLoading = isLoading;
    this.domAdapter.setLoadingState(isLoading);
  }

  /**
   * Show error state
   * @param {string} message - Error message
   */
  showErrorState(message) {
    const container = document.getElementById('coros-extension-content');
    if (!container) return;

    const errorElement = this.domAdapter.createErrorDisplay(
      message,
      () => this.handleRefreshData()
    );

    container.innerHTML = '';
    container.appendChild(errorElement);
  }

  /**
   * Handle initialization error
   * @param {Error} error - Error object
   */
  async handleInitializationError(error) {
    console.error('[CorosExtensionApp] Initialization error:', error);
    
    // Try to show error in UI if possible
    try {
      const container = this.domAdapter.createExtensionContainer('coros-calendar-extension');
      if (container) {
        const errorElement = this.domAdapter.createErrorDisplay(
          `Failed to initialize extension: ${error.message}`,
          () => window.location.reload()
        );
        container.appendChild(errorElement);
      }
    } catch (uiError) {
      console.error('[CorosExtensionApp] Failed to show initialization error in UI:', uiError);
    }
  }

  /**
   * Get extension styles
   * @returns {Promise<string>} CSS styles
   */
  async getExtensionStyles() {
    return `
      .coros-extension-container {
        --coros-bg: #181a1b;
        --coros-fg: #f5f6fa;
        --coros-accent: #ffb300;
        --coros-cell-bg: #232527;
        --coros-cell-hover: #292b2e;
        --coros-border: #333;
        margin: 20px 0;
        padding: 16px;
        background: var(--coros-bg);
        color: var(--coros-fg);
        border-radius: 8px;
        border: 1px solid var(--coros-border);
      }

      .coros-extension-header {
        margin-bottom: 16px;
        border-bottom: 1px solid var(--coros-border);
        padding-bottom: 12px;
      }

      .coros-extension-tabs {
        display: flex;
        gap: 8px;
      }

      .coros-tab-btn {
        padding: 8px 16px;
        background: var(--coros-cell-bg);
        color: var(--coros-fg);
        border: 1px solid var(--coros-border);
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .coros-tab-btn:hover {
        background: var(--coros-cell-hover);
      }

      .coros-tab-btn.active {
        background: var(--coros-accent);
        color: var(--coros-bg);
        border-color: var(--coros-accent);
      }

      .coros-extension-content {
        min-height: 400px;
      }

      .coros-loading {
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        color: var(--coros-fg);
      }

      .coros-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid var(--coros-border);
        border-top: 3px solid var(--coros-accent);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 16px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .coros-error-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        text-align: center;
        color: var(--coros-fg);
      }

      .coros-error-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }

      .coros-retry-btn {
        padding: 8px 16px;
        background: var(--coros-accent);
        color: var(--coros-bg);
        border: none;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 16px;
      }

      .coros-calendar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .coros-calendar-controls {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .coros-calendar-nav {
        padding: 6px 12px;
        background: var(--coros-cell-bg);
        color: var(--coros-fg);
        border: 1px solid var(--coros-border);
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .coros-calendar-nav:hover {
        background: var(--coros-cell-hover);
      }

      .coros-calendar-title {
        color: var(--coros-accent);
        font-size: 18px;
        font-weight: bold;
        margin: 0;
      }

      .coros-view-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      #coros-view-mode {
        padding: 6px 12px;
        background: var(--coros-cell-bg);
        color: var(--coros-fg);
        border: 1px solid var(--coros-border);
        border-radius: 4px;
      }

      .coros-stats-summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
        margin-bottom: 24px;
      }

      .coros-stat-card {
        background: var(--coros-cell-bg);
        padding: 16px;
        border-radius: 8px;
        border: 1px solid var(--coros-border);
        text-align: center;
      }

      .coros-stat-value {
        font-size: 24px;
        font-weight: bold;
        color: var(--coros-accent);
        margin-bottom: 4px;
      }

      .coros-stat-label {
        font-size: 12px;
        color: #aaa;
      }

      .coros-stat-detail {
        font-size: 11px;
        color: #888;
        margin-top: 4px;
      }

      .coros-calendar-cell {
        min-height: 64px;
        background: var(--coros-cell-bg);
        border: 1px solid var(--coros-border);
        border-radius: 6px;
        padding: 4px 2px 2px 4px;
        font-size: 13px;
        position: relative;
        transition: background 0.2s;
      }

      .coros-calendar-cell.today {
        border: 2px solid var(--coros-accent);
      }

      .coros-calendar-cell.other-month {
        opacity: 0.5;
      }

      .coros-day-number {
        font-weight: bold;
        color: var(--coros-fg);
        margin-bottom: 4px;
      }

      .coros-activity-item {
        display: flex;
        align-items: center;
        font-size: 12px;
        margin-top: 2px;
        gap: 2px;
        padding: 2px 4px;
        border-radius: 3px;
        cursor: pointer;
        transition: opacity 0.2s;
      }

      .coros-activity-item:hover {
        opacity: 0.8;
      }

      .coros-activity-details {
        color: #aaa;
        font-size: 11px;
      }

      .coros-activity-tooltip {
        background: var(--coros-cell-bg);
        color: var(--coros-fg);
        padding: 8px;
        border-radius: 4px;
        border: 1px solid var(--coros-border);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        z-index: 1000;
        pointer-events: none;
        font-size: 12px;
      }

      .coros-stats-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 16px;
      }

      .coros-stats-table th,
      .coros-stats-table td {
        padding: 8px;
        text-align: left;
        border-bottom: 1px solid var(--coros-border);
      }

      .coros-stats-table th {
        color: var(--coros-accent);
        font-weight: bold;
      }

      .coros-sport-name {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .coros-sport-icon {
        font-size: 16px;
      }
    `;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Clean up event listeners
    this.eventCleanupFunctions.forEach(cleanup => cleanup());
    this.eventCleanupFunctions = [];

    // Clean up DOM elements
    this.domAdapter.cleanup();

    // Clear processed activities cache
    this.activityDataProcessor.clearCache();

    this.isInitialized = false;
    console.log('[CorosExtensionApp] Cleanup completed');
  }

  /**
   * Get application status
   * @returns {Object} Application status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      currentView: this.currentView,
      currentDate: this.currentDate,
      isLoading: this.isLoading,
      activitiesCount: Object.keys(this.activities).length,
      memoryUsage: this.activityDataProcessor.getCacheStats()
    };
  }
}