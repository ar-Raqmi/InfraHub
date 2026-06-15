export class NotificationRepository {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  public async getStates(userId: string): Promise<any[]> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const isoSevenDaysAgo = sevenDaysAgo.toISOString();

    await this.db.prepare(
      'DELETE FROM user_notification_states WHERE user_id = ? AND is_deleted = 1 AND updated_at < ?'
    )
      .bind(userId, isoSevenDaysAgo)
      .run();

    const { results } = await this.db.prepare(
      'SELECT notification_id as id, is_read as isRead, is_deleted as isDeleted FROM user_notification_states WHERE user_id = ?'
    )
      .bind(userId)
      .all();

    return results;
  }

  public async updateState(
    notificationId: string,
    userId: string,
    isRead?: boolean,
    isDeleted?: boolean
  ): Promise<boolean> {
    const existing = await this.db.prepare(
      'SELECT * FROM user_notification_states WHERE user_id = ? AND notification_id = ?'
    )
      .bind(userId, notificationId)
      .first();

    if (existing) {
      const updates: string[] = [];
      const values: any[] = [];

      if (isRead !== undefined) {
        updates.push('is_read = ?');
        values.push(isRead ? 1 : 0);
      }
      if (isDeleted !== undefined) {
        updates.push('is_deleted = ?');
        values.push(isDeleted ? 1 : 0);
      }

      if (updates.length > 0) {
        values.push(new Date().toISOString());
        values.push(userId);
        values.push(notificationId);
        await this.db.prepare(
          `UPDATE user_notification_states SET ${updates.join(', ')}, updated_at = ? WHERE user_id = ? AND notification_id = ?`
        )
          .bind(...values)
          .run();
      }
    } else {
      await this.db.prepare(
        'INSERT INTO user_notification_states (user_id, notification_id, is_read, is_deleted, updated_at) VALUES (?, ?, ?, ?, ?)'
      )
        .bind(userId, notificationId, isRead ? 1 : 0, isDeleted ? 1 : 0, new Date().toISOString())
        .run();
    }
    return true;
  }

  public async deleteState(notificationId: string, userId: string): Promise<boolean> {
    await this.db.prepare(
      'DELETE FROM user_notification_states WHERE user_id = ? AND notification_id = ?'
    )
      .bind(userId, notificationId)
      .run();
    return true;
  }
}
