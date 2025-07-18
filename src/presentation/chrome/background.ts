// Background script for COROS Activity Calendar extension

// Extension lifecycle management
class ExtensionLifecycleManager {
  private isInitialized = false;

  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    this.setupEventListeners();
    this.isInitialized = true;
    console.log('COROS Activity Calendar background script initialized');
  }

  private setupEventListeners(): void {
    // Handle extension installation
    chrome.runtime.onInstalled.addListener((details) => {
      console.log('COROS Activity Calendar extension installed:', details.reason);
      
      if (details.reason === 'install') {
        this.onFirstInstall();
      } else if (details.reason === 'update') {
        this.onUpdate(details.previousVersion);
      }
    });

    // Handle tab updates
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.onTabUpdated(tabId, tab.url);
      }
    });

    // Handle messages from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
    });
  }

  private onFirstInstall(): void {
    // Set up default settings
    chrome.storage.local.set({
      'coros_extension_settings': {
        version: '1.1.0',
        defaultView: 'calendar',
        cacheEnabled: true,
        installDate: Date.now()
      }
    });
  }

  private onUpdate(previousVersion?: string): void {
    console.log(`COROS Activity Calendar updated from ${previousVersion} to 1.1.0`);
    
    // Handle migration if needed
    if (previousVersion && this.needsMigration(previousVersion)) {
      this.migrateData(previousVersion);
    }
  }

  private needsMigration(previousVersion: string): boolean {
    // Check if migration is needed based on version
    return previousVersion < '1.1.0';
  }

  private migrateData(previousVersion: string): void {
    console.log(`Migrating data from version ${previousVersion}`);
    
    // Perform any necessary data migration
    chrome.storage.local.get(null, (items) => {
      const migratedData = this.performMigration(items, previousVersion);
      
      if (migratedData) {
        chrome.storage.local.set(migratedData, () => {
          console.log('Data migration completed');
        });
      }
    });
  }

  private performMigration(_data: any, _previousVersion: string): any {
    // Implement specific migration logic based on version
    return null;
  }

  private onTabUpdated(tabId: number, url: string): void {
    // Check if tab is on COROS website
    if (this.isCorosTab(url)) {
      this.enableExtensionForTab(tabId);
    }
  }

  private isCorosTab(url: string): boolean {
    return url.includes('coros.com') && 
           (url.includes('/activities') || url.includes('/admin/views/activities'));
  }

  private enableExtensionForTab(tabId: number): void {
    // Update extension icon or badge to indicate it's active
    chrome.action.setBadgeText({
      text: '●',
      tabId: tabId
    });
    
    chrome.action.setBadgeBackgroundColor({
      color: '#007bff',
      tabId: tabId
    });
  }

  private handleMessage(message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void): void {
    console.log('Background script received message:', message);
    
    switch (message.type) {
      case 'GET_EXTENSION_STATUS':
        this.handleGetExtensionStatus(sendResponse);
        break;
      
      case 'REFRESH_EXTENSION':
        this.handleRefreshExtension(sender.tab?.id, sendResponse);
        break;
      
      case 'CLEAR_CACHE':
        this.handleClearCache(sendResponse);
        break;
      
      default:
        console.warn('Unknown message type:', message.type);
        sendResponse({ error: 'Unknown message type' });
    }
  }

  private handleGetExtensionStatus(sendResponse: (response?: any) => void): void {
    chrome.storage.local.get(['coros_extension_settings'], (result) => {
      const settings = result['coros_extension_settings'] || {};
      
      sendResponse({
        isActive: true,
        version: settings.version || '1.1.0',
        defaultView: settings.defaultView || 'calendar',
        cacheEnabled: settings.cacheEnabled !== false
      });
    });
  }

  private handleRefreshExtension(tabId: number | undefined, sendResponse: (response?: any) => void): void {
    if (!tabId) {
      sendResponse({ error: 'No tab ID provided' });
      return;
    }

    chrome.tabs.sendMessage(tabId, { type: 'REFRESH_EXTENSION' }, (_response) => {
      if (chrome.runtime.lastError) {
        console.error('Error refreshing extension:', chrome.runtime.lastError);
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true });
      }
    });
  }

  private handleClearCache(sendResponse: (response?: any) => void): void {
    chrome.storage.local.get(null, (items) => {
      const keysToRemove = Object.keys(items).filter(key => 
        key.startsWith('coros_activities_')
      );
      
      if (keysToRemove.length === 0) {
        sendResponse({ success: true, message: 'No cache to clear' });
        return;
      }
      
      chrome.storage.local.remove(keysToRemove, () => {
        if (chrome.runtime.lastError) {
          sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ 
            success: true, 
            message: `Cleared ${keysToRemove.length} cache entries` 
          });
        }
      });
    });
  }
}

// Context menu management
class ContextMenuManager {
  initialize(): void {
    this.createContextMenus();
  }

  private createContextMenus(): void {
    chrome.contextMenus.create({
      id: 'coros-refresh',
      title: 'Refresh COROS Calendar',
      contexts: ['page'],
      documentUrlPatterns: ['*://*.coros.com/*']
    });

    chrome.contextMenus.create({
      id: 'coros-clear-cache',
      title: 'Clear COROS Cache',
      contexts: ['page'],
      documentUrlPatterns: ['*://*.coros.com/*']
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      this.handleContextMenuClick(info, tab);
    });
  }

  private handleContextMenuClick(info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab): void {
    if (!tab?.id) {
      return;
    }

    switch (info.menuItemId) {
      case 'coros-refresh':
        chrome.tabs.sendMessage(tab.id, { type: 'REFRESH_EXTENSION' });
        break;
      
      case 'coros-clear-cache':
        chrome.runtime.sendMessage({ type: 'CLEAR_CACHE' });
        break;
    }
  }
}

// Initialize background script
const lifecycleManager = new ExtensionLifecycleManager();
const contextMenuManager = new ContextMenuManager();

lifecycleManager.initialize();
contextMenuManager.initialize();

// Export for potential use in other files
export { ExtensionLifecycleManager, ContextMenuManager };