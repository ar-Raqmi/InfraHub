# REPORT-F — Foundation (wave 1)

## Done
- `migrations/0001_contracts_rate_books.sql`: every CONTRACT §3 table (contracts, companies, contract_companies, rate_book_versions, rate_book_groups, rate_book_matches, change_log, app_config, lookup_values, policy_rules) + 2 indexes. **Additive deviation:** `rate_book_groups` has two extra columns `code`, `bill` (heading/bill number) so a group's official number survives storage.
- `migrations/0002_projects_contract.sql`: `projects.contract_id`, `projects.rate_book_version_id` + index.
- `domain/policy.ts`: `policyAt(rules,key,isoDate)`, typed `ladPolicyAt`/`locPolicyAt`, `DEFAULT_POLICY_RULES` (LAD threshold 20000, RM20/day, BLR 6.65, treasury 0.25, LoC 14 days, RM100/day, notice offsets -7/+7/+14, company cap 200000; effective 2020-01-01).
- `domain/money.ts`: `ladDailyRate`, `ladAmount`, `locAmount`, `sumBqAmounts`, `kosSebenar`, `pelarasanExtra`, `hargaAkhir`, extracted unchanged from `ProjectDetail.tsx` (LAD/LoC/capped-total effects), `ProjectsList.tsx` (`getHargaAkhir`) and `services/finance.ts`; policy values are parameters. The pages themselves were NOT rewired (wave 2 owns those files).
- `domain/rateBook/parseMasterBq.ts` (class `SheetParser` holds the walk state): header detection, sheet title row, `BIL NO.`/`BILL NO.` bills, `(SAMBUNGAN)` merge, `1`/`1.0` groups, `1.1` items, wrapped descriptions, variants `i)` `a)` `ii.` `i.)` `(a.)`, rate on the variant line or first description line, indented variant continuations, `nota` lines as notes, lettered spec lists folded into the description, unnumbered items, warnings with sheet + row.
- `domain/rateBook/toPresetGroups.ts`: `toPresetGroups(book, rateColumn, {idPrefix})`, `defaultRateColumn` (header containing KONTRAKTOR), `billCategory`; sets `code`, `bill`, `category`; copies the chosen column as written.
- `domain/rateBook/matchItems.ts`: `matchBooks(next, prev)` (EXACT / CODE / FUZZY / NEW, one-to-one greedy, alternatives, stats) and `stabiliseIds` (accepted rows keep old group/item/variant ids).
- `domain/rateBook/diffBooks.ts`, `rowStatus.ts`, `rows.ts` (flatten/index/normalisers incl. m²→m2), `types.ts`; `domain/reprice.ts` (`planReprice`, `applyReprice`).
- Tests: 9 files + 1 gated real-file test; fixture `domain/rateBook/__fixtures__/mini-master-bq.json` (synthetic). `vitest.config.ts`, `npm run test`.
- `lib/excel/readWorkbook.ts`: SheetJS CE 0.20.3 `File|bytes -> SheetRows[]` (keeps a dotted code such as `1.10` as text).
- `functions/api`: `actor.ts` (X-InfraHub-User, HttpError), repositories `ChangeLog`, `RateBook`, `Contract`, `Config`; services `RateBookService` (import/decide/publish/diff/edit/clone), `LegacyMigration` (idempotent), `ProjectContractService` (swap with inden lock, reprice); routes `contracts.ts`, `rateBook.ts` (+changelog), `orgConfig.ts` (config, lookups, policies, admin migrate, ai 501); `projects.ts` (+`/:id/contract`, `/:id/reprice`, new projects bound to the default AKTIF contract); `system.ts` library_groups COMPAT (GET = AKTIF current book; PUT = new EDIT version, delete-all removed; `SystemRepository.saveLibraryGroups` deleted as dead code); `ProjectRepository` exposes `contractId`/`rateBookVersionId` read-only; `[[route]].ts` mounts everything and maps HttpError to its status.
- `types.ts` (additive): `code/notes/bill` on presets, `Contract`, `ContractCompany`, `RateBookVersion`, `RateBookMatchRow`, `ChangeLogEntry`, `LookupValue`, `PolicyRuleRecord`, `BQRowStatus`, `Project.contractId/rateBookVersionId`.
- `services/apiService.ts`: sends `X-InfraHub-User`; `ApiError` (status + server message); a method per new route. Hooks: `useContracts.ts` (+`useContract`, `useContractCompanies`), `useRateBook.ts` (+`statusOf` row indicator, versions, diff, import session), `useChangeLog.ts`, `useOrgConfig.ts` (+`useLookups`, policy helpers).
- `docs/overhaul/v2/API.md`: first line `FOUNDATION READY`, route table, matching rules, 35 curl examples captured from port 8791 (project payloads cut to ids/codes/amounts, user names masked).
- `package.json`: `xlsx` from `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` (CDN `xlsx-latest` = 0.20.3, checked live), `vitest ^4.1.12`, script `test`.

## Evidence
Red run (tests written before the modules existed):
```
 FAIL  domain/rateBook/toPresetGroups.test.ts [ domain/rateBook/toPresetGroups.test.ts ]
 Test Files  8 failed (8)
      Tests  no tests
```
Red run for the later diffBooks fix (variant moved to another item):
```
     × follows a variant that kept its id but moved to another item 8ms
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯
AssertionError: expected { unchanged: 3, rateChanged: +0, …(3) } to match object { added: +0, removed: +0 }
      Tests  1 failed | 3 passed (4)
```
Green run, full suite (`npx vitest run`):
```
 Test Files  9 passed | 1 skipped (10)
      Tests  70 passed | 5 skipped (75)
```
Real workbook test (`MASTER_BQ_XLS=... LEGACY_BOOK_JSON=<today's library_groups as JSON> npx vitest run domain/rateBook/parseMasterBq.real.test.ts`) and the numbers it wrote:
```
 Test Files  1 passed (1)
      Tests  5 passed (5)
keseluruhan {"bills": 16, "groups": 98, "items": 174, "variants": 342, "pricedRows": 465, "warnings": 0, "rowsWithARate": 465}
categories {"bills": 16, "groups": 109, "items": 201, "variants": 359, "pricedRows": 508, "warnings": 0, "rowsWithARate": 508}
kontraktorRatio {"rows": 465, "outliers": 3, "min": 0.8243992049629585, "max": 0.8510638297872342}
match {"newRows": 465, "EXACT": 195, "CODE": 0, "FUZZY": 154, "AI": 0, "MANUAL": 0, "NEW": 116, "removed": 37, "pending": 154}
```
`npx tsc --noEmit` (base count 3):
```
npm notice run infrahub@0.0.0 npx
npm notice run 'tsc' --noEmit
pages/AkuJanjiEditor.tsx(61,17): error TS2322: Type 'number' is not assignable to type 'string'.
pages/ImageReportGenerator.tsx(847,11): error TS2322: Type 'Blob | File' is not assignable to type 'File'.
  Type 'Blob' is missing the following properties from type 'File': lastModified, name, webkitRelativePath
pages/ImageReportGenerator.tsx(1118,9): error TS2719: Type 'LayoutType' is not assignable to type 'LayoutType'. Two different types with this name exist, but they are unrelated.
  Type '"grid"' is not assignable to type 'LayoutType'.
```
`npx tsc --noEmit --noUnusedLocals --noUnusedParameters`, errors in my new files (count):
```
0
```
`npm run build`:
```
✓ built in 6.93s
```
State rebuild after the lead's seed refresh (`reset_state.sh`: rm state, import refreshed seed, apply migrations):
```
🚣 855 commands executed successfully.
🚣 13 commands executed successfully.
│ 0001_contracts_rate_books.sql │ ✅     │
🚣 4 commands executed successfully.
│ 0001_contracts_rate_books.sql │ ✅     │
│ 0002_projects_contract.sql    │ ✅     │
```
API run against `wrangler pages dev dist --port 8791 --persist-to state-F` (scratch `api_run.py`, curl per call; 409/423/501 lines are intended refusals):
```
01 POST /v2/admin/migrate-legacy -> 200 (0.207s)
02 POST /v2/admin/migrate-legacy -> 200 (0.037s)
IDEMPOTENT True run2 changedRows 0 run1 changedRows 1362
COUNTS run1.after {"contracts": 3, "companies": 63, "contract_companies": 60, "rate_book_versions": 3, "rate_book_groups": 207, "lookup_values": 36, "policy_rules": 10, "projects_linked": 490}
COUNTS run2.after {"contracts": 3, "companies": 63, "contract_companies": 60, "rate_book_versions": 3, "rate_book_groups": 207, "lookup_values": 36, "policy_rules": 10, "projects_linked": 490}
03 GET /contracts -> 200 (0.006s)
04 GET /contracts/legacy-mps-sh-302-25 -> 200 (0.006s)
05 GET /contracts/legacy-mps-sh-302-25/companies -> 200 (0.011s)
06 GET /contracts/legacy-mps-sh-302-25/book -> 200 (0.014s)
07 GET /contracts/legacy-mps-sh-302-25/versions -> 200 (0.010s)
08 GET /system/library_groups -> 200 (0.030s)
09 PUT /system/library_groups -> 200 (0.036s)
10 GET /contracts/legacy-mps-sh-302-25/versions -> 200 (0.009s)
11 GET /system/library_groups -> 200 (0.024s)
COMPAT versions 1 -> 2 v1 groups 69 -> 69 library_groups rows 69 -> 69 rate 425 -> 426
12 POST /contracts -> 201 (0.031s)
13 POST /contracts -> 409 (0.007s)
14 PATCH /contracts/ctr_163b84fb762b -> 200 (0.018s)
15 POST /contracts/ctr_163b84fb762b/versions/import -> 201 (0.097s)
IMPORT stats {"EXACT": 195, "CODE": 0, "FUZZY": 154, "AI": 0, "MANUAL": 0, "NEW": 116, "removed": 37, "pending": 154} parse {"bills": 16, "groups": 98, "items": 174, "variants": 342, "pricedRows": 465, "warnings": 0}
16 GET /rate-book/versions/rbv_b2be5be6dd01 -> 200 (0.032s)
17 POST /rate-book/versions/rbv_b2be5be6dd01/publish -> 409 (0.018s)
18 PATCH /rate-book/versions/rbv_b2be5be6dd01/matches -> 200 (0.107s)
DECIDED pending left 0
19 POST /rate-book/versions/rbv_b2be5be6dd01/publish -> 200 (0.052s)
PUBLISH diff {"unchanged": 140, "rateChanged": 101, "wordingChanged": 107, "added": 117, "removed": 38}
20 GET /contracts/ctr_163b84fb762b/versions -> 200 (0.022s)
21 GET /rate-book/diff?from=rbv_0421b86d75df&to=rbv_b2be5be6dd01 -> 200 (0.047s)
22 POST /contracts/ctr_163b84fb762b/status -> 409 (0.007s)
23 POST /contracts/ctr_163b84fb762b/status -> 200 (0.035s)
24 GET /contracts/ctr_163b84fb762b/book?version=2 -> 200 (0.019s)
25 POST /projects/1778059711091/reprice -> 200 (0.077s)
REPRICE dry totals {"before": 41253.88, "after": 40729.45, "missing": 6, "changed": 2, "same": 7}
26 POST /projects/1778059711091/reprice -> 200 (0.116s)
REPRICE applied True 40729.45
27 POST /projects/1766712662663/contract -> 423 (0.017s)
28 POST /projects/1766712662663/contract -> 200 (0.025s)
29 POST /projects/1766712662663/contract -> 200 (0.023s)
30 POST /projects -> 200 (0.013s)
NEW PROJECT contract ctr_163b84fb762b version rbv_b2be5be6dd01
31 DELETE /projects/1795273162952 -> 200 (0.006s)
32 GET /projects -> 200 (0.034s)
PROJECTS with contractId 490 of 490
33 GET /changelog?limit=5 -> 200 (0.006s)
34 GET /changelog?entity=project&entityId=1778059711091 -> 200 (0.005s)
35 PUT /config/org.profile -> 200 (0.013s)
36 GET /config -> 200 (0.006s)
37 GET /lookups/MUKIM -> 200 (0.006s)
38 PUT /lookups/MUKIM -> 200 (0.017s)
39 GET /policies -> 200 (0.006s)
40 POST /policies -> 201 (0.013s)
41 POST /ai/match-suggest -> 501 (0.002s)
42 POST /v2/admin/migrate-legacy -> 200 (0.038s)
MIGRATE after use: changedRows 0
```
Legacy migration once more after the last code change:
```
changedRows 0 before==after True
```
Coding-standards checker (raw):
```
coding-standards check — 47 file(s)
  [external] eslint: ok
      skipped (eslint not installed locally)
  [clean-code] 52 finding(s)
      domain/money.ts:4  possibly unused import: type BQGroup
      domain/money.ts:4  possibly unused import: type Project
      domain/policy.test.ts:2  possibly unused import: type PolicyRule
      domain/reprice.ts:3  possibly unused import: type BookIndex
      domain/reprice.ts:3  possibly unused import: type BookRow
      domain/rateBook/diffBooks.test.ts:2  possibly unused import: type
      domain/rateBook/diffBooks.ts:3  possibly unused import: type
      domain/rateBook/diffBooks.ts:4  possibly unused import: type BookRow
      domain/rateBook/matchItems.test.ts:2  possibly unused import: type
      domain/rateBook/matchItems.ts:5  possibly unused import: type BookRow
      domain/rateBook/parseMasterBq.real.test.ts:7  possibly unused import: type
      domain/rateBook/parseMasterBq.real.test.ts:11  possibly unused import: type
      ... and 40 more
  [DRY] 9 finding(s)
      24 tokens repeated in 2 places
      24 tokens repeated in 2 places
      24 tokens repeated in 2 places
      24 tokens repeated in 2 places
      24 tokens repeated in 2 places
      24 tokens repeated in 2 places
      24 tokens repeated in 2 places
      24 tokens repeated in 2 places
      24 tokens repeated in 2 places
```

## Verified vs unverified
Verified by a command above:
- money.ts reproduces today's expressions on 23 pinned inputs and equals `services/finance.ts calculateLADDailyRate` on 1,820 sums (vitest).
- Parser on the real workbook: KESELURUHAN 465 of 465 priced rows (16 bills from 28 bill-header lines, 12 of them SAMBUNGAN), category sheets 508 of 508; 0 warnings; title `JADUAL KADAR HARGA 2024/2025`; both rate columns found.
- Matching KESELURUHAN-kontraktor vs the legacy book (386 priced rows): EXACT 195, CODE 0, FUZZY 154 (all PENDING), NEW 116, removed 37 (vitest real test and the API import agree).
- Legacy migration idempotent: run 1 changed 1362 rows, run 2 and a run after all API writes changed 0, counts equal (3 contracts, 63 companies, 60 panel rows, 3 versions, 207 groups, 36 lookups, 10 policies, 490/490 projects linked).
- `PUT /system/library_groups` created version 2 (EDIT); version 1 kept 69 groups; `library_groups` stayed 69 rows; the edited rate (425→426) is served by GET.
- Import → publish refused (409, pending) → decisions → publish (diff stats) → AKTIF; reprice dry-run and apply (kos projek 41,253.88 → 40,729.45, 6 MISSING rows listed); swap 423 when locked, 200 with unlock; new project bound to the default AKTIF contract; config/lookups/policies round trip; AI 501.
- tsc stays at 3; build green.
Not verified:
- No UI uses the new hooks or `readWorkbook` in a browser yet (wave 2); the hooks are type-checked only.
- No Playwright run (the brief said none needed from F).
- Worker CPU limits in production: the import took 0.097 s wall locally; real Cloudflare CPU time is unmeasured.
- Matching quality beyond counts: I sampled FUZZY pairs by eye; the 154 pending suggestions were not reviewed by an officer.
- `money.ts` is not yet called by ProjectDetail/ProjectsList; behaviour parity is proven on samples, not by swapping it into the pages.

## Caveats
- `rate_book_groups.code` / `bill` columns go beyond CONTRACT §3 (additive).
- npm 12 here blocks remote tarballs by default (`allow-remote=none`); I installed SheetJS with a one-off `npm i --allow-remote=all <CDN url>`. Anyone running `npm install` on this lock may need the same flag. esbuild/workerd postinstall scripts are reported as blocked by npm, but build, vitest and wrangler worked.
- The real file has 3 rows whose kontraktor/jabatan ratio is outside 0.849-0.851 (min 0.8244 on item 11/4.3(xiii)); the importer copies cells as written, so this is the file's data.
- Some rates in today's Pustaka differ from the KESELURUHAN kontraktor column (e.g. papan tanda rows about 1.2x); FUZZY/EXACT matches still pair them and the diff shows them as rate changes.
- Unit-free FUZZY: rows with different units are never matched (keeps it fast and avoids false pairs); a unit relabel (e.g. `Nos` → `set`) would show as NEW + removed.
- `diffBooks` falls back to variant id when import moved a variant under another item id. `stabiliseIds` may give an item a fresh id with a `~` suffix if ids collide.
- Contract activation needs a TERBIT book; more than one AKTIF contract is allowed; new projects take the most recently activated AKTIF PANEL contract.
- The project PUT route does not log to change_log (only v2 routes do); `contractId`/`rateBookVersionId` cannot be changed through it.
- Tests written after the code: the `m²` unit assertion in rowStatus.test.ts and `lib/excel/readWorkbook.test.ts` (no red run for those two).
- Coding-standards heuristic: its "possibly unused import" hits are TypeScript type imports (tsc `--noUnusedLocals` reports 0 for my files, which is authoritative); DRY hits are repeated import lines, test fixture literals, and pre-existing repositories/routes.
- The lead's seed refresh arrived mid-task; every API example and count above comes from the refreshed seed (state wiped and rebuilt twice).

## Numbers
```csv
metric,value
unit_test_files,9
unit_tests_passed,70
real_file_tests_passed,5
tsc_errors_base,3
tsc_errors_after,3
api_calls_captured,42
build_seconds,6.93
```
```csv
book,bills,groups,items,variants,priced_rows,expected_priced_rows,warnings
KESELURUHAN,16,98,174,342,465,465,0
category_sheets_16,16,109,201,359,508,508,0
```
```csv
match_vs_legacy,count
EXACT,195
CODE,0
FUZZY_pending,154
NEW,116
removed,37
legacy_rows,386
```
```csv
legacy_migration,run1,run2
changed_rows,1362,0
contracts,3,3
companies,63,63
contract_companies,60,60
rate_book_versions,3,3
rate_book_groups,207,207
lookup_values,36,36
policy_rules,10,10
projects_linked,490,490
```
```csv
publish_diff_vs_base,count
unchanged,140
rateChanged,101
wordingChanged,107
added,117
removed,38
```
```csv
file_group,files,lines
migrations,2,121
domain_src,10,1039
domain_tests_and_fixture,10,653
lib_excel,2,78
functions_api_new,11,1056
hooks_new,4,198
api_md,1,1590
```
