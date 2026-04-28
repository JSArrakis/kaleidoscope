import { getDB } from "../db/sqlite.js";

export class ProgrammingBlockRepository {
  private get db() {
    return getDB();
  }

  findDefinitionById(
    programmingBlockId: string,
  ): ProgrammingBlockDefinition | null {
    const stmt = this.db.prepare(`
      SELECT
        pb.programmingBlockId,
        pb.name,
        pb.type,
        pb.durationMinutes,
        pb.active,
        pb.specialtyTagId,
        pb.movieMode,
        pbs.recurrence,
        pbs.year,
        pbs.month,
        pbs.dayOfMonth,
        pbs.daysOfWeek,
        pbs.timeOfDay
      FROM programming_blocks pb
      JOIN programming_block_schedules pbs
        ON pbs.programmingBlockId = pb.programmingBlockId
      WHERE pb.programmingBlockId = ?
      LIMIT 1
    `);

    const row = stmt.get(programmingBlockId) as any;
    if (!row) {
      return null;
    }

    const daysOfWeek = row.daysOfWeek
      ? (JSON.parse(row.daysOfWeek) as number[])
      : undefined;

    return {
      programmingBlockId: row.programmingBlockId,
      name: row.name,
      type: row.type as ProgrammingBlockType,
      durationMinutes: row.durationMinutes,
      active: !!row.active,
      specialtyTagId: row.specialtyTagId ?? undefined,
      schedule: {
        recurrence: row.recurrence as ProgrammingBlockRecurrence,
        year: row.year ?? undefined,
        month: row.month ?? undefined,
        dayOfMonth: row.dayOfMonth ?? undefined,
        daysOfWeek,
        timeOfDay: row.timeOfDay,
      },
    } satisfies ProgrammingBlockDefinition;
  }

  findAllActiveDefinitions(): ProgrammingBlockDefinition[] {
    const stmt = this.db.prepare(`
      SELECT
        pb.programmingBlockId,
        pb.name,
        pb.type,
        pb.durationMinutes,
        pb.active,
        pb.specialtyTagId,
        pb.movieMode,
        pbs.recurrence,
        pbs.year,
        pbs.month,
        pbs.dayOfMonth,
        pbs.daysOfWeek,
        pbs.timeOfDay
      FROM programming_blocks pb
      JOIN programming_block_schedules pbs
        ON pbs.programmingBlockId = pb.programmingBlockId
      WHERE pb.active = 1
      ORDER BY pb.name
    `);

    const rows = stmt.all() as any[];

    return rows.map((row) => {
      const daysOfWeek = row.daysOfWeek
        ? (JSON.parse(row.daysOfWeek) as number[])
        : undefined;

      return {
        programmingBlockId: row.programmingBlockId,
        name: row.name,
        type: row.type as ProgrammingBlockType,
        durationMinutes: row.durationMinutes,
        active: !!row.active,
        specialtyTagId: row.specialtyTagId ?? undefined,
        schedule: {
          recurrence: row.recurrence as ProgrammingBlockRecurrence,
          year: row.year ?? undefined,
          month: row.month ?? undefined,
          dayOfMonth: row.dayOfMonth ?? undefined,
          daysOfWeek,
          timeOfDay: row.timeOfDay,
        },
      } satisfies ProgrammingBlockDefinition;
    });
  }

  upsertDefinition(definition: ProgrammingBlockDefinition): void {
    const tx = this.db.transaction(() => {
      const blockStmt = this.db.prepare(`
        INSERT INTO programming_blocks (
          programmingBlockId,
          name,
          type,
          durationMinutes,
          active,
          specialtyTagId,
          movieMode,
          updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(programmingBlockId) DO UPDATE SET
          name = excluded.name,
          type = excluded.type,
          durationMinutes = excluded.durationMinutes,
          active = excluded.active,
          specialtyTagId = excluded.specialtyTagId,
          movieMode = excluded.movieMode,
          updatedAt = CURRENT_TIMESTAMP
      `);

      blockStmt.run(
        definition.programmingBlockId,
        definition.name,
        definition.type,
        definition.durationMinutes,
        definition.active ? 1 : 0,
        definition.specialtyTagId ?? null,
        null,
      );

      const scheduleStmt = this.db.prepare(`
        INSERT INTO programming_block_schedules (
          programmingBlockId,
          recurrence,
          year,
          month,
          dayOfMonth,
          daysOfWeek,
          timeOfDay,
          updatedAt
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(programmingBlockId) DO UPDATE SET
          recurrence = excluded.recurrence,
          year = excluded.year,
          month = excluded.month,
          dayOfMonth = excluded.dayOfMonth,
          daysOfWeek = excluded.daysOfWeek,
          timeOfDay = excluded.timeOfDay,
          updatedAt = CURRENT_TIMESTAMP
      `);

      scheduleStmt.run(
        definition.programmingBlockId,
        definition.schedule.recurrence,
        definition.schedule.year ?? null,
        definition.schedule.month ?? null,
        definition.schedule.dayOfMonth ?? null,
        definition.schedule.daysOfWeek
          ? JSON.stringify(definition.schedule.daysOfWeek)
          : null,
        definition.schedule.timeOfDay,
      );
    });

    tx();
  }

  findOrderedMovieIds(programmingBlockId: string): string[] {
    const stmt = this.db.prepare(`
      SELECT movieItemId
      FROM programming_block_movie_items
      WHERE programmingBlockId = ?
      ORDER BY sequence ASC
    `);

    const rows = stmt.all(programmingBlockId) as Array<{ movieItemId: string }>;
    return rows.map((row) => row.movieItemId);
  }

  findOrderedShowIds(programmingBlockId: string): string[] {
    const stmt = this.db.prepare(`
      SELECT showItemId
      FROM programming_block_show_items
      WHERE programmingBlockId = ?
      ORDER BY sequence ASC
    `);

    const rows = stmt.all(programmingBlockId) as Array<{ showItemId: string }>;
    return rows.map((row) => row.showItemId);
  }

  findTagThemedConfig(programmingBlockId: string): {
    mode: ProgrammingBlockMovieMode | null;
    tagIds: string[];
  } {
    const modeStmt = this.db.prepare(`
      SELECT movieMode
      FROM programming_blocks
      WHERE programmingBlockId = ?
      LIMIT 1
    `);

    const tagStmt = this.db.prepare(`
      SELECT tagId
      FROM programming_block_tags
      WHERE programmingBlockId = ?
      ORDER BY tagId ASC
    `);

    const modeRow = modeStmt.get(programmingBlockId) as
      | { movieMode: string | null }
      | undefined;
    const tagRows = tagStmt.all(programmingBlockId) as Array<{ tagId: string }>;

    return {
      mode: (modeRow?.movieMode as ProgrammingBlockMovieMode | null) ?? null,
      tagIds: tagRows.map((row) => row.tagId),
    };
  }
}

export const programmingBlockRepository = new ProgrammingBlockRepository();
