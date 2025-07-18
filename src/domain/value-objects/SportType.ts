// Sport categories
export enum SportCategory {
  RUNNING = 'running',
  CYCLING = 'cycling',
  SWIMMING = 'swimming',
  STRENGTH = 'strength',
  OUTDOOR = 'outdoor',
  WINTER = 'winter',
  INDOOR = 'indoor',
  OTHER = 'other',
}

// SportType value object
export class SportType {
  private static readonly sportCodeMap: Map<number, SportType> = new Map([
    [1, new SportType(1, 'Running', SportCategory.RUNNING, '🏃', '#FF6B6B')],
    [2, new SportType(2, 'Cycling', SportCategory.CYCLING, '🚴', '#4ECDC4')],
    [3, new SportType(3, 'Swimming', SportCategory.SWIMMING, '🏊', '#45B7D1')],
    [4, new SportType(4, 'Hiking', SportCategory.OUTDOOR, '🥾', '#96CEB4')],
    [5, new SportType(5, 'Walking', SportCategory.OUTDOOR, '🚶', '#FECA57')],
    [6, new SportType(6, 'Strength Training', SportCategory.STRENGTH, '💪', '#FF9FF3')],
    [7, new SportType(7, 'Yoga', SportCategory.INDOOR, '🧘', '#A8E6CF')],
    [8, new SportType(8, 'Indoor Cycling', SportCategory.INDOOR, '🏋️', '#6C7CE0')],
    [9, new SportType(9, 'Treadmill', SportCategory.INDOOR, '🏃', '#FF8A80')],
    [10, new SportType(10, 'Elliptical', SportCategory.INDOOR, '⚡', '#81C784')],
    [11, new SportType(11, 'Rowing', SportCategory.INDOOR, '🚣', '#4DB6AC')],
    [12, new SportType(12, 'Skiing', SportCategory.WINTER, '⛷️', '#E1F5FE')],
    [13, new SportType(13, 'Snowboarding', SportCategory.WINTER, '🏂', '#B3E5FC')],
  ]);

  constructor(
    private readonly code: number,
    private readonly name: string,
    private readonly category: SportCategory,
    private readonly icon: string,
    private readonly color: string
  ) {}

  getCode(): number {
    return this.code;
  }

  getName(): string {
    return this.name;
  }

  getCategory(): SportCategory {
    return this.category;
  }

  getIcon(): string {
    return this.icon;
  }

  getColor(): string {
    return this.color;
  }

  isRunning(): boolean {
    return this.category === SportCategory.RUNNING;
  }

  isCycling(): boolean {
    return this.category === SportCategory.CYCLING;
  }

  isSwimming(): boolean {
    return this.category === SportCategory.SWIMMING;
  }

  isIndoor(): boolean {
    return this.category === SportCategory.INDOOR;
  }

  isOutdoor(): boolean {
    return this.category === SportCategory.OUTDOOR;
  }

  static fromCode(code: number): SportType {
    const sportType = SportType.sportCodeMap.get(code);
    if (!sportType) {
      return new SportType(code, 'Other', SportCategory.OTHER, '⚡', '#95A5A6');
    }
    return sportType;
  }

  static running(): SportType {
    return SportType.fromCode(1);
  }

  static cycling(): SportType {
    return SportType.fromCode(2);
  }

  static swimming(): SportType {
    return SportType.fromCode(3);
  }

  static getAllSportTypes(): SportType[] {
    return Array.from(SportType.sportCodeMap.values());
  }
}