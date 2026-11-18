# Mobile redesign (branch `mobile-ux-redesign`)

Phone layout below `md` (768 px); desktop markup is unchanged and sits behind `hidden md:*`.

## Shared building blocks
| File | Role |
|---|---|
| `components/Sidebar.tsx` | One `NAV_ENTRIES` list drives the desktop rail and the mobile tab bar (Tetapan is ADMIN-only). Props `mobileTopBar`, `mobileBottomNav` let a page supply its own bars. |
| `components/AppShell.tsx` | Solid 56 px mobile top bar (page title, year chip, refresh). Content gets `pt-14` and bottom padding for the 64 px tab bar. Root uses `overflow-x-clip` so `sticky` works. |
| `components/BottomSheet.tsx` | The only sheet component. Portal, z-[100], Esc, 44 px close. |
| `components/ExpandableText.tsx` | Long titles: `.clamp-N` (in `public/global.css`) + "Lihat penuh ▾" shown only when the text is really cut. |
| `components/YearSelector.tsx` | `variant="sheet"` for the mobile top bar. |

Area components: `components/projects/`, `components/detail/`, `components/bq/`, `components/admin/`, `components/dash/`, `components/report/`.

## Rules for new mobile UI
- Solid colours on fixed/sticky bars: `public/tw-config.js` turns shadow and blur off, so translucency shows content through.
- Sticky offset below the shell is `top-14`; the project page has its own header and publishes its height as `--bq-sticky-top` (BIL bar).
- Controls >= 44 px, inputs >= 16 px text, no hover-only actions.
- BQ arithmetic: multiplier 0 is meaningful; use `partMultiplier()`, never `|| 1`.

## Verifying
Serve a local copy (see the repo skill notes / README of the redesign folder) and capture at 360, 390 and 430 px; check `scrollWidth`, controls under 44 px, inputs under 16 px.
