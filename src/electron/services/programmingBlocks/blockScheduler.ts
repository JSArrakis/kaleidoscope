/**
 * Programming block schedule resolver.
 *
 * This module is intentionally pure and read-only: it resolves which scheduled
 * block occurrence is next based on recurrence rules and wall-clock cadence.
 */

function parseTimeOfDay(timeOfDay: string): [number, number] | null {
  const [hourRaw, minuteRaw] = timeOfDay.split(":");
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
    return null;
  }

  if (hour < 0 || hour > 23) {
    return null;
  }

  if (minute !== 0 && minute !== 30) {
    return null;
  }

  return [hour, minute];
}

function doesScheduleMatchDate(
  schedule: ProgrammingBlockSchedule,
  date: Date,
): boolean {
  const month = date.getMonth() + 1;
  const dayOfMonth = date.getDate();
  const dayOfWeek = date.getDay();
  const year = date.getFullYear();

  switch (schedule.recurrence) {
    case "OneTime":
      return (
        schedule.year === year &&
        schedule.month === month &&
        schedule.dayOfMonth === dayOfMonth
      );

    case "Daily":
      return true;

    case "Weekly":
      return !!schedule.daysOfWeek?.includes(dayOfWeek);

    case "Monthly":
      return schedule.dayOfMonth === dayOfMonth;

    case "Yearly":
      return schedule.month === month && schedule.dayOfMonth === dayOfMonth;

    default:
      return false;
  }
}

function buildOccurrenceStartTimepoint(
  schedule: ProgrammingBlockSchedule,
  date: Date,
): number | null {
  const parsed = parseTimeOfDay(schedule.timeOfDay);
  if (!parsed) {
    return null;
  }

  const [hour, minute] = parsed;
  const occurrence = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour,
    minute,
    0,
    0,
  );

  return Math.floor(occurrence.getTime() / 1000);
}

/**
 * Finds the next scheduled block occurrence inside a time window.
 */
export function findNextScheduledBlock(
  blocks: ProgrammingBlockDefinition[],
  windowStartTimepoint: number,
  windowEndTimepoint: number,
): ScheduledBlock | null {
  if (blocks.length === 0) {
    return null;
  }

  let bestCandidate: ScheduledBlock | null = null;

  const startDate = new Date(windowStartTimepoint * 1000);
  const searchDate = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate(),
    0,
    0,
    0,
    0,
  );

  const maxIterations = 370;

  for (let i = 0; i < maxIterations; i += 1) {
    for (const block of blocks) {
      if (!block.active) {
        continue;
      }

      if (!doesScheduleMatchDate(block.schedule, searchDate)) {
        continue;
      }

      const scheduledStartTime = buildOccurrenceStartTimepoint(
        block.schedule,
        searchDate,
      );

      if (scheduledStartTime === null) {
        continue;
      }

      if (
        scheduledStartTime < windowStartTimepoint ||
        scheduledStartTime >= windowEndTimepoint
      ) {
        continue;
      }

      const scheduledEndTime =
        scheduledStartTime + Math.max(0, block.durationMinutes) * 60;

      const candidate: ScheduledBlock = {
        scheduledBlockId: `${block.programmingBlockId}:${scheduledStartTime}`,
        programmingBlockId: block.programmingBlockId,
        title: block.name,
        type: block.type,
        scheduledStartTime,
        scheduledEndTime,
        cadenceCompatibility:
          block.type === "ShowOrder" ? "CadencedOnly" : "MatchStreamMode",
      };

      if (
        !bestCandidate ||
        candidate.scheduledStartTime < bestCandidate.scheduledStartTime
      ) {
        bestCandidate = candidate;
      }
    }

    if (bestCandidate) {
      return bestCandidate;
    }

    searchDate.setDate(searchDate.getDate() + 1);
  }

  return null;
}

/**
 * Finds the block occurrence that is currently active at a given timepoint.
 *
 * Because blocks can start near midnight and run up to 24 hours, we check both
 * the current date and the previous date for possible active occurrences.
 */
export function findActiveScheduledBlock(
  blocks: ProgrammingBlockDefinition[],
  timepoint: number,
): ScheduledBlock | null {
  if (blocks.length === 0) {
    return null;
  }

  const now = new Date(timepoint * 1000);
  const candidateDates = [
    new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0),
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0),
  ];

  let activeCandidate: ScheduledBlock | null = null;

  for (const date of candidateDates) {
    for (const block of blocks) {
      if (!block.active) {
        continue;
      }

      if (!doesScheduleMatchDate(block.schedule, date)) {
        continue;
      }

      const scheduledStartTime = buildOccurrenceStartTimepoint(
        block.schedule,
        date,
      );
      if (scheduledStartTime === null) {
        continue;
      }

      const scheduledEndTime =
        scheduledStartTime + Math.max(0, block.durationMinutes) * 60;

      if (timepoint < scheduledStartTime || timepoint >= scheduledEndTime) {
        continue;
      }

      const candidate: ScheduledBlock = {
        scheduledBlockId: `${block.programmingBlockId}:${scheduledStartTime}`,
        programmingBlockId: block.programmingBlockId,
        title: block.name,
        type: block.type,
        scheduledStartTime,
        scheduledEndTime,
        cadenceCompatibility:
          block.type === "ShowOrder" ? "CadencedOnly" : "MatchStreamMode",
      };

      if (
        !activeCandidate ||
        candidate.scheduledStartTime > activeCandidate.scheduledStartTime
      ) {
        activeCandidate = candidate;
      }
    }
  }

  return activeCandidate;
}
