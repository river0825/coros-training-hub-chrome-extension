import { Activity } from '@domain/entities/Activity';
import { ActivityRepository } from '@domain/repositories/ActivityRepository';
import { CacheRepository } from '@domain/repositories/CacheRepository';
import { LoadMonthlyActivitiesRequest, LoadMonthlyActivitiesResponse } from '@shared/types/DTOs';

// COROS API service interface
export interface CorosApiService {
  fetchActivities(year: number, month: number): Promise<Activity[]>;
  isAuthenticated(): Promise<boolean>;
}

// Load Monthly Activities Use Case
export class LoadMonthlyActivitiesUseCase {
  constructor(
    private readonly activityRepository: ActivityRepository,
    private readonly corosApiService: CorosApiService,
    private readonly cacheRepository: CacheRepository
  ) {}

  async execute(request: LoadMonthlyActivitiesRequest): Promise<LoadMonthlyActivitiesResponse> {
    const { year, month } = request;
    const cacheKey = `activities-${year}-${month}`;
    
    // Check if we're dealing with current month (always fetch fresh data)
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
    
    if (!isCurrentMonth) {
      // Check cache for past months
      const cachedActivities = await this.cacheRepository.get<Activity[]>(cacheKey);
      if (cachedActivities) {
        return {
          activities: cachedActivities.map(activity => this.activityToDto(activity)),
          cached: true,
          timestamp: Date.now()
        };
      }
    }
    
    // Fetch from API
    const activities = await this.corosApiService.fetchActivities(year, month);
    
    // Save to repository
    await this.activityRepository.save(activities);
    
    // Cache if not current month
    if (!isCurrentMonth) {
      await this.cacheRepository.set(cacheKey, activities, 30 * 24 * 60 * 60 * 1000); // 30 days
    }
    
    return {
      activities: activities.map(activity => this.activityToDto(activity)),
      cached: false,
      timestamp: Date.now()
    };
  }

  private activityToDto(activity: Activity): any {
    return {
      labelId: activity.getId().toString(),
      name: activity.getName(),
      sportType: activity.getSportType().getCode(),
      date: this.formatDate(activity.getStartTime().toDate()),
      startTime: Math.floor(activity.getStartTime().toDate().getTime() / 1000),
      distance: activity.getDistance().getMeters(),
      workoutTime: activity.getDuration().getSeconds(),
      calorie: activity.getCalories().getValue(),
      device: activity.getDevice(),
      avgHr: activity.getAverageHeartRate(),
      avgSpeed: activity.getAverageSpeed()
    };
  }

  private formatDate(date: Date): number {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return parseInt(`${year}${month}${day}`);
  }
}