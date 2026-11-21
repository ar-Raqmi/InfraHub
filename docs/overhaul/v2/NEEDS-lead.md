
## From D (design system), 2026-11-21
- `<meta name="theme-color" content="#10b981">` in every `*.html` paints the phone status bar emerald above the
  new white top bar. Suggest `#FFFFFF` (top bar) — D left it because §9 limits D to head *links*. Lead's call.
- `pages/ProjectDetail.tsx` fixed header uses `md:left-28`; the new desktop rail is exactly `w-28` (112 px) so they
  meet edge to edge. If a wave-2 builder widens the rail or the header, change both together.
- `login.html`/`index.html` bodies still carry `bg-slate-50`; Login page itself is not re-skinned (not in D's row).

### Lead decisions (2026-11-21)
- theme-color → `#FFFFFF` in all 10 html heads + manifest (`background_color` → paper `#F7F5EF`). Done by lead.
- Rail/header coupling (`w-28` ↔ `md:left-28`): noted for wave-2 builder P (owns ProjectDetail).
- Login page re-skin: assigned to wave-2 builder O (Organisasi; login shows the org logo/name from config).

## From P1 (projek list & dashboard), 2026-11-22
- **vitest include:** add `'components/**/*.test.ts'` to `vitest.config.ts`. P1 ships 18 tests in
  `components/dash/worklist.test.ts` and `components/projects/reportScope.test.ts`; today they only run through a scratch
  config (REPORT-P1 Evidence). Better still: move `components/dash/worklist.ts` (re-price / paperwork / notice rules) and
  `components/projects/reportScope.ts` (scope, vote summary, company cap) into `domain/` when merging; they are pure.
- **Contract DELETE (or a test flag):** the e2e spec must leave its throwaway contract behind (DITUTUP, 0 projects)
  because there is no `DELETE /contracts/:id`. Suggest allowing delete for DRAF/DITUTUP contracts with 0 projects
  (logged). The projects page already hides closed contracts with 0 projects from the sebutharga picker.
- **POST /projects with no `bp` returns 500** (`NOT NULL constraint failed: projects.bp`). Should be a 400 with a message.
- **Indicator primitive:** a dedicated state for "perlu harga semula" (project on a DITUTUP/DRAF sebutharga). P1 uses
  `Indicator state="KADAR_BERUBAH" variant="dot" detail=<reason>` plus visible text, as a local stand-in.
- **StatTile:** pass `aria-pressed` through when `onClick` is set (the pipeline tiles are filters; P1 adds an sr-only
  "Ditapis" text meanwhile).
- **entries/projects.tsx:** `ProjectsList` now reads ALL projects via `useProjects()` and applies the report scope
  (sebutharga / Tahun / Semua tahun / julat) itself; the year-filtered `projects` prop is only used for ImportIndenModal.
  The entry can stay as is; just do not re-add a year filter in front of the totals.
