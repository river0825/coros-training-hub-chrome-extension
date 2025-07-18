import { Statistics } from '@domain/entities/Statistics';
import { StatisticsCalculationService, TimePeriod } from '@domain/services/StatisticsCalculationService';
import { ActivityAggregationService } from '@domain/services/ActivityAggregationService';
import { ActivityRepository } from '@domain/repositories/ActivityRepository';
import { CalculateStatisticsRequest } from '@shared/types/DTOs';
import { StatisticsViewModel } from '@shared/types/ViewModels';

// Calculate Statistics Use Case
export class CalculateStatisticsUseCase {
  constructor(
    private readonly statisticsCalculationService: StatisticsCalculationService,
    private readonly activityAggregationService: ActivityAggregationService,
    private readonly activityRepository: ActivityRepository
  ) {}

  async execute(request: CalculateStatisticsRequest): Promise<StatisticsViewModel> {
    const { year, month } = request;
    
    // Load activities for the month
    const activities = await this.activityRepository.findByMonth(year, month);
    
    // Calculate statistics
    const monthlyTotals = this.activityAggregationService.calculateMonthlyTotals(activities);
    const sportStats = this.statisticsCalculationService.calculateSportStats(activities);
    const averages = this.statisticsCalculationService.calculateAverages(activities);
    
    // Create time period for insights
    const timePeriod: TimePeriod = {
      start: new Date(year, month, 1),
      end: new Date(year, month + 1, 0),
      type: 'month'
    };
    
    const insights = this.statisticsCalculationService.calculateInsights(activities, timePeriod);
    
    // Create statistics entity
    const statistics = new Statistics(activities, {
      getTotalActivities: () => monthlyTotals.totalActivities,
      getTotalDistance: () => monthlyTotals.totalDistance,
      getTotalDuration: () => monthlyTotals.totalDuration,
      getTotalCalories: () => monthlyTotals.totalCalories,
      getActiveDays: () => monthlyTotals.activeDays,
      getAverageDistance: () => averages.averageDistance,
      getAverageDuration: () => averages.averageDuration
    } as any, sportStats, insights);
    
    // Convert to view model
    return this.mapToViewModel(statistics, year, month);
  }

  private mapToViewModel(statistics: Statistics, year: number, month: number): StatisticsViewModel {
    const monthlyStats = statistics.getMonthlyStats();
    
    return {
      period: `${year}-${String(month + 1).padStart(2, '0')}`,
      overall: {
        totalActivities: monthlyStats.getTotalActivities(),
        totalDistance: monthlyStats.getTotalDistance().toString(),
        totalDuration: monthlyStats.getTotalDuration().toString(),
        totalCalories: monthlyStats.getTotalCalories().toString(),
        activeDays: monthlyStats.getActiveDays()
      },
      bySport: statistics.getSportStats().map(sportStat => ({
        sportType: sportStat.getSportType().getName(),
        icon: sportStat.getSportType().getIcon(),
        color: sportStat.getSportType().getColor(),
        count: sportStat.getActivityCount(),
        distance: sportStat.getTotalDistance().toString(),
        duration: sportStat.getTotalDuration().toString(),
        calories: sportStat.getTotalCalories().toString(),
        averageDistance: sportStat.getAverageDistance().toString(),
        averageDuration: sportStat.getAverageDuration().toString()
      })),
      insights: statistics.getInsights().map(insight => ({
        message: insight.getMessage(),
        type: insight.getType()
      })),
      averages: {
        averageDistance: monthlyStats.getAverageDistance().toString(),
        averageDuration: monthlyStats.getAverageDuration().toString(),
        averageCalories: '0 cal', // Will be calculated from monthly stats
        averageActivitiesPerDay: monthlyStats.getTotalActivities() / Math.max(monthlyStats.getActiveDays(), 1)
      }
    };
  }
}