// Organisation defaults = exactly what the documents printed before v2 (org-defaults.json), plus the labels
// Tetapan Organisasi shows for each editable value. The JSON is also read by the seed script and the SQL
// for migration 0003, so there is one source for "today's values".
import { DEFAULT_POLICY_RULES, POLICY_KEYS, type PolicyRule } from '../../domain/policy';
import defaults from './org-defaults.json';

export interface OrgProfile {
  name: string;
  short: string;
  government: string;
  department: string;
  procurementUnit: string;
  addressLines: string[];
  phone: string;
  email: string;
  website: string;
  slogans: string[];
  /** Print logo + name + address at the top of letters (off = pre-printed letterhead paper, as today). */
  printLetterhead: boolean;
}

export interface OrgLogo {
  src: string;
  fileName?: string;
}

export type DocTexts = Record<string, string>;

export const CONFIG_KEYS = { profile: 'org.profile', logo: 'org.logo' } as const;

export const DEFAULT_PROFILE: OrgProfile = defaults.config['org.profile'];
export const DEFAULT_LOGO: OrgLogo = defaults.config['org.logo'];

export const EXTRA_POLICY_KEYS = { dlpMonths: 'DLP_MONTHS', tempohDefaultWeeks: 'TEMPOH_KONTRAK_DEFAULT_WEEKS' } as const;

/** Every rule the app knows, with today's values: the server's rules win key by key. */
export const ALL_DEFAULT_POLICY_RULES: PolicyRule[] = [...DEFAULT_POLICY_RULES, ...(defaults.policies as PolicyRule[])];

export interface DocTextField {
  id: string;
  label: string;
  multiline?: boolean;
}

export interface DocTextGroup {
  /** app_config key holding this document's texts. */
  key: string;
  title: string;
  description: string;
  placeholders: string[];
  fields: DocTextField[];
}

const ORG_SLOTS = ['nama_organisasi', 'NAMA_ORGANISASI', 'nama_ringkas', 'kerajaan', 'jabatan', 'JABATAN', 'telefon', 'unit_perolehan',
  'nama_syarikat', 'no_sebutharga', 'no_fail', 'nama_projek'];

const f = (id: string, label: string, multiline = false): DocTextField => ({ id, label, multiline });

export const DOC_TEXT_GROUPS: DocTextGroup[] = [
  {
    key: 'doc.cpc', title: 'Perakuan Siap Kerja (CPC)', description: 'Sijil CPC dan pratontonnya.',
    placeholders: [...ORG_SLOTS, 'gred', 'tarikh_siap', 'tarikh_mula_dlp', 'tarikh_tamat_dlp'],
    fields: [f('heading1', 'Kepala 1'), f('heading2', 'Kepala 2'), f('title', 'Tajuk'), f('subtitle', 'Sub-tajuk'),
      f('cidb', 'Baris CIDB'), f('sebuthargaLabel', 'Label sebutharga'), f('body', 'Perenggan perakuan', true),
      f('signLeft', 'Tandatangan kiri'), f('signLeftRole', 'Peranan kiri'), f('signRight', 'Tandatangan kanan'), f('signRightRole', 'Peranan kanan')],
  },
  {
    key: 'doc.aku_janji', title: 'Aku Janji', description: 'Surat aku janji kontraktor.',
    placeholders: [...ORG_SLOTS, 'tarikh_serah_tapak'],
    fields: [f('recipient', 'Penerima (satu baris setiap talian)', true), f('title', 'Tajuk'), f('para1', 'Perenggan 1', true),
      f('para2', 'Perenggan 2', true), f('closing', 'Penutup'), f('signLeft', 'Tandatangan kiri'), f('signRight', 'Tandatangan kanan')],
  },
  {
    key: 'doc.notis_umum', title: 'Notis: bahagian bersama', description: 'Dipakai oleh semua notis dan peringatan.',
    placeholders: [...ORG_SLOTS, 'tahun', 'pja'],
    fields: [f('salutation', 'Panggilan'), f('reference', 'Perenggan rujukan'), f('item1', 'Perkara i)'), f('item2', 'Perkara ii)'),
      f('closing', 'Penutup peringatan'), f('signOff', 'Ayat tandatangan'), f('signerRole', 'Jawatan lalai penandatangan'), f('footer', 'Kaki surat')],
  },
  {
    key: 'doc.notis_pemberitahuan', title: 'Notis Pemberitahuan (awam)', description: 'Notis kepada penduduk sebelum kerja bermula.',
    placeholders: [...ORG_SLOTS, 'tarikh_mula', 'tarikh_tamat'],
    fields: [f('title', 'Tajuk'), f('para1', 'Perenggan 1', true), f('para2', 'Perenggan 2', true), f('para3', 'Perenggan 3', true), f('closing', 'Penutup')],
  },
  ...([['1', 'Pertama'], ['2', 'Kedua'], ['3', 'Ketiga']] as const).map(([n, word]): DocTextGroup => ({
    key: `doc.notis_peringatan_${n}`, title: `Notis Peringatan ${word}`, description: `Surat peringatan ${n} kepada kontraktor.`,
    placeholders: [...ORG_SLOTS, 'tarikh_sst', 'tarikh_mula', 'tarikh_tamat', 'kadar_lad'],
    fields: [f('title', 'Tajuk'), f('para2', 'Perenggan 2', true), f('dateRange', 'Julat tarikh'), f('para3', 'Perenggan 3', true), f('para4', 'Perenggan 4', true)],
  })),
  {
    key: 'doc.kerja_tidak_siap', title: 'Perakuan Kerja Tidak Siap', description: 'Sijil CNC dwibahasa.',
    placeholders: [...ORG_SLOTS, 'gred', 'tarikh_siap_kontrak', 'kadar_lad'],
    fields: [f('heading1', 'Kepala 1'), f('heading2', 'Kepala 2'), f('heading3', 'Kepala 3'), f('title', 'Tajuk'), f('subtitle', 'Sub-tajuk'),
      f('cidb', 'Baris CIDB'), f('para1', 'Perenggan 1 (BM)', true), f('para1En', 'Perenggan 1 (EN)', true), f('para2', 'Perenggan 2 (BM)', true),
      f('para2En', 'Perenggan 2 (EN)', true), f('signTitle', 'Gelaran penandatangan'), f('signTitleEn', 'Gelaran (EN)'), f('footnote', 'Nota kaki'), f('footnoteEn', 'Nota kaki (EN)')],
  },
  {
    key: 'doc.lad', title: 'Perakuan LAD', description: 'Pengiraan denda kelewatan menyiapkan kerja.',
    placeholders: [...ORG_SLOTS, 'had_lad', 'kadar_lad_rata', 'blr'],
    fields: [f('title', 'Tajuk'), f('noteSmall', 'Nota kontrak kecil', true), f('noteBlr', 'Nota BLR'), f('flatLine', 'Baris kadar rata')],
  },
  {
    key: 'doc.loc', title: 'Perakuan LoC', description: 'Pengiraan denda lewat tuntutan.',
    placeholders: [...ORG_SLOTS, 'hari_tangguh', 'hari_mula_denda', 'kadar_loc'],
    fields: [f('title', 'Tajuk'), f('heading', 'Tajuk pengiraan'), f('rule1', 'Peraturan 1', true), f('rule2', 'Peraturan 2', true), f('rule3', 'Peraturan 3', true)],
  },
  {
    key: 'doc.prestasi', title: 'Borang Prestasi', description: 'Borang penilaian prestasi kontraktor.',
    placeholders: [...ORG_SLOTS],
    fields: [f('title', 'Tajuk'), ...[1, 2, 3, 4, 5, 6].map((i) => f(`criterion${i}`, `Kriteria ${i}`, true)),
      f('sign1', 'Pengesahan 1'), f('sign2', 'Pengesahan 2'), f('sign3', 'Pengesahan 3'), f('footer', 'Kaki borang', true)],
  },
];

const configDefaults = defaults.config as Record<string, unknown>;

export const defaultDocTexts = (key: string): DocTexts => (configDefaults[key] as DocTexts | undefined) ?? {};

export const PLACEHOLDER_HELP: Record<string, string> = {
  nama_organisasi: 'Nama penuh organisasi', NAMA_ORGANISASI: 'Nama penuh, huruf besar', nama_ringkas: 'Nama ringkas (cth. MPS)',
  kerajaan: 'Baris kerajaan', jabatan: 'Nama jabatan', JABATAN: 'Nama jabatan, huruf besar', telefon: 'Telefon organisasi',
  unit_perolehan: 'Unit perolehan', gred: 'Gred CIDB syarikat', tarikh_siap: 'Tarikh siap sebenar',
  tarikh_mula_dlp: 'Tarikh mula tempoh kecacatan', tarikh_tamat_dlp: 'Tarikh tamat tempoh kecacatan', tarikh_serah_tapak: 'Tarikh serah tapak',
  tahun: 'Tahun surat', pja: 'Nama pengguna PJA', tarikh_mula: 'Tarikh mula', tarikh_tamat: 'Tarikh tamat', tarikh_sst: 'Tarikh SST',
  kadar_lad: 'Kadar LAD sehari (RM)', tarikh_siap_kontrak: 'Tarikh tamat kontrak', had_lad: 'Had kontrak kecil (RM)',
  kadar_lad_rata: 'Kadar LAD rata (RM)', blr: 'BLR (%)', hari_tangguh: 'Hari tangguh LoC', hari_mula_denda: 'Hari denda bermula',
  kadar_loc: 'Kadar LoC sehari (RM)', nama_syarikat: 'Nama syarikat projek', no_sebutharga: 'No. sebutharga projek',
  no_fail: 'No. fail projek', nama_projek: 'Tajuk projek, huruf besar',
};

export interface PolicyMeta {
  key: string;
  label: string;
  unit: string;
  help: string;
  group: 'LAD' | 'LoC' | 'Notis' | 'Kontrak';
}

export const POLICY_META: PolicyMeta[] = [
  { key: POLICY_KEYS.ladBlrPct, label: 'BLR', unit: '%', help: 'Kadar pinjaman asas daripada Bahagian Perolehan.', group: 'LAD' },
  { key: POLICY_KEYS.ladTreasuryPct, label: 'Potongan perbendaharaan', unit: '%', help: 'Ditolak daripada BLR untuk kadar LAD tahunan.', group: 'LAD' },
  { key: POLICY_KEYS.ladSmallThreshold, label: 'Had kontrak kecil', unit: 'RM', help: 'Kontrak di bawah nilai ini guna kadar harian rata.', group: 'LAD' },
  { key: POLICY_KEYS.ladSmallDailyRate, label: 'Kadar LAD rata', unit: 'RM/hari', help: 'Kadar harian untuk kontrak kecil.', group: 'LAD' },
  { key: POLICY_KEYS.locDailyRate, label: 'Kadar LoC', unit: 'RM/hari', help: 'Denda lewat tuntutan sehari.', group: 'LoC' },
  { key: POLICY_KEYS.locGraceDays, label: 'Hari tangguh LoC', unit: 'hari', help: 'Hari selepas siap sebelum denda LoC bermula.', group: 'LoC' },
  { key: POLICY_KEYS.notice1Days, label: 'Peringatan 1', unit: 'hari', help: 'Tarikh lalai surat, relatif kepada tamat kontrak (negatif = sebelum).', group: 'Notis' },
  { key: POLICY_KEYS.notice2Days, label: 'Peringatan 2', unit: 'hari', help: 'Tarikh lalai surat, relatif kepada tamat kontrak.', group: 'Notis' },
  { key: POLICY_KEYS.notice3Days, label: 'Peringatan 3', unit: 'hari', help: 'Tarikh lalai surat, relatif kepada tamat kontrak.', group: 'Notis' },
  { key: EXTRA_POLICY_KEYS.dlpMonths, label: 'Tempoh tanggungan kecacatan', unit: 'bulan', help: 'Panjang DLP yang dicetak pada CPC.', group: 'Kontrak' },
  { key: EXTRA_POLICY_KEYS.tempohDefaultWeeks, label: 'Tempoh kontrak lalai', unit: 'minggu', help: 'Diisi untuk projek baharu (0 = biar kosong).', group: 'Kontrak' },
  { key: POLICY_KEYS.companyCap, label: 'Had nilai kerja syarikat', unit: 'RM', help: 'Amaran sahaja, tidak disekat.', group: 'Kontrak' },
];

export const LOOKUP_LISTS: { code: string; tab: string; title: string; help: string }[] = [
  { code: 'BP', tab: 'BP', title: 'Bahagian Pilihan Raya (BP)', help: 'Pilihan BP pada borang projek dan penapis senarai.' },
  { code: 'ZON', tab: 'Zon', title: 'Zon', help: 'Zon ahli majlis.' },
  { code: 'MUKIM', tab: 'Mukim', title: 'Mukim', help: 'Mukim lokasi kerja.' },
  { code: 'UNIT', tab: 'Unit', title: 'Unit / bahagian jabatan', help: 'Unit organisasi untuk penandatangan dan laporan.' },
];
