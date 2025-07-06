// Local storage management for COROS Activity Calendar extension

window.CorosStorage = (function () {
    'use strict';

    // Storage configuration
    const STORAGE_CONFIG = {
        prefix: 'coros_activities_',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
        maxEntries: 50 // Maximum number of cached month entries
    };

    /**
     * Save activities data for a specific month
     * @param {string} monthKey - Month identifier (YYYY-MM format)
     * @param {Array} activities - Array of activity objects
     * @returns {Promise<boolean>} Success status
     */
    async function saveActivities(monthKey, activities) {
        try {
            if (!monthKey || !Array.isArray(activities)) {
                throw new Error('Invalid parameters for saveActivities');
            }

            const storageKey = STORAGE_CONFIG.prefix + monthKey;
            const dataToStore = {
                activities: activities,
                timestamp: Date.now(),
                monthKey: monthKey,
                version: '1.0'
            };

            // Use Chrome extension storage API if available, otherwise localStorage
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                await chromeStorageSet(storageKey, dataToStore);
            } else {
                localStorage.setItem(storageKey, JSON.stringify(dataToStore));
            }

            console.log(`Saved ${activities.length} activities for ${monthKey}`);

            // Clean up old entries to prevent storage bloat
            await cleanupOldEntries();

            return true;

        } catch (error) {
            console.error('Error saving activities:', error);
            return false;
        }
    }

    /**
     * Get cached activities data for a specific month
     * @param {string} monthKey - Month identifier (YYYY-MM format)
     * @returns {Promise<Array|null>} Array of activities or null if not found/expired
     */
    async function getActivities(monthKey) {
        try {
            if (!monthKey) {
                throw new Error('Month key is required');
            }

            const storageKey = STORAGE_CONFIG.prefix + monthKey;
            let storedData;

            // Use Chrome extension storage API if available, otherwise localStorage
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                storedData = await chromeStorageGet(storageKey);
            } else {
                const rawData = localStorage.getItem(storageKey);
                storedData = rawData ? JSON.parse(rawData) : null;
            }

            if (!storedData) {
                console.log(`No cached data found for ${monthKey}`);
                return null;
            }

            // Check if data is expired
            const isExpired = (Date.now() - storedData.timestamp) > STORAGE_CONFIG.maxAge;
            if (isExpired) {
                console.log(`Cached data for ${monthKey} has expired`);
                await removeActivities(monthKey);
                return null;
            }

            // Validate data structure
            if (!Array.isArray(storedData.activities)) {
                console.warn(`Invalid cached data structure for ${monthKey}`);
                await removeActivities(monthKey);
                return null;
            }

            console.log(`Retrieved ${storedData.activities.length} cached activities for ${monthKey}`);
            return storedData.activities;

        } catch (error) {
            console.error('Error getting activities:', error);
            return null;
        }
    }

    /**
     * Remove cached activities for a specific month
     * @param {string} monthKey - Month identifier (YYYY-MM format)
     * @returns {Promise<boolean>} Success status
     */
    async function removeActivities(monthKey) {
        try {
            if (!monthKey) {
                throw new Error('Month key is required');
            }

            const storageKey = STORAGE_CONFIG.prefix + monthKey;

            // Use Chrome extension storage API if available, otherwise localStorage
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                await chromeStorageRemove(storageKey);
            } else {
                localStorage.removeItem(storageKey);
            }

            console.log(`Removed cached activities for ${monthKey}`);
            return true;

        } catch (error) {
            console.error('Error removing activities:', error);
            return false;
        }
    }

    /**
     * Get all cached month keys
     * @returns {Promise<Array>} Array of month keys
     */
    async function getCachedMonths() {
        try {
            let allKeys = [];

            // Use Chrome extension storage API if available, otherwise localStorage
            if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                const allData = await chromeStorageGetAll();
                allKeys = Object.keys(allData);
            } else {
                allKeys = Object.keys(localStorage);
            }

            // Filter keys that match our prefix
            const cachedMonths = allKeys
                .filter(key => key.startsWith(STORAGE_CONFIG.prefix))
                .map(key => key.replace(STORAGE_CONFIG.prefix, ''))
                .sort();

            return cachedMonths;

        } catch (error) {
            console.error('Error getting cached months:', error);
            return [];
        }
    }

    /**
     * Clear all cached activities data
     * @returns {Promise<boolean>} Success status
     */
    async function clearAllActivities() {
        try {
            const cachedMonths = await getCachedMonths();

            for (const monthKey of cachedMonths) {
                await removeActivities(monthKey);
            }

            console.log(`Cleared ${cachedMonths.length} cached month entries`);
            return true;

        } catch (error) {
            console.error('Error clearing all activities:', error);
            return false;
        }
    }

    /**
     * Get storage usage statistics
     * @returns {Promise<Object>} Storage statistics
     */
    async function getStorageStats() {
        try {
            const cachedMonths = await getCachedMonths();
            let totalSize = 0;
            let totalActivities = 0;
            const monthStats = [];

            for (const monthKey of cachedMonths) {
                const activities = await getActivities(monthKey);
                if (activities) {
                    const monthSize = JSON.stringify(activities).length;
                    totalSize += monthSize;
                    totalActivities += activities.length;

                    monthStats.push({
                        month: monthKey,
                        activities: activities.length,
                        size: monthSize
                    });
                }
            }

            return {
                totalMonths: cachedMonths.length,
                totalActivities: totalActivities,
                totalSize: totalSize,
                averageSize: totalSize / cachedMonths.length || 0,
                months: monthStats
            };

        } catch (error) {
            console.error('Error getting storage stats:', error);
            return {
                totalMonths: 0,
                totalActivities: 0,
                totalSize: 0,
                averageSize: 0,
                months: []
            };
        }
    }

    /**
     * Clean up old entries to prevent storage bloat
     */
    async function cleanupOldEntries() {
        try {
            const cachedMonths = await getCachedMonths();

            // Remove entries older than maxAge
            const cutoffTime = Date.now() - STORAGE_CONFIG.maxAge;
            const monthsToRemove = [];

            for (const monthKey of cachedMonths) {
                const storageKey = STORAGE_CONFIG.prefix + monthKey;
                let storedData;

                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    storedData = await chromeStorageGet(storageKey);
                } else {
                    const rawData = localStorage.getItem(storageKey);
                    storedData = rawData ? JSON.parse(rawData) : null;
                }

                if (storedData && storedData.timestamp < cutoffTime) {
                    monthsToRemove.push(monthKey);
                }
            }

            // Remove expired entries
            for (const monthKey of monthsToRemove) {
                await removeActivities(monthKey);
            }

            // If still too many entries, remove oldest ones
            const remainingMonths = cachedMonths.filter(m => !monthsToRemove.includes(m));
            if (remainingMonths.length > STORAGE_CONFIG.maxEntries) {
                const excessMonths = remainingMonths
                    .slice(0, remainingMonths.length - STORAGE_CONFIG.maxEntries);

                for (const monthKey of excessMonths) {
                    await removeActivities(monthKey);
                }
            }

            if (monthsToRemove.length > 0) {
                console.log(`Cleaned up ${monthsToRemove.length} old cache entries`);
            }

        } catch (error) {
            console.error('Error during cleanup:', error);
        }
    }

    /**
     * Chrome storage wrapper functions
     */
    function chromeStorageSet(key, value) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.set({ [key]: value }, () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve();
                }
            });
        });
    }

    function chromeStorageGet(key) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get([key], (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(result[key]);
                }
            });
        });
    }

    function chromeStorageGetAll() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(null, (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(result);
                }
            });
        });
    }

    function chromeStorageRemove(key) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.remove([key], () => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve();
                }
            });
        });
    }

    // Public API
    return {
        saveActivities: saveActivities,
        getActivities: getActivities,
        removeActivities: removeActivities,
        getCachedMonths: getCachedMonths,
        clearAllActivities: clearAllActivities,
        getStorageStats: getStorageStats
    };

})();
  