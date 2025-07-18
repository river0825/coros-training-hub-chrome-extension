import { Activity } from '../entities/Activity';
import { ActivityId } from '../value-objects/ActivityId';

// Activity repository interface
export interface ActivityRepository {
  findByMonth(year: number, month: number): Promise<Activity[]>;
  save(activities: Activity[]): Promise<void>;
  findById(id: ActivityId): Promise<Activity | null>;
  clear(): Promise<void>;
  findByDateRange(startDate: Date, endDate: Date): Promise<Activity[]>;
}