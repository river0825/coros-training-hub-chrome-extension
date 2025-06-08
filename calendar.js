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
            // Calculate summary stats for cards (reuse logic from statistics.js)
            const stats = calculateStatisticsForCalendar(activities, date);
            const groupSummary = groupSummarizeByCodeForCalendar(activities);
            const summaryCardsHTML = generateSummaryCardsForCalendar(stats.overall, groupSummary);

            let calendarHTML = '';
            if (viewMode === 'week') {
                calendarHTML = renderWeekViewHTML(date, activities);
            } else {
                calendarHTML = renderMonthViewHTML(date, activities);
            }

            container.innerHTML = `
                <div class="coros-stats-summary" style="margin-bottom: 16px;">${summaryCardsHTML}</div>
                ${calendarHTML}
            `;

            // Add event listeners for activity tooltips (after calendar is rendered)
            addActivityTooltips(container);
        } catch (error) {
            console.error('Error rendering calendar:', error);
            container.innerHTML = `
              <div class="coros-error-state">
                <p>Failed to render calendar: ${error.message}</p>
              </div>
            `;
        }
    }

    // --- Summary Cards Logic (adapted from statistics.js) ---
    function calculateStatisticsForCalendar(activities, date) {
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
            }
        };

        activities.forEach(activity => {
            try {
                const normalizedActivity = normalizeActivityForCalendar(activity);
                const activityDate = new Date(normalizedActivity.startTime);
                const dateKey = activityDate.toISOString().split('T')[0];
                stats.overall.totalActivities++;
                stats.overall.activeDays.add(dateKey);
                stats.overall.totalDistance += normalizedActivity.distance || 0;
                stats.overall.totalDuration += normalizedActivity.duration || 0;
                stats.overall.totalCalories += normalizedActivity.calories || 0;
            } catch (error) {
                // skip
            }
        });
        stats.overall.activeDays = stats.overall.activeDays.size;
        return stats;
    }

    function groupSummarizeByCodeForCalendar(activities) {
        const groupSummary = {
            run: { distance: 0, time: 0, count: 0, days: new Set() },
            bike: { distance: 0, time: 0, count: 0, days: new Set() },
            swim: { distance: 0, time: 0, count: 0, days: new Set() }
        };

        activities.forEach(a => {
            const code = parseInt(a.code, 10);
            const day = typeof a.date === 'string' ? a.date.split('T')[0] : a.date;
            if (code >= 100 && code < 200) {
                groupSummary.run.distance += a.distance || 0;
                groupSummary.run.time += parseTimeToSecondsForCalendar(a.duration || 0);
                groupSummary.run.count += 1;
                groupSummary.run.days.add(day);
            } else if (code >= 200 && code < 300) {
                groupSummary.bike.distance += a.distance || 0;
                groupSummary.bike.time += parseTimeToSecondsForCalendar(a.duration || 0);
                groupSummary.bike.count += 1;
                groupSummary.bike.days.add(day);
            } else if (code >= 300 && code < 400) {
                groupSummary.swim.distance += a.distance || 0;
                groupSummary.swim.time += parseTimeToSecondsForCalendar(a.duration || 0);
                groupSummary.swim.count += 1;
                groupSummary.swim.days.add(day);
            }
        });

        groupSummary.run.days = groupSummary.run.days.size;
        groupSummary.bike.days = groupSummary.bike.days.size;
        groupSummary.swim.days = groupSummary.swim.days.size;
        return groupSummary;
    }

    function parseTimeToSecondsForCalendar(timeStr) {
        if (typeof timeStr === 'number') return timeStr;
        if (!timeStr) return 0;
        const parts = timeStr.split(':').map(Number).reverse();
        let seconds = 0;
        if (parts[0]) seconds += parts[0];
        if (parts[1]) seconds += parts[1] * 60;
        if (parts[2]) seconds += parts[2] * 3600;
        return seconds;
    }

    function generateSummaryCardsForCalendar(overallStats, groupSummary) {
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
                  <div class="coros-stat-detail">${formatDistanceForCalendar(g.distance)}, ${formatDurationForCalendar(g.time)}</div>
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
              <div class="coros-stat-value">${formatDistanceForCalendar(overallStats.totalDistance)}</div>
              <div class="coros-stat-label">Total Distance</div>
            </div>
            <div class="coros-stat-card">
              <div class="coros-stat-value">${formatDurationForCalendar(overallStats.totalDuration)}</div>
              <div class="coros-stat-label">Total Time</div>
            </div>
            <div class="coros-stat-card">
              <div class="coros-stat-value">${formatCaloriesForCalendar(overallStats.totalCalories)}</div>
              <div class="coros-stat-label">Total Calories</div>
            </div>
        `;
    }

    function formatDistanceForCalendar(meters) {
        if (!meters || meters < 1) return '0';
        if (meters >= 1000) {
            const km = (meters / 1000).toFixed(1);
            return `${km} km`;
        } else {
            return `${Math.round(meters)} m`;
        }
    }

    function formatDurationForCalendar(seconds) {
        if (!seconds || seconds < 1) return '0m';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    function formatCaloriesForCalendar(calories) {
        if (!calories || calories < 1) return '0';
        if (calories >= 1000) {
            return `${(calories / 1000).toFixed(1)}k`;
        } else {
            return Math.round(calories).toString();
        }
    }

    function normalizeActivityForCalendar(activity) {
        return {
            id: activity.id || activity.activityId || Math.random().toString(36),
            name: activity.name || activity.title || 'Activity',
            type: normalizeActivityType(activity.type || activity.sport),
            duration: parseFloat(activity.duration || activity.movingTime || 0),
            distance: parseFloat(activity.distance || 0),
            startTime: activity.startTime || activity.date,
            calories: parseFloat(activity.calories || 0),
            code: activity.code || activity.sportType || activity.sportCode || undefined,
            date: activity.date
        };
    }

    // --- End summary cards logic ---

    // Helper: renderMonthView and renderWeekView as HTML string (not direct DOM)
    function renderMonthViewHTML(date, activities) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const activitiesByDate = processActivitiesByDate(activities);
        return `
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
    }

    function renderWeekViewHTML(date, activities) {
        const weekStart = getWeekStart(date);
        const activitiesByDate = processActivitiesByDate(activities);
        const weekDays = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);
            weekDays.push(day);
        }
        return `
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

        // Group activities by type
        const grouped = {};
        activities.forEach(activity => {
            const type = activity.type || 'other';
            if (!grouped[type]) {
                grouped[type] = {
                    ...activity,
                    count: 0,
                    totalDistance: 0,
                    totalDuration: 0
                };
            }
            grouped[type].count += 1;
            grouped[type].totalDistance += activity.distance || 0;
            grouped[type].totalDuration += activity.duration || 0;
        });

        const groupedList = Object.values(grouped);
        // Sort by sport type name for consistency
        groupedList.sort((a, b) => (a.type > b.type ? 1 : -1));

        let html = groupedList.map(group => {
            const sportConfig = SPORT_TYPES[group.type] || SPORT_TYPES.other;
            const distance = formatDistance(group.totalDistance);
            const duration = formatDuration(group.totalDuration);
            const countStr = group.count > 1 ? ` x${group.count}` : '';
            // Show both distance and duration if both exist
            let details = '';
            if (distance && duration) {
                details = `${distance} / ${duration}`;
            } else if (distance) {
                details = distance;
            } else if (duration) {
                details = duration;
            }

            // Complete sportIconMap from provided HTML
            const sportIconMap = {
                100: { icon: 'icon-outrun', color: 'rgb(248, 192, 50)' },
                101: { icon: 'icon-indoor_run', color: 'rgb(248, 192, 50)' },
                102: { icon: 'icon-trailrun', color: 'rgb(248, 192, 50)' },
                103: { icon: 'icon-groundrun', color: 'rgb(248, 192, 50)' },
                104: { icon: 'icon-hike', color: 'rgb(250, 225, 60)' },
                105: { icon: 'icon-climb', color: 'rgb(48, 201, 202)' },
                200: { icon: 'icon-cycle', color: 'rgb(28, 181, 64)' },
                201: { icon: 'icon-indoor_bike', color: 'rgb(28, 181, 64)' },
                202: { icon: 'icon-road-ebike', color: 'rgb(28, 181, 64)' },
                203: { icon: 'icon-gravel-road-riding', color: 'rgb(28, 181, 64)' },
                204: { icon: 'icon-mountain-riding', color: 'rgb(28, 181, 64)' },
                205: { icon: 'icon-mteb', color: 'rgb(28, 181, 64)' },
                299: { icon: 'icon-cycle', color: 'rgb(28, 181, 64)' },
                300: { icon: 'icon-poolswim', color: 'rgb(48, 112, 255)' },
                301: { icon: 'icon-openwater', color: 'rgb(48, 112, 255)' },
                400: { icon: 'icon-Indoor_erobics', color: 'rgb(217, 46, 218)' },
                401: { icon: 'icon-outdoor_aerobics', color: 'rgb(217, 46, 218)' },
                402: { icon: 'icon-strength', color: 'rgb(217, 46, 218)' },
                800: { icon: 'icon-indoor_climb', color: 'rgb(48, 201, 202)' },
                801: { icon: 'icon-bouldering_w', color: 'rgb(48, 201, 202)' },
                900: { icon: 'icon-walk', color: 'rgb(250, 225, 60)' },
                901: { icon: 'icon-jump', color: 'rgb(217, 46, 218)' },
                10000: { icon: 'icon-triathlon', color: 'rgb(255, 159, 64)' },
                10003: { icon: 'icon-PitchClimb', color: 'rgb(48, 201, 202)' },
                other: { icon: 'icon-other', color: 'rgb(200,200,200)' }
            };
            let iconTypeClass = 'icon-other';
            let iconColor = 'rgb(200,200,200)';
            let dataSport = '';
            if (group.code && sportIconMap[group.code]) {
                iconTypeClass = sportIconMap[group.code].icon;
                iconColor = sportIconMap[group.code].color;
                dataSport = group.code;
            } else {
                iconTypeClass = sportIconMap.other.icon;
                iconColor = sportIconMap.other.color;
                dataSport = '';
            }
            // Custom icon HTML
            const iconHTML = `<span style="width:auto; padding: 4px;" class="arco-table-td-content"><div class="flex-1 flex"><span class="iconfont-sport ${iconTypeClass} text-20" data-sport="${dataSport}" style="color: ${iconColor};"></span></div></span>`;

            return `
          <div class="coros-activity-item" 
               data-activity-id="${group.id}"
               data-sport-type="${group.code || 'other'}"
               style="background-color: ${sportConfig.color}20; border-left: 3px solid ${sportConfig.color}; display: flex; align-items: center;">
            ${iconHTML}
            ${countStr}
            <span class="coros-activity-details" style="margin-left: 4px;">
              ${details}
            </span>
          </div>
        `;
        }).join('');

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
            // when clicked, open the activity details page
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
  