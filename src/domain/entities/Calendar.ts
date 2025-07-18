import { Activity } from './Activity';
import { DateTime } from '../value-objects/DateTime';
import { Duration } from '../value-objects/Duration';
import { Distance } from '../value-objects/Distance';
import { Calories } from '../value-objects/Calories';

// Calendar day representation
export class CalendarDay {
  constructor(
    private readonly date: DateTime,
    private readonly activities: Activity[],
    private readonly isCurrentMonth: boolean,
    private readonly isToday: boolean
  ) {}

  getDate(): DateTime {
    return this.date;
  }

  getActivities(): Activity[] {
    return [...this.activities];
  }

  isCurrentMonth(): boolean {
    return this.isCurrentMonth;
  }

  isToday(): boolean {
    return this.isToday;
  }

  hasActivities(): boolean {
    return this.activities.length > 0;
  }

  getActivityCount(): number {
    return this.activities.length;
  }

  getDayNumber(): number {
    return this.date.getDay();
  }
}

// Calendar entity
export class Calendar {
  constructor(
    private readonly year: number,
    private readonly month: number,
    private readonly days: CalendarDay[]
  ) {}

  getYear(): number {
    return this.year;
  }

  getMonth(): number {
    return this.month;
  }

  getMonthName(): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[this.month] || 'Unknown';
  }

  getDays(): CalendarDay[] {
    return [...this.days];
  }

  getActivitiesForDate(date: Date): Activity[] {
    const day = this.days.find(d => d.getDate().isSameDay(DateTime.fromDate(date)));
    return day ? day.getActivities() : [];
  }

  getActiveDays(): number {
    return this.days.filter(day => day.hasActivities()).length;
  }

  getTotalActivities(): number {
    return this.days.reduce((total, day) => total + day.getActivityCount(), 0);
  }

  getTotalDistance(): Distance {
    const totalMeters = this.days
      .flatMap(day => day.getActivities())
      .reduce((total, activity) => total + activity.getDistance().getMeters(), 0);
    return Distance.fromMeters(totalMeters);
  }

  getTotalDuration(): Duration {
    const totalSeconds = this.days
      .flatMap(day => day.getActivities())
      .reduce((total, activity) => total + activity.getDuration().getSeconds(), 0);
    return Duration.fromSeconds(totalSeconds);
  }

  getTotalCalories(): Calories {
    const totalCalories = this.days
      .flatMap(day => day.getActivities())
      .reduce((total, activity) => total + activity.getCalories().getValue(), 0);
    return Calories.fromValue(totalCalories);
  }

  getAllActivities(): Activity[] {
    return this.days.flatMap(day => day.getActivities());
  }
}