// Statistics visualization component for COROS Activity Calendar extension

window.CorosStatistics = (function () {
  'use strict';

  // Sport type configurations (shared with calendar.js)
  const SPORT_TYPES = {
    'running': { icon: '🏃', color: '#FF6B6B', name: 'Running' },
    'cycling': { icon: '🚴', color: '#4ECDC4', name: 'Cycling' },
    'swimming': { icon: '🏊', color: '#45B7D1', name: 'Swimming' },
    'hiking': { icon: '🥾', color: '#96CEB4', name: 'Hiking' },
    'walking': { icon: '🚶', color: '#FECA57', name: 'Walking' },
    'strength': { icon: '💪', color: '#FF9FF3', name: 'Strength Training' },
    'yoga': { icon: '🧘', color: '#A8E6CF', name: 'Yoga' },
    'indoor_cycling': { icon: '🏋️', color: '#6C7CE0', name: 'Indoor Cycling' },
    'treadmill': { icon: '🏃', color: '#FF8A80', name: 'Treadmill' },
    'elliptical': { icon: '⚡', color: '#81C784', name: 'Elliptical' },
    'rowing': { icon: '🚣', color: '#4DB6AC', name: 'Rowing' },
    'skiing': { icon: '⛷️', color: '#E1F5FE', name: 'Skiing' },
    'snowboarding': { icon: '🏂', color: '#B3E5FC', name: 'Snowboarding' },
    'other': { icon: '⚡', color: '#95A5A6', name: 'Other' }
  };

  /**
   * Render statistics view
   * @param {HTMLElement} container - Container element to render statistics
   * @param {Array} activities - Array of activity data
   * @param {Date} date - Current date for statistics period
   */
  function render(container, activities, date) {
    if (!container) {
      console.error('Statistics container not provided');
      return;
    }

    try {
      const stats = calculateStatistics(activities, date);
      const groupSummary = groupSummarizeByCode(activities);
      const html = generateStatisticsHTML(stats, date, groupSummary);
      container.innerHTML = html;
    } catch (error) {
      console.error('Error rendering statistics:', error);
      container.innerHTML = `
          <div class="coros-error-state">
            <p>Failed to render statistics: ${error.message}</p>
          </div>
        `;
    }
  }

  /**
   * Calculate comprehensive statistics from activities
   */
  function calculateStatistics(activities, date) {
    if (!Array.isArray(activities)) {
      activities = [];
    }

    const stats = {
      overall: {
        totalActivities: 0,
        activeDays: new Set(),
        totalDistance: 0,
        totalDuration: 0,
        totalCalories: 0
      },
      bySport: {}
    };

    // Process each activity
    activities.forEach(activity => {
      try {
        // Normalize activity data
        const normalizedActivity = normalizeActivity(activity);
        const sportType = normalizedActivity.type;
        const activityDate = new Date(normalizedActivity.startTime);
        const dateKey = activityDate.toISOString().split('T')[0];

        // Update overall stats
        stats.overall.totalActivities++;
        stats.overall.activeDays.add(dateKey);
        stats.overall.totalDistance += normalizedActivity.distance || 0;
        stats.overall.totalDuration += normalizedActivity.duration || 0;
        stats.overall.totalCalories += normalizedActivity.calories || 0;

        // Update sport-specific stats
        if (!stats.bySport[sportType]) {
          stats.bySport[sportType] = {
            name: SPORT_TYPES[sportType]?.name || sportType,
            icon: SPORT_TYPES[sportType]?.icon || '⚡',
            color: SPORT_TYPES[sportType]?.color || '#95A5A6',
            count: 0,
            activeDays: new Set(),
            totalDistance: 0,
            totalDuration: 0,
            totalCalories: 0,
            activities: []
          };
        }

        const sportStats = stats.bySport[sportType];
        sportStats.count++;
        sportStats.activeDays.add(dateKey);
        sportStats.totalDistance += normalizedActivity.distance || 0;
        sportStats.totalDuration += normalizedActivity.duration || 0;
        sportStats.totalCalories += normalizedActivity.calories || 0;
        sportStats.activities.push(normalizedActivity);

      } catch (error) {
        console.warn('Error processing activity for statistics:', activity, error);
      }
    });

    // Convert Set to number for active days
    stats.overall.activeDays = stats.overall.activeDays.size;
    Object.keys(stats.bySport).forEach(sport => {
      stats.bySport[sport].activeDays = stats.bySport[sport].activeDays.size;
    });

    return stats;
  }

  /**
* Group and summarize activities by code ranges
* Example: run (100-199), bike (200-299), swim (300-399)
*/
  function groupSummarizeByCode(activities) {
    const groupSummary = {
      run: { distance: 0, time: 0, count: 0, days: new Set() },
      bike: { distance: 0, time: 0, count: 0, days: new Set() },
      swim: { distance: 0, time: 0, count: 0, days: new Set() }
    };

    activities.forEach(a => {
      const code = parseInt(a.code, 10);
      if (code >= 100 && code < 200) {
        groupSummary.run.distance += a.distance || 0;
        groupSummary.run.time += parseTimeToSeconds(a.time || 0);
        groupSummary.run.count += 1;
        groupSummary.run.days.add(a.date);
      } else if (code >= 200 && code < 300) {
        groupSummary.bike.distance += a.distance || 0;
        groupSummary.bike.time += parseTimeToSeconds(a.time || 0);
        groupSummary.bike.count += 1;
        groupSummary.bike.days.add(a.date);
      } else if (code >= 300 && code < 400) {
        groupSummary.swim.distance += a.distance || 0;
        groupSummary.swim.time += parseTimeToSeconds(a.time || 0);
        groupSummary.swim.count += 1;
        groupSummary.swim.days.add(a.date);
      }
    });

    // Convert days Set to count
    groupSummary.run.days = groupSummary.run.days.size;
    groupSummary.bike.days = groupSummary.bike.days.size;
    groupSummary.swim.days = groupSummary.swim.days.size;

    return groupSummary;
  }

  /**
  * Helper to parse time string (e.g. '1:23:45') to seconds
  */
  function parseTimeToSeconds(timeStr) {
    if (typeof timeStr === 'number') return timeStr;
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number).reverse();
    let seconds = 0;
    if (parts[0]) seconds += parts[0];
    if (parts[1]) seconds += parts[1] * 60;
    if (parts[2]) seconds += parts[2] * 3600;
    return seconds;
  }

  /**
   * Generate HTML for statistics display
   */
  function generateStatisticsHTML(stats, date, groupSummary) {
    const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return `
        <div class="coros-stats-summary">
          ${generateSummaryCards(stats.overall, groupSummary)}
        </div>
        
        <div class="coros-stats-by-sport">
          <h3>Activity Breakdown by Sport</h3>
          ${generateSportTable(stats.bySport)}
        </div>
        
        ${generateInsights(stats, date)}
      `;
  }

  /**
   * Generate summary cards HTML
   */
  function generateSummaryCards(overallStats, groupSummary) {
    // Group summary cards for run, bike, swim
    const groupCards = [
      {
        key: 'run',
        label: 'Run',
        icon: '🏃',
        color: '#FF6B6B',
      },
      {
        key: 'bike',
        label: 'Bike',
        icon: '🚴',
        color: '#4ECDC4',
      },
      {
        key: 'swim',
        label: 'Swim',
        icon: '🏊',
        color: '#45B7D1',
      }
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

        ${groupCards}

        <div class="coros-stat-card">
          <div class="coros-stat-value">${overallStats.totalActivities}</div>
          <div class="coros-stat-label">Total Activities</div>
        </div>
        
        <div class="coros-stat-card">
          <div class="coros-stat-value">${overallStats.activeDays}</div>
          <div class="coros-stat-label">Active Days</div>
        </div>
        
        <div class="coros-stat-card">
          <div class="coros-stat-value">${formatDistance(overallStats.totalDistance)}</div>
          <div class="coros-stat-label">Total Distance</div>
        </div>
        
        <div class="coros-stat-card">
          <div class="coros-stat-value">${formatDuration(overallStats.totalDuration)}</div>
          <div class="coros-stat-label">Total Time</div>
        </div>
        
        <div class="coros-stat-card">
          <div class="coros-stat-value">${formatCalories(overallStats.totalCalories)}</div>
          <div class="coros-stat-label">Total Calories</div>
        </div>

      `;
  }

  /**
   * Generate sport breakdown table HTML
   */
  function generateSportTable(sportStats) {
    if (Object.keys(sportStats).length === 0) {
      return `
          <div class="coros-empty-state">
            <p>No activity data available for this period.</p>
          </div>
        `;
    }

    // Sort sports by total activities
    const sortedSports = Object.entries(sportStats)
      .sort(([, a], [, b]) => b.count - a.count);

    const tableRows = sortedSports.map(([sportType, data]) => {
      const avgDistance = data.totalDistance / data.count;
      const avgDuration = data.totalDuration / data.count;

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
            <td>${formatDistance(data.totalDistance)}</td>
            <td>${formatDuration(data.totalDuration)}</td>
            <td>${formatDistance(avgDistance)}</td>
            <td>${formatDuration(avgDuration)}</td>
            <td>${formatCalories(data.totalCalories)}</td>
          </tr>
        `;
    }).join('');

    return `
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
      `;
  }

  /**
   * Generate insights section
   */
  function generateInsights(stats, date) {
    const insights = calculateInsights(stats, date);

    if (insights.length === 0) {
      return '';
    }

    const insightsHTML = insights.map(insight => `
        <div class="coros-insight-item">
          <span class="coros-insight-icon">${insight.icon}</span>
          <span class="coros-insight-text">${insight.text}</span>
        </div>
      `).join('');

    return `
        <div class="coros-stats-insights">
          <h3>Monthly Insights</h3>
          <div class="coros-insights-list">
            ${insightsHTML}
          </div>
        </div>
      `;
  }

  /**
   * Calculate insights from statistics
   */
  function calculateInsights(stats, date) {
    const insights = [];
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

    try {
      // Activity frequency insight
      const activityRate = (stats.overall.activeDays / daysInMonth * 100).toFixed(0);
      if (activityRate >= 50) {
        insights.push({
          icon: '🔥',
          text: `Great consistency! You were active ${activityRate}% of days this month.`
        });
      } else if (activityRate >= 25) {
        insights.push({
          icon: '👍',
          text: `Good effort! You were active ${activityRate}% of days this month.`
        });
      }

      // Most popular sport
      const sportEntries = Object.entries(stats.bySport);
      if (sportEntries.length > 0) {
        const mostPopular = sportEntries.reduce((a, b) => a[1].count > b[1].count ? a : b);
        insights.push({
          icon: mostPopular[1].icon,
          text: `${mostPopular[1].name} was your most frequent activity with ${mostPopular[1].count} sessions.`
        });
      }

      // Distance achievement
      if (stats.overall.totalDistance >= 100000) { // 100km
        insights.push({
          icon: '🎯',
          text: `Amazing! You covered over ${formatDistance(stats.overall.totalDistance)} this month.`
        });
      }

      // Time achievement
      if (stats.overall.totalDuration >= 36000) { // 10 hours
        insights.push({
          icon: '⏱️',
          text: `You dedicated ${formatDuration(stats.overall.totalDuration)} to fitness this month!`
        });
      }

      // Variety insight
      const sportCount = Object.keys(stats.bySport).length;
      if (sportCount >= 3) {
        insights.push({
          icon: '🌟',
          text: `Great variety! You engaged in ${sportCount} different types of activities.`
        });
      }

    } catch (error) {
      console.warn('Error calculating insights:', error);
    }

    return insights;
  }

  /**
   * Normalize activity data structure
   */
  function normalizeActivity(activity) {
    return {
      id: activity.id || activity.activityId || Math.random().toString(36),
      name: activity.name || activity.title || 'Activity',
      type: normalizeActivityType(activity.type || activity.sport),
      duration: parseFloat(activity.duration || activity.movingTime || 0),
      distance: parseFloat(activity.distance || 0),
      startTime: activity.startTime || activity.date,
      calories: parseFloat(activity.calories || 0)
    };
  }

  /**
   * Normalize activity type to standard format
   */
  function normalizeActivityType(type) {
    if (!type) return 'other';

    const normalized = type.toLowerCase().replace(/[_\s-]/g, '_');

    // Map common variations to our standard types
    const typeMapping = {
      'run': 'running',
      'bike': 'cycling',
      'ride': 'cycling',
      'swim': 'swimming',
      'hike': 'hiking',
      'walk': 'walking',
      'weight_training': 'strength',
      'strength_training': 'strength',
      'gym': 'strength',
      'indoor_bike': 'indoor_cycling',
      'spinning': 'indoor_cycling',
      'treadmill_run': 'treadmill',
      'cross_training': 'other',
      'cardio': 'other'
    };

    return typeMapping[normalized] || (SPORT_TYPES[normalized] ? normalized : 'other');
  }

  /**
   * Utility formatting functions
   */
  function formatDistance(meters) {
    if (!meters || meters < 1) return '0';

    if (meters >= 1000) {
      const km = (meters / 1000).toFixed(1);
      return `${km} km`;
    } else {
      return `${Math.round(meters)} m`;
    }
  }

  function formatDuration(seconds) {
    if (!seconds || seconds < 1) return '0m';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  function formatCalories(calories) {
    if (!calories || calories < 1) return '0';

    if (calories >= 1000) {
      return `${(calories / 1000).toFixed(1)}k`;
    } else {
      return Math.round(calories).toString();
    }
  }

  // Public API
  return {
    render: render,
    calculateStatistics: calculateStatistics,
    SPORT_TYPES: SPORT_TYPES
  };

})();
