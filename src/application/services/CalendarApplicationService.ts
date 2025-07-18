import { CalendarViewModel } from '@shared/types/ViewModels';
import { DisplayCalendarUseCase } from '../use-cases/DisplayCalendarUseCase';

// Navigate Calendar Use Case
export class NavigateCalendarUseCase {
  constructor(
    private readonly displayCalendarUseCase: DisplayCalendarUseCase
  ) {}

  async execute(currentYear: number, currentMonth: number, direction: 'previous' | 'next'): Promise<CalendarViewModel> {
    let newYear = currentYear;
    let newMonth = currentMonth;

    if (direction === 'previous') {
      newMonth -= 1;
      if (newMonth < 0) {
        newMonth = 11;
        newYear -= 1;
      }
    } else {
      newMonth += 1;
      if (newMonth > 11) {
        newMonth = 0;
        newYear += 1;
      }
    }

    return await this.displayCalendarUseCase.execute({
      year: newYear,
      month: newMonth
    });
  }
}

// Calendar Application Service
export class CalendarApplicationService {
  constructor(
    private readonly displayCalendarUseCase: DisplayCalendarUseCase,
    private readonly navigateCalendarUseCase: NavigateCalendarUseCase
  ) {}

  async displayCalendar(year: number, month: number): Promise<CalendarViewModel> {
    return await this.displayCalendarUseCase.execute({ year, month });
  }

  async navigateToMonth(currentYear: number, currentMonth: number, direction: 'previous' | 'next'): Promise<CalendarViewModel> {
    return await this.navigateCalendarUseCase.execute(currentYear, currentMonth, direction);
  }

  async goToCurrentMonth(): Promise<CalendarViewModel> {
    const now = new Date();
    return await this.displayCalendarUseCase.execute({
      year: now.getFullYear(),
      month: now.getMonth()
    });
  }
}