import { Activity } from '../entities/Activity';
import { SportStats, Insight } from '../entities/Statistics';
import { Duration } from '../value-objects/Duration';
import { Distance } from '../value-objects/Distance';
import { Calories } from '../value-objects/Calories';
import { ActivityAggregationService } from './ActivityAggregationService';

// Time period for statistics
export interface TimePeriod {
  start: Date;
  end: Date;
  type: 'week' | 'month' | 'year';
}

// Activity averages
export interface ActivityAverages {
  averageDistance: Distance;
  averageDuration: Duration;
  averageCalories: Calories;
  averageActivitiesPerDay: number;
}

// Trend data
export interface Trend {
  metric: string;
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  description: string;
}

// Statistics calculation service interface
export interface StatisticsCalculationService {
  calculateInsights(activities: Activity[], period: TimePeriod): Insight[];
  calculateTrends(activities: Activity[]): Trend[];
  calculateAverages(activities: Activity[]): ActivityAverages;
  calculateSportStats(activities: Activity[]): SportStats[];
}

// Statistics calculation service implementation
export class StatisticsCalculationServiceImpl implements StatisticsCalculationService {
  constructor(private readonly aggregationService: ActivityAggregationService) {}

  calculateInsights(activities: Activity[], _period: TimePeriod): Insight[] {
    const insights: Insight[] = [];

    if (activities.length === 0) {
      insights.push(new Insight('No activities found for this period', 'neutral'));
      return insights;
    }

    const totals = this.aggregationService.calculateMonthlyTotals(activities);

    // Activity frequency insight
    if (totals.activeDays >= 20) {
      insights.push(new Insight(`Great consistency! You were active ${totals.activeDays} days`, 'positive'));
    } else if (totals.activeDays >= 10) {
      insights.push(new Insight(`Good activity level with ${totals.activeDays} active days`, 'positive'));
    } else {
      insights.push(new Insight(`Try to be more active! Only ${totals.activeDays} active days`, 'negative'));
    }

    // Distance insight
    const totalKm = totals.totalDistance.toKilometers();
    if (totalKm >= 100) {
      insights.push(new Insight(`Amazing! You covered ${totalKm.toFixed(1)} km`, 'positive'));
    } else if (totalKm >= 50) {
      insights.push(new Insight(`Good distance coverage: ${totalKm.toFixed(1)} km`, 'positive'));
    }

    // Sport variety insight
    const sportGroups = this.aggregationService.groupBySport(activities);
    if (sportGroups.size >= 3) {
      insights.push(new Insight(`Great variety! You practiced ${sportGroups.size} different sports`, 'positive'));
    } else if (sportGroups.size === 2) {
      insights.push(new Insight(`Good variety with ${sportGroups.size} sports`, 'positive'));
    } else {
      insights.push(new Insight('Try adding more sport variety to your routine', 'neutral'));
    }

    return insights;
  }

  calculateTrends(_activities: Activity[]): Trend[] {
    // For now, return empty trends as we'd need historical data
    // This would be implemented with access to previous periods
    return [];
  }

  calculateAverages(activities: Activity[]): ActivityAverages {
    if (activities.length === 0) {
      return {
        averageDistance: Distance.fromMeters(0),
        averageDuration: Duration.fromSeconds(0),
        averageCalories: Calories.fromValue(0),
        averageActivitiesPerDay: 0,
      };
    }

    const totals = this.aggregationService.calculateMonthlyTotals(activities);

    return {
      averageDistance: Distance.fromMeters(totals.totalDistance.getMeters() / activities.length),
      averageDuration: Duration.fromSeconds(totals.totalDuration.getSeconds() / activities.length),
      averageCalories: Calories.fromValue(totals.totalCalories.getValue() / activities.length),
      averageActivitiesPerDay: activities.length / Math.max(totals.activeDays, 1),
    };
  }

  calculateSportStats(activities: Activity[]): SportStats[] {
    const sportGroups = this.aggregationService.groupBySport(activities);
    const sportStats: SportStats[] = [];

    sportGroups.forEach((sportActivities, sportType) => {
      const totalDistance = sportActivities.reduce(
        (sum, activity) => sum + activity.getDistance().getMeters(),
        0
      );
      const totalDuration = sportActivities.reduce(
        (sum, activity) => sum + activity.getDuration().getSeconds(),
        0
      );
      const totalCalories = sportActivities.reduce(
        (sum, activity) => sum + activity.getCalories().getValue(),
        0
      );

      sportStats.push(
        new SportStats(
          sportType,
          sportActivities.length,
          Distance.fromMeters(totalDistance),
          Duration.fromSeconds(totalDuration),
          Calories.fromValue(totalCalories)
        )
      );
    });

    // Sort by activity count (most active sports first)
    return sportStats.sort((a, b) => b.getActivityCount() - a.getActivityCount());
  }
}