import { getDateString } from "../../../../../src/electron/services/streamConstruction/selectionHelpers.js";

describe("getDateString", () => {
  it("should correctly format a standard Unix timestamp", () => {
    // May 15, 2023 10:00:00 AM UTC
    const unixTimestamp = 1684144800;
    expect(getDateString(unixTimestamp)).toBe("2023-05-15");
  });

  it("should correctly format the Unix epoch", () => {
    // January 1, 1970 00:00:00 AM UTC
    const unixTimestamp = 0;
    expect(getDateString(unixTimestamp)).toBe("1970-01-01");
  });

  it("should correctly format a leap day", () => {
    // February 29, 2024 12:00:00 PM UTC
    const unixTimestamp = 1709208000;
    expect(getDateString(unixTimestamp)).toBe("2024-02-29");
  });

  it("should correctly format the last day of the year", () => {
    // December 31, 2025 11:59:59 PM UTC
    const unixTimestamp = 1767225599;
    expect(getDateString(unixTimestamp)).toBe("2025-12-31");
  });

  it("should handle negative timestamps (pre-epoch)", () => {
    // December 31, 1969 11:59:59 PM UTC
    const unixTimestamp = -1;
    expect(getDateString(unixTimestamp)).toBe("1969-12-31");
  });

  it("should handle non-integer timestamps", () => {
    // May 15, 2023 10:00:00.500 AM UTC
    const unixTimestamp = 1684144800.5;
    expect(getDateString(unixTimestamp)).toBe("2023-05-15");
  });

  it("should be independent of local timezone", () => {
    // This timestamp is Jan 1, 1970 00:00:00 in GMT.
    // In a timezone like EST (GMT-5), this would be Dec 31, 1969.
    // The function should always return the UTC date.
    const unixTimestamp = 0;
    expect(getDateString(unixTimestamp)).toBe("1970-01-01");
  });
});
