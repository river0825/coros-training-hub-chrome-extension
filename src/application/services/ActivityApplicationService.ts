import { Activity } from '@domain/entities/Activity';
import { LoadMonthlyActivitiesUseCase } from '../use-cases/LoadMonthlyActivitiesUseCase';

// Refresh Activities Use Case
export class RefreshActivitiesUseCase {
  constructor(
    private readonly loadMonthlyActivitiesUseCase: LoadMonthlyActivitiesUseCase
  ) {}

  async execute(): Promise<Activity[]> {
    const now = new Date();
    const response = await this.loadMonthlyActivitiesUseCase.execute({
      year: now.getFullYear(),
      month: now.getMonth()
    });
    
    // Convert DTOs back to domain objects (simplified for now)
    return response.activities.map(dto => this.dtoToActivity(dto));
  }

  private dtoToActivity(dto: any): Activity {
    // This would be implemented with proper mapping
    // For now, returning a simplified version
    return dto as Activity;
  }
}

// Activity Application Service
export class ActivityApplicationService {
  constructor(
    private readonly loadActivitiesUseCase: LoadMonthlyActivitiesUseCase,
    private readonly refreshActivitiesUseCase: RefreshActivitiesUseCase
  ) {}

  async loadActivitiesForMonth(year: number, month: number): Promise<Activity[]> {
    const response = await this.loadActivitiesUseCase.execute({ year, month });
    return response.activities.map(dto => this.dtoToActivity(dto));
  }

  async refreshCurrentMonth(): Promise<Activity[]> {
    return await this.refreshActivitiesUseCase.execute();
  }

  private dtoToActivity(dto: any): Activity {
    // This would be implemented with proper mapping
    // For now, returning a simplified version
    return dto as Activity;
  }
}