# COROS Chrome Extension - Software Design Document

## 概述

基於 Clean Architecture 與 TypeScript 的詳細軟體設計規格，包含領域驅動設計、SOLID 原則實踐、與完整的類別設計與介面定義。

## 1. 系統概觀

### 1.1 系統目標
- 採用 Clean Architecture 實現可維護、可測試的架構
- 使用 TypeScript 提供型別安全與更好的開發體驗
- 實現領域驅動設計(DDD)的企業級應用架構
- 提供全面的測試覆蓋率與持續整合

### 1.2 核心技術棧
- **語言**: TypeScript 5.7+ with strict mode
- **架構**: Clean Architecture + Domain-Driven Design
- **測試**: Jest with BDD-style tests
- **建置**: esbuild + TypeScript compiler
- **品質**: ESLint + Prettier + TypeScript strict checking

## 2. 領域層詳細設計 (Domain Layer)

### 2.1 核心實體 (Entities)

```typescript
/**
 * 活動實體 - 核心業務物件
 * 包含豐富的業務行為與不變性保證
 */
class Activity {
  constructor(
    private readonly id: ActivityId,
    private readonly dateTime: DateTime,
    private readonly sportType: SportType,
    private readonly distance: Distance,
    private readonly duration: Duration,
    private readonly calories: Calories
  ) {
    this.validateInvariants();
  }

  // 業務邏輯方法
  isInMonth(year: number, month: number): boolean {
    return this.dateTime.getYear() === year && 
           this.dateTime.getMonth() === month;
  }

  isSameDate(other: Activity): boolean {
    return this.dateTime.isSameDate(other.dateTime);
  }

  calculatePace(): number {
    const distanceKm = this.distance.toKilometers();
    const durationMin = this.duration.toMinutes();
    
    if (distanceKm === 0) return 0;
    return durationMin / distanceKm; // 分鐘/公里
  }

  isRunning(): boolean {
    return this.sportType.isRunning();
  }

  isCycling(): boolean {
    return this.sportType.isCycling();
  }

  isSwimming(): boolean {
    return this.sportType.isSwimming();
  }

  // 不變性驗證
  private validateInvariants(): void {
    if (!this.id) throw new DomainError('Activity must have an ID');
    if (!this.dateTime) throw new DomainError('Activity must have a date');
    if (!this.sportType) throw new DomainError('Activity must have a sport type');
  }

  // 值物件存取器
  getId(): ActivityId { return this.id; }
  getDateTime(): DateTime { return this.dateTime; }
  getSportType(): SportType { return this.sportType; }
  getDistance(): Distance { return this.distance; }
  getDuration(): Duration { return this.duration; }
  getCalories(): Calories { return this.calories; }
}

/**
 * 日曆實體 - 管理特定月份的活動集合
 */
class Calendar {
  private readonly activities: Activity[];

  constructor(
    private readonly year: number,
    private readonly month: number,
    activities: Activity[]
  ) {
    this.validateInputs();
    this.activities = activities.filter(a => a.isInMonth(year, month));
  }

  getDaysInMonth(): number {
    return new Date(this.year, this.month + 1, 0).getDate();
  }

  getFirstDayOfWeek(): number {
    return new Date(this.year, this.month, 1).getDay();
  }

  getActivitiesForDate(date: number): Activity[] {
    const targetDate = new Date(this.year, this.month, date);
    return this.activities.filter(activity => 
      activity.getDateTime().isSameDate(DateTime.fromDate(targetDate))
    );
  }

  getAllActivities(): Activity[] {
    return [...this.activities];
  }

  getActivityCount(): number {
    return this.activities.length;
  }

  getActiveDays(): number {
    const uniqueDates = new Set(
      this.activities.map(a => a.getDateTime().getDate())
    );
    return uniqueDates.size;
  }

  private validateInputs(): void {
    if (this.year < 1900 || this.year > 2100) {
      throw new DomainError('Invalid year');
    }
    if (this.month < 0 || this.month > 11) {
      throw new DomainError('Invalid month');
    }
  }
}

/**
 * 統計實體 - 處理活動統計與分析
 */
class Statistics {
  private readonly activities: Activity[];
  private readonly period: { year: number; month: number };

  constructor(activities: Activity[], period: { year: number; month: number }) {
    this.activities = activities;
    this.period = period;
  }

  getTotalDistance(): Distance {
    return this.activities.reduce(
      (total, activity) => total.add(activity.getDistance()),
      new Distance(0)
    );
  }

  getTotalDuration(): Duration {
    return this.activities.reduce(
      (total, activity) => total.add(activity.getDuration()),
      new Duration(0)
    );
  }

  getTotalCalories(): Calories {
    return this.activities.reduce(
      (total, activity) => total.add(activity.getCalories()),
      new Calories(0)
    );
  }

  getActivityCount(): number {
    return this.activities.length;
  }

  getActiveDays(): number {
    const uniqueDates = new Set(
      this.activities.map(a => a.getDateTime().toDateString())
    );
    return uniqueDates.size;
  }

  getStatsBySportType(): Map<SportType, StatisticsSummary> {
    const statsMap = new Map<SportType, StatisticsSummary>();

    this.activities.forEach(activity => {
      const sportType = activity.getSportType();
      
      if (!statsMap.has(sportType)) {
        statsMap.set(sportType, new StatisticsSummary(sportType));
      }
      
      statsMap.get(sportType)!.addActivity(activity);
    });

    return statsMap;
  }

  getRunningStats(): StatisticsSummary {
    const runningActivities = this.activities.filter(a => a.isRunning());
    const summary = new StatisticsSummary(new SportType(100)); // 跑步
    runningActivities.forEach(activity => summary.addActivity(activity));
    return summary;
  }

  getCyclingStats(): StatisticsSummary {
    const cyclingActivities = this.activities.filter(a => a.isCycling());
    const summary = new StatisticsSummary(new SportType(200)); // 自行車
    cyclingActivities.forEach(activity => summary.addActivity(activity));
    return summary;
  }

  getSwimmingStats(): StatisticsSummary {
    const swimmingActivities = this.activities.filter(a => a.isSwimming());
    const summary = new StatisticsSummary(new SportType(300)); // 游泳
    swimmingActivities.forEach(activity => summary.addActivity(activity));
    return summary;
  }

  getAverageDistance(): Distance {
    if (this.activities.length === 0) return new Distance(0);
    return new Distance(this.getTotalDistance().toMeters() / this.activities.length);
  }

  getAverageDuration(): Duration {
    if (this.activities.length === 0) return new Duration(0);
    return new Duration(this.getTotalDuration().toSeconds() / this.activities.length);
  }
}

/**
 * 統計摘要 - 特定運動類型的統計資料
 */
class StatisticsSummary {
  private activities: Activity[] = [];

  constructor(private readonly sportType: SportType) {}

  addActivity(activity: Activity): void {
    if (!activity.getSportType().equals(this.sportType)) {
      throw new DomainError('Activity sport type does not match summary sport type');
    }
    this.activities.push(activity);
  }

  getCount(): number {
    return this.activities.length;
  }

  getTotalDistance(): Distance {
    return this.activities.reduce(
      (total, activity) => total.add(activity.getDistance()),
      new Distance(0)
    );
  }

  getTotalDuration(): Duration {
    return this.activities.reduce(
      (total, activity) => total.add(activity.getDuration()),
      new Duration(0)
    );
  }

  getTotalCalories(): Calories {
    return this.activities.reduce(
      (total, activity) => total.add(activity.getCalories()),
      new Calories(0)
    );
  }

  getAverageDistance(): Distance {
    if (this.activities.length === 0) return new Distance(0);
    return new Distance(this.getTotalDistance().toMeters() / this.activities.length);
  }

  getAverageDuration(): Duration {
    if (this.activities.length === 0) return new Duration(0);
    return new Duration(this.getTotalDuration().toSeconds() / this.activities.length);
  }

  getAveragePace(): number {
    if (this.activities.length === 0) return 0;
    const totalPace = this.activities.reduce((sum, activity) => sum + activity.calculatePace(), 0);
    return totalPace / this.activities.length;
  }

  getSportType(): SportType {
    return this.sportType;
  }

  getActivities(): Activity[] {
    return [...this.activities];
  }
}
```

### 2.2 值物件設計 (Value Objects)

```typescript
/**
 * 活動識別碼 - 唯一標識活動的值物件
 */
class ActivityId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new DomainError('Activity ID cannot be empty');
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: ActivityId): boolean {
    return this.value === other.value;
  }

  static fromString(value: string): ActivityId {
    return new ActivityId(value);
  }
}

/**
 * 日期時間值物件 - 處理日期與時間操作
 */
class DateTime {
  constructor(private readonly value: Date) {
    if (!value || isNaN(value.getTime())) {
      throw new DomainError('Invalid date time');
    }
  }

  toISOString(): string {
    return this.value.toISOString();
  }

  toDateString(): string {
    return this.value.toDateString();
  }

  getYear(): number {
    return this.value.getFullYear();
  }

  getMonth(): number {
    return this.value.getMonth();
  }

  getDate(): number {
    return this.value.getDate();
  }

  getDay(): number {
    return this.value.getDay();
  }

  isSameDate(other: DateTime): boolean {
    return this.toDateString() === other.toDateString();
  }

  isBefore(other: DateTime): boolean {
    return this.value.getTime() < other.value.getTime();
  }

  isAfter(other: DateTime): boolean {
    return this.value.getTime() > other.value.getTime();
  }

  addDays(days: number): DateTime {
    const newDate = new Date(this.value.getTime());
    newDate.setDate(newDate.getDate() + days);
    return new DateTime(newDate);
  }

  static fromDate(date: Date): DateTime {
    return new DateTime(new Date(date));
  }

  static fromString(dateString: string): DateTime {
    const date = new Date(dateString);
    return new DateTime(date);
  }

  static fromNumbers(year: number, month: number, day: number): DateTime {
    return new DateTime(new Date(year, month, day));
  }

  static now(): DateTime {
    return new DateTime(new Date());
  }
}

/**
 * 距離值物件 - 處理距離相關計算
 */
class Distance {
  constructor(private readonly meters: number) {
    if (meters < 0) {
      throw new DomainError('Distance cannot be negative');
    }
  }

  toMeters(): number {
    return this.meters;
  }

  toKilometers(): number {
    return this.meters / 1000;
  }

  toMiles(): number {
    return this.meters / 1609.344;
  }

  add(other: Distance): Distance {
    return new Distance(this.meters + other.meters);
  }

  subtract(other: Distance): Distance {
    const result = this.meters - other.meters;
    return new Distance(Math.max(0, result));
  }

  multiply(factor: number): Distance {
    if (factor < 0) {
      throw new DomainError('Distance factor cannot be negative');
    }
    return new Distance(this.meters * factor);
  }

  divide(divisor: number): Distance {
    if (divisor <= 0) {
      throw new DomainError('Distance divisor must be positive');
    }
    return new Distance(this.meters / divisor);
  }

  equals(other: Distance): boolean {
    return Math.abs(this.meters - other.meters) < 0.001; // 精確度到毫米
  }

  isGreaterThan(other: Distance): boolean {
    return this.meters > other.meters;
  }

  isLessThan(other: Distance): boolean {
    return this.meters < other.meters;
  }

  toString(): string {
    return `${this.toKilometers().toFixed(2)} km`;
  }

  static fromMeters(meters: number): Distance {
    return new Distance(meters);
  }

  static fromKilometers(kilometers: number): Distance {
    return new Distance(kilometers * 1000);
  }

  static fromMiles(miles: number): Distance {
    return new Distance(miles * 1609.344);
  }

  static zero(): Distance {
    return new Distance(0);
  }
}

/**
 * 時長值物件 - 處理時間長度計算
 */
class Duration {
  constructor(private readonly seconds: number) {
    if (seconds < 0) {
      throw new DomainError('Duration cannot be negative');
    }
  }

  toSeconds(): number {
    return this.seconds;
  }

  toMinutes(): number {
    return this.seconds / 60;
  }

  toHours(): number {
    return this.seconds / 3600;
  }

  add(other: Duration): Duration {
    return new Duration(this.seconds + other.seconds);
  }

  subtract(other: Duration): Duration {
    const result = this.seconds - other.seconds;
    return new Duration(Math.max(0, result));
  }

  multiply(factor: number): Duration {
    if (factor < 0) {
      throw new DomainError('Duration factor cannot be negative');
    }
    return new Duration(this.seconds * factor);
  }

  divide(divisor: number): Duration {
    if (divisor <= 0) {
      throw new DomainError('Duration divisor must be positive');
    }
    return new Duration(this.seconds / divisor);
  }

  equals(other: Duration): boolean {
    return Math.abs(this.seconds - other.seconds) < 1; // 精確度到秒
  }

  isGreaterThan(other: Duration): boolean {
    return this.seconds > other.seconds;
  }

  isLessThan(other: Duration): boolean {
    return this.seconds < other.seconds;
  }

  toString(): string {
    const hours = Math.floor(this.seconds / 3600);
    const minutes = Math.floor((this.seconds % 3600) / 60);
    const secs = this.seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  static fromSeconds(seconds: number): Duration {
    return new Duration(seconds);
  }

  static fromMinutes(minutes: number): Duration {
    return new Duration(minutes * 60);
  }

  static fromHours(hours: number): Duration {
    return new Duration(hours * 3600);
  }

  static fromString(timeString: string): Duration {
    const parts = timeString.split(':').map(Number);
    if (parts.length === 3) {
      const [hours, minutes, seconds] = parts;
      return new Duration(hours * 3600 + minutes * 60 + seconds);
    } else if (parts.length === 2) {
      const [minutes, seconds] = parts;
      return new Duration(minutes * 60 + seconds);
    } else {
      throw new DomainError('Invalid time format');
    }
  }

  static zero(): Duration {
    return new Duration(0);
  }
}

/**
 * 卡路里值物件 - 處理卡路里計算
 */
class Calories {
  constructor(private readonly value: number) {
    if (value < 0) {
      throw new DomainError('Calories cannot be negative');
    }
  }

  getValue(): number {
    return this.value;
  }

  add(other: Calories): Calories {
    return new Calories(this.value + other.value);
  }

  subtract(other: Calories): Calories {
    const result = this.value - other.value;
    return new Calories(Math.max(0, result));
  }

  multiply(factor: number): Calories {
    if (factor < 0) {
      throw new DomainError('Calories factor cannot be negative');
    }
    return new Calories(this.value * factor);
  }

  divide(divisor: number): Calories {
    if (divisor <= 0) {
      throw new DomainError('Calories divisor must be positive');
    }
    return new Calories(this.value / divisor);
  }

  equals(other: Calories): boolean {
    return Math.abs(this.value - other.value) < 0.1;
  }

  toString(): string {
    return `${this.value.toFixed(0)} cal`;
  }

  static fromValue(value: number): Calories {
    return new Calories(value);
  }

  static zero(): Calories {
    return new Calories(0);
  }
}

/**
 * 運動類型值物件 - 處理運動類型相關操作
 */
class SportType {
  private static readonly SPORT_TYPES = new Map<number, SportTypeInfo>([
    [100, { name: '跑步', icon: 'icon-outrun', color: 'rgb(248, 192, 50)', category: 'running' }],
    [103, { name: '田徑', icon: 'icon-groundrun', color: 'rgb(255, 99, 132)', category: 'running' }],
    [200, { name: '自行車', icon: 'icon-cycle', color: 'rgb(75, 192, 192)', category: 'cycling' }],
    [201, { name: '室內自行車', icon: 'icon-indoor_bike', color: 'rgb(75, 192, 192)', category: 'cycling' }],
    [300, { name: '游泳', icon: 'icon-poolswim', color: 'rgb(54, 162, 235)', category: 'swimming' }],
    [301, { name: '開放水域', icon: 'icon-openwater', color: 'rgb(0, 204, 204)', category: 'swimming' }],
    [400, { name: '有氧運動', icon: 'icon-Indoor_erobics', color: 'rgb(217, 46, 218)', category: 'fitness' }],
    [402, { name: '力量訓練', icon: 'icon-strength', color: 'rgb(153, 102, 255)', category: 'fitness' }],
    [10000, { name: '鐵人三項', icon: 'icon-triathlon', color: 'rgb(255, 159, 64)', category: 'triathlon' }],
  ]);

  constructor(private readonly code: number) {
    if (!SportType.SPORT_TYPES.has(code)) {
      throw new DomainError(`Unknown sport type code: ${code}`);
    }
  }

  getCode(): number {
    return this.code;
  }

  getName(): string {
    return SportType.SPORT_TYPES.get(this.code)?.name || '未知運動';
  }

  getIcon(): string {
    return SportType.SPORT_TYPES.get(this.code)?.icon || 'icon-other';
  }

  getColor(): string {
    return SportType.SPORT_TYPES.get(this.code)?.color || 'rgb(200, 200, 200)';
  }

  getCategory(): string {
    return SportType.SPORT_TYPES.get(this.code)?.category || 'other';
  }

  isRunning(): boolean {
    return this.getCategory() === 'running';
  }

  isCycling(): boolean {
    return this.getCategory() === 'cycling';
  }

  isSwimming(): boolean {
    return this.getCategory() === 'swimming';
  }

  isFitness(): boolean {
    return this.getCategory() === 'fitness';
  }

  isTriathlon(): boolean {
    return this.getCategory() === 'triathlon';
  }

  equals(other: SportType): boolean {
    return this.code === other.code;
  }

  toString(): string {
    return `${this.getName()} (${this.code})`;
  }

  static fromCode(code: number): SportType {
    return new SportType(code);
  }

  static getAllSportTypes(): SportType[] {
    return Array.from(SportType.SPORT_TYPES.keys()).map(code => new SportType(code));
  }

  static getSportTypesByCategory(category: string): SportType[] {
    return Array.from(SportType.SPORT_TYPES.entries())
      .filter(([_, info]) => info.category === category)
      .map(([code, _]) => new SportType(code));
  }
}

/**
 * 運動類型資訊介面
 */
interface SportTypeInfo {
  name: string;
  icon: string;
  color: string;
  category: string;
}
```

### 2.3 領域服務設計 (Domain Services)

```typescript
/**
 * 活動聚合服務 - 處理活動集合的業務邏輯
 */
class ActivityAggregationService {
  /**
   * 按日期分組活動
   */
  groupByDate(activities: Activity[]): Map<string, Activity[]> {
    const grouped = new Map<string, Activity[]>();
    
    activities.forEach(activity => {
      const dateKey = activity.getDateTime().toDateString();
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(activity);
    });
    
    return grouped;
  }

  /**
   * 按運動類型分組活動
   */
  groupBySportType(activities: Activity[]): Map<SportType, Activity[]> {
    const grouped = new Map<SportType, Activity[]>();
    
    activities.forEach(activity => {
      const sportType = activity.getSportType();
      const existingKey = Array.from(grouped.keys()).find(key => key.equals(sportType));
      
      if (existingKey) {
        grouped.get(existingKey)!.push(activity);
      } else {
        grouped.set(sportType, [activity]);
      }
    });
    
    return grouped;
  }

  /**
   * 按運動類別分組活動
   */
  groupByCategory(activities: Activity[]): Map<string, Activity[]> {
    const grouped = new Map<string, Activity[]>();
    
    activities.forEach(activity => {
      const category = activity.getSportType().getCategory();
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(activity);
    });
    
    return grouped;
  }

  /**
   * 篩選指定月份的活動
   */
  filterByMonth(activities: Activity[], year: number, month: number): Activity[] {
    return activities.filter(activity => activity.isInMonth(year, month));
  }

  /**
   * 篩選指定日期範圍的活動
   */
  filterByDateRange(activities: Activity[], startDate: DateTime, endDate: DateTime): Activity[] {
    return activities.filter(activity => {
      const activityDate = activity.getDateTime();
      return !activityDate.isBefore(startDate) && !activityDate.isAfter(endDate);
    });
  }

  /**
   * 篩選指定運動類型的活動
   */
  filterBySportType(activities: Activity[], sportType: SportType): Activity[] {
    return activities.filter(activity => activity.getSportType().equals(sportType));
  }

  /**
   * 篩選指定運動類別的活動
   */
  filterByCategory(activities: Activity[], category: string): Activity[] {
    return activities.filter(activity => activity.getSportType().getCategory() === category);
  }

  /**
   * 排序活動（按日期）
   */
  sortByDate(activities: Activity[], ascending: boolean = true): Activity[] {
    return [...activities].sort((a, b) => {
      const aTime = a.getDateTime().toISOString();
      const bTime = b.getDateTime().toISOString();
      return ascending ? aTime.localeCompare(bTime) : bTime.localeCompare(aTime);
    });
  }

  /**
   * 排序活動（按距離）
   */
  sortByDistance(activities: Activity[], ascending: boolean = true): Activity[] {
    return [...activities].sort((a, b) => {
      const aDistance = a.getDistance().toMeters();
      const bDistance = b.getDistance().toMeters();
      return ascending ? aDistance - bDistance : bDistance - aDistance;
    });
  }

  /**
   * 排序活動（按時長）
   */
  sortByDuration(activities: Activity[], ascending: boolean = true): Activity[] {
    return [...activities].sort((a, b) => {
      const aDuration = a.getDuration().toSeconds();
      const bDuration = b.getDuration().toSeconds();
      return ascending ? aDuration - bDuration : bDuration - aDuration;
    });
  }
}

/**
 * 統計計算服務 - 處理統計相關的業務邏輯
 */
class StatisticsCalculationService {
  /**
   * 計算月度統計
   */
  calculateMonthlyStats(activities: Activity[], year: number, month: number): Statistics {
    const monthlyActivities = activities.filter(activity => activity.isInMonth(year, month));
    return new Statistics(monthlyActivities, { year, month });
  }

  /**
   * 計算日平均數據
   */
  calculateDailyAverages(activities: Activity[]): DailyAverages {
    if (activities.length === 0) {
      return new DailyAverages(Distance.zero(), Duration.zero(), Calories.zero());
    }

    const totalDistance = activities.reduce((sum, activity) => sum.add(activity.getDistance()), Distance.zero());
    const totalDuration = activities.reduce((sum, activity) => sum.add(activity.getDuration()), Duration.zero());
    const totalCalories = activities.reduce((sum, activity) => sum.add(activity.getCalories()), Calories.zero());

    const dayCount = this.getActiveDayCount(activities);
    
    return new DailyAverages(
      totalDistance.divide(dayCount),
      totalDuration.divide(dayCount),
      totalCalories.divide(dayCount)
    );
  }

  /**
   * 計算週平均數據
   */
  calculateWeeklyAverages(activities: Activity[]): WeeklyAverages {
    const dailyAverages = this.calculateDailyAverages(activities);
    
    return new WeeklyAverages(
      dailyAverages.getDistance().multiply(7),
      dailyAverages.getDuration().multiply(7),
      dailyAverages.getCalories().multiply(7)
    );
  }

  /**
   * 計算配速統計
   */
  calculatePaceStats(activities: Activity[]): PaceStats {
    const runningActivities = activities.filter(activity => activity.isRunning());
    
    if (runningActivities.length === 0) {
      return new PaceStats(0, 0, 0);
    }

    const paces = runningActivities.map(activity => activity.calculatePace());
    const averagePace = paces.reduce((sum, pace) => sum + pace, 0) / paces.length;
    const bestPace = Math.min(...paces);
    const worstPace = Math.max(...paces);

    return new PaceStats(averagePace, bestPace, worstPace);
  }

  /**
   * 計算趨勢分析
   */
  calculateTrends(activities: Activity[]): TrendAnalysis {
    const sortedActivities = activities.sort((a, b) => 
      a.getDateTime().toISOString().localeCompare(b.getDateTime().toISOString())
    );

    // 計算距離趨勢
    const distanceTrend = this.calculateLinearTrend(
      sortedActivities.map(a => a.getDistance().toKilometers())
    );

    // 計算時長趨勢
    const durationTrend = this.calculateLinearTrend(
      sortedActivities.map(a => a.getDuration().toMinutes())
    );

    // 計算配速趨勢（僅跑步）
    const runningActivities = sortedActivities.filter(a => a.isRunning());
    const paceTrend = runningActivities.length > 0 ? 
      this.calculateLinearTrend(runningActivities.map(a => a.calculatePace())) : 0;

    return new TrendAnalysis(distanceTrend, durationTrend, paceTrend);
  }

  /**
   * 計算活動天數
   */
  private getActiveDayCount(activities: Activity[]): number {
    const uniqueDates = new Set(activities.map(activity => activity.getDateTime().toDateString()));
    return uniqueDates.size;
  }

  /**
   * 計算線性趨勢
   */
  private calculateLinearTrend(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }
}

/**
 * 日曆渲染服務 - 處理日曆相關的業務邏輯
 */
class CalendarRenderingService {
  /**
   * 生成日曆數據
   */
  generateCalendarData(year: number, month: number, activities: Activity[]): CalendarData {
    const calendar = new Calendar(year, month, activities);
    const daysInMonth = calendar.getDaysInMonth();
    const firstDayOfWeek = calendar.getFirstDayOfWeek();
    
    const days: CalendarDay[] = [];
    
    // 添加空白日期（月初前的空白）
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(new CalendarDay(0, []));
    }
    
    // 添加月份中的日期
    for (let day = 1; day <= daysInMonth; day++) {
      const dayActivities = calendar.getActivitiesForDate(day);
      days.push(new CalendarDay(day, dayActivities));
    }
    
    return new CalendarData(year, month, days, calendar.getActivityCount(), calendar.getActiveDays());
  }

  /**
   * 生成月份導航數據
   */
  generateMonthNavigation(currentYear: number, currentMonth: number): NavigationData {
    const currentDate = new Date(currentYear, currentMonth, 1);
    
    const previousMonth = new Date(currentYear, currentMonth - 1, 1);
    const nextMonth = new Date(currentYear, currentMonth + 1, 1);
    
    const monthNames = [
      '一月', '二月', '三月', '四月', '五月', '六月',
      '七月', '八月', '九月', '十月', '十一月', '十二月'
    ];
    
    return new NavigationData(
      monthNames[currentMonth],
      currentYear,
      previousMonth.getFullYear(),
      previousMonth.getMonth(),
      nextMonth.getFullYear(),
      nextMonth.getMonth()
    );
  }

  /**
   * 生成週視圖數據
   */
  generateWeekData(year: number, month: number, weekNumber: number, activities: Activity[]): WeekData {
    const startDate = this.getWeekStartDate(year, month, weekNumber);
    const endDate = startDate.addDays(6);
    
    const weekActivities = activities.filter(activity => {
      const activityDate = activity.getDateTime();
      return !activityDate.isBefore(startDate) && !activityDate.isAfter(endDate);
    });
    
    const days: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const date = startDate.addDays(i);
      const dayActivities = weekActivities.filter(activity => 
        activity.getDateTime().isSameDate(date)
      );
      days.push(new CalendarDay(date.getDate(), dayActivities));
    }
    
    return new WeekData(startDate, endDate, days);
  }

  /**
   * 獲取週開始日期
   */
  private getWeekStartDate(year: number, month: number, weekNumber: number): DateTime {
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay();
    const startDate = new Date(year, month, 1 - firstDayOfWeek + weekNumber * 7);
    return DateTime.fromDate(startDate);
  }
}

/**
 * 輔助類別定義
 */
class DailyAverages {
  constructor(
    private readonly distance: Distance,
    private readonly duration: Duration,
    private readonly calories: Calories
  ) {}

  getDistance(): Distance { return this.distance; }
  getDuration(): Duration { return this.duration; }
  getCalories(): Calories { return this.calories; }
}

class WeeklyAverages {
  constructor(
    private readonly distance: Distance,
    private readonly duration: Duration,
    private readonly calories: Calories
  ) {}

  getDistance(): Distance { return this.distance; }
  getDuration(): Duration { return this.duration; }
  getCalories(): Calories { return this.calories; }
}

class PaceStats {
  constructor(
    private readonly average: number,
    private readonly best: number,
    private readonly worst: number
  ) {}

  getAverage(): number { return this.average; }
  getBest(): number { return this.best; }
  getWorst(): number { return this.worst; }
}

class TrendAnalysis {
  constructor(
    private readonly distanceTrend: number,
    private readonly durationTrend: number,
    private readonly paceTrend: number
  ) {}

  getDistanceTrend(): number { return this.distanceTrend; }
  getDurationTrend(): number { return this.durationTrend; }
  getPaceTrend(): number { return this.paceTrend; }
}

class CalendarData {
  constructor(
    private readonly year: number,
    private readonly month: number,
    private readonly days: CalendarDay[],
    private readonly totalActivities: number,
    private readonly activeDays: number
  ) {}

  getYear(): number { return this.year; }
  getMonth(): number { return this.month; }
  getDays(): CalendarDay[] { return this.days; }
  getTotalActivities(): number { return this.totalActivities; }
  getActiveDays(): number { return this.activeDays; }
}

class CalendarDay {
  constructor(
    private readonly day: number,
    private readonly activities: Activity[]
  ) {}

  getDay(): number { return this.day; }
  getActivities(): Activity[] { return this.activities; }
  hasActivities(): boolean { return this.activities.length > 0; }
  getActivityCount(): number { return this.activities.length; }
  isEmpty(): boolean { return this.day === 0; }
}

class NavigationData {
  constructor(
    private readonly currentMonthName: string,
    private readonly currentYear: number,
    private readonly previousYear: number,
    private readonly previousMonth: number,
    private readonly nextYear: number,
    private readonly nextMonth: number
  ) {}

  getCurrentMonthName(): string { return this.currentMonthName; }
  getCurrentYear(): number { return this.currentYear; }
  getPreviousYear(): number { return this.previousYear; }
  getPreviousMonth(): number { return this.previousMonth; }
  getNextYear(): number { return this.nextYear; }
  getNextMonth(): number { return this.nextMonth; }
}

class WeekData {
  constructor(
    private readonly startDate: DateTime,
    private readonly endDate: DateTime,
    private readonly days: CalendarDay[]
  ) {}

  getStartDate(): DateTime { return this.startDate; }
  getEndDate(): DateTime { return this.endDate; }
  getDays(): CalendarDay[] { return this.days; }
}
```

## 3. 應用層設計 (Application Layer)

### 3.1 用例設計 (Use Cases)

```typescript
/**
 * 載入月度活動用例
 */
class LoadMonthlyActivitiesUseCase {
  constructor(
    private readonly activityRepository: ActivityRepository,
    private readonly cacheRepository: CacheRepository
  ) {}

  async execute(request: LoadMonthlyActivitiesRequest): Promise<LoadMonthlyActivitiesResponse> {
    const { year, month } = request;
    const isCurrentMonth = this.isCurrentMonth(year, month);
    
    // 快取策略：非當月資料優先使用快取
    if (!isCurrentMonth) {
      const cachedActivities = await this.cacheRepository.getActivities(year, month);
      if (cachedActivities) {
        return new LoadMonthlyActivitiesResponse(cachedActivities);
      }
    }
    
    // 從 API 載入活動資料
    const activities = await this.activityRepository.getActivitiesByMonth(year, month);
    
    // 儲存快取（非當月資料）
    if (!isCurrentMonth) {
      await this.cacheRepository.saveActivities(year, month, activities);
    }
    
    return new LoadMonthlyActivitiesResponse(activities);
  }

  private isCurrentMonth(year: number, month: number): boolean {
    const now = new Date();
    return year === now.getFullYear() && month === now.getMonth();
  }
}

/**
 * 顯示日曆用例
 */
class DisplayCalendarUseCase {
  constructor(
    private readonly loadActivitiesUseCase: LoadMonthlyActivitiesUseCase,
    private readonly calendarRenderingService: CalendarRenderingService
  ) {}

  async execute(request: DisplayCalendarRequest): Promise<DisplayCalendarResponse> {
    const { year, month } = request;
    
    // 載入活動資料
    const activitiesResponse = await this.loadActivitiesUseCase.execute(
      new LoadMonthlyActivitiesRequest(year, month)
    );
    
    // 生成日曆數據
    const calendarData = this.calendarRenderingService.generateCalendarData(
      year, month, activitiesResponse.getActivities()
    );
    
    // 生成導航數據
    const navigationData = this.calendarRenderingService.generateMonthNavigation(year, month);
    
    return new DisplayCalendarResponse(calendarData, navigationData);
  }
}

/**
 * 計算統計用例
 */
class CalculateStatisticsUseCase {
  constructor(
    private readonly statisticsCalculationService: StatisticsCalculationService,
    private readonly activityAggregationService: ActivityAggregationService
  ) {}

  async execute(request: CalculateStatisticsRequest): Promise<CalculateStatisticsResponse> {
    const { activities, year, month } = request;
    
    // 計算月度統計
    const monthlyStats = this.statisticsCalculationService.calculateMonthlyStats(activities, year, month);
    
    // 計算日平均
    const dailyAverages = this.statisticsCalculationService.calculateDailyAverages(activities);
    
    // 計算趨勢分析
    const trends = this.statisticsCalculationService.calculateTrends(activities);
    
    // 按運動類型分組
    const statsByType = monthlyStats.getStatsBySportType();
    
    return new CalculateStatisticsResponse(monthlyStats, dailyAverages, trends, statsByType);
  }
}
```

### 3.2 應用服務設計 (Application Services)

```typescript
/**
 * 活動應用服務
 */
class ActivityApplicationService {
  constructor(
    private readonly loadMonthlyActivitiesUseCase: LoadMonthlyActivitiesUseCase,
    private readonly calculateStatisticsUseCase: CalculateStatisticsUseCase
  ) {}

  async getMonthlyData(year: number, month: number): Promise<MonthlyDataViewModel> {
    // 載入活動資料
    const activitiesResponse = await this.loadMonthlyActivitiesUseCase.execute(
      new LoadMonthlyActivitiesRequest(year, month)
    );
    
    const activities = activitiesResponse.getActivities();
    
    // 計算統計
    const statisticsResponse = await this.calculateStatisticsUseCase.execute(
      new CalculateStatisticsRequest(activities, year, month)
    );
    
    return new MonthlyDataViewModel(
      activities,
      statisticsResponse.getMonthlyStats(),
      statisticsResponse.getDailyAverages(),
      statisticsResponse.getTrends(),
      statisticsResponse.getStatsByType()
    );
  }

  async getActivityDetails(activityId: string): Promise<ActivityDetailViewModel> {
    // 實現活動詳情查詢邏輯
    // 這裡可以添加活動詳情的業務邏輯
    throw new Error('Method not implemented');
  }
}

/**
 * 日曆應用服務
 */
class CalendarApplicationService {
  constructor(
    private readonly displayCalendarUseCase: DisplayCalendarUseCase,
    private readonly activityApplicationService: ActivityApplicationService
  ) {}

  async displayMonth(year: number, month: number): Promise<CalendarPageViewModel> {
    // 顯示日曆
    const calendarResponse = await this.displayCalendarUseCase.execute(
      new DisplayCalendarRequest(year, month)
    );
    
    // 獲取月度資料
    const monthlyData = await this.activityApplicationService.getMonthlyData(year, month);
    
    return new CalendarPageViewModel(
      calendarResponse.getCalendarData(),
      calendarResponse.getNavigationData(),
      monthlyData.getStatistics(),
      monthlyData.getTrends()
    );
  }

  async navigateToMonth(year: number, month: number): Promise<CalendarPageViewModel> {
    return await this.displayMonth(year, month);
  }
}
```

## 4. 基礎設施層設計 (Infrastructure Layer)

### 4.1 API 適配器

```typescript
/**
 * COROS API 適配器
 */
class CorosApiAdapter {
  constructor(private readonly baseUrl: string = 'https://teamapi.coros.com') {}

  async fetchActivities(token: string, page: number = 1, size: number = 300): Promise<ActivityDTO[]> {
    const url = `${this.baseUrl}/activity/query?size=${size}&pageNumber=${page}&modeList=`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'accesstoken': token,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new ApiError(`Failed to fetch activities: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.data || !data.data.dataList) {
        throw new ApiError('Invalid API response format');
      }

      return data.data.dataList;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(`Network error: ${error.message}`);
    }
  }

  async checkConnection(token: string): Promise<boolean> {
    try {
      await this.fetchActivities(token, 1, 1);
      return true;
    } catch {
      return false;
    }
  }
}
```

### 4.2 儲存庫實作

```typescript
/**
 * 活動儲存庫實作
 */
class ActivityRepositoryImpl implements ActivityRepository {
  constructor(
    private readonly apiAdapter: CorosApiAdapter,
    private readonly authService: AuthService,
    private readonly logger: Logger
  ) {}

  async getActivitiesByMonth(year: number, month: number): Promise<Activity[]> {
    try {
      const token = await this.authService.getToken();
      if (!token) {
        throw new InfrastructureError('Authentication token not found');
      }

      const dtos = await this.apiAdapter.fetchActivities(token);
      const activities = dtos.map(dto => this.mapToActivity(dto));
      
      // 篩選指定月份的活動
      const filteredActivities = activities.filter(activity => activity.isInMonth(year, month));
      
      this.logger.info(`Loaded ${filteredActivities.length} activities for ${year}-${month + 1}`);
      
      return filteredActivities;
    } catch (error) {
      this.logger.error('Failed to load activities', error);
      throw new InfrastructureError(`Failed to load activities: ${error.message}`);
    }
  }

  private mapToActivity(dto: ActivityDTO): Activity {
    try {
      return new Activity(
        ActivityId.fromString(dto.id),
        DateTime.fromString(this.formatDate(dto.date)),
        SportType.fromCode(dto.sportType),
        Distance.fromMeters(dto.distance),
        Duration.fromSeconds(dto.totalTime),
        Calories.fromValue(dto.calories)
      );
    } catch (error) {
      throw new InfrastructureError(`Failed to map activity DTO: ${error.message}`);
    }
  }

  private formatDate(dateNum: number): string {
    const str = dateNum.toString();
    return `${str.slice(0, 4)}-${str.slice(4, 6)}-${str.slice(6, 8)}`;
  }
}
```

## 5. 表現層設計 (Presentation Layer)

### 5.1 內容腳本控制器

```typescript
/**
 * 內容腳本控制器
 */
class ContentScriptController {
  private currentYear: number;
  private currentMonth: number;

  constructor(
    private readonly calendarApplicationService: CalendarApplicationService,
    private readonly dependencyContainer: DependencyContainer
  ) {
    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth();
  }

  async initialize(): Promise<void> {
    try {
      await this.injectCalendarTab();
      await this.setupEventListeners();
      await this.displayCurrentMonth();
    } catch (error) {
      console.error('Failed to initialize content script:', error);
    }
  }

  private async injectCalendarTab(): Promise<void> {
    const tabContainer = document.querySelector('.arco-tabs-nav-tab-list');
    if (!tabContainer) {
      throw new Error('Tab container not found');
    }

    const calendarTab = this.createCalendarTab();
    tabContainer.appendChild(calendarTab);
  }

  private async setupEventListeners(): Promise<void> {
    // 月份導航按鈕
    document.addEventListener('click', async (event) => {
      const target = event.target as HTMLElement;
      
      if (target.id === 'monthPrevBtn') {
        await this.navigateToPreviousMonth();
      } else if (target.id === 'monthNextBtn') {
        await this.navigateToNextMonth();
      }
    });

    // Tab 切換
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains('calendar-tab')) {
        this.showCalendarContent();
      }
    });
  }

  private async displayCurrentMonth(): Promise<void> {
    await this.displayMonth(this.currentYear, this.currentMonth);
  }

  private async navigateToPreviousMonth(): Promise<void> {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
    await this.displayMonth(this.currentYear, this.currentMonth);
  }

  private async navigateToNextMonth(): Promise<void> {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
    await this.displayMonth(this.currentYear, this.currentMonth);
  }

  private async displayMonth(year: number, month: number): Promise<void> {
    try {
      const viewModel = await this.calendarApplicationService.displayMonth(year, month);
      this.renderCalendarView(viewModel);
    } catch (error) {
      console.error('Failed to display month:', error);
      this.showErrorMessage('載入月度資料失敗');
    }
  }

  private renderCalendarView(viewModel: CalendarPageViewModel): void {
    const container = document.getElementById('calendar-content');
    if (!container) return;

    container.innerHTML = this.buildCalendarHtml(viewModel);
  }

  private buildCalendarHtml(viewModel: CalendarPageViewModel): string {
    // 實現 HTML 生成邏輯
    return `
      <div class="coros-calendar-container">
        ${this.buildNavigationHtml(viewModel.getNavigationData())}
        ${this.buildCalendarGridHtml(viewModel.getCalendarData())}
        ${this.buildStatisticsHtml(viewModel.getStatistics())}
      </div>
    `;
  }

  private buildNavigationHtml(navigationData: NavigationData): string {
    return `
      <div class="arco-btn-group mx-16">
        <button id="monthPrevBtn" class="arco-btn arco-btn-secondary">
          <span class="iconfont iconxiangzuo"></span>
        </button>
        <h2 id="currentMonth" class="text-2xl font-semibold mx-4">
          ${navigationData.getCurrentMonthName()} ${navigationData.getCurrentYear()}
        </h2>
        <button id="monthNextBtn" class="arco-btn arco-btn-secondary">
          <span class="iconfont iconxiangyou"></span>
        </button>
      </div>
    `;
  }

  private buildCalendarGridHtml(calendarData: CalendarData): string {
    // 實現日曆格線 HTML 生成
    return '<div class="coros-calendar-grid"><!-- 日曆格線內容 --></div>';
  }

  private buildStatisticsHtml(statistics: Statistics): string {
    // 實現統計 HTML 生成
    return '<div class="coros-statistics"><!-- 統計內容 --></div>';
  }

  private createCalendarTab(): HTMLElement {
    const tab = document.createElement('div');
    tab.className = 'arco-tabs-nav-tab calendar-tab';
    tab.innerHTML = '<div class="arco-tabs-nav-tab-title">日曆總覽</div>';
    return tab;
  }

  private showCalendarContent(): void {
    // 顯示日曆內容，隱藏其他 Tab 內容
    const allTabPanes = document.querySelectorAll('.arco-tabs-content-pane');
    allTabPanes.forEach(pane => (pane as HTMLElement).style.display = 'none');
    
    const calendarPane = document.getElementById('calendar-pane');
    if (calendarPane) {
      calendarPane.style.display = 'block';
    }
  }

  private showErrorMessage(message: string): void {
    const container = document.getElementById('calendar-content');
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <p>${message}</p>
        </div>
      `;
    }
  }
}
```

## 6. 錯誤處理與日誌記錄

```typescript
/**
 * 領域錯誤
 */
class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

/**
 * 基礎設施錯誤
 */
class InfrastructureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InfrastructureError';
  }
}

/**
 * API 錯誤
 */
class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 日誌記錄器
 */
class Logger {
  info(message: string, data?: any): void {
    console.info(`[INFO] ${message}`, data);
  }

  error(message: string, error?: Error): void {
    console.error(`[ERROR] ${message}`, error);
  }

  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data);
    }
  }
}
```

---

**文件版本**: 2.0  
**建立日期**: 2025-06-06  
**最後更新**: 2025-07-18  
**技術棧**: TypeScript + Clean Architecture + Domain-Driven Design
