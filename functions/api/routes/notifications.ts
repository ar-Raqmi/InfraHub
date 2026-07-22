import { Hono } from 'hono'
import { NotificationRepository } from '../repositories/NotificationRepository'
import { AppBindings } from '../types'

export const notificationApp = new Hono<{ Bindings: AppBindings }>()

// GET /api/notifications?userId=123
notificationApp.get('/', async (c) => {
  const userId = c.req.query('userId')
  if (!userId) return c.json({ error: 'Missing userId' }, 400)
  const repo = new NotificationRepository(c.env.DB)
  const results = await repo.getStates(userId)
  return c.json(results)
})

// PUT /api/notifications/:id
notificationApp.put('/:id', async (c) => {
  const notificationId = c.req.param('id')
  const body = await c.req.json()
  const { userId, isRead, isDeleted } = body

  if (!userId) return c.json({ error: 'Missing userId' }, 400)
  const repo = new NotificationRepository(c.env.DB)
  await repo.updateState(notificationId, userId, isRead, isDeleted)
  return c.json({ success: true })
})

// DELETE /api/notifications/:id (Permanent delete)
notificationApp.delete('/:id', async (c) => {
  const notificationId = c.req.param('id')
  const userId = c.req.query('userId')

  if (!userId) return c.json({ error: 'Missing userId' }, 400)
  const repo = new NotificationRepository(c.env.DB)
  await repo.deleteState(notificationId, userId)
  return c.json({ success: true })
})
