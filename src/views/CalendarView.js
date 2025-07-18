// Calendar view component for rendering calendar UI

import { SPORT_ICON_MAP } from '../config/constants.js';
import { formatDistance, formatDuration } from '../utils/formatUtils.js';

/**
 * Calendar view component for rendering calendar UI
 */
export class CalendarView {
  constructor(calendarService, domAdapter) {
    this.calendarService = calendarService;
    this.domAdapter = domAdapter;
    this.currentYear = new Date().getFullYear();
    this.currentMonth = new Date().getMonth();
    this.viewMode = 'month';
  }

  /**
   * Initialize calendar view
   * @param {Array} activities - Initial activities data
   */
  initialize(activities) {
    this.activities = activities || [];
    const defaultDate = this.calendarService.getDefaultDate();
    this.currentYear = defaultDate.year;
    this.currentMonth = defaultDate.month;
  }

  /**
   * Render calendar view
   * @param {HTMLElement} container - Container element
   * @param {Array} activities - Activities to display
   * @param {string} viewMode - View mode ('month' or 'week')
   */
  render(container, activities, viewMode = 'month') {
    this.activities = activities || [];
    this.viewMode = viewMode;

    try {
      const calendarData = this.getCalendarData();
      const html = this.generateCalendarHTML(calendarData);
      
      this.domAdapter.updateContent(container.id, html);
      this.bindEventListeners(container);
      
      console.log(`[CalendarView] Rendered ${viewMode} view for ${this.currentYear}-${this.currentMonth + 1}`);
    } catch (error) {
      console.error('[CalendarView] Error rendering calendar:', error);
      this.renderError(container, error.message);
    }
  }

  /**
   * Get calendar data based on current view mode
   * @returns {Object} Calendar data
   */
  getCalendarData() {
    if (this.viewMode === 'week') {
      const currentDate = new Date(this.currentYear, this.currentMonth, 1);
      return this.calendarService.generateWeekData(currentDate, this.activities);
    } else {
      return this.calendarService.generateCalendarData(this.currentYear, this.currentMonth, this.activities);
    }
  }

  /**
   * Generate calendar HTML
   * @param {Object} calendarData - Calendar data
   * @returns {string} Calendar HTML
   */
  generateCalendarHTML(calendarData) {
    const navigationHTML = this.generateNavigationHTML();
    const summaryHTML = this.generateSummaryHTML(calendarData.stats);
    const calendarHTML = this.viewMode === 'week' 
      ? this.generateWeekViewHTML(calendarData)
      : this.generateMonthViewHTML(calendarData);

    return `
      <div class="coros-calendar-container">
        ${navigationHTML}
        ${summaryHTML}
        ${calendarHTML}
      </div>
    `;
  }

  /**
   * Generate navigation HTML
   * @returns {string} Navigation HTML
   */
  generateNavigationHTML() {
    const navigation = this.calendarService.getNavigationData(this.currentYear, this.currentMonth);
    
    return `
      <div class="coros-calendar-header">
        <div class="coros-calendar-controls">
          <button class="coros-calendar-nav" data-action="prev">‹ Previous</button>
          <h3 class="coros-calendar-title">${navigation.current.displayName}</h3>
          <button class="coros-calendar-nav" data-action="next">Next ›</button>
        </div>
        <div class="coros-view-controls">
          <button id="coros-refresh-btn" class="coros-calendar-nav">🔄</button>
          <select id="coros-view-mode">
            <option value="month" ${this.viewMode === 'month' ? 'selected' : ''}>Month View</option>
            <option value="week" ${this.viewMode === 'week' ? 'selected' : ''}>Week View</option>
          </select>
        </div>
      </div>
    `;
  }

  /**
   * Generate summary HTML
   * @param {Object} stats - Statistics data
   * @returns {string} Summary HTML
   */
  generateSummaryHTML(stats) {
    const groupSummary = stats.groupStats;
    
    const groupCards = [
      { key: 'run', label: 'Run', icon: '🏃', color: '#FF6B6B' },
      { key: 'bike', label: 'Bike', icon: '🚴', color: '#4ECDC4' },
      { key: 'swim', label: 'Swim', icon: '🏊', color: '#45B7D1' }
    ].map(({ key, label, icon, color }) => {
      const g = groupSummary[key];
      return `
        <div class="coros-stat-card group-summary" style="border-top: 3px solid ${color}">
          <div class="coros-stat-value">${icon} ${label}</div>
          <div class="coros-stat-label">${g.count} activities, ${g.days} days</div>
          <div class="coros-stat-detail">${formatDistance(g.distance)}, ${formatDuration(g.time)}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="coros-stats-summary">
        ${groupCards}
        <div class="coros-stat-card">
          <div class="coros-stat-value">${stats.totalActivities}</div>
          <div class="coros-stat-label">Total Activities</div>
        </div>
        <div class="coros-stat-card">
          <div class="coros-stat-value">${stats.activeDays}</div>
          <div class="coros-stat-label">Active Days</div>
        </div>
        <div class="coros-stat-card">
          <div class="coros-stat-value">${formatDistance(stats.totalDistance)}</div>
          <div class="coros-stat-label">Total Distance</div>
        </div>
        <div class="coros-stat-card">
          <div class="coros-stat-value">${formatDuration(stats.totalDuration)}</div>
          <div class="coros-stat-label">Total Time</div>
        </div>
      </div>
    `;
  }

  /**
   * Generate month view HTML
   * @param {Object} calendarData - Calendar data
   * @returns {string} Month view HTML
   */
  generateMonthViewHTML(calendarData) {
    const weekdayHeaders = this.calendarService.getWeekdayNames()
      .map(day => `<th class="arco-table-th arco-table-col-fixed-left arco-table-col-fixed-left-last td-Name field-Name">${day}</th>`)
      .join('');

    const weekRows = calendarData.weeks
      .map(week => this.generateWeekRowHTML(week))
      .join('');

    return `
      <div class="arco-table-container arco-table-has-fixed-col-left arco-table-has-fixed-col-right">
        <div class="arco-table-content arco-table-content-scroll-x">
          <table class="arco-table">
            <thead>
              <tr class="arco-table-tr">
                ${weekdayHeaders}
              </tr>
            </thead>
            <tbody>
              ${weekRows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /**
   * Generate week view HTML
   * @param {Object} weekData - Week data
   * @returns {string} Week view HTML
   */
  generateWeekViewHTML(weekData) {
    const weekdayHeaders = this.calendarService.getWeekdayNames()
      .map(day => `<th class="arco-table-th arco-table-col-fixed-left arco-table-col-fixed-left-last td-Name field-Name">${day}</th>`)
      .join('');

    const dayCells = weekData.days
      .map(day => this.generateDayCellHTML(day))
      .join('');

    return `
      <div class="arco-table-container arco-table-has-fixed-col-left arco-table-has-fixed-col-right">
        <div class="arco-table-content arco-table-content-scroll-x">
          <table class="arco-table">
            <thead>
              <tr class="arco-table-tr">
                ${weekdayHeaders}
              </tr>
            </thead>
            <tbody>
              <tr class="arco-table-tr">
                ${dayCells}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /**
   * Generate week row HTML
   * @param {Object} week - Week data
   * @returns {string} Week row HTML
   */
  generateWeekRowHTML(week) {
    const dayCells = week.days
      .map(day => this.generateDayCellHTML(day))
      .join('');

    return `<tr class="arco-table-tr">${dayCells}</tr>`;
  }

  /**
   * Generate day cell HTML
   * @param {Object} day - Day data
   * @returns {string} Day cell HTML
   */
  generateDayCellHTML(day) {
    const classes = this.calendarService.getCalendarCellClasses(day);
    const activitiesHTML = this.generateDayActivitiesHTML(day.groupedActivities);

    return `
      <td class="${classes.join(' ')}" data-date="${day.dateKey}">
        <div class="coros-day-number">${day.dayNumber}</div>
        <div class="coros-day-activities">
          ${activitiesHTML}
        </div>
      </td>
    `;
  }

  /**
   * Generate day activities HTML
   * @param {Object} groupedActivities - Grouped activities by sport type
   * @returns {string} Day activities HTML
   */
  generateDayActivitiesHTML(groupedActivities) {
    if (!groupedActivities || Object.keys(groupedActivities).length === 0) {
      return '';
    }

    const sortedGroups = Object.values(groupedActivities)
      .sort((a, b) => a.type.localeCompare(b.type));

    return sortedGroups.map(group => {
      const iconConfig = SPORT_ICON_MAP[group.activities[0]?.code] || SPORT_ICON_MAP.other;
      const iconHTML = this.generateSportIconHTML(iconConfig);
      const countStr = group.count > 1 ? ` x${group.count}` : '';
      
      let details = '';
      if (group.totalDistance > 0 && group.totalDuration > 0) {
        details = `${formatDistance(group.totalDistance)} / ${formatDuration(group.totalDuration)}`;
      } else if (group.totalDistance > 0) {
        details = formatDistance(group.totalDistance);
      } else if (group.totalDuration > 0) {
        details = formatDuration(group.totalDuration);
      }

      return `
        <div class="coros-activity-item" 
             data-activity-id="${group.activities[0]?.id}"
             data-sport-type="${group.activities[0]?.code || 'other'}"
             style="background-color: ${group.config.color}20; border-left: 3px solid ${group.config.color}; display: flex; align-items: center;">
          ${iconHTML}
          ${countStr}
          <span class="coros-activity-details" style="margin-left: 4px;">
            ${details}
          </span>
        </div>
      `;
    }).join('');
  }

  /**
   * Generate sport icon HTML
   * @param {Object} iconConfig - Icon configuration
   * @returns {string} Sport icon HTML
   */
  generateSportIconHTML(iconConfig) {
    return `
      <span style="width:auto; padding: 4px;" class="arco-table-td-content">
        <div class="flex-1 flex">
          <span class="iconfont-sport ${iconConfig.icon} text-20" 
                data-sport="${iconConfig.dataSport}" 
                style="color: ${iconConfig.color};">
          </span>
        </div>
      </span>
    `;
  }

  /**
   * Navigate to specific month
   * @param {number} year - Year
   * @param {number} month - Month (0-11)
   */
  navigateToMonth(year, month) {
    this.currentYear = year;
    this.currentMonth = month;
    console.log(`[CalendarView] Navigated to ${year}-${month + 1}`);
  }

  /**
   * Navigate to previous month
   */
  navigateToPreviousMonth() {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    console.log(`[CalendarView] Navigated to previous month: ${this.currentYear}-${this.currentMonth + 1}`);
  }

  /**
   * Navigate to next month
   */
  navigateToNextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    console.log(`[CalendarView] Navigated to next month: ${this.currentYear}-${this.currentMonth + 1}`);
  }

  /**
   * Set view mode
   * @param {string} mode - View mode ('month' or 'week')
   */
  setViewMode(mode) {
    if (['month', 'week'].includes(mode)) {
      this.viewMode = mode;
      console.log(`[CalendarView] Set view mode to: ${mode}`);
    }
  }

  /**
   * Update activities data
   * @param {Array} activities - New activities data
   */
  updateActivities(activities) {
    this.activities = activities || [];
    console.log(`[CalendarView] Updated activities data: ${this.activities.length} activities`);
  }

  /**
   * Bind event listeners
   * @param {HTMLElement} container - Container element
   */
  bindEventListeners(container) {
    // Activity click handlers
    const activityItems = container.querySelectorAll('.coros-activity-item');
    activityItems.forEach(item => {
      this.domAdapter.addEventListener(item, 'click', this.handleActivityClick.bind(this));
      this.domAdapter.addEventListener(item, 'mouseenter', this.handleActivityHover.bind(this));
      this.domAdapter.addEventListener(item, 'mouseleave', this.handleActivityLeave.bind(this));
    });
  }

  /**
   * Handle activity click
   * @param {Event} event - Click event
   */
  handleActivityClick(event) {
    const activityId = event.currentTarget.dataset.activityId;
    const sportType = event.currentTarget.dataset.sportType;
    
    if (activityId) {
      const activityUrl = `https://t.coros.com/activity-detail?labelId=${activityId}&sportType=${sportType}`;
      window.open(activityUrl, '_blank');
    }
  }

  /**
   * Handle activity hover
   * @param {Event} event - Hover event
   */
  handleActivityHover(event) {
    const activityId = event.currentTarget.dataset.activityId;
    
    // Find activity data
    const activity = this.activities.find(a => a.id === activityId);
    if (activity) {
      this.showActivityTooltip(event, activity);
    }
  }

  /**
   * Handle activity leave
   * @param {Event} event - Leave event
   */
  handleActivityLeave(event) {
    this.hideActivityTooltip();
  }

  /**
   * Show activity tooltip
   * @param {Event} event - Mouse event
   * @param {Object} activity - Activity data
   */
  showActivityTooltip(event, activity) {
    const tooltip = this.domAdapter.createElement('div', {
      classes: ['coros-activity-tooltip'],
      innerHTML: `
        <div class="tooltip-title">${activity.name}</div>
        <div class="tooltip-sport">${activity.type}</div>
        <div class="tooltip-stats">
          <div>Distance: ${formatDistance(activity.distance)}</div>
          <div>Duration: ${formatDuration(activity.duration)}</div>
          <div>Calories: ${activity.calories}</div>
        </div>
      `,
      style: {
        position: 'absolute',
        top: `${event.clientY + 10}px`,
        left: `${event.clientX + 10}px`,
        zIndex: '1000'
      }
    });

    document.body.appendChild(tooltip);
  }

  /**
   * Hide activity tooltip
   */
  hideActivityTooltip() {
    const tooltip = document.querySelector('.coros-activity-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  }

  /**
   * Render error state
   * @param {HTMLElement} container - Container element
   * @param {string} message - Error message
   */
  renderError(container, message) {
    const errorElement = this.domAdapter.createErrorDisplay(
      `Failed to render calendar: ${message}`,
      () => this.render(container, this.activities, this.viewMode)
    );
    
    container.innerHTML = '';
    container.appendChild(errorElement);
  }

  /**
   * Get current date info
   * @returns {Object} Current date info
   */
  getCurrentDateInfo() {
    return {
      year: this.currentYear,
      month: this.currentMonth,
      viewMode: this.viewMode
    };
  }
}