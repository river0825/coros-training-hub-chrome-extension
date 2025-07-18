# Design Document

## Overview

This document outlines the design for refactoring the COROS Activity Calendar Chrome extension from JavaScript to TypeScript with clean architecture and domain-driven design principles. The refactor will implement BDD (Behavior-Driven Development), follow SOLID principles, and use TIDY First methodology to ensure incremental improvement without breaking existing functionality. The design maintains all existing user features while improving code maintainability, testability, and scalability through proper architectural patterns and comprehensive dependency injection.

## Architecture

### Clean Architecture Layers

The refactored application will follow clean architecture with four distinct layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  (UI Components, Chrome Extension APIs, Event Handlers)     │
├─────────────────────────────────────────────────────────────┤
│                       ↓                                     │
│                    Application Layer                        │
│     (Use Cases, Application Services, Orchestration)       │
├─────────────────────────────────────────────────────────────┤
│                       ↓                                     │
│                      Domain Layer                           │
│   (Entities, Value Objects, Domain Services, Interfaces)   │
├─────────────────────────────────────────────────────────────┤
│                       ↑                                     │
│                   Infrastructure Layer                      │
│  (External APIs, Storage, Chrome APIs, Concrete Adapters)  │
└─────────────────────────────────────────────────────────────┘
```

Note: The arrows indicate dependency direction. The Infrastructure Layer depends on the Domain Layer (implements interfaces defined in the Domain), not the other way around. This is a key aspect of clean architecture and the Dependency Inversion Principle.

### Dependency Flow

- **Presentation Layer** depends on **Application Layer**
- **Application Layer** depends on **Domain Layer**
- **Infrastructure Layer** depends on **Domain Layer**
- **Domain Layer** has no dependencies (pure business logic)

### SOLID Principles Implementation

The architecture explicitly implements SOLID principles:

**Single Responsibility Principle (SRP)**: Each class has one reason to change
- `Activity` entity only handles activity-related business logic
- `CalendarComponent` only handles calendar UI rendering
- `CorosApiAdapter` only handles COROS API communication

**Open/Closed Principle (OCP)**: Open for extension, closed for modification
- New sport types can be added without modifying existing `SportType` logic
- New statistics calculations can be added by implementing `StatisticsCalculationService`
- New storage mechanisms can be added by implementing `CacheRepository`

**Liskov Substitution Principle (LSP)**: Derived classes are substitutable
- Any implementation of `ActivityRepository` can replace another
- All `SportType` instances behave consistently regardless of sport code
- Mock implementations in tests behave identically to production implementations

**Interface Segregation Principle (ISP)**: Focused, client-specific interfaces
- `ActivityRepository` only exposes activity-related methods
- `CacheRepository` only exposes caching operations
- UI components only depend on the application services they actually use

**Dependency Inversion Principle (DIP)**: Depend on abstractions, not concretions
- Application layer depends on domain interfaces, not infrastructure implementations
- Use cases receive repository interfaces through constructor injection
- High-level modules (use cases) don't depend on low-level modules (API adapters)

## Components and Interfaces

### Domain Layer

#### Entities

```typescript
// Core business entities representing the main concepts
class Activity {
  constructor(
    private readonly id: ActivityId,
    private readonly name: string,
    private readonly sportType: SportType,
    private readonly startTime: DateTime,
    private readonly duration: Duration,
    private readonly distance: Distance,
    private readonly calories: Calories
  ) {}
  
  // Business methods
  isOnDate(date: Date): boolean
  calculatePace(): Pace
  isSameType(other: Activity): boolean
}

class Calendar {
  constructor(
    private readonly year: number,
    private readonly month: number,
    private activities: Activity[]
  ) {}
  
  // Business methods
  getActivitiesForDate(date: Date): Activity[]
  getActiveDays(): number
  getTotalDistance(): Distance
  getTotalDuration(): Duration
}

class Statistics {
  constructor(private readonly activities: Activity[]) {}
  
  // Business methods
  calculateByMonth(year: number, month: number): MonthlyStats
  calculateBySport(): SportStats[]
  calculateInsights(): Insight[]
}
```

#### Value Objects

```typescript
// Immutable value objects representing domain concepts
class ActivityId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Activity ID cannot be empty');
    }
  }
  
  toString(): string { return this.value; }
  equals(other: ActivityId): boolean { return this.value === other.value; }
}

class SportType {
  constructor(
    private readonly code: number,
    private readonly name: string,
    private readonly category: SportCategory
  ) {}
  
  static fromCode(code: number): SportType
  isRunning(): boolean
  isCycling(): boolean
  isSwimming(): boolean
}

class Duration {
  constructor(private readonly seconds: number) {
    if (seconds < 0) throw new Error('Duration cannot be negative');
  }
  
  toHours(): number
  toMinutes(): number
  toString(): string
  add(other: Duration): Duration
}

class Distance {
  constructor(private readonly meters: number) {
    if (meters < 0) throw new Error('Distance cannot be negative');
  }
  
  toKilometers(): number
  toMiles(): number
  toString(): string
  add(other: Distance): Distance
}

class DateTime {
  constructor(private readonly date: Date) {}
  
  toISOString(): string
  isSameDay(other: DateTime): boolean
  getYear(): number
  getMonth(): number
  getDay(): number
}
```

#### Domain Services

```typescript
// Services that contain domain logic not belonging to entities
interface ActivityAggregationService {
  groupByDate(activities: Activity[]): Map<string, Activity[]>
  groupBySport(activities: Activity[]): Map<SportType, Activity[]>
  calculateMonthlyTotals(activities: Activity[]): MonthlyTotals
}

interface StatisticsCalculationService {
  calculateInsights(activities: Activity[], period: TimePeriod): Insight[]
  calculateTrends(activities: Activity[]): Trend[]
  calculateAverages(activities: Activity[]): ActivityAverages
}

interface CalendarRenderingService {
  generateCalendarDays(year: number, month: number): CalendarDay[]
  mapActivitiesToDays(activities: Activity[], days: CalendarDay[]): CalendarDay[]
}
```

#### Repository Interfaces

```typescript
// Interfaces for data access (implemented in infrastructure layer)
interface ActivityRepository {
  findByMonth(year: number, month: number): Promise<Activity[]>
  save(activities: Activity[]): Promise<void>
  findById(id: ActivityId): Promise<Activity | null>
  clear(): Promise<void>
}

interface CacheRepository {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  remove(key: string): Promise<void>
  clear(): Promise<void>
}

interface ConfigurationRepository {
  getSportTypeMapping(): Promise<Map<number, SportType>>
  getCacheSettings(): Promise<CacheSettings>
  getUserPreferences(): Promise<UserPreferences>
}
```

### Application Layer

#### Use Cases

```typescript
// Use cases orchestrate domain objects and coordinate with infrastructure
class LoadMonthlyActivitiesUseCase {
  constructor(
    private readonly activityRepository: ActivityRepository,
    private readonly corosApiService: CorosApiService,
    private readonly cacheRepository: CacheRepository
  ) {}
  
  async execute(request: LoadMonthlyActivitiesRequest): Promise<LoadMonthlyActivitiesResponse> {
    // 1. Check cache for non-current months
    // 2. Fetch from API if needed
    // 3. Transform to domain objects
    // 4. Cache results
    // 5. Return activities
  }
}

class DisplayCalendarUseCase {
  constructor(
    private readonly calendarRenderingService: CalendarRenderingService,
    private readonly activityAggregationService: ActivityAggregationService
  ) {}
  
  async execute(request: DisplayCalendarRequest): Promise<DisplayCalendarResponse> {
    // 1. Load activities for month
    // 2. Generate calendar structure
    // 3. Map activities to calendar days
    // 4. Return calendar view model
  }
}

class CalculateStatisticsUseCase {
  constructor(
    private readonly statisticsCalculationService: StatisticsCalculationService,
    private readonly activityAggregationService: ActivityAggregationService
  ) {}
  
  async execute(request: CalculateStatisticsRequest): Promise<CalculateStatisticsResponse> {
    // 1. Load activities for period
    // 2. Calculate statistics
    // 3. Generate insights
    // 4. Return statistics view model
  }
}
```

#### Application Services

```typescript
// Application services coordinate multiple use cases
class ActivityApplicationService {
  constructor(
    private readonly loadActivitiesUseCase: LoadMonthlyActivitiesUseCase,
    private readonly refreshActivitiesUseCase: RefreshActivitiesUseCase
  ) {}
  
  async loadActivitiesForMonth(year: number, month: number): Promise<Activity[]>
  async refreshCurrentMonth(): Promise<Activity[]>
}

class CalendarApplicationService {
  constructor(
    private readonly displayCalendarUseCase: DisplayCalendarUseCase,
    private readonly navigateCalendarUseCase: NavigateCalendarUseCase
  ) {}
  
  async displayCalendar(year: number, month: number): Promise<CalendarViewModel>
  async navigateToMonth(direction: 'previous' | 'next'): Promise<CalendarViewModel>
}

class StatisticsApplicationService {
  constructor(
    private readonly calculateStatisticsUseCase: CalculateStatisticsUseCase
  ) {}
  
  async calculateMonthlyStatistics(year: number, month: number): Promise<StatisticsViewModel>
}
```

### Infrastructure Layer

#### External API Adapters

```typescript
// Adapters for external services
class CorosApiAdapter implements CorosApiService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly authenticationService: AuthenticationService
  ) {}
  
  async fetchActivities(year: number, month: number): Promise<CorosActivityDto[]> {
    const token = await this.authenticationService.getToken()
    const response = await this.httpClient.get('/activity/query', {
      headers: { accesstoken: token },
      params: { startDay: this.formatDate(year, month, 1), endDay: this.formatDate(year, month, 31) }
    })
    return response.data.dataList
  }
}

class ChromeStorageAdapter implements CacheRepository {
  async get<T>(key: string): Promise<T | null> {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] || null)
      })
    })
  }
  
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const data = { value, timestamp: Date.now(), ttl }
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: data }, () => resolve())
    })
  }
}
```

#### Repository Implementations

```typescript
// Concrete implementations of repository interfaces
class ActivityRepositoryImpl implements ActivityRepository {
  constructor(
    private readonly cacheRepository: CacheRepository,
    private readonly corosApiService: CorosApiService,
    private readonly activityMapper: ActivityMapper
  ) {}
  
  async findByMonth(year: number, month: number): Promise<Activity[]> {
    const cacheKey = `activities-${year}-${month}`
    const cached = await this.cacheRepository.get<CorosActivityDto[]>(cacheKey)
    
    if (cached && !this.isCurrentMonth(year, month)) {
      return cached.map(dto => this.activityMapper.toDomain(dto))
    }
    
    const dtos = await this.corosApiService.fetchActivities(year, month)
    await this.cacheRepository.set(cacheKey, dtos)
    
    return dtos.map(dto => this.activityMapper.toDomain(dto))
  }
}

class ConfigurationRepositoryImpl implements ConfigurationRepository {
  async getSportTypeMapping(): Promise<Map<number, SportType>> {
    // Return sport type mappings from configuration
  }
}
```

### Presentation Layer

#### UI Components

```typescript
// UI components handle presentation concerns
class CalendarComponent {
  constructor(
    private readonly calendarApplicationService: CalendarApplicationService,
    private readonly eventBus: EventBus
  ) {}
  
  async render(container: HTMLElement): Promise<void> {
    const viewModel = await this.calendarApplicationService.displayCalendar(
      this.currentYear, 
      this.currentMonth
    )
    
    container.innerHTML = this.generateCalendarHTML(viewModel)
    this.bindEventListeners(container)
  }
  
  private bindEventListeners(container: HTMLElement): void {
    container.addEventListener('click', this.handleCalendarClick.bind(this))
  }
}

class StatisticsComponent {
  constructor(
    private readonly statisticsApplicationService: StatisticsApplicationService
  ) {}
  
  async render(container: HTMLElement): Promise<void> {
    const viewModel = await this.statisticsApplicationService.calculateMonthlyStatistics(
      this.currentYear,
      this.currentMonth
    )
    
    container.innerHTML = this.generateStatisticsHTML(viewModel)
  }
}
```

#### Chrome Extension Integration

```typescript
// Chrome extension specific components
class ContentScriptController {
  constructor(
    private readonly dependencyContainer: DependencyContainer,
    private readonly extensionStateManager: ExtensionStateManager
  ) {}
  
  async initialize(): Promise<void> {
    if (this.extensionStateManager.isInitialized()) return
    
    if (!this.isCorosPage()) return
    
    await this.injectUI()
    this.bindGlobalEventListeners()
    this.extensionStateManager.markAsInitialized()
  }
  
  private async injectUI(): Promise<void> {
    const container = this.findInjectionPoint()
    const tabManager = this.dependencyContainer.resolve<TabManager>('TabManager')
    
    await tabManager.createTabs(container)
  }
}

class TabManager {
  constructor(
    private readonly calendarComponent: CalendarComponent,
    private readonly statisticsComponent: StatisticsComponent
  ) {}
  
  async createTabs(container: HTMLElement): Promise<void> {
    const tabContainer = this.createTabContainer()
    const contentContainer = this.createContentContainer()
    
    container.appendChild(tabContainer)
    container.appendChild(contentContainer)
    
    await this.showCalendarTab()
  }
}
```

## Data Models

### Domain Transfer Objects (DTOs)

```typescript
// DTOs for external API communication
interface CorosActivityDto {
  labelId: string
  name: string
  sportType: number
  date: number // YYYYMMDD format
  startTime: number // Unix timestamp
  distance: number // meters
  workoutTime: number // seconds
  calorie: number
  device?: string
  avgHr?: number
  avgSpeed?: number
}

// View Models for UI presentation
interface CalendarViewModel {
  year: number
  month: number
  monthName: string
  days: CalendarDayViewModel[]
  summary: CalendarSummaryViewModel
}

interface CalendarDayViewModel {
  date: number
  isCurrentMonth: boolean
  isToday: boolean
  activities: ActivityViewModel[]
}

interface ActivityViewModel {
  id: string
  name: string
  sportType: SportTypeViewModel
  duration: string
  distance: string
  startTime: string
}

interface StatisticsViewModel {
  period: string
  overall: OverallStatsViewModel
  bySport: SportStatsViewModel[]
  insights: InsightViewModel[]
}
```

### Mappers

```typescript
// Mappers convert between different data representations
class ActivityMapper {
  toDomain(dto: CorosActivityDto): Activity {
    return new Activity(
      new ActivityId(dto.labelId),
      dto.name,
      SportType.fromCode(dto.sportType),
      new DateTime(new Date(dto.startTime * 1000)),
      new Duration(dto.workoutTime),
      new Distance(dto.distance),
      new Calories(dto.calorie)
    )
  }
  
  toViewModel(activity: Activity): ActivityViewModel {
    return {
      id: activity.getId().toString(),
      name: activity.getName(),
      sportType: this.mapSportTypeToViewModel(activity.getSportType()),
      duration: activity.getDuration().toString(),
      distance: activity.getDistance().toString(),
      startTime: activity.getStartTime().toISOString()
    }
  }
}

class CalendarMapper {
  toViewModel(calendar: Calendar): CalendarViewModel {
    return {
      year: calendar.getYear(),
      month: calendar.getMonth(),
      monthName: calendar.getMonthName(),
      days: calendar.getDays().map(day => this.mapDayToViewModel(day)),
      summary: this.mapSummaryToViewModel(calendar.getSummary())
    }
  }
}
```

## Error Handling

### Domain Exceptions

```typescript
// Domain-specific exceptions
class DomainException extends Error {
  constructor(message: string, public readonly code: string) {
    super(message)
    this.name = 'DomainException'
  }
}

class InvalidActivityDataException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_ACTIVITY_DATA')
  }
}

class AuthenticationException extends DomainException {
  constructor(message: string) {
    super(message, 'AUTHENTICATION_FAILED')
  }
}

class ApiException extends DomainException {
  constructor(message: string, public readonly statusCode?: number) {
    super(message, 'API_ERROR')
  }
}
```

### Error Handling Strategy

```typescript
// Centralized error handling
class ErrorHandler {
  handle(error: Error): void {
    if (error instanceof DomainException) {
      this.handleDomainException(error)
    } else if (error instanceof ApiException) {
      this.handleApiException(error)
    } else {
      this.handleUnknownError(error)
    }
  }
  
  private handleDomainException(error: DomainException): void {
    console.error(`Domain Error [${error.code}]: ${error.message}`)
    this.showUserFriendlyMessage(this.getDomainErrorMessage(error.code))
  }
  
  private handleApiException(error: ApiException): void {
    console.error(`API Error: ${error.message}`)
    this.showUserFriendlyMessage('Failed to load activity data. Please try again.')
  }
}
```

## BDD (Behavior-Driven Development) Methodology

### BDD Implementation Strategy

The refactor will implement BDD principles throughout the development process:

**Feature-Driven Development**: Each requirement is expressed as a feature with clear scenarios
- Features are written in Gherkin syntax for clarity
- Scenarios follow Given-When-Then format
- Acceptance criteria directly translate to executable specifications

**Living Documentation**: Tests serve as executable documentation
- Test descriptions use business language, not technical jargon
- Scenarios describe user behavior and system responses
- Test suites are organized by business capabilities

**Outside-In Development**: Start with user scenarios and work inward
- Begin with end-to-end scenarios describing user interactions
- Drive implementation through failing acceptance tests
- Implement layers from presentation to domain as needed

### BDD Test Structure

```typescript
// Feature: Calendar Display
// Scenario: User views monthly calendar with activities

describe('Feature: Calendar Display', () => {
  describe('Scenario: User views monthly calendar with activities', () => {
    it('should display calendar with activity indicators when user navigates to current month', async () => {
      // Given: User has activities in the current month
      const activities = givenUserHasActivitiesInCurrentMonth()
      
      // When: User opens the calendar view
      const calendarView = await whenUserOpensCalendarView()
      
      // Then: Calendar displays with activity indicators
      thenCalendarDisplaysWithActivityIndicators(calendarView, activities)
    })
  })
})

// Feature: Statistics Calculation
// Scenario: User views monthly statistics

describe('Feature: Statistics Calculation', () => {
  describe('Scenario: User views monthly statistics by sport type', () => {
    it('should calculate and display statistics grouped by sport when user switches to statistics tab', async () => {
      // Given: User has mixed sport activities in current month
      const activities = givenUserHasMixedSportActivities()
      
      // When: User switches to statistics tab
      const statisticsView = await whenUserSwitchesToStatisticsTab()
      
      // Then: Statistics are grouped by sport type with correct totals
      thenStatisticsAreGroupedBySportWithCorrectTotals(statisticsView, activities)
    })
  })
})
```

## TIDY First Refactoring Strategy

### Incremental Refactoring Approach

The refactor follows TIDY First methodology to ensure safe, incremental improvement:

**Phase 1: Tidy (Preparatory Refactoring)**
- Add comprehensive test coverage to existing JavaScript code
- Extract functions and improve naming without changing behavior
- Identify and document architectural boundaries
- Create interfaces for existing components

**Phase 2: TypeScript Migration**
- Convert files to TypeScript incrementally, starting with utilities
- Add type definitions for existing interfaces
- Maintain existing functionality while adding type safety
- Run both JavaScript and TypeScript in parallel during transition

**Phase 3: Clean Architecture Implementation**
- Introduce domain layer with entities and value objects
- Create application layer with use cases
- Implement infrastructure adapters
- Refactor presentation layer to use new architecture

**Phase 4: Integration and Cleanup**
- Remove legacy JavaScript code
- Optimize dependency injection
- Finalize test coverage
- Performance optimization

### Refactoring Safety Measures

```typescript
// Legacy compatibility layer during transition
class LegacyCompatibilityAdapter {
  constructor(
    private readonly newCalendarService: CalendarApplicationService,
    private readonly legacyCalendarModule: any
  ) {}
  
  // Gradually replace legacy calls with new implementation
  async displayCalendar(year: number, month: number): Promise<void> {
    try {
      // Try new implementation first
      const viewModel = await this.newCalendarService.displayCalendar(year, month)
      this.renderWithNewImplementation(viewModel)
    } catch (error) {
      // Fallback to legacy implementation
      console.warn('Falling back to legacy calendar implementation', error)
      this.legacyCalendarModule.displayCalendar(year, month)
    }
  }
}

// Feature flags for gradual rollout
class FeatureFlags {
  static readonly USE_NEW_STATISTICS = 'use_new_statistics'
  static readonly USE_NEW_CALENDAR = 'use_new_calendar'
  static readonly USE_NEW_CACHING = 'use_new_caching'
  
  static isEnabled(flag: string): boolean {
    return localStorage.getItem(`feature_${flag}`) === 'true'
  }
}
```

## Testing Strategy

### BDD Test Implementation

```typescript
// BDD-style test helpers for Given-When-Then scenarios
class BDDTestHelpers {
  // Given helpers - set up test state
  static givenUserHasActivitiesInCurrentMonth(): Activity[] {
    return [
      TestDataBuilder.activity()
        .withSportType(SportType.running())
        .withDate(new Date())
        .build(),
      TestDataBuilder.activity()
        .withSportType(SportType.cycling())
        .withDate(new Date())
        .build()
    ]
  }
  
  static givenUserHasMixedSportActivities(): Activity[] {
    return [
      TestDataBuilder.activity().withSportType(SportType.running()).build(),
      TestDataBuilder.activity().withSportType(SportType.cycling()).build(),
      TestDataBuilder.activity().withSportType(SportType.swimming()).build()
    ]
  }
  
  // When helpers - perform actions
  static async whenUserOpensCalendarView(): Promise<CalendarViewModel> {
    const calendarService = TestContainer.resolve<CalendarApplicationService>('CalendarApplicationService')
    return await calendarService.displayCalendar(2024, 6)
  }
  
  static async whenUserSwitchesToStatisticsTab(): Promise<StatisticsViewModel> {
    const statisticsService = TestContainer.resolve<StatisticsApplicationService>('StatisticsApplicationService')
    return await statisticsService.calculateMonthlyStatistics(2024, 6)
  }
  
  // Then helpers - verify outcomes
  static thenCalendarDisplaysWithActivityIndicators(
    calendarView: CalendarViewModel, 
    expectedActivities: Activity[]
  ): void {
    expect(calendarView.days.some(day => day.activities.length > 0)).toBe(true)
    expect(calendarView.summary.totalActivities).toBe(expectedActivities.length)
  }
  
  static thenStatisticsAreGroupedBySportWithCorrectTotals(
    statisticsView: StatisticsViewModel,
    expectedActivities: Activity[]
  ): void {
    const expectedSportTypes = new Set(expectedActivities.map(a => a.getSportType().getName()))
    const actualSportTypes = new Set(statisticsView.bySport.map(s => s.sportType))
    
    expect(actualSportTypes).toEqual(expectedSportTypes)
    expect(statisticsView.overall.totalActivities).toBe(expectedActivities.length)
  }
}
```

### Comprehensive Test Coverage Strategy

**Domain Layer Testing (90%+ coverage target)**
```typescript
// Domain entities and value objects - pure unit tests
describe('Domain: Activity Entity', () => {
  describe('Behavior: Pace Calculation', () => {
    it('should calculate correct pace for running activities', () => {
      // Test business logic without external dependencies
    })
    
    it('should handle zero distance gracefully', () => {
      // Test edge cases and error conditions
    })
  })
})

// Domain services - focused unit tests
describe('Domain: Statistics Calculation Service', () => {
  describe('Behavior: Monthly Aggregation', () => {
    it('should aggregate activities by month correctly', () => {
      // Test domain service logic
    })
  })
})
```

**Application Layer Testing (85%+ coverage target)**
```typescript
// Use case testing with mocked dependencies
describe('Application: Load Monthly Activities Use Case', () => {
  describe('Behavior: Cache Strategy', () => {
    it('should use cached data for past months', async () => {
      // Test use case orchestration logic
    })
    
    it('should fetch fresh data for current month', async () => {
      // Test different execution paths
    })
  })
})
```

**Infrastructure Layer Testing (80%+ coverage target)**
```typescript
// Integration tests for external dependencies
describe('Infrastructure: COROS API Adapter', () => {
  describe('Behavior: Activity Fetching', () => {
    it('should handle API authentication correctly', async () => {
      // Test external API integration
    })
    
    it('should retry on network failures', async () => {
      // Test error handling and resilience
    })
  })
})
```

**End-to-End Testing (Key User Journeys)**
```typescript
// Complete user workflow testing
describe('E2E: Complete User Journey', () => {
  describe('Scenario: First-time user views calendar', () => {
    it('should load extension, authenticate, fetch data, and display calendar', async () => {
      // Test complete user workflow from start to finish
      await page.goto('https://t.coros.com/admin/views/activities')
      
      // Wait for extension initialization
      await page.waitForSelector('#coros-calendar-extension')
      
      // Verify calendar loads with data
      const calendarGrid = await page.$('#coros-calendar-grid')
      expect(calendarGrid).toBeTruthy()
      
      // Verify statistics tab works
      await page.click('[data-tab="statistics"]')
      const statisticsPanel = await page.$('#coros-statistics-panel')
      expect(statisticsPanel).toBeTruthy()
    })
  })
})
```

### Unit Testing

```typescript
// Domain layer unit tests (pure business logic)
describe('Activity', () => {
  it('should calculate pace correctly for running activities', () => {
    const activity = new Activity(
      new ActivityId('test-1'),
      'Morning Run',
      SportType.running(),
      new DateTime(new Date()),
      new Duration(1800), // 30 minutes
      new Distance(5000), // 5km
      new Calories(300)
    )
    
    const pace = activity.calculatePace()
    expect(pace.getMinutesPerKilometer()).toBe(6) // 6 min/km
  })
})

// Application layer unit tests (use case testing)
describe('LoadMonthlyActivitiesUseCase', () => {
  it('should load activities from cache for past months', async () => {
    const mockRepository = createMockActivityRepository()
    const mockApiService = createMockCorosApiService()
    const mockCache = createMockCacheRepository()
    
    const useCase = new LoadMonthlyActivitiesUseCase(
      mockRepository, 
      mockApiService, 
      mockCache
    )
    
    const request = new LoadMonthlyActivitiesRequest(2024, 1) // January 2024
    const response = await useCase.execute(request)
    
    expect(mockCache.get).toHaveBeenCalledWith('activities-2024-1')
    expect(mockApiService.fetchActivities).not.toHaveBeenCalled()
    expect(response.activities).toHaveLength(5)
  })
})
```

### Integration Testing

```typescript
// Integration tests for Chrome extension APIs
describe('ChromeStorageAdapter', () => {
  it('should store and retrieve data correctly', async () => {
    const adapter = new ChromeStorageAdapter()
    const testData = { test: 'data' }
    
    await adapter.set('test-key', testData)
    const retrieved = await adapter.get('test-key')
    
    expect(retrieved).toEqual(testData)
  })
})

// Integration tests for COROS API
describe('CorosApiAdapter', () => {
  it('should fetch activities with proper authentication', async () => {
    const mockAuth = createMockAuthenticationService()
    const adapter = new CorosApiAdapter(new HttpClient(), mockAuth)
    
    mockAuth.getToken.mockResolvedValue('test-token')
    
    const activities = await adapter.fetchActivities(2024, 6)
    
    expect(activities).toBeDefined()
    expect(Array.isArray(activities)).toBe(true)
  })
})
```

### End-to-End Testing

```typescript
// E2E tests for complete user workflows
describe('Calendar Extension E2E', () => {
  it('should display calendar when user navigates to COROS website', async () => {
    await page.goto('https://t.coros.com/admin/views/activities')
    
    // Wait for extension to initialize
    await page.waitForSelector('#coros-calendar-extension')
    
    // Check calendar tab is visible
    const calendarTab = await page.$('[data-tab="calendar"]')
    expect(calendarTab).toBeTruthy()
    
    // Click calendar tab
    await calendarTab.click()
    
    // Check calendar grid is rendered
    const calendarGrid = await page.$('#coros-calendar-grid')
    expect(calendarGrid).toBeTruthy()
  })
})
```

## Dependency Injection

### Container Configuration

```typescript
// Dependency injection container setup
class DependencyContainer {
  private bindings = new Map<string, any>()
  
  bind<T>(key: string, factory: () => T): void {
    this.bindings.set(key, factory)
  }
  
  resolve<T>(key: string): T {
    const factory = this.bindings.get(key)
    if (!factory) {
      throw new Error(`No binding found for ${key}`)
    }
    return factory()
  }
}

// Container configuration
function configureContainer(): DependencyContainer {
  const container = new DependencyContainer()
  
  // Infrastructure layer
  container.bind('HttpClient', () => new HttpClient())
  container.bind('AuthenticationService', () => new ChromeAuthenticationService())
  container.bind('CacheRepository', () => new ChromeStorageAdapter())
  container.bind('CorosApiService', () => new CorosApiAdapter(
    container.resolve('HttpClient'),
    container.resolve('AuthenticationService')
  ))
  
  // Domain services
  container.bind('ActivityAggregationService', () => new ActivityAggregationServiceImpl())
  container.bind('StatisticsCalculationService', () => new StatisticsCalculationServiceImpl())
  container.bind('CalendarRenderingService', () => new CalendarRenderingServiceImpl())
  
  // Application layer
  container.bind('LoadMonthlyActivitiesUseCase', () => new LoadMonthlyActivitiesUseCase(
    container.resolve('ActivityRepository'),
    container.resolve('CorosApiService'),
    container.resolve('CacheRepository')
  ))
  
  // Presentation layer
  container.bind('CalendarComponent', () => new CalendarComponent(
    container.resolve('CalendarApplicationService'),
    container.resolve('EventBus')
  ))
  
  return container
}
```

### Dependency Injection Rationale

**Constructor Injection**: All dependencies are injected through constructors to ensure:
- Dependencies are explicit and required
- Components are immutable after construction
- Easy testing with mock dependencies
- Clear dependency graph visualization

**Interface-Based Dependencies**: Components depend on interfaces, not concrete implementations:
- Enables easy swapping of implementations
- Supports testing with mock objects
- Follows Dependency Inversion Principle
- Reduces coupling between layers

**Single Container Instance**: One container manages all dependencies:
- Centralized configuration
- Consistent object lifecycle management
- Easy to reason about dependency resolution
- Supports singleton and transient lifetimes

## Build Configuration

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src",
    "paths": {
      "@domain/*": ["domain/*"],
      "@application/*": ["application/*"],
      "@infrastructure/*": ["infrastructure/*"],
      "@presentation/*": ["presentation/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Project Structure

```
src/
├── domain/
│   ├── entities/
│   │   ├── Activity.ts
│   │   ├── Calendar.ts
│   │   └── Statistics.ts
│   ├── value-objects/
│   │   ├── ActivityId.ts
│   │   ├── SportType.ts
│   │   ├── Duration.ts
│   │   ├── Distance.ts
│   │   └── DateTime.ts
│   ├── services/
│   │   ├── ActivityAggregationService.ts
│   │   ├── StatisticsCalculationService.ts
│   │   └── CalendarRenderingService.ts
│   └── repositories/
│       ├── ActivityRepository.ts
│       ├── CacheRepository.ts
│       └── ConfigurationRepository.ts
├── application/
│   ├── use-cases/
│   │   ├── LoadMonthlyActivitiesUseCase.ts
│   │   ├── DisplayCalendarUseCase.ts
│   │   └── CalculateStatisticsUseCase.ts
│   └── services/
│       ├── ActivityApplicationService.ts
│       ├── CalendarApplicationService.ts
│       └── StatisticsApplicationService.ts
├── infrastructure/
│   ├── api/
│   │   └── CorosApiAdapter.ts
│   ├── storage/
│   │   └── ChromeStorageAdapter.ts
│   ├── repositories/
│   │   ├── ActivityRepositoryImpl.ts
│   │   └── ConfigurationRepositoryImpl.ts
│   └── mappers/
│       ├── ActivityMapper.ts
│       └── CalendarMapper.ts
├── presentation/
│   ├── components/
│   │   ├── CalendarComponent.ts
│   │   ├── StatisticsComponent.ts
│   │   └── TabManager.ts
│   └── chrome/
│       ├── ContentScriptController.ts
│       ├── background.ts
│       ├── content.ts
│       └── popup.ts
└── shared/
    ├── DependencyContainer.ts
    ├── ErrorHandler.ts
    └── types/
        ├── ViewModels.ts
        └── DTOs.ts
```

### Build Pipeline

```typescript
// Build configuration for Chrome extension
const buildConfig = {
  entry: {
    background: './src/presentation/chrome/background.ts',
    content: './src/presentation/chrome/content.ts',
    popup: './src/presentation/chrome/popup.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@domain': path.resolve(__dirname, 'src/domain'),
      '@application': path.resolve(__dirname, 'src/application'),
      '@infrastructure': path.resolve(__dirname, 'src/infrastructure'),
      '@presentation': path.resolve(__dirname, 'src/presentation')
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  }
}
```

### Development Workflow

**Phase-by-Phase Implementation**:
1. **Setup Phase**: Configure TypeScript, testing framework, and build pipeline
2. **Domain Phase**: Implement domain entities, value objects, and services
3. **Application Phase**: Create use cases and application services
4. **Infrastructure Phase**: Build adapters and repository implementations
5. **Presentation Phase**: Refactor UI components and Chrome extension integration
6. **Integration Phase**: Wire everything together with dependency injection
7. **Testing Phase**: Achieve comprehensive test coverage across all layers

**Quality Gates**:
- All TypeScript compilation must pass without errors
- Test coverage must meet layer-specific targets (90% domain, 85% application, 80% infrastructure)
- All BDD scenarios must pass
- Legacy functionality must remain intact during transition
- Performance benchmarks must be maintained

This design provides a comprehensive foundation for the TypeScript refactor while ensuring all requirements are met through clean architecture, SOLID principles, BDD methodology, and TIDY First incremental approach.

```typescript
// E2E tests for complete user workflows
describe('Calendar Extension E2E', () => {
  it('should display calendar when user navigates to COROS website', async () => {
    await page.goto('https://t.coros.com/admin/views/activities')
    
    // Wait for extension to initialize
    await page.waitForSelector('#coros-calendar-extension')
    
    // Check calendar tab is visible
    const calendarTab = await page.$('[data-tab="calendar"]')
    expect(calendarTab).toBeTruthy()
    
    // Click calendar tab
    await calendarTab.click()
    
    // Check calendar grid is rendered
    const calendarGrid = await page.$('#coros-calendar-grid')
    expect(calendarGrid).toBeTruthy()
  })
})
```

## Dependency Injection

### Container Configuration

```typescript
// Dependency injection container setup
class DependencyContainer {
  private bindings = new Map<string, any>()
  
  bind<T>(key: string, factory: () => T): void {
    this.bindings.set(key, factory)
  }
  
  resolve<T>(key: string): T {
    const factory = this.bindings.get(key)
    if (!factory) {
      throw new Error(`No binding found for ${key}`)
    }
    return factory()
  }
}

// Container configuration
function configureContainer(): DependencyContainer {
  const container = new DependencyContainer()
  
  // Infrastructure layer
  container.bind('HttpClient', () => new HttpClient())
  container.bind('AuthenticationService', () => new ChromeAuthenticationService())
  container.bind('CacheRepository', () => new ChromeStorageAdapter())
  container.bind('CorosApiService', () => new CorosApiAdapter(
    container.resolve('HttpClient'),
    container.resolve('AuthenticationService')
  ))
  
  // Domain services
  container.bind('ActivityAggregationService', () => new ActivityAggregationServiceImpl())
  container.bind('StatisticsCalculationService', () => new StatisticsCalculationServiceImpl())
  container.bind('CalendarRenderingService', () => new CalendarRenderingServiceImpl())
  
  // Application layer
  container.bind('LoadMonthlyActivitiesUseCase', () => new LoadMonthlyActivitiesUseCase(
    container.resolve('ActivityRepository'),
    container.resolve('CorosApiService'),
    container.resolve('CacheRepository')
  ))
  
  // Presentation layer
  container.bind('CalendarComponent', () => new CalendarComponent(
    container.resolve('CalendarApplicationService'),
    container.resolve('EventBus')
  ))
  
  return container
}
```

## Build Configuration

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src",
    "paths": {
      "@domain/*": ["domain/*"],
      "@application/*": ["application/*"],
      "@infrastructure/*": ["infrastructure/*"],
      "@presentation/*": ["presentation/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Build Pipeline

```typescript
// Build configuration for Chrome extension
const buildConfig = {
  entry: {
    background: './src/presentation/chrome/background.ts',
    content: './src/presentation/chrome/content.ts',
    popup: './src/presentation/chrome/popup.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@domain': path.resolve(__dirname, 'src/domain'),
      '@application': path.resolve(__dirname, 'src/application'),
      '@infrastructure': path.resolve(__dirname, 'src/infrastructure'),
      '@presentation': path.resolve(__dirname, 'src/presentation')
    }
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  }
}
```

This design provides a solid foundation for the TypeScript refactor while maintaining clean architecture principles, proper separation of concerns, and comprehensive testing strategies. The architecture supports the existing functionality while making the codebase more maintainable and extensible.