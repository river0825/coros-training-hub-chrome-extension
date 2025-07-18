// Statistics service for statistics calculation and analysis

import { formatDistance, formatDuration, formatCalories } from '../utils/formatUtils.js';
import { getSportConfig, getMostPopularSportType } from '../utils/sportUtils.js';

/**
 * Service for statistics calculation and analysis
 */
export class StatisticsService {
  constructor(activityDataProcessor) {
    this.activityDataProcessor = activityDataProcessor;
  }

  /**
   * Calculate comprehensive statistics for activities
   * @param {Array} activities - Array of activities
   * @param {Date} periodStart - Start of the period
   * @param {Date} periodEnd - End of the period
   * @returns {Object} Comprehensive statistics
   */
  calculateStatistics(activities, periodStart, periodEnd) {
    const stats = {
      period: {
        start: periodStart,
        end: periodEnd,
        duration: this.calculatePeriodDuration(periodStart, periodEnd)
      },
      overall: this.calculateOverallStats(activities),
      bySport: this.calculateSportStats(activities),
      byTime: this.calculateTimeStats(activities),
      trends: this.calculateTrends(activities, periodStart, periodEnd),
      achievements: this.calculateAchievements(activities),
      insights: this.generateInsights(activities, periodStart, periodEnd)
    };

    return stats;
  }

  /**
   * Calculate overall statistics
   * @param {Array} activities - Array of activities
   * @returns {Object} Overall statistics
   */
  calculateOverallStats(activities) {
    const stats = {
      totalActivities: activities.length,
      activeDays: new Set(),
      totalDistance: 0,
      totalDuration: 0,
      totalCalories: 0,
      averageDistance: 0,
      averageDuration: 0,
      averageCalories: 0,
      uniqueSports: new Set(),
      longestActivity: null,
      shortestActivity: null,
      highestCalories: null
    };

    let longestDuration = 0;
    let shortestDuration = Infinity;
    let highestCalories = 0;

    activities.forEach(activity => {
      const date = activity.date;
      stats.activeDays.add(date);
      stats.totalDistance += activity.distance;
      stats.totalDuration += activity.duration;
      stats.totalCalories += activity.calories;
      stats.uniqueSports.add(activity.type);

      // Track longest activity
      if (activity.duration > longestDuration) {
        longestDuration = activity.duration;
        stats.longestActivity = activity;
      }

      // Track shortest activity
      if (activity.duration < shortestDuration && activity.duration > 0) {
        shortestDuration = activity.duration;
        stats.shortestActivity = activity;
      }

      // Track highest calories
      if (activity.calories > highestCalories) {
        highestCalories = activity.calories;
        stats.highestCalories = activity;
      }
    });

    // Calculate averages
    if (activities.length > 0) {
      stats.averageDistance = stats.totalDistance / activities.length;
      stats.averageDuration = stats.totalDuration / activities.length;
      stats.averageCalories = stats.totalCalories / activities.length;
    }

    // Convert sets to sizes
    stats.activeDays = stats.activeDays.size;
    stats.uniqueSports = stats.uniqueSports.size;

    // Add formatted values
    stats.formattedTotalDistance = formatDistance(stats.totalDistance);
    stats.formattedTotalDuration = formatDuration(stats.totalDuration);
    stats.formattedTotalCalories = formatCalories(stats.totalCalories);
    stats.formattedAverageDistance = formatDistance(stats.averageDistance);
    stats.formattedAverageDuration = formatDuration(stats.averageDuration);
    stats.formattedAverageCalories = formatCalories(stats.averageCalories);

    return stats;
  }

  /**
   * Calculate statistics by sport type
   * @param {Array} activities - Array of activities
   * @returns {Object} Sport-specific statistics
   */
  calculateSportStats(activities) {
    const sportStats = {};

    activities.forEach(activity => {
      const sportType = activity.type;
      
      if (!sportStats[sportType]) {
        sportStats[sportType] = {
          name: getSportConfig(sportType).name,
          icon: getSportConfig(sportType).icon,
          color: getSportConfig(sportType).color,
          count: 0,
          activeDays: new Set(),
          totalDistance: 0,
          totalDuration: 0,
          totalCalories: 0,
          averageDistance: 0,
          averageDuration: 0,
          averageCalories: 0,
          activities: [],
          longestActivity: null,
          bestPerformance: null
        };
      }

      const stats = sportStats[sportType];
      stats.count++;
      stats.activeDays.add(activity.date);
      stats.totalDistance += activity.distance;
      stats.totalDuration += activity.duration;
      stats.totalCalories += activity.calories;
      stats.activities.push(activity);

      // Track longest activity for this sport
      if (!stats.longestActivity || activity.duration > stats.longestActivity.duration) {
        stats.longestActivity = activity;
      }

      // Track best performance (longest distance)
      if (!stats.bestPerformance || activity.distance > stats.bestPerformance.distance) {
        stats.bestPerformance = activity;
      }
    });

    // Calculate averages and format values
    Object.keys(sportStats).forEach(sportType => {
      const stats = sportStats[sportType];
      
      if (stats.count > 0) {
        stats.averageDistance = stats.totalDistance / stats.count;
        stats.averageDuration = stats.totalDuration / stats.count;
        stats.averageCalories = stats.totalCalories / stats.count;
      }

      stats.activeDays = stats.activeDays.size;
      stats.formattedTotalDistance = formatDistance(stats.totalDistance);
      stats.formattedTotalDuration = formatDuration(stats.totalDuration);
      stats.formattedTotalCalories = formatCalories(stats.totalCalories);
      stats.formattedAverageDistance = formatDistance(stats.averageDistance);
      stats.formattedAverageDuration = formatDuration(stats.averageDuration);
      stats.formattedAverageCalories = formatCalories(stats.averageCalories);
    });

    return sportStats;
  }

  /**
   * Calculate time-based statistics
   * @param {Array} activities - Array of activities
   * @returns {Object} Time-based statistics
   */
  calculateTimeStats(activities) {
    const timeStats = {
      byHour: {},
      byDayOfWeek: {},
      byWeek: {},
      byMonth: {}
    };

    const hourNames = Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Initialize structures
    hourNames.forEach(hour => {
      timeStats.byHour[hour] = { count: 0, distance: 0, duration: 0, calories: 0 };
    });

    dayNames.forEach(day => {
      timeStats.byDayOfWeek[day] = { count: 0, distance: 0, duration: 0, calories: 0 };
    });

    activities.forEach(activity => {
      const date = new Date(activity.startTime);
      const hour = date.getHours();
      const dayOfWeek = date.getDay();
      const weekStart = this.getWeekStart(date);
      const month = date.getMonth();

      // By hour
      const hourKey = `${hour.toString().padStart(2, '0')}:00`;
      const hourStats = timeStats.byHour[hourKey];
      hourStats.count++;
      hourStats.distance += activity.distance;
      hourStats.duration += activity.duration;
      hourStats.calories += activity.calories;

      // By day of week
      const dayKey = dayNames[dayOfWeek];
      const dayStats = timeStats.byDayOfWeek[dayKey];
      dayStats.count++;
      dayStats.distance += activity.distance;
      dayStats.duration += activity.duration;
      dayStats.calories += activity.calories;

      // By week
      const weekKey = weekStart.toISOString().split('T')[0];
      if (!timeStats.byWeek[weekKey]) {
        timeStats.byWeek[weekKey] = { count: 0, distance: 0, duration: 0, calories: 0 };
      }
      const weekStats = timeStats.byWeek[weekKey];
      weekStats.count++;
      weekStats.distance += activity.distance;
      weekStats.duration += activity.duration;
      weekStats.calories += activity.calories;

      // By month
      const monthKey = `${date.getFullYear()}-${(month + 1).toString().padStart(2, '0')}`;
      if (!timeStats.byMonth[monthKey]) {
        timeStats.byMonth[monthKey] = { count: 0, distance: 0, duration: 0, calories: 0 };
      }
      const monthStats = timeStats.byMonth[monthKey];
      monthStats.count++;
      monthStats.distance += activity.distance;
      monthStats.duration += activity.duration;
      monthStats.calories += activity.calories;
    });

    return timeStats;
  }

  /**
   * Calculate trends and patterns
   * @param {Array} activities - Array of activities
   * @param {Date} periodStart - Start of the period
   * @param {Date} periodEnd - End of the period
   * @returns {Object} Trend analysis
   */
  calculateTrends(activities, periodStart, periodEnd) {
    const trends = {
      activityFrequency: this.calculateActivityFrequency(activities, periodStart, periodEnd),
      performanceProgress: this.calculatePerformanceProgress(activities),
      seasonalPatterns: this.calculateSeasonalPatterns(activities),
      consistencyScore: this.calculateConsistencyScore(activities, periodStart, periodEnd)
    };

    return trends;
  }

  /**
   * Calculate activity frequency trend
   * @param {Array} activities - Array of activities
   * @param {Date} periodStart - Start of the period
   * @param {Date} periodEnd - End of the period
   * @returns {Object} Activity frequency data
   */
  calculateActivityFrequency(activities, periodStart, periodEnd) {
    const totalDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24));
    const activeDays = new Set();
    
    activities.forEach(activity => {
      activeDays.add(activity.date);
    });

    const frequency = (activeDays.size / totalDays) * 100;
    
    return {
      activeDays: activeDays.size,
      totalDays,
      frequency: Math.round(frequency * 100) / 100,
      formattedFrequency: `${Math.round(frequency)}%`
    };
  }

  /**
   * Calculate performance progress
   * @param {Array} activities - Array of activities
   * @returns {Object} Performance progress data
   */
  calculatePerformanceProgress(activities) {
    // Sort activities by date
    const sortedActivities = activities.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    
    if (sortedActivities.length < 2) {
      return { hasData: false };
    }

    const firstHalf = sortedActivities.slice(0, Math.floor(sortedActivities.length / 2));
    const secondHalf = sortedActivities.slice(Math.floor(sortedActivities.length / 2));

    const firstHalfStats = this.calculateOverallStats(firstHalf);
    const secondHalfStats = this.calculateOverallStats(secondHalf);

    const distanceChange = ((secondHalfStats.averageDistance - firstHalfStats.averageDistance) / firstHalfStats.averageDistance) * 100;
    const durationChange = ((secondHalfStats.averageDuration - firstHalfStats.averageDuration) / firstHalfStats.averageDuration) * 100;
    const caloriesChange = ((secondHalfStats.averageCalories - firstHalfStats.averageCalories) / firstHalfStats.averageCalories) * 100;

    return {
      hasData: true,
      firstPeriod: firstHalfStats,
      secondPeriod: secondHalfStats,
      changes: {
        distance: distanceChange,
        duration: durationChange,
        calories: caloriesChange
      }
    };
  }

  /**
   * Calculate seasonal patterns
   * @param {Array} activities - Array of activities
   * @returns {Object} Seasonal pattern data
   */
  calculateSeasonalPatterns(activities) {
    const seasons = {
      spring: { count: 0, distance: 0, duration: 0 }, // Mar, Apr, May
      summer: { count: 0, distance: 0, duration: 0 }, // Jun, Jul, Aug
      autumn: { count: 0, distance: 0, duration: 0 }, // Sep, Oct, Nov
      winter: { count: 0, distance: 0, duration: 0 }  // Dec, Jan, Feb
    };

    activities.forEach(activity => {
      const month = new Date(activity.startTime).getMonth();
      let season;

      if (month >= 2 && month <= 4) season = 'spring';
      else if (month >= 5 && month <= 7) season = 'summer';
      else if (month >= 8 && month <= 10) season = 'autumn';
      else season = 'winter';

      seasons[season].count++;
      seasons[season].distance += activity.distance;
      seasons[season].duration += activity.duration;
    });

    return seasons;
  }

  /**
   * Calculate consistency score
   * @param {Array} activities - Array of activities
   * @param {Date} periodStart - Start of the period
   * @param {Date} periodEnd - End of the period
   * @returns {Object} Consistency score data
   */
  calculateConsistencyScore(activities, periodStart, periodEnd) {
    const totalDays = Math.ceil((periodEnd - periodStart) / (1000 * 60 * 60 * 24));
    const activeDays = new Set();
    
    activities.forEach(activity => {
      activeDays.add(activity.date);
    });

    const consistency = (activeDays.size / totalDays) * 100;
    
    let level = 'Low';
    if (consistency >= 70) level = 'Excellent';
    else if (consistency >= 50) level = 'Good';
    else if (consistency >= 30) level = 'Fair';

    return {
      score: Math.round(consistency * 100) / 100,
      level,
      activeDays: activeDays.size,
      totalDays
    };
  }

  /**
   * Calculate achievements
   * @param {Array} activities - Array of activities
   * @returns {Object} Achievement data
   */
  calculateAchievements(activities) {
    const achievements = {
      streaks: this.calculateStreaks(activities),
      milestones: this.calculateMilestones(activities),
      records: this.calculateRecords(activities)
    };

    return achievements;
  }

  /**
   * Calculate activity streaks
   * @param {Array} activities - Array of activities
   * @returns {Object} Streak data
   */
  calculateStreaks(activities) {
    const activeDays = Array.from(new Set(activities.map(a => a.date))).sort();
    
    if (activeDays.length === 0) {
      return { current: 0, longest: 0, lastActiveDate: null };
    }

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    for (let i = 1; i < activeDays.length; i++) {
      const prevDate = new Date(activeDays[i - 1]);
      const currDate = new Date(activeDays[i]);
      const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);

      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate current streak
    const lastActiveDate = activeDays[activeDays.length - 1];
    if (lastActiveDate === today || lastActiveDate === yesterday) {
      let i = activeDays.length - 1;
      currentStreak = 1;
      
      while (i > 0) {
        const prevDate = new Date(activeDays[i - 1]);
        const currDate = new Date(activeDays[i]);
        const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);
        
        if (dayDiff === 1) {
          currentStreak++;
          i--;
        } else {
          break;
        }
      }
    }

    return {
      current: currentStreak,
      longest: longestStreak,
      lastActiveDate
    };
  }

  /**
   * Calculate milestones
   * @param {Array} activities - Array of activities
   * @returns {Object} Milestone data
   */
  calculateMilestones(activities) {
    const overallStats = this.calculateOverallStats(activities);
    const milestones = [];

    // Distance milestones (in km)
    const distanceKm = overallStats.totalDistance / 1000;
    const distanceMilestones = [100, 500, 1000, 2000, 5000, 10000];
    distanceMilestones.forEach(milestone => {
      if (distanceKm >= milestone) {
        milestones.push({
          type: 'distance',
          value: milestone,
          unit: 'km',
          achieved: true,
          description: `Completed ${milestone} km total distance`
        });
      }
    });

    // Duration milestones (in hours)
    const durationHours = overallStats.totalDuration / 3600;
    const durationMilestones = [10, 50, 100, 200, 500, 1000];
    durationMilestones.forEach(milestone => {
      if (durationHours >= milestone) {
        milestones.push({
          type: 'duration',
          value: milestone,
          unit: 'hours',
          achieved: true,
          description: `Completed ${milestone} hours of training`
        });
      }
    });

    // Activity count milestones
    const activityMilestones = [10, 50, 100, 200, 500, 1000];
    activityMilestones.forEach(milestone => {
      if (overallStats.totalActivities >= milestone) {
        milestones.push({
          type: 'activities',
          value: milestone,
          unit: 'activities',
          achieved: true,
          description: `Completed ${milestone} activities`
        });
      }
    });

    return milestones;
  }

  /**
   * Calculate records
   * @param {Array} activities - Array of activities
   * @returns {Object} Record data
   */
  calculateRecords(activities) {
    const records = {
      longestDistance: null,
      longestDuration: null,
      highestCalories: null,
      mostActivitiesInDay: null
    };

    let maxDistance = 0;
    let maxDuration = 0;
    let maxCalories = 0;

    activities.forEach(activity => {
      if (activity.distance > maxDistance) {
        maxDistance = activity.distance;
        records.longestDistance = activity;
      }
      
      if (activity.duration > maxDuration) {
        maxDuration = activity.duration;
        records.longestDuration = activity;
      }
      
      if (activity.calories > maxCalories) {
        maxCalories = activity.calories;
        records.highestCalories = activity;
      }
    });

    // Find most activities in a single day
    const activitiesByDate = this.activityDataProcessor.groupActivitiesByDate(activities);
    let maxActivitiesInDay = 0;
    let maxActivityDate = null;

    Object.entries(activitiesByDate).forEach(([date, dayActivities]) => {
      if (dayActivities.length > maxActivitiesInDay) {
        maxActivitiesInDay = dayActivities.length;
        maxActivityDate = date;
      }
    });

    records.mostActivitiesInDay = {
      date: maxActivityDate,
      count: maxActivitiesInDay,
      activities: activitiesByDate[maxActivityDate] || []
    };

    return records;
  }

  /**
   * Generate insights from statistics
   * @param {Array} activities - Array of activities
   * @param {Date} periodStart - Start of the period
   * @param {Date} periodEnd - End of the period
   * @returns {Array} Array of insights
   */
  generateInsights(activities, periodStart, periodEnd) {
    const insights = [];
    const overallStats = this.calculateOverallStats(activities);
    const sportStats = this.calculateSportStats(activities);
    const timeStats = this.calculateTimeStats(activities);
    const trends = this.calculateTrends(activities, periodStart, periodEnd);

    // Activity frequency insight
    if (trends.activityFrequency.frequency >= 50) {
      insights.push({
        type: 'positive',
        icon: '🔥',
        title: 'Great Consistency!',
        message: `You were active ${trends.activityFrequency.frequency}% of days this period.`
      });
    }

    // Most popular sport insight
    const mostPopular = getMostPopularSportType(activities);
    if (mostPopular) {
      insights.push({
        type: 'info',
        icon: mostPopular.config.icon,
        title: 'Favorite Activity',
        message: `${mostPopular.config.name} was your most frequent activity with ${mostPopular.count} sessions.`
      });
    }

    // Distance achievement insight
    if (overallStats.totalDistance >= 100000) { // 100km
      insights.push({
        type: 'achievement',
        icon: '🎯',
        title: 'Distance Champion!',
        message: `Amazing! You covered ${overallStats.formattedTotalDistance} this period.`
      });
    }

    // Variety insight
    if (overallStats.uniqueSports >= 3) {
      insights.push({
        type: 'positive',
        icon: '🌟',
        title: 'Great Variety!',
        message: `You engaged in ${overallStats.uniqueSports} different types of activities.`
      });
    }

    // Time-based insights
    const bestDay = this.findBestDay(timeStats.byDayOfWeek);
    if (bestDay) {
      insights.push({
        type: 'info',
        icon: '📅',
        title: 'Most Active Day',
        message: `${bestDay.day} is your most active day with ${bestDay.count} activities.`
      });
    }

    return insights;
  }

  /**
   * Find the best day of the week
   * @param {Object} dayStats - Day of week statistics
   * @returns {Object|null} Best day data
   */
  findBestDay(dayStats) {
    let bestDay = null;
    let maxCount = 0;

    Object.entries(dayStats).forEach(([day, stats]) => {
      if (stats.count > maxCount) {
        maxCount = stats.count;
        bestDay = { day, count: stats.count };
      }
    });

    return bestDay;
  }

  /**
   * Calculate period duration
   * @param {Date} start - Start date
   * @param {Date} end - End date
   * @returns {Object} Period duration data
   */
  calculatePeriodDuration(start, end) {
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.ceil(diffDays / 7);
    const diffMonths = Math.ceil(diffDays / 30);

    return {
      days: diffDays,
      weeks: diffWeeks,
      months: diffMonths
    };
  }

  /**
   * Get week start date
   * @param {Date} date - Date
   * @returns {Date} Week start date
   */
  getWeekStart(date) {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    start.setDate(diff);
    return start;
  }
}