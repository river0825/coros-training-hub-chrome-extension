import { Activity } from '../entities/Activity';
import { SportType } from '../value-objects/SportType';
import { Duration } from '../value-objects/Duration';
import { Distance } from '../value-objects/Distance';
import { Calories } from '../value-objects/Calories';

// Monthly totals aggregation
export interface MonthlyTotals {
  totalActivities: number;
  totalDistance: Distance;
  totalDuration: Duration;
  totalCalories: Calories;
  activeDays: number;
}

// Activity aggregation service interface
export interface ActivityAggregationService {
  groupByDate(activities: Activity[]): Map<string, Activity[]>;
  groupBySport(activities: Activity[]): Map<SportType, Activity[]>;
  calculateMonthlyTotals(activities: Activity[]): MonthlyTotals;
  getActiveDays(activities: Activity[]): number;
}

// Activity aggregation service implementation
export class ActivityAggregationServiceImpl implements ActivityAggregationService {
  groupByDate(activities: Activity[]): Map<string, Activity[]> {
    const groupedActivities = new Map<string, Activity[]>();

    activities.forEach(activity => {
      const dateKey = activity.getStartTime().toDate().toDateString();
      if (!groupedActivities.has(dateKey)) {
        groupedActivities.set(dateKey, []);
      }
      groupedActivities.get(dateKey)!.push(activity);
    });

    return groupedActivities;
  }

  groupBySport(activities: Activity[]): Map<SportType, Activity[]> {
    const groupedActivities = new Map<SportType, Activity[]>();

    activities.forEach(activity => {
      const sportType = activity.getSportType();
      const sportKey = sportType.getCode();
      
      // Find existing sport type or create new entry
      let existingSportType: SportType | undefined;
      for (const [key] of groupedActivities.entries()) {
        if (key.getCode() === sportKey) {
          existingSportType = key;
          break;
        }
      }

      if (!existingSportType) {
        groupedActivities.set(sportType, []);
        existingSportType = sportType;
      }

      groupedActivities.get(existingSportType)!.push(activity);
    });

    return groupedActivities;
  }

  calculateMonthlyTotals(activities: Activity[]): MonthlyTotals {
    const totalActivities = activities.length;
    
    let totalDistance = 0;
    let totalDuration = 0;
    let totalCalories = 0;

    activities.forEach(activity => {
      totalDistance += activity.getDistance().getMeters();
      totalDuration += activity.getDuration().getSeconds();
      totalCalories += activity.getCalories().getValue();
    });

    const uniqueDays = new Set<string>();
    activities.forEach(activity => {
      uniqueDays.add(activity.getStartTime().toDate().toDateString());
    });

    return {
      totalActivities,
      totalDistance: Distance.fromMeters(totalDistance),
      totalDuration: Duration.fromSeconds(totalDuration),
      totalCalories: Calories.fromValue(totalCalories),
      activeDays: uniqueDays.size,
    };
  }

  getActiveDays(activities: Activity[]): number {
    const uniqueDays = new Set<string>();
    activities.forEach(activity => {
      uniqueDays.add(activity.getStartTime().toDate().toDateString());
    });
    return uniqueDays.size;
  }
}