import { ConfigurationRepository, CacheSettings, UserPreferences } from '@domain/repositories/ConfigurationRepository';
import { SportType } from '@domain/value-objects/SportType';
import { CacheRepository } from '@domain/repositories/CacheRepository';

// Configuration Repository Implementation
export class ConfigurationRepositoryImpl implements ConfigurationRepository {
  constructor(
    private readonly cacheRepository: CacheRepository
  ) {}

  async getSportTypeMapping(): Promise<Map<number, SportType>> {
    // Return all sport types from the SportType class
    const sportTypes = SportType.getAllSportTypes();
    const mapping = new Map<number, SportType>();
    
    sportTypes.forEach(sportType => {
      mapping.set(sportType.getCode(), sportType);
    });
    
    return mapping;
  }

  async getCacheSettings(): Promise<CacheSettings> {
    const cached = await this.cacheRepository.get<CacheSettings>('cache-settings');
    if (cached) {
      return cached;
    }
    
    // Default cache settings
    const defaultSettings: CacheSettings = {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      maxEntries: 50,
      prefix: 'coros_activities_'
    };
    
    await this.cacheRepository.set('cache-settings', defaultSettings);
    return defaultSettings;
  }

  async getUserPreferences(): Promise<UserPreferences> {
    const cached = await this.cacheRepository.get<UserPreferences>('user-preferences');
    if (cached) {
      return cached;
    }
    
    // Default user preferences
    const defaultPreferences: UserPreferences = {
      defaultView: 'calendar',
      theme: 'light',
      dateFormat: 'US',
      distanceUnit: 'km'
    };
    
    await this.cacheRepository.set('user-preferences', defaultPreferences);
    return defaultPreferences;
  }

  async setUserPreferences(preferences: UserPreferences): Promise<void> {
    await this.cacheRepository.set('user-preferences', preferences);
  }
}