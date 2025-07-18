import { DependencyContainer } from '@shared/container/DependencyContainer';

// Domain Services
import { ActivityAggregationServiceImpl } from '@domain/services/ActivityAggregationService';
import { StatisticsCalculationServiceImpl } from '@domain/services/StatisticsCalculationService';
import { CalendarRenderingServiceImpl } from '@domain/services/CalendarRenderingService';

// Application Services
import { LoadMonthlyActivitiesUseCase } from '@application/use-cases/LoadMonthlyActivitiesUseCase';
import { DisplayCalendarUseCase } from '@application/use-cases/DisplayCalendarUseCase';
import { CalculateStatisticsUseCase } from '@application/use-cases/CalculateStatisticsUseCase';
import { ActivityApplicationService, RefreshActivitiesUseCase } from '@application/services/ActivityApplicationService';
import { CalendarApplicationService, NavigateCalendarUseCase } from '@application/services/CalendarApplicationService';
import { StatisticsApplicationService } from '@application/services/StatisticsApplicationService';

// Infrastructure Services
import { CorosApiAdapter, HttpClient, AuthenticationService } from '@infrastructure/api/CorosApiAdapter';
import { ChromeStorageAdapter } from '@infrastructure/storage/ChromeStorageAdapter';
import { ActivityRepositoryImpl } from '@infrastructure/repositories/ActivityRepositoryImpl';
import { ConfigurationRepositoryImpl } from '@infrastructure/repositories/ConfigurationRepositoryImpl';

// Simple HTTP client implementation
class SimpleHttpClient implements HttpClient {
  async get<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, { ...options, method: 'GET' });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }

  async post<T>(url: string, data?: any, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: data ? JSON.stringify(data) : null
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  }
}

// Chrome-based authentication service
class ChromeAuthenticationService implements AuthenticationService {
  async getToken(): Promise<string> {
    // This would extract the token from Chrome cookies or storage
    // For now, we'll use a placeholder implementation
    return new Promise((resolve, reject) => {
      if (typeof chrome !== 'undefined' && chrome.cookies) {
        chrome.cookies.get({
          url: 'https://t.coros.com',
          name: 'accesstoken'
        }, (cookie) => {
          if (cookie) {
            resolve(cookie.value);
          } else {
            reject(new Error('No access token found'));
          }
        });
      } else {
        reject(new Error('Chrome APIs not available'));
      }
    });
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      await this.getToken();
      return true;
    } catch {
      return false;
    }
  }
}

// Container configuration function
export function configureContainer(): DependencyContainer {
  const container = new DependencyContainer();

  // Infrastructure layer
  container.bindSingleton('HttpClient', () => new SimpleHttpClient());
  container.bindSingleton('AuthenticationService', () => new ChromeAuthenticationService());
  container.bindSingleton('CacheRepository', () => new ChromeStorageAdapter());
  
  container.bindSingleton('CorosApiService', () => new CorosApiAdapter(
    container.resolve('HttpClient'),
    container.resolve('AuthenticationService')
  ));
  
  container.bindSingleton('ActivityRepository', () => new ActivityRepositoryImpl(
    container.resolve('CacheRepository'),
    container.resolve('CorosApiService')
  ));
  
  container.bindSingleton('ConfigurationRepository', () => new ConfigurationRepositoryImpl(
    container.resolve('CacheRepository')
  ));

  // Domain services
  container.bindSingleton('ActivityAggregationService', () => new ActivityAggregationServiceImpl());
  container.bindSingleton('StatisticsCalculationService', () => new StatisticsCalculationServiceImpl(
    container.resolve('ActivityAggregationService')
  ));
  container.bindSingleton('CalendarRenderingService', () => new CalendarRenderingServiceImpl());

  // Application use cases
  container.bind('LoadMonthlyActivitiesUseCase', () => new LoadMonthlyActivitiesUseCase(
    container.resolve('ActivityRepository'),
    container.resolve('CorosApiService'),
    container.resolve('CacheRepository')
  ));
  
  container.bind('DisplayCalendarUseCase', () => new DisplayCalendarUseCase(
    container.resolve('CalendarRenderingService'),
    container.resolve('ActivityRepository')
  ));
  
  container.bind('CalculateStatisticsUseCase', () => new CalculateStatisticsUseCase(
    container.resolve('StatisticsCalculationService'),
    container.resolve('ActivityAggregationService'),
    container.resolve('ActivityRepository')
  ));

  // Application services
  container.bind('RefreshActivitiesUseCase', () => new RefreshActivitiesUseCase(
    container.resolve('LoadMonthlyActivitiesUseCase')
  ));
  
  container.bind('ActivityApplicationService', () => new ActivityApplicationService(
    container.resolve('LoadMonthlyActivitiesUseCase'),
    container.resolve('RefreshActivitiesUseCase')
  ));
  
  container.bind('NavigateCalendarUseCase', () => new NavigateCalendarUseCase(
    container.resolve('DisplayCalendarUseCase')
  ));
  
  container.bind('CalendarApplicationService', () => new CalendarApplicationService(
    container.resolve('DisplayCalendarUseCase'),
    container.resolve('NavigateCalendarUseCase')
  ));
  
  container.bind('StatisticsApplicationService', () => new StatisticsApplicationService(
    container.resolve('CalculateStatisticsUseCase')
  ));

  return container;
}

// Global container instance
let globalContainer: DependencyContainer | null = null;

export function getContainer(): DependencyContainer {
  if (!globalContainer) {
    globalContainer = configureContainer();
  }
  return globalContainer;
}