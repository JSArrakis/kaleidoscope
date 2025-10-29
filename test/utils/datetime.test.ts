import {
  formatDateToISO,
  formatDateToISODate,
  parseToISODateTime,
  isDateInRange,
  isDateInHolidayDates,
} from '../../src/utils/utilities';

describe('Datetime Utilities', () => {
  describe('formatDateToISO', () => {
    it('should format Date to ISO datetime string in local time', () => {
      const date = new Date('2024-12-25T10:30:45.123'); // Local time
      const result = formatDateToISO(date);
      expect(result).toBe('2024-12-25 10:30:45');
    });
  });

  describe('formatDateToISODate', () => {
    it('should format Date to ISO date string in local time', () => {
      const date = new Date('2024-12-25T10:30:45.123'); // Local time
      const result = formatDateToISODate(date);
      expect(result).toBe('2024-12-25');
    });
  });

  describe('parseToISODateTime', () => {
    it('should parse --MM-DD format to current year datetime', () => {
      const result = parseToISODateTime('--12-25');
      const currentYear = new Date().getFullYear();
      expect(result).toBe(`${currentYear}-12-25 00:00:00`);
    });

    it('should parse MM-DD format to current year datetime', () => {
      const result = parseToISODateTime('12-25');
      const currentYear = new Date().getFullYear();
      expect(result).toBe(`${currentYear}-12-25 00:00:00`);
    });

    it('should parse YYYY-MM-DD format with default time', () => {
      const result = parseToISODateTime('2024-12-25');
      expect(result).toBe('2024-12-25 00:00:00');
    });

    it('should parse YYYY-MM-DD HH:MM:SS format as-is', () => {
      const result = parseToISODateTime('2024-12-25 15:30:45');
      expect(result).toBe('2024-12-25 15:30:45');
    });

    it('should use custom default time', () => {
      const result = parseToISODateTime('2024-12-25', '23:59:59');
      expect(result).toBe('2024-12-25 23:59:59');
    });

    it('should return null for invalid input', () => {
      const result = parseToISODateTime('');
      expect(result).toBeNull();
    });
  });

  describe('isDateInRange', () => {
    it('should return true for date within datetime range', () => {
      const currentDate = new Date('2024-12-15T12:00:00');
      const startDate = '2024-12-01 00:00:00';
      const endDate = '2024-12-31 23:59:59';

      const result = isDateInRange(currentDate, startDate, endDate);
      expect(result).toBe(true);
    });

    it('should return false for date outside datetime range', () => {
      const currentDate = new Date('2024-11-15T12:00:00');
      const startDate = '2024-12-01 00:00:00';
      const endDate = '2024-12-31 23:59:59';

      const result = isDateInRange(currentDate, startDate, endDate);
      expect(result).toBe(false);
    });

    it('should return true for date within date-only range', () => {
      const currentDate = new Date('2024-12-15T12:00:00');
      const startDate = '2024-12-01';
      const endDate = '2024-12-31';

      const result = isDateInRange(currentDate, startDate, endDate);
      expect(result).toBe(true);
    });

    it('should return false for null dates', () => {
      const currentDate = new Date('2024-12-15T12:00:00');

      const result = isDateInRange(currentDate, null, '2024-12-31');
      expect(result).toBe(false);
    });
  });

  describe('isDateInHolidayDates', () => {
    it('should return true for matching date in YYYY-MM-DD format', () => {
      const currentDate = new Date('2024-12-25T12:00:00');
      const holidayDates = ['2024-12-24', '2024-12-25', '2024-12-26'];

      const result = isDateInHolidayDates(currentDate, holidayDates);
      expect(result).toBe(true);
    });

    it('should return true for matching date in --MM-DD format', () => {
      const currentDate = new Date('2024-12-25T12:00:00');
      const holidayDates = ['--12-24', '--12-25', '--12-26'];

      const result = isDateInHolidayDates(currentDate, holidayDates);
      expect(result).toBe(true);
    });

    it('should return true for matching date in MM-DD format', () => {
      const currentDate = new Date('2024-12-25T12:00:00');
      const holidayDates = ['12-24', '12-25', '12-26'];

      const result = isDateInHolidayDates(currentDate, holidayDates);
      expect(result).toBe(true);
    });

    it('should return false for non-matching dates', () => {
      const currentDate = new Date('2024-12-25T12:00:00');
      const holidayDates = ['2024-10-31', '2024-11-01'];

      const result = isDateInHolidayDates(currentDate, holidayDates);
      expect(result).toBe(false);
    });

    it('should return false for empty holiday dates array', () => {
      const currentDate = new Date('2024-12-25T12:00:00');
      const holidayDates: string[] = [];

      const result = isDateInHolidayDates(currentDate, holidayDates);
      expect(result).toBe(false);
    });
  });
});
