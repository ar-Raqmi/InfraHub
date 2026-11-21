# REPORT-P1: Projek list & dashboard (wave 2)

## Done
**Dashboard → "Pusat kawalan" (desktop) / "Hari ini" (phone)**
- `pages/Dashboard.tsx` (932 → 355 lines): rewritten in Direction C light. The header shows the date (desktop) or a greeting with the user's name (phone), the scope ("Projek anda sahaja" for a PJA, which stays PJA-first) and the number of items that need action. Below it: the pipeline strip, then "Perlu tindakan", then the sebutharga aktif card and bulletins in the side column, then the "Projek aktif" table/cards. Existing capabilities kept: PJA filter (management), status filter from the tiles, search, pagination, inline Kemajuan (%) edit, the notice chips, the 500 ms long-press that selects text instead of opening a row, bulletins (create / read / react / delete), the profile link and the Tambah Projek FAB on phones.
- `components/dash/worklist.ts` (new, pure): `pendingNotice` (moved from Dashboard, same rules), `repriceReason`, `paperworkWait`, `medianPaperworkDays`, `buildWorklist`, `statusCounts`.
  - **Perlu harga semula** = FASA_DRAF / MENUNGGU_LANTIKAN projects whose sebutharga is DITUTUP, DRAF, missing or unknown.
  - **Menunggu kertas kerja** = Siap Sebenar is set, the status is not SIAP, and either the claim (Tuntutan) or the hand-over to Kewangan is missing. It shows the days waiting, longest first, and states the live median of days from Siap Sebenar to Padanan.
- `components/dash/PipelineStrip.tsx`: six StatTiles in workflow order. Amber hints count the work waiting at each step: "N perlu harga semula", "N siap, belum dituntut", "N belum ke Kewangan".
- `components/dash/ActionList.tsx`: the "Perlu tindakan" card. Groups in order: Perlu harga semula (with a ContractChip and the reason), Notis tertunggak, Menunggu kertas kerja (days). Each row is a 44 px button that opens the project. The `data-group` / `data-project-id` attributes are there for e2e.
- `components/dash/NextUpCard.tsx`: the single ink "Seterusnya" card on phones (notice → re-price → longest paperwork wait).
- `components/dash/ActiveProjectsTable.tsx`: the desktop table on `DataTable` (StatusPill, NoticeChip, Kemajuan input, long-press).
- `components/dash/BulletinCard.tsx`, `BulletinComposer.tsx`, `BulletinDialogs.tsx`: bulletin card, rich-text composer and dialogs taken out of Dashboard and re-skinned.
- Re-skinned: `components/dash/ProjectCard.tsx` (now adds a ContractChip), `MobilePager.tsx` (pb-24 kept), `MobileBulletins.tsx`, `EmptyProjects.tsx` (EmptyState), `StatusChip.tsx` (now only NoticeChip; statuses use StatusPill).
- Deleted `components/dash/StatusTiles.tsx` (replaced by PipelineStrip; grep shows no other users).

**Projects list (`pages/ProjectsList.tsx`, 1518 → 494 lines)**
- Re-skinned to C light with `components/ui`. On desktop the list is a `DataTable` (`components/projects/ProjectsTable.tsx`); on phones it is cards with the existing pager rules (pb-24 under the pager because of the FAB). Row actions are always visible, no longer hover-only.
- New default column **Sebutharga**: `components/projects/ContractCell.tsx` shows the ContractChip, plus an amber Indicator dot with "Perlu harga semula" when `repriceReason` applies. The phone card (`components/projects/ProjectCard.tsx`) shows the same cell.
- Sorting: DataTable headers are not clickable, so desktop sorting moved to a "Susun: …" select with a direction button. The phone sort in the sheet is unchanged.
- Re-skinned / extracted: `FilterPanel.tsx` (row filters, column picker, Syarikat-view options), `CompanyGroupPanel.tsx` (desktop company group), `CompanyCard.tsx`, `MobileToolbar.tsx`, `MobilePager.tsx`, `PjaAvatar.tsx`, `ProjectActionsSheet.tsx`, `AddProjectFab.tsx`, `ProjectDialogs.tsx` (delete with the 5 s countdown; export dialog).
- **Lead add-on:** the BP / Zon / Mukim filter options now come from config via `useLookups('BP'|'ZON'|'MUKIM').active` (value = `code`, text = `label`). The `types.ts` constants are used only while the lookup is loading or empty (`useLookupOptions` in `FilterPanel.tsx`). Codes equal the old option strings, so existing projects still match.

**Report filters (owner: "filterable by specific sebutharga or year or custom")**
- `components/projects/reportScope.ts` (new, pure): `ReportScope = {contractIds[], period: YEAR | ALL | RANGE(from,to,preset)}`, plus `inScope`, `scopeLabel`, `presetRange` (Jan–Jun, Jul–Dis, Bulan ini, 90 hari lepas), `allocationYear`, `voteSummary`, `voteTotals`, `capUsage`.
- `components/projects/ReportScopeBar.tsx`: the "Skop laporan" bar.
  - Sebutharga is a multi-select of ContractChips taken from `/contracts`. DITUTUP contracts with 0 projects are hidden.
  - Tempoh offers Tahun <selected year>, Semua tahun, or Julat tersuai (presets plus two native date inputs on tarikh_buka).
  - The bar shows the line "Angka laporan dikira daripada: …".
  - The bar sits in a card on desktop and at the top of the filter sheet on phones.
- **Totals come from one explicit filter state:** the vote summary, the PDF summary and the scope count are computed only from `scopeProjects = allProjects.filter(inScope)`. Search, status, PJA and the other row filters narrow the visible list only. This fixes the known flaw that balances were computed from the filtered list.
  - `components/projects/VoteSummary.tsx` shows "Dikira daripada <scope>".
  - When row filters are active it says they do not change the summary.
  - Allocation and balance appear only when the scope sits inside one financial year. Otherwise they show "—" with an amber note.
  - A negative balance is red.
  - Manual deductions (Lain-lain / YDP) can be edited only when the scope is the selected year, because they are saved per year.
- **Company cap per contract (warn only):** `components/projects/CapUsage.tsx` shows, under each company in the Syarikat view (desktop and phone), "RM used / RM cap had syarikat" per contract.
  - Used = Σ kos_projek of every project of that company on that contract, in any period.
  - Cap = the `contract_companies.cap` override, else `contracts.company_cap`.
  - Over the cap turns amber with "melebihi had". Nothing is blocked.
- **PDF (`services/pdf/ProjectsListPDFExporter.ts`):** `exportRotasi` / `exportSenarai` now take a `ReportTitleScope` instead of `selectedYear`.
  - The title line prints the period ("…BAGI TAHUN 2026" / "SEMUA TAHUN" / "TARIKH BUKA a – b").
  - New lines under it: "SKOP LAPORAN: …" and, when active, "TAPISAN PAPARAN: …".
  - The summary page heading is "RUMUSAN (<scope>)" and the file names carry the scope.
  - Rotasi now uses the scoped projects.
  - The pre-existing mislabelled summary header (`VOT, PERUNTUKAN, PROJEK, JUMLAH, …` over code/name/count/allocation columns) is fixed to `VOT, BUTIRAN, PROJEK, PERUNTUKAN, PERBELANJAAN, BAKI`.
  - When allocation is null the PDF prints "-" and skips the deductions block.

**Tests / proof**
- `components/dash/worklist.test.ts`, `components/projects/reportScope.test.ts`: 18 vitest tests. They need the include change requested in NEEDS-lead.
- `docs/overhaul/v2/e2e/P1.spec.py`: a standalone acceptance spec that takes `--base`. It creates its own data and cleans up its project.
- `docs/overhaul/v2/NEEDS-lead.md`: P1 requests appended.
- Screenshots: `docs/overhaul/v2/reports/img/P1/01…15-*.png`, 15 files (before/after for dashboard and projects on desktop and 390 phone, plus 430 phone, Syarikat/cap, Rumusan, Julat tersuai, the scope sheet and Perlu harga semula).

## Evidence
E2E spec against the local server (final run, after every change including the lookup add-on):
```
$ env -u PYTHONPATH ~/.hermes/cache/scratch/v2/pw/bin/python docs/overhaul/v2/e2e/P1.spec.py --base http://localhost:8794   # exit 0
PASS  dashboard counts = /api/projects per status (pja01, 390px)  ui={'FASA_DRAF': 1, 'MENUNGGU_LANTIKAN': 0, 'DALAM_PROSES': 0, 'PEMERIKSAAN_TAPAK': 0, 'TUNTUTAN_BAYARAN': 3, 'SIAP': 51} api={'FASA_DRAF': 1, 'MENUNGGU_LANTIKAN': 0, 'DALAM_PROSES': 0, 'PEMERIKSAAN_TAPAK': 0, 'TUNTUTAN_BAYARAN': 3, 'SIAP': 51}
PASS  dashboard no horizontal overflow (pja01, 390px)  overflow=0
PASS  dashboard counts = /api/projects per status (pja01, 430px)  ui={'FASA_DRAF': 1, 'MENUNGGU_LANTIKAN': 0, 'DALAM_PROSES': 0, 'PEMERIKSAAN_TAPAK': 0, 'TUNTUTAN_BAYARAN': 3, 'SIAP': 51} api={'FASA_DRAF': 1, 'MENUNGGU_LANTIKAN': 0, 'DALAM_PROSES': 0, 'PEMERIKSAAN_TAPAK': 0, 'TUNTUTAN_BAYARAN': 3, 'SIAP': 51}
PASS  dashboard no horizontal overflow (pja01, 430px)  overflow=0
PASS  dashboard counts = /api/projects per status (admin01, 1440px)  ui={'FASA_DRAF': 30, 'MENUNGGU_LANTIKAN': 34, 'DALAM_PROSES': 52, 'PEMERIKSAAN_TAPAK': 31, 'TUNTUTAN_BAYARAN': 48, 'SIAP': 291} api={'FASA_DRAF': 30, 'MENUNGGU_LANTIKAN': 34, 'DALAM_PROSES': 52, 'PEMERIKSAAN_TAPAK': 31, 'TUNTUTAN_BAYARAN': 48, 'SIAP': 291}
PASS  dashboard no horizontal overflow (admin01, 1440px)  overflow=0
PASS  create throwaway contract (clone of AKTIF)  status=201 code=E2E-P1-261122000814
PASS  activate throwaway contract  status=200
PASS  create FASA_DRAF project bound to it  status=200 contractId=ctr_c39899dab5dd
PASS  close throwaway contract (AKTIF -> DITUTUP)  status=200
PASS  the real AKTIF contract is untouched  MPS/SH/302/25
PASS  project listed under 'Perlu harga semula' on the dashboard
PASS  row shows the DITUTUP ContractChip  E2E/P1/261122000814 | ADMIN01 | Ujian e2e P1 261122000814 | E2E-P1-261122000814 | · | DITUTUP | Sebutharga sudah ditutup
PASS  row links to the project page  http://localhost:8794/project?id=1795277299950&year=2026
PASS  projects list shows the re-pricing indicator on that row
PASS  sebutharga filter MPS/SH/302/25 + Tahun 2026: totals = API sum  ui=(12026468.49, 422) api=(12026468.49, 422)
PASS  summary is labelled with the filter that produced it  Sebutharga MPS/SH/302/25 · Tahun 2026
PASS  an on-screen status filter does not change the totals  before=(12026468.49,422) after=(12026468.49,422)
PASS  sebutharga filter E2E-P1-261122000814 + Semua tahun: totals = API sum  ui=(12345.67, 1)
PASS  cleanup: test project deleted  status=200
NOTE  contract E2E-P1-261122000814 left in DITUTUP state (the API has no contract DELETE)
20/20 checks passed

real	0m12.816s
user	0m3.251s
sys	0m0.603s
```
Mutation check (proves the "status filter does not change totals" check can fail). The summary was temporarily computed from the row-filtered list (`// MUTATION-P1`), the app rebuilt and the spec run, then the file was restored from a copy (`grep -c MUTATION-P1 pages/ProjectsList.tsx` → `0`) and rebuilt:
```
$ ... P1.spec.py --base http://localhost:8794   # exit 1
PASS  dashboard counts = /api/projects per status (pja01, 390px)  ui={'FASA_DRAF': 1, 'MENUNGGU_LANTIKAN': 0, 'DALAM_PROSES': 0, 'PEMERIKSAAN_TAPAK': 0, 'TUNTUTAN_BAYARAN': 3, 'SIAP': 51} api={'FASA_DRAF': 1, 'MENUNGGU_LANTIKAN': 0, 'DALAM_PROSES': 0, 'PEMERIKSAAN_TAPAK': 0, 'TUNTUTAN_BAYARAN': 3, 'SIAP': 51}
PASS  dashboard no horizontal overflow (pja01, 390px)  overflow=0
PASS  dashboard counts = /api/projects per status (pja01, 430px)  ui={'FASA_DRAF': 1, 'MENUNGGU_LANTIKAN': 0, 'DALAM_PROSES': 0, 'PEMERIKSAAN_TAPAK': 0, 'TUNTUTAN_BAYARAN': 3, 'SIAP': 51} api={'FASA_DRAF': 1, 'MENUNGGU_LANTIKAN': 0, 'DALAM_PROSES': 0, 'PEMERIKSAAN_TAPAK': 0, 'TUNTUTAN_BAYARAN': 3, 'SIAP': 51}
PASS  dashboard no horizontal overflow (pja01, 430px)  overflow=0
PASS  dashboard counts = /api/projects per status (admin01, 1440px)  ui={'FASA_DRAF': 30, 'MENUNGGU_LANTIKAN': 34, 'DALAM_PROSES': 52, 'PEMERIKSAAN_TAPAK': 31, 'TUNTUTAN_BAYARAN': 48, 'SIAP': 291} api={'FASA_DRAF': 30, 'MENUNGGU_LANTIKAN': 34, 'DALAM_PROSES': 52, 'PEMERIKSAAN_TAPAK': 31, 'TUNTUTAN_BAYARAN': 48, 'SIAP': 291}
PASS  dashboard no horizontal overflow (admin01, 1440px)  overflow=0
PASS  create throwaway contract (clone of AKTIF)  status=201 code=E2E-P1-261121234835
PASS  activate throwaway contract  status=200
PASS  create FASA_DRAF project bound to it  status=200 contractId=ctr_e2be68ee0dc2
PASS  close throwaway contract (AKTIF -> DITUTUP)  status=200
PASS  the real AKTIF contract is untouched  MPS/SH/302/25
PASS  project listed under 'Perlu harga semula' on the dashboard
PASS  row shows the DITUTUP ContractChip  E2E/P1/261121234835 | ADMIN01 | Ujian e2e P1 261121234835 | E2E-P1-261121234835 | · | DITUTUP | Sebutharga sudah ditutup
PASS  row links to the project page  http://localhost:8794/project?id=1795276120005&year=2026
PASS  projects list shows the re-pricing indicator on that row
PASS  sebutharga filter MPS/SH/302/25 + Tahun 2026: totals = API sum  ui=(12026468.49, 422) api=(12026468.49, 422)
PASS  summary is labelled with the filter that produced it  Sebutharga MPS/SH/302/25 · Tahun 2026
FAIL  an on-screen status filter does not change the totals  before=(12026468.49,422) after=(8098687.89,291)
PASS  sebutharga filter E2E-P1-261121234835 + Semua tahun: totals = API sum  ui=(12345.67, 1)
PASS  cleanup: test project deleted  status=200
NOTE  contract E2E-P1-261121234835 left in DITUTUP state (the API has no contract DELETE)
19/20 checks passed
```
Unit tests (P1 tests through a scratch config, then the repo's own suite):
```
$ npx vitest run --config ./vitest.p1.tmp.config.ts   # include: components/**/*.test.ts
v4.1.12 /home/rezephyr/Documents/Repo/InfraHub-wt/P1


 Test Files  2 passed (2)
      Tests  18 passed (18)
   Start at  00:05:20
   Duration  381ms (transform 309ms, setup 0ms, import 399ms, tests 29ms, environment 0ms)

$ npx vitest run
 Test Files  9 passed | 1 skipped (10)
      Tests  70 passed | 5 skipped (75)
```
Type check and build:
```
$ npx tsc --noEmit -p . 2>&1 | grep "error TS"     # base count is 3
pages/AkuJanjiEditor.tsx(61,17): error TS2322: Type 'number' is not assignable to type 'string'.
pages/ImageReportGenerator.tsx(847,11): error TS2322: Type 'Blob | File' is not assignable to type 'File'.
pages/ImageReportGenerator.tsx(1118,9): error TS2719: Type 'LayoutType' is not assignable to type 'LayoutType'. Two different types with this name exist, but they are unrelated.

$ npx tsc --noEmit -p . --noUnusedLocals 2>&1 | grep -E "^(pages/Dashboard|pages/ProjectsList|components/dash|components/projects|services/pdf/ProjectsListPDFExporter)"; echo "grep exit: $?"
grep exit: 1

$ npm run build
✓ built in 7.52s
```
Phone probes (overflow, tap targets under 44 px, inputs under 16 px, FAB overlapping the pager at scroll end):
```
$ env -u PYTHONPATH .../pw/bin/python probe.py http://localhost:8794
p390 pja01 /dashboard.html overflowX 0 fab-overlaps-pager no-pager checked 45 small-targets 0 [] inputs<16px [] errors []
p390 admin01 /dashboard.html overflowX 0 fab-overlaps-pager 0 checked 64 small-targets 0 [] inputs<16px [] errors []
p390 admin01 /projects.html overflowX 0 fab-overlaps-pager 0 checked 68 small-targets 0 [] inputs<16px [] errors []
p430 pja01 /dashboard.html overflowX 0 fab-overlaps-pager no-pager checked 45 small-targets 0 [] inputs<16px [] errors []
p430 admin01 /dashboard.html overflowX 0 fab-overlaps-pager 0 checked 64 small-targets 0 [] inputs<16px [] errors []
p430 admin01 /projects.html overflowX 0 fab-overlaps-pager 0 checked 68 small-targets 0 [] inputs<16px [] errors []
```
Regressions of existing features (CSV, Rotasi/Senarai PDF read back with pdftotext, delete countdown, sort, tile filter, bulletins, PJA filter):
```
$ env -u PYTHONPATH .../pw/bin/python regress.py http://localhost:8794   # exit 0
PASS CSV export downloads with the visible columns  "No. Fail","Nama Projek","PJA","Aduan","Nama Syarikat","Sebutharga","Status","Progress (%)"
PASS Rotasi PDF prints the scope in its title  Rotasi_Kontraktor_Sebutharga_MPS_SH_302_25_Tahun_2026.pdf
PASS Senarai PDF prints the scope in its title and summary  Senarai_Kontraktor_Panel_Sebutharga_MPS_SH_302_25_Tahun_2026.pdf
PASS Senarai PDF summary header columns fixed
PASS delete dialog keeps the 5 s countdown
PASS delete dialog cancels without deleting
PASS sort select re-orders the table (No. Fail)  MPS.700-6/14/19
22/09/2026
PASS pipeline tile filters the project list
PASS bulletin opens in the detail dialog
PASS bulletin composer opens for management
PASS PJA filter narrows the dashboard
page errors []
```
Lead add-on: BP/Zon/Mukim options come from `/api/lookups`. A reversible label marker was put on ZON item 1 and then restored:
```
$ env -u PYTHONPATH .../pw/bin/python lookups_probe.py http://localhost:8794   # exit 0
ZON options == /api/lookups active: True 24
BP options == /api/lookups active: True 10
MUKIM options == /api/lookups active: True 2
marker label shown: True
filter by code still matches projects: 251
ZON restored: True
```
Coding standards:
```
$ python3 ~/.hermes/skills/software-development/coding-standards/scripts/coding_standards_check.py --files <35 P1 files>   # exit 1
coding-standards check — 35 file(s)
  [external] compileall (ruff absent): ok
  [external] eslint: ok
      skipped (eslint not installed locally)
  [clean-code] 3 finding(s)
      components/dash/PipelineStrip.tsx:4  possibly unused import: type
      components/dash/NextUpCard.tsx:5  possibly unused import: type
      components/projects/CapUsage.tsx:8  possibly unused import: type
  [DRY] 6 finding(s)
      24 tokens repeated in 2 places
      24 tokens repeated in 2 places
      24 tokens repeated in 2 places
      24 tokens repeated in 2 places
      24 tokens repeated in 2 places
      24 tokens repeated in 2 places
```
My judgement on these hits:
- **3× "unused import: type":** false. They are `import type { … }` lines, and `tsc --noUnusedLocals` above finds nothing in my files.
- **5× DRY:**
  - 3 are identical import lines in `CompanyCard.tsx` / `CompanyGroupPanel.tsx`;
  - 1 is the vitest import line shared by both test files;
  - 1 is two similar `expect` lines in `worklist.test.ts`.
- **A real DRY hit was fixed first:** the four repeated total tiles in VoteSummary are now one `Total` component.

## Verified vs unverified
**Verified by a command above**
- Dashboard per-status counts equal `/api/projects`. The check uses the current year, and pja01 sees only own projects. It ran for pja01 at 390 and 430 and for admin01 at 1440.
- A project on a closed contract appears under "Perlu harga semula" with a DITUTUP ContractChip, links to `project?id=`, and carries the re-pricing indicator in the projects list.
- The real AKTIF contract stays AKTIF with no `closedAt` after the e2e run.
- The sebutharga filter totals equal an API-side sum in two cases:
  - AKTIF + Tahun 2026 gives RM 12,026,468.49 over 422 projects that have a vote;
  - the test contract + Semua tahun gives RM 12,345.67 over 1 project.
- A status row filter does not change the totals. The mutation run shows this check fails if the old behaviour returns.
- The summary is labelled with its scope.
- Both PDFs print the scope line, and the Senarai summary header is corrected (pdftotext).
- No horizontal overflow, no tap target under 44 px and no input under 16 px. The FAB does not overlap the pager at 390/430 (dashboard admin, projects). Desktop 1440 has no overflow.
- tsc stays at 3 errors and the build is green.
- vitest: the repo suite is 70 passed / 5 skipped (unchanged), and P1's tests are 18 passed.
- BP/Zon/Mukim filter options equal the active `/api/lookups` rows for all three lists. A changed label shows up, and filtering by code still matches projects.

**Not verified by any command**
- Company-cap figures against a hand calculation in the browser. Only the unit tests check `capUsage`; the screenshot shows a plausible RM 199,620.89 / RM 200,000.
- Julat tersuai presets in the browser. Only the unit tests check `presetRange`; the screenshot shows Jan–Jun → 292 projek.
- That the allocation for another year (range in a non-selected year) loads.
- The visual layout of the PDFs; only their text was checked with pdftotext.
- Visual polish beyond my own screenshot review.
- iOS Safari.
- The rest of the long-press behaviour.
- The phone date-input locale: headless Chromium is en-US and shows mm/dd.
- The PJA-only empty state for "Perlu tindakan".

## Caveats
- **Test contracts are left behind.** The API has no contract DELETE, so every e2e run leaves one DITUTUP contract with 0 projects (`E2E-P1-<stamp>`). My local state now has 7. The projects-page picker hides them; the Kontrak page (builder K) will list them. The lead is asked for a delete or a test flag.
- **No ids from the seed in the spec.** It does assume users `admin01`/`pja01` exist and that an AKTIF PANEL contract exists. It reads the password from CREDS.txt line 2 or `INFRAHUB_E2E_PASSWORD`.
- **POST /projects needs `bp`.** It returns 500 without it (NOT NULL), so the spec sends `bp: 'E2E'`; reported in NEEDS-lead.
- **Pure logic is outside `domain/`.** `worklist.ts` / `reportScope.ts` live in my owned folders because `domain/` is lead-owned. Their tests are not in the default vitest include until the lead adds `components/**/*.test.ts`.
- **"Perlu harga semula" scope.** It also flags projects on a DRAF contract and projects with no or an unknown contract, not only DITUTUP. That is my reading of "or whose contract is not the AKTIF one".
- **Summary count vs scope count.** The summary counts only projects that have a vote ("Projek bervot", e.g. 422). The scope line counts every project in scope (486). Both are labelled.
- **Desktop sorting moved.** Click-to-sort column headers became a sort select, because DataTable headers are plain strings.
- **Dashboard default.** It still shows the year chosen in the AppShell (entries pass year-filtered projects). The worklist therefore covers that year's projects only.
- **Local only.** All checks ran against my local server on 8794 with the anonymised seed. Nothing was deployed and no git commands were run.

## Numbers
```csv
metric,value
e2e_checks_passed,20
e2e_checks_total,20
e2e_runtime_s,12.8
mutation_run_failed_checks,1
regression_checks_passed,11
vitest_p1_tests,18
vitest_repo_tests_passed,70
vitest_repo_tests_skipped,5
tsc_errors_base,3
tsc_errors_after,3
phone_probe_overflow_px,0
phone_probe_small_targets,0
screenshots,15
leftover_test_contracts_local,7
```
```csv
file,lines_before,lines_after
pages/Dashboard.tsx,932,355
pages/ProjectsList.tsx,1518,494
services/pdf/ProjectsListPDFExporter.ts,402,433
```
```csv
file,lines
components/dash/worklist.ts,118
components/dash/ActionList.tsx,129
components/dash/BulletinComposer.tsx,79
components/dash/ActiveProjectsTable.tsx,76
components/dash/BulletinCard.tsx,70
components/dash/BulletinDialogs.tsx,68
components/dash/PipelineStrip.tsx,41
components/dash/NextUpCard.tsx,31
components/projects/FilterPanel.tsx,201
components/projects/reportScope.ts,148
components/projects/CompanyGroupPanel.tsx,131
components/projects/ReportScopeBar.tsx,106
components/projects/VoteSummary.tsx,104
components/projects/ProjectsTable.tsx,90
components/projects/ProjectDialogs.tsx,69
components/projects/CapUsage.tsx,50
components/projects/ContractCell.tsx,27
components/dash/worklist.test.ts,73
components/projects/reportScope.test.ts,69
docs/overhaul/v2/e2e/P1.spec.py,205
```
```csv
check,pipeline_count_FASA_DRAF,MENUNGGU_LANTIKAN,DALAM_PROSES,PEMERIKSAAN_TAPAK,TUNTUTAN_BAYARAN,SIAP
admin01_2026,30,34,52,31,48,291
pja01_2026,1,0,0,0,3,51
```
