// Duration value object
export class Duration {
  constructor(private readonly seconds: number) {
    if (seconds < 0) {
      throw new Error('Duration cannot be negative');
    }
  }

  getSeconds(): number {
    return this.seconds;
  }

  toMinutes(): number {
    return this.seconds / 60;
  }

  toHours(): number {
    return this.seconds / 3600;
  }

  toString(): string {
    const hours = Math.floor(this.seconds / 3600);
    const minutes = Math.floor((this.seconds % 3600) / 60);
    const remainingSeconds = this.seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  }

  add(other: Duration): Duration {
    return new Duration(this.seconds + other.seconds);
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
}