// ActivityId value object
export class ActivityId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Activity ID cannot be empty');
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