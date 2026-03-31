DROP TABLE IF EXISTS app_users;
CREATE TABLE app_users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL,
  password TEXT,
  email TEXT,
  phone TEXT,
  jawatan TEXT,
  bahagian TEXT,
  unit TEXT,
  department TEXT,
  avatar_url TEXT
);

DROP TABLE IF EXISTS bulletins;
CREATE TABLE bulletins (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  date TEXT NOT NULL,
  author TEXT NOT NULL,
  read_by TEXT DEFAULT '[]',
  reactions TEXT DEFAULT '{}'
);

DROP TABLE IF EXISTS library_groups;
CREATE TABLE library_groups (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  items TEXT DEFAULT '[]'
);

DROP TABLE IF EXISTS templates;
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  icon TEXT,
  color TEXT,
  bills TEXT DEFAULT '[]',
  group_refs TEXT DEFAULT '[]',
  order_index INTEGER DEFAULT 0
);

DROP TABLE IF EXISTS projects;
CREATE TABLE projects (
  id INTEGER PRIMARY KEY,
  nama_projek TEXT NOT NULL,
  no_aduan TEXT,
  aduan TEXT,
  lokasi TEXT,
  project_locations TEXT,
  bp TEXT NOT NULL,
  zon TEXT,
  mukim TEXT,
  pja_id INTEGER,
  kos_projek REAL DEFAULT 0,
  tarikh_buka TEXT,
  no_fail TEXT,
  no_sebutharga TEXT,
  no_inden TEXT,
  no_bpp TEXT,
  nama_syarikat TEXT,
  bulan TEXT,
  no_vote TEXT,
  tarikh_lantikan TEXT,
  tarikh_cetakan_bpp TEXT,
  tempoh_kontrak TEXT,
  tarikh_mula_kontrak TEXT,
  tarikh_tamat_kontrak TEXT,
  tarikh_serah_tapak TEXT,
  iso TEXT,
  tarikh_mula_kerja TEXT,
  is_manual_mula_kontrak INTEGER DEFAULT 0,
  is_manual_mula_kerja INTEGER DEFAULT 0,
  tarikh_pemeriksaan TEXT,
  tarikh_siap_sebenar TEXT,
  prestasi TEXT,
  tarikh_tuntutan_bayaran TEXT,
  kos_sebenar REAL,
  bq_pelarasan_extra REAL,
  lad_amount REAL,
  lad_days INTEGER,
  loc_amount REAL,
  loc_days INTEGER,
  is_loc_deduction_enabled INTEGER DEFAULT 0,
  wang_tahanan REAL,
  skop TEXT,
  prestasi_scores TEXT,
  no_inbois TEXT,
  tarikh_hantar_kewangan TEXT,
  tarikh_padanan TEXT,
  peratus_siap REAL,
  status TEXT NOT NULL,
  bq_data TEXT,
  bq_data_pelarasan TEXT,
  global_dimensions TEXT,
  location_dimensions TEXT,
  location_dimensions_pelarasan TEXT,
  global_calculations TEXT,
  global_calculations_pelarasan TEXT,
  aku_janji_month TEXT,
  aku_janji_panel_title TEXT,
  aku_janji_footer_text TEXT,
  cover_jawatan TEXT,
  cover_bahagian TEXT,
  cover_unit TEXT,
  cover_sebut_harga_text TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

DROP TABLE IF EXISTS system_settings;
CREATE TABLE system_settings (
  year INTEGER PRIMARY KEY,
  companies TEXT DEFAULT '[]',
  company_order TEXT DEFAULT '[]',
  company_details TEXT DEFAULT '{}',
  vote_numbers TEXT DEFAULT '[]',
  sebutharga_numbers TEXT DEFAULT '[]',
  manual_financials TEXT DEFAULT '{"outsource":0,"ydp":0}',
  meeting_date TEXT,
  meeting_number TEXT
);

DROP TABLE IF EXISTS temporary_gallery;
CREATE TABLE temporary_gallery (
  id TEXT PRIMARY KEY,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER NOT NULL,
  user_full_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  project_id INTEGER,
  location_tag TEXT
);
