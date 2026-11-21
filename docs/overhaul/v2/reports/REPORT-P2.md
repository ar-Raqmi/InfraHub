# REPORT-P2 — Projek detail & BQ (wave 2)

Worktree `~/Documents/Repo/InfraHub-wt/P2` (branch `v2/w2-P2`), port 8795, state `~/.hermes/cache/scratch/v2/state-P2`
(anonymised dev seed + migrations + `POST /api/v2/admin/migrate-legacy` once). No git commands run.

## Done

**Project header (pages/ProjectDetail.tsx + components/detail/)**
- `components/detail/PhaseStepper.tsx` (new): desktop `WorkflowStepper` (6 statuses, dates for past steps, owner PJA/PT for
  future ones) with the 4 phase tabs laid in a 6-column grid under the statuses they cover (phase1=Draf,
  phase2=Menunggu Lantikan+Dalam Proses, phase3=Pemeriksaan Tapak, phase4=Tuntutan Bayaran+Siap); replaces the old
  4-tab strip. Phone: a one-line "Langkah N daripada 6" card that opens the vertical stepper (tabs stay in
  `MobileDetailHeader`).
- `components/detail/ContractPanel.tsx` (new): `ContractChip` lg (code, status, "Kadar versi N", lock + why:
  "Dikunci: No. Inden … telah dikeluarkan"), the "Tukar sebutharga" action (any officer who can edit the project), and
  the amber **"Perlu harga semula"** banner when the contract is DITUTUP and the project is draf. If the form has unsaved
  edits it saves them first (the re-price works on the saved BQ) and says so in a toast.
- `components/detail/ContractSwapSheet.tsx` (new): contracts listed AKTIF first; non-selectable ones (current, DRAF,
  DITUTUP) folded under "Tunjuk N sebutharga yang tidak boleh dipilih" and disabled. Picking one calls
  `POST /projects/:id/reprice {dryRun:true}` and shows before/after totals, counts, and one `DiffRow` per BQ row with an
  `Indicator`; the plan's CHANGED rows are split client-side into KADAR (rate differs) or PERKATAAN (wording/unit only);
  MISSING = TIADA. Apply = `dryRun:false`; the project's BQ, kos projek, contract, rate-book version and No. Sebutharga are
  taken from the response. Locked projects can preview; apply stays disabled until "Buka kunci untuk projek ini"; the
  unlock is recorded by a `POST /projects/:id/contract {unlock:true}` (`swap-unlocked` in change_log).
- `components/detail/CostHUD.tsx` (extracted unchanged from ProjectDetail, 149 lines) — keeps `md:left-28`, matching the
  `w-28` rail (probe below: HUD left = rail right = 112 px). Its grid changed from `1.4fr/1.4fr/1.2fr` to
  `auto/minmax(0,1fr)/auto` because the save-state badge overlapped "Prestasi Projek" at 1440.
- No. Sebutharga in the PT section is now read-only (the contract decides it; hint points to "Tukar sebutharga"); a blank
  one is filled from the bound contract (new projects: the AKTIF one the API binds them to).
- `components/detail/moneyRules.ts` (new): the LAD / LoC / kos sebenar / pelarasan-extra effects now call
  `domain/money.ts` (`ladAmount`, `locAmount`, `kosSebenar`, `pelarasanExtra`) with policies from `useOrgConfig()`
  (`ladPolicyAt`/`locPolicyAt` via `domain/policy`). Policy date: LAD = tarikhMulaKontrak → tarikhLantikan → tarikhBuka
  (terms fixed at contract start); LoC = tarikhSiapSebenar. Dates before the first rule use the first rule. The effects
  wait until policies have loaded. The guard conditions of each old effect are mirrored exactly.
- ProjectDetail: 1,790 → 1,629 lines.

**BQ editors (pages/BQEditor.tsx, pages/BQPelarasanEditor.tsx + components/bq/)**
- `components/bq/useProjectBook.ts` (new): the project's contract current TERBIT book through
  `useRateBook(contractId)`; unsaved/legacy projects without `contractId` read the AKTIF contract; only an install with
  no contracts falls back to `GET /system/library_groups`. Also `rateSourceLabel()`.
- Both editors: `apiService.getLibraryGroups()` is gone; Tambah Item, templates and pelarasan additions read
  `useProjectBook(projectData)`. Picker title = `BookPickerHeading` (`components/bq/BookNotices.tsx`): "Pilih item
  daripada buku kadar" + `ContractChip` + "versi N" (Pelarasan: "Tambah item pelarasan daripada buku kadar").
- `components/bq/bookTemplate.ts` (new): templates resolve by stable item id against the project book. Snapshot rows
  are re-priced from the book; rows whose source is not in the book are **kept** (they then show TIADA) and listed;
  legacy refs not in the book are listed as "Tidak ditambah". `TemplateMissSheet` shows the list after applying.
- `components/bq/RowBookFlag.tsx` (new): on draf projects every ITEM row is checked with `domain/rateBook/rowStatus`
  against the current book; non-OK rows show a tappable `Indicator` (44 px on phone) that opens a `Sheet` with the
  `DiffRow` (old → new), "Kekal kadar kontrak" (default, no change) and "Guna kadar baharu" (rate, unit, wording,
  amount updated; decision recorded in the row as `bookDecision` — local adapter, see NEEDS-lead). Desktop rows and
  `components/bq/BQItemCardMobile.tsx` (new `flag` prop) render it. Never changes a row on its own.
- Line counts: BQEditor 2,043 → 2,046; BQPelarasanEditor 1,766 → 1,757.

**PDF (services/pdf/BQPDFExporter.ts)** — `exportBQ(..., rateSource?)` prints one line under RINGKASAN:
"Kadar: Jadual Kadar Harga MPS/SH/302/25 (versi 1)". Nothing else in the file changed.

**Proof scripts**
- `docs/overhaul/v2/e2e/P2.spec.py` — standalone Playwright spec (`--base`, optional `--shots`), 17 checks, own data,
  cleanup (project deleted; test contract left DITUTUP — no delete route).
- `docs/overhaul/v2/e2e/P2-money-parity.ts` — old inline effects (verbatim) vs the new path, over every project on a server
  plus a synthetic late-completion/late-claim sweep.
- `docs/overhaul/v2/NEEDS-lead.md` — 4 requests under "From P2".
- Screenshots `docs/overhaul/v2/reports/img/P2/` (20 PNG, ≤1280 px): 00-before/after desktop+phone (before = lead's base
  build served from `InfraHub-wt/lead/dist` on :8809 with a copy of my state), 01–05b desktop (header, picker, swap list,
  re-price preview, row indicator, decision sheet), 06–12 phone 430/390 (header, stepper open, swap list, preview, BQ card
  with indicator + sticky BIL bar, decision sheet), 13 desktop banner + lock, 14 phone locked swap, 15 pelarasan picker.

## Evidence

E2E spec (second clean run; the first of two runs is identical, see Caveats for an earlier flaky run):
```
$ env -u PYTHONPATH ~/.hermes/cache/scratch/v2/pw/bin/python docs/overhaul/v2/e2e/P2.spec.py --base http://localhost:8795
PASS  login pja01
PASS  new project binds to the AKTIF contract  -- legacy-mps-sh-302-25 vs legacy-mps-sh-302-25
PASS  picker title names the project contract  -- MPS/SH/302/25
PASS  2 UI-added items price from the project contract book  -- PB-5-01=425 book=425, PB-6-01=340 book=340
PASS  import matched both rows to their old ids  -- ['EXACT', 'EXACT']
PASS  re-price preview shows exactly 1 KADAR row  -- KADAR=1 SAME=1
PASS  preview totals differ by qty x delta  -- before=2295.0 after=2332.5 expected diff=37.5
PASS  apply: project bound to the new contract and No. Sebutharga updated  -- E2E-P2/234524
PASS  apply: kos_projek updated to the previewed total  -- kosProjek=2332.5 after=2332.5
PASS  indicator appears on the row whose book rate changed  -- count=1
PASS  'Kekal kadar kontrak' keeps the old rate  -- rate=425 kept=425
PASS  'Guna kadar baharu' takes the book rate and records the decision  -- rate=432 decision=BAHARU
PASS  'Perlu harga semula' banner on a draf project of a closed contract
PASS  API refuses the swap once No. Inden is set  -- status=423
PASS  UI shows why it is locked and keeps apply disabled
PASS  'Buka kunci' path swaps the locked project  -- MPS/SH/302/25
PASS  unlock and re-prices are in the change log  -- ['swap-unlocked', 'reprice', 'reprice']
cleanup: DELETE project -> 200
cleanup: test contract E2E-P2/234524 left DITUTUP (contracts have no delete route)

17/17 checks passed

real	0m13.731s
user	0m2.878s
sys	0m0.595s
exit=0
```
Run 1 of the same pair:
```
17/17 checks passed

real	0m15.567s
user	0m2.941s
sys	0m0.584s
exit=0
```
Money-rule parity (old inline ProjectDetail effects vs domain/money + policies), every project in the local DB:
```
$ node node_modules/vite/bin/vite.js build --config $TMPDIR/vp.mjs --ssr docs/overhaul/v2/e2e/P2-money-parity.ts --outDir $TMPDIR/parity
$ node $TMPDIR/parity/P2-money-parity.js http://localhost:8795 1
projects=490 fields_compared=2940 diffs=0
synthetic_sweep_cases=6860 synthetic_sweep_diffs=0
projects_with_lad_days=31 projects_with_loc_days=0 projects_with_pelarasan=359
info: stored_values_differ_from_old_formula=9 (both paths recompute them identically)
exit=0
```
First parity run before the fix (raw, trimmed to the summary): `projects=490 fields_compared=2940 diffs=9` — 9 DIFF lines
like `DIFF project=1767674309157 field=kosSebenar old=31543.020000000004 new=31543.02`. Cause: the old effect compared the
saved value with the UNROUNDED sum, so saved float noise was left alone, while a strict compare against domain's rounded
result rewrote it. `settlementPatch` now compares to the cent (`sameMoney`), giving the run above (0 diffs).

Type check / build / unit tests:
```
$ npx tsc --noEmit   (count: 3 = base)
npm notice run infrahub@0.0.0 npx
npm notice run 'tsc' --noEmit
pages/AkuJanjiEditor.tsx(61,17): error TS2322: Type 'number' is not assignable to type 'string'.
pages/ImageReportGenerator.tsx(847,11): error TS2322: Type 'Blob | File' is not assignable to type 'File'.
  Type 'Blob' is missing the following properties from type 'File': lastModified, name, webkitRelativePath
pages/ImageReportGenerator.tsx(1118,9): error TS2719: Type 'LayoutType' is not assignable to type 'LayoutType'. Two different types with this name exist, but they are unrelated.
  Type '"grid"' is not assignable to type 'LayoutType'.
$ npm run build
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 8.20s
exit=0
$ npx vitest run


 Test Files  9 passed | 1 skipped (10)
      Tests  70 passed | 5 skipped (75)
   Start at  23:46:49
   Duration  735ms (transform 618ms, setup 0ms, import 1.08s, tests 135ms, environment 2ms)
```
Phone / desktop probes (scrollWidth vs viewport, new controls under 44 px, `--bq-sticky-top` and the sticky BIL bar's
top after scrolling) from `p2_shots.py`:
```
PROBE {"scrollWidth": 430, "innerWidth": 430, "smallTargets": 0, "stickyTop": "113px", "label": "phone430 project header"}
PROBE {"scrollWidth": 430, "innerWidth": 430, "smallTargets": 0, "stickyTop": "113px", "label": "phone430 swap list"}
PROBE {"scrollWidth": 430, "innerWidth": 430, "smallTargets": 0, "stickyTop": "113px", "label": "phone430 reprice preview"}
STICKY 430 {"top": 113, "varTop": "113px"}
PROBE {"scrollWidth": 430, "innerWidth": 430, "smallTargets": 0, "stickyTop": "113px", "label": "phone430 BQ rows with indicator"}
PROBE {"scrollWidth": 430, "innerWidth": 430, "smallTargets": 0, "stickyTop": "113px", "label": "phone430 decision sheet"}
STICKY 390 {"top": 113, "varTop": "113px"}
PROBE {"scrollWidth": 390, "innerWidth": 390, "smallTargets": 0, "stickyTop": "113px", "label": "phone390 BQ rows with indicator"}
PROBE {"scrollWidth": 430, "innerWidth": 430, "smallTargets": 0, "stickyTop": "113px", "label": "phone430 banner + lock"}
cleanup project 200
exit=0
$ (one-off) desktop 1440 / phone 360 overflow + rail/HUD edge
PROBE 1440 {'scrollWidth': 1440, 'innerWidth': 1440, 'hudLeft': 112, 'railRight': 112}
PROBE 360 {'scrollWidth': 360, 'innerWidth': 360, 'hudLeft': 0, 'railRight': 0}
```
Pelarasan picker reads the project's contract book (admin01, a PEMERIKSAAN_TAPAK project with pelarasan):
```
project 1789448084415 status PEMERIKSAAN_TAPAK contract MPS/SH/302/25 pelarasan bills 4
pelarasan picker heading: MPS/SH/302/25 | · | AKTIF | versi 1
heading names project contract: True
page errors: []
exit=0
```
BQ PDF rate-source line (downloaded through the UI, `pdftotext`):
```
project 1795139494623
RINGKASAN
Kadar: Jadual Kadar Harga MPS/SH/302/25 (versi 1)
```
Template resolution against a book (`components/bq/bookTemplate.ts`, ad-hoc script):
```
snapshot moved group  -> {"miss":null,"rate":30,"unit":"m3","group":"G2"}
snapshot variant      -> {"miss":null,"rate":300,"unit":"m3"}
snapshot not in book  -> {"miss":{"ref":"G9/GONE","description":"Item lama","kept":true},"rate":1}
ref by stable item id -> G2
ref missing variant   -> null {"ref":"G2/I2/I2-v9","description":"Rujukan item G2/I2/I2-v9","kept":false}
```
Coding standards:
```
$ python3 ~/.hermes/skills/software-development/coding-standards/scripts/coding_standards_check.py --files <16 P2 files>
coding-standards check — 16 file(s)
  [external] compileall (ruff absent): ok
  [external] eslint: ok
      skipped (eslint not installed locally)
  [clean-code] 45 finding(s)
      components/detail/moneyRules.ts:6  possibly unused import: type LadPolicy
      components/detail/moneyRules.ts:6  possibly unused import: type LocPolicy
      components/detail/moneyRules.ts:6  possibly unused import: type PolicyRule
      components/detail/ContractPanel.tsx:7  possibly unused import: type Project
      components/detail/ContractSwapSheet.tsx:5  possibly unused import: type IndicatorState
      components/detail/ContractSwapSheet.tsx:8  possibly unused import: type RepriceResult
      components/detail/ContractSwapSheet.tsx:11  possibly unused import: type Contract
      components/detail/ContractSwapSheet.tsx:11  possibly unused import: type Project
      components/detail/PhaseStepper.tsx:6  possibly unused import: type Project
      components/bq/useProjectBook.ts:10  possibly unused import: type
      components/bq/RowBookFlag.tsx:4  possibly unused import: type IndicatorState
      components/bq/RowBookFlag.tsx:5  possibly unused import: type BookIndex
      ... and 33 more
  [dead-scaffolding] 5 finding(s)
      pages/ProjectDetail.tsx:139  console.log left in code
      docs/overhaul/v2/e2e/P2-money-parity.ts:96  console.log left in code
      docs/overhaul/v2/e2e/P2-money-parity.ts:108  console.log left in code
      docs/overhaul/v2/e2e/P2-money-parity.ts:110  console.log left in code
      docs/overhaul/v2/e2e/P2-money-parity.ts:111  console.log left in code
  [DRY] 93 finding(s)
      24 tokens repeated in 2 places
      24 tokens repeated in 2 places
      24 tokens repeated in 2 places
      24 tokens repeated in 2 places
      24 tokens repeated in 3 places
      24 tokens repeated in 2 places
      24 tokens repeated in 2 places
      24 tokens repeated in 2 places
      24 tokens repeated in 2 places
      24 tokens repeated in 2 places
      24 tokens repeated in 2 places
      24 tokens repeated in 2 places
      ... and 81 more
```
The "possibly unused import: type X" findings are inline `type` imports that are used (tsc passes with no new errors);
the console.log hits are the parity script's output and one pre-existing sync log in ProjectDetail (line 139).

## Verified vs unverified

Verified (by the command shown):
- New projects bind to the AKTIF contract; 2 items added through the UI picker price from the project contract's book;
  the picker names the contract (spec checks 2–4).
- Clone + IMPORT (no compat PUT) + publish + activate; preview shows exactly 1 KADAR row and before/after differ by
  qty × Δ (3 × 12.50 = 37.50); apply updates contract, No. Sebutharga and kos_projek to the previewed total (checks 5–9).
- Row indicator appears when the row's book rate changes; "Kekal" keeps the old rate (also after save); "Guna kadar
  baharu" takes the new rate and stores `bookDecision` (checks 10–12).
- DITUTUP + draf banner (13); No. Inden → API 423, UI apply disabled with the reason shown, "Buka kunci" path swaps and
  `swap-unlocked` + 2 `reprice` entries are in change_log (14–17).
- Money-rule parity: 0 diffs over 490 projects × 6 fields and 6,860 synthetic LAD/LoC cases.
- tsc = 3 (base), build green, vitest 70 passed / 5 skipped.
- No horizontal overflow at 360/390/430/1440 on the project page and in the sheets probed; new controls ≥ 44 px on phone;
  sticky BIL bar sits at `--bq-sticky-top` (113 px) at 390 and 430; HUD left edge = rail right edge = 112 px.
- Pelarasan picker heading names the project contract; PDF prints the rate-source line; template helper keeps/flags
  unresolved snapshot rows and lists missing refs.

Not verified by any command:
- Applying a real template in the UI and seeing `TemplateMissSheet` (only the helper was exercised).
- The PERKATAAN_BERUBAH and TIADA indicator states in the UI (only KADAR_BERUBAH was driven; the other states come from
  the same `rowStatus` path and are covered by F's domain tests, not by mine).
- Adding a pelarasan item end-to-end (only the picker heading); the Pelarasan PDF (no rate-source line was asked there).
- Screenshots were reviewed by eye on contact sheets; no pixel diff against the base.

## Caveats
- **Logging gap (adapter):** "Guna kadar baharu" is recorded inside the row (`bookDecision`), not in `change_log` — there is
  no project log route. Requested in NEEDS-lead. Re-price with unlock is logged as `reprice` + a separate `swap-unlocked`.
- The editors and indicators read the contract's **current** TERBIT book, not the project's `rateBookVersionId`;
  "Guna kadar baharu" does not move `rateBookVersionId` (read-only through PUT).
- Indicators show on **draf** projects only (owner decision 4), and only in the BQ Kontrak editor; pelarasan rows are
  copies of the contract BQ and are not flagged.
- The PT can no longer pick No. Sebutharga from a list; it follows the contract (swap to change it).
- Pre-existing, left alone: the page shows "Belum disimpan" right after opening (BQEditor reports its bills on mount), so
  "Tukar sebutharga" usually saves the form first; the "Data dikemaskini secara automatik dari awan" toast appears after
  that save and can sit over a sheet title on phones for a few seconds.
- One spec run failed waiting for the "Projek berjaya disimpan" toast after the second save; the spec now waits for the
  PUT response instead, and the next two runs passed 17/17.
- Each spec run leaves one DITUTUP `E2E-P2/<hhmmss>` STANDALONE contract (no delete route); my local DB has several.
- Policy dates are my choice (LAD by contract start, LoC by completion); with today's single 2020-01-01 rule set the
  choice changes no number.

## Numbers
```csv
check,result
e2e_checks_passed,17
e2e_checks_total,17
e2e_runtime_s,13.7
parity_projects,490
parity_fields_compared,2940
parity_diffs,0
parity_synthetic_cases,6860
parity_synthetic_diffs,0
parity_diffs_before_cent_compare_fix,9
tsc_errors,3
vitest_passed,70
screenshots,20
```
```csv
file,lines_before,lines_after
pages/ProjectDetail.tsx,1790,1629
pages/BQEditor.tsx,2043,2046
pages/BQPelarasanEditor.tsx,1766,1757
components/detail/CostHUD.tsx,0,149
components/detail/ContractPanel.tsx,0,69
components/detail/ContractSwapSheet.tsx,0,177
components/detail/PhaseStepper.tsx,0,105
components/detail/moneyRules.ts,0,60
components/bq/useProjectBook.ts,0,44
components/bq/RowBookFlag.tsx,0,124
components/bq/bookTemplate.ts,0,42
components/bq/BookNotices.tsx,0,45
docs/overhaul/v2/e2e/P2.spec.py,0,355
docs/overhaul/v2/e2e/P2-money-parity.ts,0,115
```
```csv
viewport,scrollWidth,innerWidth,small_targets,sticky_top_px
360,360,360,,
390,390,390,0,113
430,430,430,0,113
1440,1440,1440,,
```
