// DateTime value object
export class DateTime {
  constructor(private readonly date: Date) {
    if (!date || isNaN(date.getTime())) {
      throw new Error('Invalid date provided');
    }
  }

  toISOString(): string {
    return this.date.toISOString();
  }

  isSameDay(other: DateTime): boolean {
    return (
      this.date.getFullYear() === other.date.getFullYear() &&
      this.date.getMonth() === other.date.getMonth() &&
      this.date.getDate() === other.date.getDate()
    );
  }

  getYear(): number {
    return this.date.getFullYear();
  }

  getMonth(): number {
    return this.date.getMonth();
  }

  getDay(): number {
    return this.date.getDate();
  }

  toDate(): Date {
    return new Date(this.date.getTime());
  }

  static fromDate(date: Date): DateTime {
    return new DateTime(date);
  }

  static fromTimestamp(timestamp: number): DateTime {
    return new DateTime(new Date(timestamp));
  }

  static now(): DateTime {
    return new DateTime(new Date());
  }
}