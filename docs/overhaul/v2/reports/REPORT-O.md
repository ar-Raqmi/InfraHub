# REPORT O: Tetapan Organisasi (wave 2)

Worktree `~/Documents/Repo/InfraHub-wt/O`, port 8796, state `~/.hermes/cache/scratch/v2/state-O` (anonymised seed +
migrations + `migrate-legacy` once). No git commands were run. Production was never touched.

## Done

### Inventory: hard-coded values in my files (before snapshot line numbers) → where they live now
| file:line (before) | hard-coded value | now |
|---|---|---|
| services/finance.ts:6-10 | LAD threshold 20000, flat RM20, BLR 6.65, treasury 0.25, effective 6.4 | policies `LAD_SMALL_PROJECT_THRESHOLD`, `LAD_SMALL_PROJECT_DAILY_RATE`, `LAD_BLR_PCT`, `LAD_TREASURY_PCT`, read with `policyAt` on `ladPolicyDate(project)` |
| LADPDFExporter.ts:3,9-11 · LADCertificate.tsx:6,18-20 | imports of the LAD constants | `org.ladPolicy(ladPolicyDate(p))` + `calculateLADDailyRate(sum, policy)` |
| LADPDFExporter.ts:44 · LADCertificate.tsx:68 | `DENDA KELEWATAN MENYIAPKAN KERJA` | `doc.lad.title` |
| LADPDFExporter.ts:142 · LADCertificate.tsx:103 | `Bagi Kontrak bernilai kurang RM 20,000.00 … RM 20.00/hari rata.` / `BLR 6.65 ( Maklumat daripada Bahagian Perolehan )` | `doc.lad.noteSmall` ({{had_lad}}, {{kadar_lad_rata}}), `doc.lad.noteBlr` ({{blr}}, {{unit_perolehan}}) |
| LADPDFExporter.ts:202 · LADCertificate.tsx:137 | `KADAR DENDA (LAD) = RM 20.00 / HARI` | `doc.lad.flatLine` |
| LoCPDFExporter.ts:8 · LoCCertificate.tsx:17 | `locRate = 100` | policy `LOC_DAILY_RATE` on `locPolicyDate(p)` |
| LoCPDFExporter.ts:35,85 · LoCCertificate.tsx:59,78 | `DENDA LEWAT TUNTUTAN (LoC)`, `PENGIRAAN DENDA LEWAT TUNTUTAN` | `doc.loc.title`, `doc.loc.heading` |
| LoCPDFExporter.ts:90-92 · LoCCertificate.tsx:80-82 | 14 hari / hari ke-15 / RM 100.00 rules | `doc.loc.rule1-3` with {{hari_tangguh}} {{hari_mula_denda}} {{kadar_loc}} from `LOC_GRACE_DAYS`, `LOC_DAILY_RATE` |
| LoCPDFExporter.ts:112,128 · LoCCertificate.tsx:91,101 | `- 14 HARI`, `x RM 100.00` | policy values |
| CPCPDFExporter.ts:19 · CPCCertificate.tsx:46 | DLP `+6` months | new policy `DLP_MONTHS` (6) via `dlpPeriod()` |
| CPCPDFExporter.ts:34,38 · CPCCertificate.tsx:73-74 | `KERAJAAN MALAYSIA`, `MAJLIS PERBANDARAN SELAYANG` | `doc.cpc.heading1/2` = {{kerajaan}}, {{NAMA_ORGANISASI}} from `org.profile` |
| CPCPDFExporter.ts:43,48 · CPCCertificate.tsx:76-77 | `PERAKUAN SIAP KERJA`, `(CERTIFICATE OF PRACTICAL COMPLETION)` | `doc.cpc.title/subtitle` |
| CPCPDFExporter.ts:60-67 · CPCCertificate.tsx:85-88 | organisation name + 3 address lines | `org.profile.name`, `org.profile.addressLines` |
| CPCPDFExporter.ts:90,96 · CPCCertificate.tsx:106,111 | CIDB line, `Sebutharga Untuk :` | `doc.cpc.cidb` ({{gred}}), `doc.cpc.sebuthargaLabel` |
| CPCPDFExporter.ts:118-126 · CPCCertificate.tsx:117-124 | certification paragraph (dates bold) | `doc.cpc.body` (placeholders print bold) |
| CPCPDFExporter.ts:160,161,175,189 · CPCCertificate.tsx:130-140 | signature captions | `doc.cpc.signLeft/signLeftRole/signRight/signRightRole` |
| AkuJanjiPDFExporter.ts:37-41 · AkuJanjiEditor.tsx:139-141 | `Pengarah, / Jabatan Kejuruteraan, / Majlis Perbandaran Selayang.` | `doc.aku_janji.recipient` ({{jabatan}}, {{nama_organisasi}}) |
| AkuJanjiPDFExporter.ts:46,60,67,74,79,81 · AkuJanjiEditor.tsx:145-165 | title, 2 paragraphs (`pihak MPS`), `Sekian.`, signatures | `doc.aku_janji.*` ({{nama_ringkas}}, {{tarikh_serah_tapak}}) |
| PrestasiPDFExporter.ts:18 | Selayang seal URL (wikimedia) | `org.logo.src` (default = same URL) |
| PrestasiPDFExporter.ts:29,176-181,274-276,314 · PrestasiCertificate.tsx:210-215 | title, 6 criteria, 3 sign titles, footer with `Bahagian Perolehan, Majlis Perbandaran Selayang` | `doc.prestasi.*` |
| PDFBaseHelper.ts:2-7 | 4 government slogans | `org.profile.slogans` (helper default = same 4) |
| NotisPDFExporter.ts:78,93,99,104,110 | Pemberitahuan title, 3 paragraphs incl. `Majlis Perbandaran Selayang`, `03-61265896`, closing | `doc.notis_pemberitahuan.*` ({{nama_organisasi}}, {{jabatan}}, {{telefon}}) |
| NotisPDFExporter.ts:119,127-129,137 (and 3 more copies) | `Saya yang menjalankan amanah,`, `Jurutera Awam`, `Jabatan Kejuruteraan`, `Majlis Perbandaran Selayang`, `PANEL yyyy-PJA x` | `doc.notis_umum.signOff/signerRole/footer`, `org.profile.department/name` |
| NotisPDFExporter.ts:191,205,219,229,274 (×3 letters) | `Tuan,`, reference sentence, items i)/ii), closing | `doc.notis_umum.*` |
| NotisPDFExporter.ts:172,210,223,233,242 / 337,375,387,397,407 / 500,538,552,562,568-572 | titles, para 2-4, date range of Peringatan 1/2/3 (LAD rate bold) | `doc.notis_peringatan_{1,2,3}.*` ({{tarikh_sst}}, {{kadar_lad}}, …) |
| NotisPDFExporter.ts:656-668,676,713,728-791,833-868 | Kerja Tidak Siap headings, office address, CIDB, 4 bilingual paragraphs, signature, footnotes | `doc.kerja_tidak_siap.*` + `org.profile` |
| NotisPDFExporter.ts:43 | `calculateLADDailyRate(kos)` with constants | dated LAD policy |
| NotisGenerator.tsx:62,65,68,232-235 | notice offsets −7 / +7 / +14 days and their hint texts | policies `NOTIS_PERINGATAN_{1,2,3}_DAYS`; hint generated from the value |
| NotisGenerator.tsx:196 | LAD rate shown with constants | dated LAD policy |
| Login.tsx:45 | (product name, kept) | BrandMark + "InfraHub" stay; new organisation line from `org.profile` + `org.logo` |
| ProjectDetail/ProjectsList BP/Zon/Mukim (not mine) | `BP_OPTIONS`, `ZON_OPTIONS`, `MUKIM_OPTIONS` | lookups `BP`, `ZON`, `MUKIM` editable in Senarai; dropdown wiring requested in NEEDS-lead §6 |
| BQPDFExporter.ts:74-75,95-96,112-113,191 (not mine) | seal + imgur logo, address, Pengarah/Jabatan, MPS committee line | requested in NEEDS-lead §7 |

### Files
- `components/org/org-defaults.json` (new): today's exact printed values: `org.profile`, `org.logo`, 11 `doc.*` text
  groups (80 fields), 2 new policy rules (`DLP_MONTHS` 6, `TEMPOH_KONTRAK_DEFAULT_WEEKS` 0). Runtime fallback, seed source, and
  the source of the migration 0003 SQL.
- `components/org/orgDefaults.ts`: types (`OrgProfile`, `OrgLogo`), text groups with field labels and allowed
  placeholders, placeholder help, policy metadata, lookup list metadata.
- `components/org/template.ts`: `{{slot}}` fill, bold tokens for filled slots, placeholder listing.
- `components/org/orgDocs.ts`: `OrgDocs` (profile, logo, `text()`, `tokens()`, `forProject()`, `number()`,
  `ladPolicy()`, `locPolicy()`; server rules win per key, defaults fill missing keys, dates before the first rule
  use the earliest value), `loadOrgDocs()` (non-React, 30 s cache, falls back to defaults if the API fails) and
  `useOrgDocs(project?)` for previews.
- `components/org/documentVars.ts`: shared LAD/LoC placeholder values and Prestasi criteria.
- `components/org/{orgUi,MockLetterhead,ProfileSection,LogoSection,TextsSection,ListsSection,PoliciesSection,NoticePreview}.tsx`.
- `pages/organisasi/OrganisasiPage.tsx`: admin-only page (others get "Akses terhad"), tabs Profil / Logo /
  Teks dokumen / Senarai / Peraturan (hash-addressable), each section saves through the API and shows its own
  change_log history.
  - Profil: name, short, kerajaan, jabatan, unit perolehan, address lines, phone, email, website, slogans, "cetak
    kepala surat" switch, live mock letterhead.
  - Logo: upload (downscaled PNG data URL, justification below), "guna logo asal", "tanpa logo", letterhead preview.
  - Teks dokumen: 11 text groups (10 documents + the shared notice parts), 80 fields, every field editable, live preview with sample values, insert-placeholder buttons for
    the focused field, unknown-placeholder warning, "pulihkan teks asal".
  - Senarai: BP / Zon / Mukim / Unit; rename label, reorder, deactivate; codes immutable; new codes unique.
  - Peraturan: 12 rules in 4 groups, value + "berkuat kuasa sejak", scheduled values, full history; "tambah nilai
    baharu" refuses an existing date, so history is never edited; "Semak kadar LAD pada sesuatu tarikh" calculator.
- `services/finance.ts`: `calculateLADDailyRate(sum, policy = pre-v2 policy)` via `domain/money.ladDailyRate`,
  `ladPolicyDate`, `locPolicyDate`, `dlpPeriod`. Constants removed (no other user).
- `services/pdf/{CPC,LAD,LoC,AkuJanji,Prestasi,Notis}PDFExporter.ts`, `PDFBaseHelper.ts`: every string and rate
  above comes from `OrgDocs` (optional last parameter, else `loadOrgDocs()`); layout code unchanged. New optional
  printed letterhead (`PDFBaseHelper.drawLetterhead`, off by default) inside the 50 mm headroom the letters already
  leave.
- `pages/{CPC,LAD,LoC,Prestasi}Certificate.tsx`, `NotisGenerator.tsx`, `AkuJanjiEditor.tsx`: previews read the same
  `OrgDocs` and pass it to the exporter, so preview and PDF match. NotisGenerator gained a "Pratonton teks" panel.
  AkuJanjiEditor now passes `String(selectedYear)` (fixes one of the 3 base tsc errors).
- `pages/Login.tsx`: re-skinned to Direction C light (paper, surface card, `Field`/`Input`/`Button`), BrandMark stays
  the product logo, new "Digunakan oleh <organisation>" line with the organisation logo from config.
- `components/org/orgDocs.test.ts`: 11 vitest tests.
- `docs/overhaul/v2/e2e/O.spec.py` (acceptance) and `docs/overhaul/v2/e2e/O_seed_defaults.py` (idempotent seed).
- `docs/overhaul/v2/NEEDS-lead.md`: migration 0003 SQL + 8 requests.

Logo storage choice: `/api/storage/upload` writes into the project photo gallery (needs user/project fields, is
listed and cleaned up there), so a crest does not belong there; the PDF code needs base64 anyway. The logo is a
≤512 px PNG data URL (≤350 kB) in `app_config['org.logo']`.

## Evidence

Build, types, tests (final state):
```
== build
✓ built in 8.95s
== tsc   (count of "error TS"; base is 3)
2
== vitest (repo config)
 Test Files  9 passed | 1 skipped (10)
      Tests  70 passed | 5 skipped (75)
== vitest-org (scratch config including components/org)
 Test Files  1 passed (1)
      Tests  11 passed (11)
```
After the last TextsSection edit: `tsc` 2, vitest 70 passed, org tests 11 passed, `✓ built in 7.15s`.

Seed script (first run, then re-run):
```
seeded 15 item(s)
  config org.profile -> 200
  config org.logo -> 200
  config doc.cpc -> 200
  config doc.aku_janji -> 200
  config doc.notis_umum -> 200
  config doc.notis_pemberitahuan -> 200
  config doc.notis_peringatan_1 -> 200
  config doc.notis_peringatan_2 -> 200
  config doc.notis_peringatan_3 -> 200
  config doc.kerja_tidak_siap -> 200
  config doc.lad -> 200
  config doc.loc -> 200
  config doc.prestasi -> 200
  policy DLP_MONTHS@2020-01-01 -> 201
  policy TEMPOH_KONTRAK_DEFAULT_WEEKS@2020-01-01 -> 201
seeded 0 item(s)
```

Migration 0003 SQL on a copy of the local D1 (all config rows deleted first):
```
app_config rows after 1st run 13 after 2nd run 13 new policy rows 2
```

PDF text parity. Harness: the real exporters run in Chromium from a Vite dev server, once from a snapshot of the
pre-change source (`before`) and once from the worktree; 10 documents (CPC, LAD, LoC, Prestasi, Aku Janji, Notis
Pemberitahuan / Peringatan 1-3 / Kerja Tidak Siap) × 3 projects (1766762503004 small contract with LAD+LoC,
1770257187756 no sebutharga, 1769394624595 with sebutharga), `pdftotext -layout`, `diff -r`:
```
before generated 30 pdfs []
after-fallback generated 30 pdfs []     (config empty: code defaults)
IDENTICAL
after-seeded generated 30 pdfs []       (config seeded through the API)
IDENTICAL
after-e2e generated 30 pdfs []          (after the e2e edited and restored values)
IDENTICAL: 30 documents before vs after-e2e
```
Intended-change run ("another PBT": name, short, address, phone, email, one slogan, letterhead on, uploaded logo),
whitespace-normalised line diff, count = number of documents with that line:
```
## after-fallback: identical=30 different=0
## after-seeded: identical=30 different=0
## after-final: identical=30 different=0
## after-otherpbt: identical=6 different=24
 18 +MAJLIS PERBANDARAN CONTOH
 12 +Jalan Contoh 1, 12345 Bandar Contoh, Negeri Contoh
 12 +Tel: 03-1234 5678 aduan@mpc.gov.my
 12 -“KITASELANGOR MAJU BERSAMA”
 12 -“MALAYSIA MADANI”
 12 -“BERKHIDMAT UNTUK NEGARA”
 12 -“MAMPAN PROGRESIF SEJAHTERA”
 12 +"BERKHIDMAT UNTUK RAKYAT"
 12 -Majlis Perbandaran Selayang
 12 +Majlis Perbandaran Contoh
  6 -MAJLIS PERBANDARAN SELAYANG
  6 -Persiaran 3, Bandar Baru Selayang,
  6 -68100 Batu Caves,
  6 +Jalan Contoh 1,
  6 +12345 Bandar Contoh,
  3 -Majlis Perbandaran Selayang.
  3 +Majlis Perbandaran Contoh.
  3 -Sekiranya kerja-kerja tersebut gagal dimulakan dalam tempoh lima (5) hari, pihak MPS
  3 +Sekiranya kerja-kerja tersebut gagal dimulakan dalam tempoh lima (5) hari, pihak MPC
  3 -Selangor Darul Ehsan
  3 +Negeri Contoh
  3 -Selangor Darul Ehsan.
  3 +Negeri Contoh.
  3 -Adalah dimaklumkan bahawa pihak Majlis Perbandaran Selayang akan
  3 +Adalah dimaklumkan bahawa pihak Majlis Perbandaran Contoh akan melaksanakan
  3 -Kejuruteraan, Majlis Perbandaran Selayang di talian 03-61265896.
  3 +Kejuruteraan, Majlis Perbandaran Contoh di talian 03-1234 5678.
  3 -Sila hantar salinan borang ini ke : Bahagian Perolehan, Majlis Perbandaran Selayang
  3 +Sila hantar salinan borang ini ke : Bahagian Perolehan, Majlis Perbandaran Contoh
```
(trimmed: the rest are the same name/address lines re-wrapped and the `Rujukan … Majlis Perbandaran …` rows.) The 6
identical documents are the LAD and LoC sheets, which print no organisation text. Every changed line is an
organisation field.

Acceptance spec (`env -u PYTHONPATH …/pw/bin/python docs/overhaul/v2/e2e/O.spec.py --base http://localhost:8796 --shots …`):
```
project 1791269175362, BLR today 6.65 -> 7.65 from 2026-11-24
PASS profile short name saved
PASS Peringatan 1 paragraph saved
PASS change_log has the profile save
PASS change_log has the text save
PASS change_log has the policy add
PASS LAD for today uses the old BLR (RM 8.77)
PASS LAD on the effective day uses the new BLR (RM 10.14)
PASS Notis preview shows the new paragraph and short name
PASS pja01 sees Akses terhad
PASS originals restored
```
(The first run used 2026-11-22 = tomorrow: it passed every check up to the LAD check, then failed to find
"Jana Notis" because the button sits on the "2. File Creation (PT)" tab; the spec now opens that tab first. Later
runs take the next free day because the earlier test rows still exist; see Caveats.)

Phone/desktop probe of organisasi.html (horizontal overflow, visible controls < 44 px, inputs < 16 px):
```
430-profil no-overflow scrollW=430 small<44: [] inputs<16px: 0
430-logo no-overflow scrollW=430 small<44: [] inputs<16px: 0
430-teks no-overflow scrollW=430 small<44: [] inputs<16px: 0
430-senarai no-overflow scrollW=430 small<44: [] inputs<16px: 0
430-peraturan no-overflow scrollW=430 small<44: [] inputs<16px: 0
1440-profil no-overflow scrollW=1440 small<44: ['Profil:40', 'Logo:40', 'Teks dokumen:40', 'Senarai:40', 'Peraturan:40'] inputs<16px: 10
1440-logo no-overflow scrollW=1440 small<44: ['Profil:40', 'Logo:40', 'Teks dokumen:40', 'Senarai:40', 'Peraturan:40'] inputs<16px: 0
1440-teks no-overflow scrollW=1440 small<44: ['Profil:40', 'Logo:40', 'Teks dokumen:40', 'Senarai:40', 'Peraturan:40', '{{nama_organisasi}}:32', '{{NAMA_ORGANISASI}}:32', '{{nama_ringkas}}:32', '{{kerajaan}}:32', '{{jabatan}}:32', '{{JABATAN}}:32', '{{telefon}}:32', '{{unit_perolehan}}:32', '{{nama_syarikat}}:32', '{{no_sebutharga}}:32', '{{no_fail}}:32', '{{nama_projek}}:32', '{{gred}}:32', '{{ta   [line cut at 400 chars by my viewer]
1440-senarai no-overflow scrollW=1440 small<44: ['Profil:40', 'Logo:40', 'Teks dokumen:40', 'Senarai:40', 'Peraturan:40', 'BP:40', 'Zon:40', 'Mukim:40', 'Unit:40'] inputs<16px: 12
1440-peraturan no-overflow scrollW=1440 small<44: ['Profil:40', 'Logo:40', 'Teks dokumen:40', 'Senarai:40', 'Peraturan:40'] inputs<16px: 6
```
Desktop sizes (40 px tabs, 32 px placeholder chips, 15 px inputs) are the primitives' own `md:` sizes. Text fields at
430 after the autosize fix: `clipped: [] of 11`.

Coding standards (`coding_standards_check.py --files <31 files>`), raw head:
```
coding-standards check — 31 file(s)
  [external] compileall (ruff absent): ok
  [external] eslint: ok
      skipped (eslint not installed locally)
  [clean-code] 34 finding(s)
      components/org/orgDefaults.ts:4  possibly unused import: type PolicyRule
      components/org/orgDocs.ts:2  possibly unused import: type LadPolicy
      components/org/orgDocs.ts:2  possibly unused import: type LocPolicy
      components/org/orgDocs.ts:2  possibly unused import: type PolicyRule
      components/org/orgDocs.ts:5  possibly unused import: type
      components/org/orgDocs.ts:6  possibly unused import: type DocTexts
      ...
  [DRY] 34 finding(s)
      24 tokens repeated in 2 places
      ...
```

Screenshots in `docs/overhaul/v2/reports/img/O/`: 00-01 login before, 02-03 login after, 04-13 every section at
1440 and 430, 14 letterhead before/after (Notis P1 + Prestasi), 15 pja01 "Akses terhad", 16 e2e Notis preview,
17 e2e LAD check, 18 e2e Peraturan after save.

## Verified vs unverified
Verified by the commands above:
- Day-one parity: all 30 generated documents have identical `pdftotext` output before/after, with config empty, with
  config seeded, and after the e2e restored its values.
- Config changes reach the PDFs, and only organisation lines change (the intended-change diff).
- policyAt behaviour: a new BLR value does not change the LAD rate for an earlier date (e2e + unit test).
- Every save from the page lands in change_log (e2e checks the profile, text and policy entries).
- pja01 cannot use organisasi.html (sees "Akses terhad"; page content absent).
- Seed script and migration SQL are idempotent.
- 430/1440: no horizontal overflow; no phone control under 44 px; no phone input under 16 px.
- Build green, tsc 2 (base 3), vitest 70 + 11 green.

Not verified / only partly:
- The CPC certificate *preview* (modal) was not opened by the e2e: it is gated by Pelarasan data in ProjectDetail.
  CPC text parity is proven on the PDF; the CPC preview uses the same `OrgDocs` calls but no check opened it.
- The Aku Janji, LAD, LoC and Prestasi previews were not opened in a browser after the change (they share the code
  path with the PDFs, which were compared).
- The Senarai save and the logo upload were not run by the e2e. Screens render, and the API routes are F's tested
  routes, but no script saved a lookup list or uploaded a logo through the UI. The logo in the letterhead comparison
  was set through the API.
- The access guard is client-side only; the config API itself is not role-checked (auth is out of scope).
- Phone layout was checked at 430 only, not 390/360 (organisasi is a desktop/admin screen, not on the phone tab bar).
- Login re-skin: screenshots only; logging in through the new form was not scripted (the e2e logs in through the API).

## Caveats
- **Parity kept known quirks on purpose**: the defaults reproduce today's text exactly, including
  `sebanyakRM20.00/hari` (missing space, Peringatan 1/2), `dalam tempohtujuh (7) hari` (Peringatan 3),
  `i.e.RM…` and `Gred" G1"`. They are now one edit away in Teks dokumen; the owner decides.
- Preview-only differences (not on paper): the Aku Janji preview lost a trailing full stop that the PDF never had;
  the CPC preview uses normal spaces instead of `&nbsp;` around dates; LoC rules show their own numbers instead of an
  `<ol>`.
- No DELETE for policies, and `POST /policies` upserts (NEEDS-lead §3). The UI refuses a date that already exists.
  The e2e "restores" by posting the old value on its test date, so each run leaves one inert row and moves to the
  next free day.
- The LAD rule date (`ladPolicyDate` = contract start first) is my choice. The stored `ladAmount` in ProjectDetail
  (P2) must use the same date (NEEDS-lead §8).
- Uploaded logos are drawn into the existing fixed boxes (Prestasi 24×20 mm, letterhead 22×22 mm), so a non-square
  logo is stretched. The default seal prints exactly as before.
- BQPDFExporter and the BP/Zon/Mukim dropdowns are outside my files; they are still hard-coded (NEEDS-lead §6-7).
- The "Unit" lookup list starts empty: nothing used a unit list before, and "units" in the brief was ambiguous.
- `components/org/orgDocs.test.ts` is not in the repo vitest `include` yet (NEEDS-lead §5).
- Coding-standards "possibly unused import: type X" findings are false positives (inline `type` imports). The DRY
  findings are mostly the repeated letter blocks in NotisPDFExporter, which I did not restructure so the layout
  stays identical.
- Local state now holds extra `LAD_BLR_PCT` rows for 2026-11-22/23/24 with value 6.65 (inert e2e residue), local only.

## Numbers
```csv
metric,value
documents_compared,30
document_types,10
sample_projects,3
parity_identical_fallback,30
parity_identical_seeded,30
parity_identical_after_e2e,30
intended_change_docs_changed,24
intended_change_docs_unchanged,6
e2e_checks_passed,10
e2e_checks_failed,0
vitest_repo_passed,70
vitest_org_passed,11
tsc_errors_before,3
tsc_errors_after,2
config_keys_seeded,13
policy_rules_added,2
doc_text_groups,11
editable_text_fields,80
profile_fields,11
policy_rules_editable,12
lookup_lists,4
screenshots,19
```
```csv
file,status,lines_now,added,removed
components/org/org-defaults.json,new,150,150,0
components/org/template.ts,new,38,38,0
components/org/orgDefaults.ts,new,158,158,0
components/org/orgDocs.ts,new,121,121,0
components/org/documentVars.ts,new,24,24,0
components/org/orgUi.tsx,new,110,110,0
components/org/MockLetterhead.tsx,new,40,40,0
components/org/ProfileSection.tsx,new,83,83,0
components/org/LogoSection.tsx,new,93,93,0
components/org/TextsSection.tsx,new,131,131,0
components/org/ListsSection.tsx,new,112,112,0
components/org/PoliciesSection.tsx,new,168,168,0
components/org/NoticePreview.tsx,new,54,54,0
components/org/orgDocs.test.ts,new,76,76,0
pages/organisasi/OrganisasiPage.tsx,modified,83,80,5
pages/Login.tsx,modified,115,55,59
services/finance.ts,modified,32,29,20
services/pdf/PDFBaseHelper.ts,modified,85,26,13
services/pdf/CPCPDFExporter.ts,modified,176,24,45
services/pdf/LADPDFExporter.ts,modified,250,15,14
services/pdf/LoCPDFExporter.ts,modified,142,14,14
services/pdf/AkuJanjiPDFExporter.ts,modified,122,15,12
services/pdf/PrestasiPDFExporter.ts,modified,310,10,18
services/pdf/NotisPDFExporter.ts,modified,861,106,120
pages/CPCCertificate.tsx,modified,139,28,40
pages/LADCertificate.tsx,modified,162,17,16
pages/LoCCertificate.tsx,modified,119,17,12
pages/PrestasiCertificate.tsx,modified,258,5,9
pages/NotisGenerator.tsx,modified,294,27,18
pages/AkuJanjiEditor.tsx,modified,209,13,11
docs/overhaul/v2/e2e/O.spec.py,new,240,240,0
docs/overhaul/v2/e2e/O_seed_defaults.py,new,80,80,0
```
