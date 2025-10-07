import { selectIntelligentStartingTags } from '../../src/services/streamConstructor';

// Mock the mediaService to control holiday detection
jest.mock('../../src/services/mediaService', () => ({
  getCurrentHolidays: jest.fn(() => []),
}));

describe('selectIntelligentStartingTags', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should return an array when no holidays are active', () => {
    const mockMediaService = require('../../src/services/mediaService');
    mockMediaService.getCurrentHolidays.mockReturnValue([]);

    const tags = selectIntelligentStartingTags();

    expect(Array.isArray(tags)).toBe(true);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should return an array when holidays are active', () => {
    const mockMediaService = require('../../src/services/mediaService');
    const mockHolidays = [
      { name: 'Christmas', type: 'Holiday' },
      { name: 'Winter Season', type: 'Holiday' },
    ];
    mockMediaService.getCurrentHolidays.mockReturnValue(mockHolidays);

    const tags = selectIntelligentStartingTags();

    expect(Array.isArray(tags)).toBe(true);
    expect(consoleSpy).toHaveBeenCalled();
    // Check if holiday detection message was logged
    const logCalls = consoleSpy.mock.calls;
    const hasHolidayLog = logCalls.some(
      call => call[0] && call[0].includes('Active holidays detected'),
    );
    expect(hasHolidayLog).toBe(true);
  });

  it('should use random selection when no holidays are active', () => {
    const mockMediaService = require('../../src/services/mediaService');
    mockMediaService.getCurrentHolidays.mockReturnValue([]);

    const tags = selectIntelligentStartingTags();

    expect(Array.isArray(tags)).toBe(true);
    expect(consoleSpy).toHaveBeenCalled();

    // Should log something about random genre selection
    const logCalls = consoleSpy.mock.calls;
    const hasRandomSelectionLog = logCalls.some(
      call => call[0] && call[0].includes('random genre selection'),
    );
    expect(hasRandomSelectionLog).toBe(true);
  });
});
