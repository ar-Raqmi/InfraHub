import { BaseRepository } from './BaseRepository'

export class ProjectRepository extends BaseRepository {
  constructor(db: D1Database) {
    super(db);
  }

  public mapProjectFromRow(row: any): any {
    return {
      id: row.id,
      apiVersion: 'v126',
      namaProjek: row.nama_projek,
      noAduan: row.no_aduan,
      aduan: row.aduan,
      lokasi: row.lokasi,
      projectLocations: this.parseJsonArray(row.project_locations),
      bp: row.bp,
      zon: row.zon,
      mukim: row.mukim,
      pjaId: row.pja_id,
      kosProjek: row.kos_projek,
      tarikhBuka: row.tarikh_buka,
      noFail: row.no_fail,
      noSebutharga: row.no_sebutharga,
      noInden: row.no_inden,
      noBpp: row.no_bpp,
      namaSyarikat: row.nama_syarikat,
      bulan: row.bulan,
      noVote: row.no_vote,
      tarikhLantikan: row.tarikh_lantikan,
      tarikhCetakanBpp: row.tarikh_cetakan_bpp,
      tempohKontrak: row.tempoh_kontrak,
      tarikhMulaKontrak: row.tarikh_mula_kontrak,
      tarikhTamatKontrak: row.tarikh_tamat_kontrak,
      tarikhSerahTapak: row.tarikh_serah_tapak,
      iso: row.iso,
      tarikhMulaKerja: row.tarikh_mula_kerja,
      isManualMulaKontrak: Boolean(row.is_manual_mula_kontrak),
      isManualMulaKerja: Boolean(row.is_manual_mula_kerja),
      tarikhPemeriksaan: row.tarikh_pemeriksaan,
      tarikhSiapSebenar: row.tarikh_siap_sebenar,
      prestasi: row.prestasi,
      tarikhTuntutanBayaran: row.tarikh_tuntutan_bayaran,
      kosSebenar: row.kos_sebenar,
      bqPelarasanExtra: row.bq_pelarasan_extra,
      ladAmount: row.lad_amount,
      ladDays: row.lad_days,
      locAmount: row.loc_amount,
      locDays: row.loc_days,
      isLocDeductionEnabled: Boolean(row.is_loc_deduction_enabled),
      wangTahanan: row.wang_tahanan,
      skop: row.skop,
      prestasiScores: this.parseJsonArray(row.prestasi_scores),
      noInbois: row.no_inbois,
      tarikhHantarKewangan: row.tarikh_hantar_kewangan,
      tarikhPadanan: row.tarikh_padanan,
      peratusSiap: row.peratus_siap,
      status: row.status,
      akuJanjiMonth: row.aku_janji_month,
      akuJanjiPanelTitle: row.aku_janji_panel_title,
      akuJanjiFooterText: row.aku_janji_footer_text,
      coverJawatan: row.cover_jawatan,
      coverBahagian: row.cover_bahagian,
      coverUnit: row.cover_unit,
      coverSebutHargaText: row.cover_sebut_harga_text,
      notisPeringatan1Status: row.notis_peringatan_1_status || 'PENDING',
      perakuanKerjaTidakSiapStatus: row.perakuan_kerja_tidak_siap_status || 'PENDING',
      notisPeringatan2Status: row.notis_peringatan_2_status || 'PENDING',
      notisPeringatan3Status: row.notis_peringatan_3_status || 'PENDING',
      isTiadaNotisDiperlukan: Boolean(row.is_tiada_notis_diperlukan),
      updatedAt: row.updated_at,
      bqData: row.bq_data ? this.parseJsonArray(row.bq_data) : undefined,
      bqDataPelarasan: row.bq_data_pelarasan ? this.parseJsonArray(row.bq_data_pelarasan) : undefined,
      globalDimensions: row.global_dimensions ? this.parseJsonObject(row.global_dimensions) : undefined,
      locationDimensions: row.location_dimensions ? this.parseJsonObject(row.location_dimensions) : undefined,
      locationDimensionsPelarasan: row.location_dimensions_pelarasan ? this.parseJsonObject(row.location_dimensions_pelarasan) : undefined,
      globalCalculations: row.global_calculations ? this.parseJsonObject(row.global_calculations) : undefined,
      globalCalculationsPelarasan: row.global_calculations_pelarasan ? this.parseJsonObject(row.global_calculations_pelarasan) : undefined,
    };
  }

  private mapProjectBodyToDbRecord(body: any, id: number): Record<string, any> {
    return {
      id,
      nama_projek: body.namaProjek,
      no_aduan: body.noAduan,
      aduan: body.aduan,
      lokasi: body.lokasi,
      project_locations: body.projectLocations ? JSON.stringify(body.projectLocations) : null,
      bp: body.bp,
      zon: body.zon,
      mukim: body.mukim,
      pja_id: body.pjaId,
      kos_projek: Number(body.kosProjek) || 0,
      tarikh_buka: body.tarikhBuka,
      no_fail: body.noFail,
      no_sebutharga: body.noSebutharga,
      no_inden: body.noInden,
      no_bpp: body.noBpp,
      nama_syarikat: body.namaSyarikat,
      bulan: body.bulan,
      no_vote: body.noVote,
      tarikh_lantikan: body.tarikhLantikan,
      tarikh_cetakan_bpp: body.tarikhCetakanBpp,
      tempoh_kontrak: body.tempohKontrak,
      tarikh_mula_kontrak: body.tarikhMulaKontrak,
      tarikh_tamat_kontrak: body.tarikhTamatKontrak,
      tarikh_serah_tapak: body.tarikhSerahTapak,
      iso: body.iso,
      tarikh_mula_kerja: body.tarikhMulaKerja,
      is_manual_mula_kontrak: body.isManualMulaKontrak ? 1 : 0,
      is_manual_mula_kerja: body.isManualMulaKerja ? 1 : 0,
      tarikh_pemeriksaan: body.tarikhPemeriksaan,
      tarikh_siap_sebenar: body.tarikhSiapSebenar,
      prestasi: body.prestasi,
      tarikh_tuntutan_bayaran: body.tarikhTuntutanBayaran,
      kos_sebenar: Number(body.kosSebenar) || 0,
      bq_pelarasan_extra: Number(body.bqPelarasanExtra) || 0,
      lad_amount: Number(body.ladAmount) || 0,
      lad_days: Number(body.ladDays) || 0,
      loc_amount: Number(body.locAmount) || 0,
      loc_days: Number(body.locDays) || 0,
      is_loc_deduction_enabled: body.isLocDeductionEnabled ? 1 : 0,
      wang_tahanan: Number(body.wangTahanan) || 0,
      skop: body.skop,
      prestasi_scores: body.prestasiScores ? JSON.stringify(body.prestasiScores) : null,
      no_inbois: body.noInbois,
      tarikh_hantar_kewangan: body.tarikhHantarKewangan,
      tarikh_padanan: body.tarikhPadanan,
      peratus_siap: body.peratusSiap,
      status: body.status,
      bq_data: body.bqData ? JSON.stringify(body.bqData) : null,
      bq_data_pelarasan: body.bqDataPelarasan ? JSON.stringify(body.bqDataPelarasan) : null,
      global_dimensions: body.globalDimensions ? JSON.stringify(body.globalDimensions) : null,
      location_dimensions: body.locationDimensions ? JSON.stringify(body.locationDimensions) : null,
      location_dimensions_pelarasan: body.locationDimensionsPelarasan ? JSON.stringify(body.locationDimensionsPelarasan) : null,
      global_calculations: body.globalCalculations ? JSON.stringify(body.globalCalculations) : null,
      global_calculations_pelarasan: body.globalCalculationsPelarasan ? JSON.stringify(body.globalCalculationsPelarasan) : null,
      aku_janji_month: body.akuJanjiMonth,
      aku_janji_panel_title: body.akuJanjiPanelTitle,
      aku_janji_footer_text: body.akuJanjiFooterText,
      cover_jawatan: body.coverJawatan,
      cover_bahagian: body.coverBahagian,
      cover_unit: body.coverUnit,
      cover_sebut_harga_text: body.coverSebutHargaText,
      notis_peringatan_1_status: body.notisPeringatan1Status || 'PENDING',
      perakuan_kerja_tidak_siap_status: body.perakuanKerjaTidakSiapStatus || 'PENDING',
      notis_peringatan_2_status: body.notisPeringatan2Status || 'PENDING',
      notis_peringatan_3_status: body.notisPeringatan3Status || 'PENDING',
      is_tiada_notis_diperlukan: body.isTiadaNotisDiperlukan ? 1 : 0,
      updated_at: new Date().toISOString()
    };
  }

  private mapUpdatesToSnakeCase(body: any): Record<string, any> {
    const dbUpdates: Record<string, any> = {};

    if (body.namaProjek !== undefined) dbUpdates.nama_projek = body.namaProjek;
    if (body.noAduan !== undefined) dbUpdates.no_aduan = body.noAduan;
    if (body.aduan !== undefined) dbUpdates.aduan = body.aduan;
    if (body.lokasi !== undefined) dbUpdates.lokasi = body.lokasi;
    if (body.projectLocations !== undefined) dbUpdates.project_locations = body.projectLocations ? JSON.stringify(body.projectLocations) : null;
    if (body.bp !== undefined) dbUpdates.bp = body.bp;
    if (body.zon !== undefined) dbUpdates.zon = body.zon;
    if (body.mukim !== undefined) dbUpdates.mukim = body.mukim;
    if (body.pjaId !== undefined) dbUpdates.pja_id = body.pjaId;
    if (body.kosProjek !== undefined) dbUpdates.kos_projek = body.kosProjek;
    if (body.tarikhBuka !== undefined) dbUpdates.tarikh_buka = body.tarikhBuka;

    if (body.noFail !== undefined) dbUpdates.no_fail = body.noFail;
    if (body.noSebutharga !== undefined) dbUpdates.no_sebutharga = body.noSebutharga;
    if (body.noInden !== undefined) dbUpdates.no_inden = body.noInden;
    if (body.noBpp !== undefined) dbUpdates.no_bpp = body.noBpp;
    if (body.namaSyarikat !== undefined) dbUpdates.nama_syarikat = body.namaSyarikat;
    if (body.bulan !== undefined) dbUpdates.bulan = body.bulan;
    if (body.noVote !== undefined) dbUpdates.no_vote = body.noVote;
    if (body.tarikhLantikan !== undefined) dbUpdates.tarikh_lantikan = body.tarikhLantikan;
    if (body.tarikhCetakanBpp !== undefined) dbUpdates.tarikh_cetakan_bpp = body.tarikhCetakanBpp;
    if (body.tempohKontrak !== undefined) dbUpdates.tempoh_kontrak = body.tempohKontrak;
    if (body.tarikhMulaKontrak !== undefined) dbUpdates.tarikh_mula_kontrak = body.tarikhMulaKontrak;
    if (body.tarikhTamatKontrak !== undefined) dbUpdates.tarikh_tamat_kontrak = body.tarikhTamatKontrak;
    if (body.tarikhSerahTapak !== undefined) dbUpdates.tarikh_serah_tapak = body.tarikhSerahTapak;
    if (body.iso !== undefined) dbUpdates.iso = body.iso;
    if (body.tarikhMulaKerja !== undefined) dbUpdates.tarikh_mula_kerja = body.tarikhMulaKerja;
    if (body.isManualMulaKontrak !== undefined) dbUpdates.is_manual_mula_kontrak = body.isManualMulaKontrak ? 1 : 0;
    if (body.isManualMulaKerja !== undefined) dbUpdates.is_manual_mula_kerja = body.isManualMulaKerja ? 1 : 0;

    if (body.tarikhPemeriksaan !== undefined) dbUpdates.tarikh_pemeriksaan = body.tarikhPemeriksaan;
    if (body.tarikhSiapSebenar !== undefined) dbUpdates.tarikh_siap_sebenar = body.tarikhSiapSebenar;
    if (body.prestasi !== undefined) dbUpdates.prestasi = body.prestasi;
    if (body.tarikhTuntutanBayaran !== undefined) dbUpdates.tarikh_tuntutan_bayaran = body.tarikhTuntutanBayaran;
    if (body.kosSebenar !== undefined) dbUpdates.kos_sebenar = Number(body.kosSebenar) || 0;
    if (body.bqPelarasanExtra !== undefined) dbUpdates.bq_pelarasan_extra = Number(body.bqPelarasanExtra) || 0;
    if (body.ladAmount !== undefined) dbUpdates.lad_amount = Number(body.ladAmount) || 0;
    if (body.ladDays !== undefined) dbUpdates.lad_days = Number(body.ladDays) || 0;
    if (body.locAmount !== undefined) dbUpdates.loc_amount = Number(body.locAmount) || 0;
    if (body.locDays !== undefined) dbUpdates.loc_days = Number(body.locDays) || 0;
    if (body.isLocDeductionEnabled !== undefined) dbUpdates.is_loc_deduction_enabled = body.isLocDeductionEnabled ? 1 : 0;
    if (body.wangTahanan !== undefined) dbUpdates.wang_tahanan = Number(body.wangTahanan) || 0;

    if (body.skop !== undefined) dbUpdates.skop = body.skop;
    if (body.prestasiScores !== undefined) dbUpdates.prestasi_scores = body.prestasiScores ? JSON.stringify(body.prestasiScores) : null;
    if (body.noInbois !== undefined) dbUpdates.no_inbois = body.noInbois;

    if (body.tarikhHantarKewangan !== undefined) dbUpdates.tarikh_hantar_kewangan = body.tarikhHantarKewangan;
    if (body.tarikhPadanan !== undefined) dbUpdates.tarikh_padanan = body.tarikhPadanan;
    if (body.peratusSiap !== undefined) dbUpdates.peratus_siap = body.peratusSiap;
    if (body.status !== undefined) dbUpdates.status = body.status;

    if (body.bqData !== undefined) dbUpdates.bq_data = body.bqData ? JSON.stringify(body.bqData) : null;
    if (body.bqDataPelarasan !== undefined) dbUpdates.bq_data_pelarasan = body.bqDataPelarasan ? JSON.stringify(body.bqDataPelarasan) : null;
    if (body.globalDimensions !== undefined) dbUpdates.global_dimensions = body.globalDimensions ? JSON.stringify(body.globalDimensions) : null;
    if (body.locationDimensions !== undefined) dbUpdates.location_dimensions = body.locationDimensions ? JSON.stringify(body.locationDimensions) : null;
    if (body.locationDimensionsPelarasan !== undefined) dbUpdates.location_dimensions_pelarasan = body.locationDimensionsPelarasan ? JSON.stringify(body.locationDimensionsPelarasan) : null;
    if (body.globalCalculations !== undefined) dbUpdates.global_calculations = body.globalCalculations ? JSON.stringify(body.globalCalculations) : null;
    if (body.globalCalculationsPelarasan !== undefined) dbUpdates.global_calculations_pelarasan = body.globalCalculationsPelarasan ? JSON.stringify(body.globalCalculationsPelarasan) : null;

    if (body.akuJanjiMonth !== undefined) dbUpdates.aku_janji_month = body.akuJanjiMonth;
    if (body.akuJanjiPanelTitle !== undefined) dbUpdates.aku_janji_panel_title = body.akuJanjiPanelTitle;
    if (body.akuJanjiFooterText !== undefined) dbUpdates.aku_janji_footer_text = body.akuJanjiFooterText;

    if (body.coverJawatan !== undefined) dbUpdates.cover_jawatan = body.coverJawatan;
    if (body.coverBahagian !== undefined) dbUpdates.cover_bahagian = body.coverBahagian;
    if (body.coverUnit !== undefined) dbUpdates.cover_unit = body.coverUnit;
    if (body.coverSebutHargaText !== undefined) dbUpdates.cover_sebut_harga_text = body.coverSebutHargaText;
    if (body.notisPeringatan1Status !== undefined) dbUpdates.notis_peringatan_1_status = body.notisPeringatan1Status;
    if (body.perakuanKerjaTidakSiapStatus !== undefined) dbUpdates.perakuan_kerja_tidak_siap_status = body.perakuanKerjaTidakSiapStatus;
    if (body.notisPeringatan2Status !== undefined) dbUpdates.notis_peringatan_2_status = body.notisPeringatan2Status;
    if (body.notisPeringatan3Status !== undefined) dbUpdates.notis_peringatan_3_status = body.notisPeringatan3Status;
    if (body.isTiadaNotisDiperlukan !== undefined) dbUpdates.is_tiada_notis_diperlukan = body.isTiadaNotisDiperlukan ? 1 : 0;

    return dbUpdates;
  }

  public async getAll(): Promise<any[]> {
    const { results } = await this.db.prepare(`
      SELECT 
        id, nama_projek, no_aduan, aduan, lokasi, project_locations, bp, zon, mukim, pja_id, kos_projek, 
        tarikh_buka, no_fail, no_sebutharga, no_inden, no_bpp, nama_syarikat, bulan, no_vote, 
        tarikh_lantikan, tarikh_cetakan_bpp, tempoh_kontrak, tarikh_mula_kontrak, tarikh_tamat_kontrak, 
        tarikh_serah_tapak, iso, tarikh_mula_kerja, is_manual_mula_kontrak, is_manual_mula_kerja, 
        tarikh_pemeriksaan, tarikh_siap_sebenar, prestasi, tarikh_tuntutan_bayaran, kos_sebenar, bq_pelarasan_extra,
        lad_amount, lad_days, loc_amount, loc_days, is_loc_deduction_enabled, wang_tahanan, skop, 
        prestasi_scores, no_inbois, tarikh_hantar_kewangan, tarikh_padanan, peratus_siap, status, 
        aku_janji_month, aku_janji_panel_title, aku_janji_footer_text, cover_jawatan, cover_bahagian, 
        cover_unit, cover_sebut_harga_text, notis_peringatan_1_status, perakuan_kerja_tidak_siap_status,
        notis_peringatan_2_status, notis_peringatan_3_status, is_tiada_notis_diperlukan, created_at, updated_at 
      FROM projects 
      ORDER BY created_at DESC
    `).all();
    return results.map(row => this.mapProjectFromRow(row));
  }

  public async getById(id: string): Promise<any | null> {
    const { results } = await this.db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).all();
    if (!results || results.length === 0) {
      return null;
    }
    const mapped = this.mapProjectFromRow(results[0]);
    return mapped;
  }

  public async create(body: any): Promise<any> {
    const newId = Date.now();
    const dbRecord = this.mapProjectBodyToDbRecord(body, newId);
    const { keys, values, placeholders } = this.buildInsert(dbRecord);

    await this.db.prepare(`INSERT INTO projects (${keys.join(', ')}) VALUES (${placeholders})`)
      .bind(...values)
      .run();

    return this.mapProjectFromRow(dbRecord);
  }

  public async update(id: string, body: any): Promise<any | null> {
    const dbUpdates = this.mapUpdatesToSnakeCase(body);
    dbUpdates.updated_at = new Date().toISOString();

    const { keys, setClauses, values } = this.buildUpdate(dbUpdates);
    if (keys.length === 0) return null;

    await this.db.prepare(`UPDATE projects SET ${setClauses} WHERE id = ?`)
      .bind(...values, id)
      .run();

    const { results } = await this.db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).all();
    if (!results || results.length === 0) return null;
    return this.mapProjectFromRow(results[0]);
  }

  public async delete(id: string): Promise<boolean> {
    await this.db.prepare('DELETE FROM projects WHERE id = ?').bind(id).run();
    return true;
  }
}
