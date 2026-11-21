# BUILD-REPORT-SPEC — the InfraHub v2 Build Report (PDF)

The owner (ar-Raqmi) asked for a report on each sub-Yiyi's work, in **the same formatting and style as the
Discovery Report** (`docs/overhaul/InfraHub-Overhaul-Discovery-Report.pdf`): screenshots, typography, graphs.
He reads it on a phone and a laptop to understand what was built and to decide what to change next.

## Output
- `docs/overhaul/v2/InfraHub-v2-Build-Report.pdf` (A4). Source in `docs/overhaul/v2/report-src/`.
- Target 34–44 pages. Every page full but never overflowing (build.py layout checks all 0).

## Toolkit (reuse, do not reinvent)
`docs/overhaul/report-src/` has `build.py`, `report.css`, `svgkit.py`, `charts.py`, `diagrams.py`,
`contact.py`, fonts and `TEMPLATE-NOTES.md`. **Read TEMPLATE-NOTES.md first**: page anatomy, opener bands,
every reusable class, the font-glyph pitfall (no → ≈ ≥ ✕ Σ), the six layout checks. Same fonts (Zodiak,
General Sans, JetBrains Mono), same palette, same tags (`.tag.v` Verified / `.tag.i` Inference / `.tag.q`
Needs your answer). Purple = contract things only.

## Sources of truth (quote, never invent)
1. `docs/overhaul/v2/reports/LEAD-FACTS.md` — timeline, per-sub-Yiyi cost table, merged gate, e2e matrix,
   isolation proof, lead integration fixes, real-Excel numbers, open questions. Lead-verified.
2. `docs/overhaul/v2/reports/REPORT-<F|D|K|O|P1|P2>.md` — each sub-Yiyi's own report (Evidence = raw output).
3. `docs/overhaul/v2/CONTRACT.md` (the build contract), `NEEDS-lead.md` (requests and lead resolutions).
4. Screenshots: `docs/overhaul/v2/reports/img/<F|D|K|O|P1|P2|lead>/` (all taken on the anonymised dev seed).
   You may take NEW screenshots from the live isolated preview `https://infrahub-v2-preview.pages.dev`
   (anonymised data; log in as admin01 / pja01 — password on line 2 of
   `~/Documents/InfraHub-backups/dev-seed/CREDS.txt`; never print or commit it; send header
   `User-Agent: InfraHub-v2-e2e/1.0` for API calls; never create, edit or delete data there).
If a number is not in these sources, leave it out. Separate Verified from Inference with the tags.

## Voice
English, plain language, short sentences, for an engineer-owner who is not a frontend specialist. Titles of
figures state the insight ("Every spec passes on the live preview"), not a label ("E2E results").
No marketing words, no "seamless/robust/leverage". Malay UI terms stay as they are (Sebutharga, Buku Kadar,
Perlu harga semula, Tetapan Organisasi) with a short English gloss the first time.

## Chapters (filename order = page order)
| File | Owner | Content |
|---|---|---|
| `00-cover.html` | R1 | Cover: "InfraHub v2 — Build Report", date 22 Nov 2026, branch `overhaul/v2`, one designed cover figure |
| `01-read-me-first.html` | R1 | One-page answer (what exists now, what is proven, what needs his decision) + contents with `{{page:NN}}` |
| `02-the-new-model.html` | R1 | Before/after: one year-less master BQ vs sebutharga-owned, versioned rate books; the 4 owner decisions (CONTRACT.md); a lifecycle diagram (DRAF → AKTIF → DITUTUP; new project defaults to AKTIF; swap + re-price; lock at No. Inden) |
| `03-team-and-method.html` | R1 | How the work was split: lead + 6 sub-Yiyis, 2 waves, one worktree each, the build contract, file ownership, report contract; a Gantt-style timeline figure from LEAD-FACTS; cost/time chart per sub-Yiyi |
| `04-F-foundation.html` | R1 | Sub-Yiyi chapter (template below) |
| `05-D-design-system.html` | R1 | Sub-Yiyi chapter |
| `06-P2-project-and-bq.html` | R1 | Sub-Yiyi chapter |
| `07-K-kontrak-import.html` | R2 | Sub-Yiyi chapter (real Excel numbers: 195 / 154 / 116 / 37) |
| `08-O-organisasi.html` | R2 | Sub-Yiyi chapter (no hard-coding; PDF parity method) |
| `09-P1-dashboard-reports.html` | R2 | Sub-Yiyi chapter (report scope by sebutharga / year / custom) |
| `10-lead-integration.html` | R2 | The 10 cross-builder fixes from LEAD-FACTS ("one rule, one place" theme) |
| `11-proof.html` | R2 | E2E matrix local vs live preview, money parity, isolation proof (prod untouched), how to re-run |
| `12-cost-and-process.html` | R2 | Tokens, wall time, API-price estimate vs plan quota; what went wrong and was caught (spec drift, 1010, ignored migrations) |
| `90-decisions-for-you.html` | R2 | The open questions from LEAD-FACTS as a checklist (`.checks`), each with the default chosen and what changes if he picks otherwise |
| `99-appendix.html` | R2 | Commit list, file map, how to run locally, how to deploy the preview, glossary |

### Sub-Yiyi chapter template (2–4 pages each)
1. Opener band: kicker "Sub-Yiyi F · Foundation", a strong title, a dek with what it was asked.
2. A stat strip: wall time, API calls, est. cost (LEAD-FACTS), tests added, and its spec result.
3. "What it built": screenshots (before/after where they exist), each with an insight title and caption.
4. "How it was proved": 1 chart or table from its REPORT Evidence (raw numbers), plus the negative control
   if it ran one (a check that was shown able to fail).
5. "What it could not check" (`.tag.i`) and "What the lead changed after merging" (from LEAD-FACTS / NEEDS-lead).

## Split and ownership (two report builders in parallel)
- R1 builds in `~/.hermes/cache/scratch/v2/report/R1/`, R2 in `.../R2/`: each a **copy** of
  `docs/overhaul/report-src/` with the discovery chapters deleted. Each writes only its own chapter files and
  SVGs named `r1_*.svg` / `r2_*.svg` (chart code in `charts_r1.py` / `charts_r2.py`, called from its own copy of
  `charts.py`). New CSS goes only at the end of `report.css` inside `/* ---- R1 additions ---- */` (or R2).
- For a standalone build, a builder may add one-page placeholder chapters for the other builder's numbers
  (files named `zz-stub-NN.html`, deleted before finishing) so `{{page:NN}}` resolves.
- The lead merges both into `docs/overhaul/v2/report-src/`, runs the full build, reviews every page and commits.
- Builders run no git and never edit files in the repo except their own `PROGRESS-<R1|R2>.md` /
  `REPORT-<R1|R2>.md` in `docs/overhaul/v2/reports/`.

## Done means
- Own chapters build with all six layout checks = 0; `pdffonts` shows no fallback fonts.
- Every page viewed by you (`pdftoppm -r 60` + `contact.py` sheets) and fixed.
- No real person's or company's name anywhere (the data is the anonymised seed; check any new screenshot).
- REPORT-<R1|R2>.md with raw build-check output and a list of anything left unverified.
