import { StatisticsViewModel } from '@shared/types/ViewModels';
import { CalculateStatisticsUseCase } from '../use-cases/CalculateStatisticsUseCase';

// Statistics Application Service
export class StatisticsApplicationService {
  constructor(
    private readonly calculateStatisticsUseCase: CalculateStatisticsUseCase
  ) {}

  async calculateMonthlyStatistics(year: number, month: number): Promise<StatisticsViewModel> {
    return await this.calculateStatisticsUseCase.execute({ year, month });
  }

  async calculateCurrentMonthStatistics(): Promise<StatisticsViewModel> {
    const now = new Date();
    return await this.calculateStatisticsUseCase.execute({
      year: now.getFullYear(),
      month: now.getMonth()
    });
  }

  async calculateYearToDateStatistics(year: number): Promise<StatisticsViewModel> {
    // This would aggregate statistics across all months in the year
    // For now, we'll just return current month statistics
    const now = new Date();
    return await this.calculateStatisticsUseCase.execute({
      year,
      month: now.getMonth()
    });
  }
}