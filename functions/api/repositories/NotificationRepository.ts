import { BaseRepository } from './BaseRepository'

export class NotificationRepository extends BaseRepository {
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
      const updates: Record<string, any> = {};

      if (isRead !== undefined) {
        updates.is_read = isRead ? 1 : 0;
      }
      if (isDeleted !== undefined) {
        updates.is_deleted = isDeleted ? 1 : 0;
      }

      const { keys, setClauses, values } = this.buildUpdate(updates);
      if (keys.length > 0) {
        const updatedAt = new Date().toISOString();
        await this.db.prepare(
          `UPDATE user_notification_states SET ${setClauses}, updated_at = ? WHERE user_id = ? AND notification_id = ?`
        )
          .bind(...values, updatedAt, userId, notificationId)
          .run();
      }
    } else {
      const dbRecord = {
        user_id: userId,
        notification_id: notificationId,
        is_read: isRead ? 1 : 0,
        is_deleted: isDeleted ? 1 : 0,
        updated_at: new Date().toISOString()
      };
      const { keys, values, placeholders } = this.buildInsert(dbRecord);
      await this.db.prepare(
        `INSERT INTO user_notification_states (${keys.join(', ')}) VALUES (${placeholders})`
      )
        .bind(...values)
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
