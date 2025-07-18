// New refactored content script using Clean Architecture

import { CorosExtensionApp } from './src/core/CorosExtensionApp.js';

// Main application instance
let app = null;

// Prevent multiple initializations
if (window.corosCalendarExtension) {
  console.log('[Content Script] Extension already initialized');
} else {
  window.corosCalendarExtension = true;
  
  /**
   * Initialize the extension
   */
  async function initializeExtension() {
    try {
      console.log('[Content Script] Initializing COROS Training Hub Extension...');
      
      // Create and initialize the application
      app = new CorosExtensionApp();
      const initialized = await app.initialize();
      
      if (initialized) {
        console.log('[Content Script] Extension initialized successfully');
        
        // Log application status
        const status = app.getStatus();
        console.log('[Content Script] Application status:', status);
        
        // Send success message to background script
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          chrome.runtime.sendMessage({
            action: 'extensionInitialized',
            status: 'success',
            timestamp: Date.now()
          });
        }
      } else {
        console.warn('[Content Script] Extension initialization failed');
        
        // Send failure message to background script
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          chrome.runtime.sendMessage({
            action: 'extensionInitialized',
            status: 'failed',
            timestamp: Date.now()
          });
        }
      }
    } catch (error) {
      console.error('[Content Script] Fatal error during initialization:', error);
      
      // Send error message to background script
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          action: 'extensionError',
          error: error.message,
          timestamp: Date.now()
        });
      }
    }
  }

  /**
   * Cleanup extension
   */
  function cleanupExtension() {
    if (app) {
      console.log('[Content Script] Cleaning up extension...');
      app.cleanup();
      app = null;
    }
  }

  /**
   * Handle page navigation changes
   */
  function handlePageNavigation() {
    // Clean up existing instance
    cleanupExtension();
    
    // Reinitialize after a delay to allow page to load
    setTimeout(initializeExtension, 1000);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
  } else {
    // DOM already loaded, initialize after a short delay
    setTimeout(initializeExtension, 100);
  }

  // Handle page navigation for single-page applications
  const observer = new MutationObserver((mutations) => {
    let shouldReinitialize = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // Check if significant page content changed
        const hasSignificantChange = Array.from(mutation.addedNodes).some(node =>
          node.nodeType === 1 && // Element node
          node.className && typeof node.className === 'string' &&
          (node.className.includes('content') ||
           node.className.includes('page') ||
           node.className.includes('app') ||
           node.className.includes('main'))
        );

        if (hasSignificantChange) {
          shouldReinitialize = true;
        }
      }
    });

    // Reinitialize if needed and no extension container exists
    if (shouldReinitialize && !document.getElementById('coros-calendar-extension')) {
      console.log('[Content Script] Page navigation detected, reinitializing...');
      setTimeout(handlePageNavigation, 500);
    }
  });

  // Start observing for SPA navigation
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Handle browser navigation events
  window.addEventListener('popstate', () => {
    console.log('[Content Script] Browser navigation detected');
    setTimeout(handlePageNavigation, 500);
  });

  // Handle page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && app) {
      const status = app.getStatus();
      console.log('[Content Script] Page became visible, status:', status);
      
      // Refresh data if needed
      if (status.isInitialized && !status.isLoading) {
        console.log('[Content Script] Refreshing data after page visibility change');
        // The app will handle this through its internal refresh mechanism
      }
    }
  });

  // Handle extension unload
  window.addEventListener('beforeunload', () => {
    console.log('[Content Script] Page unloading, cleaning up...');
    cleanupExtension();
  });

  // Expose app instance for debugging
  if (typeof window !== 'undefined') {
    window.corosExtensionApp = app;
  }

  console.log('[Content Script] Content script loaded and ready');
}