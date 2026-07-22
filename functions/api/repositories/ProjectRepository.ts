import { BaseRepository } from './BaseRepository'

type FieldType = 'direct' | 'number' | 'bool' | 'jsonArray' | 'jsonArrayOpt' | 'jsonObjectOpt'

interface ProjectField {
  camel: string
  col: string
  type: FieldType
  default?: string
}

// Single source of truth for the projects table <-> project DTO mapping.
// Each field declares how it is read from a DB row, and how it is encoded for
// INSERT (create) / UPDATE. Adding a column now only requires one entry here.
const PROJECT_FIELDS: ProjectField[] = [
  { camel: 'namaProjek', col: 'nama_projek', type: 'direct' },
  { camel: 'noAduan', col: 'no_aduan', type: 'direct' },
  { camel: 'aduan', col: 'aduan', type: 'direct' },
  { camel: 'lokasi', col: 'lokasi', type: 'direct' },
  { camel: 'projectLocations', col: 'project_locations', type: 'jsonArray' },
  { camel: 'bp', col: 'bp', type: 'direct' },
  { camel: 'zon', col: 'zon', type: 'direct' },
  { camel: 'mukim', col: 'mukim', type: 'direct' },
  { camel: 'pjaId', col: 'pja_id', type: 'direct' },
  { camel: 'kosProjek', col: 'kos_projek', type: 'number' },
  { camel: 'tarikhBuka', col: 'tarikh_buka', type: 'direct' },
  { camel: 'noFail', col: 'no_fail', type: 'direct' },
  { camel: 'noSebutharga', col: 'no_sebutharga', type: 'direct' },
  { camel: 'noInden', col: 'no_inden', type: 'direct' },
  { camel: 'noBpp', col: 'no_bpp', type: 'direct' },
  { camel: 'namaSyarikat', col: 'nama_syarikat', type: 'direct' },
  { camel: 'bulan', col: 'bulan', type: 'direct' },
  { camel: 'noVote', col: 'no_vote', type: 'direct' },
  { camel: 'tarikhLantikan', col: 'tarikh_lantikan', type: 'direct' },
  { camel: 'tarikhCetakanBpp', col: 'tarikh_cetakan_bpp', type: 'direct' },
  { camel: 'tempohKontrak', col: 'tempoh_kontrak', type: 'direct' },
  { camel: 'tarikhMulaKontrak', col: 'tarikh_mula_kontrak', type: 'direct' },
  { camel: 'tarikhTamatKontrak', col: 'tarikh_tamat_kontrak', type: 'direct' },
  { camel: 'tarikhSerahTapak', col: 'tarikh_serah_tapak', type: 'direct' },
  { camel: 'iso', col: 'iso', type: 'direct' },
  { camel: 'tarikhMulaKerja', col: 'tarikh_mula_kerja', type: 'direct' },
  { camel: 'isManualMulaKontrak', col: 'is_manual_mula_kontrak', type: 'bool' },
  { camel: 'isManualMulaKerja', col: 'is_manual_mula_kerja', type: 'bool' },
  { camel: 'tarikhPemeriksaan', col: 'tarikh_pemeriksaan', type: 'direct' },
  { camel: 'tarikhSiapSebenar', col: 'tarikh_siap_sebenar', type: 'direct' },
  { camel: 'prestasi', col: 'prestasi', type: 'direct' },
  { camel: 'tarikhTuntutanBayaran', col: 'tarikh_tuntutan_bayaran', type: 'direct' },
  { camel: 'kosSebenar', col: 'kos_sebenar', type: 'number' },
  { camel: 'bqPelarasanExtra', col: 'bq_pelarasan_extra', type: 'number' },
  { camel: 'ladAmount', col: 'lad_amount', type: 'number' },
  { camel: 'ladDays', col: 'lad_days', type: 'number' },
  { camel: 'locAmount', col: 'loc_amount', type: 'number' },
  { camel: 'locDays', col: 'loc_days', type: 'number' },
  { camel: 'isLocDeductionEnabled', col: 'is_loc_deduction_enabled', type: 'bool' },
  { camel: 'wangTahanan', col: 'wang_tahanan', type: 'number' },
  { camel: 'skop', col: 'skop', type: 'direct' },
  { camel: 'prestasiScores', col: 'prestasi_scores', type: 'jsonArray' },
  { camel: 'noInbois', col: 'no_inbois', type: 'direct' },
  { camel: 'tarikhHantarKewangan', col: 'tarikh_hantar_kewangan', type: 'direct' },
  { camel: 'tarikhPadanan', col: 'tarikh_padanan', type: 'direct' },
  { camel: 'peratusSiap', col: 'peratus_siap', type: 'direct' },
  { camel: 'status', col: 'status', type: 'direct' },
  { camel: 'akuJanjiMonth', col: 'aku_janji_month', type: 'direct' },
  { camel: 'akuJanjiPanelTitle', col: 'aku_janji_panel_title', type: 'direct' },
  { camel: 'akuJanjiFooterText', col: 'aku_janji_footer_text', type: 'direct' },
  { camel: 'coverJawatan', col: 'cover_jawatan', type: 'direct' },
  { camel: 'coverBahagian', col: 'cover_bahagian', type: 'direct' },
  { camel: 'coverUnit', col: 'cover_unit', type: 'direct' },
  { camel: 'coverSebutHargaText', col: 'cover_sebut_harga_text', type: 'direct' },
  { camel: 'notisPeringatan1Status', col: 'notis_peringatan_1_status', type: 'direct', default: 'PENDING' },
  { camel: 'perakuanKerjaTidakSiapStatus', col: 'perakuan_kerja_tidak_siap_status', type: 'direct', default: 'PENDING' },
  { camel: 'notisPeringatan2Status', col: 'notis_peringatan_2_status', type: 'direct', default: 'PENDING' },
  { camel: 'notisPeringatan3Status', col: 'notis_peringatan_3_status', type: 'direct', default: 'PENDING' },
  { camel: 'isTiadaNotisDiperlukan', col: 'is_tiada_notis_diperlukan', type: 'bool' },
  { camel: 'bqData', col: 'bq_data', type: 'jsonArrayOpt' },
  { camel: 'bqDataPelarasan', col: 'bq_data_pelarasan', type: 'jsonArrayOpt' },
  { camel: 'globalDimensions', col: 'global_dimensions', type: 'jsonObjectOpt' },
  { camel: 'locationDimensions', col: 'location_dimensions', type: 'jsonObjectOpt' },
  { camel: 'locationDimensionsPelarasan', col: 'location_dimensions_pelarasan', type: 'jsonObjectOpt' },
  { camel: 'globalCalculations', col: 'global_calculations', type: 'jsonObjectOpt' },
  { camel: 'globalCalculationsPelarasan', col: 'global_calculations_pelarasan', type: 'jsonObjectOpt' },
]

// Columns selected for list views (excludes the heavy JSON blobs).
const LIST_COLUMNS = [
  'id',
  ...PROJECT_FIELDS.filter(f => f.type !== 'jsonArrayOpt' && f.type !== 'jsonObjectOpt').map(f => f.col),
  'created_at',
  'updated_at',
]

export class ProjectRepository extends BaseRepository {
  private decodeField(f: ProjectField, row: any): any {
    switch (f.type) {
      case 'jsonArray': return this.parseJsonArray(row[f.col])
      case 'jsonArrayOpt': return row[f.col] ? this.parseJsonArray(row[f.col]) : undefined
      case 'jsonObjectOpt': return row[f.col] ? this.parseJsonObject(row[f.col]) : undefined
      case 'bool': return Boolean(row[f.col])
      default: return f.default ? (row[f.col] || f.default) : row[f.col]
    }
  }

  private encodeField(f: ProjectField, value: any, applyDefault: boolean): any {
    switch (f.type) {
      case 'number': return Number(value) || 0
      case 'bool': return value ? 1 : 0
      case 'jsonArray':
      case 'jsonArrayOpt':
      case 'jsonObjectOpt': return value ? JSON.stringify(value) : null
      default: return (applyDefault && f.default) ? (value || f.default) : value
    }
  }

  private mapProjectFromRow(row: any): any {
    const out: any = { id: row.id, apiVersion: 'v126' }
    for (const f of PROJECT_FIELDS) {
      out[f.camel] = this.decodeField(f, row)
    }
    out.updatedAt = row.updated_at
    return out
  }

  private mapProjectBodyToDbRecord(body: any, id: number): Record<string, any> {
    const rec: Record<string, any> = { id }
    for (const f of PROJECT_FIELDS) {
      rec[f.col] = this.encodeField(f, body[f.camel], true)
    }
    rec.updated_at = new Date().toISOString()
    return rec
  }

  private mapUpdatesToSnakeCase(body: any): Record<string, any> {
    const updates: Record<string, any> = {}
    for (const f of PROJECT_FIELDS) {
      if (body[f.camel] !== undefined) {
        updates[f.col] = this.encodeField(f, body[f.camel], false)
      }
    }
    return updates
  }

  public async getAll(): Promise<any[]> {
    const { results } = await this.db.prepare(
      `SELECT ${LIST_COLUMNS.join(', ')} FROM projects ORDER BY created_at DESC`
    ).all()
    return results.map(row => this.mapProjectFromRow(row))
  }

  public async getById(id: string): Promise<any | null> {
    const { results } = await this.db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).all()
    if (!results || results.length === 0) {
      return null
    }
    return this.mapProjectFromRow(results[0])
  }

  public async create(body: any): Promise<any> {
    const newId = Date.now()
    const dbRecord = this.mapProjectBodyToDbRecord(body, newId)
    const { keys, values, placeholders } = this.buildInsert(dbRecord)

    await this.db.prepare(`INSERT INTO projects (${keys.join(', ')}) VALUES (${placeholders})`)
      .bind(...values)
      .run()

    return this.mapProjectFromRow(dbRecord)
  }

  public async update(id: string, body: any): Promise<any | null> {
    const dbUpdates = this.mapUpdatesToSnakeCase(body)
    dbUpdates.updated_at = new Date().toISOString()

    const { keys, setClauses, values } = this.buildUpdate(dbUpdates)
    if (keys.length === 0) return null

    await this.db.prepare(`UPDATE projects SET ${setClauses} WHERE id = ?`)
      .bind(...values, id)
      .run()

    const { results } = await this.db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).all()
    if (!results || results.length === 0) return null
    return this.mapProjectFromRow(results[0])
  }

  public async delete(id: string): Promise<boolean> {
    await this.db.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
    return true;
  }
}
