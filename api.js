// API integration for COROS Activity Calendar extension

window.CorosAPI = (function () {
    'use strict';

    // API configuration
    const API_CONFIG = {
        baseUrl: 'https://teamapi.coros.com',
        timeout: 5000,
        retryAttempts: 3,
        retryDelay: 1000
    };

    // Request cache to prevent duplicate API calls
    const requestCache = new Map();

    /**
     * Fetch activities for a specific month
     * @param {number} year - Year (e.g., 2024)
     * @param {number} month - Month (0-11, where 0 is January)
     * @returns {Promise<Array>} Array of activity objects
     */
    async function fetchActivitiesForMonth(year, month) {
        const cacheKey = `activities-${year}-${month}`;

        // Check cache for recent requests
        if (requestCache.has(cacheKey)) {
            const cachedData = requestCache.get(cacheKey);
            if (Date.now() - cachedData.timestamp < 30000) { // 30 second cache
                return cachedData.data;
            }
        }

        try {
            console.log(`Fetching COROS activities for ${year}-${month + 1}`);

            // Get authentication token/session
            const authData = await getAuthenticationData();
            if (!authData.isAuthenticated) {
                throw new Error('Not authenticated with COROS. Please log in to training.coros.com first.');
            }

            // Calculate date range for the month
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0, 23, 59, 59);

            // Fetch activities from COROS API
            const activities = await fetchActivitiesFromAPI(startDate, endDate, authData);

            // Process and normalize activity data
            const processedActivities = processActivityData(activities);

            // Cache the result
            requestCache.set(cacheKey, {
                data: processedActivities,
                timestamp: Date.now()
            });

            return processedActivities;

        } catch (error) {
            console.error('Error fetching activities for month:', error);
            throw new Error(`Failed to fetch activities: ${error.message}`);
        }
    }

    /**
     * Get authentication data from current COROS session
     */
    async function getAuthenticationData() {
        try {
            // Check if user is logged in by looking for COROS session cookies/tokens
            const cookies = document.cookie;
            const hasSessionCookie = cookies.includes('CPL-coros-token') ||
                cookies.includes('coros_session') ||
                cookies.includes('auth_token') ||
                cookies.includes('access_token');

            // Try to get user info from page data or localStorage
            let userId = null;
            let accessToken = null;

            // Method 1: Extract access token from cookies (COROS specific)
            const tokenMatch = cookies.match(/CPL-coros-token=([^;]+)/);
            if (tokenMatch) {
                accessToken = tokenMatch[1];
            }

            // Method 2: Check for user data in page
            const userDataElement = document.querySelector('[data-user-id]');
            if (userDataElement) {
                userId = userDataElement.dataset.userId;
            }

            // Method 3: Check localStorage for auth data
            try {
                const storedAuth = localStorage.getItem('coros_auth') ||
                    localStorage.getItem('user_auth') ||
                    localStorage.getItem('auth_data');
                if (storedAuth) {
                    const authData = JSON.parse(storedAuth);
                    userId = authData.userId || authData.id;
                    accessToken = accessToken || authData.token || authData.accessToken;
                }
            } catch (e) {
                console.warn('Could not parse stored auth data');
            }

            // Method 4: Try to extract from global JavaScript variables
            if (window.USER_DATA) {
                userId = window.USER_DATA.id || window.USER_DATA.userId;
                accessToken = accessToken || window.USER_DATA.token;
            }

            // Method 5: Check for CSRF token or session data
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content ||
                document.querySelector('input[name="_token"]')?.value;

            return {
                isAuthenticated: hasSessionCookie || userId || accessToken,
                userId: userId,
                accessToken: accessToken,
                csrfToken: csrfToken,
                sessionCookies: hasSessionCookie
            };

        } catch (error) {
            console.warn('Error getting authentication data:', error);
            return {
                isAuthenticated: false,
                error: error.message
            };
        }
    }

    /**
     * Fetch activities from COROS API
     */
    async function fetchActivitiesFromAPI(startDate, endDate, authData) {
        try {
            // Format dates for COROS API (YYYYMMDD format)
            const startDay = formatDateForAPI(startDate);
            const endDay = formatDateForAPI(endDate);

            // Use the actual COROS API endpoint
            const endpoint = '/activity/query';
            const params = new URLSearchParams({
                size: '100',
                pageNumber: '1',
                modeList: '',
                startDay: startDay,
                endDay: endDay
            });

            const response = await makeAuthenticatedRequest(
                `${API_CONFIG.baseUrl}${endpoint}?${params}`,
                authData
            );

            if (response.ok) {
                const data = await response.json();

                // Handle COROS API response format
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
                console.warn(`COROS API returned status ${response.status}`);
            }
        } catch (error) {
            console.warn(`COROS API request failed:`, error);
        }

        // If API calls fail, try to scrape data from the page
        return scrapeActivitiesFromPage(startDate, endDate);
    }

    /**
     * Make authenticated request to COROS API
     */
    async function makeAuthenticatedRequest(url, authData) {
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

        // Add authentication token to headers (COROS uses accesstoken header)
        if (authData.accessToken) {
            headers['accesstoken'] = authData.accessToken;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: headers,
            credentials: 'include', // Include cookies
            cache: 'no-cache'
        });

        return response;
    }

    /**
     * Scrape activities from page content as fallback
     */
    async function scrapeActivitiesFromPage(startDate, endDate) {
        try {
            console.log('Attempting to scrape activities from page content');

            const activities = [];

            // Look for activity data in the page
            const activityElements = document.querySelectorAll([
                '[data-activity-id]',
                '.activity-item',
                '.workout-item',
                '.training-item'
            ].join(', '));

            activityElements.forEach(element => {
                try {
                    const activity = extractActivityFromElement(element);
                    if (activity && isActivityInDateRange(activity, startDate, endDate)) {
                        activities.push(activity);
                    }
                } catch (error) {
                    console.warn('Error extracting activity from element:', error);
                }
            });

            // Look for JSON data in script tags
            const scriptTags = document.querySelectorAll('script[type="application/json"], script:not([src])');
            scriptTags.forEach(script => {
                try {
                    const content = script.textContent || script.innerHTML;
                    if (content.includes('activity') || content.includes('workout') || content.includes('training')) {
                        const data = JSON.parse(content);
                        const extractedActivities = extractActivitiesFromJSON(data, startDate, endDate);
                        activities.push(...extractedActivities);
                    }
                } catch (error) {
                    // Ignore JSON parse errors
                }
            });

            return activities;

        } catch (error) {
            console.warn('Error scraping activities from page:', error);
            return [];
        }
    }

    /**
     * Extract activity data from DOM element
     */
    function extractActivityFromElement(element) {
        const activity = {};

        // Extract activity ID
        activity.id = element.dataset.activityId ||
            element.getAttribute('data-id') ||
            element.id;

        // Extract activity name/title
        const titleElement = element.querySelector('.activity-title, .workout-title, h3, h4');
        activity.name = titleElement?.textContent?.trim() || 'Activity';

        // Extract sport type
        const sportElement = element.querySelector('.sport-type, .activity-type, [data-sport]');
        activity.type = sportElement?.textContent?.trim() ||
            sportElement?.dataset?.sport ||
            element.dataset.sport ||
            'other';

        // Extract date/time
        const dateElement = element.querySelector('.activity-date, .workout-date, time');
        const dateStr = dateElement?.textContent?.trim() ||
            dateElement?.getAttribute('datetime') ||
            element.dataset.date;
        if (dateStr) {
            activity.startTime = new Date(dateStr).toISOString();
        }

        // Extract distance
        const distanceElement = element.querySelector('.distance, [data-distance]');
        const distanceText = distanceElement?.textContent?.trim() || element.dataset.distance;
        if (distanceText) {
            activity.distance = parseDistanceText(distanceText);
        }

        // Extract duration
        const durationElement = element.querySelector('.duration, .time, [data-duration]');
        const durationText = durationElement?.textContent?.trim() || element.dataset.duration;
        if (durationText) {
            activity.duration = parseDurationText(durationText);
        }

        // Extract calories
        const caloriesElement = element.querySelector('.calories, [data-calories]');
        const caloriesText = caloriesElement?.textContent?.trim() || element.dataset.calories;
        if (caloriesText) {
            activity.calories = parseInt(caloriesText.replace(/\D/g, ''), 10) || 0;
        }

        return activity.id ? activity : null;
    }

    /**
     * Extract activities from JSON data
     */
    function extractActivitiesFromJSON(data, startDate, endDate) {
        const activities = [];

        function traverseObject(obj) {
            if (Array.isArray(obj)) {
                obj.forEach(traverseObject);
            } else if (obj && typeof obj === 'object') {
                // Check if this looks like an activity object
                if ((obj.id || obj.activityId) && (obj.date || obj.startTime)) {
                    const activity = {
                        id: obj.id || obj.activityId,
                        name: obj.name || obj.title || 'Activity',
                        type: obj.type || obj.sport || 'other',
                        code: obj.sportType || obj.sportCode || undefined,
                        startTime: obj.startTime || obj.date,
                        distance: obj.distance || 0,
                        duration: obj.duration || obj.movingTime || 0,
                        calories: obj.calories || 0
                    };

                    if (isActivityInDateRange(activity, startDate, endDate)) {
                        activities.push(activity);
                    }
                }

                // Recursively search nested objects
                Object.values(obj).forEach(traverseObject);
            }
        }

        traverseObject(data);
        return activities;
    }

    /**
     * Process and normalize activity data
     */
    function processActivityData(activities) {
        if (!Array.isArray(activities)) {
            return [];
        }

        return activities.map(activity => {
            try {
                // Convert COROS date format (YYYYMMDD) to ISO string
                const activityDate = convertCorosDateToISO(activity.date, activity.startTime);

                // sportType is the numeric code from COROS API
                const code = typeof activity.sportType === 'number' ? activity.sportType : undefined;

                return {
                    id: activity.labelId || activity.id || Math.random().toString(36),
                    name: activity.name || 'Activity',
                    type: mapCorosSportType(activity.sportType),
                    code: code,
                    startTime: activityDate,
                    distance: parseFloat(activity.distance) || 0,
                    duration: parseFloat(activity.workoutTime || activity.totalTime) || 0,
                    calories: parseInt(activity.calorie) || 0,
                    date: activityDate,
                    // Additional COROS specific data
                    device: activity.device,
                    avgHr: activity.avgHr,
                    avgSpeed: activity.avgSpeed,
                    trainingLoad: activity.trainingLoad
                };
            } catch (error) {
                console.warn('Error processing COROS activity:', activity, error);
                return null;
            }
        }).filter(Boolean); // Remove null entries
    }

    /**
     * Utility functions
     */
    function mapCorosSportType(sportType) {
        const sportTypeMap = {
            100: 'running',        // 跑步
            101: 'track-1',        // 田徑
            102: 'track-2',        // 田徑
            103: 'track-3',        // 田徑
            104: 'walking',        // 步行
            200: 'cycling',        // 自行車
            201: 'indoor_cycling', // 室內自行車
            300: 'swimming',       // 泳池游泳
            301: 'openwater',       // 開放水域
            400: 'aerobic',         // 有氧
            402: 'strength',       // 力量訓練
            10000: 'triathlon',        // 鐵人三項
            // Add more mappings as needed
        };

        return sportTypeMap[sportType] || 'other';
    }

    function formatDateForAPI(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    function convertCorosDateToISO(corosDate, startTimeUnix) {
        // Convert COROS date format (YYYYMMDD) and Unix timestamp to ISO string
        if (startTimeUnix) {
            return new Date(startTimeUnix * 1000).toISOString();
        }

        // Fallback: parse from date format
        const dateStr = String(corosDate);
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        return new Date(`${year}-${month}-${day}`).toISOString();
    }

    function normalizeActivityType(type) {
        if (!type) return 'other';

        const normalized = type.toLowerCase().replace(/[_\s-]/g, '_');

        const typeMapping = {
            'run': 'running',
            'bike': 'cycling',
            'ride': 'cycling',
            'swim': 'swimming',
            'hike': 'hiking',
            'walk': 'walking',
            'weight_training': 'strength',
            'strength_training': 'strength',
            'gym': 'strength'
        };

        return typeMapping[normalized] || normalized;
    }

    function parseDistanceText(text) {
        if (!text) return 0;

        const match = text.match(/([\d.]+)\s*(km|mi|m)?/i);
        if (!match) return 0;

        const value = parseFloat(match[1]);
        const unit = (match[2] || '').toLowerCase();

        switch (unit) {
            case 'km':
                return value * 1000; // Convert to meters
            case 'mi':
                return value * 1609.34; // Convert to meters
            case 'm':
            default:
                return value;
        }
    }

    function parseDurationText(text) {
        if (!text) return 0;

        // Handle formats like "1:23:45", "23:45", "45m", "1h 23m"
        let totalSeconds = 0;

        // HH:MM:SS or MM:SS format
        const timeMatch = text.match(/(\d+):(\d+)(?::(\d+))?/);
        if (timeMatch) {
            const hours = timeMatch[3] ? parseInt(timeMatch[1]) : 0;
            const minutes = timeMatch[3] ? parseInt(timeMatch[2]) : parseInt(timeMatch[1]);
            const seconds = timeMatch[3] ? parseInt(timeMatch[3]) : parseInt(timeMatch[2]);

            totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
        } else {
            // Handle "1h 23m" or "45m" format
            const hourMatch = text.match(/(\d+)h/i);
            const minuteMatch = text.match(/(\d+)m/i);
            const secondMatch = text.match(/(\d+)s/i);

            if (hourMatch) totalSeconds += parseInt(hourMatch[1]) * 3600;
            if (minuteMatch) totalSeconds += parseInt(minuteMatch[1]) * 60;
            if (secondMatch) totalSeconds += parseInt(secondMatch[1]);
        }

        return totalSeconds;
    }

    function isActivityInDateRange(activity, startDate, endDate) {
        try {
            const activityDate = new Date(activity.startTime || activity.date);
            return activityDate >= startDate && activityDate <= endDate;
        } catch (error) {
            return false;
        }
    }

    // Public API
    return {
        fetchActivitiesForMonth: fetchActivitiesForMonth,
        getAuthenticationData: getAuthenticationData
    };

})();
