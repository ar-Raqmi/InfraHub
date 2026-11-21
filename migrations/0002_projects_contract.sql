-- InfraHub v2: a project belongs to a contract and is priced from one rate book version.
ALTER TABLE projects ADD COLUMN contract_id TEXT;
ALTER TABLE projects ADD COLUMN rate_book_version_id TEXT;
CREATE INDEX IF NOT EXISTS idx_projects_contract ON projects (contract_id);
