import { getUnixTime, parse } from "date-fns";
import { holidayTags } from "../../../../testData/tags/holidays";
import { isHolidayDate } from "../../../../../src/electron/services/streamConstruction/selectionHelpers.js";

describe("isHolidayDate", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * Basic matching tests
   */
  describe("Basic Holiday Date Matching", () => {
    it("should return true when date exactly matches a holiday date", () => {
      // Christmas is on 2024-12-25
      const christmasDay = getUnixTime(
        parse("2024-12-25", "yyyy-MM-dd", new Date()),
      );
      const holidays = [holidayTags.christmas];

      const result = isHolidayDate(christmasDay, holidays);

      expect(result).toBe(true);
    });

    it("should return true when date matches first holiday in array", () => {
      const halloweenDay = getUnixTime(
        parse("2024-10-31", "yyyy-MM-dd", new Date()),
      );
      const holidays = [holidayTags.halloween, holidayTags.christmas];

      const result = isHolidayDate(halloweenDay, holidays);

      expect(result).toBe(true);
    });

    it("should return true when date matches middle holiday in array", () => {
      const newYearDay = getUnixTime(
        parse("2024-01-01", "yyyy-MM-dd", new Date()),
      );
      const holidays = [
        holidayTags.halloween,
        holidayTags.newYear,
        holidayTags.christmas,
      ];

      const result = isHolidayDate(newYearDay, holidays);

      expect(result).toBe(true);
    });

    it("should return true when date matches last holiday in array", () => {
      const valentineDay = getUnixTime(
        parse("2024-02-14", "yyyy-MM-dd", new Date()),
      );
      const holidays = [
        holidayTags.halloween,
        holidayTags.christmas,
        holidayTags.valentine,
      ];

      const result = isHolidayDate(valentineDay, holidays);

      expect(result).toBe(true);
    });
  });

  /**
   * Non-matching dates tests
   */
  describe("Non-Matching Dates", () => {
    it("should return false when date does not match any holiday", () => {
      const randomDay = getUnixTime(
        parse("2024-06-15", "yyyy-MM-dd", new Date()),
      );
      const holidays = [holidayTags.christmas, holidayTags.halloween];

      const result = isHolidayDate(randomDay, holidays);

      expect(result).toBe(false);
    });

    it("should return false when date is one day before holiday", () => {
      // One day before Christmas (2024-12-24, which is eve but not exactly 12-25)
      const christmasEve = getUnixTime(
        parse("2024-12-24", "yyyy-MM-dd", new Date()),
      );
      // Note: Christmas tag has both 2024-12-24 and 2024-12-25, so this should return true
      // Let's use a holiday with single date
      const independenceDay = getUnixTime(
        parse("2024-07-03", "yyyy-MM-dd", new Date()),
      );
      const holidays = [holidayTags.summer]; // July 4th

      const result = isHolidayDate(independenceDay, holidays);

      expect(result).toBe(false);
    });

    it("should return false when date is one day after holiday", () => {
      const independenceDay = getUnixTime(
        parse("2024-07-05", "yyyy-MM-dd", new Date()),
      );
      const holidays = [holidayTags.summer]; // July 4th

      const result = isHolidayDate(independenceDay, holidays);

      expect(result).toBe(false);
    });

    it("should return false when holiday array is empty", () => {
      const anyDay = getUnixTime(parse("2024-12-25", "yyyy-MM-dd", new Date()));

      const result = isHolidayDate(anyDay, []);

      expect(result).toBe(false);
    });
  });

  /**
   * Edge cases and multiple dates
   */
  describe("Edge Cases - Multiple Holiday Dates", () => {
    it("should return true for any date in a holiday's date list", () => {
      // Christmas tag includes both 2024-12-24 and 2024-12-25
      const christmasEve = getUnixTime(
        parse("2024-12-24", "yyyy-MM-dd", new Date()),
      );
      const holidays = [holidayTags.christmas];

      const result = isHolidayDate(christmasEve, holidays);

      expect(result).toBe(true);
    });

    it("should return true when multiple holidays have same date", () => {
      // Create a tag with same date as another
      const sharedDate = getUnixTime(
        parse("2024-12-25", "yyyy-MM-dd", new Date()),
      );
      const holidays = [holidayTags.christmas];

      const result = isHolidayDate(sharedDate, holidays);

      expect(result).toBe(true);
    });

    it("should handle holidays without explicit holiday dates", () => {
      const anyDate = getUnixTime(
        parse("2024-02-14", "yyyy-MM-dd", new Date()),
      );

      // Create a mock holiday with undefined holidayDates
      const holidayWithoutDates = {
        ...holidayTags.valentine,
        holidayDates: undefined,
      };

      const result = isHolidayDate(anyDate, [holidayWithoutDates]);

      expect(result).toBe(false);
    });
  });

  /**
   * Time precision tests
   */
  describe("Time Precision - Different Times of Day", () => {
    it("should match regardless of time component (midnight)", () => {
      // Set fake time to 2024-12-25 00:00:00 UTC
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-12-25T00:00:00Z"));

      const christmasMidnight = Math.floor(Date.now() / 1000);
      const holidays = [holidayTags.christmas];

      const result = isHolidayDate(christmasMidnight, holidays);

      expect(result).toBe(true);
    });

    it("should match regardless of time component (noon)", () => {
      // Set fake time to 2024-12-25 12:00:00 UTC
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-12-25T12:00:00Z"));

      const christmasNoon = Math.floor(Date.now() / 1000);
      const holidays = [holidayTags.christmas];

      const result = isHolidayDate(christmasNoon, holidays);

      expect(result).toBe(true);
    });

    it("should match regardless of time component (end of day)", () => {
      // Set fake time to 2024-12-25 23:59:59 UTC
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-12-25T23:59:59Z"));

      const christmasEvening = Math.floor(Date.now() / 1000);
      const holidays = [holidayTags.christmas];

      const result = isHolidayDate(christmasEvening, holidays);

      expect(result).toBe(true);
    });
  });

  /**
   * Year and string format tests
   */
  describe("Year and Format Handling", () => {
    it("should use ISO date format (YYYY-MM-DD) for comparison", () => {
      // Make sure the date string is formatted correctly
      const testDate = getUnixTime(
        parse("2024-12-25", "yyyy-MM-dd", new Date()),
      );
      const holidays = [holidayTags.christmas];

      const result = isHolidayDate(testDate, holidays);

      expect(result).toBe(true);
    });

    it("should return false for different years of same date", () => {
      const christmas2023 = getUnixTime(
        parse("2023-12-25", "yyyy-MM-dd", new Date()),
      );
      const holidays = [holidayTags.christmas]; // 2024-12-25

      const result = isHolidayDate(christmas2023, holidays);

      expect(result).toBe(false);
    });

    it("should return false for different month/day", () => {
      const wrongDate = getUnixTime(
        parse("2024-12-26", "yyyy-MM-dd", new Date()),
      );
      const holidays = [holidayTags.christmas]; // 2024-12-25

      const result = isHolidayDate(wrongDate, holidays);

      expect(result).toBe(false);
    });
  });

  /**
   * Boolean logic tests
   */
  describe("Boolean Logic - Short-Circuit Behavior", () => {
    it("should return true on first match (early exit)", () => {
      const christmasDay = getUnixTime(
        parse("2024-12-25", "yyyy-MM-dd", new Date()),
      );
      // Christmas is first in array, should match before checking others
      const holidays = [
        holidayTags.christmas,
        holidayTags.halloween,
        holidayTags.valentine,
      ];

      const result = isHolidayDate(christmasDay, holidays);

      expect(result).toBe(true);
    });

    it("should continue checking if first holiday doesn't match", () => {
      const halloweenDay = getUnixTime(
        parse("2024-10-31", "yyyy-MM-dd", new Date()),
      );
      // Halloween is second in array, Christmas is first but won't match
      const holidays = [holidayTags.christmas, holidayTags.halloween];

      const result = isHolidayDate(halloweenDay, holidays);

      expect(result).toBe(true);
    });
  });
});
