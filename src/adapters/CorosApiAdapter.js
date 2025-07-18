// COROS API adapter for external API integration

import { API_CONFIG } from '../config/constants.js';
import { formatDateForAPI } from '../utils/dateUtils.js';

/**
 * Adapter for COROS API integration
 */
export class CorosApiAdapter {
  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
    this.timeout = API_CONFIG.timeout;
    this.retryAttempts = API_CONFIG.retryAttempts;
    this.retryDelay = API_CONFIG.retryDelay;
    this.requestCache = new Map();
  }

  /**
   * Get authentication data from current session
   * @returns {Promise<Object>} Authentication data
   */
  async getAuthenticationData() {
    try {
      const cookies = document.cookie;
      const hasSessionCookie = cookies.includes('CPL-coros-token') ||
        cookies.includes('coros_session') ||
        cookies.includes('auth_token') ||
        cookies.includes('access_token');

      let userId = null;
      let accessToken = null;

      // Extract access token from cookies
      const tokenMatch = cookies.match(/CPL-coros-token=([^;]+)/);
      if (tokenMatch) {
        accessToken = tokenMatch[1];
      }

      // Try to get user ID from page data
      const userDataElement = document.querySelector('[data-user-id]');
      if (userDataElement) {
        userId = userDataElement.dataset.userId;
      }

      // Check localStorage for auth data
      try {
        const storedAuth = localStorage.getItem('coros_auth') ||
          localStorage.getItem('user_auth') ||
          localStorage.getItem('auth_data');
        if (storedAuth) {
          const authData = JSON.parse(storedAuth);
          userId = userId || authData.userId || authData.id;
          accessToken = accessToken || authData.token || authData.accessToken;
        }
      } catch (e) {
        console.warn('[CorosApiAdapter] Could not parse stored auth data');
      }

      // Check global variables
      if (window.USER_DATA) {
        userId = userId || window.USER_DATA.id || window.USER_DATA.userId;
        accessToken = accessToken || window.USER_DATA.token;
      }

      // Get CSRF token
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content ||
        document.querySelector('input[name="_token"]')?.value;

      return {
        isAuthenticated: hasSessionCookie || !!userId || !!accessToken,
        userId,
        accessToken,
        csrfToken,
        sessionCookies: hasSessionCookie
      };
    } catch (error) {
      console.warn('[CorosApiAdapter] Error getting authentication data:', error);
      return {
        isAuthenticated: false,
        error: error.message
      };
    }
  }

  /**
   * Fetch activities for a specific month
   * @param {number} year - Year
   * @param {number} month - Month (0-11)
   * @returns {Promise<Array>} Array of activities
   */
  async fetchActivitiesForMonth(year, month) {
    const cacheKey = `activities-${year}-${month}`;

    // Check cache for recent requests
    if (this.requestCache.has(cacheKey)) {
      const cachedData = this.requestCache.get(cacheKey);
      if (Date.now() - cachedData.timestamp < 30000) { // 30 second cache
        return cachedData.data;
      }
    }

    try {
      console.log(`[CorosApiAdapter] Fetching activities for ${year}-${month + 1}`);

      const authData = await this.getAuthenticationData();
      if (!authData.isAuthenticated) {
        throw new Error('Not authenticated with COROS. Please log in to training.coros.com first.');
      }

      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);

      const activities = await this.fetchActivitiesFromAPI(startDate, endDate, authData);
      const processedActivities = this.processActivityData(activities);

      // Cache the result
      this.requestCache.set(cacheKey, {
        data: processedActivities,
        timestamp: Date.now()
      });

      return processedActivities;
    } catch (error) {
      console.error('[CorosApiAdapter] Error fetching activities:', error);
      throw new Error(`Failed to fetch activities: ${error.message}`);
    }
  }

  /**
   * Fetch activities from COROS API
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {Object} authData - Authentication data
   * @returns {Promise<Array>} Raw activities from API
   */
  async fetchActivitiesFromAPI(startDate, endDate, authData) {
    try {
      const startDay = formatDateForAPI(startDate);
      const endDay = formatDateForAPI(endDate);

      const params = new URLSearchParams({
        size: '100',
        pageNumber: '1',
        modeList: '',
        startDay,
        endDay
      });

      const url = `${this.baseUrl}${API_CONFIG.endpoints.activities}?${params}`;
      const response = await this.makeAuthenticatedRequest(url, authData);

      if (response.ok) {
        const data = await response.json();

        // Handle different COROS API response formats
        if (data.apiCode === 'C33BB719' && data.data && Array.isArray(data.data.dataList)) {
          return data.data.dataList;
        } else if (data.data && Array.isArray(data.data.dataList)) {
          return data.data.dataList;
        } else if (Array.isArray(data.dataList)) {
          return data.dataList;
        } else if (Array.isArray(data)) {
          return data;
        }
      } else {
        console.warn(`[CorosApiAdapter] API returned status ${response.status}`);
      }
    } catch (error) {
      console.warn('[CorosApiAdapter] API request failed:', error);
    }

    // If API calls fail, try to scrape data from the page
    return this.scrapeActivitiesFromPage(startDate, endDate);
  }

  /**
   * Make authenticated request to COROS API
   * @param {string} url - Request URL
   * @param {Object} authData - Authentication data
   * @returns {Promise<Response>} Fetch response
   */
  async makeAuthenticatedRequest(url, authData) {
    const headers = {
      'accept': 'application/json, text/plain, */*',
      'accept-language': 'en-US,en;q=0.9,zh-TW;q=0.8,zh;q=0.7',
      'origin': 'https://t.coros.com',
      'referer': 'https://t.coros.com/',
      'sec-ch-ua': '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"macOS"',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-site',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
    };

    if (authData.accessToken) {
      headers['accesstoken'] = authData.accessToken;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
      cache: 'no-cache'
    });

    return response;
  }

  /**
   * Process raw activity data from API
   * @param {Array} activities - Raw activities
   * @returns {Array} Processed activities
   */
  processActivityData(activities) {
    if (!Array.isArray(activities)) {
      return [];
    }

    return activities.map(activity => {
      try {
        const startTime = activity.startTime 
          ? new Date(activity.startTime * 1000).toISOString()
          : this.convertCorosDateToISO(activity.date);

        return {
          id: activity.labelId || activity.id || Math.random().toString(36),
          name: activity.name || 'Activity',
          type: this.mapCorosSportType(activity.sportType),
          code: activity.sportType,
          startTime,
          distance: parseFloat(activity.distance) || 0,
          duration: parseFloat(activity.workoutTime || activity.totalTime) || 0,
          calories: parseInt(activity.calorie) || 0,
          date: startTime,
          device: activity.device,
          avgHr: activity.avgHr,
          avgSpeed: activity.avgSpeed,
          trainingLoad: activity.trainingLoad
        };
      } catch (error) {
        console.warn('[CorosApiAdapter] Error processing activity:', activity, error);
        return null;
      }
    }).filter(Boolean);
  }

  /**
   * Convert COROS date to ISO string
   * @param {number} corosDate - COROS date number
   * @returns {string} ISO date string
   */
  convertCorosDateToISO(corosDate) {
    const dateStr = String(corosDate);
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return new Date(`${year}-${month}-${day}`).toISOString();
  }

  /**
   * Map COROS sport type to normalized type
   * @param {number} sportType - COROS sport type code
   * @returns {string} Normalized sport type
   */
  mapCorosSportType(sportType) {
    const sportTypeMap = {
      100: 'running',
      101: 'running',
      102: 'running',
      103: 'running',
      104: 'walking',
      105: 'hiking',
      200: 'cycling',
      201: 'indoor_cycling',
      202: 'cycling',
      203: 'cycling',
      204: 'cycling',
      205: 'cycling',
      299: 'cycling',
      300: 'swimming',
      301: 'swimming',
      400: 'other',
      401: 'other',
      402: 'strength',
      800: 'hiking',
      801: 'hiking',
      900: 'walking',
      901: 'other',
      10000: 'other',
      10003: 'hiking'
    };

    return sportTypeMap[sportType] || 'other';
  }

  /**
   * Scrape activities from page as fallback
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Scraped activities
   */
  async scrapeActivitiesFromPage(startDate, endDate) {
    try {
      console.log('[CorosApiAdapter] Attempting to scrape activities from page');
      
      const activities = [];

      // Look for activity elements
      const activityElements = document.querySelectorAll([
        '[data-activity-id]',
        '.activity-item',
        '.workout-item',
        '.training-item'
      ].join(', '));

      activityElements.forEach(element => {
        try {
          const activity = this.extractActivityFromElement(element);
          if (activity && this.isActivityInDateRange(activity, startDate, endDate)) {
            activities.push(activity);
          }
        } catch (error) {
          console.warn('[CorosApiAdapter] Error extracting activity:', error);
        }
      });

      return activities;
    } catch (error) {
      console.warn('[CorosApiAdapter] Error scraping activities:', error);
      return [];
    }
  }

  /**
   * Extract activity from DOM element
   * @param {HTMLElement} element - DOM element
   * @returns {Object|null} Activity object or null
   */
  extractActivityFromElement(element) {
    // Implementation would extract activity data from DOM element
    // This is a simplified version
    return {
      id: element.dataset.activityId || element.id,
      name: element.querySelector('.activity-title')?.textContent || 'Activity',
      type: element.dataset.sport || 'other',
      startTime: new Date().toISOString(),
      distance: 0,
      duration: 0,
      calories: 0
    };
  }

  /**
   * Check if activity is in date range
   * @param {Object} activity - Activity object
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {boolean} True if in range
   */
  isActivityInDateRange(activity, startDate, endDate) {
    try {
      const activityDate = new Date(activity.startTime);
      return activityDate >= startDate && activityDate <= endDate;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check API connection
   * @returns {Promise<boolean>} True if API is accessible
   */
  async checkConnection() {
    try {
      const authData = await this.getAuthenticationData();
      if (!authData.isAuthenticated) {
        return false;
      }

      const response = await this.makeAuthenticatedRequest(
        `${this.baseUrl}${API_CONFIG.endpoints.activities}?size=1&pageNumber=1`,
        authData
      );

      return response.ok;
    } catch (error) {
      console.warn('[CorosApiAdapter] Connection check failed:', error);
      return false;
    }
  }
}