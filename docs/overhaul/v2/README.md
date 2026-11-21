# InfraHub v2 overhaul (branch `overhaul/v2`)

**Start here:** [`InfraHub-v2-Build-Report.pdf`](InfraHub-v2-Build-Report.pdf) (44 pages, A4): what six sub-Yiyis
built on this branch, how each part was proved, and the questions left for the owner (chapter 90).

| Chapters | What they cover |
|---|---|
| 01 | Read me first: what exists, what is proven, what needs a decision |
| 02–03 | The new model (a sebutharga owns versioned rate books) and how the work was split |
| 04–09 | One chapter per sub-Yiyi: F foundation, D design system, P2 project + BQ, K Kontrak + Excel import, O Tetapan Organisasi, P1 dashboard + report scope |
| 10–12 | Lead integration fixes, the proof (local and live preview, production untouched), cost and process |
| 90 | Decisions for you: 7 main and 7 smaller questions, each with its default |
| 99 | Commits, file map, how to run and deploy the preview, glossary |

## Folder
- `CONTRACT.md`: the build contract (data model, modules, API, ownership, design rules).
- `WAVE2.md`, `NEEDS-lead.md`, `API.md`, `DESIGN.md`: wave brief, builder requests with lead resolutions, API and design notes.
- `BUILD-REPORT-SPEC.md`: the brief for the report itself.
- `reports/`: each sub-Yiyi's `REPORT-*.md` (raw evidence) and `PROGRESS-*.md`, `LEAD-FACTS.md` (lead-verified numbers), screenshots in `img/`.
- `e2e/`: the Playwright specs (`O`, `K`, `P1`, `P2`) and the money-parity script; run with `--base <url>`.
- `tools/`: `bootstrap-local.sh` (anonymised seed + migrations into a local state) and `deploy-v2-preview.sh`
  (isolated preview: its own Pages project, D1 and R2; refuses production names and ids).
- `report-src/`: HTML/CSS/SVG source of the PDF. Run `python3 fetch_fonts.py` once (fonts are not committed), then
  `build.py --no-charts` (charts: `charts_r1.py`, `charts_r2.py`).

## Data and privacy
- Every screenshot and test ran on the anonymised dev seed ("Pentadbir 01", "PJA 01", "Syarikat 01…63").
- Production (`infra-hub`, `infrahub-db`, `infrahub-bucket`) was not touched. The live preview is
  `https://infrahub-v2-preview.pages.dev` with its own database and bucket.
- Security stays out of scope, as in the discovery round.
