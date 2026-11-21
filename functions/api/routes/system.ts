import { Hono } from 'hono'
import { SystemRepository } from '../repositories/SystemRepository'
import { AppBindings } from '../types'
import { actorFrom, HttpError } from '../actor'
import { ContractRepository } from '../repositories/ContractRepository'
import { LegacyMigration } from '../services/LegacyMigration'
import { RateBookService } from '../services/RateBookService'

// COMPAT: the Pustaka screens read/write "the library"; v2 serves the AKTIF contract's current book instead.
async function activeContractId(db: D1Database, migrateIfMissing: boolean, actor: Awaited<ReturnType<typeof actorFrom>>) {
  const repo = new ContractRepository(db)
  let contract = await repo.defaultContract()
  if (!contract && migrateIfMissing) {
    await new LegacyMigration(db, actor).run()
    contract = await repo.defaultContract()
  }
  return contract?.id ?? null
}

export const systemApp = new Hono<{ Bindings: AppBindings }>()

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
  const actor = await actorFrom(c)
  const contractId = await activeContractId(c.env.DB, false, actor)
  if (!contractId) return c.json(await new SystemRepository(c.env.DB).getLibraryGroups())
  return c.json((await new RateBookService(c.env.DB, actor).book(contractId)).groups)
})

// PUT /api/system/library_groups
systemApp.put('/library_groups', async (c) => {
  const groups = await c.req.json()
  const actor = await actorFrom(c)
  const contractId = await activeContractId(c.env.DB, true, actor)
  if (!contractId) throw new HttpError(409, 'Tiada kontrak AKTIF untuk disunting')
  const { version, diff } = await new RateBookService(c.env.DB, actor).saveEdit(contractId, groups, 'Suntingan Pustaka')
  return c.json({ success: true, versionId: version?.id, versionNo: version?.versionNo, diff })
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
