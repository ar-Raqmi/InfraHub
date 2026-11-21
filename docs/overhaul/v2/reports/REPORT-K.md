# REPORT-K: Kontrak & buku kadar (wave 2)

Worktree `~/Documents/Repo/InfraHub-wt/K`, server `:8793`, state `~/.hermes/cache/scratch/v2/state-K` (seed + migrations by the lead;
`POST /api/v2/admin/migrate-legacy` run once by K: 3 contracts, 63 companies, 490 projects linked). No git commands were run.

## Done
**`pages/kontrak/KontrakPage.tsx`** (stub replaced): URL-routed page (`?c=<id>&tab=buku|versi|panel|butiran&import=baru|<versionId>`):
register, one contract, or the import wizard. Back/forward and shared links work.

**`components/kontrak/`**
- `ContractRegister.tsx`: light register/timeline (rail dot per status), AKTIF first then DRAF then DITUTUP; each row has
  ContractChip (code + status), kind, `Buku vN`, validity + life line, project / panel / version counts. Filters: status tabs with
  counts, kind select, text search. Actions: `Salin <AKTIF code>` and `Kontrak baharu`.
- `CreateContractSheet.tsx`: blank or "Salin daripada kontrak" (source select with what will be copied); client checks
  (required code/title, dates order, cap > 0) and the **API's own message** for conflicts (e.g. "Kod … sudah wujud"). Mounted per
  opening so the form always starts clean (an effect-based reset raced Playwright's typing; fixed).
- `ContractDetail.tsx`: purple identity header (code in display type, ContractChip lg with book version, validity, cap, meeting),
  StatTiles (projek, projek draf, panel, versi), actions Import BQ Excel (kontrak) / Aktifkan (primary) / Tutup (danger); tabs.
- `StatusActionSheet.tsx`: confirm sheet with consequences. Aktifkan: book becomes official, becomes default for new projects
  (PANEL) or not (STANDALONE), other AKTIF contracts stay AKTIF, warns when no TERBIT book. Tutup: "N projek draf … akan ditanda
  Perlu harga semula", appointed projects keep their rates, cannot be reopened, warns when no other AKTIF panel contract remains;
  requires an "I understand" tick.
- `PanelEditor.tsx`: add (datalist of companies on any contract's panel), remove, reorder, per-company cap override, cap meter
  (work value of this contract's projects per company vs cap; amber when over; warning only). Local edits only exist once the
  officer changes something, so background refetches never wipe them.
- `ContractDetailsForm.tsx`: PATCH title, validity, cap, meeting, notes (same no-wipe rule).
- `BookBrowser.tsx`: categories → groups → items/variants with code (purple), unit, rate; search over code/wording/unit; any
  version (from the log, "Lihat buku"); phone layout moves the unit under the text.
- `VersionLog.tsx`: commit list (vN tag, message, TERBIT/DRAF, source label LEGACY/IMPORT/CLONE/EDIT, date, author, source file
  + rate column, stats line from `stats.diff` / `stats.match`), actions Lihat buku / Banding dengan sebelumnya / Sambung semakan
  (DRAF); "Banding dua versi" picker; contract + rate-book change log (runs of match decisions collapsed into one line).
- `DiffViewer.tsx`: `GET /rate-book/diff` → tabs Kadar berubah / Perkataan berubah / Ditambah / Dibuang / Sama with counts,
  filter, DiffRow per row, paging by 60.
- `useContractProjects.ts` (LOCAL ADAPTER, NEEDS-lead #2), `useKontrakRoute.ts`, `format.ts`, `bits.tsx` (SearchField, Notice,
  TextButton, MoreButton, UnitRate, CardTitle, StepFooter), `useAction.ts` (busy + server error for one action).

**`components/kontrak/import/`** (the wizard, 5 steps with a step bar)
- `ImporterSession.ts` (class, owns the uploaded workbook): per-sheet summaries, smart choices "KESELURUHAN" (summary sheet,
  by name or by bill count) vs "Helaian kategori (N)" with priced-row counts and their rate columns, default = the choice with a
  KONTRAKTOR column, default column via `defaultRateColumn`; preview = `parseMasterBq` + `toPresetGroups` + `flattenBook`
  (domain functions only), rows missing in the chosen column, per-bill counts and rate range.
- `UploadStep.tsx` (drop/choose .xls/.xlsx, `readWorkbook`, read time shown), `SheetStep.tsx` (radio cards + "pilih helaian
  sendiri" checklist; rate column radios with exact header text), `PreviewStep.tsx` (StatTiles, warnings with sheet + row,
  per-bill table, sum of rates as a cross-check) → `POST /contracts/:id/versions/import`.
- `reviewModel.ts`: joins the DRAF version's rows, its matches and the base book into five buckets. EXACT → Sama / Kadar berubah
  (by `sameMoney`), any other kept link (CODE/FUZZY/AI/MANUAL) → Perkataan berubah (cadangan), NEW or REJECT → Baharu,
  server `removed` → Dibuang. Tracks double use of an old row.
- `ReviewStep.tsx`: count tiles + tabs, "Padanan tepat X (sama + kadar berubah)" line, filter, "Menunggu sahaja", bulk
  "Terima N cadangan" above a chosen score (95…70 %), undecided suggestions sorted first by score, sticky footer with pending
  count and "Teruskan ke terbit" (disabled while anything is PENDING). Desktop keyboard: J/K or ↑/↓, A accept, R reject,
  P pick another. Phone: compact list, one suggestion per Sheet (old vs new, big Terima / Tolak, "Pilih item lama lain"),
  auto-advance to the next pending.
- `CandidateCard.tsx` + `RowSide.tsx` + `wordDiff.ts`: old vs new side by side, similarity %, method, decision; changed words
  marked (word-level LCS, display only), rate differences in amber; text clamped to 4 lines, tap to expand.
- `OldItemPicker.tsx`: "Pilih item lain" sheet over the base book (same unit first, search, "sudah dipadankan" flag) → MANUAL.
- `PublishStep.tsx`: summary, required commit message (≥ 8 chars, suggestion button), publish → TERBIT; shows the diff tiles and
  the version's change_log entries (import, match, publish) from `GET /changelog`.
- `AiSuggestButton.tsx`: renders nothing unless `GET /config` has `ai.matchSuggest: true`, so a 501 server never shows a button,
  request or error (NEEDS-lead #4).

**Tetapan (`pages/AdminSettings.tsx` +3 lines, `components/admin/settings/`)**: `KontrakMovedBanner.tsx` in the old per-year
"Senarai No. Sebutharga" card (points to Kontrak; list kept for old records) and in the Pustaka editor on desktop and phone
(`LibraryMobile.tsx`): "Pustaka ini ialah buku kadar kontrak AKTIF … Simpan Pustaka mencipta versi baharu jenis Suntingan",
with a link to that contract's version log. `SettingsHub.tsx`: phone hub gets a purple "Kontrak & buku kadar" row; the old row
is renamed "No. Sebutharga (lama)". Votes, templates, meeting, companies untouched.

**Proof**: `docs/overhaul/v2/e2e/K.spec.py` (class `SpecRun`, 21 checks, builds its own .xlsx with openpyxl from the live book,
cleans up). `docs/overhaul/v2/NEEDS-lead.md` "From K" (5 requests). Screenshots `reports/img/K/01…15` (22 PNG, ≤ 1280 px).

## Evidence
Final run, raw (`~/.hermes/cache/scratch/v2/K/evidence.txt`):
```
$ npx vitest run
 Test Files  9 passed | 1 skipped (10)
      Tests  70 passed | 5 skipped (75)
   Start at  00:07:00
   Duration  870ms (transform 887ms, setup 0ms, import 1.34s, tests 176ms, environment 1ms)

$ npx tsc --noEmit 2>&1 | grep -c "error TS"
3
$ npm run build
✓ built in 8.41s
$ env -u PYTHONPATH ~/.hermes/cache/scratch/v2/pw/bin/python docs/overhaul/v2/e2e/K.spec.py --base http://localhost:8793
PASS  register lists contracts, AKTIF first
PASS  clone created and opened
PASS  duplicate code shows the API validation message  Kod MPS/SH/E2E-K-1795277255 sudah wujud
INFO  book rows=386; rate change 340 -> 375.0; workbook E2E-K-1795277255.xlsx
PASS  default rate column is the KONTRAKTOR header  KADAR HARGA KONTRAKTOR (RM)
PASS  preview: 4 rates, 0 warnings  {'Kadar diimport': 4, 'Bil': 1, 'Kumpulan': 1, 'Item': 4, 'Varian': 0, 'Amaran': 0}
PASS  review counts 1/1/1/1/removed  {'Perkataan berubah (cadangan)': 1, 'Kadar berubah': 1, 'Baharu': 1, 'Dibuang': 383, 'Sama': 1}
PASS  publish is blocked while a match is pending
PASS  one PENDING candidate shown side by side
PASS  suggestion accepted, nothing pending
PASS  empty commit message is refused
PASS  published diff counts  {'Kadar berubah': 1, 'Perkataan berubah': 1, 'Ditambah': 1, 'Dibuang': 383, 'Sama': 1}
PASS  change_log entry shown after publish
PASS  version log: v2 on top, TERBIT, Import Excel, message
PASS  version stats line  1 kadar berubah · 1 perkataan · +1 / −383 · 1 sama
PASS  diff viewer tab counts  ['Kadar berubah 1', 'Perkataan berubah 1', 'Ditambah 1', 'Dibuang 383', 'Sama 1']
PASS  no page errors
PASS  API: v2 TERBIT IMPORT with the message
PASS  API: change_log has import, match, publish  ['publish', 'match', 'import']
PASS  API: publish entry carries actor + diff  {'rateChanged': 1, 'wordingChanged': 1, 'added': 1, 'removed': 383, 'unchanged': 1}
PASS  AKTIF contract(s) untouched
NOTE  no delete route (DELETE 404) and DRAF->DITUTUP refused (409: Tidak boleh tukar DRAF -> DITUTUP); test contract left DRAF and labelled [E2E selesai] (PATCH 200)
PASS  cleanup: test contract labelled as finished test data

21/21 checks passed in 4.8s
exit=0
$ negative control: same spec, REWORD_TAIL="" (the reworded row becomes an exact match)
FAIL  review counts 1/1/1/1/removed  {'Perkataan berubah (cadangan)': 0, 'Kadar berubah': 1, 'Baharu': 1, 'Dibuang': 383, 'Sama': 2}
FAIL  publish is blocked while a match is pending
FAIL  one PENDING candidate shown side by side
FAIL  spec ran to the end  TimeoutError: Locator.click: Timeout 30000ms exceeded.
6/10 checks passed in 33.9s
exit=1
$ probe_edits.py (panel cap save, details save, Aktifkan + Tutup on a STANDALONE clone)
standalone clone 201 STANDALONE DRAF
panel cap saved: 123456
meeting saved: Bil. 3/2026
after Aktifkan: AKTIF
Tutup disabled before ack: True
after Tutup: DITUTUP | import button hidden: True
contract log actions: ['status', 'status', 'update', 'panel', 'create']
default PANEL contract unchanged: True
errors []
$ coding_standards_check.py --files <33 K files> --scope <same>
coding-standards check — 33 file(s)
  [external] compileall (ruff absent): ok
  [external] eslint: ok
      skipped (eslint not installed locally)
  [clean-code] 22 finding(s)
      components/kontrak/bits.tsx:3  possibly unused import: type LucideIcon
      components/kontrak/format.ts:3  possibly unused import: type
      components/kontrak/format.ts:4  possibly unused import: type
      components/kontrak/import/CandidateCard.tsx:4  possibly unused import: type
      components/kontrak/import/ImporterSession.ts:5  possibly unused import: type BookRow
      components/kontrak/import/ImporterSession.ts:6  possibly unused import: type
      components/kontrak/import/ImportWizard.tsx:8  possibly unused import: type SheetSelection
      components/kontrak/import/OldItemPicker.tsx:3  possibly unused import: type BookRow
      components/kontrak/import/PreviewStep.tsx:4  possibly unused import: type
      components/kontrak/import/reviewModel.ts:3  possibly unused import: type BookIndex
      components/kontrak/import/reviewModel.ts:3  possibly unused import: type BookRow
      components/kontrak/import/ReviewStep.tsx:9  possibly unused import: type Bucket
      ... and 10 more
  [DRY] 2 finding(s)
      24 tokens repeated in 2 places
      24 tokens repeated in 2 places
exit=1
$ eslint 9 + typescript-eslint (no-unused-vars, no-console) components/kontrak pages/kontrak components/admin/settings/{KontrakMovedBanner,SettingsHub,LibraryMobile}.tsx
exit=0
```
Real master BQ through the UI (manual run, the review screenshot `06-review-real-desktop.png` / `07`/`08` phone):
```
$ env -u PYTHONPATH ~/.hermes/cache/scratch/v2/pw/bin/python real_import.py   # real master BQ copied to scratch as master-bq.xls; fresh clone of the AKTIF contract; UI only
clone 201 ctr_38f2096df007 {'projects': 0, 'versions': 1, 'currentVersion': 1, 'panelSize': 60}
read+parse s 0.45
preview stats 465 | Kadar diimport | KADAR HARGA KONTRAKTOR (RM) | 16 | Bil | 98 | Kumpulan | 174 | Item | 342 | Varian | 0 | Amaran | Tiada amaran
import+review s 1.12
counts 154 | Perkataan berubah (cadangan) | 154 menunggu | 50 | Kadar berubah | 116 | Baharu | 37 | Dibuang | 145 | Sama
summary Padanan tepat 195 (sama 145 + kadar berubah 50) · cadangan perkataan 154 · baharu 116 · dibuang 37
pending 154 padanan menunggu keputusan
url http://localhost:8793/kontrak?c=ctr_38f2096df007&import=rbv_207056cd1e75 overflow 0 errors []
phone overflow 0 errors []
contract ctr_38f2096df007 REAL-K-1795276287
```
```
$ env -u PYTHONPATH ~/.hermes/cache/scratch/v2/pw/bin/python shots_after.py ctr_0ce206909fbb rbv_5c1fbc920348   # first real import, resolved + published through the UI
after bulk: 16 padanan menunggu keputusan        (bulk "Terima >= 70%" accepted 138 of 154)
pending now: Semua padanan sudah diputuskan      (16 rejected with the R key)
$ shots_fix.py ctr_0ce206909fbb   # diff v1 -> v2 of that publish, read from the diff viewer tabs
diff tabs ['Kadar berubah\n93', 'Perkataan berubah\n100', 'Ditambah\n132', 'Dibuang\n53', 'Sama\n140']
```
Tetapan before/after (re-test of the old screen; votes/templates still render):
```
$ shots_settings.py 14-before   (old AdminSettings/SettingsHub/LibraryMobile restored, built, then put back)
saved 14-before-settings-sebutharga-desktop overflow 0
saved 14-before-settings-pustaka-desktop overflow 0
templates section 1 errors []
saved 14-before-settings-hub-phone overflow 0
phone errors []
$ shots_settings.py 15-after
saved 15-after-settings-sebutharga-desktop overflow 0
saved 15-after-settings-pustaka-desktop overflow 0
templates section 1 errors []
saved 15-after-settings-hub-phone overflow 0
phone errors []
```

## Verified vs unverified
Proved by a command above:
- Build green, tsc at the base count 3, vitest 70 passed (unchanged from wave 1).
- Whole UI flow as pja01: clone with unique code, API duplicate-code message shown, upload → KONTRAKTOR default column →
  preview (4 rates, 0 warnings) → review counts 1/1/1/1/383 → publish blocked while pending → accept → empty message refused →
  publish → diff tiles, change_log (import, match, publish with actor + diff) → version log v2 + stats line → diff viewer counts;
  AKTIF snapshot identical before/after; no page errors (K.spec.py 21/21).
- The spec can fail: with the rewording removed it reports 4 FAILs and exit 1 (negative control).
- Real Excel via UI: 465 rows, 0 warnings, read+parse 0.45 s, import+review 1.12 s; **195 exact (145 Sama + 50 Kadar berubah) /
  154 Perkataan berubah (cadangan, all PENDING) / 116 Baharu / 37 Dibuang = F's 195/154/116/37**. A full resolve + publish of the
  real book through the UI (bulk ≥ 70 % accepted 138, 16 rejected by keyboard) gave diff 93/100/132/53/140; 132 = 116 + 16
  and 53 = 37 + 16, as expected for rejected suggestions.
- Panel cap save, details save, Aktifkan then Tutup through the confirm sheet (Tutup disabled until ticked), change_log
  actions, default PANEL contract unchanged (probe_edits.py, on a STANDALONE clone).
- No horizontal overflow at 1440 and 430 on every screenshotted screen (`overflow 0`); no buttons under 44 px inside the phone
  decision sheet.
- eslint (typescript-eslint no-unused-vars, no-console) clean on all K TS/TSX.

Not proved by any command:
- 390 px width was not screenshotted (430 and 1440 were). Keyboard shortcuts were exercised only in the publish script
  ("r" on 16 rows), not by an assertion in the spec.
- That the Pustaka editor save creates an EDIT version was proved by F (API.md), not re-run by K (it would add a version to the
  AKTIF contract of the shared state). The banner text relies on F's proof.
- "Perlu harga semula" marking of draf projects after Tutup is wave-2 builder P's indicator; K only states it and counts the
  draf projects. Not checked end-to-end.
- AI path with a real binding (button only renders when config says so) is untested; only the hidden case is.
- Visual judgement (Direction C fidelity) is from the screenshots, not a tool.

## Caveats
- **No way to delete/discard a DRAF contract** (no DELETE route; DRAF→DITUTUP refused). The spec therefore leaves its test
  contract as DRAF titled `[E2E selesai] …` (on a preview deploy each run adds one). NEEDS-lead #1. My local state also keeps
  the manual contracts REAL-K-1795275283 (published v2), REAL-K-1795276287 (DRAF import), several `[E2E selesai]` and one closed
  STANDALONE `SA-K-…` contract.
- Draf-project counts come from `GET /projects` client-side (NEEDS-lead #2); `GET /rate-book/versions/:vid` has no
  alternatives, so "Pilih item lain" is a search, not a ranked list (NEEDS-lead #5).
- Phone tab bar has no Kontrak entry (Sidebar `mobile: false`, lead-owned); phones reach it from the Tetapan hub link
  (NEEDS-lead #3).
- The coding-standards checker's 22 "possibly unused import: type …" hits are its known false positive on TypeScript type
  imports (eslint with typescript-eslint is clean). Its 6 unused-import and 2 DRY hits in `pages/AdminSettings.tsx` are at
  pre-existing lines (the base file alone gives 6 unused-import and 4 DRY findings); K added 3 lines there.
- The real workbook was copied to scratch as `master-bq.xls` so its file name never appears on screen or in screenshots; the
  original file was only read.
- The register's light Gantt strip from the d03 concept was not built (legacy contracts have no validity dates); the register
  is a vertical timeline with status rail instead.

## Numbers
```csv
metric,value
spec_checks_passed,21
spec_checks_total,21
spec_runtime_s,4.8
negative_control_fails,4
vitest_passed,70
vitest_skipped,5
tsc_errors,3
screenshots,22
needs_lead_requests,5
```
```csv
real_excel_bucket,count
exact_total,195
sama,145
kadar_berubah,50
perkataan_berubah_pending,154
baharu,116
dibuang,37
priced_rows,465
parse_warnings,0
```
```csv
timing,seconds
real_read_parse,0.45
real_import_and_review_load,1.12
synthetic_spec_total,4.8
```
```csv
file_group,files,lines
components/kontrak (top),14,1168
components/kontrak/import,13,1067
pages/kontrak,1,47
components/admin/settings/KontrakMovedBanner.tsx,1,40
e2e K.spec.py,1,308
pages/AdminSettings.tsx changed lines,1,3
SettingsHub.tsx changed lines,1,12
LibraryMobile.tsx changed lines,1,2
```
