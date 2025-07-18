import { Activity } from '../entities/Activity';
import { Calendar, CalendarDay } from '../entities/Calendar';
import { DateTime } from '../value-objects/DateTime';

// Calendar rendering service interface
export interface CalendarRenderingService {
  generateCalendarDays(year: number, month: number): CalendarDay[];
  mapActivitiesToDays(activities: Activity[], days: CalendarDay[]): CalendarDay[];
  createCalendar(year: number, month: number, activities: Activity[]): Calendar;
}

// Calendar rendering service implementation
export class CalendarRenderingServiceImpl implements CalendarRenderingService {
  generateCalendarDays(year: number, month: number): CalendarDay[] {
    const days: CalendarDay[] = [];
    const today = new Date();
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    
    // Add days from previous month to fill the first week
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonthLastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
    
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(prevYear, prevMonth, prevMonthLastDay - i);
      const dateTime = DateTime.fromDate(date);
      const isToday = this.isSameDay(date, today);
      
      days.push(new CalendarDay(dateTime, [], false, isToday));
    }
    
    // Add days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateTime = DateTime.fromDate(date);
      const isToday = this.isSameDay(date, today);
      
      days.push(new CalendarDay(dateTime, [], true, isToday));
    }
    
    // Add days from next month to fill the last week
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(nextYear, nextMonth, day);
      const dateTime = DateTime.fromDate(date);
      const isToday = this.isSameDay(date, today);
      
      days.push(new CalendarDay(dateTime, [], false, isToday));
    }
    
    return days;
  }

  mapActivitiesToDays(activities: Activity[], days: CalendarDay[]): CalendarDay[] {
    const updatedDays: CalendarDay[] = [];
    
    days.forEach(day => {
      const dayActivities = activities.filter(activity => 
        activity.isOnDate(day.getDate().toDate())
      );
      
      updatedDays.push(new CalendarDay(
        day.getDate(),
        dayActivities,
        day.isCurrentMonth(),
        day.isToday()
      ));
    });
    
    return updatedDays;
  }

  createCalendar(year: number, month: number, activities: Activity[]): Calendar {
    const days = this.generateCalendarDays(year, month);
    const daysWithActivities = this.mapActivitiesToDays(activities, days);
    
    return new Calendar(year, month, daysWithActivities);
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
}