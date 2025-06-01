// popup.js

// --- Utility Functions ---

function pad(n) {
  return n < 10 ? '0' + n : n;
}

function formatDate(date) {
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
}

function formatTime(minutes) {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return (h ? h + 'h ' : '') + (m ? m + 'm' : (h ? '' : '0m'));
}

function formatDistance(km) {
  return km ? km.toFixed(2) + ' km' : '';
}

// --- Sport Icon Rendering (placeholder) ---
function getSportIcon(sport) {
  // Placeholder: use emoji for demo
  switch (sport) {
    case 'run': return '🏃';
    case 'bike': return '🚴';
    case 'swim': return '🏊';
    case 'walk': return '🚶';
    default: return '❓';
  }
}

// --- Activity Data Loading ---
async function loadActivities() {
  if (window.corosActivities) {
    console.debug('[popup.js] Loaded activities from window.corosActivities:', window.corosActivities);
    return window.corosActivities;
  }
  // Fallback: request from background/content script
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({type: 'GET_ACTIVITIES'}, (resp) => {
      if (resp && resp.activities) {
        console.debug('[popup.js] Loaded activities from background/content script:', resp.activities);
        resolve(resp.activities);
      } else {
        console.warn('[popup.js] No activities received from background/content script.');
        resolve([]);
      }
    });
  });
}

// --- Calendar Rendering ---
function getMonthDays(year, month) {
  // month: 0-based
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  return {first, last, days: last.getDate()};
}

function groupActivitiesByDate(activities) {
  const map = {};
  for (const act of activities) {
    const date = act.date || act.activityDate || act.startDate || '';
    if (!date) continue;
    if (!map[date]) map[date] = [];
    map[date].push(act);
  }
  return map;
}

function sumMonthStats(activities, year, month) {
  let totalDist = 0, totalTime = 0;
  for (const act of activities) {
    const d = new Date(act.date || act.activityDate || act.startDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      totalDist += Number(act.distance || 0);
      totalTime += Number(act.duration || 0);
    }
  }
  return {totalDist, totalTime};
}

// --- Main UI Logic ---
let currentYear, currentMonth, activities = [], activitiesByDate = {};

function renderMonthSelector(root) {
  const sel = document.createElement('div');
  sel.className = 'month-selector';

  const prev = document.createElement('button');
  prev.textContent = '<';
  prev.onclick = () => {
    if (currentMonth === 0) {
      currentYear--;
      currentMonth = 11;
    } else {
      currentMonth--;
    }
    console.debug('[popup.js] Month changed to', currentYear, currentMonth);
    renderCalendarUI();
  };

  const next = document.createElement('button');
  next.textContent = '>';
  next.onclick = () => {
    if (currentMonth === 11) {
      currentYear++;
      currentMonth = 0;
    } else {
      currentMonth++;
    }
    console.debug('[popup.js] Month changed to', currentYear, currentMonth);
    renderCalendarUI();
  };

  const label = document.createElement('span');
  label.textContent = `${currentYear}-${pad(currentMonth + 1)}`;

  sel.appendChild(prev);
  sel.appendChild(label);
  sel.appendChild(next);
  root.appendChild(sel);
}

function renderTotals(root) {
  const {totalDist, totalTime} = sumMonthStats(activities, currentYear, currentMonth);
  const totals = document.createElement('div');
  totals.className = 'month-totals';
  totals.innerHTML = `
    <span>Total Distance: <b>${formatDistance(totalDist)}</b></span>
    <span>Total Time: <b>${formatTime(totalTime)}</b></span>
  `;
  root.appendChild(totals);
}

function renderCalendar(root) {
  const {first, days} = getMonthDays(currentYear, currentMonth);
  const startDay = first.getDay(); // 0=Sun
  const table = document.createElement('table');
  table.className = 'calendar-table';

  // Header
  const thead = document.createElement('thead');
  const hr = document.createElement('tr');
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d => {
    const th = document.createElement('th');
    th.textContent = d;
    hr.appendChild(th);
  });
  thead.appendChild(hr);
  table.appendChild(thead);

  // Body
  const tbody = document.createElement('tbody');
  let day = 1 - startDay;
  for (let row = 0; row < 6; row++) {
    const tr = document.createElement('tr');
    for (let col = 0; col < 7; col++, day++) {
      const td = document.createElement('td');
      if (day > 0 && day <= days) {
        const dateStr = `${currentYear}-${pad(currentMonth + 1)}-${pad(day)}`;
        td.className = 'calendar-day';
        td.innerHTML = `<div class="day-num">${day}</div>`;
        if (activitiesByDate[dateStr]) {
          for (const act of activitiesByDate[dateStr]) {
            const icon = getSportIcon(act.sport || act.type);
            const dist = formatDistance(Number(act.distance));
            const time = formatTime(Number(act.duration));
            const actDiv = document.createElement('div');
            actDiv.className = 'activity-entry';
            actDiv.innerHTML = `<span class="icon">${icon}</span> <span>${dist}</span> <span>${time}</span>`;
            td.appendChild(actDiv);
          }
        }
      } else {
        td.className = 'calendar-empty';
      }
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  root.appendChild(table);
}

function renderCalendarUI() {
  console.debug('[popup.js] Rendering calendar UI for', currentYear, currentMonth);
  const root = document.getElementById('calendar-root');
  root.innerHTML = '';
  renderMonthSelector(root);
  renderTotals(root);
  renderCalendar(root);
  console.debug('[popup.js] Calendar UI rendered.');
}

// --- Initialization ---
async function main() {
  try {
    activities = await loadActivities();
    console.debug('[popup.js] Activities loaded in main:', activities);
    // Normalize date to YYYY-MM-DD
    for (const act of activities) {
      if (!act.date) {
        const d = new Date(act.activityDate || act.startDate);
        act.date = d ? formatDate(d) : '';
      }
    }
    activitiesByDate = groupActivitiesByDate(activities);
    console.debug('[popup.js] Activities grouped by date:', activitiesByDate);

    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();
    renderCalendarUI();
  } catch (e) {
    console.error('[popup.js] Error during main initialization:', e);
  }
}

document.addEventListener('DOMContentLoaded', main);