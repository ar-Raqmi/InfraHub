# InfraHub v2 overhaul: build contract

Branch `overhaul/v2` (from `overhaul/discovery-2026-11`). This file is the single source of truth for every
builder. Read it fully before touching code. Owner: ar-Raqmi. Lead: Yiyi. Builders: sub-Yiyis.

## 0. What we are building and why
The discovery report (`docs/overhaul/InfraHub-Overhaul-Discovery-Report.pdf`, `docs/overhaul/findings/`) showed:
- the Pustaka (master BQ) is one global, year-less, contract-less price list. Saving it deletes and re-inserts
  everything, so there is no history;
- settings are bound to the calendar year, so a second sebutharga in the same year ("sub-2026") cannot exist;
- prices, policy constants and printed texts are hard-coded.

### Owner decisions (settled; do not re-propose)
1. **The sebutharga decides the prices.** Every company on a sebutharga's panel uses that sebutharga's kadar.
   A *standalone* sebutharga exists too: its own rates, a small panel, often one project.
2. **No year-binding.** A sebutharga (contract) lives independently of the calendar year and can start any day.
   The financial year only owns votes and allocations.
3. **A new project defaults to the AKTIF sebutharga.** A PJA may swap it or pick another. **Any officer** may
   create a sebutharga by uploading its master BQ Excel; this is not limited to PT/Admin.
4. **History like git commits.** Every upload, publish, activation and swap is logged with who, when and a diff,
   and old versions stay viewable. Draf projects whose items vanished or changed get an **indicator**, never a
   silent rewrite.
5. **Re-price, don't rebuild.** Moving a draf project to a new sebutharga maps old items to new ones, with a
   preview of old vs new rate per row.
6. **Excel import, hybrid.** A script reads every rate and unit from the cell (never an AI). AI or fuzzy
   matching only *suggests* "this reworded line = that old item", and a human approves before publishing.
7. **No hard-coding.** Organisation profile (name, logo, letterhead), lookup lists (BP/Zon/Mukim…), policy
   rules (LAD, LoC, notice timings) with effective dates, and printed texts are all editable in Tetapan, so
   another PBT can adopt the system and it survives without its author.
8. **Design = Direction C "Tapak" (field-first), LIGHT MODE ONLY.** No dark mode anywhere.

### Defaults the lead chose for still-open questions (configurable, listed in the final report)
- Contractor % vs Jabatan rate: on import the officer **picks which rate column is the kadar kontrak**. The
  default is the column whose header contains "KONTRAKTOR", and the value is copied as written, never
  recomputed.
- RM 200k company cap: stored **per contract** (`contracts.company_cap`, overridable per panel company) and
  only warned about, not enforced (as today).
- Swap lock: a project's contract **locks once `no_inden` is set**. Unlocking is an explicit, logged action.

## 1. Safety rules (non-negotiable)
- **Production D1 `infrahub-db` and R2 `infrahub-bucket` are off-limits.** Never use `--remote` against them.
  Your worktree's `wrangler.toml` points at a FAKE database id on purpose: leave it alone.
- Local data: import the anonymised dev seed
  `~/Documents/InfraHub-backups/dev-seed/dev-seed-anon.sql` into your own `--persist-to` state dir. Login:
  `admin01` / `jurutera01` / `pja01` (the password is in `~/Documents/InfraHub-backups/dev-seed/CREDS.txt`).
  Read it inside scripts only and never print it. Never import the raw backup.
- No git commands, no deploys, no `npm install` of packages other than those named in this contract.
- Do not write about, or change, authentication or security. It is out of scope by the owner's instruction.
- Do not edit files outside your ownership row (§9). Requests go to `docs/overhaul/v2/NEEDS-lead.md`.

## 2. Stack (kept)
React 19 + Vite multi-page app (`*.html` + `entries/*.tsx` + `pages/` + `components/`), Tailwind via the
runtime `public/tailwind.js` + `public/tw-config.js`, react-query, Cloudflare Pages Functions with Hono
(`functions/api`), D1, R2. New:
- `domain/`: framework-free TypeScript business logic, unit-tested with **vitest**;
- `migrations/`: numbered SQL, applied with `wrangler d1 migrations apply infrahub-db --local --persist-to …`
  (set `migrations_dir = "migrations"` in wrangler.toml);
- SheetJS CE for reading .xls/.xlsx in the browser (install from the official SheetJS CDN tarball, verified live).
Build gate: `npm run build` must pass, and `npx tsc --noEmit` must not add errors over the base count of **3**.
Tests: `npx vitest run`.

## 3. Data model v2 (migration 0001 + 0002)
```sql
contracts(id TEXT PK, code TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('PANEL','STANDALONE')),
  status TEXT NOT NULL CHECK(status IN ('DRAF','AKTIF','DITUTUP')),
  valid_from TEXT, valid_to TEXT, company_cap REAL, meeting_number TEXT, meeting_date TEXT, notes TEXT,
  cloned_from TEXT, created_at TEXT, created_by INTEGER, activated_at TEXT, closed_at TEXT)
companies(name TEXT PK, details TEXT /*JSON CompanyDetail*/, updated_at TEXT)
contract_companies(contract_id TEXT, company_name TEXT, sort_index INTEGER, cap REAL,
  PRIMARY KEY(contract_id, company_name))
rate_book_versions(id TEXT PK, contract_id TEXT NOT NULL, version_no INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('DRAF','TERBIT')), message TEXT,
  source TEXT CHECK(source IN ('LEGACY','IMPORT','CLONE','EDIT')), source_file TEXT, rate_column TEXT,
  stats TEXT /*JSON*/, created_at TEXT, created_by INTEGER, published_at TEXT, published_by INTEGER,
  UNIQUE(contract_id, version_no))
rate_book_groups(version_id TEXT, id TEXT, title TEXT, category TEXT, items TEXT /*JSON PresetItem[]*/,
  sort_index INTEGER, PRIMARY KEY(version_id, id))
rate_book_matches(version_id TEXT, new_ref TEXT, old_group_id TEXT, old_item_id TEXT, old_variant_id TEXT,
  method TEXT /*EXACT|CODE|FUZZY|AI|MANUAL|NEW*/, score REAL, decision TEXT /*PENDING|ACCEPT|REJECT*/,
  PRIMARY KEY(version_id, new_ref))
change_log(id INTEGER PK AUTOINCREMENT, at TEXT NOT NULL, user_id INTEGER, user_name TEXT,
  entity TEXT NOT NULL /*contract|rate_book|project|config|policy|lookup*/, entity_id TEXT, action TEXT NOT NULL,
  message TEXT, diff TEXT /*JSON*/)
app_config(key TEXT PK, value TEXT /*JSON*/, updated_at TEXT, updated_by INTEGER)
lookup_values(list TEXT, code TEXT, label TEXT, sort_index INTEGER, active INTEGER DEFAULT 1,
  PRIMARY KEY(list, code))
policy_rules(key TEXT, effective_from TEXT, value TEXT /*JSON*/, note TEXT, created_at TEXT, created_by INTEGER,
  PRIMARY KEY(key, effective_from))
ALTER TABLE projects ADD contract_id TEXT; ADD rate_book_version_id TEXT;
```
- **Item ids are stable across versions.** When an import matches a new row to an old item, the new row keeps
  the old `group/item/variant` ids, so existing `bq_data.sourceItemId` keeps resolving. Unmatched rows get new ids.
  `PresetItem`/`PresetVariant` gain an optional `code` (the official item number, e.g. `2.1` / `2.1(ii)`).
- A contract's **current book** = its highest TERBIT version. DRAF versions are imports under review.
- Old tables (`library_groups`, `system_settings`) stay untouched and readable. v2 code reads the new tables.

### Legacy migration (idempotent; `POST /api/v2/admin/migrate-legacy`, also run by the e2e setup)
- One contract per distinct sebutharga (from `projects.no_sebutharga` plus every `system_settings.sebutharga_numbers`).
  The one with the most projects becomes AKTIF; the others become DITUTUP.
- The AKTIF contract's panel comes from that year's `companies`.
- `companies` = the union of every year's `company_details` (latest year wins).
- Every contract gets version 1, `source=LEGACY`, copied from today's `library_groups`. For the closed ones the
  message says "salinan Pustaka semasa; kadar asal tidak direkodkan".
- Projects: `contract_id` comes from `no_sebutharga`; blank values go to the AKTIF contract; `rate_book_version_id`
  = that contract's version 1.
- Seed `lookup_values` (BP, ZON, MUKIM from `types.ts` constants) and `policy_rules` (current LAD/LoC/notice
  constants, effective `2020-01-01`).
- Write one `change_log` entry. Running it twice changes nothing (test this).

## 4. Domain layer (`domain/`, pure TS, each with `*.test.ts`)
| Module | Exports | Notes |
|---|---|---|
| `rateBook/parseMasterBq.ts` | `parseMasterBq(sheets: SheetRows[], opts): ParsedBook` | Handles BIL bills, `1.0` groups / `1.1` items, descriptions wrapped over many rows, variants `i)`, `a)`, `ii.`, a rate on the first description line or on a variant line, several rate columns (header text kept), and the sheet title row. Emits `warnings[]` with the sheet and row number. |
| `rateBook/toPresetGroups.ts` | `toPresetGroups(book, rateColumn): PresetGroup[]` | Sets `code` and keeps the bill/category. |
| `rateBook/matchItems.ts` | `matchBooks(next, prev): MatchResult` | Matches on code + parent context + variant + unit first, then normalised-text similarity. Returns score and method, and leaves ambiguous pairs PENDING. |
| `rateBook/diffBooks.ts` | `diffBooks(a, b): BookDiff` | unchanged / rateChanged / wordingChanged / added / removed, with rows. |
| `rateBook/rowStatus.ts` | `rowStatus(bqItem, book): 'OK'\|'KADAR_BERUBAH'\|'PERKATAAN_BERUBAH'\|'TIADA'` | Drives the indicator. |
| `reprice.ts` | `planReprice(bq, toBook, matches?): RepricePlan`, `applyReprice(bq, plan): BQGroup[]` | Keeps quantities, swaps description/unit/rate/ids, and lists MISSING rows. |
| `money.ts` | `ladAmount`, `locAmount`, `kosSebenar`, `pelarasanExtra`, `hargaAkhir` | Extracted from `ProjectDetail.tsx`, `ProjectsList.tsx` and `services/finance.ts`. Tests pin TODAY's results on sample inputs, so behaviour is unchanged. Policy values come in as parameters. |
| `policy.ts` | `policyAt(rules, key, isoDate)` | Picks the rule with the latest `effective_from` that is <= the date. |

Test fixture: a synthetic `domain/rateBook/__fixtures__/mini-master-bq.json` that mimics the real layout. An
optional test runs against the real file when `MASTER_BQ_XLS=/path` is set. **Never commit the real Excel.**

## 5. API (Hono, mounted under `/api`; JSON; the acting user comes from the `X-InfraHub-User` header)
```
GET    /contracts                       list + stats {projects, versions, currentVersion, panelSize}
POST   /contracts                       {code,title,kind,valid_from,valid_to,company_cap,meeting_*,clone_from?}
GET    /contracts/:id     PATCH /contracts/:id
POST   /contracts/:id/status            {status}   DRAF->AKTIF, AKTIF->DITUTUP (logged)
GET    /contracts/:id/companies         PUT same (panel)
GET    /contracts/:id/book?version=     PresetGroup[] (default current TERBIT)
GET    /contracts/:id/versions          version list (commit log)
POST   /contracts/:id/versions/import   {fileName, rateColumn, book: ParsedBook} -> draft version + matches
GET    /rate-book/versions/:vid         meta + groups + matches
PATCH  /rate-book/versions/:vid/matches {decisions:[{new_ref, decision, old_*?}]}
POST   /rate-book/versions/:vid/publish {message} -> TERBIT (logged with diff stats)
GET    /rate-book/diff?from=&to=        BookDiff
POST   /projects/:id/contract           {contractId}  swap (refused when locked unless {unlock:true}); logged
POST   /projects/:id/reprice            {toContractId, dryRun} -> RepricePlan | applied project
GET    /changelog?entity=&entityId=&limit=
GET    /config          PUT /config/:key
GET    /lookups/:list   PUT /lookups/:list
GET    /policies        POST /policies {key, effective_from, value, note}
POST   /ai/match-suggest   optional; 501 when no AI binding
GET    /system/library_groups   COMPAT: the AKTIF contract's current book
PUT    /system/library_groups   COMPAT: creates a new EDIT version on the AKTIF contract (no more delete-all)
```
`GET /projects` rows gain `contractId`, `rateBookVersionId`. Every write appends to `change_log`.
Document the final request/response shapes in `docs/overhaul/v2/API.md`.

## 6. Client data layer
`services/apiService.ts` gains methods for every route above and sends `X-InfraHub-User` from the stored
user. Hooks: `hooks/useContracts.ts`, `useRateBook.ts`, `useChangeLog.ts`, `useOrgConfig.ts`
(config + lookups + policies). The browser-side Excel reader is `lib/excel/readWorkbook.ts` (SheetJS):
`File -> SheetRows[]`.

## 7. Design system: Direction C "Tapak", light only
Reference: `docs/overhaul/concepts/C/*.png`, `docs/overhaul/concepts/C-board.png`, `docs/overhaul/findings/CONCEPTS-ux.md`.
The concept's desktop screens were dark: **re-draw them light.**
- Fonts, self-hosted in `public/fonts/`: Bricolage Grotesque (display) and Atkinson Hyperlegible Next (UI/body);
  numbers use tabular figures.
- Tokens are CSS variables in `public/theme.css`, mirrored in `public/tw-config.js` (colors/fontFamily), and
  linked from every `*.html`:
  - paper `#F7F5EF`, surface `#FFFFFF`, ink `#14211F`, muted `#5B6B68`, line `#E3DFD3`;
  - emerald `#059669` / `#10B981` and teal `#14B8A6` = system and action;
  - **MPS purple `#3B2E8C` = anything that IS a contract / sebutharga / rate book** (a teaching colour, used consistently);
  - amber `#B45309` = warnings / stale rate; red `#B42318` = destructive / missing.
- `html { color-scheme: light }`. **No `dark:` classes, no `prefers-color-scheme: dark` rules**: remove any
  that exist.
- Touch targets >= 44 px, inputs >= 16 px on mobile, no hover-only actions (existing mobile rules in
  `docs/mobile-redesign.md` still apply).
- Primitives in `components/ui/`: Button, IconButton, Chip, **ContractChip** (purple; code + status), StatusPill,
  **WorkflowStepper** (6 statuses), Card, SectionHeader, StatTile, DataTable, Field/Input/Select, Sheet (wraps
  `BottomSheet`), Tabs, Indicator (stale-rate dot + label), EmptyState, Timeline, DiffRow (old -> new).
- A dev-only `kit.html` gallery renders every primitive (used for screenshots and review).
- **Product logo = `components/ui/BrandMark`** (`/icons/apple-touch-icon-180.png`, the official InfraHub icon, on a
  white tile with a hairline ring). It is used in the desktop rail, the mobile top bar and the login page, and every
  new screen that shows the product brand must use BrandMark (no HardHat or other stand-in icons). The
  ORGANISATION logo (e.g. the MPS crest on letterheads and PDFs) is a separate, configurable asset owned by
  builder O. Never swap one for the other.

## 8. Waves
| Wave | Builder | Delivers |
|---|---|---|
| 1 | **F**oundation (backend + domain) | §3–§6, migrations, legacy migration, tests, API.md |
| 1 | **D**esign system | §7, re-skinned AppShell/Sidebar/BottomSheet, kit.html, DESIGN.md |
| 2 | **K**ontrak | Tetapan → Kontrak: list/timeline, create/clone, panel, Excel import wizard (upload -> pick sheets + rate column -> parse preview with warnings -> match review incl. "cadangan" -> publish with message), version log + diff viewer, AKTIF/DITUTUP |
| 2 | **P**rojek | Dashboard "Pusat kawalan" + phone "Hari ini", projects list, project header with WorkflowStepper + ContractChip + swap, BQ/Pelarasan editors read the PROJECT's contract book, row indicators, "Tukar kontrak & harga semula" preview/apply, notification for draf projects on a DITUTUP contract, reports filter by sebutharga / year / custom range |
| 2 | **O**rganisasi | Tetapan → Organisasi: profile + logo (R2), lookup lists, policy rules with effective dates, document texts; wire PDFs/certificates and BP/Zon/Mukim options to config/policies (remove hard-coded constants) |
| 3 | E2E + preview deploy + report PDF | Playwright e2e across roles; preview on an isolated D1 copy; per-Yiyi build report PDF |

## 9. File ownership
| Owner | Files |
|---|---|
| F | `migrations/**`, `domain/**`, `functions/api/**`, `services/apiService.ts`, `hooks/use{Contracts,RateBook,ChangeLog,OrgConfig}.ts`, `lib/excel/**`, `types.ts` (additive only), `package.json`/lock (vitest, SheetJS), `vitest.config.ts`, `docs/overhaul/v2/API.md` |
| D | `public/fonts/**`, `public/theme.css`, `public/tw-config.js`, `public/global.css`, `*.html` (head links only + `kit.html`), `entries/kit.tsx`, `vite.config.ts` (kit input only), `components/ui/**`, `components/AppShell.tsx`, `components/Sidebar.tsx`, `components/BottomSheet.tsx`, `docs/overhaul/v2/DESIGN.md` |
| Lead | this file, `docs/overhaul/v2/NEEDS-lead.md`, `wrangler.toml` (local), merges |
| Wave 2 | assigned in each brief |

## 10. Done means (each builder)
- `npm run build` is green; tsc errors <= 3; `npx vitest run` is green (F; later builders keep it green).
- Your feature works in YOUR local server (own port, own `--persist-to`, dev seed + migrations + legacy migration).
- Prove it with a scripted Playwright run against your server (python, one browser at a time). Save
  screenshots (<= 1280 px PNG, anonymised dev seed only) to `docs/overhaul/v2/reports/img/<name>/`.
- **Report contract** (`docs/overhaul/v2/reports/PROGRESS-<name>.md` and `REPORT-<name>.md` with `## Done`,
  `## Evidence` (raw output in fenced blocks), `## Verified vs unverified`, `## Caveats`). Also include a
  `## Numbers` section with fenced CSV blocks (tests, files, lines changed, timings) for the build-report PDF charts.
- Run `python3 ~/.hermes/skills/software-development/coding-standards/scripts/coding_standards_check.py --files <your files>`
  and paste the raw output in REPORT. Code style: small functions, classes where a real concept owns state
  (repositories, the importer session), no dead code, comments only for *why*.
