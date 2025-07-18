// Statistics view component for rendering statistics UI

import { formatDistance, formatDuration, formatCalories } from '../utils/formatUtils.js';

/**
 * Statistics view component for rendering statistics UI
 */
export class StatisticsView {
  constructor(statisticsService, domAdapter) {
    this.statisticsService = statisticsService;
    this.domAdapter = domAdapter;
    this.currentDate = new Date();
  }

  /**
   * Initialize statistics view
   */
  initialize() {
    console.log('[StatisticsView] Initialized');
  }

  /**
   * Render statistics view
   * @param {HTMLElement} container - Container element
   * @param {Array} activities - Activities to analyze
   * @param {Date} date - Current date for statistics period
   */
  render(container, activities, date) {
    this.currentDate = date || new Date();
    
    try {
      const periodStart = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
      const periodEnd = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0, 23, 59, 59);
      
      const stats = this.statisticsService.calculateStatistics(activities, periodStart, periodEnd);
      const html = this.generateStatisticsHTML(stats);
      
      this.domAdapter.updateContent(container.id, html);
      this.bindEventListeners(container);
      
      console.log(`[StatisticsView] Rendered statistics for ${stats.period.start.toDateString()} to ${stats.period.end.toDateString()}`);
    } catch (error) {
      console.error('[StatisticsView] Error rendering statistics:', error);
      this.renderError(container, error.message);
    }
  }

  /**
   * Generate statistics HTML
   * @param {Object} stats - Statistics data
   * @returns {string} Statistics HTML
   */
  generateStatisticsHTML(stats) {
    const headerHTML = this.generateHeaderHTML();
    const summaryHTML = this.generateSummaryHTML(stats.overall);
    const sportTableHTML = this.generateSportTableHTML(stats.bySport);
    const trendsHTML = this.generateTrendsHTML(stats.trends);
    const achievementsHTML = this.generateAchievementsHTML(stats.achievements);
    const insightsHTML = this.generateInsightsHTML(stats.insights);

    return `
      <div class="coros-statistics-container">
        ${headerHTML}
        ${summaryHTML}
        ${sportTableHTML}
        ${trendsHTML}
        ${achievementsHTML}
        ${insightsHTML}
      </div>
    `;
  }

  /**
   * Generate header HTML
   * @returns {string} Header HTML
   */
  generateHeaderHTML() {
    const monthName = this.currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    return `
      <div class="coros-statistics-header">
        <div class="coros-calendar-controls">
          <button class="coros-calendar-nav" data-action="prev">‹ Previous</button>
          <h3 class="coros-calendar-title">Statistics - ${monthName}</h3>
          <button class="coros-calendar-nav" data-action="next">Next ›</button>
        </div>
      </div>
    `;
  }

  /**
   * Generate summary HTML
   * @param {Object} overallStats - Overall statistics
   * @returns {string} Summary HTML
   */
  generateSummaryHTML(overallStats) {
    return `
      <div class="coros-stats-summary">
        <div class="coros-stat-card">
          <div class="coros-stat-value">${overallStats.totalActivities}</div>
          <div class="coros-stat-label">Total Activities</div>
        </div>
        <div class="coros-stat-card">
          <div class="coros-stat-value">${overallStats.activeDays}</div>
          <div class="coros-stat-label">Active Days</div>
        </div>
        <div class="coros-stat-card">
          <div class="coros-stat-value">${overallStats.formattedTotalDistance}</div>
          <div class="coros-stat-label">Total Distance</div>
        </div>
        <div class="coros-stat-card">
          <div class="coros-stat-value">${overallStats.formattedTotalDuration}</div>
          <div class="coros-stat-label">Total Time</div>
        </div>
        <div class="coros-stat-card">
          <div class="coros-stat-value">${overallStats.formattedTotalCalories}</div>
          <div class="coros-stat-label">Total Calories</div>
        </div>
        <div class="coros-stat-card">
          <div class="coros-stat-value">${overallStats.formattedAverageDistance}</div>
          <div class="coros-stat-label">Avg Distance</div>
        </div>
        <div class="coros-stat-card">
          <div class="coros-stat-value">${overallStats.formattedAverageDuration}</div>
          <div class="coros-stat-label">Avg Duration</div>
        </div>
        <div class="coros-stat-card">
          <div class="coros-stat-value">${overallStats.uniqueSports}</div>
          <div class="coros-stat-label">Sport Types</div>
        </div>
      </div>
    `;
  }

  /**
   * Generate sport table HTML
   * @param {Object} sportStats - Sport statistics
   * @returns {string} Sport table HTML
   */
  generateSportTableHTML(sportStats) {
    if (Object.keys(sportStats).length === 0) {
      return `
        <div class="coros-stats-by-sport">
          <h3>Activity Breakdown by Sport</h3>
          <div class="coros-empty-state">
            <p>No activity data available for this period.</p>
          </div>
        </div>
      `;
    }

    const sortedSports = Object.entries(sportStats)
      .sort(([, a], [, b]) => b.count - a.count);

    const tableRows = sortedSports.map(([sportType, data]) => {
      const avgDistance = data.averageDistance;
      const avgDuration = data.averageDuration;

      return `
        <tr>
          <td>
            <div class="coros-sport-name">
              <span class="coros-sport-icon">${data.icon}</span>
              ${data.name}
            </div>
          </td>
          <td>${data.count}</td>
          <td>${data.activeDays}</td>
          <td>${data.formattedTotalDistance}</td>
          <td>${data.formattedTotalDuration}</td>
          <td>${formatDistance(avgDistance)}</td>
          <td>${formatDuration(avgDuration)}</td>
          <td>${data.formattedTotalCalories}</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="coros-stats-by-sport">
        <h3>Activity Breakdown by Sport</h3>
        <table class="coros-stats-table">
          <thead>
            <tr>
              <th>Sport</th>
              <th>Activities</th>
              <th>Active Days</th>
              <th>Total Distance</th>
              <th>Total Time</th>
              <th>Avg Distance</th>
              <th>Avg Time</th>
              <th>Calories</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Generate trends HTML
   * @param {Object} trends - Trends data
   * @returns {string} Trends HTML
   */
  generateTrendsHTML(trends) {
    const frequencyHTML = this.generateFrequencyHTML(trends.activityFrequency);
    const progressHTML = this.generateProgressHTML(trends.performanceProgress);
    const consistencyHTML = this.generateConsistencyHTML(trends.consistencyScore);

    return `
      <div class="coros-stats-trends">
        <h3>Trends & Patterns</h3>
        <div class="coros-trends-grid">
          ${frequencyHTML}
          ${progressHTML}
          ${consistencyHTML}
        </div>
      </div>
    `;
  }

  /**
   * Generate frequency HTML
   * @param {Object} frequency - Frequency data
   * @returns {string} Frequency HTML
   */
  generateFrequencyHTML(frequency) {
    return `
      <div class="coros-trend-card">
        <h4>Activity Frequency</h4>
        <div class="coros-trend-metric">
          <span class="coros-trend-value">${frequency.formattedFrequency}</span>
          <span class="coros-trend-label">of days active</span>
        </div>
        <div class="coros-trend-detail">
          ${frequency.activeDays} out of ${frequency.totalDays} days
        </div>
      </div>
    `;
  }

  /**
   * Generate progress HTML
   * @param {Object} progress - Progress data
   * @returns {string} Progress HTML
   */
  generateProgressHTML(progress) {
    if (!progress.hasData) {
      return `
        <div class="coros-trend-card">
          <h4>Performance Progress</h4>
          <div class="coros-trend-detail">
            Need more data to show progress
          </div>
        </div>
      `;
    }

    const distanceChange = progress.changes.distance;
    const durationChange = progress.changes.duration;
    const distanceIcon = distanceChange > 0 ? '📈' : distanceChange < 0 ? '📉' : '➖';
    const durationIcon = durationChange > 0 ? '📈' : durationChange < 0 ? '📉' : '➖';

    return `
      <div class="coros-trend-card">
        <h4>Performance Progress</h4>
        <div class="coros-trend-metric">
          <div class="coros-progress-item">
            <span class="coros-progress-icon">${distanceIcon}</span>
            <span class="coros-progress-label">Distance</span>
            <span class="coros-progress-value">${distanceChange.toFixed(1)}%</span>
          </div>
          <div class="coros-progress-item">
            <span class="coros-progress-icon">${durationIcon}</span>
            <span class="coros-progress-label">Duration</span>
            <span class="coros-progress-value">${durationChange.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate consistency HTML
   * @param {Object} consistency - Consistency data
   * @returns {string} Consistency HTML
   */
  generateConsistencyHTML(consistency) {
    const levelColors = {
      'Excellent': '#4CAF50',
      'Good': '#8BC34A',
      'Fair': '#FF9800',
      'Low': '#F44336'
    };

    return `
      <div class="coros-trend-card">
        <h4>Consistency Score</h4>
        <div class="coros-trend-metric">
          <span class="coros-trend-value">${consistency.score.toFixed(1)}%</span>
          <span class="coros-trend-label" style="color: ${levelColors[consistency.level]}">${consistency.level}</span>
        </div>
        <div class="coros-trend-detail">
          ${consistency.activeDays} active days out of ${consistency.totalDays}
        </div>
      </div>
    `;
  }

  /**
   * Generate achievements HTML
   * @param {Object} achievements - Achievements data
   * @returns {string} Achievements HTML
   */
  generateAchievementsHTML(achievements) {
    const streaksHTML = this.generateStreaksHTML(achievements.streaks);
    const milestonesHTML = this.generateMilestonesHTML(achievements.milestones);
    const recordsHTML = this.generateRecordsHTML(achievements.records);

    return `
      <div class="coros-stats-achievements">
        <h3>Achievements & Records</h3>
        <div class="coros-achievements-grid">
          ${streaksHTML}
          ${milestonesHTML}
          ${recordsHTML}
        </div>
      </div>
    `;
  }

  /**
   * Generate streaks HTML
   * @param {Object} streaks - Streaks data
   * @returns {string} Streaks HTML
   */
  generateStreaksHTML(streaks) {
    return `
      <div class="coros-achievement-card">
        <h4>🔥 Activity Streaks</h4>
        <div class="coros-achievement-metric">
          <div class="coros-streak-item">
            <span class="coros-streak-label">Current Streak</span>
            <span class="coros-streak-value">${streaks.current} days</span>
          </div>
          <div class="coros-streak-item">
            <span class="coros-streak-label">Longest Streak</span>
            <span class="coros-streak-value">${streaks.longest} days</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Generate milestones HTML
   * @param {Array} milestones - Milestones data
   * @returns {string} Milestones HTML
   */
  generateMilestonesHTML(milestones) {
    const recentMilestones = milestones.slice(-5); // Show last 5 milestones
    
    if (recentMilestones.length === 0) {
      return `
        <div class="coros-achievement-card">
          <h4>🏆 Milestones</h4>
          <div class="coros-achievement-detail">
            Keep training to unlock milestones!
          </div>
        </div>
      `;
    }

    const milestonesHTML = recentMilestones.map(milestone => `
      <div class="coros-milestone-item">
        <span class="coros-milestone-icon">🎯</span>
        <span class="coros-milestone-text">${milestone.description}</span>
      </div>
    `).join('');

    return `
      <div class="coros-achievement-card">
        <h4>🏆 Recent Milestones</h4>
        <div class="coros-milestones-list">
          ${milestonesHTML}
        </div>
      </div>
    `;
  }

  /**
   * Generate records HTML
   * @param {Object} records - Records data
   * @returns {string} Records HTML
   */
  generateRecordsHTML(records) {
    const recordItems = [];

    if (records.longestDistance) {
      recordItems.push(`
        <div class="coros-record-item">
          <span class="coros-record-icon">📏</span>
          <span class="coros-record-label">Longest Distance</span>
          <span class="coros-record-value">${formatDistance(records.longestDistance.distance)}</span>
        </div>
      `);
    }

    if (records.longestDuration) {
      recordItems.push(`
        <div class="coros-record-item">
          <span class="coros-record-icon">⏱️</span>
          <span class="coros-record-label">Longest Duration</span>
          <span class="coros-record-value">${formatDuration(records.longestDuration.duration)}</span>
        </div>
      `);
    }

    if (records.highestCalories) {
      recordItems.push(`
        <div class="coros-record-item">
          <span class="coros-record-icon">🔥</span>
          <span class="coros-record-label">Highest Calories</span>
          <span class="coros-record-value">${formatCalories(records.highestCalories.calories)}</span>
        </div>
      `);
    }

    if (records.mostActivitiesInDay) {
      recordItems.push(`
        <div class="coros-record-item">
          <span class="coros-record-icon">📅</span>
          <span class="coros-record-label">Most Activities in Day</span>
          <span class="coros-record-value">${records.mostActivitiesInDay.count}</span>
        </div>
      `);
    }

    return `
      <div class="coros-achievement-card">
        <h4>📊 Personal Records</h4>
        <div class="coros-records-list">
          ${recordItems.join('')}
        </div>
      </div>
    `;
  }

  /**
   * Generate insights HTML
   * @param {Array} insights - Insights data
   * @returns {string} Insights HTML
   */
  generateInsightsHTML(insights) {
    if (insights.length === 0) {
      return '';
    }

    const insightsHTML = insights.map(insight => `
      <div class="coros-insight-item ${insight.type}">
        <span class="coros-insight-icon">${insight.icon}</span>
        <div class="coros-insight-content">
          <h5 class="coros-insight-title">${insight.title}</h5>
          <p class="coros-insight-text">${insight.message}</p>
        </div>
      </div>
    `).join('');

    return `
      <div class="coros-stats-insights">
        <h3>💡 Insights</h3>
        <div class="coros-insights-list">
          ${insightsHTML}
        </div>
      </div>
    `;
  }

  /**
   * Navigate to specific date
   * @param {Date} date - Date to navigate to
   */
  navigateToDate(date) {
    this.currentDate = date;
    console.log(`[StatisticsView] Navigated to ${date.toDateString()}`);
  }

  /**
   * Navigate to previous month
   */
  navigateToPreviousMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    console.log(`[StatisticsView] Navigated to previous month: ${this.currentDate.toDateString()}`);
  }

  /**
   * Navigate to next month
   */
  navigateToNextMonth() {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    console.log(`[StatisticsView] Navigated to next month: ${this.currentDate.toDateString()}`);
  }

  /**
   * Bind event listeners
   * @param {HTMLElement} container - Container element
   */
  bindEventListeners(container) {
    // Add any specific event listeners for statistics view
    console.log('[StatisticsView] Event listeners bound');
  }

  /**
   * Render error state
   * @param {HTMLElement} container - Container element
   * @param {string} message - Error message
   */
  renderError(container, message) {
    const errorElement = this.domAdapter.createErrorDisplay(
      `Failed to render statistics: ${message}`,
      () => this.render(container, [], this.currentDate)
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
      date: this.currentDate,
      year: this.currentDate.getFullYear(),
      month: this.currentDate.getMonth()
    };
  }
}