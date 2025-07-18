// DTOs for external API communication
export interface CorosActivityDto {
  labelId: string;
  name: string;
  sportType: number;
  date: number; // YYYYMMDD format
  startTime: number; // Unix timestamp
  distance: number; // meters
  workoutTime: number; // seconds
  calorie: number;
  device?: string;
  avgHr?: number;
  avgSpeed?: number;
}

// Request/Response DTOs
export interface LoadMonthlyActivitiesRequest {
  year: number;
  month: number;
}

export interface LoadMonthlyActivitiesResponse {
  activities: CorosActivityDto[];
  cached: boolean;
  timestamp: number;
}

export interface DisplayCalendarRequest {
  year: number;
  month: number;
}

export interface CalculateStatisticsRequest {
  year: number;
  month: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}