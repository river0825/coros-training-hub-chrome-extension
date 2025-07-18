import { Activity } from './Activity';
import { SportType } from '../value-objects/SportType';
import { Duration } from '../value-objects/Duration';
import { Distance } from '../value-objects/Distance';
import { Calories } from '../value-objects/Calories';

// Monthly statistics aggregation
export class MonthlyStats {
  constructor(
    private readonly totalActivities: number,
    private readonly totalDistance: Distance,
    private readonly totalDuration: Duration,
    private readonly totalCalories: Calories,
    private readonly activeDays: number
  ) {}

  getTotalActivities(): number {
    return this.totalActivities;
  }

  getTotalDistance(): Distance {
    return this.totalDistance;
  }

  getTotalDuration(): Duration {
    return this.totalDuration;
  }

  getTotalCalories(): Calories {
    return this.totalCalories;
  }

  getActiveDays(): number {
    return this.activeDays;
  }

  getAverageDistance(): Distance {
    return this.totalActivities > 0
      ? Distance.fromMeters(this.totalDistance.getMeters() / this.totalActivities)
      : Distance.fromMeters(0);
  }

  getAverageDuration(): Duration {
    return this.totalActivities > 0
      ? Duration.fromSeconds(this.totalDuration.getSeconds() / this.totalActivities)
      : Duration.fromSeconds(0);
  }
}

// Sport-specific statistics
export class SportStats {
  constructor(
    private readonly sportType: SportType,
    private readonly activityCount: number,
    private readonly totalDistance: Distance,
    private readonly totalDuration: Duration,
    private readonly totalCalories: Calories
  ) {}

  getSportType(): SportType {
    return this.sportType;
  }

  getActivityCount(): number {
    return this.activityCount;
  }

  getTotalDistance(): Distance {
    return this.totalDistance;
  }

  getTotalDuration(): Duration {
    return this.totalDuration;
  }

  getTotalCalories(): Calories {
    return this.totalCalories;
  }

  getAverageDistance(): Distance {
    return this.activityCount > 0
      ? Distance.fromMeters(this.totalDistance.getMeters() / this.activityCount)
      : Distance.fromMeters(0);
  }

  getAverageDuration(): Duration {
    return this.activityCount > 0
      ? Duration.fromSeconds(this.totalDuration.getSeconds() / this.activityCount)
      : Duration.fromSeconds(0);
  }
}

// Statistics insights
export class Insight {
  constructor(
    private readonly message: string,
    private readonly type: 'positive' | 'neutral' | 'negative'
  ) {}

  getMessage(): string {
    return this.message;
  }

  getType(): 'positive' | 'neutral' | 'negative' {
    return this.type;
  }
}

// Statistics entity
export class Statistics {
  constructor(
    private readonly activities: Activity[],
    private readonly monthlyStats: MonthlyStats,
    private readonly sportStats: SportStats[],
    private readonly insights: Insight[]
  ) {}

  getActivities(): Activity[] {
    return [...this.activities];
  }

  getMonthlyStats(): MonthlyStats {
    return this.monthlyStats;
  }

  getSportStats(): SportStats[] {
    return [...this.sportStats];
  }

  getInsights(): Insight[] {
    return [...this.insights];
  }

  getSportStatsForType(sportType: SportType): SportStats | undefined {
    return this.sportStats.find(stats => stats.getSportType().getCode() === sportType.getCode());
  }

  getMostActiveDay(): Date | null {
    if (this.activities.length === 0) return null;

    const dayActivityCount = new Map<string, number>();
    this.activities.forEach(activity => {
      const dateKey = activity.getStartTime().toDate().toDateString();
      dayActivityCount.set(dateKey, (dayActivityCount.get(dateKey) || 0) + 1);
    });

    let maxCount = 0;
    let mostActiveDate: string | null = null;

    dayActivityCount.forEach((count, date) => {
      if (count > maxCount) {
        maxCount = count;
        mostActiveDate = date;
      }
    });

    return mostActiveDate ? new Date(mostActiveDate) : null;
  }

  getMostPopularSport(): SportType | null {
    if (this.sportStats.length === 0) return null;

    return this.sportStats.reduce((mostPopular, current) =>
      current.getActivityCount() > mostPopular.getActivityCount() ? current : mostPopular
    ).getSportType();
  }
}