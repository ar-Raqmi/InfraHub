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
}
