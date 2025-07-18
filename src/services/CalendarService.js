// Calendar service for calendar-related business logic

import { getDaysInMonth, isDateToday, getWeekStart } from '../utils/dateUtils.js';
import { formatDistance, formatDuration } from '../utils/formatUtils.js';
import { getSportConfig } from '../utils/sportUtils.js';

/**
 * Service for calendar-related business logic
 */
export class CalendarService {
  constructor(activityDataProcessor) {
    this.activityDataProcessor = activityDataProcessor;
  }

  /**
   * Generate calendar data for a specific month
   * @param {number} year - Year
   * @param {number} month - Month (0-11)
   * @param {Array} activities - Array of activities
   * @returns {Object} Calendar data
   */
  generateCalendarData(year, month, activities) {
    const calendarData = {
      year,
      month,
      monthName: this.getMonthName(month),
      daysInMonth: getDaysInMonth(year, month),
      firstDay: new Date(year, month, 1).getDay(),
      weeks: [],
      activities: this.activityDataProcessor.groupActivitiesByDate(activities),
      stats: this.calculateMonthlyStats(activities)
    };

    // Generate calendar weeks
    calendarData.weeks = this.generateCalendarWeeks(year, month, calendarData.activities);

    return calendarData;
  }

  /**
   * Generate calendar weeks for month view
   * @param {number} year - Year
   * @param {number} month - Month (0-11)
   * @param {Object} activitiesByDate - Activities grouped by date
   * @returns {Array} Array of week data
   */
  generateCalendarWeeks(year, month, activitiesByDate) {
    const weeks = [];
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    let currentDate = new Date(startDate);

    // Generate 6 weeks (42 days) for consistent calendar layout
    for (let week = 0; week < 6; week++) {
      const weekData = {
        weekNumber: week,
        days: []
      };

      for (let day = 0; day < 7; day++) {
        const dayData = this.generateDayData(currentDate, month, activitiesByDate);
        weekData.days.push(dayData);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      weeks.push(weekData);
    }

    return weeks;
  }

  /**
   * Generate data for a single day
   * @param {Date} date - Date object
   * @param {number} currentMonth - Current month being displayed (0-11)
   * @param {Object} activitiesByDate - Activities grouped by date
   * @returns {Object} Day data
   */
  generateDayData(date, currentMonth, activitiesByDate) {
    const dateKey = date.toISOString().split('T')[0];
    const dayActivities = activitiesByDate[dateKey] || [];

    return {
      date: new Date(date),
      dateKey,
      dayNumber: date.getDate(),
      isCurrentMonth: date.getMonth() === currentMonth,
      isToday: isDateToday(date),
      activities: dayActivities,
      activityCount: dayActivities.length,
      groupedActivities: this.groupActivitiesByType(dayActivities),
      summary: this.calculateDaySummary(dayActivities)
    };
  }

  /**
   * Generate week view data
   * @param {Date} date - Date in the week to display
   * @param {Array} activities - Array of activities
   * @returns {Object} Week data
   */
  generateWeekData(date, activities) {
    const weekStart = getWeekStart(date);
    const weekDays = [];

    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      weekDays.push(day);
    }

    const activitiesByDate = this.activityDataProcessor.groupActivitiesByDate(activities);
    
    return {
      weekStart,
      weekEnd: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
      days: weekDays.map(day => this.generateDayData(day, date.getMonth(), activitiesByDate)),
      stats: this.calculateWeeklyStats(activities, weekStart)
    };
  }

  /**
   * Group activities by type for a single day
   * @param {Array} activities - Array of activities
   * @returns {Object} Activities grouped by type
   */
  groupActivitiesByType(activities) {
    const grouped = {};

    activities.forEach(activity => {
      const sportType = activity.type;
      if (!grouped[sportType]) {
        grouped[sportType] = {
          type: sportType,
          config: getSportConfig(sportType),
          activities: [],
          count: 0,
          totalDistance: 0,
          totalDuration: 0,
          totalCalories: 0
        };
      }

      const group = grouped[sportType];
      group.activities.push(activity);
      group.count++;
      group.totalDistance += activity.distance;
      group.totalDuration += activity.duration;
      group.totalCalories += activity.calories;
    });

    return grouped;
  }

  /**
   * Calculate summary for a single day
   * @param {Array} activities - Array of activities for the day
   * @returns {Object} Day summary
   */
  calculateDaySummary(activities) {
    const summary = {
      totalActivities: activities.length,
      totalDistance: 0,
      totalDuration: 0,
      totalCalories: 0,
      sportTypes: new Set()
    };

    activities.forEach(activity => {
      summary.totalDistance += activity.distance;
      summary.totalDuration += activity.duration;
      summary.totalCalories += activity.calories;
      summary.sportTypes.add(activity.type);
    });

    summary.sportTypes = summary.sportTypes.size;
    
    return {
      ...summary,
      formattedDistance: formatDistance(summary.totalDistance),
      formattedDuration: formatDuration(summary.totalDuration)
    };
  }

  /**
   * Calculate monthly statistics
   * @param {Array} activities - Array of activities for the month
   * @returns {Object} Monthly statistics
   */
  calculateMonthlyStats(activities) {
    const stats = {
      totalActivities: activities.length,
      totalDistance: 0,
      totalDuration: 0,
      totalCalories: 0,
      activeDays: new Set(),
      sportTypeStats: {},
      groupStats: {
        run: { count: 0, distance: 0, time: 0, days: new Set() },
        bike: { count: 0, distance: 0, time: 0, days: new Set() },
        swim: { count: 0, distance: 0, time: 0, days: new Set() }
      }
    };

    activities.forEach(activity => {
      const date = activity.date;
      const code = parseInt(activity.code, 10);

      // Overall stats
      stats.totalDistance += activity.distance;
      stats.totalDuration += activity.duration;
      stats.totalCalories += activity.calories;
      stats.activeDays.add(date);

      // Sport type stats
      const sportType = activity.type;
      if (!stats.sportTypeStats[sportType]) {
        stats.sportTypeStats[sportType] = {
          name: getSportConfig(sportType).name,
          count: 0,
          distance: 0,
          time: 0,
          calories: 0
        };
      }
      
      const sportStats = stats.sportTypeStats[sportType];
      sportStats.count++;
      sportStats.distance += activity.distance;
      sportStats.time += activity.duration;
      sportStats.calories += activity.calories;

      // Group stats by code ranges
      if (code >= 100 && code < 200) {
        stats.groupStats.run.count++;
        stats.groupStats.run.distance += activity.distance;
        stats.groupStats.run.time += activity.duration;
        stats.groupStats.run.days.add(date);
      } else if (code >= 200 && code < 300) {
        stats.groupStats.bike.count++;
        stats.groupStats.bike.distance += activity.distance;
        stats.groupStats.bike.time += activity.duration;
        stats.groupStats.bike.days.add(date);
      } else if (code >= 300 && code < 400) {
        stats.groupStats.swim.count++;
        stats.groupStats.swim.distance += activity.distance;
        stats.groupStats.swim.time += activity.duration;
        stats.groupStats.swim.days.add(date);
      }
    });

    // Convert sets to sizes
    stats.activeDays = stats.activeDays.size;
    stats.groupStats.run.days = stats.groupStats.run.days.size;
    stats.groupStats.bike.days = stats.groupStats.bike.days.size;
    stats.groupStats.swim.days = stats.groupStats.swim.days.size;

    return stats;
  }

  /**
   * Calculate weekly statistics
   * @param {Array} activities - Array of activities
   * @param {Date} weekStart - Start of the week
   * @returns {Object} Weekly statistics
   */
  calculateWeeklyStats(activities, weekStart) {
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
    
    const weekActivities = activities.filter(activity => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= weekStart && activityDate <= weekEnd;
    });

    return this.calculateMonthlyStats(weekActivities);
  }

  /**
   * Get navigation data for calendar
   * @param {number} year - Current year
   * @param {number} month - Current month (0-11)
   * @returns {Object} Navigation data
   */
  getNavigationData(year, month) {
    const currentDate = new Date(year, month);
    const previousMonth = new Date(currentDate);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    return {
      current: {
        year,
        month,
        monthName: this.getMonthName(month),
        displayName: `${this.getMonthName(month)} ${year}`
      },
      previous: {
        year: previousMonth.getFullYear(),
        month: previousMonth.getMonth(),
        monthName: this.getMonthName(previousMonth.getMonth()),
        displayName: `${this.getMonthName(previousMonth.getMonth())} ${previousMonth.getFullYear()}`
      },
      next: {
        year: nextMonth.getFullYear(),
        month: nextMonth.getMonth(),
        monthName: this.getMonthName(nextMonth.getMonth()),
        displayName: `${this.getMonthName(nextMonth.getMonth())} ${nextMonth.getFullYear()}`
      }
    };
  }

  /**
   * Get month name
   * @param {number} month - Month number (0-11)
   * @returns {string} Month name
   */
  getMonthName(month) {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return monthNames[month];
  }

  /**
   * Get weekday names
   * @returns {Array} Array of weekday names
   */
  getWeekdayNames() {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }

  /**
   * Get calendar cell CSS classes
   * @param {Object} dayData - Day data object
   * @returns {Array} Array of CSS classes
   */
  getCalendarCellClasses(dayData) {
    const classes = ['coros-calendar-cell'];

    if (!dayData.isCurrentMonth) {
      classes.push('other-month');
    }

    if (dayData.isToday) {
      classes.push('today');
    }

    if (dayData.activityCount > 0) {
      classes.push('has-activities');
    }

    if (dayData.activityCount > 3) {
      classes.push('busy-day');
    }

    return classes;
  }

  /**
   * Check if month should be cached
   * @param {number} year - Year
   * @param {number} month - Month (0-11)
   * @returns {boolean} True if month should be cached
   */
  shouldCacheMonth(year, month) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Don't cache current month (always fetch fresh)
    if (year === currentYear && month === currentMonth) {
      return false;
    }

    // Cache past months
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return true;
    }

    // Don't cache future months
    return false;
  }

  /**
   * Get default calendar date
   * @returns {Object} Default year and month
   */
  getDefaultDate() {
    const today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth();

    // If it's early in the month (first 3 days), show previous month
    if (today.getDate() <= 3) {
      month--;
      if (month < 0) {
        month = 11;
        year--;
      }
    }

    return { year, month };
  }
}