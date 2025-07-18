import { SportType, SportCategory } from '@domain/value-objects/SportType';

describe('Feature: Sport Type Management', () => {
  describe('Scenario: Sport type creation from code', () => {
    it('should create correct sport type when valid code is provided', () => {
      // Given: A valid sport type code for running
      const runningCode = 1;

      // When: Sport type is created from code
      const sportType = SportType.fromCode(runningCode);

      // Then: Should return running sport type with correct properties
      expect(sportType.getCode()).toBe(1);
      expect(sportType.getName()).toBe('Running');
      expect(sportType.getCategory()).toBe(SportCategory.RUNNING);
      expect(sportType.getIcon()).toBe('🏃');
      expect(sportType.getColor()).toBe('#FF6B6B');
    });

    it('should return default sport type when invalid code is provided', () => {
      // Given: An invalid sport type code
      const invalidCode = 999;

      // When: Sport type is created from code
      const sportType = SportType.fromCode(invalidCode);

      // Then: Should return default 'Other' sport type
      expect(sportType.getCode()).toBe(999);
      expect(sportType.getName()).toBe('Other');
      expect(sportType.getCategory()).toBe(SportCategory.OTHER);
      expect(sportType.getIcon()).toBe('⚡');
      expect(sportType.getColor()).toBe('#95A5A6');
    });
  });

  describe('Scenario: Sport type category checking', () => {
    it('should correctly identify running activities', () => {
      // Given: A running sport type
      const runningSportType = SportType.running();

      // When: Checking if it's running
      const isRunning = runningSportType.isRunning();
      const isCycling = runningSportType.isCycling();

      // Then: Should identify as running but not cycling
      expect(isRunning).toBe(true);
      expect(isCycling).toBe(false);
    });

    it('should correctly identify cycling activities', () => {
      // Given: A cycling sport type
      const cyclingSportType = SportType.cycling();

      // When: Checking categories
      const isCycling = cyclingSportType.isCycling();
      const isRunning = cyclingSportType.isRunning();

      // Then: Should identify as cycling but not running
      expect(isCycling).toBe(true);
      expect(isRunning).toBe(false);
    });

    it('should correctly identify indoor activities', () => {
      // Given: An indoor cycling sport type
      const indoorCyclingSportType = SportType.fromCode(8);

      // When: Checking if it's indoor
      const isIndoor = indoorCyclingSportType.isIndoor();
      const isOutdoor = indoorCyclingSportType.isOutdoor();

      // Then: Should identify as indoor but not outdoor
      expect(isIndoor).toBe(true);
      expect(isOutdoor).toBe(false);
    });
  });

  describe('Scenario: All sport types retrieval', () => {
    it('should return all available sport types', () => {
      // Given: Request for all sport types
      
      // When: Getting all sport types
      const allSportTypes = SportType.getAllSportTypes();

      // Then: Should return array with all predefined sport types
      expect(allSportTypes).toBeInstanceOf(Array);
      expect(allSportTypes.length).toBeGreaterThan(0);
      
      // Should include running, cycling, and swimming
      const sportNames = allSportTypes.map(st => st.getName());
      expect(sportNames).toContain('Running');
      expect(sportNames).toContain('Cycling');
      expect(sportNames).toContain('Swimming');
    });
  });
});