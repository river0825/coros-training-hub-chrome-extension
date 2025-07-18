// Utility functions for sport type mapping and normalization

import { SPORT_TYPE_MAP, SPORT_TYPES } from '../config/constants.js';

/**
 * Map COROS sport type code to normalized sport type
 * @param {number} sportTypeCode - COROS sport type code
 * @returns {string} Normalized sport type
 */
export function mapCorosSportType(sportTypeCode) {
  return SPORT_TYPE_MAP[sportTypeCode] || 'other';
}

/**
 * Normalize activity type to standard format
 * @param {string} type - Activity type
 * @returns {string} Normalized activity type
 */
export function normalizeActivityType(type) {
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
    'gym': 'strength',
    'indoor_bike': 'indoor_cycling',
    'spinning': 'indoor_cycling',
    'treadmill_run': 'treadmill',
    'cross_training': 'other',
    'cardio': 'other'
  };

  return typeMapping[normalized] || (SPORT_TYPES[normalized] ? normalized : 'other');
}

/**
 * Get sport configuration by type
 * @param {string} sportType - Sport type
 * @returns {Object} Sport configuration with icon, color, and name
 */
export function getSportConfig(sportType) {
  return SPORT_TYPES[sportType] || SPORT_TYPES.other;
}

/**
 * Get all available sport types
 * @returns {Array} Array of sport type objects
 */
export function getAllSportTypes() {
  return Object.entries(SPORT_TYPES).map(([type, config]) => ({
    type,
    ...config
  }));
}

/**
 * Check if sport type is valid
 * @param {string} sportType - Sport type to validate
 * @returns {boolean} True if valid sport type
 */
export function isValidSportType(sportType) {
  return Object.prototype.hasOwnProperty.call(SPORT_TYPES, sportType);
}

/**
 * Group sport types by category
 * @returns {Object} Sport types grouped by category
 */
export function groupSportsByCategory() {
  const categories = {
    cardiovascular: ['running', 'cycling', 'swimming', 'hiking', 'walking'],
    strength: ['strength', 'yoga'],
    indoor: ['indoor_cycling', 'treadmill', 'elliptical'],
    water: ['swimming', 'rowing'],
    winter: ['skiing', 'snowboarding'],
    other: ['other']
  };

  const grouped = {};
  
  Object.entries(categories).forEach(([category, types]) => {
    grouped[category] = types.map(type => ({
      type,
      ...getSportConfig(type)
    }));
  });

  return grouped;
}

/**
 * Calculate sport type distribution
 * @param {Array} activities - Array of activities
 * @returns {Object} Sport type distribution with counts and percentages
 */
export function calculateSportTypeDistribution(activities) {
  const distribution = {};
  const total = activities.length;

  activities.forEach(activity => {
    const sportType = normalizeActivityType(activity.type || activity.sport);
    
    if (!distribution[sportType]) {
      distribution[sportType] = {
        count: 0,
        percentage: 0,
        config: getSportConfig(sportType)
      };
    }
    
    distribution[sportType].count++;
  });

  // Calculate percentages
  Object.keys(distribution).forEach(sportType => {
    distribution[sportType].percentage = (distribution[sportType].count / total) * 100;
  });

  return distribution;
}

/**
 * Get most popular sport type from activities
 * @param {Array} activities - Array of activities
 * @returns {Object} Most popular sport type with count
 */
export function getMostPopularSportType(activities) {
  const distribution = calculateSportTypeDistribution(activities);
  
  let mostPopular = null;
  let maxCount = 0;

  Object.entries(distribution).forEach(([sportType, data]) => {
    if (data.count > maxCount) {
      maxCount = data.count;
      mostPopular = {
        type: sportType,
        count: data.count,
        percentage: data.percentage,
        config: data.config
      };
    }
  });

  return mostPopular;
}