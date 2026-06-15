import { Hono } from 'hono'
import { ProjectRepository } from '../repositories/ProjectRepository'

type Bindings = {
  DB: D1Database
  BUCKET: R2Bucket
}

export const projectApp = new Hono<{ Bindings: Bindings }>()

// GET /api/projects
projectApp.get('/', async (c) => {
  const repo = new ProjectRepository(c.env.DB)
  const mapped = await repo.getAll()
  return c.json(mapped)
})

// GET /api/projects/:id
projectApp.get('/:id', async (c) => {
  const id = c.req.param('id')
  const repo = new ProjectRepository(c.env.DB)
  const mapped = await repo.getById(id)
  
  if (!mapped) {
    return c.json({ error: 'Project not found' }, 404)
  }
  
  return c.json(mapped)
})

// POST /api/projects
projectApp.post('/', async (c) => {
  const body = await c.req.json()
  const repo = new ProjectRepository(c.env.DB)
  const created = await repo.create(body)
  return c.json(created)
})

// PUT /api/projects/:id
projectApp.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const repo = new ProjectRepository(c.env.DB)
  const updated = await repo.update(id, body)
  
  if (!updated) {
    return c.json({ error: 'No fields to update' }, 400)
  }
  
  return c.json(updated)
})

// DELETE /api/projects/:id
projectApp.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const repo = new ProjectRepository(c.env.DB)
  await repo.delete(id)
  return c.json({ success: true })
})
