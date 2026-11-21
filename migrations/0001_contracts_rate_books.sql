-- InfraHub v2: contracts (sebutharga), versioned rate books, change log, organisation config.
-- The legacy tables (library_groups, system_settings) stay untouched; v2 code reads these tables.

CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('PANEL', 'STANDALONE')),
  status TEXT NOT NULL CHECK (status IN ('DRAF', 'AKTIF', 'DITUTUP')),
  valid_from TEXT,
  valid_to TEXT,
  company_cap REAL,
  meeting_number TEXT,
  meeting_date TEXT,
  notes TEXT,
  cloned_from TEXT,
  created_at TEXT,
  created_by INTEGER,
  activated_at TEXT,
  closed_at TEXT
);

CREATE TABLE IF NOT EXISTS companies (
  name TEXT PRIMARY KEY,
  details TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS contract_companies (
  contract_id TEXT NOT NULL,
  company_name TEXT NOT NULL,
  sort_index INTEGER,
  cap REAL,
  PRIMARY KEY (contract_id, company_name)
);

CREATE TABLE IF NOT EXISTS rate_book_versions (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL,
  version_no INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DRAF', 'TERBIT')),
  message TEXT,
  source TEXT CHECK (source IN ('LEGACY', 'IMPORT', 'CLONE', 'EDIT')),
  source_file TEXT,
  rate_column TEXT,
  stats TEXT,
  created_at TEXT,
  created_by INTEGER,
  published_at TEXT,
  published_by INTEGER,
  UNIQUE (contract_id, version_no)
);

CREATE TABLE IF NOT EXISTS rate_book_groups (
  version_id TEXT NOT NULL,
  id TEXT NOT NULL,
  title TEXT,
  category TEXT,
  items TEXT,
  sort_index INTEGER,
  code TEXT, -- heading number in the master BQ (additive to CONTRACT §3)
  bill TEXT, -- bill number in the master BQ (additive to CONTRACT §3)
  PRIMARY KEY (version_id, id)
);

CREATE TABLE IF NOT EXISTS rate_book_matches (
  version_id TEXT NOT NULL,
  new_ref TEXT NOT NULL,
  old_group_id TEXT,
  old_item_id TEXT,
  old_variant_id TEXT,
  method TEXT,
  score REAL,
  decision TEXT,
  PRIMARY KEY (version_id, new_ref)
);

CREATE TABLE IF NOT EXISTS change_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  at TEXT NOT NULL,
  user_id INTEGER,
  user_name TEXT,
  entity TEXT NOT NULL,
  entity_id TEXT,
  action TEXT NOT NULL,
  message TEXT,
  diff TEXT
);

CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT,
  updated_by INTEGER
);

CREATE TABLE IF NOT EXISTS lookup_values (
  list TEXT NOT NULL,
  code TEXT NOT NULL,
  label TEXT,
  sort_index INTEGER,
  active INTEGER DEFAULT 1,
  PRIMARY KEY (list, code)
);

CREATE TABLE IF NOT EXISTS policy_rules (
  key TEXT NOT NULL,
  effective_from TEXT NOT NULL,
  value TEXT,
  note TEXT,
  created_at TEXT,
  created_by INTEGER,
  PRIMARY KEY (key, effective_from)
);

CREATE INDEX IF NOT EXISTS idx_rbv_contract ON rate_book_versions (contract_id, status, version_no);
CREATE INDEX IF NOT EXISTS idx_change_log_entity ON change_log (entity, entity_id, id);
