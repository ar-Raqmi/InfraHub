import { Hono } from 'hono'
import { ProjectRepository } from '../repositories/ProjectRepository'
import { AppBindings } from '../types'
import { actorFrom, HttpError } from '../actor'
import { ContractRepository } from '../repositories/ContractRepository'
import { RateBookRepository } from '../repositories/RateBookRepository'
import { ProjectContractService } from '../services/ProjectContractService'

// A new project takes the contract it names (a PJA may pick another), else the default AKTIF one.
async function bindingFor(db: D1Database, requested: unknown) {
  const contracts = new ContractRepository(db)
  const contract = typeof requested === 'string' && requested ? await contracts.get(requested) : await contracts.defaultContract()
  if (!contract) return null
  const version = await new RateBookRepository(db).currentVersion(contract.id)
  return { contractId: contract.id, versionId: version?.id ?? null }
}

export const projectApp = new Hono<{ Bindings: AppBindings }>()

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
  const created = await repo.create(body, await bindingFor(c.env.DB, body.contractId))
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

// POST /api/projects/:id/contract {contractId, unlock?} - swap the pricing contract (logged; locked after No. Inden)
projectApp.post('/:id/contract', async (c) => {
  const { contractId, unlock } = await c.req.json<{ contractId: string; unlock?: boolean }>()
  if (!contractId) throw new HttpError(400, 'contractId diperlukan')
  const svc = new ProjectContractService(c.env.DB, await actorFrom(c))
  return c.json(await svc.swap(c.req.param('id'), contractId, unlock))
})

// POST /api/projects/:id/reprice {toContractId, dryRun, unlock?} - preview or apply old -> new rates
projectApp.post('/:id/reprice', async (c) => {
  const { toContractId, dryRun, unlock } = await c.req.json<{ toContractId: string; dryRun?: boolean; unlock?: boolean }>()
  if (!toContractId) throw new HttpError(400, 'toContractId diperlukan')
  const svc = new ProjectContractService(c.env.DB, await actorFrom(c))
  return c.json(await svc.reprice(c.req.param('id'), toContractId, dryRun !== false, unlock))
})
