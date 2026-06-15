export class UserRepository {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  public mapUserFromRow(row: any): any {
    return {
      id: row.id,
      username: row.username,
      fullName: row.full_name,
      role: row.role,
      password: row.password,
      email: row.email,
      phone: row.phone,
      jawatan: row.jawatan,
      bahagian: row.bahagian,
      unit: row.unit,
      department: row.department,
      avatarUrl: row.avatar_url
    };
  }

  public async getAll(): Promise<any[]> {
    const { results } = await this.db.prepare('SELECT * FROM app_users').all();
    return results.map(row => this.mapUserFromRow(row));
  }

  public async create(body: any): Promise<any> {
    const newId = Date.now();
    const dbUser = {
      id: newId,
      username: body.username,
      full_name: body.fullName,
      role: body.role,
      password: body.password,
      email: body.email,
      phone: body.phone,
      jawatan: body.jawatan,
      bahagian: body.bahagian,
      unit: body.unit,
      department: body.department,
      avatar_url: body.avatarUrl
    };

    const sanitizedRecord = Object.fromEntries(
      Object.entries(dbUser).map(([k, v]) => [k, v === undefined ? null : v])
    );

    const keys = Object.keys(sanitizedRecord);
    const values = Object.values(sanitizedRecord);
    const placeholders = keys.map(() => '?').join(', ');

    await this.db.prepare(`INSERT INTO app_users (${keys.join(', ')}) VALUES (${placeholders})`)
      .bind(...values)
      .run();

    return this.mapUserFromRow(sanitizedRecord);
  }

  public async update(id: string, body: any): Promise<any | null> {
    const dbUpdates: Record<string, any> = {};

    if (body.username !== undefined) dbUpdates.username = body.username;
    if (body.fullName !== undefined) dbUpdates.full_name = body.fullName;
    if (body.role !== undefined) dbUpdates.role = body.role;
    if (body.password !== undefined) dbUpdates.password = body.password;
    if (body.email !== undefined) dbUpdates.email = body.email;
    if (body.phone !== undefined) dbUpdates.phone = body.phone;
    if (body.jawatan !== undefined) dbUpdates.jawatan = body.jawatan;
    if (body.bahagian !== undefined) dbUpdates.bahagian = body.bahagian;
    if (body.unit !== undefined) dbUpdates.unit = body.unit;
    if (body.department !== undefined) dbUpdates.department = body.department;
    if (body.avatarUrl !== undefined) dbUpdates.avatar_url = body.avatarUrl;

    const keys = Object.keys(dbUpdates);
    if (keys.length === 0) return null;

    const setClauses = keys.map((k) => `${k} = ?`).join(', ');
    const values = Object.values(dbUpdates);

    await this.db.prepare(`UPDATE app_users SET ${setClauses} WHERE id = ?`)
      .bind(...values, id)
      .run();

    const { results } = await this.db.prepare('SELECT * FROM app_users WHERE id = ?').bind(id).all();
    if (!results || results.length === 0) return null;
    return this.mapUserFromRow(results[0]);
  }

  public async delete(id: string): Promise<boolean> {
    await this.db.prepare('DELETE FROM app_users WHERE id = ?').bind(id).run();
    return true;
  }

  public async getByUsernameAndPassword(username: string, password: string): Promise<any | null> {
    const { results } = await this.db.prepare('SELECT * FROM app_users WHERE username = ? AND password = ?')
      .bind(username, password)
      .all();
    if (results && results.length > 0) {
      return this.mapUserFromRow(results[0]);
    }
    return null;
  }
}
