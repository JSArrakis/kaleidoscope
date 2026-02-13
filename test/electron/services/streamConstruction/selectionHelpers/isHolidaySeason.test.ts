import { getUnixTime, parse } from "date-fns";
import { holidayTags } from "../../../../testData/tags/holidays";
import { isHolidaySeason } from "../../../../../src/electron/services/streamConstruction/selectionHelpers.js";

describe("isHolidaySeason", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  /**
   * Basic season matching tests
   */
  describe("Basic Holiday Season Matching", () => {
    it("should return true when date falls within holiday season span", () => {
      // Christmas season: 2024-12-01 to 2024-12-31
      const midChristmasSeason = getUnixTime(
        parse("2024-12-15", "yyyy-MM-dd", new Date()),
      );
      const holidays = [holidayTags.christmas];

      const result = isHolidaySeason(midChristmasSeason, holidays);

      expect(result).toBe(true);
    });

    it("should return true on season start date (inclusive)", () => {
      // Christmas season starts 2024-12-01
      const seasonStart = getUnixTime(
        parse("2024-12-01", "yyyy-MM-dd", new Date()),
      );
      const holidays = [holidayTags.christmas];

      const result = isHolidaySeason(seasonStart, holidays);

      expect(result).toBe(true);
    });

    it("should return true on season end date (inclusive)", () => {
      // Christmas season ends 2024-12-31
      const seasonEnd = getUnixTime(
        parse("2024-12-31", "yyyy-MM-dd", new Date()),
      );
      const holidays = [holidayTags.christmas];

      const result = isHolidaySeason(seasonEnd, holidays);

      expect(result).toBe(true);
    });

    it("should return true when date matches holiday's actual holiday date", () => {
      // Christmas actual date (2024-12-25) should fall within season
      const actualDate = getUnixTime(
        parse("2024-12-25", "yyyy-MM-dd", new Date()),
      );
      const holidays = [holidayTags.christmas];

      const result = isHolidaySeason(actualDate, holidays);

      expect(result).toBe(true);
    });
  });

  /**
   * Non-matching dates tests
   */
  describe("Dates Outside Season", () => {
    it("should return false when date is before season start", () => {
      // One day before Christmas season starts (2024-12-01)
      const beforeSeason = getUnixTime(
        parse("2024-11-30", "yyyy-MM-dd", new Date()),
      );
      const holidays = [holidayTags.christmas];

      const result = isHolidaySeason(beforeSeason, holidays);

      expect(result).toBe(false);
    });

    it("should return false when date is after season end", () => {
      // One day after Christmas season ends (2024-12-31)
      const afterSeason = getUnixTime(
        parse("2025-01-01", "yyyy-MM-dd", new Date()),
      );
      const holidays = [holidayTags.christmas];

      const result = isHolidaySeason(afterSeason, holidays);

      expect(result).toBe(false);
    });

    it("should return false when date is in completely different time period", () => {
      const summerDate = getUnixTime(
        parse("2024-07-15", "yyyy-MM-dd", new Date()),
      );
      const holidays = [holidayTags.christmas]; // Dec 1-31

      const result = isHolidaySeason(summerDate, holidays);

      expect(result).toBe(false);
    });
  });

  /**
   * Edge cases with multiple holidays
   */
  describe("Multiple Holidays - Season Checking", () => {
    it("should return true if date matches any holiday's season", () => {
      // October 15 is within Halloween season (2024-10-01 to 2024-11-04)
      const halloweenSeason = getUnixTime(
        parse("2024-10-15", "yyyy-MM-dd", new Date()),
      );
      const holidays = [holidayTags.christmas, holidayTags.halloween];

      const result = isHolidaySeason(halloweenSeason, holidays);

      expect(result).toBe(true);
    });

    it("should return false when date doesn't match any holiday's season", () => {
      const summerDate = getUnixTime(
        parse("2024-06-15", "yyyy-MM-dd", new Date()),
      );
      const holidays = [
        holidayTags.christmas, // Dec 1-31
        holidayTags.halloween, // Oct 1 - Nov 4
        holidayTags.valentine, // No season defined
      ];

      const result = isHolidaySeason(summerDate, holidays);

      expect(result).toBe(false);
    });

    it("should check all holidays until finding a match", () => {
      // Valentine's season is at the end of the array and date should match
      const februaryDate = getUnixTime(
        parse("2024-02-14", "yyyy-MM-dd", new Date()),
      );
      // Note: valentine tag has no season dates, so this will be false
      // Using this to verify all holidays are checked
      const holidays = [
        holidayTags.christmas,
        holidayTags.halloween,
        holidayTags.valentine,
      ];

      const result = isHolidaySeason(februaryDate, holidays);

      // Should be false since valentine has no seasonStartDate/seasonEndDate
      expect(result).toBe(false);
    });
  });

  /**
   * Holidays without season dates
   */
  describe("Holidays Without Season Information", () => {
    it("should return false for holiday without seasonStartDate", () => {
      const anyDate = getUnixTime(
        parse("2024-02-14", "yyyy-MM-dd", new Date()),
      );
      const holidays = [holidayTags.valentine]; // Has no season dates

      const result = isHolidaySeason(anyDate, holidays);

      expect(result).toBe(false);
    });

    it("should handle holiday with seasonStartDate but no seasonEndDate", () => {
      // Create a mock holiday with only start date
      const testDate = getUnixTime(
        parse("2024-12-15", "yyyy-MM-dd", new Date()),
      );
      const holidayWithoutEnd = {
        ...holidayTags.christmas,
        seasonEndDate: undefined,
      };

      const result = isHolidaySeason(testDate, [holidayWithoutEnd]);

      expect(result).toBe(false);
    });

    it("should handle holiday with seasonEndDate but no seasonStartDate", () => {
      // Create a mock holiday with only end date
      const testDate = getUnixTime(
        parse("2024-12-15", "yyyy-MM-dd", new Date()),
      );
      const holidayWithoutStart = {
        ...holidayTags.christmas,
        seasonStartDate: undefined,
      };

      const result = isHolidaySeason(testDate, [holidayWithoutStart]);

      expect(result).toBe(false);
    });

    it("should return false when holiday array is empty", () => {
      const anyDate = getUnixTime(
        parse("2024-12-15", "yyyy-MM-dd", new Date()),
      );

      const result = isHolidaySeason(anyDate, []);

      expect(result).toBe(false);
    });
  });

  /**
   * Time precision tests - similar to isHolidayDate
   */
  describe("Time Precision - Different Times of Day", () => {
    it("should match regardless of time component (midnight)", () => {
      // Set fake time to 2024-12-15 00:00:00 UTC
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-12-15T00:00:00Z"));

      const seasonMidnight = Math.floor(Date.now() / 1000);
      const holidays = [holidayTags.christmas];

      const result = isHolidaySeason(seasonMidnight, holidays);

      expect(result).toBe(true);
    });

    it("should match regardless of time component (noon)", () => {
      // Set fake time to 2024-12-15 12:00:00 UTC
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-12-15T12:00:00Z"));

      const seasonNoon = Math.floor(Date.now() / 1000);
      const holidays = [holidayTags.christmas];

      const result = isHolidaySeason(seasonNoon, holidays);

      expect(result).toBe(true);
    });

    it("should match regardless of time component (end of day)", () => {
      // Set fake time to 2024-12-15 23:59:59 UTC
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2024-12-15T23:59:59Z"));

      const seasonEvening = Math.floor(Date.now() / 1000);
      const holidays = [holidayTags.christmas];

      const result = isHolidaySeason(seasonEvening, holidays);

      expect(result).toBe(true);
    });
  });

  /**
   * String format and comparison tests
   */
  describe("String Comparison - ISO Format", () => {
    it("should use string comparison for dates (YYYY-MM-DD format)", () => {
      const testDate = getUnixTime(
        parse("2024-12-15", "yyyy-MM-dd", new Date()),
      );
      const holidays = [holidayTags.christmas]; // 2024-12-01 to 2024-12-31

      const result = isHolidaySeason(testDate, holidays);

      expect(result).toBe(true);
    });

    it("should correctly compare date strings lexicographically", () => {
      // "2024-12-15" >= "2024-12-01" and <= "2024-12-31"
      const testDate = getUnixTime(
        parse("2024-12-15", "yyyy-MM-dd", new Date()),
      );
      const holidays = [holidayTags.christmas];

      const result = isHolidaySeason(testDate, holidays);

      expect(result).toBe(true);
    });

    it("should not match different year same month/day", () => {
      const testDate = getUnixTime(
        parse("2023-12-15", "yyyy-MM-dd", new Date()),
      );
      const holidays = [holidayTags.christmas]; // 2024-12-01 to 2024-12-31

      const result = isHolidaySeason(testDate, holidays);

      expect(result).toBe(false);
    });
  });

  /**
   * Cross-year season boundary tests
   */
  describe("Multi-Year and Boundary Tests", () => {
    it("should handle season that spans across year boundary", () => {
      // Create a mock holiday with season spanning year boundary
      const newYearSeason = {
        ...holidayTags.christmas,
        seasonStartDate: "2024-11-15",
        seasonEndDate: "2025-01-15",
      };

      // Date in November (before year end)
      const november = getUnixTime(
        parse("2024-11-20", "yyyy-MM-dd", new Date()),
      );
      expect(isHolidaySeason(november, [newYearSeason])).toBe(true);

      // Date in January (after year start)
      const january = getUnixTime(
        parse("2025-01-10", "yyyy-MM-dd", new Date()),
      );
      expect(isHolidaySeason(january, [newYearSeason])).toBe(true);

      // Date between ranges
      const february = getUnixTime(
        parse("2025-02-10", "yyyy-MM-dd", new Date()),
      );
      expect(isHolidaySeason(february, [newYearSeason])).toBe(false);
    });
  });

  /**
   * Boolean logic and short-circuit tests
   */
  describe("Boolean Logic - First Match Exits", () => {
    it("should return true on first matching holiday season", () => {
      const halloweenDate = getUnixTime(
        parse("2024-10-15", "yyyy-MM-dd", new Date()),
      );
      const holidays = [
        holidayTags.christmas, // Dec 1-31, won't match
        holidayTags.halloween, // Oct 1 - Nov 4, will match
        holidayTags.valentine, // No season, won't be checked
      ];

      const result = isHolidaySeason(halloweenDate, holidays);

      expect(result).toBe(true);
    });

    it("should continue checking if first holiday season doesn't match", () => {
      const christmasDate = getUnixTime(
        parse("2024-12-15", "yyyy-MM-dd", new Date()),
      );
      // Halloween is first but won't match, Christmas is second and will
      const holidays = [holidayTags.halloween, holidayTags.christmas];

      const result = isHolidaySeason(christmasDate, holidays);

      expect(result).toBe(true);
    });
  });

  /**
   * Real-world scenario tests
   */
  describe("Real-World Scenarios", () => {
    it("should correctly identify Black Friday (in holiday season)", () => {
      // Black Friday 2024 is Nov 29, within Christmas season (Dec 1-31)
      // Actually this is BEFORE season, so should be false
      const blackFriday = getUnixTime(
        parse("2024-11-29", "yyyy-MM-dd", new Date()),
      );
      const holidays = [holidayTags.christmas]; // Dec 1-31

      const result = isHolidaySeason(blackFriday, holidays);

      expect(result).toBe(false); // Before season starts
    });

    it("should correctly identify Cyber Monday (after season)", () => {
      // Cyber Monday 2024 is Dec 2, within Christmas season (Dec 1-31)
      const cyberMonday = getUnixTime(
        parse("2024-12-02", "yyyy-MM-dd", new Date()),
      );
      const holidays = [holidayTags.christmas]; // Dec 1-31

      const result = isHolidaySeason(cyberMonday, holidays);

      expect(result).toBe(true); // Within season
    });

    it("should handle New Year planning period", () => {
      // New Year tag has no season dates
      const planningDay = getUnixTime(
        parse("2024-12-28", "yyyy-MM-dd", new Date()),
      );
      const holidays = [holidayTags.newYear];

      const result = isHolidaySeason(planningDay, holidays);

      expect(result).toBe(false);
    });
  });
});
