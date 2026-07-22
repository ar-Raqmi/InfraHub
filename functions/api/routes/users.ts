import { Hono } from 'hono'
import { UserRepository } from '../repositories/UserRepository'
import { AppBindings } from '../types'

export const userApp = new Hono<{ Bindings: AppBindings }>()

// GET /api/users
userApp.get('/', async (c) => {
  const repo = new UserRepository(c.env.DB)
  const mapped = await repo.getAll()
  return c.json(mapped)
})

// POST /api/users
userApp.post('/', async (c) => {
  const body = await c.req.json()
  const repo = new UserRepository(c.env.DB)
  const created = await repo.create(body)
  return c.json(created)
})

// PUT /api/users/:id
userApp.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const repo = new UserRepository(c.env.DB)
  const updated = await repo.update(id, body)
  
  if (!updated) {
    return c.json({ error: 'No fields to update' }, 400)
  }
  
  return c.json(updated)
})

// DELETE /api/users/:id
userApp.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const repo = new UserRepository(c.env.DB)
  await repo.delete(id)
  return c.json({ success: true })
})
