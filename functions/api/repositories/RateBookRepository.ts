import type { PresetGroup, RateBookMatchRow, RateBookVersion } from '../../../types'
import { BaseRepository } from './BaseRepository'

export interface NewVersion {
  id: string
  contractId: string
  versionNo: number
  status: 'DRAF' | 'TERBIT'
  message: string | null
  source: 'LEGACY' | 'IMPORT' | 'CLONE' | 'EDIT'
  sourceFile?: string | null
  rateColumn?: string | null
  stats?: unknown
  createdAt: string
  createdBy: number | null
}

const mapVersion = (r: any): RateBookVersion => ({
  id: r.id, contractId: r.contract_id, versionNo: r.version_no, status: r.status, message: r.message, source: r.source,
  sourceFile: r.source_file, rateColumn: r.rate_column, stats: r.stats ? JSON.parse(r.stats) : null,
  createdAt: r.created_at, createdBy: r.created_by, publishedAt: r.published_at, publishedBy: r.published_by,
})

const mapMatch = (r: any): RateBookMatchRow => ({
  newRef: r.new_ref, oldGroupId: r.old_group_id, oldItemId: r.old_item_id, oldVariantId: r.old_variant_id,
  method: r.method, score: r.score, decision: r.decision,
})

export class RateBookRepository extends BaseRepository {
  public async listVersions(contractId: string): Promise<RateBookVersion[]> {
    const { results } = await this.db.prepare('SELECT * FROM rate_book_versions WHERE contract_id = ? ORDER BY version_no DESC').bind(contractId).all()
    return results.map(mapVersion)
  }

  public async getVersion(id: string): Promise<RateBookVersion | null> {
    const row = await this.db.prepare('SELECT * FROM rate_book_versions WHERE id = ?').bind(id).first()
    return row ? mapVersion(row) : null
  }

  /** A contract's current book = its highest TERBIT version. */
  public async currentVersion(contractId: string): Promise<RateBookVersion | null> {
    const row = await this.db.prepare(
      "SELECT * FROM rate_book_versions WHERE contract_id = ? AND status = 'TERBIT' ORDER BY version_no DESC LIMIT 1"
    ).bind(contractId).first()
    return row ? mapVersion(row) : null
  }

  public async versionByNo(contractId: string, versionNo: number): Promise<RateBookVersion | null> {
    const row = await this.db.prepare('SELECT * FROM rate_book_versions WHERE contract_id = ? AND version_no = ?').bind(contractId, versionNo).first()
    return row ? mapVersion(row) : null
  }

  public async nextVersionNo(contractId: string): Promise<number> {
    const row = await this.db.prepare('SELECT COALESCE(MAX(version_no), 0) + 1 AS n FROM rate_book_versions WHERE contract_id = ?').bind(contractId).first<{ n: number }>()
    return row?.n ?? 1
  }

  public async getGroups(versionId: string): Promise<PresetGroup[]> {
    const { results } = await this.db.prepare('SELECT * FROM rate_book_groups WHERE version_id = ? ORDER BY sort_index').bind(versionId).all<any>()
    return results.map((r) => ({
      id: r.id, title: r.title, category: r.category, items: this.parseJsonArray(r.items),
      ...(r.code ? { code: r.code } : {}), ...(r.bill ? { bill: r.bill } : {}),
    }))
  }

  public async getMatches(versionId: string): Promise<RateBookMatchRow[]> {
    const { results } = await this.db.prepare('SELECT * FROM rate_book_matches WHERE version_id = ? ORDER BY rowid').bind(versionId).all()
    return results.map(mapMatch)
  }

  public insertVersion(v: NewVersion): D1PreparedStatement {
    const published = v.status === 'TERBIT'
    return this.db.prepare(
      `INSERT INTO rate_book_versions (id, contract_id, version_no, status, message, source, source_file, rate_column, stats,
        created_at, created_by, published_at, published_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(v.id, v.contractId, v.versionNo, v.status, v.message, v.source, v.sourceFile ?? null, v.rateColumn ?? null,
      v.stats === undefined ? null : JSON.stringify(v.stats), v.createdAt, v.createdBy, published ? v.createdAt : null, published ? v.createdBy : null)
  }

  // One statement per bulk write (rows travel as a JSON parameter): D1 caps queries per request and
  // bound parameters per query, and a rate book has hundreds of rows.
  public insertGroups(versionId: string, groups: PresetGroup[]): D1PreparedStatement {
    return this.db.prepare(
      `INSERT INTO rate_book_groups (version_id, id, title, category, items, sort_index, code, bill)
       SELECT ?1, json_extract(value, '$.id'), json_extract(value, '$.title'), json_extract(value, '$.category'),
              json_extract(value, '$.items'), key, json_extract(value, '$.code'), json_extract(value, '$.bill')
       FROM json_each(?2)`
    ).bind(versionId, JSON.stringify(groups))
  }

  public replaceGroups(versionId: string, groups: PresetGroup[]): D1PreparedStatement[] {
    return [this.db.prepare('DELETE FROM rate_book_groups WHERE version_id = ?').bind(versionId), this.insertGroups(versionId, groups)]
  }

  public insertMatches(versionId: string, rows: RateBookMatchRow[]): D1PreparedStatement {
    return this.db.prepare(
      `INSERT INTO rate_book_matches (version_id, new_ref, old_group_id, old_item_id, old_variant_id, method, score, decision)
       SELECT ?1, json_extract(value, '$.newRef'), json_extract(value, '$.oldGroupId'), json_extract(value, '$.oldItemId'),
              json_extract(value, '$.oldVariantId'), json_extract(value, '$.method'), json_extract(value, '$.score'), json_extract(value, '$.decision')
       FROM json_each(?2)`
    ).bind(versionId, JSON.stringify(rows))
  }

  public updateMatches(versionId: string, rows: RateBookMatchRow[]): D1PreparedStatement {
    return this.db.prepare(
      `UPDATE rate_book_matches SET old_group_id = d.og, old_item_id = d.oi, old_variant_id = d.ov, method = d.me, score = d.sc, decision = d.de
       FROM (SELECT json_extract(value, '$.newRef') AS nr, json_extract(value, '$.oldGroupId') AS og, json_extract(value, '$.oldItemId') AS oi,
                    json_extract(value, '$.oldVariantId') AS ov, json_extract(value, '$.method') AS me, json_extract(value, '$.score') AS sc,
                    json_extract(value, '$.decision') AS de FROM json_each(?2)) AS d
       WHERE rate_book_matches.version_id = ?1 AND rate_book_matches.new_ref = d.nr`
    ).bind(versionId, JSON.stringify(rows))
  }

  public publish(versionId: string, message: string | null, stats: unknown, at: string, by: number | null): D1PreparedStatement {
    return this.db.prepare(
      "UPDATE rate_book_versions SET status = 'TERBIT', message = COALESCE(?, message), stats = ?, published_at = ?, published_by = ? WHERE id = ? AND status = 'DRAF'"
    ).bind(message, JSON.stringify(stats), at, by, versionId)
  }
}
