export abstract class BaseRepository {
  protected db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  protected parseJsonArray(val: string | null): any[] {
    return val ? JSON.parse(val) : [];
  }

  protected parseJsonObject(val: string | null): Record<string, any> {
    return val ? JSON.parse(val) : {};
  }

  protected sanitizeRecord(record: Record<string, any>): Record<string, any> {
    return Object.fromEntries(
      Object.entries(record).map(([k, v]) => [k, v === undefined ? null : v])
    );
  }

  protected buildInsert(record: Record<string, any>) {
    const sanitized = this.sanitizeRecord(record);
    const keys = Object.keys(sanitized);
    const values = Object.values(sanitized);
    const placeholders = keys.map(() => '?').join(', ');
    return { keys, values, placeholders };
  }

  protected buildUpdate(updates: Record<string, any>) {
    const sanitized = this.sanitizeRecord(updates);
    const keys = Object.keys(sanitized);
    const setClauses = keys.map((k) => `${k} = ?`).join(', ');
    const values = Object.values(sanitized);
    return { keys, setClauses, values };
  }

  protected buildInPlaceholders(count: number): string {
    return Array.from({ length: count }, () => '?').join(',');
  }

  // SELECT-then-UPDATE-or-INSERT. `record` is used verbatim for INSERT and as
  // the SET payload for UPDATE (merged with optional extraUpdate). Does nothing
  // on UPDATE when there are no columns to set (preserving no-op behavior).
  protected async upsert(
    table: string,
    whereClause: string,
    whereValues: any[],
    record: Record<string, any>,
    extraUpdate: Record<string, any> = {}
  ): Promise<void> {
    const existing = await this.db.prepare(`SELECT 1 FROM ${table} WHERE ${whereClause}`)
      .bind(...whereValues)
      .first();

    if (existing) {
      const merged = { ...record, ...extraUpdate };
      const { keys, setClauses, values } = this.buildUpdate(merged);
      if (keys.length > 0) {
        await this.db.prepare(`UPDATE ${table} SET ${setClauses} WHERE ${whereClause}`)
          .bind(...values, ...whereValues)
          .run();
      }
    } else {
      const { keys, values, placeholders } = this.buildInsert(record);
      await this.db.prepare(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`)
        .bind(...values)
        .run();
    }
  }
}
