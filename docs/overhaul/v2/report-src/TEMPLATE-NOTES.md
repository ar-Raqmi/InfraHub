# How to add a chapter to the Discovery Report

For the designer adding UX chapters 10–13. Everything is in this folder
(`/home/rezephyr/.hermes/cache/scratch/overhaul/pdf/`). Do not add a second stylesheet: use `report.css`, and if
you need a new class add it there with a comment.

## Build

```bash
cd /home/rezephyr/.hermes/cache/scratch/overhaul/pdf
env -u PYTHONPATH ../pw/bin/python build.py              # charts -> report.html -> layout checks -> PDF
env -u PYTHONPATH ../pw/bin/python build.py --no-pdf     # html + checks only (fast iteration)
env -u PYTHONPATH ../pw/bin/python build.py --no-charts  # skip charts.py
rm -rf review && mkdir review && pdftoppm -r 60 -png InfraHub-Overhaul-Discovery-Report.pdf review/page
env -i HOME=$HOME PATH=/usr/bin:/bin /usr/bin/python3 contact.py   # review/sheet-N.png, 6 pages per sheet
```

`build.py` launches one Chromium, prints the PDF, then closes it. It prints six layout checks; all must be 0:
`pageOverflow` (a page's content is taller than the page), `outOfPage`, `intoFooter` (content reaches the folio
zone), `clipped` (an element with overflow hidden cuts its content), `svgOverlap` (two SVG text labels
intersect), `svgOut` (an SVG label leaves its SVG). Full details land in `build-checks.json`.

## How build.py orders and assembles files

1. Runs `charts.py` (which also runs `diagrams.py`) to write `charts/*.svg` and `charts/derived.json`.
2. Reads `chapters/*.html` in **filename order**. Chapters 00–09 exist; decisions and appendix are `90-…` and
   `99-…`, so files named `10-…` to `13-…` slot in between automatically. Nothing else to register.
3. Each chapter file must start with `<!-- chapter: NN | Running title -->` and contain only
   `<section class="page …">…</section>` blocks (no nested `<section>`; no `<html>`/`<head>`).
4. Injects the footer into every page except `.cover`: report name · `NN · Running title` · `PP / TOTAL`.
   Page numbers are sequential across the whole report; do not write folios yourself.
5. Replaces tokens:
   - `{{svg:name}}` → the contents of `charts/name.svg` (inlined so the report fonts apply inside the SVG);
   - `{{page:NN}}` → first page of chapter NN (the contents list in chapter 01 already lists `10–13` as a
     greyed “later” row: replace that `<li class="later">` with real rows using `{{page:10}}` etc.);
   - `{{at:name}}` → page of the section that carries `data-anchor="name"`;
   - `{{pages}}` → total page count.
6. Writes `report.html` in this folder (so `fonts.css`, `fonts/`, `charts/` and any image path are relative to
   this folder), then prints `InfraHub-Overhaul-Discovery-Report.pdf` (A4, `prefer_css_page_size`,
   `print_background`).

## Page anatomy

```
<section class="page">            210 x 297 mm, fixed; padding 16 mm top, 18 mm sides, 22 mm bottom
  <header class="opener sys">…</header>   optional chapter opener band (first page of a chapter)
  … content (flex column) …
  <div class="push">…</div>               optional: pinned to the bottom of the content area
  [footer.folio injected by build.py at 9 mm from the bottom]
</section>
```

- The page is a flex column. `.push` = `margin-top:auto` (sticks a block to the bottom); `.fill` = takes the
  remaining height. Use them instead of fixed heights so pages look full without overflowing.
- Content width is 174 mm. Body measure should stay ≤ 75 characters: put long prose in `.measure` (128 mm), a
  column of `.cols-2`, or the main column of `.cols-rail`.
- Variants: `.page.ink` (dark page), `.page.cover`, `.page.bleed` (full-bleed image, see below),
  `.page.tight` (13 mm top padding).

## Chapter opener (full-bleed colour band)

```html
<header class="opener sys">          <!-- sys = emerald, contract = purple, risk = amber-brown, none = ink -->
  <div class="no">10</div>           <!-- huge Zodiak numeral -->
  <div>
    <p class="kicker">UI/UX direction A</p>
    <h1>Short strong title</h1>
    <p class="dek">One or two sentences, max ~2 lines.</p>
  </div>
</header>
```
The band bleeds to the page edges by negative margins; it takes ~65–70 mm. Pick the colour by meaning:
purple only for contract things; UX chapters should use `sys` (emerald) or plain ink.

## Reusable classes (all in report.css)

| Need | Class | Notes |
|---|---|---|
| Small uppercase label | `.kicker`, `h4` | JetBrains Mono, slate |
| Section heading | `h2`, `h2.big` | Zodiak 18 / 24 pt |
| Intro paragraph | `.lede` | Zodiak 13 pt |
| Small text, muted | `.small`, `.muted`, `.src` (file:line, mono 7.2 pt) | |
| Grids | `.cols-2`, `.cols-3`, `.cols-4`, `.cols-rail` (42 mm label + main), `.cols-7-5`, `.cols-5-7` | |
| Figure | `<figure class="fig">` + `.fig-title` (insight sentence, Zodiak) + `.fig-sub` + `{{svg:…}}` or `<img class="shot">` + `<figcaption>` (mono 7.5 pt) | Titles state the insight, not a label |
| Tags | `.tag.v` Verified, `.tag.i` Inference, `.tag.q` Needs your answer, `.tag.c` contract, `.tag.r` risk, `.tag.s` neutral (effort S/M/L) | Square, mono |
| Big numbers | `.stat` (`.n` number + `.u` unit, `.l` label with `<b>` heading); sizes `.stat.lg`, `.stat.xl`; colours `.s-purple`, `.s-amber`, `.s-deep`; grid `.stat-grid` (3 columns) | |
| Cards | `.card` + `.sys` / `.contract` / `.risk` (coloured top rule); `.card.flat`; `.card.fill-contract`, `.card.fill-ink` (solid) | |
| Formula card | `.formula` (+ `.risk`, `.contract`) with `.eq` mono block | |
| Callout | `.callout` + `.sys` / `.risk` / `.contract` | tinted panel with left rule |
| Tables | `table.data` (+ `.compact`; `td.num`, `td.code`, `tr.hl`), `table.cmp` comparison (`th.rec`/`td.rec` = recommended column, `td.bad` = amber), `table.swim` swimlane, `table.rank` with `.impact` bar | |
| Lists | `ul.list` (square bullets; `.l-amber`, `.l-purple`), `ol.num` (numbered squares; `.n-amber`, `.n-purple`) | Do not use `.amber`/`.purple` on a list: those colour the whole text |
| Pull quote | `.pull` (`.pull.xl` bigger), `p.by` for the attribution | purple |
| Checklist | `.checks` grid of `.check` (`.box`, `.qn`, `.why`) + `.group-head` (`.contract`/`.sys`/`.risk`) | numbered by a CSS counter |
| Roadmap | `.steps` of `.step` (`.when`, `.big`, `h3`) | `.step.now` = amber |
| Colour words | `.purple`, `.amber`, `.deep` (inline spans only) | |
| Swatch | `<span class="swatch" style="background:…">` | legend squares |

## Screenshots and full-bleed images (for the UX mockups)

- Framed screenshot inside a normal page: `<img class="shot" src="../work/ux/xyz.png">` inside a `.fig`
  (paths are relative to this `pdf/` folder because report.html is written here). Keep PNGs ≤ ~1600 px wide.
- Full-page image: `<section class="page bleed"><img src="…"><div class="bleed-cap">caption…</div></section>`.
  The image covers 210 × 297 mm; the caption band sits at the bottom above the folio. Layout checks skip the
  footer-zone test on `.bleed` pages.
- Screenshots must be anonymised before they reach this folder (BRIEF.md privacy rules).

## Charts and diagrams

- Write new charts in `charts.py` (data) or `diagrams.py` (designed figures) using `svgkit.Svg`. One SVG unit =
  one CSS px; build at `px(174)` units wide for a full-width figure (`px(83)` for a half column) and font
  sizes are then real px (10 px = 7.5 pt). Build at a narrower width (e.g. `FULL * 0.86`) to render everything
  ~15% larger.
- Palette and status colours live in `svgkit.py` (`STATUS_COL`, `tint()`, `mix()`); never introduce new hues.
- Give every chart a unique `sid`: marker/pattern ids are prefixed with it because all SVGs share one document.
- `box()` in diagrams.py prints `WARN box text overflows` when its text does not fit; fix those.

## Font pitfall (checked with fontTools)

The bundled woff2 files are latin subsets. **They lack → ← Σ ∈ ✕ in all faces, and JetBrains Mono also lacks
≈ ≥.** Chromium then falls back to Arial / Noto Sans Mono and `pdffonts` shows those names. Write “to”, “sum”,
“~”, “RM 200k+”, “›” instead. After a build, `pdffonts InfraHub-Overhaul-Discovery-Report.pdf | grep -v
JetBrainsMono` must list only the `false` faces. (`false` is the literal family/PostScript name inside the
Zodiak and General Sans woff2 files; JetBrains Mono, a variable font, is embedded as Type 3.)
