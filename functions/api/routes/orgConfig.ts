import { Hono } from 'hono'
import type { LookupValue } from '../../../types'
import { actorFrom, HttpError, nowIso } from '../actor'
import { ChangeLogRepository } from '../repositories/ChangeLogRepository'
import { ConfigRepository } from '../repositories/ConfigRepository'
import { LegacyMigration } from '../services/LegacyMigration'
import { AppBindings } from '../types'

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/
const LIST_NAME = /^[A-Z][A-Z0-9_]{0,39}$/

export const configApp = new Hono<{ Bindings: AppBindings }>()

configApp.get('/', async (c) => c.json(await new ConfigRepository(c.env.DB).allConfig()))

configApp.put('/:key', async (c) => {
  const key = c.req.param('key')
  const { value } = await c.req.json<{ value: unknown }>()
  if (value === undefined) throw new HttpError(400, '{value} diperlukan')
  const repo = new ConfigRepository(c.env.DB)
  const before = await repo.getConfig(key)
  const actor = await actorFrom(c)
  await c.env.DB.batch([
    repo.putConfig(key, value, nowIso(), actor.id),
    new ChangeLogRepository(c.env.DB).statement(actor, { entity: 'config', entityId: key, action: 'set', message: `Tetapan ${key}`, diff: { before, after: value } }),
  ])
  return c.json({ key, value })
})

export const lookupApp = new Hono<{ Bindings: AppBindings }>()

lookupApp.get('/:list', async (c) => c.json(await new ConfigRepository(c.env.DB).lookups(c.req.param('list').toUpperCase())))

lookupApp.put('/:list', async (c) => {
  const list = c.req.param('list').toUpperCase()
  if (!LIST_NAME.test(list)) throw new HttpError(400, 'Nama senarai tidak sah')
  const values = await c.req.json<LookupValue[]>()
  if (!Array.isArray(values) || values.some((v) => !v?.code)) throw new HttpError(400, 'LookupValue[] dengan code diperlukan')
  if (new Set(values.map((v) => v.code)).size !== values.length) throw new HttpError(400, 'code berulang')
  const repo = new ConfigRepository(c.env.DB)
  const before = await repo.lookups(list)
  const actor = await actorFrom(c)
  await c.env.DB.batch([
    ...repo.replaceLookups(list, values),
    new ChangeLogRepository(c.env.DB).statement(actor, { entity: 'lookup', entityId: list, action: 'replace', message: `Senarai ${list}: ${values.length} nilai`, diff: { before: before.map((v) => v.code), after: values.map((v) => v.code) } }),
  ])
  return c.json(await repo.lookups(list))
})

export const policyApp = new Hono<{ Bindings: AppBindings }>()

policyApp.get('/', async (c) => c.json(await new ConfigRepository(c.env.DB).policies()))

policyApp.post('/', async (c) => {
  const body = await c.req.json<{ key: string; effective_from: string; value: unknown; note?: string }>()
  if (!body.key || !ISO_DAY.test(body.effective_from ?? '') || body.value === undefined) throw new HttpError(400, 'key, effective_from (YYYY-MM-DD) dan value diperlukan')
  const repo = new ConfigRepository(c.env.DB)
  const actor = await actorFrom(c)
  await c.env.DB.batch([
    repo.putPolicy({ key: body.key, effective_from: body.effective_from, value: body.value, note: body.note ?? null }, nowIso(), actor.id),
    new ChangeLogRepository(c.env.DB).statement(actor, { entity: 'policy', entityId: body.key, action: 'set', message: `${body.key} berkuat kuasa ${body.effective_from}`, diff: body }),
  ])
  return c.json((await repo.policies()).filter((p) => p.key === body.key), 201)
})

export const adminApp = new Hono<{ Bindings: AppBindings }>()

adminApp.post('/migrate-legacy', async (c) => c.json(await new LegacyMigration(c.env.DB, await actorFrom(c)).run()))

export const aiApp = new Hono<{ Bindings: AppBindings }>()

// Optional AI suggestions; the deployment has no AI binding yet, so this says so instead of guessing.
aiApp.post('/match-suggest', async (c) => {
  if (!(c.env as { AI?: unknown }).AI) throw new HttpError(501, 'Tiada binding AI; padanan AI tidak tersedia')
  throw new HttpError(501, 'Cadangan AI belum dilaksanakan')
})
