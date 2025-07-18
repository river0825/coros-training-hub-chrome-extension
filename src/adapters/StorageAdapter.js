// Storage adapter for unified storage operations

import { STORAGE_CONFIG } from '../config/constants.js';

/**
 * Adapter for storage operations, supports both Chrome extension storage and localStorage
 */
export class StorageAdapter {
  constructor() {
    this.useChrome = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
    this.prefix = STORAGE_CONFIG.prefix;
  }

  /**
   * Store data with key
   * @param {string} key - Storage key
   * @param {*} value - Data to store
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value) {
    try {
      const storageKey = this.prefix + key;
      
      if (this.useChrome) {
        await this.chromeStorageSet(storageKey, value);
      } else {
        localStorage.setItem(storageKey, JSON.stringify(value));
      }
      
      return true;
    } catch (error) {
      console.error('[StorageAdapter] Error setting value:', error);
      return false;
    }
  }

  /**
   * Retrieve data by key
   * @param {string} key - Storage key
   * @returns {Promise<*>} Retrieved data or null
   */
  async get(key) {
    try {
      const storageKey = this.prefix + key;
      
      if (this.useChrome) {
        return await this.chromeStorageGet(storageKey);
      } else {
        const rawData = localStorage.getItem(storageKey);
        return rawData ? JSON.parse(rawData) : null;
      }
    } catch (error) {
      console.error('[StorageAdapter] Error getting value:', error);
      return null;
    }
  }

  /**
   * Remove data by key
   * @param {string} key - Storage key
   * @returns {Promise<boolean>} Success status
   */
  async remove(key) {
    try {
      const storageKey = this.prefix + key;
      
      if (this.useChrome) {
        await this.chromeStorageRemove(storageKey);
      } else {
        localStorage.removeItem(storageKey);
      }
      
      return true;
    } catch (error) {
      console.error('[StorageAdapter] Error removing value:', error);
      return false;
    }
  }

  /**
   * Get all keys from storage
   * @returns {Promise<string[]>} Array of all keys
   */
  async getAllKeys() {
    try {
      if (this.useChrome) {
        const allData = await this.chromeStorageGetAll();
        return Object.keys(allData);
      } else {
        return Object.keys(localStorage);
      }
    } catch (error) {
      console.error('[StorageAdapter] Error getting all keys:', error);
      return [];
    }
  }

  /**
   * Get all data from storage
   * @returns {Promise<Object>} All stored data
   */
  async getAll() {
    try {
      if (this.useChrome) {
        return await this.chromeStorageGetAll();
      } else {
        const allData = {};
        Object.keys(localStorage).forEach(key => {
          try {
            allData[key] = JSON.parse(localStorage.getItem(key));
          } catch (error) {
            allData[key] = localStorage.getItem(key);
          }
        });
        return allData;
      }
    } catch (error) {
      console.error('[StorageAdapter] Error getting all data:', error);
      return {};
    }
  }

  /**
   * Clear all data from storage
   * @returns {Promise<boolean>} Success status
   */
  async clear() {
    try {
      if (this.useChrome) {
        await this.chromeStorageClear();
      } else {
        localStorage.clear();
      }
      
      return true;
    } catch (error) {
      console.error('[StorageAdapter] Error clearing storage:', error);
      return false;
    }
  }

  /**
   * Check if key exists in storage
   * @param {string} key - Storage key
   * @returns {Promise<boolean>} True if key exists
   */
  async has(key) {
    try {
      const value = await this.get(key);
      return value !== null;
    } catch (error) {
      console.error('[StorageAdapter] Error checking key existence:', error);
      return false;
    }
  }

  /**
   * Get storage usage statistics
   * @returns {Promise<Object>} Storage statistics
   */
  async getStats() {
    try {
      const allData = await this.getAll();
      const prefixedKeys = Object.keys(allData).filter(key => key.startsWith(this.prefix));
      
      let totalSize = 0;
      prefixedKeys.forEach(key => {
        totalSize += JSON.stringify(allData[key]).length;
      });

      return {
        totalKeys: prefixedKeys.length,
        totalSize,
        averageSize: totalSize / prefixedKeys.length || 0,
        storageType: this.useChrome ? 'chrome' : 'localStorage'
      };
    } catch (error) {
      console.error('[StorageAdapter] Error getting storage stats:', error);
      return {
        totalKeys: 0,
        totalSize: 0,
        averageSize: 0,
        storageType: 'unknown'
      };
    }
  }

  /**
   * Chrome storage wrapper: set
   * @private
   */
  chromeStorageSet(key, value) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Chrome storage wrapper: get
   * @private
   */
  chromeStorageGet(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get([key], (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result[key] || null);
        }
      });
    });
  }

  /**
   * Chrome storage wrapper: remove
   * @private
   */
  chromeStorageRemove(key) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove([key], () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Chrome storage wrapper: get all
   * @private
   */
  chromeStorageGetAll() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(null, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result);
        }
      });
    });
  }

  /**
   * Chrome storage wrapper: clear
   * @private
   */
  chromeStorageClear() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }
}