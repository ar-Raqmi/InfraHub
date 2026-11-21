import { diffBooks } from '../../../domain/rateBook/diffBooks'
import { matchBooks, stabiliseIds, type RowMatch } from '../../../domain/rateBook/matchItems'
import { flattenBook } from '../../../domain/rateBook/rows'
import { toPresetGroups } from '../../../domain/rateBook/toPresetGroups'
import type { ParsedBook } from '../../../domain/rateBook/types'
import type { MatchDecision, PresetGroup, RateBookMatchRow, RateBookVersion } from '../../../types'
import { HttpError, newId, nowIso, type Actor } from '../actor'
import { ChangeLogRepository } from '../repositories/ChangeLogRepository'
import { ContractRepository } from '../repositories/ContractRepository'
import { RateBookRepository, type NewVersion } from '../repositories/RateBookRepository'

export interface ImportInput {
  fileName?: string
  rateColumn?: string
  book?: ParsedBook
}

export interface MatchDecisionInput {
  new_ref: string
  decision: MatchDecision
  old_group_id?: string
  old_item_id?: string
  old_variant_id?: string | null
}

const toRow = (m: RowMatch): RateBookMatchRow => ({
  newRef: m.newRef, oldGroupId: m.old?.groupId ?? null, oldItemId: m.old?.itemId ?? null, oldVariantId: m.old?.variantId ?? null,
  method: m.method, score: m.score, decision: m.decision,
})

const fromRow = (r: RateBookMatchRow): RowMatch => ({
  newRef: r.newRef, method: r.method, score: r.score, decision: r.decision,
  old: r.oldItemId ? { groupId: r.oldGroupId ?? '', itemId: r.oldItemId, ...(r.oldVariantId ? { variantId: r.oldVariantId } : {}) } : null,
})

/** Versioned rate books: import -> review matches -> publish, plus direct edits. Every write is logged in the same batch. */
export class RateBookService {
  private readonly books: RateBookRepository
  private readonly contracts: ContractRepository
  private readonly log: ChangeLogRepository

  constructor(private readonly db: D1Database, private readonly actor: Actor) {
    this.books = new RateBookRepository(db)
    this.contracts = new ContractRepository(db)
    this.log = new ChangeLogRepository(db)
  }

  public async book(contractId: string, version?: string): Promise<{ version: RateBookVersion; groups: PresetGroup[] }> {
    const v = await this.resolveVersion(contractId, version)
    return { version: v, groups: await this.books.getGroups(v.id) }
  }

  private async resolveVersion(contractId: string, version?: string): Promise<RateBookVersion> {
    const v = !version ? await this.books.currentVersion(contractId)
      : /^\d+$/.test(version) ? await this.books.versionByNo(contractId, Number(version))
        : await this.books.getVersion(version)
    if (!v || v.contractId !== contractId) throw new HttpError(404, 'Tiada buku kadar untuk kontrak ini')
    return v
  }

  public async importVersion(contractId: string, input: ImportInput) {
    const contract = await this.contracts.get(contractId)
    if (!contract) throw new HttpError(404, 'Kontrak tidak dijumpai')
    const { book, rateColumn } = input
    if (!book?.bills || !rateColumn || !book.rateColumns?.includes(rateColumn)) throw new HttpError(400, 'book dan rateColumn (salah satu book.rateColumns) diperlukan')
    const id = newId('rbv')
    const groups = toPresetGroups(book, rateColumn, { idPrefix: `${id.slice(4, 10)}-` })
    if (!groups.length) throw new HttpError(400, `Tiada baris berkadar dalam lajur "${rateColumn}"`)
    const base = await this.books.currentVersion(contractId)
    const result = matchBooks(groups, base ? await this.books.getGroups(base.id) : [])
    const version: NewVersion = {
      id, contractId, versionNo: await this.books.nextVersionNo(contractId), status: 'DRAF', message: null, source: 'IMPORT',
      sourceFile: input.fileName ?? null, rateColumn, createdAt: nowIso(), createdBy: this.actor.id,
      stats: { parse: book.stats, warnings: book.warnings ?? [], match: result.stats, baseVersionId: base?.id ?? null },
    }
    await this.db.batch([
      this.books.insertVersion(version),
      this.books.insertGroups(id, groups),
      this.books.insertMatches(id, result.matches.map(toRow)),
      this.log.statement(this.actor, { entity: 'rate_book', entityId: id, action: 'import', message: `Import ${input.fileName ?? ''} -> ${contract.code} v${version.versionNo} (draf)`, diff: { match: result.stats, parse: book.stats } }),
    ])
    return { version: await this.books.getVersion(id), stats: version.stats, matches: result.matches, removed: result.removed }
  }

  public async versionDetail(versionId: string) {
    const version = await this.requireVersion(versionId)
    const [groups, matches] = await Promise.all([this.books.getGroups(versionId), this.books.getMatches(versionId)])
    const baseId = (version.stats as any)?.baseVersionId as string | null | undefined
    const removed = baseId ? await this.removedRows(baseId, matches) : []
    return { version, groups, matches, removed }
  }

  private async removedRows(baseId: string, matches: RateBookMatchRow[]) {
    const used = new Set(matches.filter((m) => m.oldItemId && m.decision !== 'REJECT').map((m) => `${m.oldItemId}/${m.oldVariantId ?? ''}`))
    return flattenBook(await this.books.getGroups(baseId)).filter((r) => !used.has(r.key))
  }

  private async requireVersion(versionId: string): Promise<RateBookVersion> {
    const v = await this.books.getVersion(versionId)
    if (!v) throw new HttpError(404, 'Versi tidak dijumpai')
    return v
  }

  private async requireDraft(versionId: string): Promise<RateBookVersion> {
    const v = await this.requireVersion(versionId)
    if (v.status !== 'DRAF') throw new HttpError(409, 'Versi sudah diterbitkan')
    return v
  }

  public async decide(versionId: string, decisions: MatchDecisionInput[]) {
    await this.requireDraft(versionId)
    if (!Array.isArray(decisions) || !decisions.length) throw new HttpError(400, 'decisions[] diperlukan')
    const existing = new Map((await this.books.getMatches(versionId)).map((m) => [m.newRef, m]))
    const updates = decisions.map((d) => this.applyDecision(existing.get(d.new_ref), d))
    await this.db.batch([
      this.books.updateMatches(versionId, updates),
      this.log.statement(this.actor, { entity: 'rate_book', entityId: versionId, action: 'match', message: `${updates.length} keputusan padanan`, diff: decisions }),
    ])
    return this.books.getMatches(versionId)
  }

  private applyDecision(current: RateBookMatchRow | undefined, d: MatchDecisionInput): RateBookMatchRow {
    if (!current) throw new HttpError(400, `new_ref tidak dikenali: ${d.new_ref}`)
    if (!['PENDING', 'ACCEPT', 'REJECT'].includes(d.decision)) throw new HttpError(400, `decision tidak sah: ${d.decision}`)
    if (!d.old_item_id) return { ...current, decision: d.decision }
    return { ...current, oldGroupId: d.old_group_id ?? null, oldItemId: d.old_item_id, oldVariantId: d.old_variant_id ?? null, method: 'MANUAL', score: 1, decision: d.decision }
  }

  public async publish(versionId: string, message: string | undefined) {
    const version = await this.requireDraft(versionId)
    const matches = await this.books.getMatches(versionId)
    const pending = matches.filter((m) => m.decision === 'PENDING').length
    if (pending) throw new HttpError(409, `${pending} padanan belum diputuskan`, { pending })
    const groups = stabiliseIds(await this.books.getGroups(versionId), matches.map(fromRow))
    const baseId = (version.stats as any)?.baseVersionId as string | null
    const diff = diffBooks(baseId ? await this.books.getGroups(baseId) : [], groups).stats
    const at = nowIso()
    await this.db.batch([
      ...this.books.replaceGroups(versionId, groups),
      this.books.publish(versionId, message ?? null, { ...(version.stats as object), diff }, at, this.actor.id),
      this.log.statement(this.actor, { entity: 'rate_book', entityId: versionId, action: 'publish', message: message ?? `Terbit v${version.versionNo}`, diff }),
    ])
    return { version: await this.books.getVersion(versionId), diff }
  }

  public async diff(fromId: string, toId: string) {
    const [a, b] = await Promise.all([this.requireVersion(fromId), this.requireVersion(toId)])
    return diffBooks(await this.books.getGroups(a.id), await this.books.getGroups(b.id))
  }

  /** A direct edit of a contract's book becomes a new published EDIT version; nothing is deleted. */
  public async saveEdit(contractId: string, groups: PresetGroup[], message: string) {
    if (!Array.isArray(groups)) throw new HttpError(400, 'PresetGroup[] diperlukan')
    const base = await this.books.currentVersion(contractId)
    const diff = diffBooks(base ? await this.books.getGroups(base.id) : [], groups).stats
    const version: NewVersion = {
      id: newId('rbv'), contractId, versionNo: await this.books.nextVersionNo(contractId), status: 'TERBIT', message, source: 'EDIT',
      createdAt: nowIso(), createdBy: this.actor.id, stats: { diff, baseVersionId: base?.id ?? null },
    }
    await this.db.batch([
      this.books.insertVersion(version),
      this.books.insertGroups(version.id, groups),
      this.log.statement(this.actor, { entity: 'rate_book', entityId: version.id, action: 'edit', message, diff }),
    ])
    return { version: await this.books.getVersion(version.id), diff }
  }

  /** Statements that give `toContractId` version 1 = a copy of `fromContractId`'s current book. */
  public async cloneStatements(fromContractId: string, toContractId: string, fromCode: string): Promise<D1PreparedStatement[]> {
    const base = await this.books.currentVersion(fromContractId)
    if (!base) throw new HttpError(409, 'Kontrak sumber tiada buku kadar terbit')
    const version: NewVersion = {
      id: newId('rbv'), contractId: toContractId, versionNo: 1, status: 'TERBIT', message: `Salinan buku kadar ${fromCode} v${base.versionNo}`,
      source: 'CLONE', createdAt: nowIso(), createdBy: this.actor.id, stats: { baseVersionId: base.id },
    }
    return [this.books.insertVersion(version), this.books.insertGroups(version.id, await this.books.getGroups(base.id))]
  }
}
