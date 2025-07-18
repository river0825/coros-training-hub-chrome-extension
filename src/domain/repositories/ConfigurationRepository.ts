import { SportType } from '../value-objects/SportType';

// Cache settings configuration
export interface CacheSettings {
  maxAge: number;
  maxEntries: number;
  prefix: string;
}

// User preferences
export interface UserPreferences {
  defaultView: 'calendar' | 'statistics';
  theme: 'light' | 'dark';
  dateFormat: 'US' | 'EU';
  distanceUnit: 'km' | 'miles';
}

// Configuration repository interface
export interface ConfigurationRepository {
  getSportTypeMapping(): Promise<Map<number, SportType>>;
  getCacheSettings(): Promise<CacheSettings>;
  getUserPreferences(): Promise<UserPreferences>;
  setUserPreferences(preferences: UserPreferences): Promise<void>;
}