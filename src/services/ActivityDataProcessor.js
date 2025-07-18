// Activity data processing service

import { formatTime, formatDistance, formatCalories } from '../utils/formatUtils.js';
import { formatCorosDate, convertCorosDateToISO } from '../utils/dateUtils.js';
import { mapCorosSportType, normalizeActivityType } from '../utils/sportUtils.js';

/**
 * Service for processing and formatting activity data
 */
export class ActivityDataProcessor {
  constructor() {
    this.processedActivities = new Map();
  }

  /**
   * Process raw activity data from API
   * @param {Array} rawActivities - Raw activity data from API
   * @returns {Array} Processed activity objects
   */
  processActivities(rawActivities) {
    if (!Array.isArray(rawActivities)) {
      return [];
    }

    return rawActivities.map(activity => this.processActivity(activity))
      .filter(activity => activity !== null);
  }

  /**
   * Process single activity
   * @param {Object} rawActivity - Raw activity object
   * @returns {Object|null} Processed activity or null if invalid
   */
  processActivity(rawActivity) {
    try {
      // Check if already processed
      const activityId = rawActivity.id || rawActivity.labelId;
      if (activityId && this.processedActivities.has(activityId)) {
        return this.processedActivities.get(activityId);
      }

      const processedActivity = {
        id: activityId || Math.random().toString(36),
        name: rawActivity.name || 'Activity',
        type: this.determineActivityType(rawActivity),
        code: rawActivity.sportType || rawActivity.sportCode,
        startTime: this.processStartTime(rawActivity),
        date: this.processDate(rawActivity),
        distance: this.processDistance(rawActivity),
        duration: this.processDuration(rawActivity),
        calories: this.processCalories(rawActivity),
        // Formatted values for display
        formattedDistance: formatDistance(this.processDistance(rawActivity)),
        formattedDuration: formatTime(this.processDuration(rawActivity)),
        formattedCalories: formatCalories(this.processCalories(rawActivity)),
        // Additional COROS specific data
        device: rawActivity.device,
        avgHr: rawActivity.avgHr,
        avgSpeed: rawActivity.avgSpeed,
        trainingLoad: rawActivity.trainingLoad,
        // Original raw data for reference
        originalData: rawActivity
      };

      // Cache processed activity
      if (activityId) {
        this.processedActivities.set(activityId, processedActivity);
      }

      return processedActivity;
    } catch (error) {
      console.warn('[ActivityDataProcessor] Error processing activity:', rawActivity, error);
      return null;
    }
  }

  /**
   * Determine activity type from raw data
   * @param {Object} rawActivity - Raw activity object
   * @returns {string} Normalized activity type
   */
  determineActivityType(rawActivity) {
    // First try to map from COROS sport type code
    if (rawActivity.sportType) {
      return mapCorosSportType(rawActivity.sportType);
    }

    // Fallback to normalize from type or sport field
    const type = rawActivity.type || rawActivity.sport;
    return normalizeActivityType(type);
  }

  /**
   * Process start time from raw data
   * @param {Object} rawActivity - Raw activity object
   * @returns {string} ISO date string
   */
  processStartTime(rawActivity) {
    if (rawActivity.startTime) {
      // If startTime is Unix timestamp
      if (typeof rawActivity.startTime === 'number') {
        return new Date(rawActivity.startTime * 1000).toISOString();
      }
      // If startTime is already ISO string
      return rawActivity.startTime;
    }

    // Fallback to COROS date format
    if (rawActivity.date) {
      return convertCorosDateToISO(rawActivity.date);
    }

    // Default to current date
    return new Date().toISOString();
  }

  /**
   * Process date from raw data
   * @param {Object} rawActivity - Raw activity object
   * @returns {string} Formatted date string (YYYY-MM-DD)
   */
  processDate(rawActivity) {
    if (rawActivity.date) {
      // If date is COROS format (YYYYMMDD)
      if (typeof rawActivity.date === 'number') {
        return formatCorosDate(rawActivity.date);
      }
      // If date is ISO string
      if (typeof rawActivity.date === 'string') {
        return rawActivity.date.split('T')[0];
      }
    }

    // Fallback to start time
    const startTime = this.processStartTime(rawActivity);
    return startTime.split('T')[0];
  }

  /**
   * Process distance from raw data
   * @param {Object} rawActivity - Raw activity object
   * @returns {number} Distance in meters
   */
  processDistance(rawActivity) {
    const distance = rawActivity.distance || 0;
    
    // Convert to number and ensure it's in meters
    const numDistance = parseFloat(distance);
    if (isNaN(numDistance)) {
      return 0;
    }

    // COROS API returns distance in meters, but some might be in km
    // If distance is less than 1000 and seems like km, convert to meters
    if (numDistance < 1000 && numDistance > 0) {
      // Check if this might be in km by looking at the activity type
      const activityType = this.determineActivityType(rawActivity);
      if (['running', 'cycling', 'swimming'].includes(activityType)) {
        return numDistance * 1000; // Convert km to meters
      }
    }

    return numDistance;
  }

  /**
   * Process duration from raw data
   * @param {Object} rawActivity - Raw activity object
   * @returns {number} Duration in seconds
   */
  processDuration(rawActivity) {
    const duration = rawActivity.duration || 
                    rawActivity.workoutTime || 
                    rawActivity.totalTime || 
                    rawActivity.movingTime || 
                    0;

    const numDuration = parseFloat(duration);
    return isNaN(numDuration) ? 0 : numDuration;
  }

  /**
   * Process calories from raw data
   * @param {Object} rawActivity - Raw activity object
   * @returns {number} Calories burned
   */
  processCalories(rawActivity) {
    const calories = rawActivity.calories || rawActivity.calorie || 0;
    const numCalories = parseInt(calories, 10);
    return isNaN(numCalories) ? 0 : numCalories;
  }

  /**
   * Group activities by date
   * @param {Array} activities - Array of processed activities
   * @returns {Object} Activities grouped by date (YYYY-MM-DD)
   */
  groupActivitiesByDate(activities) {
    const grouped = {};

    activities.forEach(activity => {
      const date = activity.date;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(activity);
    });

    // Sort activities within each day by start time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => 
        new Date(a.startTime) - new Date(b.startTime)
      );
    });

    return grouped;
  }

  /**
   * Group activities by sport type
   * @param {Array} activities - Array of processed activities
   * @returns {Object} Activities grouped by sport type
   */
  groupActivitiesBySport(activities) {
    const grouped = {};

    activities.forEach(activity => {
      const sportType = activity.type;
      if (!grouped[sportType]) {
        grouped[sportType] = [];
      }
      grouped[sportType].push(activity);
    });

    return grouped;
  }

  /**
   * Filter activities by date range
   * @param {Array} activities - Array of processed activities
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Array} Filtered activities
   */
  filterActivitiesByDateRange(activities, startDate, endDate) {
    return activities.filter(activity => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= startDate && activityDate <= endDate;
    });
  }

  /**
   * Filter activities by sport type
   * @param {Array} activities - Array of processed activities
   * @param {string|string[]} sportTypes - Sport type(s) to filter by
   * @returns {Array} Filtered activities
   */
  filterActivitiesBySport(activities, sportTypes) {
    const types = Array.isArray(sportTypes) ? sportTypes : [sportTypes];
    return activities.filter(activity => types.includes(activity.type));
  }

  /**
   * Calculate activity statistics
   * @param {Array} activities - Array of processed activities
   * @returns {Object} Activity statistics
   */
  calculateActivityStatistics(activities) {
    const stats = {
      totalActivities: activities.length,
      totalDistance: 0,
      totalDuration: 0,
      totalCalories: 0,
      averageDistance: 0,
      averageDuration: 0,
      averageCalories: 0,
      activeDays: new Set(),
      sportTypes: new Set()
    };

    activities.forEach(activity => {
      stats.totalDistance += activity.distance;
      stats.totalDuration += activity.duration;
      stats.totalCalories += activity.calories;
      stats.activeDays.add(activity.date);
      stats.sportTypes.add(activity.type);
    });

    // Calculate averages
    if (activities.length > 0) {
      stats.averageDistance = stats.totalDistance / activities.length;
      stats.averageDuration = stats.totalDuration / activities.length;
      stats.averageCalories = stats.totalCalories / activities.length;
    }

    // Convert sets to sizes
    stats.activeDays = stats.activeDays.size;
    stats.sportTypes = stats.sportTypes.size;

    return stats;
  }

  /**
   * Get most recent activities
   * @param {Array} activities - Array of processed activities
   * @param {number} limit - Maximum number of activities to return
   * @returns {Array} Most recent activities
   */
  getMostRecentActivities(activities, limit = 10) {
    return activities
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      .slice(0, limit);
  }

  /**
   * Clear processed activities cache
   */
  clearCache() {
    this.processedActivities.clear();
    console.log('[ActivityDataProcessor] Cleared processed activities cache');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      cachedActivities: this.processedActivities.size,
      memoryUsage: JSON.stringify(Array.from(this.processedActivities.values())).length
    };
  }
}