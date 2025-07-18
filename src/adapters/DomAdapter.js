// DOM adapter for DOM manipulation abstraction

import { createElement, removeElement, findInjectionPoint } from '../utils/domUtils.js';

/**
 * Adapter for DOM manipulation operations
 */
export class DomAdapter {
  constructor() {
    this.injectionPoint = null;
    this.createdElements = new Map();
  }

  /**
   * Initialize DOM adapter
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      this.injectionPoint = findInjectionPoint();
      console.log('[DomAdapter] Initialized with injection point:', this.injectionPoint);
      return true;
    } catch (error) {
      console.error('[DomAdapter] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Create and inject extension container
   * @param {string} containerId - Container ID
   * @returns {HTMLElement|null} Created container element
   */
  createExtensionContainer(containerId) {
    try {
      // Remove existing container if present
      this.removeElement(containerId);

      const container = createElement('div', {
        attributes: { id: containerId },
        classes: ['coros-extension-container']
      });

      if (this.injectionPoint) {
        this.injectionPoint.insertBefore(container, this.injectionPoint.firstChild);
        this.createdElements.set(containerId, container);
        console.log(`[DomAdapter] Created extension container: ${containerId}`);
        return container;
      }

      console.warn('[DomAdapter] No injection point available');
      return null;
    } catch (error) {
      console.error('[DomAdapter] Error creating extension container:', error);
      return null;
    }
  }

  /**
   * Create tab navigation
   * @param {Array} tabs - Tab configuration array
   * @returns {HTMLElement|null} Tab container element
   */
  createTabNavigation(tabs) {
    try {
      const tabContainer = createElement('div', {
        classes: ['coros-extension-tabs']
      });

      tabs.forEach(tab => {
        const tabButton = createElement('button', {
          classes: ['coros-tab-btn', ...(tab.active ? ['active'] : [])],
          attributes: { 'data-tab': tab.id },
          innerHTML: tab.label
        });

        tabContainer.appendChild(tabButton);
      });

      return tabContainer;
    } catch (error) {
      console.error('[DomAdapter] Error creating tab navigation:', error);
      return null;
    }
  }

  /**
   * Create content container
   * @param {string} contentId - Content container ID
   * @returns {HTMLElement|null} Content container element
   */
  createContentContainer(contentId) {
    try {
      const contentContainer = createElement('div', {
        attributes: { id: contentId },
        classes: ['coros-extension-content']
      });

      return contentContainer;
    } catch (error) {
      console.error('[DomAdapter] Error creating content container:', error);
      return null;
    }
  }

  /**
   * Create loading indicator
   * @returns {HTMLElement|null} Loading indicator element
   */
  createLoadingIndicator() {
    try {
      const loadingIndicator = createElement('div', {
        classes: ['coros-loading'],
        innerHTML: `
          <div class="coros-spinner"></div>
          <p>Loading activity data...</p>
        `
      });

      return loadingIndicator;
    } catch (error) {
      console.error('[DomAdapter] Error creating loading indicator:', error);
      return null;
    }
  }

  /**
   * Create error display
   * @param {string} message - Error message
   * @param {Function} retryCallback - Retry callback function
   * @returns {HTMLElement|null} Error element
   */
  createErrorDisplay(message, retryCallback = null) {
    try {
      const retryButton = retryCallback ? `
        <button class="coros-retry-btn" onclick="(${retryCallback.toString()})()">
          Retry
        </button>
      ` : '';

      const errorElement = createElement('div', {
        classes: ['coros-error-state'],
        innerHTML: `
          <div class="coros-error-icon">⚠️</div>
          <h3>Unable to Load Data</h3>
          <p>${message}</p>
          ${retryButton}
        `
      });

      return errorElement;
    } catch (error) {
      console.error('[DomAdapter] Error creating error display:', error);
      return null;
    }
  }

  /**
   * Inject styles into page
   * @param {string} css - CSS styles
   * @param {string} styleId - Style element ID
   * @returns {boolean} Success status
   */
  injectStyles(css, styleId) {
    try {
      // Remove existing styles if present
      this.removeElement(styleId);

      const styleElement = createElement('style', {
        attributes: { id: styleId },
        innerHTML: css
      });

      document.head.appendChild(styleElement);
      this.createdElements.set(styleId, styleElement);
      
      console.log(`[DomAdapter] Injected styles: ${styleId}`);
      return true;
    } catch (error) {
      console.error('[DomAdapter] Error injecting styles:', error);
      return false;
    }
  }

  /**
   * Show loading state
   * @param {boolean} isLoading - Loading state
   */
  setLoadingState(isLoading) {
    try {
      const loadingElement = document.querySelector('.coros-loading');
      if (loadingElement) {
        loadingElement.style.display = isLoading ? 'flex' : 'none';
      }
    } catch (error) {
      console.error('[DomAdapter] Error setting loading state:', error);
    }
  }

  /**
   * Update tab active state
   * @param {string} activeTabId - Active tab ID
   */
  updateActiveTab(activeTabId) {
    try {
      // Remove active class from all tabs
      document.querySelectorAll('.coros-tab-btn').forEach(btn => {
        btn.classList.remove('active');
      });

      // Add active class to selected tab
      const activeTab = document.querySelector(`[data-tab="${activeTabId}"]`);
      if (activeTab) {
        activeTab.classList.add('active');
      }
    } catch (error) {
      console.error('[DomAdapter] Error updating active tab:', error);
    }
  }

  /**
   * Update content container
   * @param {string} contentId - Content container ID
   * @param {string} html - HTML content
   */
  updateContent(contentId, html) {
    try {
      const contentContainer = document.getElementById(contentId);
      if (contentContainer) {
        contentContainer.innerHTML = html;
      }
    } catch (error) {
      console.error('[DomAdapter] Error updating content:', error);
    }
  }

  /**
   * Add event listener with cleanup tracking
   * @param {HTMLElement} element - Target element
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   * @param {Object} options - Event options
   * @returns {Function} Cleanup function
   */
  addEventListener(element, event, handler, options = {}) {
    try {
      element.addEventListener(event, handler, options);
      
      // Return cleanup function
      return () => {
        element.removeEventListener(event, handler, options);
      };
    } catch (error) {
      console.error('[DomAdapter] Error adding event listener:', error);
      return () => {}; // Return empty cleanup function
    }
  }

  /**
   * Remove element by ID or selector
   * @param {string} selector - Element selector or ID
   */
  removeElement(selector) {
    try {
      removeElement(selector);
      
      // Remove from created elements tracking
      if (this.createdElements.has(selector)) {
        this.createdElements.delete(selector);
      }
    } catch (error) {
      console.error('[DomAdapter] Error removing element:', error);
    }
  }

  /**
   * Clean up all created elements
   */
  cleanup() {
    try {
      this.createdElements.forEach((element, id) => {
        if (element && element.parentNode) {
          element.parentNode.removeChild(element);
        }
      });
      
      this.createdElements.clear();
      console.log('[DomAdapter] Cleaned up all created elements');
    } catch (error) {
      console.error('[DomAdapter] Error during cleanup:', error);
    }
  }

  /**
   * Check if element exists
   * @param {string} selector - Element selector
   * @returns {boolean} True if element exists
   */
  elementExists(selector) {
    try {
      return document.querySelector(selector) !== null;
    } catch (error) {
      console.error('[DomAdapter] Error checking element existence:', error);
      return false;
    }
  }

  /**
   * Wait for element to be available
   * @param {string} selector - Element selector
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<HTMLElement|null>} Element or null if timeout
   */
  async waitForElement(selector, timeout = 5000) {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver((mutations) => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  /**
   * Scroll to element
   * @param {string} selector - Element selector
   * @param {Object} options - Scroll options
   */
  scrollToElement(selector, options = {}) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center',
          ...options
        });
      }
    } catch (error) {
      console.error('[DomAdapter] Error scrolling to element:', error);
    }
  }

  /**
   * Get element bounds
   * @param {string} selector - Element selector
   * @returns {Object|null} Element bounds or null
   */
  getElementBounds(selector) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        return element.getBoundingClientRect();
      }
      return null;
    } catch (error) {
      console.error('[DomAdapter] Error getting element bounds:', error);
      return null;
    }
  }
}