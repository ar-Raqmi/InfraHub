# LEAD-FACTS — verified numbers for the v2 build report

Every number here was produced by a command the lead ran. Report writers quote these verbatim and must not
recompute or embellish them. Sub-Yiyi facts live in each `REPORT-<name>.md`. Builders' own numbers that the lead
re-ran on the merged code are marked **re-run**.

## Timeline (2026-11-21 → 22, Asia/Kuala_Lumpur)
| Time | Event |
|---|---|
| 21 Nov 22:16 | Production D1 backup `20261121-221650`; restore test PASS; `CODE-RED.md` runbook written |
| 22:26 | `docs/overhaul/v2/CONTRACT.md` committed (ac026945) — the build contract every builder follows |
| 22:30 | Wave 1 dispatched: **F** (foundation) and **D** (design system), each in its own git worktree |
| 22:49 | D merged |
| 23:05 | F merged |
| 23:14 | Wave 2 dispatched: **K** (Kontrak + Excel import), **P1** (dashboard + list + report scope), **P2** (project detail + BQ binding), **O** (Tetapan Organisasi) |
| 23:57 | P2 merged |
| 22 Nov 00:06 | O merged |
| 00:19 | K merged |
| 00:24 | P1 merged |
| 00:33 | Isolated Cloudflare preview deployed (`infrahub-v2-preview`) |
| 00:36 | Every builder spec passes on the live preview |

## Sub-Yiyis (from Hermes state.db via build_run_files.py runlog; model claude-opus-5-5)
| Name | Job | Wall time | API calls | Output tokens | Cache read | Est. API-price cost |
|---|---|---:|---:|---:|---:|---:|
| F | Foundation: data model, migrations, domain layer, Excel parser, API | 37 min (2,223 s) | 114 | 195,805 | 25.6 M | $10.90 |
| D | Design system: Direction C light, fonts, tokens, UI kit, shell | 19 min (1,164 s) | 58 | 85,981 | 8.4 M | $4.45 |
| K | Kontrak & Buku Kadar + Excel import wizard | 56 min (3,358 s) | 129 | 164,706 | 27.7 M | $10.60 |
| P1 | Dashboard, projects list, report scope | 56 min (3,364 s) | 124 | 162,724 | 36.0 M | $12.51 |
| P2 | Project detail + BQ bound to its sebutharga | 39 min (2,341 s) | 124 | 121,011 | 28.6 M | $9.83 |
| O | Tetapan Organisasi (no hard-coding) | 51 min (3,032 s) | 132 | 169,208 | 31.7 M | $11.59 |
| Lead (Yiyi) | Whole conversation **including the 20 Nov discovery round** | — | 309 | 241,937 | 81.1 M | $41.73 |
| **Total** | | | **990** | **1,141,372** | **239.1 M** | **$101.61** |

Cost is Hermes' estimated API list price. The work ran on the Claude plan, which is billed in plan quota, not
dollars. Plan quota readings (`hermes usage`): Wave 1 start = session 9 %, week 5 %. Wave 2 start = session 28 %,
week 8 %. After merge + preview = session 72 %, week 13 %.

## Branch
- `overhaul/v2`: 31 commits on top of `main`; app code (excluding docs): 215 files changed, +13,460 / −3,279 lines.
- Gate on the merged code (**re-run**): `vitest` 104 passed, 5 skipped (109); `npm run build` exit 0;
  `tsc --noEmit` 2 errors, both pre-existing in `pages/ImageReportGenerator.tsx` (main had 3; O fixed one).

## End-to-end proof on the merged code
| Spec | Local merged server :8790 | Live isolated preview (infrahub-v2-preview.pages.dev) |
|---|---|---|
| O (organisasi) | 10/10 | 10/10 |
| K (kontrak + import) | 21/21 | 21/21 |
| P1 (dashboard + list + scope) | 21/21 | 21/21 |
| P2 (project + BQ binding) | 19/19 | 19/19 |
| Money parity (P2 script, old inline rules vs new policy-fed rules) | 490 projects, 2,940 fields, 0 diffs; 6,860 synthetic cases, 0 diffs | same: 0 / 0 |

First run on the merged code: O and P2 failed because their specs used selectors from before the merge
(phase tabs became `role="tab"` in P2's stepper; an issued No. Inden now hides the re-price banner). Specs were
updated, not the app. First run on the preview: every spec got HTTP 403 "error code: 1010" — Cloudflare's
browser-integrity check refuses Python's default urllib user agent. Fixed by one shared `e2e_http.USER_AGENT`.
Every spec now deletes the test contract it creates; contract count before and after a full run: 3 and 3.

## Isolation proof (production untouched)
- A branch preview of the existing `infra-hub` Pages project would have bound the **production** D1 and R2
  (its wrangler.toml has no `[env.preview]`). So the preview is a **separate Pages project** with its **own D1**
  (`infrahub-v2-preview-db`) and **own R2** (`infrahub-v2-preview-bucket`), deployed by
  `docs/overhaul/v2/tools/deploy-v2-preview.sh`, which refuses any name without `v2-preview` and refuses the
  production database id.
- Production after the run: `infra-hub` latest deployment is still `567c83c` from 2 days earlier;
  `infrahub-db` still has **8 tables** (none of the v2 tables). Preview DB: **19 tables**.
- Preview data = the anonymised dev seed (staff "Pentadbir 01 / PJA 01…", companies "Syarikat 01…63").
- Legacy migration on the preview: 3 contracts (MPS/SH/302/25 AKTIF), 63 companies, 60 panel rows,
  207 rate-book groups, 36 lookup values, 12 policy rules, 490/490 projects linked, 1,362 rows changed —
  identical to the local run.

## Lead integration fixes (things no single builder could see)
| # | Problem found when merging | Fix | Proof |
|---|---|---|---|
| 1 | P2 (form) and O (certificates) each chose the date that decides the LAD rate differently → a stored amount and a printed certificate could disagree | One rule in `domain/policy` (`ladPolicyDate`, `locPolicyDate`, `clampToRules`) used by both | Money parity 0 diffs over 490 projects + 6,860 synthetic cases |
| 2 | BQ cover letter still hard-coded the council name, address, phone, logo | New `doc.bq` text group in Tetapan Organisasi | pdftotext of 3 projects before vs after: identical; a changed name changes exactly the 2 edited lines |
| 3 | Policy history could be overwritten (POST on an existing date replaced it), no delete | 409 on an existing (rule, date); DELETE only for a value not yet in force | duplicate → 409, withdraw future → 200, withdraw in-force → 409, missing → 404 |
| 4 | Uploading the organisation logo copied ~0.7 MB into the change log every time | Images summarised as `[imej N aksara]` in the log | 5,022-char logo → 77-char log entry |
| 5 | Three builders each defined "needs re-pricing" differently (K: draf only; P1: draf + menunggu lantikan; P2: draf only) and none respected an issued No. Inden | One rule `domain/repricing` used by close sheet, project banner, dashboard, list and the API stat | unit tests; live seed: MPS/SH/302/25 = 65 re-priceable projects |
| 6 | No way to remove a test or mistaken contract | `DELETE /contracts/:id` (refused for AKTIF or used contracts) + a Padam button shown only when allowed | K, P1, P2 specs now clean up; count 3 → 3 |
| 7 | `POST /projects` without `bp` crashed with 500 | Omitted NOT NULL fields stored as '' (the form already sends '' and 5 live projects have bp = '') | — |
| 8 | O's 11 tests and P1's 18 tests were outside the test gate | vitest include `components/**/*.test.ts` | 70 → 104 tests |
| 9 | BP / Zon / Mukim dropdowns in ProjectDetail still hard-coded | `useLookupOptions(list, fallback)`; Zon sort follows the Senarai order | — |
| 10 | `.gitignore` `*.sql` had silently excluded the migrations folder | `!migrations/*.sql` | migrations apply on a fresh state |

## Real master BQ Excel (the officer's file) through the importer
| Book | Bills | Groups | Items | Variants | Priced rows | Warnings |
|---|---:|---:|---:|---:|---:|---:|
| KESELURUHAN sheet | 16 | 98 | 174 | 342 | 465 / 465 | 0 |
| 16 category sheets | 16 | 109 | 201 | 359 | 508 / 508 | 0 |
KESELURUHAN (KONTRAKTOR column) vs today's Pustaka: **195 exact, 154 reworded (suggested, officer decides),
116 new, 37 removed**. Parsed in the browser in 0.45 s.

## Open questions for the owner (carry into the "Decisions for you" chapter)
1. LAD rate date: the contract start date decides the rate (fallbacks: lantikan → serah tapak → tamat → buka). Keep?
2. Today's wording mistakes are kept for parity (`sebanyakRM20.00/hari`, `dalam tempohtujuh (7) hari`, `Gred" G1"`); each is one edit in Teks dokumen.
3. Import rate column defaults to KONTRAKTOR; KESELURUHAN vs category sheets — which is the 2026 book?
4. Company cap is a warning only (per sebutharga). Keep?
5. Unlocking a project with a No. Inden is allowed and logged. Should only PT/Admin unlock?
6. AI-assisted import stays off (deterministic parser = 0 warnings). Revisit later?
7. Go-live path: production D1 migration plan + backup, when the owner approves (not done; production untouched).
