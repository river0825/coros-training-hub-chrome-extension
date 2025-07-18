// Utility functions for DOM manipulation and validation

/**
 * Check if current page is suitable for the extension
 * @returns {boolean} True if extension should be activated
 */
export function isCorosActivityPage() {
  const url = window.location.href;
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  return (hostname.includes('coros.com') || hostname.includes('t.coros.com')) && (
    pathname.includes('admin/views') ||
    pathname.includes('training') ||
    pathname.includes('dashboard') ||
    pathname.includes('profile') ||
    pathname === '/' ||
    pathname.includes('home')
  );
}

/**
 * Find suitable injection point for extension UI
 * @returns {HTMLElement|null} Container element or null if not found
 */
export function findInjectionPoint() {
  const selectors = [
    '.main-content',
    '.content-container',
    '.dashboard-content',
    '.activity-content',
    '#app',
    '.app-container',
    'main',
    '.container'
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element;
    }
  }

  return document.body;
}

/**
 * Create HTML element with classes and attributes
 * @param {string} tag - HTML tag name
 * @param {Object} options - Element options
 * @param {string|string[]} options.classes - CSS classes
 * @param {Object} options.attributes - HTML attributes
 * @param {string} options.innerHTML - Inner HTML content
 * @param {Object} options.style - Inline styles
 * @returns {HTMLElement} Created element
 */
export function createElement(tag, options = {}) {
  const element = document.createElement(tag);
  
  // Add classes
  if (options.classes) {
    const classes = Array.isArray(options.classes) ? options.classes : [options.classes];
    element.classList.add(...classes);
  }
  
  // Set attributes
  if (options.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }
  
  // Set innerHTML
  if (options.innerHTML) {
    element.innerHTML = options.innerHTML;
  }
  
  // Set styles
  if (options.style) {
    Object.entries(options.style).forEach(([key, value]) => {
      element.style[key] = value;
    });
  }
  
  return element;
}

/**
 * Remove element from DOM if it exists
 * @param {string} selector - CSS selector
 */
export function removeElement(selector) {
  const element = document.querySelector(selector);
  if (element) {
    element.remove();
  }
}

/**
 * Wait for element to appear in DOM
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<HTMLElement>} Promise that resolves with element
 */
export function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
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
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Throttle function execution
 * @param {Function} func - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
}

/**
 * Check if element is visible in viewport
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} True if element is visible
 */
export function isElementVisible(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Scroll element into view if not visible
 * @param {HTMLElement} element - Element to scroll to
 * @param {Object} options - Scroll options
 */
export function scrollIntoViewIfNeeded(element, options = {}) {
  if (!isElementVisible(element)) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
      ...options
    });
  }
}

/**
 * Add event listener with automatic cleanup
 * @param {HTMLElement} element - Element to attach listener to
 * @param {string} event - Event type
 * @param {Function} handler - Event handler
 * @param {Object} options - Event options
 * @returns {Function} Cleanup function
 */
export function addEventListener(element, event, handler, options = {}) {
  element.addEventListener(event, handler, options);
  
  return () => {
    element.removeEventListener(event, handler, options);
  };
}

/**
 * Extract data from DOM element
 * @param {HTMLElement} element - Element to extract data from
 * @param {Object} selectors - CSS selectors for different data fields
 * @returns {Object} Extracted data object
 */
export function extractDataFromElement(element, selectors) {
  const data = {};
  
  Object.entries(selectors).forEach(([key, selector]) => {
    const targetElement = element.querySelector(selector);
    if (targetElement) {
      data[key] = targetElement.textContent?.trim() || targetElement.value || '';
    }
  });
  
  return data;
}

/**
 * Validate required fields in data object
 * @param {Object} data - Data object to validate
 * @param {string[]} requiredFields - Required field names
 * @returns {Object} Validation result with isValid and errors
 */
export function validateRequiredFields(data, requiredFields) {
  const errors = [];
  
  requiredFields.forEach(field => {
    if (!data[field] || data[field].toString().trim() === '') {
      errors.push(`${field} is required`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}