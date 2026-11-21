import { Hono } from 'hono'
import type { CompanyDetail, ContractStatus } from '../../../types'
import { actorFrom, HttpError, newId, nowIso } from '../actor'
import { ChangeLogRepository } from '../repositories/ChangeLogRepository'
import { CONTRACT_EDITABLE, ContractRepository, type ContractInput, type PanelInput } from '../repositories/ContractRepository'
import { RateBookRepository } from '../repositories/RateBookRepository'
import { RateBookService } from '../services/RateBookService'
import { AppBindings } from '../types'

export const contractApp = new Hono<{ Bindings: AppBindings }>()

const TRANSITIONS: Record<string, ContractStatus[]> = { DRAF: ['AKTIF'], AKTIF: ['DITUTUP'], DITUTUP: [] }

function pickEditable(body: ContractInput): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const k of CONTRACT_EDITABLE) if (body[k] !== undefined) out[k] = body[k]
  if (out.kind !== undefined && !['PANEL', 'STANDALONE'].includes(String(out.kind))) throw new HttpError(400, 'kind mesti PANEL atau STANDALONE')
  return out
}

async function requireContract(repo: ContractRepository, id: string) {
  const contract = await repo.get(id)
  if (!contract) throw new HttpError(404, 'Kontrak tidak dijumpai')
  return contract
}

contractApp.get('/', async (c) => c.json(await new ContractRepository(c.env.DB).list()))

contractApp.post('/', async (c) => {
  const body = await c.req.json<ContractInput & { clone_from?: string }>()
  const fields = pickEditable(body)
  if (!fields.code || !fields.title) throw new HttpError(400, 'code dan title diperlukan')
  const repo = new ContractRepository(c.env.DB)
  if (await repo.getByCode(String(fields.code))) throw new HttpError(409, `Kod ${fields.code} sudah wujud`)
  const actor = await actorFrom(c)
  const id = newId('ctr')
  const record = { kind: 'PANEL', ...fields, id, status: 'DRAF', cloned_from: body.clone_from ?? null, created_at: nowIso(), created_by: actor.id }
  const cloneStmts = body.clone_from ? await cloneStatements(c.env.DB, actor, body.clone_from, id) : []
  await c.env.DB.batch([
    repo.insert(record),
    ...cloneStmts,
    new ChangeLogRepository(c.env.DB).statement(actor, { entity: 'contract', entityId: id, action: 'create', message: `Cipta ${fields.code}`, diff: record }),
  ])
  return c.json(await repo.get(id), 201)
})

async function cloneStatements(db: D1Database, actor: Awaited<ReturnType<typeof actorFrom>>, sourceId: string, targetId: string) {
  const repo = new ContractRepository(db)
  const source = await requireContract(repo, sourceId)
  return [...(await new RateBookService(db, actor).cloneStatements(source.id, targetId, source.code)), repo.copyPanel(source.id, targetId)]
}

contractApp.get('/:id', async (c) => c.json(await requireContract(new ContractRepository(c.env.DB), c.req.param('id'))))

contractApp.patch('/:id', async (c) => {
  const repo = new ContractRepository(c.env.DB)
  const before = await requireContract(repo, c.req.param('id'))
  const fields = pickEditable(await c.req.json<ContractInput>())
  if (!Object.keys(fields).length) throw new HttpError(400, 'Tiada medan untuk dikemas kini')
  const actor = await actorFrom(c)
  await c.env.DB.batch([
    repo.update(before.id, fields),
    new ChangeLogRepository(c.env.DB).statement(actor, { entity: 'contract', entityId: before.id, action: 'update', message: `Kemas kini ${before.code}`, diff: { before, set: fields } }),
  ])
  return c.json(await repo.get(before.id))
})

contractApp.post('/:id/status', async (c) => {
  const repo = new ContractRepository(c.env.DB)
  const contract = await requireContract(repo, c.req.param('id'))
  const { status } = await c.req.json<{ status: ContractStatus }>()
  if (!TRANSITIONS[contract.status].includes(status)) throw new HttpError(409, `Tidak boleh tukar ${contract.status} -> ${status}`)
  if (status === 'AKTIF' && !(await new RateBookRepository(c.env.DB).currentVersion(contract.id))) throw new HttpError(409, 'Terbitkan buku kadar dahulu sebelum AKTIF')
  const actor = await actorFrom(c)
  await c.env.DB.batch([
    repo.setStatus(contract.id, status, nowIso()),
    new ChangeLogRepository(c.env.DB).statement(actor, { entity: 'contract', entityId: contract.id, action: 'status', message: `${contract.code}: ${contract.status} -> ${status}`, diff: { status: [contract.status, status] } }),
  ])
  return c.json(await repo.get(contract.id))
})

contractApp.get('/:id/companies', async (c) => {
  const repo = new ContractRepository(c.env.DB)
  const contract = await requireContract(repo, c.req.param('id'))
  return c.json(await repo.panel(contract.id))
})

function readPanel(body: unknown): PanelInput[] {
  if (!Array.isArray(body)) throw new HttpError(400, 'Senarai syarikat diperlukan')
  const panel = body.map((x: any) => ({ name: String(x?.name ?? '').trim(), cap: x?.cap ?? null, details: (x?.details as CompanyDetail) ?? null }))
  if (panel.some((p) => !p.name)) throw new HttpError(400, 'Setiap syarikat perlu name')
  if (new Set(panel.map((p) => p.name)).size !== panel.length) throw new HttpError(400, 'Nama syarikat berulang')
  return panel
}

contractApp.put('/:id/companies', async (c) => {
  const repo = new ContractRepository(c.env.DB)
  const contract = await requireContract(repo, c.req.param('id'))
  const panel = readPanel(await c.req.json())
  const before = (await repo.panel(contract.id)).map((p) => p.name)
  const after = panel.map((p) => p.name)
  const diff = { added: after.filter((n) => !before.includes(n)), removed: before.filter((n) => !after.includes(n)), size: [before.length, after.length] }
  const actor = await actorFrom(c)
  await c.env.DB.batch([
    ...repo.replacePanel(contract.id, panel, nowIso()),
    new ChangeLogRepository(c.env.DB).statement(actor, { entity: 'contract', entityId: contract.id, action: 'panel', message: `Panel ${contract.code}: ${after.length} syarikat`, diff }),
  ])
  return c.json(await repo.panel(contract.id))
})

contractApp.get('/:id/book', async (c) => {
  const svc = new RateBookService(c.env.DB, await actorFrom(c))
  const { version, groups } = await svc.book(c.req.param('id'), c.req.query('version'))
  c.header('X-Rate-Book-Version', version.id)
  return c.json(groups)
})

contractApp.get('/:id/versions', async (c) => {
  const contract = await requireContract(new ContractRepository(c.env.DB), c.req.param('id'))
  return c.json(await new RateBookRepository(c.env.DB).listVersions(contract.id))
})

contractApp.post('/:id/versions/import', async (c) => {
  const svc = new RateBookService(c.env.DB, await actorFrom(c))
  return c.json(await svc.importVersion(c.req.param('id'), await c.req.json()), 201)
})
