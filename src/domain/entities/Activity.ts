import { ActivityId } from '../value-objects/ActivityId';
import { DateTime } from '../value-objects/DateTime';
import { Duration } from '../value-objects/Duration';
import { Distance } from '../value-objects/Distance';
import { Calories } from '../value-objects/Calories';
import { SportType } from '../value-objects/SportType';

// Pace value object
export class Pace {
  constructor(private readonly minutesPerKilometer: number) {
    if (minutesPerKilometer < 0) {
      throw new Error('Pace cannot be negative');
    }
  }

  getMinutesPerKilometer(): number {
    return this.minutesPerKilometer;
  }

  toString(): string {
    const minutes = Math.floor(this.minutesPerKilometer);
    const seconds = Math.floor((this.minutesPerKilometer - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
  }
}

// Activity entity
export class Activity {
  constructor(
    private readonly id: ActivityId,
    private readonly name: string,
    private readonly sportType: SportType,
    private readonly startTime: DateTime,
    private readonly duration: Duration,
    private readonly distance: Distance,
    private readonly calories: Calories,
    private readonly device?: string,
    private readonly averageHeartRate?: number,
    private readonly averageSpeed?: number
  ) {}

  getId(): ActivityId {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getSportType(): SportType {
    return this.sportType;
  }

  getStartTime(): DateTime {
    return this.startTime;
  }

  getDuration(): Duration {
    return this.duration;
  }

  getDistance(): Distance {
    return this.distance;
  }

  getCalories(): Calories {
    return this.calories;
  }

  getDevice(): string | undefined {
    return this.device;
  }

  getAverageHeartRate(): number | undefined {
    return this.averageHeartRate;
  }

  getAverageSpeed(): number | undefined {
    return this.averageSpeed;
  }

  // Business methods
  isOnDate(date: Date): boolean {
    const activityDate = this.startTime.toDate();
    return (
      activityDate.getFullYear() === date.getFullYear() &&
      activityDate.getMonth() === date.getMonth() &&
      activityDate.getDate() === date.getDate()
    );
  }

  calculatePace(): Pace {
    if (this.distance.getMeters() === 0) {
      return new Pace(0);
    }
    const minutesPerKilometer = this.duration.toMinutes() / this.distance.toKilometers();
    return new Pace(minutesPerKilometer);
  }

  isSameType(other: Activity): boolean {
    return this.sportType.getCode() === other.sportType.getCode();
  }

  hasValidDistance(): boolean {
    return this.distance.getMeters() > 0;
  }

  isRecent(daysAgo: number): boolean {
    const now = DateTime.now();
    const daysDiff = (now.toDate().getTime() - this.startTime.toDate().getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= daysAgo;
  }
}