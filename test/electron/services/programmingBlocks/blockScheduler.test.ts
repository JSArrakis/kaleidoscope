import {
  findActiveScheduledBlock,
  findNextScheduledBlock,
} from "../../../../src/electron/services/programmingBlocks/blockScheduler";

function toUnix(
  year: number,
  monthOneBased: number,
  day: number,
  hour: number,
  minute: number,
): number {
  return Math.floor(
    new Date(year, monthOneBased - 1, day, hour, minute, 0, 0).getTime() / 1000,
  );
}

function makeBlock(
  overrides: Partial<ProgrammingBlockDefinition> = {},
): ProgrammingBlockDefinition {
  return {
    programmingBlockId: "pb-default",
    name: "Default Block",
    type: "TagThemed",
    durationMinutes: 60,
    active: true,
    schedule: {
      recurrence: "Daily",
      timeOfDay: "12:00",
    },
    ...overrides,
  };
}

describe("blockScheduler", () => {
  describe("findNextScheduledBlock", () => {
    it("returns null when no blocks are provided", () => {
      const result = findNextScheduledBlock(
        [],
        toUnix(2026, 4, 22, 0, 0),
        toUnix(2026, 4, 22, 23, 59),
      );
      expect(result).toBeNull();
    });

    it("finds the nearest upcoming active block in window", () => {
      const blocks: ProgrammingBlockDefinition[] = [
        makeBlock({
          programmingBlockId: "pb-late",
          name: "Late",
          schedule: { recurrence: "Daily", timeOfDay: "18:00" },
        }),
        makeBlock({
          programmingBlockId: "pb-soon",
          name: "Soon",
          schedule: { recurrence: "Daily", timeOfDay: "10:30" },
        }),
      ];

      const windowStart = toUnix(2026, 4, 22, 9, 45);
      const windowEnd = toUnix(2026, 4, 22, 23, 59);
      const result = findNextScheduledBlock(blocks, windowStart, windowEnd);

      expect(result).not.toBeNull();
      expect(result?.programmingBlockId).toBe("pb-soon");
      expect(result?.scheduledStartTime).toBe(toUnix(2026, 4, 22, 10, 30));
      expect(result?.scheduledEndTime).toBe(toUnix(2026, 4, 22, 11, 30));
    });

    it("ignores inactive blocks", () => {
      const blocks: ProgrammingBlockDefinition[] = [
        makeBlock({
          programmingBlockId: "pb-inactive",
          active: false,
          schedule: { recurrence: "Daily", timeOfDay: "10:00" },
        }),
        makeBlock({
          programmingBlockId: "pb-active",
          active: true,
          schedule: { recurrence: "Daily", timeOfDay: "11:00" },
        }),
      ];

      const result = findNextScheduledBlock(
        blocks,
        toUnix(2026, 4, 22, 9, 0),
        toUnix(2026, 4, 22, 20, 0),
      );

      expect(result?.programmingBlockId).toBe("pb-active");
    });

    it("matches weekly schedules by day-of-week", () => {
      // 2026-04-22 is a Wednesday (3)
      const blocks: ProgrammingBlockDefinition[] = [
        makeBlock({
          programmingBlockId: "pb-weekly-match",
          schedule: {
            recurrence: "Weekly",
            daysOfWeek: [3],
            timeOfDay: "14:30",
          },
        }),
        makeBlock({
          programmingBlockId: "pb-weekly-miss",
          schedule: {
            recurrence: "Weekly",
            daysOfWeek: [2],
            timeOfDay: "10:00",
          },
        }),
      ];

      const result = findNextScheduledBlock(
        blocks,
        toUnix(2026, 4, 22, 8, 0),
        toUnix(2026, 4, 22, 23, 30),
      );

      expect(result?.programmingBlockId).toBe("pb-weekly-match");
      expect(result?.scheduledStartTime).toBe(toUnix(2026, 4, 22, 14, 30));
    });

    it("matches OneTime schedule only on the exact date", () => {
      const block = makeBlock({
        programmingBlockId: "pb-onetime",
        schedule: {
          recurrence: "OneTime",
          year: 2026,
          month: 4,
          dayOfMonth: 22,
          timeOfDay: "16:00",
        },
      });

      const result = findNextScheduledBlock(
        [block],
        toUnix(2026, 4, 22, 15, 0),
        toUnix(2026, 4, 22, 23, 0),
      );

      expect(result?.programmingBlockId).toBe("pb-onetime");
      expect(result?.scheduledStartTime).toBe(toUnix(2026, 4, 22, 16, 0));
    });

    it("rejects invalid times that are not on :00/:30", () => {
      const block = makeBlock({
        programmingBlockId: "pb-invalid-time",
        schedule: {
          recurrence: "Daily",
          timeOfDay: "10:15",
        },
      });

      const result = findNextScheduledBlock(
        [block],
        toUnix(2026, 4, 22, 0, 0),
        toUnix(2026, 4, 22, 23, 59),
      );

      expect(result).toBeNull();
    });

    it("rejects non-numeric and out-of-range timeOfDay values", () => {
      const badNumeric = makeBlock({
        programmingBlockId: "pb-bad-numeric",
        schedule: { recurrence: "Daily", timeOfDay: "aa:00" },
      });
      const badHour = makeBlock({
        programmingBlockId: "pb-bad-hour",
        schedule: { recurrence: "Daily", timeOfDay: "24:00" },
      });

      const result = findNextScheduledBlock(
        [badNumeric, badHour],
        toUnix(2026, 4, 22, 0, 0),
        toUnix(2026, 4, 22, 23, 59),
      );

      expect(result).toBeNull();
    });

    it("supports monthly and yearly recurrence matching", () => {
      const monthly = makeBlock({
        programmingBlockId: "pb-monthly",
        schedule: {
          recurrence: "Monthly",
          dayOfMonth: 22,
          timeOfDay: "08:30",
        },
      });
      const yearly = makeBlock({
        programmingBlockId: "pb-yearly",
        schedule: {
          recurrence: "Yearly",
          month: 4,
          dayOfMonth: 22,
          timeOfDay: "09:00",
        },
      });

      const result = findNextScheduledBlock(
        [yearly, monthly],
        toUnix(2026, 4, 22, 8, 0),
        toUnix(2026, 4, 22, 23, 59),
      );

      expect(result?.programmingBlockId).toBe("pb-monthly");
      expect(result?.scheduledStartTime).toBe(toUnix(2026, 4, 22, 8, 30));
    });

    it("returns null for unknown recurrence values", () => {
      const invalidRecurrence = makeBlock({
        programmingBlockId: "pb-invalid-recur",
        schedule: {
          recurrence:
            "NotARealRecurrence" as unknown as ProgrammingBlockRecurrence,
          timeOfDay: "10:00",
        },
      });

      const result = findNextScheduledBlock(
        [invalidRecurrence],
        toUnix(2026, 4, 22, 0, 0),
        toUnix(2026, 4, 22, 23, 59),
      );

      expect(result).toBeNull();
    });

    it("treats window end as exclusive", () => {
      const exactEnd = makeBlock({
        programmingBlockId: "pb-end-exclusive",
        schedule: { recurrence: "Daily", timeOfDay: "12:00" },
      });

      const result = findNextScheduledBlock(
        [exactEnd],
        toUnix(2026, 4, 22, 11, 0),
        toUnix(2026, 4, 22, 12, 0),
      );

      expect(result).toBeNull();
    });

    it("sets cadenceCompatibility to CadencedOnly for ShowOrder type", () => {
      const showOrderBlock = makeBlock({
        programmingBlockId: "pb-show-order",
        type: "ShowOrder",
        schedule: { recurrence: "Daily", timeOfDay: "14:00" },
      });

      const result = findNextScheduledBlock(
        [showOrderBlock],
        toUnix(2026, 4, 22, 13, 0),
        toUnix(2026, 4, 22, 20, 0),
      );

      expect(result?.cadenceCompatibility).toBe("CadencedOnly");
    });

    it("keeps the earliest-starting block when multiple blocks start in the same window", () => {
      const early = makeBlock({
        programmingBlockId: "pb-early",
        schedule: { recurrence: "Daily", timeOfDay: "10:00" },
      });
      const later = makeBlock({
        programmingBlockId: "pb-later",
        schedule: { recurrence: "Daily", timeOfDay: "10:30" },
      });

      // Provide them in later-first order so the second block is evaluated as a
      // worse candidate after the bestCandidate is already set with the early one.
      const result = findNextScheduledBlock(
        [later, early],
        toUnix(2026, 4, 22, 9, 0),
        toUnix(2026, 4, 22, 20, 0),
      );

      expect(result?.programmingBlockId).toBe("pb-early");
    });

    it("does not replace bestCandidate when a later block is evaluated after current best", () => {
      // early first -> bestCandidate = 10:00; then later (10:30) is evaluated but 10:30 > 10:00 -> no replace
      const early = makeBlock({
        programmingBlockId: "pb-best-kept",
        schedule: { recurrence: "Daily", timeOfDay: "10:00" },
      });
      const later = makeBlock({
        programmingBlockId: "pb-not-replacing",
        schedule: { recurrence: "Daily", timeOfDay: "10:30" },
      });

      const result = findNextScheduledBlock(
        [early, later],
        toUnix(2026, 4, 22, 9, 0),
        toUnix(2026, 4, 22, 20, 0),
      );

      expect(result?.programmingBlockId).toBe("pb-best-kept");
    });
  });

  describe("findActiveScheduledBlock", () => {
    it("returns null when no blocks are provided", () => {
      const result = findActiveScheduledBlock([], toUnix(2026, 4, 22, 11, 15));
      expect(result).toBeNull();
    });

    it("returns active block when timepoint is inside same-day occurrence", () => {
      const block = makeBlock({
        programmingBlockId: "pb-active",
        durationMinutes: 90,
        schedule: { recurrence: "Daily", timeOfDay: "10:30" },
      });

      const result = findActiveScheduledBlock(
        [block],
        toUnix(2026, 4, 22, 11, 15),
      );

      expect(result?.programmingBlockId).toBe("pb-active");
      expect(result?.scheduledStartTime).toBe(toUnix(2026, 4, 22, 10, 30));
      expect(result?.scheduledEndTime).toBe(toUnix(2026, 4, 22, 12, 0));
    });

    it("skips inactive, date-mismatched, and invalid-time blocks while finding active ones", () => {
      const inactive = makeBlock({
        programmingBlockId: "pb-inactive",
        active: false,
        durationMinutes: 90,
        schedule: { recurrence: "Daily", timeOfDay: "10:30" },
      });

      const weeklyMismatch = makeBlock({
        programmingBlockId: "pb-weekly-mismatch",
        durationMinutes: 90,
        schedule: { recurrence: "Weekly", daysOfWeek: [2], timeOfDay: "10:30" },
      });

      const invalidTime = makeBlock({
        programmingBlockId: "pb-invalid-time-active",
        durationMinutes: 90,
        schedule: { recurrence: "Daily", timeOfDay: "10:15" },
      });

      const valid = makeBlock({
        programmingBlockId: "pb-valid",
        durationMinutes: 90,
        schedule: { recurrence: "Daily", timeOfDay: "10:30" },
      });

      const result = findActiveScheduledBlock(
        [inactive, weeklyMismatch, invalidTime, valid],
        toUnix(2026, 4, 22, 11, 15),
      );

      expect(result?.programmingBlockId).toBe("pb-valid");
    });

    it("finds carry-over active block started on previous day", () => {
      const overnight = makeBlock({
        programmingBlockId: "pb-overnight",
        durationMinutes: 180,
        schedule: { recurrence: "Daily", timeOfDay: "23:00" },
      });

      const result = findActiveScheduledBlock(
        [overnight],
        toUnix(2026, 4, 23, 0, 30),
      );

      expect(result?.programmingBlockId).toBe("pb-overnight");
      expect(result?.scheduledStartTime).toBe(toUnix(2026, 4, 22, 23, 0));
      expect(result?.scheduledEndTime).toBe(toUnix(2026, 4, 23, 2, 0));
    });

    it("returns null when no block is active", () => {
      const block = makeBlock({
        programmingBlockId: "pb-lunch",
        durationMinutes: 60,
        schedule: { recurrence: "Daily", timeOfDay: "12:00" },
      });

      const result = findActiveScheduledBlock(
        [block],
        toUnix(2026, 4, 22, 9, 0),
      );
      expect(result).toBeNull();
    });

    it("sets cadenceCompatibility to CadencedOnly for active ShowOrder block", () => {
      const showOrderBlock = makeBlock({
        programmingBlockId: "pb-show-order-active",
        type: "ShowOrder",
        durationMinutes: 90,
        schedule: { recurrence: "Daily", timeOfDay: "10:30" },
      });

      const result = findActiveScheduledBlock(
        [showOrderBlock],
        toUnix(2026, 4, 22, 11, 15),
      );

      expect(result?.programmingBlockId).toBe("pb-show-order-active");
      expect(result?.cadenceCompatibility).toBe("CadencedOnly");
    });

    it("prefers the latest-starting block when two active occurrences overlap the timepoint", () => {
      // Both blocks are active at 11:15; the one that started at 10:30 is later than 10:00
      const earlier = makeBlock({
        programmingBlockId: "pb-start-earlier",
        durationMinutes: 180,
        schedule: { recurrence: "Daily", timeOfDay: "10:00" },
      });
      const laterStart = makeBlock({
        programmingBlockId: "pb-start-later",
        durationMinutes: 90,
        schedule: { recurrence: "Daily", timeOfDay: "10:30" },
      });

      // Provide earlier-first to force the "is this candidate better?" path
      const result = findActiveScheduledBlock(
        [earlier, laterStart],
        toUnix(2026, 4, 22, 11, 15),
      );

      expect(result?.programmingBlockId).toBe("pb-start-later");
    });

    it("does not replace activeCandidate when an earlier block is evaluated after the current best", () => {
      // laterStart first -> activeCandidate = 10:30; earlier (10:00) is then evaluated
      // but 10:00 > 10:30 is false -> no replace -> laterStart remains the winner
      const laterStart = makeBlock({
        programmingBlockId: "pb-active-best",
        durationMinutes: 90,
        schedule: { recurrence: "Daily", timeOfDay: "10:30" },
      });
      const earlier = makeBlock({
        programmingBlockId: "pb-active-not-replacing",
        durationMinutes: 180,
        schedule: { recurrence: "Daily", timeOfDay: "10:00" },
      });

      const result = findActiveScheduledBlock(
        [laterStart, earlier],
        toUnix(2026, 4, 22, 11, 15),
      );

      expect(result?.programmingBlockId).toBe("pb-active-best");
    });
  });
});
