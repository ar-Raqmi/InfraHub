# REPORT-R2: build report chapters 07-12, 90, 99

Build folder: `~/.hermes/cache/scratch/v2/report/R2/` (scratch, not in the repo). Output: `R2.pdf`, 24 pages, A4. No git command was run
except the read-only `git log --oneline main..overhaul/v2` that the brief allows. R1's folder was not touched.

## Done
Files in the build folder (all new unless marked):
- `chapters/07-K-kontrak-import.html` (4 pages, purple opener): K's stat strip, register and phone screenshots, the 5-step import wizard figure, the review screens on the real file, the five review buckets, the "195 / 154 / 116 / 37" chart, the real-Excel table (KESELURUHAN vs 16 category sheets), K's negative control, the Tutup / version-log / Tetapan before-after screens, "what K could not check", "what the lead changed".
- `chapters/08-O-organisasi.html` (4 pages, emerald opener): hard-code inventory grouped, the five Tetapan tabs (desktop and 430 px), the 30-document parity grid, the "another PBT" letterhead before/after and its changed-line counts, the acceptance spec, login before/after, gate table, unverified list, lead changes.
- `chapters/09-P1-dashboard-reports.html` (4 pages, emerald opener): dashboard before/after, phone "Hari ini", pipeline counts = API, "Perlu harga semula", projects list before/after, Skop laporan, vote summary, the mutation check chart and raw FAIL/PASS lines, company cap, line-count chart, unverified, lead changes.
- `chapters/10-lead-integration.html` (2 pages, ink opener): two "one rule, one place" diagrams (LAD date, re-pricing), the ten fixes table, three small proof cards.
- `chapters/11-proof.html` (3 pages, emerald opener): e2e matrix (O 10, K 21, P1 21, P2 19 on local and preview), what failed first (spec drift, error 1010), money parity with raw log, negative controls table, isolation proof, legacy-migration numbers, how to re-run, gate table, what the proof does not cover.
- `chapters/12-cost-and-process.html` (2 pages, ink opener): per-sub-Yiyi table, cost and wall-time charts, plan-quota chart, "what went wrong and what caught it" table, three habits.
- `chapters/90-decisions-for-you.html` (2 pages): 14 `.checks` items (the 7 open questions of LEAD-FACTS, then 7 smaller ones from REPORT-K/O/P1), each with the default and what changes otherwise.
- `chapters/99-appendix.html` (3 pages): 32-commit list, file map, run-locally and deploy-preview commands, 34-term glossary, sources note.
- `charts_r2.py` + `charts/r2_*.svg` (13 SVGs: `r2_k_books`, `r2_k_flow`, `r2_o_parity`, `r2_p1_pipeline`, `r2_p1_mutation`, `r2_p1_lines`, `r2_hub_policy`, `r2_hub_reprice`, `r2_proof_matrix`, `r2_iso`, `r2_cost`, `r2_wall`, `r2_quota`).
- `crops.py` + `img/r2_*.png` (7 pre-cropped screenshots from `img-v2/`; cropping is done in the PNG so no CSS `overflow:hidden` is needed).
- `report.css` (modified): block `/* ---- R2 additions ---- */` at the end (`.strip5/.strip4`, `.cmd`, `.pair`, `.phones.p2/p3`, `table.log`, `.gl`, `.hash`, `.filemap`, `.fig.sp-1..4`, `.bignum`, `.rule-top`, small table cell classes).
- `build.py` (modified): `REPORT_NAME` = "InfraHub v2 · Build report" and the HTML title, so the folio reads the right report name.
- `b.sh`, `montage.py`, `refsheet.py`: my local helpers (not needed in the merge).
- Repo files written: `docs/overhaul/v2/reports/PROGRESS-R2.md` (6 lines) and this file.

Chapter pages in the standalone build: 07 = p1-4, 08 = p5-8, 09 = p9-12, 10 = p13-14, 11 = p15-17, 12 = p18-19, 90 = p20-21, 99 = p22-24.

## Evidence
Final build, raw (`charts_r2.py` then `build.py --no-charts`, the commands from the brief):
```
$ env -u PYTHONPATH .../pw/bin/python charts_r2.py && REPORT_PDF=R2.pdf env -u PYTHONPATH .../pw/bin/python build.py --no-charts
wrote ['r2_cost.svg', 'r2_hub_policy.svg', 'r2_hub_reprice.svg', 'r2_iso.svg', 'r2_k_books.svg', 'r2_k_flow.svg', 'r2_o_parity.svg', 'r2_p1_lines.svg', 'r2_p1_mutation.svg', 'r2_p1_pipeline.svg', 'r2_proof_matrix.svg', 'r2_quota.svg', 'r2_wall.svg']
report.html: 24 pages; chapter starts {'07': 1, '08': 5, '09': 9, '10': 13, '11': 15, '12': 18, '90': 20, '99': 22}
check pageOverflow: 0
check outOfPage: 0
check intoFooter: 0
check clipped: 0
check svgOverlap: 0
check svgOut: 0
fonts loaded: ['General Sans 400', 'General Sans 500', 'General Sans 600', 'General Sans 700', 'JetBrains Mono 400 800', 'Zodiak 700', 'Zodiak 800']
pdf: /home/rezephyr/.hermes/cache/scratch/v2/report/R2/R2.pdf 5540385 bytes
```
PDF facts:
```
$ pdfinfo R2.pdf | grep -E "Pages|Page size|File size"
Pages:           24
Page size:       594.96 x 841.92 pts (A4)
File size:       5540385 bytes
$ pdffonts R2.pdf | grep -v JetBrainsMono
name                                 type              encoding         emb sub uni object ID
------------------------------------ ----------------- ---------------- --- --- --- ---------
AAAAAA+false                         CID TrueType      Identity-H       yes yes yes      4  0
CAAAAA+false                         CID TrueType      Identity-H       yes yes yes      9  0
DAAAAA+false                         CID TrueType      Identity-H       yes yes yes     10  0
EAAAAA+false                         CID TrueType      Identity-H       yes yes yes     11  0
FAAAAA+false                         CID TrueType      Identity-H       yes yes yes     12  0
LAAAAA+false                         CID TrueType      Identity-H       yes yes yes     24  0
$ pdffonts R2.pdf | grep -c -i "times\|arial\|noto"
0
$ pdftotext R2.pdf - | grep -c -i -E "selayang|syafiq|daniel"
0
$ ls chapters | grep -c zz-stub
0
```
(An earlier build showed `TimesNewRomanPS-BoldMT` in `pdffonts`: the glyphs `→`, `≤` and `−` are not in the bundled fonts. They were replaced by "to", "up to" and "-"; the list above is the rebuilt PDF.)

Source numbers re-counted from the raw merged-run logs (`~/.hermes/cache/scratch/v2/merged-e2e/`), and sums used in the text:
```
K local PASS=21 FAIL=0 | preview PASS=21 FAIL=0
O local PASS=10 FAIL=0 | preview PASS=10 FAIL=0
P1 local PASS=21 FAIL=0 | preview PASS=21 FAIL=0
P2 local PASS=19 FAIL=0 | preview PASS=19 FAIL=0
21/21 checks passed in 4.4s
21/21 checks passed in 8.6s
21/21 checks passed
21/21 checks passed
19/19 checks passed
19/19 checks passed
projects=490 fields_compared=2940 diffs=0
synthetic_sweep_cases=6860 synthetic_sweep_diffs=0
projects_with_lad_days=31 projects_with_loc_days=0 projects_with_pelarasan=359
info: stored_values_differ_from_old_formula=9 (both paths recompute them identically)
--- git log count (git log --oneline main..overhaul/v2 | wc -l)
32
--- REPORT-O inventory data rows (awk, includes the |---| line)
33
--- sums: 195+154+37, 195+154+116, 10+21+21+19, 2*(10+21+21+19), 37+19+56+56+39+51, six builder costs, 59.88+41.73, 2940/490
386 465 71 142 258 59.88 101.61 6.0
```
Progress file (raw): see `PROGRESS-R2.md` (6 lines, `- YYYY-MM-DD HH:MM text`).

## Verified vs unverified
Proved by a command in Evidence:
- All six layout checks are 0 on the 24-page `R2.pdf`; no fallback font in `pdffonts` (only the `false` faces and JetBrains Mono); page size A4; no `zz-stub` files left.
- The text layer contains none of "selayang", "syafiq", "daniel".
- The pass counts (21/21, 10/10, 21/21, 19/19, on both targets), the money-parity numbers, the 32-commit count, and the sums (386, 465, 71, 142, 258, $59.88, $101.61) shown in the chapters match the raw logs and arithmetic above.
- Every other number in the chapters is copied from `LEAD-FACTS.md` or the Evidence blocks of REPORT-K / REPORT-O / REPORT-P1 (read in full), or from `git log`, `NEEDS-lead.md` and `deploy-v2-preview.sh`. I did not re-run any of them: R2 ran no app, no e2e spec and no wrangler command.

Not proved by any command:
- The visual quality of every page was judged by eye from contact sheets (14 vision calls). After the last edits I re-viewed only pages 4 and 13-18; pages 1-3 and 5-12 were viewed on earlier builds (the tool refused a fourth load of `sheet-1.png`), and pages 19-24 before the last file-map tweak on page 23. The six layout checks are 0 for all of them. Pages 14 and 16 carry a gap of about 30 mm above a pinned block; I left it.
- "No real names": only the text layer was scanned. Screenshots come from the anonymised seed (per their reports) and I looked at the ones used, but no OCR or name-list scan was run on the images. The login screenshots (ch. 08, p.8) show the app credit line, which the brief allows.
- Screenshot content claims (what each screen shows) are from my reading of low-resolution thumbnails. One claim I could not read (the number of draf projects in the Tutup sheet) was removed.
- The sentence in chapter 10 that `domain/` was lead-owned so builders put rules in their own folders rests on REPORT-P1's caveat and WAVE2.md's ownership table; it is not shown for K or P2.
- "Wave 1 quota 9 % to 28 %" reads the wave-2-start reading as the end of wave 1; LEAD-FACTS gives readings at three moments only.
- Chapter 90's "what changes otherwise" lines are quoted from the sources where they exist (LAD date: NEEDS-lead O 8; AI: NEEDS-lead K 4; alternatives: K 5); the rest are tagged Inference in the text.
- The glossary glosses come from strings in the app and reports; "PJA" and "Rotasi"-type terms were kept to ones I could support, but no domain expert checked them.

## Caveats
- **Standalone numbering:** `{{page:NN}}` is not used in my chapters, so nothing depends on R1's contents list. The chapter-90 checklist numbers (01-14) come from a CSS counter that starts at the first `.check` in the whole report; if R1 ever uses `.check`, the numbers in the callout "Questions 1, 2, 8..." and the order will shift.
- **CSS side effect for the merge:** my block adds `.fig.sp-1..4` margins (the base `.fig { margin:0 }` otherwise cancels `.sp-N` on a `<figure class="fig">`). If R1 has `<figure class="fig sp-N">` its spacing will change by that rule; check the merged pages.
- **Merge needs:** `report.css` R2 block, `charts/r2_*.svg` (or run `charts_r2.py`), `img/r2_*.png` (run `crops.py`, needs `img-v2/`), and `build.py`'s `REPORT_NAME`. Lead should make sure R1 sets the same running name.
- **Length:** 24 pages. The spec target of 34-44 is for the whole report; with R1's chapters 00-06 the total depends on R1.
- **Local parity run:** only the preview's `money-parity.log` exists in `merged-e2e/`; the local 490 / 2,940 / 0 figures are quoted from LEAD-FACTS (lead-verified), not from a log I could read.
- **A real finding stated in chapter 11:** in the money-parity log, 0 of 490 real projects have LoC days, so LoC parity rests on the 6,860 synthetic cases only; and 9 projects store values that differ from the old formula. Neither was investigated by anyone.
- **"142 of 142"** is 2 x 71, the sum of the four specs' check counts per target, not a number printed by any tool; the figure and text say so.
- The 32-row inventory count for chapter 08 is the awk count (33) minus the separator row.
- The commit list shows 32 commits, LEAD-FACTS says 31: the 32nd is `0d0eb14c` (the build-report spec), made after LEAD-FACTS was written. The chapter says so.
- Privacy pass for the lead: the screenshots of O's screens (login, Tetapan Organisasi, letterhead) show the council's name, because it is the app's default organisation text; the "another PBT" letterhead image uses the sample name "Majlis Perbandaran Contoh". These are an institution, not a person or company, and my text never writes the name, but the images were not scanned. The login screenshots also show the app credit line.
