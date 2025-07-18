import { Calendar } from '@domain/entities/Calendar';
import { CalendarRenderingService } from '@domain/services/CalendarRenderingService';
import { ActivityRepository } from '@domain/repositories/ActivityRepository';
import { DisplayCalendarRequest } from '@shared/types/DTOs';
import { CalendarViewModel } from '@shared/types/ViewModels';

// Display Calendar Use Case
export class DisplayCalendarUseCase {
  constructor(
    private readonly calendarRenderingService: CalendarRenderingService,
    private readonly activityRepository: ActivityRepository
  ) {}

  async execute(request: DisplayCalendarRequest): Promise<CalendarViewModel> {
    const { year, month } = request;
    
    // Load activities for the month
    const activities = await this.activityRepository.findByMonth(year, month);
    
    // Create calendar with activities
    const calendar = this.calendarRenderingService.createCalendar(year, month, activities);
    
    // Convert to view model
    return this.mapToViewModel(calendar);
  }

  private mapToViewModel(calendar: Calendar): CalendarViewModel {
    return {
      year: calendar.getYear(),
      month: calendar.getMonth(),
      monthName: calendar.getMonthName(),
      days: calendar.getDays().map(day => ({
        date: day.getDayNumber(),
        isCurrentMonth: day.isCurrentMonth(),
        isToday: day.isToday(),
        activities: day.getActivities().map(activity => ({
          id: activity.getId().toString(),
          name: activity.getName(),
          sportType: {
            name: activity.getSportType().getName(),
            icon: activity.getSportType().getIcon(),
            color: activity.getSportType().getColor(),
            category: activity.getSportType().getCategory()
          },
          duration: activity.getDuration().toString(),
          distance: activity.getDistance().toString(),
          startTime: activity.getStartTime().toISOString(),
          calories: activity.getCalories().toString(),
          pace: activity.hasValidDistance() ? activity.calculatePace().toString() : undefined
        }))
      })),
      summary: {
        totalActivities: calendar.getTotalActivities(),
        totalDistance: calendar.getTotalDistance().toString(),
        totalDuration: calendar.getTotalDuration().toString(),
        totalCalories: calendar.getTotalCalories().toString(),
        activeDays: calendar.getActiveDays()
      }
    };
  }
}