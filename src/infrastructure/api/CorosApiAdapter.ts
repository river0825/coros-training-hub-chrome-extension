import { Activity } from '@domain/entities/Activity';
import { ActivityId } from '@domain/value-objects/ActivityId';
import { DateTime } from '@domain/value-objects/DateTime';
import { Duration } from '@domain/value-objects/Duration';
import { Distance } from '@domain/value-objects/Distance';
import { Calories } from '@domain/value-objects/Calories';
import { SportType } from '@domain/value-objects/SportType';
import { CorosApiService } from '@application/use-cases/LoadMonthlyActivitiesUseCase';
import { CorosActivityDto } from '@shared/types/DTOs';
import { AuthenticationException, ApiException } from '@shared/exceptions/DomainExceptions';

// HTTP Client interface
export interface HttpClient {
  get<T>(url: string, options?: RequestInit): Promise<T>;
  post<T>(url: string, data?: any, options?: RequestInit): Promise<T>;
}

// Authentication service interface
export interface AuthenticationService {
  getToken(): Promise<string>;
  isAuthenticated(): Promise<boolean>;
}

// COROS API Adapter
export class CorosApiAdapter implements CorosApiService {
  private readonly baseUrl = 'https://teamapi.coros.com';
  
  constructor(
    private readonly httpClient: HttpClient,
    private readonly authenticationService: AuthenticationService
  ) {}

  async fetchActivities(year: number, month: number): Promise<Activity[]> {
    if (!await this.authenticationService.isAuthenticated()) {
      throw new AuthenticationException('Not authenticated with COROS. Please log in first.');
    }

    try {
      const token = await this.authenticationService.getToken();
      const startDay = this.formatDate(year, month, 1);
      const endDay = this.formatDate(year, month, this.getDaysInMonth(year, month));

      const response = await this.httpClient.get<{ dataList: CorosActivityDto[] }>(
        `${this.baseUrl}/activity/query`,
        {
          headers: {
            'accesstoken': token,
            'Content-Type': 'application/json'
          },
          method: 'GET',
          body: JSON.stringify({
            startDay,
            endDay
          })
        }
      );

      return response.dataList.map(dto => this.mapDtoToActivity(dto));
    } catch (error) {
      if (error instanceof AuthenticationException) {
        throw error;
      }
      throw new ApiException(`Failed to fetch activities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    return await this.authenticationService.isAuthenticated();
  }

  private mapDtoToActivity(dto: CorosActivityDto): Activity {
    return new Activity(
      new ActivityId(dto.labelId),
      dto.name,
      SportType.fromCode(dto.sportType),
      DateTime.fromTimestamp(dto.startTime * 1000),
      Duration.fromSeconds(dto.workoutTime),
      Distance.fromMeters(dto.distance),
      Calories.fromValue(dto.calorie),
      dto.device,
      dto.avgHr,
      dto.avgSpeed
    );
  }

  private formatDate(year: number, month: number, day: number): string {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}${monthStr}${dayStr}`;
  }

  private getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }
}