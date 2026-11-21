import { Hono } from 'hono'
import { actorFrom, HttpError } from '../actor'
import { ChangeLogRepository } from '../repositories/ChangeLogRepository'
import { RateBookService, type MatchDecisionInput } from '../services/RateBookService'
import { AppBindings } from '../types'

export const rateBookApp = new Hono<{ Bindings: AppBindings }>()

rateBookApp.get('/versions/:vid', async (c) => {
  const svc = new RateBookService(c.env.DB, await actorFrom(c))
  return c.json(await svc.versionDetail(c.req.param('vid')))
})

rateBookApp.patch('/versions/:vid/matches', async (c) => {
  const { decisions } = await c.req.json<{ decisions: MatchDecisionInput[] }>()
  const svc = new RateBookService(c.env.DB, await actorFrom(c))
  return c.json(await svc.decide(c.req.param('vid'), decisions))
})

rateBookApp.post('/versions/:vid/publish', async (c) => {
  const { message } = await c.req.json<{ message?: string }>().catch(() => ({ message: undefined }))
  const svc = new RateBookService(c.env.DB, await actorFrom(c))
  return c.json(await svc.publish(c.req.param('vid'), message))
})

rateBookApp.get('/diff', async (c) => {
  const from = c.req.query('from')
  const to = c.req.query('to')
  if (!from || !to) throw new HttpError(400, 'from dan to (id versi) diperlukan')
  return c.json(await new RateBookService(c.env.DB, await actorFrom(c)).diff(from, to))
})

export const changeLogApp = new Hono<{ Bindings: AppBindings }>()

changeLogApp.get('/', async (c) => {
  const repo = new ChangeLogRepository(c.env.DB)
  return c.json(await repo.list({ entity: c.req.query('entity'), entityId: c.req.query('entityId'), limit: Number(c.req.query('limit')) }))
})
