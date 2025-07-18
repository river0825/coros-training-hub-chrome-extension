import { ActivityAggregationServiceImpl } from '@domain/services/ActivityAggregationService';
import { ActivityTestBuilder } from '../entities/Activity.test';
import { SportType } from '@domain/value-objects/SportType';

describe('Feature: Activity Aggregation', () => {
  let service: ActivityAggregationServiceImpl;

  beforeEach(() => {
    service = new ActivityAggregationServiceImpl();
  });

  describe('Scenario: Grouping activities by sport type', () => {
    it('should group activities by sport type correctly', () => {
      // Given: Mixed activities of different sport types
      const runningActivity1 = new ActivityTestBuilder()
        .withId('run-1')
        .withSportType(SportType.running())
        .build();
      
      const runningActivity2 = new ActivityTestBuilder()
        .withId('run-2')
        .withSportType(SportType.running())
        .build();
      
      const cyclingActivity = new ActivityTestBuilder()
        .withId('cycle-1')
        .withSportType(SportType.cycling())
        .build();

      const activities = [runningActivity1, runningActivity2, cyclingActivity];

      // When: Grouping by sport type
      const groupedBySport = service.groupBySport(activities);

      // Then: Should group correctly by sport type
      expect(groupedBySport.size).toBe(2);
      
      // Find running group
      const runningGroup = Array.from(groupedBySport.entries())
        .find(([sportType]) => sportType.isRunning());
      expect(runningGroup).toBeDefined();
      expect(runningGroup![1]).toHaveLength(2);
      
      // Find cycling group
      const cyclingGroup = Array.from(groupedBySport.entries())
        .find(([sportType]) => sportType.isCycling());
      expect(cyclingGroup).toBeDefined();
      expect(cyclingGroup![1]).toHaveLength(1);
    });
  });

  describe('Scenario: Grouping activities by date', () => {
    it('should group activities by date correctly', () => {
      // Given: Activities on different dates
      const date1 = new Date('2024-06-15T08:00:00Z');
      const date2 = new Date('2024-06-16T08:00:00Z');
      
      const activity1 = new ActivityTestBuilder()
        .withId('act-1')
        .withStartTime(date1)
        .build();
      
      const activity2 = new ActivityTestBuilder()
        .withId('act-2')
        .withStartTime(date1)
        .build();
      
      const activity3 = new ActivityTestBuilder()
        .withId('act-3')
        .withStartTime(date2)
        .build();

      const activities = [activity1, activity2, activity3];

      // When: Grouping by date
      const groupedByDate = service.groupByDate(activities);

      // Then: Should group correctly by date
      expect(groupedByDate.size).toBe(2);
      
      const date1Key = date1.toDateString();
      const date2Key = date2.toDateString();
      
      expect(groupedByDate.get(date1Key)).toHaveLength(2);
      expect(groupedByDate.get(date2Key)).toHaveLength(1);
    });
  });

  describe('Scenario: Calculating monthly totals', () => {
    it('should calculate correct monthly totals for activities', () => {
      // Given: Multiple activities with known totals
      const activity1 = new ActivityTestBuilder()
        .withDistance(5) // 5km
        .withDuration(30) // 30 minutes
        .withCalories(300)
        .withStartTime(new Date('2024-06-15T08:00:00Z'))
        .build();
      
      const activity2 = new ActivityTestBuilder()
        .withDistance(10) // 10km
        .withDuration(60) // 60 minutes
        .withCalories(600)
        .withStartTime(new Date('2024-06-15T16:00:00Z')) // Same day
        .build();
      
      const activity3 = new ActivityTestBuilder()
        .withDistance(3) // 3km
        .withDuration(20) // 20 minutes
        .withCalories(200)
        .withStartTime(new Date('2024-06-16T08:00:00Z')) // Different day
        .build();

      const activities = [activity1, activity2, activity3];

      // When: Calculating monthly totals
      const totals = service.calculateMonthlyTotals(activities);

      // Then: Should calculate correct totals
      expect(totals.totalActivities).toBe(3);
      expect(totals.totalDistance.toKilometers()).toBe(18); // 5 + 10 + 3
      expect(totals.totalDuration.toMinutes()).toBe(110); // 30 + 60 + 20
      expect(totals.totalCalories.getValue()).toBe(1100); // 300 + 600 + 200
      expect(totals.activeDays).toBe(2); // 2 unique days
    });
  });

  describe('Scenario: Counting active days', () => {
    it('should count unique active days correctly', () => {
      // Given: Activities on multiple days with some duplicates
      const date1 = new Date('2024-06-15T08:00:00Z');
      const date2 = new Date('2024-06-16T08:00:00Z');
      
      const activities = [
        new ActivityTestBuilder().withStartTime(date1).build(),
        new ActivityTestBuilder().withStartTime(date1).build(), // Same day
        new ActivityTestBuilder().withStartTime(date2).build(),
      ];

      // When: Counting active days
      const activeDays = service.getActiveDays(activities);

      // Then: Should count unique days only
      expect(activeDays).toBe(2);
    });

    it('should return zero for empty activities', () => {
      // Given: No activities
      const activities: never[] = [];

      // When: Counting active days
      const activeDays = service.getActiveDays(activities);

      // Then: Should return zero
      expect(activeDays).toBe(0);
    });
  });
});