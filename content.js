// Content script for COROS Activity Calendar extension

(function () {
  'use strict';

  // Prevent multiple initializations
  if (window.corosCalendarExtension) {
    return;
  }

  window.corosCalendarExtension = true;

  // Extension state
  let extensionState = {
    isInitialized: false,
    currentView: 'calendar', // 'calendar' or 'statistics'
    currentDate: new Date(),
    activities: {},
    isLoading: false
  };

  // Sport type configurations
  const SPORT_TYPES = {
    'running': { icon: '🏃', color: '#FF6B6B', name: 'Running' },
    'cycling': { icon: '🚴', color: '#4ECDC4', name: 'Cycling' },
    'swimming': { icon: '🏊', color: '#45B7D1', name: 'Swimming' },
    'hiking': { icon: '🥾', color: '#96CEB4', name: 'Hiking' },
    'walking': { icon: '🚶', color: '#FECA57', name: 'Walking' },
    'strength': { icon: '💪', color: '#FF9FF3', name: 'Strength' },
    'other': { icon: '⚡', color: '#95A5A6', name: 'Other' }
  };

  // Initialize extension when DOM is ready
  function initializeExtension() {
    if (extensionState.isInitialized) return;

    try {
      // Check if we're on the right page (activities or dashboard)
      if (!isCorosActivityPage()) {
        return;
      }

      createExtensionUI();
      bindEventListeners();
      loadInitialData();
      extensionState.isInitialized = true;

      console.log('COROS Activity Calendar extension initialized');
    } catch (error) {
      console.error('Failed to initialize COROS extension:', error);
      chrome.runtime.sendMessage({
        action: 'logError',
        error: error.message
      });
    }
  }

  // Create the collapse button
  function createCollapseButton() {
    const collapseButton = document.createElement('button');
    collapseButton.id = 'coros-calendar-collapse-btn';
    collapseButton.className = 'coros-collapse-btn';
    collapseButton.innerHTML = '🔼'; // Initial icon
    return collapseButton;
  }

  // Handle collapse toggle
  function handleCollapseToggle() {
    const extensionContainer = document.getElementById('coros-calendar-extension');
    const collapseButton = document.getElementById('coros-calendar-collapse-btn');

    if (extensionContainer.classList.contains('collapsed')) {
      extensionContainer.classList.remove('collapsed');
      collapseButton.innerHTML = '🔼';
    } else {
      extensionContainer.classList.add('collapsed');
      collapseButton.innerHTML = '🔽';
    }
  }

  // Check if current page is suitable for our extension
  function isCorosActivityPage() {
    const url = window.location.href;
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    // admin/views/activities
    return (hostname.includes('coros.com') || hostname.includes('t.coros.com')) && (
      pathname.includes('admin/views') ||
      pathname.includes('training') ||
      pathname.includes('dashboard') ||
      pathname.includes('profile') ||
      pathname === '/' ||
      pathname.includes('home')
    );
  }

  // Create the main extension UI
  function createExtensionUI() {
    // Remove existing extension UI if present
    const existingUI = document.getElementById('coros-calendar-extension');
    if (existingUI) {
      existingUI.remove();
    }

    // Find suitable container for injection
    const container = findInjectionPoint();
    if (!container) {
      console.warn('Could not find suitable injection point for COROS extension');
      return;
    }

    // Create main extension container
    const extensionContainer = document.createElement('div');
    extensionContainer.id = 'coros-calendar-extension';
    extensionContainer.className = 'coros-extension-container';

    // Create collapse button
    const collapseButton = createCollapseButton();

    // Create tab navigation
    const tabContainer = document.createElement('div');
    tabContainer.className = 'coros-extension-tabs';
    tabContainer.innerHTML = `
      <button class="coros-tab-btn active" data-tab="calendar">
        Calendar
      </button>
      <button class="coros-tab-btn" data-tab="statistics">
        Statistics
      </button>
    `;

    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.className = 'coros-extension-content';
    contentContainer.id = 'coros-extension-content';

    // Create loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'coros-loading';
    loadingIndicator.innerHTML = `
      <div class="coros-spinner"></div>
      <p>Loading activity data...</p>
    `;

    // Assemble UI
    const headerContainer = document.createElement('div');
    headerContainer.className = 'coros-extension-header';
    headerContainer.appendChild(tabContainer);

    extensionContainer.appendChild(headerContainer);
    extensionContainer.appendChild(contentContainer);
    extensionContainer.appendChild(loadingIndicator);

    // Try to find the specific element for injection and log if found
    const specialSelector = "#app > div.layout.flex.bg-bg-1.app-container > div.layout-right.overflow-y-auto.overflow-x-hidden.flex.relative.w-full.relative > div.flex.flex-row.personal.w-full > div.flex.flex-col.flex-1.items-stretch.overflow-x-auto > div.border-b.personal-tab-header.border-border-1.bg-bg-2.flex.justify-between.items-stretch > div.pr-20.flex-1.flex.items-center.justify-end > div";
    const specialElement = document.querySelector(specialSelector);
    if (specialElement) {
      specialElement.parentNode.insertBefore(collapseButton, specialElement.nextSibling);
    }

    // Inject into page
    container.insertBefore(extensionContainer, container.firstChild);

    // Initialize with calendar view
    showCalendarView();
  }

  // Find the best injection point in the COROS website
  function findInjectionPoint() {
    // Try multiple selectors to find suitable container
    const selectors = [
      '.main-content',
      '.content-container',
      '.dashboard-content',
      '.activity-content',
      '#app',
      '.app-container',
      'main',
      '.container'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        return element;
      }
    }

    // Fallback to body
    return document.body;
  }

  // Bind event listeners
  function bindEventListeners() {
    // Tab switching
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('coros-tab-btn')) {
        handleTabSwitch(e.target.dataset.tab);
      }
    });

    // Calendar navigation
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('coros-calendar-nav')) {
        handleCalendarNavigation(e.target.dataset.action);
      }
    });

    // View mode switching (month/week)
    document.addEventListener('change', (e) => {
      if (e.target.id === 'coros-view-mode') {
        handleViewModeChange(e.target.value);
      }
    });

    // Collapse button
    document.addEventListener('click', (e) => {
      if (e.target.id === 'coros-calendar-collapse-btn') {
        handleCollapseToggle();
      }
    });

    // Refresh button
    document.addEventListener('click', (e) => {
      if (e.target.id === 'coros-refresh-btn') {
        handleRefreshData();
      }
    });
  }

  // Handle tab switching between calendar and statistics
  function handleTabSwitch(tabName) {
    // Update tab buttons
    document.querySelectorAll('.coros-tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update content
    extensionState.currentView = tabName;
    if (tabName === 'calendar') {
      showCalendarView();
    } else if (tabName === 'statistics') {
      showStatisticsView();
    }
  }

  // Handle calendar navigation (prev/next month)
  function handleCalendarNavigation(action) {
    const currentDate = new Date(extensionState.currentDate);

    if (action === 'prev') {
      currentDate.setMonth(currentDate.getMonth() - 1);
    } else if (action === 'next') {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    extensionState.currentDate = currentDate;
    loadMonthData(currentDate.getFullYear(), currentDate.getMonth());

    // Set the date range inputs (begin and end of month)
    setTimeout(() => {
      // Find the inputs inside .arco-picker-range
      const picker = document.querySelector('div.arco-picker-range');
      if (picker) {
        const inputs = picker.querySelectorAll('input');
        if (inputs.length >= 2) {
          const yyyy = currentDate.getFullYear();
          const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
          const days = new Date(yyyy, currentDate.getMonth() + 1, 0).getDate();
          inputs[0].value = `${yyyy}/${mm}/01`;
          inputs[1].value = `${yyyy}/${mm}/${String(days).padStart(2, '0')}`;
          // Trigger input event if needed
          // const event = new Event('input', { bubbles: true });
          // inputs[0].dispatchEvent(event);
          // inputs[1].dispatchEvent(event);
        }
      }
    }, 100);
  }

  // Handle view mode change (month/week)
  function handleViewModeChange(mode) {
    if (extensionState.currentView === 'calendar') {
      showCalendarView(mode);
    }
  }

  // Show calendar view
  function showCalendarView(viewMode = 'month') {
    const contentContainer = document.getElementById('coros-extension-content');
    const currentDate = extensionState.currentDate;

    contentContainer.innerHTML = `
      <div class="coros-calendar-header">
        <div class="coros-calendar-controls">
          <button class="coros-calendar-nav" data-action="prev">‹ Previous</button>
          <h3 class="coros-calendar-title">
            ${currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button class="coros-calendar-nav" data-action="next">Next ›</button>
        </div>
        <div class="coros-view-controls">
          <button id="coros-refresh-btn" class="coros-calendar-nav">🔄</button>
          <select id="coros-view-mode">
            <option value="month" ${viewMode === 'month' ? 'selected' : ''}>Month View</option>
            <option value="week" ${viewMode === 'week' ? 'selected' : ''}>Week View</option>
          </select>
        </div>
      </div>
      <div id="coros-calendar-grid" class="coros-calendar-grid">
        <!-- Calendar will be rendered here -->
      </div>
    `;

    // Render calendar using calendar.js
    if (window.CorosCalendar) {
      const activities = extensionState.activities[getMonthKey(currentDate)] || [];
      window.CorosCalendar.render(
        document.getElementById('coros-calendar-grid'),
        currentDate,
        activities,
        viewMode
      );
    }
  }

  // Show statistics view
  function showStatisticsView() {
    const contentContainer = document.getElementById('coros-extension-content');
    const currentDate = extensionState.currentDate;

    contentContainer.innerHTML = `
      <div class="coros-statistics-header">
        <div class="coros-calendar-controls">
          <button class="coros-calendar-nav" data-action="prev">‹ Previous</button>
          <h3 class="coros-calendar-title">
            Statistics - ${currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button class="coros-calendar-nav" data-action="next">Next ›</button>
        </div>
      </div>
      <div id="coros-statistics-content" class="coros-statistics-content">
        <!-- Statistics will be rendered here -->
      </div>
    `;

    // Render statistics using statistics.js
    if (window.CorosStatistics) {
      const activities = extensionState.activities[getMonthKey(currentDate)] || [];
      window.CorosStatistics.render(
        document.getElementById('coros-statistics-content'),
        activities,
        currentDate
      );
    }
  }

  // Refresh data for the current month
  async function handleRefreshData() {
    const currentDate = extensionState.currentDate;
    const monthKey = getMonthKey(currentDate);

    // Clear cache for the current month
    await window.CorosStorage.saveActivities(monthKey, null);

    // Reload data for the current month
    await loadMonthData(currentDate.getFullYear(), currentDate.getMonth());
  }

  // Load initial data
  async function loadInitialData() {
    const currentDate = new Date();
    await loadMonthData(currentDate.getFullYear(), currentDate.getMonth());
  }

  // Load data for a specific month
  async function loadMonthData(year, month) {
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;

    try {
      setLoadingState(true);

      // Check if we need to fetch fresh data (current month) or can use cache
      const isCurrentMonth = (year === new Date().getFullYear()) &&
        (month === new Date().getMonth());

      let activities;
      if (isCurrentMonth) {
        // Always fetch fresh data for current month
        activities = await window.CorosAPI.fetchActivitiesForMonth(year, month);
        await window.CorosStorage.saveActivities(monthKey, activities);
      } else {
        // Try cache first for historical data
        activities = await window.CorosStorage.getActivities(monthKey);
        if (!activities || activities.length === 0) {
          activities = await window.CorosAPI.fetchActivitiesForMonth(year, month);
          await window.CorosStorage.saveActivities(monthKey, activities);
        }
      }

      // Store in state
      extensionState.activities[monthKey] = activities;

      // Update current view
      if (extensionState.currentView === 'calendar') {
        showCalendarView();
      } else if (extensionState.currentView === 'statistics') {
        showStatisticsView();
      }

    } catch (error) {
      console.error('Failed to load month data:', error);
      showErrorState(`Failed to load activity data: ${error.message}`);
    } finally {
      setLoadingState(false);
    }
  }

  // Set loading state
  function setLoadingState(isLoading) {
    extensionState.isLoading = isLoading;
    const loadingElement = document.querySelector('.coros-loading');
    if (loadingElement) {
      loadingElement.style.display = isLoading ? 'flex' : 'none';
    }
  }

  // Show error state
  function showErrorState(message) {
    const contentContainer = document.getElementById('coros-extension-content');
    if (contentContainer) {
      contentContainer.innerHTML = `
        <div class="coros-error-state">
          <div class="coros-error-icon">⚠️</div>
          <h3>Unable to Load Data</h3>
          <p>${message}</p>
          <button onclick="location.reload()" class="coros-retry-btn">
            Retry
          </button>
        </div>
      `;
    }
  }

  // Get month key for storage
  function getMonthKey(date) {
    console.log(`Getting month key for date: ${date}`);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
  } else {
    // DOM already loaded
    setTimeout(initializeExtension, 100);
  }

  // Re-initialize if page content changes (SPA navigation)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if significant page content changed
        const hasSignificantChange = Array.from(mutation.addedNodes).some(node =>
          node.nodeType === 1 && // Element node
          (node.className && typeof node.className === 'string' &&
            (node.className.includes('content') ||
              node.className.includes('page') ||
              node.className.includes('app')))
        );

        if (hasSignificantChange && !document.getElementById('coros-calendar-extension')) {
          setTimeout(initializeExtension, 500);
        }
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

})();
