// Distance value object
export class Distance {
  constructor(private readonly meters: number) {
    if (meters < 0) {
      throw new Error('Distance cannot be negative');
    }
  }

  getMeters(): number {
    return this.meters;
  }

  toKilometers(): number {
    return this.meters / 1000;
  }

  toMiles(): number {
    return this.meters / 1609.344;
  }

  toString(): string {
    const km = this.toKilometers();
    if (km >= 1) {
      return `${km.toFixed(2)} km`;
    } else {
      return `${this.meters.toFixed(0)} m`;
    }
  }

  add(other: Distance): Distance {
    return new Distance(this.meters + other.meters);
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
}