import { Activity } from '@domain/entities/Activity';
import { ActivityId } from '@domain/value-objects/ActivityId';
import { DateTime } from '@domain/value-objects/DateTime';
import { Duration } from '@domain/value-objects/Duration';
import { Distance } from '@domain/value-objects/Distance';
import { Calories } from '@domain/value-objects/Calories';
import { SportType } from '@domain/value-objects/SportType';

// BDD-style test helpers
class ActivityTestBuilder {
  private id = new ActivityId('test-activity-1');
  private name = 'Test Activity';
  private sportType = SportType.running();
  private startTime = DateTime.now();
  private duration = Duration.fromMinutes(30);
  private distance = Distance.fromKilometers(5);
  private calories = Calories.fromValue(300);

  withId(id: string): ActivityTestBuilder {
    this.id = new ActivityId(id);
    return this;
  }

  withName(name: string): ActivityTestBuilder {
    this.name = name;
    return this;
  }

  withSportType(sportType: SportType): ActivityTestBuilder {
    this.sportType = sportType;
    return this;
  }

  withStartTime(date: Date): ActivityTestBuilder {
    this.startTime = DateTime.fromDate(date);
    return this;
  }

  withDuration(minutes: number): ActivityTestBuilder {
    this.duration = Duration.fromMinutes(minutes);
    return this;
  }

  withDistance(kilometers: number): ActivityTestBuilder {
    this.distance = Distance.fromKilometers(kilometers);
    return this;
  }

  withCalories(calories: number): ActivityTestBuilder {
    this.calories = Calories.fromValue(calories);
    return this;
  }

  build(): Activity {
    return new Activity(
      this.id,
      this.name,
      this.sportType,
      this.startTime,
      this.duration,
      this.distance,
      this.calories
    );
  }
}

// BDD Helper functions
function givenRunningActivity(): Activity {
  return new ActivityTestBuilder()
    .withName('Morning Run')
    .withSportType(SportType.running())
    .withDuration(30)
    .withDistance(5)
    .build();
}

function givenCyclingActivity(): Activity {
  return new ActivityTestBuilder()
    .withName('Evening Ride')
    .withSportType(SportType.cycling())
    .withDuration(60)
    .withDistance(20)
    .build();
}

describe('Feature: Activity Management', () => {
  describe('Scenario: Activity creation with valid data', () => {
    it('should create activity with all required properties when valid data is provided', () => {
      // Given: Valid activity data
      const id = new ActivityId('test-123');
      const name = 'Morning Run';
      const sportType = SportType.running();
      const startTime = DateTime.now();
      const duration = Duration.fromMinutes(30);
      const distance = Distance.fromKilometers(5);
      const calories = Calories.fromValue(300);

      // When: Activity is created
      const activity = new Activity(id, name, sportType, startTime, duration, distance, calories);

      // Then: Activity has all correct properties
      expect(activity.getId()).toBe(id);
      expect(activity.getName()).toBe(name);
      expect(activity.getSportType()).toBe(sportType);
      expect(activity.getStartTime()).toBe(startTime);
      expect(activity.getDuration()).toBe(duration);
      expect(activity.getDistance()).toBe(distance);
      expect(activity.getCalories()).toBe(calories);
    });
  });

  describe('Scenario: Pace calculation for running activities', () => {
    it('should calculate correct pace when activity has valid distance and duration', () => {
      // Given: A running activity with 5km distance and 30 minutes duration
      const activity = givenRunningActivity();

      // When: Pace is calculated
      const pace = activity.calculatePace();

      // Then: Pace should be 6 minutes per kilometer
      expect(pace.getMinutesPerKilometer()).toBe(6);
      expect(pace.toString()).toBe('6:00 min/km');
    });

    it('should handle zero distance gracefully', () => {
      // Given: An activity with zero distance
      const activity = new ActivityTestBuilder()
        .withDistance(0)
        .withDuration(30)
        .build();

      // When: Pace is calculated
      const pace = activity.calculatePace();

      // Then: Pace should be zero
      expect(pace.getMinutesPerKilometer()).toBe(0);
    });
  });

  describe('Scenario: Activity date checking', () => {
    it('should correctly identify if activity is on specific date', () => {
      // Given: An activity on a specific date
      const testDate = new Date('2024-06-15T08:00:00Z');
      const activity = new ActivityTestBuilder()
        .withStartTime(testDate)
        .build();

      // When: Checking if activity is on the same date
      const isOnSameDate = activity.isOnDate(testDate);
      const isOnDifferentDate = activity.isOnDate(new Date('2024-06-16T08:00:00Z'));

      // Then: Should correctly identify date match
      expect(isOnSameDate).toBe(true);
      expect(isOnDifferentDate).toBe(false);
    });
  });

  describe('Scenario: Activity type comparison', () => {
    it('should identify activities of same sport type', () => {
      // Given: Two running activities
      const activity1 = givenRunningActivity();
      const activity2 = givenRunningActivity();

      // When: Comparing sport types
      const areSameType = activity1.isSameType(activity2);

      // Then: Should be identified as same type
      expect(areSameType).toBe(true);
    });

    it('should identify activities of different sport types', () => {
      // Given: A running and cycling activity
      const runningActivity = givenRunningActivity();
      const cyclingActivity = givenCyclingActivity();

      // When: Comparing sport types
      const areSameType = runningActivity.isSameType(cyclingActivity);

      // Then: Should be identified as different types
      expect(areSameType).toBe(false);
    });
  });
});

export { ActivityTestBuilder, givenRunningActivity, givenCyclingActivity };