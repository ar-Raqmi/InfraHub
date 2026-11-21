import { DEFAULT_POLICY_RULES } from '../../../domain/policy'
import { BP_OPTIONS, MUKIM_OPTIONS, ZON_OPTIONS, type CompanyDetail } from '../../../types'
import { nowIso, type Actor } from '../actor'
import { ChangeLogRepository } from '../repositories/ChangeLogRepository'
import { ConfigRepository } from '../repositories/ConfigRepository'
import { ContractRepository, type PanelInput } from '../repositories/ContractRepository'
import { SystemRepository } from '../repositories/SystemRepository'

const CLOSED_MESSAGE = 'salinan Pustaka semasa; kadar asal tidak direkodkan'
const ACTIVE_MESSAGE = 'Pustaka semasa (migrasi)'
const COUNTED_TABLES = ['contracts', 'companies', 'contract_companies', 'rate_book_versions', 'rate_book_groups', 'lookup_values', 'policy_rules'] as const

interface YearSettings {
  year: number
  companies: string[]
  companyOrder: string[]
  details: Record<string, CompanyDetail>
  sebutharga: string[]
  meetingNumber: string | null
  meetingDate: string | null
}

export const legacyContractId = (code: string): string => `legacy-${code.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
export const legacyVersionId = (contractId: string): string => `${contractId}-v1`

/**
 * One-off, idempotent move from year-bound settings + the global Pustaka to contracts with rate books.
 * Only inserts what is missing (INSERT OR IGNORE / IS NULL guards), so a second run changes nothing
 * and later edits by officers are never overwritten.
 */
export class LegacyMigration {
  private readonly contracts: ContractRepository
  private readonly config: ConfigRepository
  private readonly log: ChangeLogRepository

  constructor(private readonly db: D1Database, private readonly actor: Actor) {
    this.contracts = new ContractRepository(db)
    this.config = new ConfigRepository(db)
    this.log = new ChangeLogRepository(db)
  }

  public async run() {
    const before = await this.counts()
    const years = await this.readYears()
    const usage = await this.missingSebutharga(years)
    const existingActive = await this.contracts.defaultContract()
    const active = existingActive?.code ?? this.mostUsed(usage)
    const activeId = existingActive?.id ?? (active ? legacyContractId(active) : null)
    const at = nowIso()
    const library = await new SystemRepository(this.db).getLibraryGroups()
    const statements = [
      ...this.contractStatements(usage, active, years, at),
      ...this.versionStatements(usage, active, library, at),
      this.contracts.upsertCompanies(this.allCompanies(years), at, false),
      ...(existingActive ? [] : this.panelStatements(active, years)),
      ...this.projectStatements(activeId),
      ...this.lookupStatements(),
      ...DEFAULT_POLICY_RULES.map((rule) => this.config.putPolicy(rule, at, this.actor.id, true)),
    ]
    const results = await this.db.batch(statements)
    const changedRows = results.reduce((n, r) => n + (r.meta?.changes ?? 0), 0)
    const after = await this.counts()
    const summary = { activeContract: active, createdContracts: [...usage.keys()], changedRows, before, after }
    if (changedRows > 0) {
      await this.log.statement(this.actor, { entity: 'contract', entityId: activeId, action: 'migrate-legacy', message: 'Migrasi data lama ke kontrak + buku kadar', diff: summary }).run()
    }
    return summary
  }

  private async counts(): Promise<Record<string, number>> {
    const cols = COUNTED_TABLES.map((t) => `(SELECT COUNT(*) FROM ${t}) AS ${t}`)
    const row = await this.db.prepare(
      `SELECT ${cols.join(', ')}, (SELECT COUNT(*) FROM projects WHERE contract_id IS NOT NULL) AS projects_linked`
    ).first<Record<string, number>>()
    return { ...row }
  }

  private async readYears(): Promise<YearSettings[]> {
    const { results } = await this.db.prepare('SELECT * FROM system_settings ORDER BY year DESC').all<any>()
    const arr = (v: string | null) => (v ? (JSON.parse(v) as string[]) : [])
    return results.map((r) => ({
      year: r.year, companies: arr(r.companies), companyOrder: arr(r.company_order), details: r.company_details ? JSON.parse(r.company_details) : {},
      sebutharga: arr(r.sebutharga_numbers).map((s) => s.trim()).filter(Boolean), meetingNumber: r.meeting_number, meetingDate: r.meeting_date,
    }))
  }

  /** code -> number of projects, for every sebutharga in projects or any year's settings that has no contract yet. */
  private async missingSebutharga(years: YearSettings[]): Promise<Map<string, number>> {
    const { results } = await this.db.prepare(
      "SELECT TRIM(no_sebutharga) AS code, COUNT(*) AS n FROM projects WHERE TRIM(COALESCE(no_sebutharga, '')) <> '' GROUP BY 1"
    ).all<{ code: string; n: number }>()
    const usage = new Map(results.map((r) => [r.code, r.n]))
    for (const y of years) for (const code of y.sebutharga) if (!usage.has(code)) usage.set(code, 0)
    const { results: known } = await this.db.prepare('SELECT code FROM contracts').all<{ code: string }>()
    for (const { code } of known) usage.delete(code)
    return usage
  }

  // Used only when no AKTIF contract exists yet: the most used sebutharga becomes AKTIF.
  private mostUsed(usage: Map<string, number>): string | null {
    let best: string | null = null
    for (const [code, n] of usage) if (best === null || n > usage.get(best)!) best = code
    return best
  }

  private yearOf(code: string | null, years: YearSettings[]): YearSettings | undefined {
    return years.find((y) => code && y.sebutharga.includes(code)) ?? years.find((y) => y.companies.length > 0)
  }

  private contractStatements(usage: Map<string, number>, active: string | null, years: YearSettings[], at: string): D1PreparedStatement[] {
    return [...usage.keys()].map((code) => {
      const isActive = code === active
      const year = isActive ? this.yearOf(code, years) : years.find((y) => y.sebutharga.includes(code))
      const cap = year ? Object.values(year.details).find((d) => d?.limit)?.limit ?? null : null
      return this.db.prepare(
        `INSERT OR IGNORE INTO contracts (id, code, title, kind, status, company_cap, meeting_number, meeting_date, notes, created_at, created_by, activated_at, closed_at)
         VALUES (?, ?, ?, 'PANEL', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(legacyContractId(code), code, `Sebutharga ${code}`, isActive ? 'AKTIF' : 'DITUTUP', cap, year?.meetingNumber ?? null,
        year?.meetingDate ?? null, `Dicipta oleh migrasi data lama${year ? ` (tetapan ${year.year})` : ''}`, at, this.actor.id,
        isActive ? at : null, isActive ? null : at)
    })
  }

  // Version 1 is inserted only for contracts that have no version yet.
  private versionStatements(usage: Map<string, number>, active: string | null, library: unknown[], at: string): D1PreparedStatement[] {
    return [...usage.keys()].flatMap((code) => {
      const contractId = legacyContractId(code)
      const versionId = legacyVersionId(contractId)
      const message = code === active ? ACTIVE_MESSAGE : CLOSED_MESSAGE
      return [
        this.db.prepare(
          `INSERT INTO rate_book_versions (id, contract_id, version_no, status, message, source, stats, created_at, created_by, published_at, published_by)
           SELECT ?1, ?2, 1, 'TERBIT', ?3, 'LEGACY', ?4, ?5, ?6, ?5, ?6
           WHERE NOT EXISTS (SELECT 1 FROM rate_book_versions WHERE contract_id = ?2)`
        ).bind(versionId, contractId, message, JSON.stringify({ groups: library.length }), at, this.actor.id),
        this.db.prepare(
          `INSERT OR IGNORE INTO rate_book_groups (version_id, id, title, category, items, sort_index)
           SELECT ?1, id, title, category, items, ROW_NUMBER() OVER (ORDER BY rowid) - 1 FROM library_groups
           WHERE EXISTS (SELECT 1 FROM rate_book_versions WHERE id = ?1 AND source = 'LEGACY')
             AND NOT EXISTS (SELECT 1 FROM rate_book_groups WHERE version_id = ?1)`
        ).bind(versionId),
      ]
    })
  }

  /** Union of every year's company details; the latest year wins (years are read newest first). */
  private allCompanies(years: YearSettings[]): PanelInput[] {
    const seen = new Map<string, PanelInput>()
    for (const y of years) {
      for (const [name, details] of Object.entries(y.details)) if (!seen.has(name)) seen.set(name, { name, details })
      for (const name of y.companies) if (!seen.has(name)) seen.set(name, { name, details: null })
    }
    return [...seen.values()]
  }

  private panelStatements(active: string | null, years: YearSettings[]): D1PreparedStatement[] {
    const year = this.yearOf(active, years)
    if (!active || !year) return []
    const order = [...year.companyOrder.filter((n) => year.companies.includes(n)), ...year.companies.filter((n) => !year.companyOrder.includes(n))]
    const rows = JSON.stringify(order.map((name, i) => ({ name, sortIndex: i, cap: year.details[name]?.limit ?? null })))
    return [this.db.prepare(
      `INSERT OR IGNORE INTO contract_companies (contract_id, company_name, sort_index, cap)
       SELECT ?1, json_extract(value, '$.name'), json_extract(value, '$.sortIndex'), json_extract(value, '$.cap') FROM json_each(?2)
       WHERE NOT EXISTS (SELECT 1 FROM contract_companies WHERE contract_id = ?1)`
    ).bind(legacyContractId(active), rows)]
  }

  private projectStatements(activeId: string | null): D1PreparedStatement[] {
    const stmts = [this.db.prepare(
      `UPDATE projects SET contract_id = (SELECT id FROM contracts WHERE code = TRIM(projects.no_sebutharga))
       WHERE contract_id IS NULL AND TRIM(COALESCE(no_sebutharga, '')) <> ''`
    )]
    if (activeId) {
      stmts.push(this.db.prepare(
        "UPDATE projects SET contract_id = ? WHERE contract_id IS NULL AND TRIM(COALESCE(no_sebutharga, '')) = ''"
      ).bind(activeId))
    }
    stmts.push(this.db.prepare(
      `UPDATE projects SET rate_book_version_id = (SELECT id FROM rate_book_versions v WHERE v.contract_id = projects.contract_id AND v.version_no = 1)
       WHERE rate_book_version_id IS NULL AND contract_id IS NOT NULL`
    ))
    return stmts
  }

  private lookupStatements(): D1PreparedStatement[] {
    const lists: [string, string[]][] = [['BP', BP_OPTIONS], ['ZON', ZON_OPTIONS], ['MUKIM', MUKIM_OPTIONS]]
    return lists.map(([list, options]) => this.db.prepare(
      `INSERT OR IGNORE INTO lookup_values (list, code, label, sort_index, active)
       SELECT ?1, value, value, key, 1 FROM json_each(?2)`
    ).bind(list, JSON.stringify(options)))
  }
}
