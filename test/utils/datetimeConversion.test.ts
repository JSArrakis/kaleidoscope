import {
  convertMMDDToDateTime,
  convertDateTimeToMMDD,
  isDateInHolidayDateTimes,
} from '../../src/utils/utilities';

describe('DateTime Conversion Utilities', () => {
  describe('convertMMDDToDateTime', () => {
    it('should convert MM-DD to current year DATETIME', () => {
      const result = convertMMDDToDateTime('12-25');
      const currentYear = new Date().getFullYear();
      expect(result).toBe(`${currentYear}-12-25 00:00:00`);
    });

    it('should handle --MM-DD format', () => {
      const result = convertMMDDToDateTime('--12-25');
      const currentYear = new Date().getFullYear();
      expect(result).toBe(`${currentYear}-12-25 00:00:00`);
    });

    it('should throw error for invalid format', () => {
      expect(() => convertMMDDToDateTime('invalid')).toThrow(
        'Invalid MM-DD format',
      );
    });

    it('should throw error for empty string', () => {
      expect(() => convertMMDDToDateTime('')).toThrow(
        'MM-DD string cannot be empty',
      );
    });
  });

  describe('convertDateTimeToMMDD', () => {
    it('should convert DATETIME to MM-DD format', () => {
      const result = convertDateTimeToMMDD('2024-12-25 00:00:00');
      expect(result).toBe('12-25');
    });

    it('should handle different year', () => {
      const result = convertDateTimeToMMDD('2023-01-15 12:30:45');
      expect(result).toBe('01-15');
    });

    it('should throw error for invalid datetime', () => {
      expect(() => convertDateTimeToMMDD('invalid')).toThrow(
        'Error converting datetime to MM-DD',
      );
    });

    it('should throw error for empty string', () => {
      expect(() => convertDateTimeToMMDD('')).toThrow(
        'DateTime string cannot be empty',
      );
    });
  });

  describe('isDateInHolidayDateTimes', () => {
    it('should match current date with holiday datetimes', () => {
      const currentDate = new Date(2024, 11, 25); // December 25, 2024
      const holidayDateTimes = ['2024-12-25 00:00:00', '2024-01-01 00:00:00'];

      const result = isDateInHolidayDateTimes(currentDate, holidayDateTimes);
      expect(result).toBe(true);
    });

    it('should not match date not in holiday datetimes', () => {
      const currentDate = new Date(2024, 11, 24); // December 24, 2024
      const holidayDateTimes = ['2024-12-25 00:00:00', '2024-01-01 00:00:00'];

      const result = isDateInHolidayDateTimes(currentDate, holidayDateTimes);
      expect(result).toBe(false);
    });

    it('should handle different years in datetime but same month-day', () => {
      const currentDate = new Date(2024, 11, 25); // December 25, 2024
      const holidayDateTimes = ['2023-12-25 00:00:00']; // Different year, same month-day

      const result = isDateInHolidayDateTimes(currentDate, holidayDateTimes);
      expect(result).toBe(true);
    });

    it('should handle empty holiday dates array', () => {
      const currentDate = new Date(2024, 11, 25);
      const result = isDateInHolidayDateTimes(currentDate, []);
      expect(result).toBe(false);
    });

    it('should handle invalid datetime in array gracefully', () => {
      const currentDate = new Date(2024, 11, 25);
      const holidayDateTimes = ['invalid-datetime', '2024-12-25 00:00:00'];

      const result = isDateInHolidayDateTimes(currentDate, holidayDateTimes);
      expect(result).toBe(true); // Should still find the valid date
    });
  });
});
