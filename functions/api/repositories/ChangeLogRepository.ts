import type { ChangeLogEntry } from '../../../types'
import type { Actor } from '../actor'
import { nowIso } from '../actor'
import { BaseRepository } from './BaseRepository'

export interface LogInput {
  entity: ChangeLogEntry['entity']
  entityId: string | null
  action: string
  message?: string | null
  diff?: unknown
}

export class ChangeLogRepository extends BaseRepository {
  // Returned unexecuted so callers can put it in the same D1 batch (transaction) as the change itself.
  public statement(actor: Actor, e: LogInput): D1PreparedStatement {
    return this.db.prepare(
      'INSERT INTO change_log (at, user_id, user_name, entity, entity_id, action, message, diff) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(nowIso(), actor.id, actor.name, e.entity, e.entityId, e.action, e.message ?? null, e.diff === undefined ? null : JSON.stringify(e.diff))
  }

  public async list(filter: { entity?: string; entityId?: string; limit?: number }): Promise<ChangeLogEntry[]> {
    const where: string[] = []
    const args: unknown[] = []
    if (filter.entity) { where.push('entity = ?'); args.push(filter.entity) }
    if (filter.entityId) { where.push('entity_id = ?'); args.push(filter.entityId) }
    const limit = Math.min(Math.max(Number(filter.limit) || 50, 1), 500)
    const sql = `SELECT * FROM change_log ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY id DESC LIMIT ${limit}`
    const { results } = await this.db.prepare(sql).bind(...args).all<any>()
    return results.map((r) => ({
      id: r.id, at: r.at, userId: r.user_id, userName: r.user_name, entity: r.entity, entityId: r.entity_id,
      action: r.action, message: r.message, diff: r.diff ? JSON.parse(r.diff) : null,
    }))
  }
}
