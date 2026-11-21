import { Hono } from 'hono'
import type { LookupValue } from '../../../types'
import { actorFrom, HttpError, nowIso } from '../actor'
import { ChangeLogRepository } from '../repositories/ChangeLogRepository'
import { ConfigRepository } from '../repositories/ConfigRepository'
import { LegacyMigration } from '../services/LegacyMigration'
import { AppBindings } from '../types'

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/
const LIST_NAME = /^[A-Z][A-Z0-9_]{0,39}$/

// Data URLs (the organisation logo) are replaced by their size in the change log; the config row keeps the image.
function summariseForLog(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value ?? null, (_k, v) => (typeof v === 'string' && v.startsWith('data:') ? `[imej ${v.length} aksara]` : v)))
}

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
    new ChangeLogRepository(c.env.DB).statement(actor, { entity: 'config', entityId: key, action: 'set', message: `Tetapan ${key}`, diff: { before: summariseForLog(before), after: summariseForLog(value) } }),
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
  // History is append-only: a value already recorded for that day is never overwritten (add a new date instead).
  if ((await repo.policies()).some((p) => p.key === body.key && p.effectiveFrom === body.effective_from)) {
    throw new HttpError(409, `${body.key} sudah ada nilai bermula ${body.effective_from}; pilih tarikh lain`)
  }
  const actor = await actorFrom(c)
  await c.env.DB.batch([
    repo.putPolicy({ key: body.key, effective_from: body.effective_from, value: body.value, note: body.note ?? null }, nowIso(), actor.id),
    new ChangeLogRepository(c.env.DB).statement(actor, { entity: 'policy', entityId: body.key, action: 'set', message: `${body.key} berkuat kuasa ${body.effective_from}`, diff: body }),
  ])
  return c.json((await repo.policies()).filter((p) => p.key === body.key), 201)
})

// DELETE /api/policies/:key/:effective_from - withdraw a value that has not taken effect yet (logged).
// Values already in force are history and stay; correct them by adding a newer value.
policyApp.delete('/:key/:effectiveFrom', async (c) => {
  const { key, effectiveFrom } = c.req.param()
  if (!ISO_DAY.test(effectiveFrom)) throw new HttpError(400, 'effective_from (YYYY-MM-DD) diperlukan')
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' })
  if (effectiveFrom <= today) throw new HttpError(409, 'Nilai yang sudah berkuat kuasa tidak boleh dipadam; tambah nilai baharu')
  const repo = new ConfigRepository(c.env.DB)
  const rule = (await repo.policies()).find((p) => p.key === key && p.effectiveFrom === effectiveFrom)
  if (!rule) throw new HttpError(404, 'Nilai peraturan tidak dijumpai')
  const actor = await actorFrom(c)
  await c.env.DB.batch([
    c.env.DB.prepare('DELETE FROM policy_rules WHERE key = ? AND effective_from = ?').bind(key, effectiveFrom),
    new ChangeLogRepository(c.env.DB).statement(actor, { entity: 'policy', entityId: key, action: 'withdraw', message: `${key} bermula ${effectiveFrom} dibatalkan`, diff: rule }),
  ])
  return c.json({ ok: true })
})

export const adminApp = new Hono<{ Bindings: AppBindings }>()

adminApp.post('/migrate-legacy', async (c) => c.json(await new LegacyMigration(c.env.DB, await actorFrom(c)).run()))

export const aiApp = new Hono<{ Bindings: AppBindings }>()

// Optional AI suggestions; the deployment has no AI binding yet, so this says so instead of guessing.
aiApp.post('/match-suggest', async (c) => {
  if (!(c.env as { AI?: unknown }).AI) throw new HttpError(501, 'Tiada binding AI; padanan AI tidak tersedia')
  throw new HttpError(501, 'Cadangan AI belum dilaksanakan')
})
