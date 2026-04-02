import { Hono } from 'hono'

type Bindings = {
  DB: D1Database
}

export const notificationApp = new Hono<{ Bindings: Bindings }>()

// GET /api/notifications?userId=123
notificationApp.get('/', async (c) => {
  const userId = c.req.query('userId')
  if (!userId) return c.json({ error: 'Missing userId' }, 400)

  // Auto-cleanup: Delete items in trash older than 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const isoSevenDaysAgo = sevenDaysAgo.toISOString()

  await c.env.DB.prepare(
    'DELETE FROM user_notification_states WHERE user_id = ? AND is_deleted = 1 AND updated_at < ?'
  )
    .bind(userId, isoSevenDaysAgo)
    .run()

  const { results } = await c.env.DB.prepare(
    'SELECT notification_id as id, is_read as isRead, is_deleted as isDeleted FROM user_notification_states WHERE user_id = ?'
  )
    .bind(userId)
    .all()

  return c.json(results)
})

// PUT /api/notifications/:id
notificationApp.put('/:id', async (c) => {
  const notificationId = c.req.param('id')
  const body = await c.req.json()
  const { userId, isRead, isDeleted } = body

  if (!userId) return c.json({ error: 'Missing userId' }, 400)

  const existing = await c.env.DB.prepare(
    'SELECT * FROM user_notification_states WHERE user_id = ? AND notification_id = ?'
  )
    .bind(userId, notificationId)
    .first()

  if (existing) {
    const updates: string[] = []
    const values: any[] = []

    if (isRead !== undefined) {
      updates.push('is_read = ?')
      values.push(isRead ? 1 : 0)
    }
    if (isDeleted !== undefined) {
      updates.push('is_deleted = ?')
      values.push(isDeleted ? 1 : 0)
    }

    if (updates.length > 0) {
      values.push(new Date().toISOString())
      values.push(userId)
      values.push(notificationId)
      await c.env.DB.prepare(
        `UPDATE user_notification_states SET ${updates.join(', ')}, updated_at = ? WHERE user_id = ? AND notification_id = ?`
      )
        .bind(...values)
        .run()
    }
  } else {
    await c.env.DB.prepare(
      'INSERT INTO user_notification_states (user_id, notification_id, is_read, is_deleted, updated_at) VALUES (?, ?, ?, ?, ?)'
    )
      .bind(userId, notificationId, isRead ? 1 : 0, isDeleted ? 1 : 0, new Date().toISOString())
      .run()
  }

  return c.json({ success: true })
})

// DELETE /api/notifications/:id (Permanent delete)
notificationApp.delete('/:id', async (c) => {
  const notificationId = c.req.param('id')
  const userId = c.req.query('userId')

  if (!userId) return c.json({ error: 'Missing userId' }, 400)

  await c.env.DB.prepare(
    'DELETE FROM user_notification_states WHERE user_id = ? AND notification_id = ?'
  )
    .bind(userId, notificationId)
    .run()

  return c.json({ success: true })
})
