import type { CompanyDetail, Contract, ContractCompany, ContractStatus } from '../../../types'
import { BaseRepository } from './BaseRepository'

// Request bodies use the snake_case column names (CONTRACT §5); responses are camelCase.
export const CONTRACT_EDITABLE = ['code', 'title', 'kind', 'valid_from', 'valid_to', 'company_cap', 'meeting_number', 'meeting_date', 'notes'] as const
export interface PanelInput {
  name: string
  cap?: number | null
  details?: CompanyDetail | null
}

export type ContractInput = Partial<Record<(typeof CONTRACT_EDITABLE)[number], string | number | null>>

const STATS_SQL = `SELECT c.*,
  (SELECT COUNT(*) FROM projects p WHERE p.contract_id = c.id) AS n_projects,
  (SELECT COUNT(*) FROM rate_book_versions v WHERE v.contract_id = c.id) AS n_versions,
  (SELECT MAX(version_no) FROM rate_book_versions v WHERE v.contract_id = c.id AND v.status = 'TERBIT') AS current_version,
  (SELECT COUNT(*) FROM contract_companies cc WHERE cc.contract_id = c.id) AS panel_size
  FROM contracts c`

export function mapContract(r: any): Contract {
  const out: Contract = {
    id: r.id, code: r.code, title: r.title, kind: r.kind, status: r.status, validFrom: r.valid_from, validTo: r.valid_to,
    companyCap: r.company_cap, meetingNumber: r.meeting_number, meetingDate: r.meeting_date, notes: r.notes,
    clonedFrom: r.cloned_from, createdAt: r.created_at, createdBy: r.created_by, activatedAt: r.activated_at, closedAt: r.closed_at,
  }
  if (r.n_projects !== undefined) {
    out.stats = { projects: r.n_projects, versions: r.n_versions, currentVersion: r.current_version ?? null, panelSize: r.panel_size }
  }
  return out
}

export class ContractRepository extends BaseRepository {
  public async list(): Promise<Contract[]> {
    const { results } = await this.db.prepare(`${STATS_SQL} ORDER BY CASE c.status WHEN 'AKTIF' THEN 0 WHEN 'DRAF' THEN 1 ELSE 2 END, c.created_at DESC`).all()
    return results.map(mapContract)
  }

  public async get(id: string): Promise<Contract | null> {
    const row = await this.db.prepare(`${STATS_SQL} WHERE c.id = ?`).bind(id).first()
    return row ? mapContract(row) : null
  }

  public async getByCode(code: string): Promise<Contract | null> {
    const row = await this.db.prepare('SELECT * FROM contracts WHERE code = ?').bind(code).first()
    return row ? mapContract(row) : null
  }

  /** The contract a new project gets: the most recently activated AKTIF panel contract, else any AKTIF one. */
  public async defaultContract(): Promise<Contract | null> {
    const row = await this.db.prepare(
      "SELECT * FROM contracts WHERE status = 'AKTIF' ORDER BY (kind = 'PANEL') DESC, activated_at DESC, created_at DESC LIMIT 1"
    ).first()
    return row ? mapContract(row) : null
  }

  public insert(record: Record<string, unknown>): D1PreparedStatement {
    const { keys, values, placeholders } = this.buildInsert(record)
    return this.db.prepare(`INSERT INTO contracts (${keys.join(', ')}) VALUES (${placeholders})`).bind(...values)
  }

  public update(id: string, fields: Record<string, unknown>): D1PreparedStatement {
    const { setClauses, values } = this.buildUpdate(fields)
    return this.db.prepare(`UPDATE contracts SET ${setClauses} WHERE id = ?`).bind(...values, id)
  }

  public setStatus(id: string, status: ContractStatus, at: string): D1PreparedStatement {
    const column = status === 'AKTIF' ? 'activated_at' : 'closed_at'
    return this.db.prepare(`UPDATE contracts SET status = ?, ${column} = ? WHERE id = ?`).bind(status, at, id)
  }

  // The contract and everything that hangs off it, in child-first order (one D1 batch = one transaction).
  public deleteStatements(id: string): D1PreparedStatement[] {
    const versions = 'SELECT id FROM rate_book_versions WHERE contract_id = ?'
    return [
      this.db.prepare(`DELETE FROM rate_book_matches WHERE version_id IN (${versions})`).bind(id),
      this.db.prepare(`DELETE FROM rate_book_groups WHERE version_id IN (${versions})`).bind(id),
      this.db.prepare('DELETE FROM rate_book_versions WHERE contract_id = ?').bind(id),
      this.db.prepare('DELETE FROM contract_companies WHERE contract_id = ?').bind(id),
      this.db.prepare('DELETE FROM contracts WHERE id = ?').bind(id),
    ]
  }

  public async panel(contractId: string): Promise<ContractCompany[]> {
    const { results } = await this.db.prepare(
      `SELECT cc.company_name, cc.sort_index, cc.cap, co.details FROM contract_companies cc
       LEFT JOIN companies co ON co.name = cc.company_name WHERE cc.contract_id = ? ORDER BY cc.sort_index, cc.company_name`
    ).bind(contractId).all<any>()
    return results.map((r) => ({ name: r.company_name, sortIndex: r.sort_index, cap: r.cap, details: r.details ? (JSON.parse(r.details) as CompanyDetail) : null }))
  }

  public replacePanel(contractId: string, companies: PanelInput[], at: string): D1PreparedStatement[] {
    const rows = JSON.stringify(companies.map((c, i) => ({ name: c.name, cap: c.cap ?? null, sortIndex: i })))
    return [
      this.db.prepare('DELETE FROM contract_companies WHERE contract_id = ?').bind(contractId),
      this.upsertCompanies(companies, at),
      this.db.prepare(
        `INSERT INTO contract_companies (contract_id, company_name, sort_index, cap)
         SELECT ?1, json_extract(value, '$.name'), json_extract(value, '$.sortIndex'), json_extract(value, '$.cap') FROM json_each(?2)`
      ).bind(contractId, rows),
    ]
  }

  // Details are only written when given, so a panel edit never wipes a company's profile.
  // overwrite=false keeps existing rows untouched (used by the idempotent legacy migration).
  public upsertCompanies(companies: PanelInput[], at: string, overwrite = true): D1PreparedStatement {
    const rows = JSON.stringify(companies.map((c) => ({ name: c.name, details: c.details ? JSON.stringify(c.details) : null })))
    const conflict = overwrite
      ? 'DO UPDATE SET details = COALESCE(excluded.details, companies.details), updated_at = excluded.updated_at'
      : 'DO NOTHING'
    return this.db.prepare(
      `INSERT INTO companies (name, details, updated_at)
       SELECT json_extract(value, '$.name'), json_extract(value, '$.details'), ?2 FROM json_each(?1) WHERE true
       ON CONFLICT(name) ${conflict}`
    ).bind(rows, at)
  }

  public copyPanel(fromId: string, toId: string): D1PreparedStatement {
    return this.db.prepare(
      'INSERT OR IGNORE INTO contract_companies (contract_id, company_name, sort_index, cap) SELECT ?, company_name, sort_index, cap FROM contract_companies WHERE contract_id = ?'
    ).bind(toId, fromId)
  }
}
