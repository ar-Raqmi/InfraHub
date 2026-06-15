import { BaseRepository } from './BaseRepository'

export class SystemRepository extends BaseRepository {
  constructor(db: D1Database) {
    super(db);
  }

  public async getSettings(year: string): Promise<any> {
    const { results } = await this.db.prepare('SELECT * FROM system_settings WHERE year = ?').bind(year).all();
    if (!results || results.length === 0) {
      return { year: Number(year) };
    }
    const row = results[0];
    return {
      year: row.year,
      companies: this.parseJsonArray(row.companies as string),
      company_order: this.parseJsonArray(row.company_order as string),
      company_details: this.parseJsonObject(row.company_details as string),
      vote_numbers: this.parseJsonArray(row.vote_numbers as string),
      sebutharga_numbers: this.parseJsonArray(row.sebutharga_numbers as string),
      manual_financials: this.parseJsonObject(row.manual_financials as string),
      meeting_date: row.meeting_date as string | null,
      meeting_number: row.meeting_number as string | null
    };
  }

  public async updateSettings(year: number, body: any): Promise<boolean> {
    const { results } = await this.db.prepare('SELECT * FROM system_settings WHERE year = ?').bind(year).all();
    const exists = results && results.length > 0;

    const dbUpdates: Record<string, string | number> = { year };
    if (body.companies !== undefined) dbUpdates.companies = JSON.stringify(body.companies);
    if (body.company_order !== undefined) dbUpdates.company_order = JSON.stringify(body.company_order);
    if (body.company_details !== undefined) dbUpdates.company_details = JSON.stringify(body.company_details);
    if (body.vote_numbers !== undefined) dbUpdates.vote_numbers = JSON.stringify(body.vote_numbers);
    if (body.sebutharga_numbers !== undefined) dbUpdates.sebutharga_numbers = JSON.stringify(body.sebutharga_numbers);
    if (body.manual_financials !== undefined) dbUpdates.manual_financials = JSON.stringify(body.manual_financials);
    if (body.meeting_date !== undefined) dbUpdates.meeting_date = body.meeting_date;
    if (body.meeting_number !== undefined) dbUpdates.meeting_number = body.meeting_number;

    if (exists) {
      const { setClauses, values } = this.buildUpdate(dbUpdates);
      await this.db.prepare(`UPDATE system_settings SET ${setClauses} WHERE year = ?`)
        .bind(...values, year)
        .run();
    } else {
      const { keys, values, placeholders } = this.buildInsert(dbUpdates);
      await this.db.prepare(`INSERT INTO system_settings (${keys.join(', ')}) VALUES (${placeholders})`)
        .bind(...values)
        .run();
    }
    return true;
  }

  public async getLibraryGroups(): Promise<any[]> {
    const { results } = await this.db.prepare('SELECT * FROM library_groups').all();
    return results.map(row => ({
      id: row.id,
      title: row.title,
      category: row.category,
      items: this.parseJsonArray(row.items as string)
    }));
  }

  public async saveLibraryGroups(groups: any[]): Promise<boolean> {
    await this.db.prepare('DELETE FROM library_groups').run();
    for (const g of groups) {
      await this.db.prepare('INSERT INTO library_groups (id, title, category, items) VALUES (?, ?, ?, ?)')
        .bind(g.id, g.title, g.category, JSON.stringify(g.items))
        .run();
    }
    return true;
  }

  public async getTemplates(): Promise<any[]> {
    const { results } = await this.db.prepare('SELECT * FROM templates ORDER BY order_index ASC').all();
    return results.map(row => ({
      id: row.id,
      key: row.key,
      title: row.title,
      subtitle: row.subtitle,
      icon: row.icon,
      color: row.color,
      bills: this.parseJsonArray(row.bills as string),
      groupRefs: this.parseJsonArray(row.group_refs as string),
      orderIndex: row.order_index
    }));
  }

  public async saveTemplates(templates: any[]): Promise<boolean> {
    await this.db.prepare('DELETE FROM templates').run();
    for (let i = 0; i < templates.length; i++) {
      const t = templates[i];
      await this.db.prepare('INSERT INTO templates (id, key, title, subtitle, icon, color, bills, group_refs, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(t.id, t.key, t.title, t.subtitle ?? null, t.icon ?? null, t.color ?? null, JSON.stringify(t.bills || []), JSON.stringify(t.groupRefs || []), i)
        .run();
    }
    return true;
  }

  public async deleteTemplate(id: string): Promise<boolean> {
    await this.db.prepare('DELETE FROM templates WHERE id = ?').bind(id).run();
    return true;
  }
}
