import { Hono } from 'hono'
import { BulletinRepository } from '../repositories/BulletinRepository'
import { AppBindings } from '../types'

export const bulletinApp = new Hono<{ Bindings: AppBindings }>()

// GET /api/bulletins
bulletinApp.get('/', async (c) => {
  const repo = new BulletinRepository(c.env.DB)
  const mapped = await repo.getAll()
  return c.json(mapped)
})

// POST /api/bulletins
bulletinApp.post('/', async (c) => {
  const { content, author } = await c.req.json()
  const repo = new BulletinRepository(c.env.DB)
  const created = await repo.create(content, author)
  return c.json(created)
})

// PUT /api/bulletins/:id/read
bulletinApp.put('/:id/read', async (c) => {
  const id = c.req.param('id')
  const { userId } = await c.req.json()
  const repo = new BulletinRepository(c.env.DB)
  const success = await repo.markAsRead(id, userId)
  
  if (!success) {
    return c.json({ error: 'Not found' }, 404)
  }
  
  return c.json({ success: true })
})

// PUT /api/bulletins/:id/react
bulletinApp.put('/:id/react', async (c) => {
  const id = c.req.param('id')
  const { userId, emoji } = await c.req.json()
  const repo = new BulletinRepository(c.env.DB)
  const success = await repo.react(id, userId, emoji)
  
  if (!success) {
    return c.json({ error: 'Not found' }, 404)
  }
  
  return c.json({ success: true })
})

// DELETE /api/bulletins/:id
bulletinApp.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const repo = new BulletinRepository(c.env.DB)
  await repo.delete(id)
  return c.json({ success: true })
})
