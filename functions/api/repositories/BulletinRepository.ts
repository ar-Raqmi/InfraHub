import { BaseRepository } from './BaseRepository'

export class BulletinRepository extends BaseRepository {
  constructor(db: D1Database) {
    super(db);
  }

  public mapBulletinFromRow(row: any): any {
    return {
      id: row.id,
      content: row.content,
      date: row.date,
      author: row.author,
      readBy: this.parseJsonArray(row.read_by),
      reactions: this.parseJsonObject(row.reactions)
    };
  }

  public async getAll(): Promise<any[]> {
    const { results } = await this.db.prepare('SELECT * FROM bulletins ORDER BY date DESC, id DESC').all();
    return results.map(row => this.mapBulletinFromRow(row));
  }

  public async create(content: string, author: string): Promise<any> {
    const id = Date.now().toString();
    const date = new Date().toISOString().split('T')[0];

    const { results: existing } = await this.db.prepare('SELECT id FROM bulletins ORDER BY date DESC, id DESC').all();
    if (existing && existing.length >= 3) {
      const idsToDelete = existing.slice(2).map(r => r.id as string);
      const placeholders = idsToDelete.map(() => '?').join(',');
      await this.db.prepare(`DELETE FROM bulletins WHERE id IN (${placeholders})`).bind(...idsToDelete).run();
    }

    const dbItem = { id, content, date, author, read_by: '[]', reactions: '{}' };
    const { keys, values, placeholders } = this.buildInsert(dbItem);

    await this.db.prepare(`INSERT INTO bulletins (${keys.join(',')}) VALUES (${placeholders})`).bind(...values).run();

    return this.mapBulletinFromRow(dbItem);
  }

  public async markAsRead(id: string, userId: any): Promise<boolean> {
    const { results } = await this.db.prepare('SELECT read_by FROM bulletins WHERE id = ?').bind(id).all();
    if (!results || results.length === 0) return false;

    const readBy = this.parseJsonArray(results[0].read_by as string);
    if (!readBy.includes(userId)) {
      readBy.push(userId);
      await this.db.prepare('UPDATE bulletins SET read_by = ? WHERE id = ?').bind(JSON.stringify(readBy), id).run();
    }
    return true;
  }

  public async react(id: string, userId: any, emoji: string): Promise<boolean> {
    const { results } = await this.db.prepare('SELECT reactions FROM bulletins WHERE id = ?').bind(id).all();
    if (!results || results.length === 0) return false;

    const reactions = this.parseJsonObject(results[0].reactions as string);
    const userList = reactions[emoji] || [];

    if (userList.includes(userId)) {
      reactions[emoji] = userList.filter((uid: any) => uid !== userId);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji] = [...userList, userId];
    }

    await this.db.prepare('UPDATE bulletins SET reactions = ? WHERE id = ?').bind(JSON.stringify(reactions), id).run();
    return true;
  }

  public async delete(id: string): Promise<boolean> {
    await this.db.prepare('DELETE FROM bulletins WHERE id = ?').bind(id).run();
    return true;
  }
}
