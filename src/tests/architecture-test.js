// Basic test for refactored architecture

/**
 * Test the refactored architecture components
 */
async function testRefactoredArchitecture() {
  console.log('Testing refactored architecture...');
  
  const tests = [];
  
  // Test 1: Configuration constants
  tests.push({
    name: 'Configuration Constants',
    test: () => {
      try {
        const { API_CONFIG, SPORT_TYPES, STORAGE_CONFIG } = require('./src/config/constants.js');
        return API_CONFIG && SPORT_TYPES && STORAGE_CONFIG;
      } catch (error) {
        return false;
      }
    }
  });
  
  // Test 2: Date utilities
  tests.push({
    name: 'Date Utilities',
    test: () => {
      try {
        const { formatDateKey, getMonthKey, isDateToday } = require('./src/utils/dateUtils.js');
        const testDate = new Date('2024-01-15');
        const dateKey = formatDateKey(testDate);
        const monthKey = getMonthKey(testDate);
        return dateKey === '2024-01-15' && monthKey === '2024-01';
      } catch (error) {
        return false;
      }
    }
  });
  
  // Test 3: Format utilities
  tests.push({
    name: 'Format Utilities',
    test: () => {
      try {
        const { formatTime, formatDistance, formatDuration } = require('./src/utils/formatUtils.js');
        const time = formatTime(3665); // 1:01:05
        const distance = formatDistance(5000); // 5.0 km
        const duration = formatDuration(3600); // 1h 0m
        return time === '01:01:05' && distance === '5.0 km' && duration === '1h 0m';
      } catch (error) {
        return false;
      }
    }
  });
  
  // Test 4: Sport utilities
  tests.push({
    name: 'Sport Utilities',
    test: () => {
      try {
        const { mapCorosSportType, normalizeActivityType } = require('./src/utils/sportUtils.js');
        const corosSport = mapCorosSportType(100); // running
        const normalizedSport = normalizeActivityType('run'); // running
        return corosSport === 'running' && normalizedSport === 'running';
      } catch (error) {
        return false;
      }
    }
  });
  
  // Test 5: Activity Data Processor
  tests.push({
    name: 'Activity Data Processor',
    test: () => {
      try {
        const { ActivityDataProcessor } = require('./src/services/ActivityDataProcessor.js');
        const processor = new ActivityDataProcessor();
        
        const testActivity = {
          id: 'test-1',
          name: 'Test Run',
          sportType: 100,
          distance: 5000,
          duration: 1800,
          startTime: '2024-01-15T08:00:00Z'
        };
        
        const processed = processor.processActivity(testActivity);
        return processed && processed.type === 'running' && processed.distance === 5000;
      } catch (error) {
        return false;
      }
    }
  });
  
  // Test 6: Calendar Service
  tests.push({
    name: 'Calendar Service',
    test: () => {
      try {
        const { CalendarService } = require('./src/services/CalendarService.js');
        const { ActivityDataProcessor } = require('./src/services/ActivityDataProcessor.js');
        
        const processor = new ActivityDataProcessor();
        const calendarService = new CalendarService(processor);
        
        const monthName = calendarService.getMonthName(0);
        const weekdays = calendarService.getWeekdayNames();
        
        return monthName === 'January' && weekdays.length === 7;
      } catch (error) {
        return false;
      }
    }
  });
  
  // Test 7: Storage Adapter
  tests.push({
    name: 'Storage Adapter',
    test: () => {
      try {
        const { StorageAdapter } = require('./src/adapters/StorageAdapter.js');
        const adapter = new StorageAdapter();
        
        // Test basic structure
        return typeof adapter.set === 'function' && 
               typeof adapter.get === 'function' && 
               typeof adapter.remove === 'function';
      } catch (error) {
        return false;
      }
    }
  });
  
  // Run all tests
  console.log('\nRunning architecture tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = test.test();
      if (result) {
        console.log(`✅ ${test.name} - PASSED`);
        passed++;
      } else {
        console.log(`❌ ${test.name} - FAILED`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} - ERROR: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\nTest Results: ${passed} passed, ${failed} failed`);
  console.log(`Success rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  
  return {
    passed,
    failed,
    total: tests.length,
    successRate: (passed / tests.length) * 100
  };
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testRefactoredArchitecture };
}

// Run tests if in browser environment
if (typeof window !== 'undefined') {
  // Run tests when page loads
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Running refactored architecture tests...');
    testRefactoredArchitecture();
  });
}