import { CacheRepository } from '@domain/repositories/CacheRepository';
import { CacheException } from '@shared/exceptions/DomainExceptions';

// Chrome Storage Adapter
export class ChromeStorageAdapter implements CacheRepository {
  private readonly storagePrefix = 'coros_activities_';

  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.storagePrefix + key;
      
      return new Promise<T | null>((resolve, reject) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get([fullKey], (result) => {
            if (chrome.runtime.lastError) {
              reject(new CacheException(`Failed to get from cache: ${chrome.runtime.lastError.message}`));
              return;
            }
            
            const data = result[fullKey];
            if (!data) {
              resolve(null);
              return;
            }
            
            // Check if data has expired
            if (data.ttl && Date.now() > data.timestamp + data.ttl) {
              this.remove(key).then(() => resolve(null));
              return;
            }
            
            resolve(data.value);
          });
        } else {
          // Fallback to localStorage
          const item = localStorage.getItem(fullKey);
          if (!item) {
            resolve(null);
            return;
          }
          
          try {
            const data = JSON.parse(item);
            if (data.ttl && Date.now() > data.timestamp + data.ttl) {
              localStorage.removeItem(fullKey);
              resolve(null);
              return;
            }
            resolve(data.value);
          } catch (error) {
            reject(new CacheException(`Failed to parse cached data: ${error instanceof Error ? error.message : 'Unknown error'}`));
          }
        }
      });
    } catch (error) {
      throw new CacheException(`Failed to get from cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const fullKey = this.storagePrefix + key;
      const data = {
        value,
        timestamp: Date.now(),
        ttl
      };

      return new Promise<void>((resolve, reject) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ [fullKey]: data }, () => {
            if (chrome.runtime.lastError) {
              reject(new CacheException(`Failed to set cache: ${chrome.runtime.lastError.message}`));
              return;
            }
            resolve();
          });
        } else {
          // Fallback to localStorage
          try {
            localStorage.setItem(fullKey, JSON.stringify(data));
            resolve();
          } catch (error) {
            reject(new CacheException(`Failed to set cache: ${error instanceof Error ? error.message : 'Unknown error'}`));
          }
        }
      });
    } catch (error) {
      throw new CacheException(`Failed to set cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async remove(key: string): Promise<void> {
    try {
      const fullKey = this.storagePrefix + key;

      return new Promise<void>((resolve, reject) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.remove([fullKey], () => {
            if (chrome.runtime.lastError) {
              reject(new CacheException(`Failed to remove from cache: ${chrome.runtime.lastError.message}`));
              return;
            }
            resolve();
          });
        } else {
          // Fallback to localStorage
          localStorage.removeItem(fullKey);
          resolve();
        }
      });
    } catch (error) {
      throw new CacheException(`Failed to remove from cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clear(): Promise<void> {
    try {
      return new Promise<void>((resolve, reject) => {
        if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(null, (items) => {
            if (chrome.runtime.lastError) {
              reject(new CacheException(`Failed to clear cache: ${chrome.runtime.lastError.message}`));
              return;
            }
            
            const keysToRemove = Object.keys(items).filter(key => key.startsWith(this.storagePrefix));
            if (keysToRemove.length === 0) {
              resolve();
              return;
            }
            
            chrome.storage.local.remove(keysToRemove, () => {
              if (chrome.runtime.lastError) {
                reject(new CacheException(`Failed to clear cache: ${chrome.runtime.lastError.message}`));
                return;
              }
              resolve();
            });
          });
        } else {
          // Fallback to localStorage
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.storagePrefix)) {
              keysToRemove.push(key);
            }
          }
          
          keysToRemove.forEach(key => localStorage.removeItem(key));
          resolve();
        }
      });
    } catch (error) {
      throw new CacheException(`Failed to clear cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const value = await this.get(key);
      return value !== null;
    } catch (error) {
      throw new CacheException(`Failed to check cache: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}