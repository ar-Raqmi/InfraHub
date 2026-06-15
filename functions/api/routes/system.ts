import { Hono } from 'hono'
import { SystemRepository } from '../repositories/SystemRepository'

type Bindings = {
  DB: D1Database
}

export const systemApp = new Hono<{ Bindings: Bindings }>()

// Settings API endpoints
// GET /api/system/settings/:year
systemApp.get('/settings/:year', async (c) => {
  const year = c.req.param('year')
  const repo = new SystemRepository(c.env.DB)
  const settings = await repo.getSettings(year)
  return c.json(settings)
})

// PUT /api/system/settings/:year
systemApp.put('/settings/:year', async (c) => {
  const year = Number(c.req.param('year'))
  const body = await c.req.json()
  const repo = new SystemRepository(c.env.DB)
  await repo.updateSettings(year, body)
  return c.json({ success: true })
})

// Library Groups API
// GET /api/system/library_groups
systemApp.get('/library_groups', async (c) => {
  const repo = new SystemRepository(c.env.DB)
  const groups = await repo.getLibraryGroups()
  return c.json(groups)
})

// PUT /api/system/library_groups
systemApp.put('/library_groups', async (c) => {
  const groups = await c.req.json()
  const repo = new SystemRepository(c.env.DB)
  await repo.saveLibraryGroups(groups)
  return c.json({ success: true })
})

// Templates API
// GET /api/system/templates
systemApp.get('/templates', async (c) => {
  const repo = new SystemRepository(c.env.DB)
  const templates = await repo.getTemplates()
  return c.json(templates)
})

// PUT /api/system/templates
systemApp.put('/templates', async (c) => {
  const templates = await c.req.json()
  const repo = new SystemRepository(c.env.DB)
  await repo.saveTemplates(templates)
  return c.json({ success: true })
})

// DELETE /api/system/templates/:id
systemApp.delete('/templates/:id', async (c) => {
  const id = c.req.param('id')
  const repo = new SystemRepository(c.env.DB)
  await repo.deleteTemplate(id)
  return c.json({ success: true })
})
