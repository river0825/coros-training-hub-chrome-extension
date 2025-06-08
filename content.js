// content.js
// Extract activity data (date, sport type, distance, time) from COROS API

(async function extractActivitiesFromAPI() {
  // Replace with dynamic token/cookie retrieval if needed
  const accesstoken = (() => {
    // Try to get from cookies
    const match = document.cookie.match(/CPL-coros-token=([^;]+)/);
    const token = match ? match[1] : '';
    if (token) {
      console.debug('[content.js] COROS accesstoken found in cookies.');
    } else {
      console.debug('[content.js] COROS accesstoken NOT found in cookies.');
    }
    return token;
  })();

  if (!accesstoken) {
    console.warn('COROS accesstoken not found in cookies.');
    window.corosActivities = [];
    return;
  }

  window.updateCorosActivitiesToMonth = async function (year, month) {
    window.corosActivities = [];

    if (typeof year === 'string') {
      year = parseInt(year, 10);
    }
    if (typeof month === 'string') {
      month = parseInt(month, 10);
    }
    if (typeof year !== 'number' || isNaN(year)) {
      year = new Date().getFullYear();
    }
    if (typeof month !== 'number' || isNaN(month)) {
      month = new Date().getMonth();
    }

    const now = new Date();
    const isCurrentMonth = (year === now.getFullYear() && month === now.getMonth());
    const cacheKey = `corosActivities-${year}-${String(month + 1).padStart(2, '0')}`;

    // Helper to format date as YYYY-MM-DD
    function formatDate(num) {
      if (!num) return '';
      const s = num.toString();
      return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
    }
    // Map sportType to sport string (customize as needed)
    function mapSport(sportType) {
      const map = {
        100: 'run',
        103: 'track',
        300: 'swim',
        301: 'openwater',
        400: 'aerobic',
        200: 'bike',
        201: 'indoor bike',
        402: 'strength',
        10000: 'triathlon',
        // Add more as needed
      };
      return map[sportType] || 'other';
    }

    // If not current month, try to load from cache first
    if (!isCurrentMonth) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const activities = JSON.parse(cached);
          window.corosActivities = activities;
          console.debug(`[content.js] Loaded activities from cache for ${cacheKey}`);
          return;
        }
      } catch (e) {
        console.warn(`[content.js] Failed to load cache for ${cacheKey}:`, e);
      }
    }

    const fromDate = `${year}${String(month + 1).padStart(2, '0')}01`;
    const toDate = `${year}${String(month + 1).padStart(2, '0')}${String(new Date(year, month + 1, 0).getDate()).padStart(2, '0')}`;
    const url = `https://teamapi.coros.com/activity/query?size=100&pageNumber=1&modeList=&startDay=${encodeURIComponent(fromDate)}&endDay=${encodeURIComponent(toDate)}`;

    try {
      console.debug('[content.js] Fetching activities from COROS API:', url);
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'accesstoken': accesstoken,
        },
        credentials: 'include',
      });

      if (!res.ok) throw new Error('API request failed');
      const json = await res.json();
      console.debug('[content.js] Raw API response:', json);
      const dataList = json?.data?.dataList || [];
      console.debug('[content.js] Extracted dataList:', dataList);

      const activities = dataList.map(item => ({
        date: formatDate(item.date),
        sportType: item.sportType,
        sport: mapSport(item.sportType),
        distance: Number(item.distance) / 1000, // meters to km
        time: item.totalTime,
      }));

      window.corosActivities = activities;
      // If not current month, save to cache
      if (!isCurrentMonth) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(activities));
          console.debug(`[content.js] Saved activities to cache for ${cacheKey}`);
        } catch (e) {
          console.warn(`[content.js] Failed to save cache for ${cacheKey}:`, e);
        }
      }
      console.debug('[content.js] Final extracted activities:', activities);
    } catch (e) {
      console.error('[content.js] Failed to fetch activities:', e);
      window.corosActivities = [];
    }
  }
})();
// === Inject "日曆總覽" Tab and Calendar UI ===
(function injectCalendarTab() {
  function waitForTabBarAndInject() {
    // Try to find the tab bar containing "活動列表"
    const tabSelector = 'div,nav,ul';
    const tabText = '活動列表';
    const tabBar = Array.from(document.querySelectorAll(tabSelector)).find(el =>
      Array.from(el.querySelectorAll('*')).some(child => child.textContent && child.textContent.trim() === tabText)
    );
    if (!tabBar) {
      setTimeout(waitForTabBarAndInject, 500);
      return;
    }

    // Find the "活動列表" tab element
    const activityTab = Array.from(tabBar.querySelectorAll('*')).find(
      el => el.textContent && el.textContent.trim() === tabText
    );
    if (!activityTab) {
      setTimeout(waitForTabBarAndInject, 500);
      return;
    }

    // Avoid duplicate injection
    if (tabBar.querySelector('.coros-calendar-tab')) return;

    // Clone the style of the existing tab
    const calendarTab = activityTab.cloneNode(true);
    calendarTab.textContent = '日曆總覽';
    calendarTab.classList.add('coros-calendar-tab');
    calendarTab.style.cursor = 'pointer';

    // Insert the new tab after "活動列表"
    activityTab.parentNode.insertBefore(calendarTab, activityTab.nextSibling);

    // Calendar container
    let calendarContainer = document.createElement('div');
    calendarContainer.className = 'coros-calendar-container';
    calendarContainer.style.display = 'none';
    calendarContainer.style.padding = '24px';
    calendarContainer.style.background = 'var(--coros-bg, #181a1b)';
    calendarContainer.style.color = 'var(--coros-fg, #f5f6fa)';
    calendarContainer.style.borderRadius = '12px';
    calendarContainer.style.boxShadow = '0 2px 16px rgba(0,0,0,0.5)';
    calendarContainer.style.fontFamily = 'Inter, "Noto Sans TC", Arial, sans-serif';

    // Inject dark theme CSS for calendar UI
    if (!document.getElementById('coros-calendar-dark-theme')) {
      const style = document.createElement('style');
      style.id = 'coros-calendar-dark-theme';
      style.textContent = `
        .coros-calendar-container {
          --coros-bg: #181a1b;
          --coros-fg: #f5f6fa;
          --coros-accent: #ffb300;
          --coros-cell-bg: #232527;
          --coros-cell-hover: #292b2e;
          --coros-border: #333;
        }
        .coros-calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          background: var(--coros-bg);
          border-radius: 8px;
          margin-bottom: 24px;
        }
        .coros-calendar-day-header {
          text-align: center;
          font-weight: bold;
          padding: 6px 0;
          color: var(--coros-accent);
          background: transparent;
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
        .coros-calendar-cell .coros-activity {
          display: flex;
          align-items: center;
          font-size: 12px;
          margin-top: 2px;
          gap: 2px;
        }
        .coros-calendar-cell .coros-activity-icon {
          font-size: 14px;
          margin-right: 2px;
        }
        .coros-calendar-report {
          background: var(--coros-cell-bg);
          border-radius: 8px;
          padding: 16px;
          margin-top: 8px;
          border: 1px solid var(--coros-border);
        }
        .coros-calendar-report-title {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 8px;
          color: var(--coros-accent);
        }
        .coros-calendar-report-table {
          width: 100%;
          border-collapse: collapse;
        }
        .coros-calendar-report-table th, .coros-calendar-report-table td {
          padding: 4px 8px;
          text-align: left;
        }
        .coros-calendar-report-table th {
          color: var(--coros-accent);
        }
      `;
      document.head.appendChild(style);
    }

    calendarContainer.innerHTML = '<h2 class="coros-calendar-title" style="margin:0 0 20px 0;font-size:22px;font-weight:700;letter-spacing:1px;text-align:left;color:var(--coros-accent);">活動日曆總覽</h2><div id="coros-calendar-summary">載入中...</div>';

    // Insert calendar container after the activities list container
    // Try to find the activities list container (assume it's a sibling of tabBar or nearby)
    let activitiesList = tabBar.parentNode.querySelector('div,section,main');
    if (!activitiesList) activitiesList = tabBar.parentNode;
    activitiesList.parentNode.insertBefore(calendarContainer, activitiesList.nextSibling);

    // Tab switching logic
    function setActiveTab(tab) {
      // Remove active class from all tabs
      Array.from(tabBar.children).forEach(child => {
        child.classList && child.classList.remove('active');
      });
      calendarTab.classList.remove('active');
      activityTab.classList.remove('active');
      tab.classList.add('active');
    }


    // Track displayed year/month as state
    let displayedYear, displayedMonth;
    function setDisplayedMonthYear(y, m) {
      displayedYear = y;
      displayedMonth = m;
    }
    function getDisplayedMonthYear() {
      if (typeof displayedYear === 'number' && typeof displayedMonth === 'number') {
        return { year: displayedYear, month: displayedMonth };
      } else {
        // Before 3rd day: previous month; after (and including) 3rd: current month
        const today = new Date();
        if (today.getDate() < 3) {
          let prevMonth = today.getMonth() - 1;
          let prevYear = today.getFullYear();
          if (prevMonth < 0) {
            prevMonth = 11;
            prevYear--;
          }
          return { year: prevYear, month: prevMonth };
        } else {
          return { year: today.getFullYear(), month: today.getMonth() };
        }
      }
    }

    function showCalendarTab(forceYear, forceMonth) {
      setActiveTab(calendarTab);
      if (activitiesList) activitiesList.style.display = 'none';
      calendarContainer.style.display = '';
      // Populate calendar summary with calendar grid and monthly report
      const summaryDiv = calendarContainer.querySelector('#coros-calendar-summary');
      summaryDiv.innerHTML = '';
      window.updateCorosActivitiesToMonth(forceYear, forceMonth).then(() => {
        if (window.corosActivities && Array.isArray(window.corosActivities)) {
          const activities = window.corosActivities.map(a => ({
            ...a,
            dateObj: new Date(a.date),
            type: a.sport || '其他',
            sportCode: a.sportType
          }));

          // Get current month/year (default: today or state)
          let year, month;
          if (typeof forceYear === 'number' && typeof forceMonth === 'number') {
            year = forceYear;
            month = forceMonth;
          } else {
            const d = getDisplayedMonthYear();
            year = d.year;
            month = d.month;
          }
          setDisplayedMonthYear(year, month);

          // Group activities by date
          const activityMap = {};
          activities.forEach(a => {
            const d = a.dateObj.toISOString().slice(0, 10);
            if (!activityMap[d]) activityMap[d] = [];
            activityMap[d].push(a);
          });

          // Sport icon mapping (emoji fallback)
          // Map sport types to COROS iconfont class names
          // Mapping from sportType to icon class, data-sport, and color
          const sportIconMap = {
            100: { icon: 'icon-outrun', sumSport: 100, dataSport: 100, color: 'rgb(248, 192, 50)' },   // 跑步
            103: { icon: 'icon-groundrun', sumSport: 100, dataSport: 103, color: 'rgb(255, 99, 132)' },   // 田徑
            200: { icon: 'icon-cycle', sumSport: 200, dataSport: 200, color: 'rgb(75, 192, 192)' },   // 自行車
            201: { icon: 'icon-indoor_bike', sumSport: 201, dataSport: 201, color: 'rgb(75, 192, 192)' },   // 自行車
            300: { icon: 'icon-poolswim', sumSport: 300, dataSport: 300, color: 'rgb(54, 162, 235)' },   // 游泳
            301: { icon: 'icon-openwater', sumSport: 301, dataSport: 301, color: 'rgb(0, 204, 204)' },    // 開放水域
            400: { icon: 'icon-Indoor_erobics', sumSport: 400, dataSport: 400, color: 'rgb(217, 46, 218)' },   // 有氧
            402: { icon: 'icon-strength', sumSport: 402, dataSport: 402, color: 'rgb(153, 102, 255)' },  // 力量
            10000: { icon: 'icon-triathlon', sumSport: 10000, dataSport: 10000, color: 'rgb(255, 159, 64)' },   // 鐵人三項
            // Add more as needed
            other: { icon: 'icon-other', dataSport: '', color: 'rgb(200,200,200)' }
          };

          function getSportIcon(sportType) {
            const entry = sportIconMap[sportType] || sportIconMap['other'];

            console.log('[content.js] getSportIcon called with:', sportType);
            console.debug('[content.js] getSportIcon entry:', entry);
            // icon=<span class="arco-table-cell arco-table-cell-align-left"><!----><!----><span class="arco-table-td-content"><div data-v-16496a7c="" class="flex-1 flex"><span data-v-16496a7c="" class="iconfont-sport iconfont-sport icon-outrun text-20" data-sport="100" style="color: rgb(248, 192, 50);"></span></div></span></span>
            icon = `<span class="arco-table-cell arco-table-cell-align-left"><!----><!----><span class="arco-table-td-content"><div data-v-16496a7c="" class="flex-1 flex"><span data-v-16496a7c="" class="iconfont-sport iconfont-sport ${entry.icon} text-20" data-sport="${entry.dataSport}" style="color: ${entry.color};"></span></div></span></span>`;
            return icon;
          }

          // Calendar grid logic
          function getDaysInMonth(y, m) {
            return new Date(y, m + 1, 0).getDate();
          }
          function getFirstDayOfWeek(y, m) {
            return new Date(y, m, 1).getDay();
          }
          const daysInMonth = getDaysInMonth(year, month);
          const firstDay = getFirstDayOfWeek(year, month);


          // Month names for display
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
          monthNavigator = `<div class="arco-btn-group mx-16">
  <button id="monthPrevBtn" class="arco-btn arco-btn-secondary arco-btn-shape-square arco-btn-size-medium arco-btn-status-normal" type="button"><span class="iconfont iconxiangzuo text-14"></span></button>
  <h2 id="currentMonth" class="text-2xl font-semibold mx-4">${monthNames[month]} ${year}</h2>
  <button id="monthNextBtn" class="arco-btn arco-btn-secondary arco-btn-shape-square arco-btn-size-medium arco-btn-status-normal" type="button"><span class="iconfont iconxiangyou text-14"></span></button>
</div>`

          // Render day headers
          const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
          let gridHtml = '<div class="coros-calendar-grid">';
          weekDays.forEach(d => {
            gridHtml += `<div class="coros-calendar-day-header">${d}</div>`;
          });

          // Render empty cells before first day
          for (let i = 0; i < firstDay; i++) {
            gridHtml += `<div class="coros-calendar-cell"></div>`;
          }

          // Render days
          // Ensure 'today' is defined for correct highlighting
          const today = new Date();
          for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isToday = (today.getDate() === d && today.getMonth() === month && today.getFullYear() === year);
            gridHtml += `<div class="coros-calendar-cell${isToday ? ' today' : ''}"><div style="font-weight:bold">${d}</div>`;
            if (activityMap[dateStr]) {
              // Group by type
              const typeGroups = {};
              activityMap[dateStr].forEach(act => {
                if (!typeGroups[act.type]) typeGroups[act.type] = [];
                typeGroups[act.type].push(act);
              });
              Object.keys(typeGroups).forEach(type => {
                const acts = typeGroups[type];
                const totalDist = acts.reduce((sum, a) => sum + (a.distance || 0), 0).toFixed(2);
                // Parse a.totalTime if it's a string in HH:MM:SS format
                function parseTimeToSeconds(t) {
                  if (typeof t === 'number') return t;
                  if (typeof t === 'string' && t.includes(':')) {
                    const parts = t.split(':').map(Number);
                    if (parts.length === 3) {
                      return parts[0] * 3600 + parts[1] * 60 + parts[2];
                    } else if (parts.length === 2) {
                      return parts[0] * 60 + parts[1];
                    }
                  }
                  return 0;
                }
                const totalTime = acts.reduce((sum, a) => sum + parseTimeToSeconds(a.time || 0), 0);
                // Find sportType from acts[0] for correct icon rendering
                const sportTypeValue = acts[0]?.sportType || acts[0]?.type || 'other';
                console.debug('[content.js] Rendering activity:', type, 'with sportType:', sportTypeValue);
                gridHtml += `<div class="coros-activity"><span class="coros-activity-icon">${getSportIcon(sportTypeValue)}</span>${type}<span style="margin-left:4px;color:#aaa;">${totalDist}km</span></div>`;
              });
            }
            gridHtml += `</div>`;
          }
          gridHtml += '</div>';

          // Monthly report
          const report = {};
          // Summary by group: run, bike, swim
          // Add Sets to track unique days for each group
          const groupSummary = {
            run: { distance: 0, time: 0, count: 0, days: new Set() },
            bike: { distance: 0, time: 0, count: 0, days: new Set() },
            swim: { distance: 0, time: 0, count: 0, days: new Set() }
          };
          function parseTimeToSeconds(t) {
            if (typeof t === 'number') return t;
            if (typeof t === 'string' && t.includes(':')) {
              const parts = t.split(':').map(Number);
              if (parts.length === 3) {
                return parts[0] * 3600 + parts[1] * 60 + parts[2];
              } else if (parts.length === 2) {
                return parts[0] * 60 + parts[1];
              }
            }
            return 0;
          }
          activities.forEach(a => {
            // only include activities for the displayed month
            if (a.dateObj.getFullYear() !== year || a.dateObj.getMonth() !== month) return;
            if (!report[a.sportCode]) report[a.sportCode] = { distance: 0, time: 0, count: 0 };
            report[a.sportCode].distance += a.distance || 0;
            report[a.sportCode].time += parseTimeToSeconds(a.time || 0);
            report[a.sportCode].count += 1;
            report[a.sportCode].type = a.type;
            // Group summary
            const code = Number(a.sportCode);
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
          function formatTime(sec) {
            if (!sec) return '0:00:00';
            const h = Math.floor(sec / 3600);
            const m = Math.floor((sec % 3600) / 60);
            const s = sec % 60;
            return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
          }
          // Group summary HTML
          let groupSummaryHtml = `
        <table class="coros-calendar-report-table" style="margin-bottom:12px;">
          <tr>
            <td>${getSportIcon(100)}</td>
            <td>跑步 [${groupSummary.run.count} 次 / ${groupSummary.run.days.size} 天] ${groupSummary.run.distance.toFixed(2)} km / ${formatTime(groupSummary.run.time)}</td>
            <td>${getSportIcon(200)}</td>
            <td>自行車 [${groupSummary.bike.count} 次 / ${groupSummary.bike.days.size} 天] ${groupSummary.bike.distance.toFixed(2)} km / ${formatTime(groupSummary.bike.time)}</td>
            <td>${getSportIcon(300)}</td>
            <td>游泳 [${groupSummary.swim.count} 次 / ${groupSummary.swim.days.size} 天] ${groupSummary.swim.distance.toFixed(2)} km / ${formatTime(groupSummary.swim.time)}</td>
          </tr>
        </table>
        `;

          let reportHtml = '<div class="coros-calendar-report">';
          reportHtml += '<div class="coros-calendar-report-title">本月活動總結</div>';
          reportHtml += groupSummaryHtml;
          reportHtml += '<table class="coros-calendar-report-table"><thead><tr><th></th><th>運動類型</th><th>次數</th><th>總距離 (km)</th><th>總時間</th></tr></thead><tbody>';

          Object.keys(report).forEach(code => {
            type = report[code].type || '其他';
            const tdClass = `class="arco-table-td arco-table-col-fixed-left td-Sport_Image"`
            reportHtml += `<tr><td ${tdClass}>${getSportIcon(code)}</td><td> ${type} - ${code}</td><td>${report[code].count}</td><td>${report[code].distance.toFixed(2)}</td><td>${formatTime(report[code].time)}</td></tr>`;
          });
          reportHtml += '</tbody></table></div>';

          summaryDiv.innerHTML = monthNavigator + reportHtml + gridHtml;
          // Attach jQuery click handlers for month navigation
          if (window.$) {
            console.debug('[monthNavigator] jQuery detected, attaching handlers');
            $('#monthPrevBtn').off('click').on('click', function () {
              console.debug('[monthNavigator] Prev button clicked', { year, month });
              let newMonth = month - 1;
              let newYear = year;
              if (newMonth < 0) {
                newMonth = 11;
                newYear--;
              }
              console.debug('[monthNavigator] Navigating to', { newYear, newMonth });
              showCalendarTab(newYear, newMonth);
            });
            $('#monthNextBtn').off('click').on('click', function () {
              console.debug('[monthNavigator] Next button clicked', { year, month });
              let newMonth = month + 1;
              let newYear = year;
              if (newMonth > 11) {
                newMonth = 0;
                newYear++;
              }
              console.debug('[monthNavigator] Navigating to', { newYear, newMonth });
              showCalendarTab(newYear, newMonth);
            });
          } else {
            console.debug('[monthNavigator] jQuery NOT detected');
          }
        } else {
          summaryDiv.textContent = '無法取得活動資料';
        }

      });
    }

    function showActivityTab() {
      setActiveTab(activityTab);
      if (activitiesList) activitiesList.style.display = '';
      calendarContainer.style.display = 'none';
    }

    calendarTab.addEventListener('click', showCalendarTab);
    activityTab.addEventListener('click', showActivityTab);

    // Ensure correct tab is shown on load
    showActivityTab();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      console.debug('[content.js] DOMContentLoaded fired, window.$:', typeof window.$, window.$ ? 'exists' : 'not found');
      waitForTabBarAndInject();
    });
  } else {
    console.debug('[content.js] Document already loaded, window.$:', typeof window.$, window.$ ? 'exists' : 'not found');
    waitForTabBarAndInject();
  }
})();