
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

## From P2 (Projek detail & BQ), 2026-11-21
- **Project change-log route.** "Guna kadar baharu" on a stale BQ row must be logged, but there is no route to append a
  project `change_log` entry. Request: `POST /api/projects/:id/log {action:'row-rate', message, diff}` (same batch rules).
  P2's local adapter records the decision inside the row as `bqData[].items[].bookDecision`
  (`{choice:'BAHARU', at, by, contractCode, versionNo, from{rate,unit,description}, to{…}}`, saved with the project);
  see `components/bq/RowBookFlag.tsx`. Please also add `bookDecision?: BookDecision` to `BQItem` in `types.ts`.
- **Re-price with unlock is not marked in the log.** `ProjectContractService.reprice(..., unlock)` applies on a locked
  project but its `reprice` change_log diff has no `unlocked` flag. P2 records the unlock by calling
  `POST /projects/:id/contract {unlock:true}` (logs `swap-unlocked`) right after the re-price. Suggest adding
  `unlocked: true` to the reprice diff so one entry suffices.
- **No. Sebutharga for new projects.** `POST /projects` binds `contract_id` but leaves `no_sebutharga` blank; ProjectDetail
  now fills it from the bound contract in the form (the field is read-only, the contract decides). Consider setting
  `no_sebutharga = contract.code` in `ProjectRepository.create`.
- **Contracts cannot be deleted.** The P2 e2e spec closes its test contract (DITUTUP) on cleanup; each run leaves one
  `E2E-P2/<hhmmss>` STANDALONE contract behind. A `DELETE /contracts/:id` for DRAF/unused contracts (or an e2e cleanup
  route) would let wave 3 clean up fully.
