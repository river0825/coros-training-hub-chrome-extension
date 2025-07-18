// Popup script for COROS Activity Calendar extension

// Popup controller
class PopupController {
  private statusElement: HTMLElement | null = null;
  private refreshButton: HTMLElement | null = null;
  private clearCacheButton: HTMLElement | null = null;

  initialize(): void {
    this.initializeElements();
    this.bindEventListeners();
    this.checkCurrentPage();
  }

  private initializeElements(): void {
    this.statusElement = document.getElementById('status');
    this.refreshButton = document.getElementById('refreshBtn');
    this.clearCacheButton = document.getElementById('clearCacheBtn');
  }

  private bindEventListeners(): void {
    if (this.refreshButton) {
      this.refreshButton.addEventListener('click', () => this.handleRefresh());
    }

    if (this.clearCacheButton) {
      this.clearCacheButton.addEventListener('click', () => this.handleClearCache());
    }

    // Settings event listeners
    const defaultViewSelect = document.getElementById('defaultView') as HTMLSelectElement;
    if (defaultViewSelect) {
      defaultViewSelect.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        this.saveSettings({ defaultView: target.value as 'calendar' | 'statistics' });
      });
    }

    const cacheEnabledCheckbox = document.getElementById('cacheEnabled') as HTMLInputElement;
    if (cacheEnabledCheckbox) {
      cacheEnabledCheckbox.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        this.saveSettings({ cacheEnabled: target.checked });
      });
    }
  }

  private checkCurrentPage(): void {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (!currentTab?.url) {
        this.showError('Unable to determine current page');
        return;
      }

      if (this.isCorosPage(currentTab.url)) {
        this.showActive('Extension active on COROS website');
        this.loadExtensionStatus();
      } else {
        this.showInactive('Please visit COROS website to use extension');
      }
    });
  }

  private isCorosPage(url: string): boolean {
    return url.includes('coros.com') && 
           (url.includes('/activities') || url.includes('/admin/views/activities'));
  }

  private showActive(message: string): void {
    if (this.statusElement) {
      this.statusElement.textContent = message;
      this.statusElement.className = 'status active';
    }
    this.enableControls();
  }

  private showInactive(message: string): void {
    if (this.statusElement) {
      this.statusElement.textContent = message;
      this.statusElement.className = 'status inactive';
    }
    this.disableControls();
  }

  private showError(message: string): void {
    if (this.statusElement) {
      this.statusElement.textContent = message;
      this.statusElement.className = 'status error';
    }
    this.disableControls();
  }

  private enableControls(): void {
    if (this.refreshButton) {
      this.refreshButton.removeAttribute('disabled');
    }
    if (this.clearCacheButton) {
      this.clearCacheButton.removeAttribute('disabled');
    }
  }

  private disableControls(): void {
    if (this.refreshButton) {
      this.refreshButton.setAttribute('disabled', 'true');
    }
    if (this.clearCacheButton) {
      this.clearCacheButton.setAttribute('disabled', 'true');
    }
  }

  private handleRefresh(): void {
    this.showStatus('Refreshing extension...');
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (!currentTab?.id) {
        this.showError('Unable to refresh extension');
        return;
      }

      chrome.runtime.sendMessage({ 
        type: 'REFRESH_EXTENSION' 
      }, (response) => {
        if (chrome.runtime.lastError) {
          this.showError('Failed to refresh extension');
        } else if (response?.error) {
          this.showError(`Failed to refresh: ${response.error}`);
        } else {
          this.showActive('Extension refreshed successfully');
          setTimeout(() => this.checkCurrentPage(), 1000);
        }
      });
    });
  }

  private handleClearCache(): void {
    this.showStatus('Clearing cache...');
    
    chrome.runtime.sendMessage({ 
      type: 'CLEAR_CACHE' 
    }, (response) => {
      if (chrome.runtime.lastError) {
        this.showError('Failed to clear cache');
      } else if (response?.error) {
        this.showError(`Failed to clear cache: ${response.error}`);
      } else {
        this.showActive(`Cache cleared: ${response.message}`);
        setTimeout(() => this.checkCurrentPage(), 1000);
      }
    });
  }

  private loadExtensionStatus(): void {
    chrome.runtime.sendMessage({ 
      type: 'GET_EXTENSION_STATUS' 
    }, (response) => {
      if (response && !response.error) {
        this.updateSettings(response);
      }
    });
  }

  private updateSettings(status: any): void {
    const defaultViewSelect = document.getElementById('defaultView') as HTMLSelectElement;
    if (defaultViewSelect) {
      defaultViewSelect.value = status.defaultView || 'calendar';
    }

    const cacheEnabledCheckbox = document.getElementById('cacheEnabled') as HTMLInputElement;
    if (cacheEnabledCheckbox) {
      cacheEnabledCheckbox.checked = status.cacheEnabled !== false;
    }

    const versionElement = document.getElementById('version');
    if (versionElement) {
      versionElement.textContent = `v${status.version || '1.1.0'}`;
    }
  }

  private saveSettings(settings: Partial<{defaultView: 'calendar' | 'statistics', cacheEnabled: boolean}>): void {
    chrome.storage.local.get(['coros_extension_settings'], (result) => {
      const currentSettings = result['coros_extension_settings'] || {};
      const updatedSettings = { ...currentSettings, ...settings };
      
      chrome.storage.local.set({
        'coros_extension_settings': updatedSettings
      }, () => {
        this.showStatus('Settings saved');
        setTimeout(() => this.checkCurrentPage(), 1000);
      });
    });
  }

  private showStatus(message: string): void {
    if (this.statusElement) {
      this.statusElement.textContent = message;
      this.statusElement.className = 'status';
    }
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const controller = new PopupController();
  controller.initialize();
});

export { PopupController };