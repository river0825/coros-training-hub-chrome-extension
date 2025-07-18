// Utility functions for formatting data display

/**
 * Format time in seconds to HH:MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export function formatTime(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds)) return '00:00:00';
  
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}

/**
 * Format duration in seconds to human readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "1h 30m")
 */
export function formatDuration(seconds) {
  if (!seconds || seconds < 60) return seconds ? `${seconds}s` : '0m';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Format distance in meters to human readable format
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance (e.g., "5.2 km")
 */
export function formatDistance(meters) {
  if (!meters || meters < 1) return '0';

  if (meters >= 1000) {
    const km = (meters / 1000).toFixed(1);
    return `${km} km`;
  } else {
    return `${Math.round(meters)} m`;
  }
}

/**
 * Format calories with appropriate unit
 * @param {number} calories - Calories burned
 * @returns {string} Formatted calories
 */
export function formatCalories(calories) {
  if (!calories || calories < 1) return '0';

  if (calories >= 1000) {
    return `${(calories / 1000).toFixed(1)}k`;
  } else {
    return Math.round(calories).toString();
  }
}

/**
 * Parse time string to seconds
 * @param {string|number} timeStr - Time string (HH:MM:SS or MM:SS)
 * @returns {number} Time in seconds
 */
export function parseTimeToSeconds(timeStr) {
  if (typeof timeStr === 'number') return timeStr;
  if (!timeStr) return 0;

  const parts = timeStr.split(':').map(Number).reverse();
  let seconds = 0;
  if (parts[0]) seconds += parts[0];
  if (parts[1]) seconds += parts[1] * 60;
  if (parts[2]) seconds += parts[2] * 3600;
  return seconds;
}

/**
 * Parse distance text to meters
 * @param {string} text - Distance text (e.g., "5.2 km")
 * @returns {number} Distance in meters
 */
export function parseDistanceText(text) {
  if (!text) return 0;

  const match = text.match(/([\d.]+)\s*(km|mi|m)?/i);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = (match[2] || '').toLowerCase();

  switch (unit) {
    case 'km':
      return value * 1000;
    case 'mi':
      return value * 1609.34;
    case 'm':
    default:
      return value;
  }
}

/**
 * Parse duration text to seconds
 * @param {string} text - Duration text (e.g., "1:23:45", "45m")
 * @returns {number} Duration in seconds
 */
export function parseDurationText(text) {
  if (!text) return 0;

  let totalSeconds = 0;

  // Handle HH:MM:SS or MM:SS format
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

/**
 * Format number with thousand separators
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  if (typeof num !== 'number') return '0';
  return num.toLocaleString();
}

/**
 * Format percentage with appropriate precision
 * @param {number} value - Percentage value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage
 */
export function formatPercentage(value, decimals = 0) {
  if (typeof value !== 'number') return '0%';
  return `${value.toFixed(decimals)}%`;
}