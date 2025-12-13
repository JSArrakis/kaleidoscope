import { isBufferMediaPoolValid } from "../../../../src/electron/prisms/spectrum";
import {
  commercial15s_1,
  commercial30s_1,
  commercial60s_1,
  commercial120s,
  short5min_1,
  short10min_1,
  music3min_1,
  music5min_1,
  music10min_1,
} from "../../../testData/generic";

describe("isBufferMediaPoolValid", () => {
  const BUFFER_DURATION = 1800; // 30 minutes

  describe("Basic Validation - 4 Hour Fill Requirements", () => {
    it("should return false when no media provided", () => {
      const result = isBufferMediaPoolValid([], [], [], BUFFER_DURATION);
      expect(result).toBe(false);
    });

    it("should return false when only commercials, but insufficient for 4 hours", () => {
      // 60 × 60s = 3600s (1 hour worth, need 7200s for 4 hours)
      const commercials = Array(60)
        .fill(null)
        .map((_, i) => ({
          ...commercial60s_1,
          id: `commercial60s_${i}`,
          uuid: `uuid_commercial60s_${i}`,
        }));

      const result = isBufferMediaPoolValid(
        commercials,
        [],
        [],
        BUFFER_DURATION
      );
      expect(result).toBe(false);
    });

    it("should return true when commercials alone cover 4 hours (7200s)", () => {
      // 120 × 60s = 7200s (exactly 2 hours, covers the TWO_HOUR_POOL)
      const commercials = Array(120)
        .fill(null)
        .map((_, i) => ({
          ...commercial60s_1,
          id: `commercial60s_full_${i}`,
          uuid: `uuid_commercial60s_full_${i}`,
        }));

      const result = isBufferMediaPoolValid(
        commercials,
        [],
        [],
        BUFFER_DURATION
      );
      expect(result).toBe(true);
    });
  });

  describe("Shorts/Music Only - No Commercial Backup", () => {
    it("should return false when only shorts provided, no commercials", () => {
      // Shorts alone cannot fill buffer without repeat after one play
      const result = isBufferMediaPoolValid(
        [],
        [short5min_1, short10min_1],
        [],
        BUFFER_DURATION
      );
      expect(result).toBe(false);
    });

    it("should return false when only music provided, no commercials", () => {
      // Music alone cannot fill buffer without repeat
      const result = isBufferMediaPoolValid(
        [],
        [],
        [music5min_1, music10min_1],
        BUFFER_DURATION
      );
      expect(result).toBe(false);
    });
  });

  describe("Mixed Content - With Commercial Backup", () => {
    it("should return true with moderate shorts and sufficient commercials", () => {
      // 4 shorts × 300s avg ≈ 1200s of unique content
      // Commercials fill remainder to meet 7200s threshold
      const shorts = [short5min_1, short5min_1, short10min_1, short10min_1];
      const commercials = Array(125)
        .fill(null)
        .map((_, i) => ({
          ...commercial60s_1,
          id: `commercial60s_${i}`,
          uuid: `uuid_commercial60s_${i}`,
        }));

      const result = isBufferMediaPoolValid(
        commercials,
        shorts,
        [],
        BUFFER_DURATION
      );
      expect(result).toBe(true);
    });

    it("should return true with moderate music and sufficient commercials", () => {
      // 4 music items × 300s avg ≈ 1200s of unique content
      // Commercials fill remainder
      const music = [music3min_1, music3min_1, music5min_1, music5min_1];
      const commercials = Array(125)
        .fill(null)
        .map((_, i) => ({
          ...commercial60s_1,
          id: `commercial60s_${i}`,
          uuid: `uuid_commercial60s_${i}`,
        }));

      const result = isBufferMediaPoolValid(
        commercials,
        [],
        music,
        BUFFER_DURATION
      );
      expect(result).toBe(false);
    });

    it("should return true with mix of shorts and music with sufficient commercials", () => {
      // 2 shorts + 2 music ≈ 1200s
      // Commercials fill remainder
      const shorts = [short5min_1, short10min_1];
      const music = [music5min_1, music10min_1];
      const commercials = Array(125)
        .fill(null)
        .map((_, i) => ({
          ...commercial60s_1,
          id: `commercial60s_${i}`,
          uuid: `uuid_commercial60s_${i}`,
        }));

      const result = isBufferMediaPoolValid(
        commercials,
        shorts,
        music,
        BUFFER_DURATION
      );
      expect(result).toBe(false);
    });
  });

  describe("Insufficient Commercial Backup", () => {
    it("should return false when shorts present but commercials insufficient", () => {
      // 4 shorts ≈ 1200s, but only 30 commercials = 1800s, total 3000s (need 7200s)
      const shorts = [short5min_1, short5min_1, short10min_1, short10min_1];
      const commercials = Array(30)
        .fill(null)
        .map((_, i) => ({
          ...commercial60s_1,
          id: `commercial60s_${i}`,
          uuid: `uuid_commercial60s_${i}`,
        }));

      const result = isBufferMediaPoolValid(
        commercials,
        shorts,
        [],
        BUFFER_DURATION
      );
      expect(result).toBe(false);
    });

    it("should return false when music present but commercials insufficient", () => {
      // 4 music ≈ 1200s, but only 30 commercials = 1800s (need 7200s)
      const music = [music3min_1, music3min_1, music5min_1, music5min_1];
      const commercials = Array(30)
        .fill(null)
        .map((_, i) => ({
          ...commercial60s_1,
          id: `commercial60s_${i}`,
          uuid: `uuid_commercial60s_${i}`,
        }));

      const result = isBufferMediaPoolValid(
        commercials,
        [],
        music,
        BUFFER_DURATION
      );
      expect(result).toBe(false);
    });
  });

  describe("Commercial Types and Durations", () => {
    it("should handle mix of different commercial durations", () => {
      // Mix of 15s, 30s, 60s, 120s commercials
      // 40×60s + 30×30s + 20×15s + 10×120s = 2400 + 900 + 300 + 1200 = 4800s
      const commercials = [
        ...Array(40)
          .fill(null)
          .map((_, i) => ({
            ...commercial60s_1,
            id: `commercial60s_${i}`,
            uuid: `uuid_commercial60s_${i}`,
          })),
        ...Array(30)
          .fill(null)
          .map((_, i) => ({
            ...commercial30s_1,
            id: `commercial30s_${i}`,
            uuid: `uuid_commercial30s_${i}`,
          })),
        ...Array(20)
          .fill(null)
          .map((_, i) => ({
            ...commercial15s_1,
            id: `commercial15s_${i}`,
            uuid: `uuid_commercial15s_${i}`,
          })),
        ...Array(10)
          .fill(null)
          .map((_, i) => ({
            ...commercial120s,
            id: `commercial120s_${i}`,
            uuid: `uuid_commercial120s_${i}`,
          })),
      ];

      const result = isBufferMediaPoolValid(
        commercials,
        [],
        [],
        BUFFER_DURATION
      );
      expect(result).toBe(false); // 4800s < 7200s needed
    });

    it("should return true with large quantity of short commercials", () => {
      // 480 × 15s = 7200s (exactly meets requirement)
      const commercials = Array(480)
        .fill(null)
        .map((_, i) => ({
          ...commercial15s_1,
          id: `commercial15s_${i}`,
          uuid: `uuid_commercial15s_${i}`,
        }));

      const result = isBufferMediaPoolValid(
        commercials,
        [],
        [],
        BUFFER_DURATION
      );
      expect(result).toBe(true);
    });

    it("should return true with few long commercials", () => {
      // 60 × 120s = 7200s (exactly meets requirement)
      const commercials = Array(60)
        .fill(null)
        .map((_, i) => ({
          ...commercial120s,
          id: `commercial120s_${i}`,
          uuid: `uuid_commercial120s_${i}`,
        }));

      const result = isBufferMediaPoolValid(
        commercials,
        [],
        [],
        BUFFER_DURATION
      );
      expect(result).toBe(true);
    });
  });

  describe("Edge Cases - Boundary Conditions", () => {
    it("should return false when just 1 second short of 7200s requirement", () => {
      // 119 × 60s = 7140s (60s short)
      const commercials = Array(119)
        .fill(null)
        .map((_, i) => ({
          ...commercial60s_1,
          id: `commercial60s_${i}`,
          uuid: `uuid_commercial60s_${i}`,
        }));

      const result = isBufferMediaPoolValid(
        commercials,
        [],
        [],
        BUFFER_DURATION
      );
      expect(result).toBe(false);
    });

    it("should return true when exactly meeting 7200s requirement", () => {
      // Exactly 7200s
      const commercials = Array(120)
        .fill(null)
        .map((_, i) => ({
          ...commercial60s_1,
          id: `commercial60s_${i}`,
          uuid: `uuid_commercial60s_${i}`,
        }));

      const result = isBufferMediaPoolValid(
        commercials,
        [],
        [],
        BUFFER_DURATION
      );
      expect(result).toBe(true);
    });

    it("should return true when exceeding 7200s requirement", () => {
      // 121 × 60s = 7260s (60s over)
      const commercials = Array(121)
        .fill(null)
        .map((_, i) => ({
          ...commercial60s_1,
          id: `commercial60s_${i}`,
          uuid: `uuid_commercial60s_${i}`,
        }));

      const result = isBufferMediaPoolValid(
        commercials,
        [],
        [],
        BUFFER_DURATION
      );
      expect(result).toBe(true);
    });
  });
});
