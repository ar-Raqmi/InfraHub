import { matchBooks } from '../../../domain/rateBook/matchItems'
import { sumBqAmounts } from '../../../domain/money'
import { applyReprice, planReprice, type RepriceMapping } from '../../../domain/reprice'
import type { BQGroup, Contract, PresetGroup } from '../../../types'
import { HttpError, nowIso, type Actor } from '../actor'
import { ChangeLogRepository } from '../repositories/ChangeLogRepository'
import { ContractRepository } from '../repositories/ContractRepository'
import { ProjectRepository } from '../repositories/ProjectRepository'
import { RateBookRepository } from '../repositories/RateBookRepository'

interface ProjectRow {
  id: number
  contract_id: string | null
  rate_book_version_id: string | null
  no_inden: string | null
  no_sebutharga: string | null
  bq_data: string | null
  kos_projek: number | null
}

/** Which sebutharga prices a project: swapping it, and re-pricing its BQ onto another book. */
export class ProjectContractService {
  private readonly contracts: ContractRepository
  private readonly books: RateBookRepository
  private readonly log: ChangeLogRepository

  constructor(private readonly db: D1Database, private readonly actor: Actor) {
    this.contracts = new ContractRepository(db)
    this.books = new RateBookRepository(db)
    this.log = new ChangeLogRepository(db)
  }

  private async project(id: string): Promise<ProjectRow> {
    const row = await this.db.prepare(
      'SELECT id, contract_id, rate_book_version_id, no_inden, no_sebutharga, bq_data, kos_projek FROM projects WHERE id = ?'
    ).bind(id).first<ProjectRow>()
    if (!row) throw new HttpError(404, 'Projek tidak dijumpai')
    return row
  }

  private async target(contractId: string): Promise<{ contract: Contract; versionId: string }> {
    const contract = contractId ? await this.contracts.get(contractId) : null
    if (!contract) throw new HttpError(404, 'Kontrak tidak dijumpai')
    if (contract.status === 'DITUTUP') throw new HttpError(409, 'Kontrak sudah DITUTUP')
    const version = await this.books.currentVersion(contract.id)
    if (!version) throw new HttpError(409, 'Kontrak tiada buku kadar terbit')
    return { contract, versionId: version.id }
  }

  // Owner default: a project's contract locks once the inden number exists; unlocking is explicit and logged.
  private assertUnlocked(p: ProjectRow, unlock: boolean | undefined): void {
    if ((p.no_inden ?? '').trim() && !unlock) throw new HttpError(423, 'Kontrak projek dikunci selepas No. Inden; hantar {unlock:true} untuk buka')
  }

  public async swap(projectId: string, contractId: string, unlock?: boolean) {
    const p = await this.project(projectId)
    this.assertUnlocked(p, unlock)
    const { contract, versionId } = await this.target(contractId)
    const diff = {
      contractId: [p.contract_id, contract.id], rateBookVersionId: [p.rate_book_version_id, versionId],
      noSebutharga: [p.no_sebutharga, contract.code], unlocked: !!(unlock && (p.no_inden ?? '').trim()),
    }
    await this.db.batch([
      this.db.prepare('UPDATE projects SET contract_id = ?, rate_book_version_id = ?, no_sebutharga = ?, updated_at = ? WHERE id = ?')
        .bind(contract.id, versionId, contract.code, nowIso(), p.id),
      this.log.statement(this.actor, { entity: 'project', entityId: String(p.id), action: diff.unlocked ? 'swap-unlocked' : 'swap', message: `Tukar kontrak ke ${contract.code}`, diff }),
    ])
    return new ProjectRepository(this.db).getById(String(p.id))
  }

  /** Old -> new row mapping when the target book does not share item ids with the project's book. */
  private async mappings(fromVersionId: string | null, toGroups: PresetGroup[]): Promise<RepriceMapping[]> {
    if (!fromVersionId) return []
    const fromGroups = await this.books.getGroups(fromVersionId)
    const { matches } = matchBooks(toGroups, fromGroups)
    return matches.filter((m) => m.decision === 'ACCEPT' && m.old).map((m) => {
      const [groupId, itemId, variantId] = m.newRef.split('/')
      return { from: { itemId: m.old!.itemId, variantId: m.old!.variantId }, to: { groupId, itemId, variantId } }
    })
  }

  public async reprice(projectId: string, toContractId: string, dryRun: boolean, unlock?: boolean) {
    const p = await this.project(projectId)
    const { contract, versionId } = await this.target(toContractId)
    const toGroups = await this.books.getGroups(versionId)
    const bq: BQGroup[] = p.bq_data ? JSON.parse(p.bq_data) : []
    const plan = planReprice(bq, toGroups, await this.mappings(p.rate_book_version_id, toGroups))
    if (dryRun) return { dryRun: true, contract: { id: contract.id, code: contract.code }, rateBookVersionId: versionId, plan }
    this.assertUnlocked(p, unlock)
    const next = applyReprice(bq, plan)
    const kosProjek = parseFloat((sumBqAmounts(next) ?? 0).toFixed(2))
    await this.db.batch([
      this.db.prepare('UPDATE projects SET bq_data = ?, kos_projek = ?, contract_id = ?, rate_book_version_id = ?, no_sebutharga = ?, updated_at = ? WHERE id = ?')
        .bind(JSON.stringify(next), kosProjek, contract.id, versionId, contract.code, nowIso(), p.id),
      this.log.statement(this.actor, {
        entity: 'project', entityId: String(p.id), action: 'reprice', message: `Harga semula ke ${contract.code}`,
        diff: { contractId: [p.contract_id, contract.id], rateBookVersionId: [p.rate_book_version_id, versionId], kosProjek: [p.kos_projek, kosProjek], totals: plan.totals, unlocked: !!(unlock && (p.no_inden ?? '').trim()) },
      }),
    ])
    return { dryRun: false, plan, project: await new ProjectRepository(this.db).getById(String(p.id)) }
  }
}
