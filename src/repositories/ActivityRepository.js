// Activity repository for data access and management

import { STORAGE_CONFIG } from '../config/constants.js';
import { getMonthKey } from '../utils/dateUtils.js';

/**
 * Repository for managing activity data storage and retrieval
 */
export class ActivityRepository {
  constructor(storageAdapter) {
    this.storageAdapter = storageAdapter;
  }

  /**
   * Save activities for a specific month
   * @param {string} monthKey - Month identifier (YYYY-MM)
   * @param {Array} activities - Array of activity objects
   * @returns {Promise<boolean>} Success status
   */
  async saveActivities(monthKey, activities) {
    try {
      if (!monthKey || !Array.isArray(activities)) {
        throw new Error('Invalid parameters for saveActivities');
      }

      const success = await this.storageAdapter.set(monthKey, {
        activities,
        timestamp: Date.now(),
        monthKey,
        version: STORAGE_CONFIG.version
      });

      if (success) {
        console.log(`[ActivityRepository] Saved ${activities.length} activities for ${monthKey}`);
        await this.cleanup();
      }

      return success;
    } catch (error) {
      console.error('[ActivityRepository] Error saving activities:', error);
      return false;
    }
  }

  /**
   * Get activities for a specific month
   * @param {string} monthKey - Month identifier (YYYY-MM)
   * @returns {Promise<Array|null>} Array of activities or null if not found/expired
   */
  async getActivities(monthKey) {
    try {
      if (!monthKey) {
        throw new Error('Month key is required');
      }

      const storedData = await this.storageAdapter.get(monthKey);
      
      if (!storedData) {
        console.log(`[ActivityRepository] No cached data found for ${monthKey}`);
        return null;
      }

      // Check if data is expired
      const isExpired = (Date.now() - storedData.timestamp) > STORAGE_CONFIG.maxAge;
      if (isExpired) {
        console.log(`[ActivityRepository] Cached data for ${monthKey} has expired`);
        await this.removeActivities(monthKey);
        return null;
      }

      // Validate data structure
      if (!Array.isArray(storedData.activities)) {
        console.warn(`[ActivityRepository] Invalid cached data structure for ${monthKey}`);
        await this.removeActivities(monthKey);
        return null;
      }

      console.log(`[ActivityRepository] Retrieved ${storedData.activities.length} cached activities for ${monthKey}`);
      return storedData.activities;
    } catch (error) {
      console.error('[ActivityRepository] Error getting activities:', error);
      return null;
    }
  }

  /**
   * Remove activities for a specific month
   * @param {string} monthKey - Month identifier (YYYY-MM)
   * @returns {Promise<boolean>} Success status
   */
  async removeActivities(monthKey) {
    try {
      if (!monthKey) {
        throw new Error('Month key is required');
      }

      const success = await this.storageAdapter.remove(monthKey);
      
      if (success) {
        console.log(`[ActivityRepository] Removed cached activities for ${monthKey}`);
      }

      return success;
    } catch (error) {
      console.error('[ActivityRepository] Error removing activities:', error);
      return false;
    }
  }

  /**
   * Get activities for a date range
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Array>} Array of activities in range
   */
  async getActivitiesInRange(startDate, endDate) {
    try {
      const activities = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const monthKey = getMonthKey(currentDate);
        const monthActivities = await this.getActivities(monthKey);
        
        if (monthActivities) {
          // Filter activities within the date range
          const filteredActivities = monthActivities.filter(activity => {
            const activityDate = new Date(activity.startTime || activity.date);
            return activityDate >= startDate && activityDate <= endDate;
          });
          
          activities.push(...filteredActivities);
        }
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
        currentDate.setDate(1);
      }
      
      return activities;
    } catch (error) {
      console.error('[ActivityRepository] Error getting activities in range:', error);
      return [];
    }
  }

  /**
   * Get all cached month keys
   * @returns {Promise<Array>} Array of month keys
   */
  async getCachedMonths() {
    try {
      const allKeys = await this.storageAdapter.getAllKeys();
      return allKeys
        .filter(key => key.startsWith(STORAGE_CONFIG.prefix))
        .map(key => key.replace(STORAGE_CONFIG.prefix, ''))
        .sort();
    } catch (error) {
      console.error('[ActivityRepository] Error getting cached months:', error);
      return [];
    }
  }

  /**
   * Clear all cached activities
   * @returns {Promise<boolean>} Success status
   */
  async clearAllActivities() {
    try {
      const cachedMonths = await this.getCachedMonths();
      
      for (const monthKey of cachedMonths) {
        await this.removeActivities(monthKey);
      }
      
      console.log(`[ActivityRepository] Cleared ${cachedMonths.length} cached month entries`);
      return true;
    } catch (error) {
      console.error('[ActivityRepository] Error clearing all activities:', error);
      return false;
    }
  }

  /**
   * Get repository statistics
   * @returns {Promise<Object>} Repository statistics
   */
  async getStats() {
    try {
      const cachedMonths = await this.getCachedMonths();
      let totalActivities = 0;
      let totalSize = 0;
      const monthStats = [];

      for (const monthKey of cachedMonths) {
        const activities = await this.getActivities(monthKey);
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
        totalActivities,
        totalSize,
        averageSize: totalSize / cachedMonths.length || 0,
        months: monthStats
      };
    } catch (error) {
      console.error('[ActivityRepository] Error getting stats:', error);
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
   * @private
   */
  async cleanup() {
    try {
      const cachedMonths = await this.getCachedMonths();
      
      // Remove entries older than maxAge
      const cutoffTime = Date.now() - STORAGE_CONFIG.maxAge;
      const monthsToRemove = [];

      for (const monthKey of cachedMonths) {
        const storedData = await this.storageAdapter.get(monthKey);
        if (storedData && storedData.timestamp < cutoffTime) {
          monthsToRemove.push(monthKey);
        }
      }

      // Remove expired entries
      for (const monthKey of monthsToRemove) {
        await this.removeActivities(monthKey);
      }

      // If still too many entries, remove oldest ones
      const remainingMonths = cachedMonths.filter(m => !monthsToRemove.includes(m));
      if (remainingMonths.length > STORAGE_CONFIG.maxEntries) {
        const excessMonths = remainingMonths
          .slice(0, remainingMonths.length - STORAGE_CONFIG.maxEntries);

        for (const monthKey of excessMonths) {
          await this.removeActivities(monthKey);
        }
      }

      if (monthsToRemove.length > 0) {
        console.log(`[ActivityRepository] Cleaned up ${monthsToRemove.length} old cache entries`);
      }
    } catch (error) {
      console.error('[ActivityRepository] Error during cleanup:', error);
    }
  }
}