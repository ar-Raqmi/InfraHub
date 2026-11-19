# InfraHub overhaul: discovery (Nov 2026)

This branch (`overhaul/discovery-2026-11`) is for **understanding and discussion only**. No app code was changed.

**Start here:** [`InfraHub-Overhaul-Discovery-Report.pdf`](InfraHub-Overhaul-Discovery-Report.pdf) (43 pages, A4).

| Chapters | What they cover |
|---|---|
| 01 | Read me first: the six things to know and the one decision |
| 02–05 | The system, the 6-status pipeline, the pipeline in numbers, money rules |
| 06–09 | The BQ / master-BQ / contract question, what a master BQ really is, four fixes (A–D), recommendation and roadmap |
| 10 | Today's UI, honestly: an audit with anonymised screenshots |
| 11–14 | Three UI/UX directions (Saluran, Lejar, Tapak) and how to choose between them |
| 90 | 31 questions only ar-Raqmi can answer: a checklist to annotate |
| 99 | Method, privacy, sources |

## Folder

- `findings/`: the sanitised working findings behind the report:
  - `FINDINGS-bq.md`: BQ and contract forensics, options and recommendation
  - `FINDINGS-system.md`: architecture, pipeline and live measurements
  - `AUDIT-ux.md`: the UI audit
  - `CONCEPTS-ux.md`: the three UI/UX directions
- `concepts/`: the three UI/UX directions as static mockups (`A/`, `B/`, `C/`, plus one board each). All data in them is fictional.
- `report-src/`: the HTML/CSS/SVG source of the PDF, with chapters, charts and the `build.py` pipeline.
  - Fonts (Zodiak and General Sans from Fontshare, JetBrains Mono from Google Fonts) and the aggregate CSVs are not committed.
  - `build.py` expects them in the scratch build folder, so the PDF is the artefact of record.

## Data and privacy

- All numbers come from a read-only snapshot of live D1, taken 2026-11-20 06:46 +08 and analysed on a local copy.
- This repo is public, so only aggregates appear here: no staff names, contractor names or contact details.
- Avatars in the screenshots are covered.
- Security is out of scope for this round.
