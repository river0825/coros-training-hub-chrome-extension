// Utility functions for date formatting and manipulation

/**
 * Format date to YYYY-MM-DD format
 * @param {Date|string|number} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDateKey(date) {
  const dateObj = new Date(date);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format COROS date number (YYYYMMDD) to YYYY-MM-DD
 * @param {number} corosDate - COROS date number
 * @returns {string} Formatted date string
 */
export function formatCorosDate(corosDate) {
  if (!corosDate) return '';
  const str = corosDate.toString();
  return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
}

/**
 * Convert date to COROS API format (YYYYMMDD)
 * @param {Date} date - Date object
 * @returns {string} COROS API formatted date
 */
export function formatDateForAPI(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Convert COROS date and time to ISO string
 * @param {number} corosDate - COROS date number (YYYYMMDD)
 * @param {number} startTimeUnix - Unix timestamp
 * @returns {string} ISO date string
 */
export function convertCorosDateToISO(corosDate, startTimeUnix) {
  if (startTimeUnix) {
    return new Date(startTimeUnix * 1000).toISOString();
  }

  const dateStr = String(corosDate);
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  return new Date(`${year}-${month}-${day}`).toISOString();
}

/**
 * Get month key for storage (YYYY-MM)
 * @param {Date} date - Date object
 * @returns {string} Month key
 */
export function getMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Check if date is today
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is today
 */
export function isDateToday(date) {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

/**
 * Check if date is current month
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @returns {boolean} True if it's current month
 */
export function isCurrentMonth(year, month) {
  const now = new Date();
  return year === now.getFullYear() && month === now.getMonth();
}

/**
 * Get start of week for given date
 * @param {Date} date - Date object
 * @returns {Date} Start of week
 */
export function getWeekStart(date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day;
  start.setDate(diff);
  return start;
}

/**
 * Get days in month
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @returns {number} Number of days in month
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Check if activity is within date range
 * @param {Object} activity - Activity object
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {boolean} True if activity is in range
 */
export function isActivityInDateRange(activity, startDate, endDate) {
  try {
    const activityDate = new Date(activity.startTime || activity.date);
    return activityDate >= startDate && activityDate <= endDate;
  } catch (error) {
    return false;
  }
}