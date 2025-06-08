// Calendar visualization component for COROS Activity Calendar extension

window.CorosCalendar = (function () {
    'use strict';

    // Calendar configuration
    const MONTHS = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Sport type configurations
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
     * Render calendar view
     * @param {HTMLElement} container - Container element to render calendar
     * @param {Date} date - Current date for calendar
     * @param {Array} activities - Array of activity data
     * @param {string} viewMode - 'month' or 'week'
     */
    function render(container, date, activities, viewMode = 'month') {
        if (!container) {
            console.error('Calendar container not provided');
            return;
        }

        try {
            if (viewMode === 'week') {
                renderWeekView(container, date, activities);
            } else {
                renderMonthView(container, date, activities);
            }
        } catch (error) {
            console.error('Error rendering calendar:', error);
            container.innerHTML = `
          <div class="coros-error-state">
            <p>Failed to render calendar: ${error.message}</p>
          </div>
        `;
        }
    }

    /**
     * Render month view calendar
     */
    function renderMonthView(container, date, activities) {
        const year = date.getFullYear();
        const month = date.getMonth();

        // Process activities by date
        const activitiesByDate = processActivitiesByDate(activities);

        // Generate calendar HTML using table structure and original site classes
        const calendarHTML = `
        <div class="arco-table-container arco-table-has-fixed-col-left arco-table-has-fixed-col-right">
        <div class="arco-table-content arco-table-content-scroll-x">
        <table class="arco-table">
          <thead>
            <tr class="arco-table-tr">
              ${WEEKDAYS.map(day =>
                `<th class="arco-table-th arco-table-col-fixed-left arco-table-col-fixed-left-last td-Name field-Name">${day}</th>`
            ).join('')}
            </tr>
          </thead>
          <tbody>
            ${generateMonthRows(year, month, activitiesByDate)}
          </tbody>
        </table>
        </div>
        </div>
      `;

        container.innerHTML = calendarHTML;

        // Add event listeners for activity tooltips
        addActivityTooltips(container);
    }

    /**
     * Render week view calendar
     */
    function renderWeekView(container, date, activities) {
        const weekStart = getWeekStart(date);
        const activitiesByDate = processActivitiesByDate(activities);

        const weekDays = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);
            weekDays.push(day);
        }

        const calendarHTML = `
        <table class="arco-table">
          <thead>
            <tr class="arco-table-tr">
              ${WEEKDAYS.map(day =>
                `<th class="arco-table-th arco-table-col-fixed-left arco-table-col-fixed-left-last td-Name field-Name">${day}</th>`
            ).join('')}
            </tr>
          </thead>
          <tbody>
            <tr class="arco-table-tr">
              ${weekDays.map(day =>
                generateDayTd(day, activitiesByDate, false)
            ).join('')}
            </tr>
          </tbody>
        </table>
      `;

        container.innerHTML = calendarHTML;
        container.classList.add('week-view');

        // Add event listeners for activity tooltips
        addActivityTooltips(container);
    }

    /**
     * Process activities data and group by date
     */
    function processActivitiesByDate(activities) {
        const activitiesByDate = {};

        if (!Array.isArray(activities)) {
            return activitiesByDate;
        }

        activities.forEach(activity => {
            try {
                const date = new Date(activity.date || activity.startTime);
                const dateKey = formatDateKey(date);

                if (!activitiesByDate[dateKey]) {
                    activitiesByDate[dateKey] = [];
                }

                // Normalize activity data
                const normalizedActivity = {
                    id: activity.id || activity.activityId,
                    name: activity.name || activity.title || 'Activity',
                    type: normalizeActivityType(activity.type || activity.sport),
                    code: activity.code || activity.sportType || activity.sportCode || undefined,
                    duration: activity.duration || activity.movingTime || 0,
                    distance: activity.distance || 0,
                    startTime: activity.startTime || activity.date,
                    calories: activity.calories || 0
                };

                activitiesByDate[dateKey].push(normalizedActivity);
            } catch (error) {
                console.warn('Error processing activity:', activity, error);
            }
        });

        // Sort activities by start time within each day
        Object.keys(activitiesByDate).forEach(dateKey => {
            activitiesByDate[dateKey].sort((a, b) =>
                new Date(a.startTime) - new Date(b.startTime)
            );
        });

        return activitiesByDate;
    }

    /**
     * Generate month days HTML
     */
    function generateMonthRows(year, month, activitiesByDate) {
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const rows = [];
        let currentDate = new Date(startDate);

        // Generate 6 weeks (42 days) to ensure consistent calendar layout
        for (let week = 0; week < 6; week++) {
            const tds = [];
            for (let day = 0; day < 7; day++) {
                const isCurrentMonth = currentDate.getMonth() === month;
                tds.push(generateDayTd(currentDate, activitiesByDate, !isCurrentMonth));
                currentDate.setDate(currentDate.getDate() + 1);
            }
            rows.push(`<tr class="arco-table-tr">${tds.join('')}</tr>`);
        }
        return rows.join('');
    }

    /**
     * Generate individual day cell HTML
     */
    function generateDayTd(date, activitiesByDate, isOtherMonth) {
        const dateKey = formatDateKey(date);
        const activities = activitiesByDate[dateKey] || [];
        const isToday = isDateToday(date);

        const classes = [
            'arco-table-td',
            'arco-table-col-fixed-left',
            'arco-table-col-fixed-left-last',
            'td-Name',
            isOtherMonth ? 'other-month' : '',
            isToday ? 'today' : ''
        ].filter(Boolean).join(' ');

        const activitiesHTML = generateActivitiesHTML(activities);

        return `
        <td class="${classes}" data-date="${dateKey}">
          <div class="coros-day-number">${date.getDate()}</div>
          <div class="coros-day-activities">
            ${activitiesHTML}
          </div>
        </td>
      `;
    }

    /**
     * Generate activities HTML for a day
     */
    function generateActivitiesHTML(activities) {
        if (!activities || activities.length === 0) {
            return '';
        }

        const maxVisible = 10;
        const visibleActivities = activities.slice(0, maxVisible);
        const hiddenCount = activities.length - maxVisible;

        let html = visibleActivities.map(activity => {
            const sportConfig = SPORT_TYPES[activity.type] || SPORT_TYPES.other;
            const duration = formatDuration(activity.duration);
            const distance = formatDistance(activity.distance);

            return `
          <div class="coros-activity-item" 
               data-activity-id="${activity.id}"
               data-sport-type="${activity.code || 'other'}"
               style="background-color: ${sportConfig.color}20; border-left: 3px solid ${sportConfig.color}">
            <span class="coros-activity-icon">${sportConfig.icon}</span>
            <span class="coros-activity-details">
              ${distance ? `${distance}` : duration}
            </span>
          </div>
        `;
        }).join('');

        if (hiddenCount > 0) {
            html += `<div class="coros-activity-more">+${hiddenCount} more</div>`;
        }

        return html;
    }

    /**
     * Add activity tooltips and click handlers
     */
    function addActivityTooltips(container) {
        const activityItems = container.querySelectorAll('.coros-activity-item');

        activityItems.forEach(item => {
            item.addEventListener('mouseenter', showActivityTooltip);
            item.addEventListener('mouseleave', hideActivityTooltip);
            item.addEventListener('click', handleActivityClick);
        });
    }

    /**
     * Show activity tooltip
     */
    function showActivityTooltip(event) {
        const activityId = event.currentTarget.dataset.activityId;
        // Find activity data and show tooltip
        // This would integrate with COROS API to get detailed activity info
        console.log('Show tooltip for activity:', activityId);
    }

    /**
     * Hide activity tooltip
     */
    function hideActivityTooltip(event) {
        // Hide tooltip
        const existingTooltip = document.querySelector('.coros-activity-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
    }

    /**
     * Handle activity click
     */
    function handleActivityClick(event) {
        const activityId = event.currentTarget.dataset.activityId;
        const sportType = event.currentTarget.dataset.sportType || 'other';
        // Navigate to activity details or open in new tab
        if (activityId) {
            // https://t.coros.com/activity-detail?labelId=469565692620865562&sportType=301
            const activityUrl = `https://t.coros.com/activity-detail?labelId=${activityId}&sportType=${sportType}`;
            window.open(activityUrl, '_blank');
        }
    }

    /**
     * Utility functions
     */
    function formatDateKey(date) {
        return date.toISOString().split('T')[0];
    }

    function isDateToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    function getWeekStart(date) {
        const start = new Date(date);
        const day = start.getDay();
        const diff = start.getDate() - day;
        start.setDate(diff);
        return start;
    }

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

    function formatDuration(seconds) {
        if (!seconds || seconds < 60) return '';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    function formatDistance(meters) {
        if (!meters || meters < 100) return '';

        if (meters >= 1000) {
            const km = (meters / 1000).toFixed(1);
            return `${km}km`;
        } else {
            return `${Math.round(meters)}m`;
        }
    }

    // Public API
    return {
        render: render,
        SPORT_TYPES: SPORT_TYPES
    };

})();
  