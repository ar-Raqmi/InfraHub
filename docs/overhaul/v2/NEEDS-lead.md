
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

## From K (Kontrak), 2026-11-21
1. **Delete / discard a DRAF contract.** There is no `DELETE /contracts/:id` and `DRAF -> DITUTUP` is refused (409),
   so an officer cannot discard a mistaken DRAF contract and `e2e/K.spec.py` cannot clean up after itself (it labels
   its contract `[E2E selesai] …` instead). Request: `DELETE /contracts/:id` allowed only when status = DRAF and
   `stats.projects = 0` (cascade its versions/groups/matches/panel; log `action: 'delete'`), *or* allow DRAF -> DITUTUP.
   The UI will show "Buang draf" on DRAF contracts once the route exists.
2. **Draf count in contract stats.** The close-confirm sheet says "N projek draf … akan ditanda Perlu harga semula";
   K derives N from `GET /projects` (local adapter `components/kontrak/useContractProjects.ts`). Request:
   `stats.drafProjects` in `GET /contracts` and `GET /contracts/:id`.
3. **Mobile tab bar.** `components/Sidebar.tsx` has Kontrak with `mobile: false`, so phones only reach it via the
   Tetapan hub link K added. Suggest `mobile: true` (or a "Lagi" entry) since any officer may import a sebutharga.
4. **apiService.aiMatchSuggest(versionId)** + a config switch `ai.matchSuggest`. K's `import/AiSuggestButton.tsx`
   uses a local fetch and only renders when `GET /config` has `ai.matchSuggest: true`, so a 501 server shows nothing.
5. **Alternatives in `GET /rate-book/versions/:vid`.** The import response carries `matches[].alternatives` but the
   version detail does not, so after a reload "Pilih item lain" falls back to a search of the old book. Request:
   include `alternatives` (or `altRefs`) in `rate_book_matches`.
