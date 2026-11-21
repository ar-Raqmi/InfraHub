# REPORT-D — design system (Direction C "Tapak", light only)

## Done
- `public/fonts/` — Bricolage Grotesque variable (opsz 12–96, wght 200–800, wdth 75–100) and Atkinson Hyperlegible
  Next variable (roman + italic, wght 200–800), latin subset WOFF2 fetched live from the Google Fonts CSS API
  (224 KB total). `LICENSES.md` records OFL-1.1 with both full licence texts (fetched from google/fonts).
- `public/theme.css` — `@font-face` ×3, all tokens as `--ih-*` CSS variables (§7 hexes + tint/line steps),
  `html { color-scheme: light }`, body = Atkinson, h1–h3 = Bricolage, focus ring, `.ih-num` (tabular figures),
  `.ih-eyebrow`, `.ih-hatch` (DRAF contract), `.ih-grid-paper` + `.ih-fade-down` (survey-grid header), 16 px inputs
  below md.
- `public/tw-config.js` — colours paper/surface/ink/muted/line/emerald/teal/kontrak/amber/danger (nested, so the
  default Tailwind scales still work), fontFamily `sans`=Atkinson, `display`=Bricolage, legacy `jakarta`/`geist`
  kept and remapped, type sizes `display-xl/l/m`, `title`, radii `ih-sm..xl`, `darkMode: 'class'`; existing
  boxShadow/backdropBlur/animation keys unchanged.
- `*.html` (9 pages + new `kit.html`) — head only: Google Fonts preconnect/stylesheet links removed, two font
  preloads + `/theme.css` link added (index.html: before `/index.css`, so it wins over the inline Manrope rule).
- `public/global.css` — Manrope → `var(--ih-font-sans)`; splash/nav-spinner colours → tokens.
- `components/ui/` (21 files) — Button, IconButton, Chip, ContractChip, StatusPill, WorkflowStepper, Card,
  SectionHeader, StatTile, DataTable, Field/Input/Select, Sheet (wraps BottomSheet), Tabs, Indicator, EmptyState,
  Timeline, DiffRow + helpers `cx.ts`, `tones.ts`, `workflow.ts` and barrel `index.ts`. Typed props, no fetching.
  StatusPill/WorkflowStepper take labels from `services/StatusHelper.ts`; DiffRow formats money with
  `services/Formatter.formatCurrency`.
- `components/AppShell.tsx`, `Sidebar.tsx`, `BottomSheet.tsx` — re-skinned only; props, NAV_ENTRIES, link/button
  modes, `overflow-x-clip`, 56 px top bar, 64 px tab bar, `md:pl-32` unchanged. Desktop rail is now a flush 112 px
  labelled rail (paper-deep) whose right edge meets ProjectDetail's `md:left-28` fixed header; hover-only tooltips
  replaced by visible labels; role shown above Log Keluar. Sheet gains a grab handle and display-font title.
- `kit.html` + `entries/kit.tsx` (+ `kit` input in `vite.config.ts`) — gallery of every primitive with invented
  Malay data (ContractChip `MPS/SH/302/25 · AKTIF`, stepper at PEMERIKSAAN_TAPAK, DiffRow `RM 22.00 → RM 24.90`,
  BQ table with all three indicators, Klon kontrak form with an error, version timeline, `?sheet=1` opens the
  rate-decision sheet). Mounted without RequireAuth (dev gallery, no data).
- `docs/overhaul/v2/DESIGN.md` — tokens table, type scale, spacing/shape, mobile rules, component usage, do/don't,
  light-only rule.
- `docs/overhaul/v2/NEEDS-lead.md` — appended 3 requests (theme-color meta, rail/ProjectDetail coupling, login page).
- Screenshots `docs/overhaul/v2/reports/img/D/`: kit-desktop, kit-phone, kit-sheet-phone, dashboard-desktop/phone,
  projects-desktop/phone, project-desktop-scrolled (all ≤ 1280 px wide).

## Evidence
Build gate, light-only greps, head links (run after the last edit):
```
$ npm run build 2>&1 | tail -4
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 7.12s
$ npx tsc --noEmit 2>&1 | grep -c "error TS"
3
$ grep -rn "dark:\|prefers-color-scheme" --include=*.tsx --include=*.ts --include=*.css --include=*.html . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=docs | grep -v public/tailwind.js | wc -l
0
$ grep -c "/theme.css" *.html
dashboard.html:1
index.html:1
kit.html:1
login.html:1
profile.html:1
project.html:1
projects.html:1
report.html:1
settings.html:1
users.html:1
$ grep -l fonts.googleapis *.html | wc -l
0
```
Playwright probe (`shots.py probe`, admin01 against `wrangler pages dev dist --port 8792`, own state-D with the
anonymised dev seed). navUnder44 lists mobile-nav/top-bar controls shorter than 44 px; `/kit` has no app nav:
```
360 /kit | scrollW 360 clientW 360 overflow False | navCount 0 navUnder44 [] | body "Atkinson Hyperlegible Next" | H1 "Bricolage Grotesque" | check atk True bri True
360 /dashboard | scrollW 360 clientW 360 overflow False | navCount 8 navUnder44 [] | body "Atkinson Hyperlegible Next" | H1 "Bricolage Grotesque" | check atk True bri True
360 /projects | scrollW 360 clientW 360 overflow False | navCount 8 navUnder44 [] | body "Atkinson Hyperlegible Next" | H1 "Bricolage Grotesque" | check atk True bri True
390 /kit | scrollW 390 clientW 390 overflow False | navCount 0 navUnder44 [] | body "Atkinson Hyperlegible Next" | H1 "Bricolage Grotesque" | check atk True bri True
390 /dashboard | scrollW 390 clientW 390 overflow False | navCount 8 navUnder44 [] | body "Atkinson Hyperlegible Next" | H1 "Bricolage Grotesque" | check atk True bri True
390 /projects | scrollW 390 clientW 390 overflow False | navCount 8 navUnder44 [] | body "Atkinson Hyperlegible Next" | H1 "Bricolage Grotesque" | check atk True bri True
430 /kit | scrollW 430 clientW 430 overflow False | navCount 0 navUnder44 [] | body "Atkinson Hyperlegible Next" | H1 "Bricolage Grotesque" | check atk True bri True
430 /dashboard | scrollW 430 clientW 430 overflow False | navCount 8 navUnder44 [] | body "Atkinson Hyperlegible Next" | H1 "Bricolage Grotesque" | check atk True bri True
430 /projects | scrollW 430 clientW 430 overflow False | navCount 8 navUnder44 [] | body "Atkinson Hyperlegible Next" | H1 "Bricolage Grotesque" | check atk True bri True
1440 /dashboard | scrollW 1440 clientW 1440 overflow False | navCount 5 navUnder44 [] | body "Atkinson Hyperlegible Next" | H1 "Bricolage Grotesque" | check atk True bri True
```
`document.fonts` entries with status `loaded` on 390 /dashboard (proves the self-hosted files were used;
`fonts.check()` alone cannot fail for unknown families):
```
['Bricolage Grotesque normal', 'Atkinson Hyperlegible Next normal', 'Atkinson Hyperlegible Next italic']
```
Font files (fontTools on the downloaded WOFF2):
```
AtkinsonHyperlegibleNext-Italic-Variable-latin.woff2 [('wght', 200.0, 800.0)] ['ccmp', 'frac', 'locl', 'pnum', 'tnum'] None Copyright 2020-2024 The Atkinson Hyperlegible Next Project Authors (https://github.com/googlefonts/atkinson-hyperlegible-next)
AtkinsonHyperlegibleNext-Variable-latin.woff2 [('wght', 200.0, 800.0)] ['ccmp', 'frac', 'locl', 'pnum', 'tnum'] None Copyright 2020-2024 The Atkinson Hyperlegible Next Project Authors (https://github.com/googlefonts/atkinson-hyperlegible-next)
BricolageGrotesque-Variable-latin.woff2 [('opsz', 12.0, 96.0), ('wght', 200.0, 800.0), ('wdth', 75.0, 100.0)] ['ccmp', 'dnom', 'frac', 'locl', 'numr', 'pnum', 'tnum'] None Copyright 2022 The Bricolage Grotesque Project Authors (https://github.com/ateliertriay/bricolage)
```
Rail vs ProjectDetail fixed header at 1440 (`project_shot.py`):
```
shot project-desktop-scrolled (1280, 800)
{'railRight': 112, 'headerLeft': 112, 'headerVisible': 'block'}
```
DiffRow DOM check (`sama_probe.py`): unchanged rate shows no struck old rate; changed rate shows old → new + %:
```
['RM 28.50 Sama']
['RM 22.00 RM 24.90 +13.2%']
```
Dev seed import into state-D:
```
        "n": 490
        "username": "admin01",
        "role": "ADMIN"
```
WCAG contrast of the token pairs used for text (python, sRGB formula; amber tint was then changed to #FDF4E4 → 4.6):
```
#14211F on #10B981 6.53
#5B6B68 on #F7F5EF 5.14
#5B6B68 on #FFFFFF 5.6
#14211F on #F7F5EF 15.2
#3B2E8C on #EEEBF8 9.14
#B45309 on #FCF1DE 4.49
#B42318 on #FCEBE8 5.69
#047857 on #E6F4EC 4.84
#FFFFFF on #3B2E8C 10.74
#F7F5EF on #14211F 15.2
#5B6B68 on #EFEBE1 4.71
#FDF4E4 4.6
```
Coding standards (`coding_standards_check.py --files components/ui/*.ts components/ui/*.tsx components/AppShell.tsx components/Sidebar.tsx components/BottomSheet.tsx entries/kit.tsx public/tw-config.js vite.config.ts`):
```
coding-standards check — 27 file(s)
  [external] eslint: ok
      skipped (eslint not installed locally)
  [DRY] 2 finding(s)
      24 tokens repeated in 4 places
      24 tokens repeated in 2 places
```
`--json` locations of the two DRY hits: line 1 of Button/Chip/EmptyState/IconButton and line 1 of
StatTile/Timeline, i.e. identical `import` lines (the known false positive of this heuristic).
Unused locals/params in D's files (`npx tsc --noEmit --noUnusedLocals --noUnusedParameters | grep <D files>`):
```
unused-in-my-files exit: done (0 hits)
```

## Verified vs unverified
Verified by a command above:
- `npm run build` green; tsc error count 3 (= base).
- No `dark:`/`prefers-color-scheme` in app source; every `*.html` links `/theme.css` once; no Google Fonts links left.
- At 360/390/430 on /kit, /dashboard, /projects: `scrollWidth == clientWidth`; no mobile-nav/top-bar control < 44 px.
- Computed body font = Atkinson Hyperlegible Next, first heading = Bricolage Grotesque (all widths + 1440); both
  self-hosted faces reach `loaded`.
- Both fonts contain `tnum`; licences are OFL-1.1 (copyright strings above, full texts in LICENSES.md).
- Desktop rail right edge (112) = ProjectDetail header left (112).
- DiffRow same/up rendering (DOM text).
- Contrast ratios listed.

Checked only by my own eyes on the screenshots (8 vision views): overall look, spacing, stepper connectors, chip
states, sheet layout, shell integration on dashboard/projects/project.

Not checked by anything:
- Real iOS Safari / Android rendering (only headless Chromium); safe-area insets.
- Keyboard/screen-reader walkthrough of the primitives (aria attributes are set, not tested with a reader).
- Pages other than dashboard/projects/project under the new fonts (users, report, settings, profile, login
  were not screenshotted); longer Bricolage headings in those pages may wrap differently.
- That wave-2 builders' usage matches DESIGN.md.

## Caveats
- Atkinson becomes the app-wide `font-sans` and Bricolage every h1–h3, so ALL existing pages change typeface
  (intended re-skin). Page bodies keep their slate/emerald Tailwind classes; only the shell, sheet and kit use the
  new palette. The visual gap (slate cards on warm paper) closes as wave 2 moves pages onto `components/ui`.
- `<meta name="theme-color" content="#10b981">` left unchanged (D may only touch head links); request in NEEDS-lead.
- The rail width is coupled to `pages/ProjectDetail.tsx` `md:left-28` (not D's file); noted in NEEDS-lead.
- The concept's lime `#B7F34D` was not used: §7 assigns action to emerald/teal, so primary = emerald-bright with ink
  text, which keeps the concept's "bright fill + dark label" feel.
- `WorkflowStepper` horizontal is for `md`+ only (labels would collide at 360 px); documented in DESIGN.md.
- The kit page is built into `dist/` (dev gallery, `noindex`); exclude it from production deploy if unwanted.
- Login/index pages: only their head links changed; their content still uses the old slate look.
- `fonts.check()` in the probe is weak by design (true for unknown families); the `loaded` list is the real proof.
- Screenshots were taken before the last token tweak (amber tint #FCF1DE → #FDF4E4, contrast fix); the probe ran after it.
- wrangler dev server on 8792 was stopped after the run; restart with the command in the brief.

## Numbers
```csv
metric,value
ui_primitives,17
ui_files,21
html_pages_linked_theme,10
font_files,3
font_bytes_total_kb,224
screenshots,8
vision_views_used,8
probe_viewports,4
probe_pages_x_widths,10
overflow_failures,0
nav_controls_under_44px,0
tsc_errors_base,3
tsc_errors_after,3
build_seconds,7.12
```
```csv
file,lines_new_or_changed
components/ui (21 files),805
entries/kit.tsx,313
kit.html,34
public/theme.css,145
docs/overhaul/v2/DESIGN.md,113
components/Sidebar.tsx,71
components/AppShell.tsx,10
components/BottomSheet.tsx,13
public/tw-config.js,39
public/global.css,16
vite.config.ts,1
dashboard.html (each of 8 app pages similar),6
index.html,11
```
(changed-line counts = `diff <main checkout> <worktree> | grep -c '^[<>]'`; new files = `wc -l`.)
