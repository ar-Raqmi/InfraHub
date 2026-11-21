
## From D (design system), 2026-11-21
- `<meta name="theme-color" content="#10b981">` in every `*.html` paints the phone status bar emerald above the
  new white top bar. Suggest `#FFFFFF` (top bar) — D left it because §9 limits D to head *links*. Lead's call.
- `pages/ProjectDetail.tsx` fixed header uses `md:left-28`; the new desktop rail is exactly `w-28` (112 px) so they
  meet edge to edge. If a wave-2 builder widens the rail or the header, change both together.
- `login.html`/`index.html` bodies still carry `bg-slate-50`; Login page itself is not re-skinned (not in D's row).
