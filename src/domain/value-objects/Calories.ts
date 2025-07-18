// Calories value object
export class Calories {
  constructor(private readonly value: number) {
    if (value < 0) {
      throw new Error('Calories cannot be negative');
    }
  }

  getValue(): number {
    return this.value;
  }

  toString(): string {
    return `${this.value} cal`;
  }

  add(other: Calories): Calories {
    return new Calories(this.value + other.value);
  }

  static fromValue(value: number): Calories {
    return new Calories(value);
  }
}