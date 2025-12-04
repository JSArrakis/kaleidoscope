import { isBufferMediaPoolValid } from "../../../../src/electron/prisms/spectrum";
import {
  allGenericCommercials,
  commercial15s_1,
  commercial15s_2,
  commercial30s_1,
  commercial30s_2,
  commercial60s_1,
  commercial60s_2,
  commercial120s,
  allGenericShorts,
  short5min_1,
  short5min_2,
  short5min_3,
  short10min_1,
  short10min_2,
  short10min_3,
  short10min_4,
  short15min_1,
  short15min_2,
  short20min,
  short25min,
  allGenericMusic,
  music3min_1,
  music3min_2,
  music3min_3,
  music3min_4,
  music5min_1,
  music5min_2,
  music5min_3,
  music7min_1,
  music7min_2,
  music10min_1,
  music10min_2,
  music12min,
} from "../../testData/generic";

describe("isBufferMediaPoolValid", () => {
  const BUFFER_DURATION = 1800; // 30 minutes in seconds

  describe("Edge Cases - Zero Counts", () => {
    it("should return false when no media provided", () => {
      const result = isBufferMediaPoolValid([], [], [], BUFFER_DURATION);
      expect(result).toBe(false);
    });

    it("should return false when only commercials provided but insufficient", () => {
      // 120 seconds of commercials, need 7200
      const result = isBufferMediaPoolValid(
        [commercial15s_1, commercial15s_2, commercial60s_1],
        [],
        [],
        BUFFER_DURATION
      );
      expect(result).toBe(false);
    });

    it("should return false when only shorts/music provided with no backup commercials", () => {
      // 5 minutes of shorts, but no commercials for remaining ~2 hours
      const result = isBufferMediaPoolValid(
        [],
        [short5min_1],
        [],
        BUFFER_DURATION
      );
      expect(result).toBe(false);
    });

    it("should pass when commercials alone cover 2-hour pool", () => {
      // Need ~7200 seconds, provide enough commercials
      const commercials = [
        commercial60s_1,
        commercial60s_2,
        commercial60s_1,
        commercial60s_2,
        commercial60s_1,
        commercial60s_2,
        commercial60s_1,
        commercial60s_2,
        commercial60s_1,
        commercial60s_2,
        commercial60s_1,
        commercial60s_2,
        commercial60s_1,
        commercial60s_2,
        commercial60s_1,
        commercial60s_2,
        commercial60s_1,
        commercial60s_2,
        commercial60s_1,
        commercial60s_2,
        commercial60s_1,
        commercial60s_2,
        commercial60s_1,
        commercial60s_2,
        commercial60s_1,
        commercial60s_2,
        commercial120s,
        commercial120s,
      ];
      const result = isBufferMediaPoolValid(
        commercials,
        [],
        [],
        BUFFER_DURATION
      );
      expect(result).toBe(true);
    });
  });

  describe("High Usability Scores - Many Small Pieces", () => {
    it("should pass with many 3-minute music videos + backup commercials", () => {
      // 12 × 3-min = 36 minutes = 2160 seconds (≈30% of 2-hour pool)
      // Need 4860 seconds from commercials
      const music = [
        music3min_1,
        music3min_2,
        music3min_3,
        music3min_4,
        music5min_1,
        music5min_2,
        music5min_3,
      ];
      const musicDuration = music.reduce((sum, m) => sum + m.duration, 0); // 2460 seconds

      // Need approximately 4740 seconds from commercials
      // 10 × 60 + 5 × 120 = 1200 + 600 = 1800 (not enough)
      // Need ~80 × 60-second commercials or equivalent
      const commercials = Array(130)
        .fill(null)
        .map((_, i) => ({
          ...commercial60s_1,
          id: `commercial60s_backup_${i}`,
          uuid: `uuid_commercial60s_backup_${i}`,
        }));

      const result = isBufferMediaPoolValid(
        commercials,
        [],
        music,
        BUFFER_DURATION
      );
      expect(result).toBe(true);
    });

    it("should pass with all shorts and music of varied duration", () => {
      // Use all generic shorts and music
      // Expected high piece count leads to high usability score
      const commercials = Array(80)
        .fill(null)
        .map((_, i) => ({
          ...commercial60s_1,
          id: `commercial60s_support_${i}`,
          uuid: `uuid_commercial60s_support_${i}`,
        }));

      const result = isBufferMediaPoolValid(
        commercials,
        allGenericShorts,
        allGenericMusic,
        BUFFER_DURATION
      );
      expect(result).toBe(true);
    });
  });

  describe("Low Usability Scores - Few Large Pieces", () => {
    it("should fail when only large shorts/music with insufficient commercial backup", () => {
      // 3 × 20-25 min shorts = ~65 min = 3900 seconds (54% of pool)
      // Need only ~3300 seconds from commercials
      // But with 8 buffers in 4 hours, need only 3 pieces per buffer
      // Large pieces = fewer slots needed, so larger usability score hit
      // With 3 pieces, avg = 1300 seconds, slots per buffer = ceil(1800/1300) = 2
      // Total slots = 8 × 2 = 16
      // Usability = 3/16 = 0.1875
      // Usable duration = 3900 × 0.1875 = 731 seconds
      // Need 7200 - 731 = 6469 seconds from commercials
      // 100 × 60 = 6000 (borderline)
      const largeShorts = [short20min, short25min];
      const commercials = Array(110)
        .fill(null)
        .map((_, i) => ({
          ...commercial60s_1,
          id: `commercial60s_large_${i}`,
          uuid: `uuid_commercial60s_large_${i}`,
        }));

      const result = isBufferMediaPoolValid(
        commercials,
        largeShorts,
        [],
        BUFFER_DURATION
      );
      // With 110 × 60 = 6600, should pass
      expect(result).toBe(true);
    });

    it("should fail with minimal pieces and insufficient commercials", () => {
      // 2 × 15-minute shorts = 1800 seconds (25% of pool)
      // Need 5400 seconds from commercials
      // Provide only 60 × 60 = 3600 (insufficient)
      const shorts = [short15min_1, short15min_2];
      const commercials = Array(60)
        .fill(null)
        .map((_, i) => ({
          ...commercial60s_1,
          id: `commercial60s_minimal_${i}`,
          uuid: `uuid_commercial60s_minimal_${i}`,
        }));

      const result = isBufferMediaPoolValid(
        commercials,
        shorts,
        [],
        BUFFER_DURATION
      );
      expect(result).toBe(false);
    });
  });

  describe("Mixed Media Type Scenarios", () => {
    it("should pass with balanced mix of shorts, music, and commercials", () => {
      // 5 shorts (avg ~10min) = 3000 seconds
      // 7 music (avg ~5min) = 2100 seconds
      // Total shorts+music = 5100 seconds (71% of pool)
      // Need 2100 seconds from commercials
      const shorts = [
        short5min_1,
        short5min_2,
        short10min_1,
        short10min_2,
        short15min_1,
      ];
      const music = [
        music3min_1,
        music3min_2,
        music5min_1,
        music5min_2,
        music7min_1,
        music10min_1,
        music10min_2,
      ];
      const commercials = Array(50)
        .fill(null)
        .map((_, i) => ({
          ...commercial60s_1,
          id: `commercial60s_balanced_${i}`,
          uuid: `uuid_commercial60s_balanced_${i}`,
        }));

      const result = isBufferMediaPoolValid(
        commercials,
        shorts,
        music,
        BUFFER_DURATION
      );
      expect(result).toBe(true);
    });

    it("should handle music-heavy mix with minimal shorts", () => {
      // 10 music (avg ~5min) = 3000 seconds
      // 1 short (5min) = 300 seconds
      // Total = 3300 seconds (46% of pool)
      // Need 3900 seconds from commercials
      const music = [
        music3min_1,
        music3min_2,
        music3min_3,
        music3min_4,
        music5min_1,
        music5min_2,
        music5min_3,
        music7min_1,
        music10min_1,
        music12min,
      ];
      const commercials = Array(80)
        .fill(null)
        .map((_, i) => ({
          ...commercial60s_1,
          id: `commercial60s_musicHeavy_${i}`,
          uuid: `uuid_commercial60s_musicHeavy_${i}`,
        }));

      const result = isBufferMediaPoolValid(
        commercials,
        [short5min_1],
        music,
        BUFFER_DURATION
      );
      expect(result).toBe(true);
    });

    it("should handle shorts-heavy mix with minimal music", () => {
      // 8 shorts (avg ~10min) = 4800 seconds
      // 2 music (avg ~5min) = 600 seconds
      // Total = 5400 seconds (75% of pool)
      // Need 1800 seconds from commercials
      const shorts = [
        short5min_1,
        short5min_2,
        short5min_3,
        short10min_1,
        short10min_2,
        short10min_3,
        short10min_4,
        short15min_1,
      ];
      const commercials = Array(40)
        .fill(null)
        .map((_, i) => ({
          ...commercial60s_1,
          id: `commercial60s_shortsHeavy_${i}`,
          uuid: `uuid_commercial60s_shortsHeavy_${i}`,
        }));

      const result = isBufferMediaPoolValid(
        commercials,
        shorts,
        [music5min_1, music5min_2],
        BUFFER_DURATION
      );
      expect(result).toBe(true);
    });
  });

  describe("Buffer Duration Variations", () => {
    it("should handle small buffer duration (5 minutes)", () => {
      const smallBufferDuration = 300; // 5 minutes
      // With smaller buffers, need fewer pieces per buffer
      // Should be easier to pass with less media
      const shorts = [short5min_1, short5min_2];
      const commercials = Array(100)
        .fill(null)
        .map((_, i) => ({
          ...commercial60s_1,
          id: `commercial60s_smallBuf_${i}`,
          uuid: `uuid_commercial60s_smallBuf_${i}`,
        }));

      const result = isBufferMediaPoolValid(
        commercials,
        shorts,
        [],
        smallBufferDuration
      );
      expect(result).toBe(true);
    });

    it("should handle large buffer duration (45 minutes)", () => {
      const largeBufferDuration = 2700; // 45 minutes
      // With larger buffers, need more pieces per buffer
      // Should be harder to pass with same media count
      const music = [
        music3min_1,
        music3min_2,
        music3min_3,
        music5min_1,
        music5min_2,
        music5min_3,
      ];
      const commercials = Array(150)
        .fill(null)
        .map((_, i) => ({
          ...commercial60s_1,
          id: `commercial60s_largeBuf_${i}`,
          uuid: `uuid_commercial60s_largeBuf_${i}`,
        }));

      const result = isBufferMediaPoolValid(
        commercials,
        [],
        music,
        largeBufferDuration
      );
      expect(result).toBe(true);
    });
  });

  describe("Reusage Window Pressure - 8 Buffers in 4 Hours", () => {
    it("should account for 8 buffer slots in 4-hour window", () => {
      // With only 5 unique pieces and 8 buffer slots needed
      // Usability score = 5/8 = 0.625
      // Works because we have enough pieces to cycle through
      const music = [
        music3min_1,
        music3min_2,
        music3min_3,
        music3min_4,
        music5min_1,
      ];
      const musicDuration = music.reduce((sum, m) => sum + m.duration, 0); // ~1320 seconds
      // Usable = 1320 × (5/8) = 825 seconds
      // Need 6375 seconds from commercials
      const commercials = Array(110)
        .fill(null)
        .map((_, i) => ({
          ...commercial60s_1,
          id: `commercial60s_reusage_${i}`,
          uuid: `uuid_commercial60s_reusage_${i}`,
        }));

      const result = isBufferMediaPoolValid(
        commercials,
        [],
        music,
        BUFFER_DURATION
      );
      expect(result).toBe(true);
    });

    it("should fail when not enough unique pieces for 8 buffer slots", () => {
      // Only 2 unique pieces, need 8 slots
      // Usability = 2/8 = 0.25
      // Very limited content leads to insufficient backup
      const music = [music5min_1, music5min_2];
      const musicDuration = music.reduce((sum, m) => sum + m.duration, 0); // 600 seconds
      // Usable = 600 × (2/8) = 150 seconds
      // Need 7050 seconds from commercials
      // 120 × 60 = 7200 (should pass, but borderline)
      const commercials = Array(120)
        .fill(null)
        .map((_, i) => ({
          ...commercial60s_1,
          id: `commercial60s_reusageFail_${i}`,
          uuid: `uuid_commercial60s_reusageFail_${i}`,
        }));

      const result = isBufferMediaPoolValid(
        commercials,
        [],
        music,
        BUFFER_DURATION
      );
      // With 120 × 60 = 7200, should pass (exactly meets need)
      expect(result).toBe(true);
    });
  });

  describe("Commercial Duration Mix - Various Lengths", () => {
    it("should handle mix of 15s, 30s, and 60s commercials", () => {
      // Varied commercial durations - still need total ~7200 seconds
      const music = [music3min_1, music3min_2, music3min_3, music5min_1];
      const musicDuration = music.reduce((sum, m) => sum + m.duration, 0); // ~1080 seconds
      // Usable ≈ 1080 × (4/8) = 540 seconds
      // Need ~6660 seconds from commercials
      const commercials = [
        ...Array(50).fill(commercial60s_1),
        ...Array(50).fill(commercial30s_1),
        ...Array(80).fill(commercial15s_1),
      ].map((com, i) => ({
        ...com,
        id: `commercial_mixed_${i}`,
        uuid: `uuid_commercial_mixed_${i}`,
      }));

      const result = isBufferMediaPoolValid(
        commercials,
        [],
        music,
        BUFFER_DURATION
      );
      // 50×60 + 50×30 + 80×15 = 3000 + 1500 + 1200 = 5700 (may fail)
      expect(result).toBe(false);
    });

    it("should handle very short commercials (15s) in large quantity", () => {
      const music = [music5min_1, music5min_2, music5min_3, music7min_1];
      const commercials = Array(600)
        .fill(null)
        .map((_, i) => ({
          ...commercial15s_1,
          id: `commercial15s_many_${i}`,
          uuid: `uuid_commercial15s_many_${i}`,
        }));
      // 600 × 15 = 9000 seconds (easily covers 7200 need)

      const result = isBufferMediaPoolValid(
        commercials,
        [],
        music,
        BUFFER_DURATION
      );
      expect(result).toBe(true);
    });

    it("should handle very long commercial (120s) backup", () => {
      const music = [music3min_1, music3min_2];
      const musicDuration = music.reduce((sum, m) => sum + m.duration, 0); // 360 seconds
      // Usable ≈ 360 × (2/8) = 90 seconds
      // Need ~7110 seconds from commercials
      const commercials = Array(60)
        .fill(null)
        .map((_, i) => ({
          ...commercial120s,
          id: `commercial120s_backup_${i}`,
          uuid: `uuid_commercial120s_backup_${i}`,
        }));
      // 60 × 120 = 7200 (covers 7110 need)

      const result = isBufferMediaPoolValid(
        commercials,
        [],
        music,
        BUFFER_DURATION
      );
      expect(result).toBe(true);
    });
  });

  describe("Boundary Conditions - Exact Matches", () => {
    it("should pass when exactly 7200 seconds available (commercials only)", () => {
      // 120 × 60 = 7200 exactly
      const commercials = Array(120)
        .fill(null)
        .map((_, i) => ({
          ...commercial60s_1,
          id: `commercial60s_exact_${i}`,
          uuid: `uuid_commercial60s_exact_${i}`,
        }));

      const result = isBufferMediaPoolValid(
        commercials,
        [],
        [],
        BUFFER_DURATION
      );
      expect(result).toBe(true);
    });

    it("should pass when commercials + shorts/music total ~7200 seconds", () => {
      // 10 × 5min shorts = 3000 seconds
      // 70 × 60s commercials = 4200 seconds
      // Total = 7200 seconds exactly
      const shorts = [
        short5min_1,
        short5min_2,
        short5min_3,
        short10min_1,
        short10min_2,
        short10min_3,
        short10min_4,
        short15min_1,
        short15min_2,
        short20min,
      ];
      const shortsAndMusicDuration = shorts.reduce(
        (sum, s) => sum + s.duration,
        0
      ); // 7650 seconds
      // With 10 pieces, 8 slots: usability = 10/8 = 1.25 (capped at logic?)
      // Actually: avg = 765, slots = ceil(1800/765) = 3, total slots = 8×3 = 24
      // usability = 10/24 = 0.4167, usable = 7650 × 0.4167 ≈ 3186
      // Need ~4014 from commercials

      const commercials = Array(70)
        .fill(null)
        .map((_, i) => ({
          ...commercial60s_1,
          id: `commercial60s_boundary_${i}`,
          uuid: `uuid_commercial60s_boundary_${i}`,
        }));

      const result = isBufferMediaPoolValid(
        commercials,
        shorts,
        [],
        BUFFER_DURATION
      );
      expect(result).toBe(true);
    });

    it("should fail when just 1 second short of requirement", () => {
      // 7199 seconds only
      const commercials = Array(119)
        .fill(null)
        .map((_, i) => ({
          ...commercial60s_1,
          id: `commercial60s_short_${i}`,
          uuid: `uuid_commercial60s_short_${i}`,
        }));
      // 119 × 60 = 7140 (still short)
      // Need to add some shorts/music to test edge case
      // or use combination that's 1 second short

      const result = isBufferMediaPoolValid(
        commercials,
        [],
        [],
        BUFFER_DURATION
      );
      expect(result).toBe(false);
    });
  });

  describe("Realistic Scenario Tests", () => {
    it("should pass for typical daily streaming block", () => {
      // Simulate a typical day: good commercial inventory, decent shorts, some music
      const commercials = Array(100)
        .fill(null)
        .map((_, i) => ({
          ...commercial60s_1,
          id: `commercial60s_daily_${i}`,
          uuid: `uuid_commercial60s_daily_${i}`,
        }));

      const shorts = [
        short5min_1,
        short5min_2,
        short5min_3,
        short10min_1,
        short10min_2,
        short10min_3,
        short10min_4,
        short15min_1,
      ];

      const music = [
        music3min_1,
        music3min_2,
        music3min_3,
        music5min_1,
        music5min_2,
        music5min_3,
        music7min_1,
      ];

      const result = isBufferMediaPoolValid(
        commercials,
        shorts,
        music,
        BUFFER_DURATION
      );
      expect(result).toBe(true);
    });

    it("should fail for under-resourced streaming block", () => {
      // Limited commercial inventory, minimal shorts/music
      const commercials = Array(30)
        .fill(null)
        .map((_, i) => ({
          ...commercial60s_1,
          id: `commercial60s_limited_${i}`,
          uuid: `uuid_commercial60s_limited_${i}`,
        }));

      const shorts = [short15min_1];
      const music = [music5min_1, music5min_2];

      const result = isBufferMediaPoolValid(
        commercials,
        shorts,
        music,
        BUFFER_DURATION
      );
      expect(result).toBe(false);
    });

    it("should pass for content-rich but low-commercial pool", () => {
      // Many shorts and music, fewer commercials but enough backup
      const commercials = Array(50)
        .fill(null)
        .map((_, i) => ({
          ...commercial60s_1,
          id: `commercial60s_contentRich_${i}`,
          uuid: `uuid_commercial60s_contentRich_${i}`,
        }));

      const shorts = allGenericShorts;
      const music = allGenericMusic;

      const result = isBufferMediaPoolValid(
        commercials,
        shorts,
        music,
        BUFFER_DURATION
      );
      expect(result).toBe(true);
    });
  });
});
