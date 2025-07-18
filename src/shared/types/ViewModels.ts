// View Models for UI presentation
export interface CalendarViewModel {
  year: number;
  month: number;
  monthName: string;
  days: CalendarDayViewModel[];
  summary: CalendarSummaryViewModel;
}

export interface CalendarDayViewModel {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  activities: ActivityViewModel[];
}

export interface ActivityViewModel {
  id: string;
  name: string;
  sportType: SportTypeViewModel;
  duration: string;
  distance: string;
  startTime: string;
  calories: string;
  pace?: string;
}

export interface SportTypeViewModel {
  name: string;
  icon: string;
  color: string;
  category: string;
}

export interface CalendarSummaryViewModel {
  totalActivities: number;
  totalDistance: string;
  totalDuration: string;
  totalCalories: string;
  activeDays: number;
}

export interface StatisticsViewModel {
  period: string;
  overall: OverallStatsViewModel;
  bySport: SportStatsViewModel[];
  insights: InsightViewModel[];
  averages: AveragesViewModel;
}

export interface OverallStatsViewModel {
  totalActivities: number;
  totalDistance: string;
  totalDuration: string;
  totalCalories: string;
  activeDays: number;
}

export interface SportStatsViewModel {
  sportType: string;
  icon: string;
  color: string;
  count: number;
  distance: string;
  duration: string;
  calories: string;
  averageDistance: string;
  averageDuration: string;
}

export interface InsightViewModel {
  message: string;
  type: 'positive' | 'neutral' | 'negative';
}

export interface AveragesViewModel {
  averageDistance: string;
  averageDuration: string;
  averageCalories: string;
  averageActivitiesPerDay: number;
}

// Extension state
export interface ExtensionState {
  isInitialized: boolean;
  currentView: 'calendar' | 'statistics';
  currentDate: Date;
  isLoading: boolean;
}