import { Activity } from '@domain/entities/Activity';
import { ActivityId } from '@domain/value-objects/ActivityId';
import { ActivityRepository } from '@domain/repositories/ActivityRepository';
import { CacheRepository } from '@domain/repositories/CacheRepository';
import { CorosApiService } from '@application/use-cases/LoadMonthlyActivitiesUseCase';

// Activity Repository Implementation
export class ActivityRepositoryImpl implements ActivityRepository {
  constructor(
    private readonly cacheRepository: CacheRepository,
    private readonly corosApiService: CorosApiService
  ) {}

  async findByMonth(year: number, month: number): Promise<Activity[]> {
    const cacheKey = `activities-${year}-${month}`;
    
    // Check if current month (always fetch fresh)
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
    
    if (!isCurrentMonth) {
      const cachedActivities = await this.cacheRepository.get<Activity[]>(cacheKey);
      if (cachedActivities) {
        return cachedActivities;
      }
    }
    
    // Fetch from API
    const activities = await this.corosApiService.fetchActivities(year, month);
    
    // Cache if not current month
    if (!isCurrentMonth) {
      await this.cacheRepository.set(cacheKey, activities, 30 * 24 * 60 * 60 * 1000); // 30 days
    }
    
    return activities;
  }

  async save(activities: Activity[]): Promise<void> {
    // Group activities by month for caching
    const monthGroups = new Map<string, Activity[]>();
    
    activities.forEach(activity => {
      const date = activity.getStartTime().toDate();
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      
      if (!monthGroups.has(key)) {
        monthGroups.set(key, []);
      }
      monthGroups.get(key)!.push(activity);
    });
    
    // Save each month group
    for (const [monthKey, monthActivities] of monthGroups) {
      const [year, month] = monthKey.split('-').map(Number);
      const cacheKey = `activities-${year}-${month}`;
      
      // Only cache if not current month
      const now = new Date();
      if (!(now.getFullYear() === year && now.getMonth() === month)) {
        await this.cacheRepository.set(cacheKey, monthActivities, 30 * 24 * 60 * 60 * 1000);
      }
    }
  }

  async findById(_id: ActivityId): Promise<Activity | null> {
    // This would require searching through cached activities
    // For now, we'll return null and could implement a more sophisticated search
    return null;
  }

  async clear(): Promise<void> {
    await this.cacheRepository.clear();
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Activity[]> {
    const activities: Activity[] = [];
    
    // Iterate through months in the date range
    const current = new Date(startDate);
    while (current <= endDate) {
      const monthActivities = await this.findByMonth(current.getFullYear(), current.getMonth());
      
      // Filter activities within the date range
      const filteredActivities = monthActivities.filter(activity => {
        const activityDate = activity.getStartTime().toDate();
        return activityDate >= startDate && activityDate <= endDate;
      });
      
      activities.push(...filteredActivities);
      
      // Move to next month
      current.setMonth(current.getMonth() + 1);
    }
    
    return activities;
  }
}