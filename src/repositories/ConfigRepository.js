// Configuration repository for managing extension settings

/**
 * Repository for managing extension configuration and settings
 */
export class ConfigRepository {
  constructor(storageAdapter) {
    this.storageAdapter = storageAdapter;
    this.configKey = 'extension_config';
    this.defaultConfig = {
      theme: 'auto',
      defaultView: 'calendar',
      cacheStrategy: 'cache_past_months',
      autoRefresh: false,
      refreshInterval: 300000, // 5 minutes
      showNotifications: true,
      compactView: false,
      language: 'en',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24h',
      distanceUnit: 'km',
      version: '1.0.0'
    };
  }

  /**
   * Get configuration value
   * @param {string} key - Configuration key
   * @param {*} defaultValue - Default value if key not found
   * @returns {Promise<*>} Configuration value
   */
  async get(key, defaultValue = null) {
    try {
      const config = await this.getAll();
      return config[key] !== undefined ? config[key] : (defaultValue !== null ? defaultValue : this.defaultConfig[key]);
    } catch (error) {
      console.error('[ConfigRepository] Error getting config:', error);
      return defaultValue !== null ? defaultValue : this.defaultConfig[key];
    }
  }

  /**
   * Set configuration value
   * @param {string} key - Configuration key
   * @param {*} value - Configuration value
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value) {
    try {
      const config = await this.getAll();
      config[key] = value;
      config.lastModified = Date.now();
      
      return await this.storageAdapter.set(this.configKey, config);
    } catch (error) {
      console.error('[ConfigRepository] Error setting config:', error);
      return false;
    }
  }

  /**
   * Get all configuration
   * @returns {Promise<Object>} Complete configuration object
   */
  async getAll() {
    try {
      const storedConfig = await this.storageAdapter.get(this.configKey);
      
      if (!storedConfig) {
        // Return default config if none exists
        return { ...this.defaultConfig };
      }

      // Merge with default config to ensure all keys are present
      return {
        ...this.defaultConfig,
        ...storedConfig
      };
    } catch (error) {
      console.error('[ConfigRepository] Error getting all config:', error);
      return { ...this.defaultConfig };
    }
  }

  /**
   * Update multiple configuration values
   * @param {Object} updates - Object with key-value pairs to update
   * @returns {Promise<boolean>} Success status
   */
  async update(updates) {
    try {
      const config = await this.getAll();
      Object.assign(config, updates);
      config.lastModified = Date.now();
      
      return await this.storageAdapter.set(this.configKey, config);
    } catch (error) {
      console.error('[ConfigRepository] Error updating config:', error);
      return false;
    }
  }

  /**
   * Reset configuration to defaults
   * @returns {Promise<boolean>} Success status
   */
  async reset() {
    try {
      const config = { ...this.defaultConfig };
      config.lastModified = Date.now();
      
      return await this.storageAdapter.set(this.configKey, config);
    } catch (error) {
      console.error('[ConfigRepository] Error resetting config:', error);
      return false;
    }
  }

  /**
   * Delete configuration
   * @returns {Promise<boolean>} Success status
   */
  async delete() {
    try {
      return await this.storageAdapter.remove(this.configKey);
    } catch (error) {
      console.error('[ConfigRepository] Error deleting config:', error);
      return false;
    }
  }

  /**
   * Check if configuration exists
   * @returns {Promise<boolean>} True if configuration exists
   */
  async exists() {
    try {
      const config = await this.storageAdapter.get(this.configKey);
      return config !== null;
    } catch (error) {
      console.error('[ConfigRepository] Error checking config existence:', error);
      return false;
    }
  }

  /**
   * Get configuration metadata
   * @returns {Promise<Object>} Configuration metadata
   */
  async getMetadata() {
    try {
      const config = await this.getAll();
      return {
        version: config.version || this.defaultConfig.version,
        lastModified: config.lastModified || null,
        hasCustomSettings: await this.exists(),
        keysCount: Object.keys(config).length,
        size: JSON.stringify(config).length
      };
    } catch (error) {
      console.error('[ConfigRepository] Error getting metadata:', error);
      return {
        version: this.defaultConfig.version,
        lastModified: null,
        hasCustomSettings: false,
        keysCount: 0,
        size: 0
      };
    }
  }

  /**
   * Validate configuration
   * @param {Object} config - Configuration object to validate
   * @returns {Object} Validation result
   */
  validateConfig(config) {
    const errors = [];
    const warnings = [];

    // Check required fields
    if (!config.version) {
      errors.push('Version is required');
    }

    // Validate theme
    if (config.theme && !['auto', 'light', 'dark'].includes(config.theme)) {
      errors.push('Invalid theme value');
    }

    // Validate defaultView
    if (config.defaultView && !['calendar', 'statistics'].includes(config.defaultView)) {
      errors.push('Invalid defaultView value');
    }

    // Validate cacheStrategy
    if (config.cacheStrategy && !['always_refresh', 'cache_current_month', 'cache_past_months'].includes(config.cacheStrategy)) {
      errors.push('Invalid cacheStrategy value');
    }

    // Validate refreshInterval
    if (config.refreshInterval && (typeof config.refreshInterval !== 'number' || config.refreshInterval < 60000)) {
      errors.push('refreshInterval must be a number >= 60000ms');
    }

    // Validate distanceUnit
    if (config.distanceUnit && !['km', 'mi'].includes(config.distanceUnit)) {
      errors.push('Invalid distanceUnit value');
    }

    // Validate timeFormat
    if (config.timeFormat && !['12h', '24h'].includes(config.timeFormat)) {
      errors.push('Invalid timeFormat value');
    }

    // Check for deprecated settings
    if (config.deprecatedSetting) {
      warnings.push('Configuration contains deprecated settings');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Migrate configuration from old version
   * @param {Object} oldConfig - Old configuration object
   * @returns {Promise<boolean>} Success status
   */
  async migrate(oldConfig) {
    try {
      const newConfig = { ...this.defaultConfig };
      
      // Map old settings to new structure
      const migrationMap = {
        'old_theme': 'theme',
        'old_view': 'defaultView',
        'old_cache': 'cacheStrategy'
      };

      Object.entries(migrationMap).forEach(([oldKey, newKey]) => {
        if (oldConfig[oldKey] !== undefined) {
          newConfig[newKey] = oldConfig[oldKey];
        }
      });

      // Update version
      newConfig.version = this.defaultConfig.version;
      newConfig.lastModified = Date.now();
      newConfig.migrated = true;

      return await this.storageAdapter.set(this.configKey, newConfig);
    } catch (error) {
      console.error('[ConfigRepository] Error migrating config:', error);
      return false;
    }
  }
}