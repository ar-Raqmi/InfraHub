# Wave 2: shared brief (read CONTRACT.md first; this file adds wave-2 rules)

Base: `overhaul/v2`, with the foundation (F) and design system (D) merged and verified by the lead:
- 70 vitest tests, `tsc` at 3, build green;
- legacy migration idempotent; compat PUT creates versions;
- swap refused (423) once No. Inden exists; re-price dry run works.

Read `docs/overhaul/v2/API.md` (real request/response shapes) and `docs/overhaul/v2/DESIGN.md` (tokens and
primitives) before writing UI. Use the client layer that already exists: `services/apiService.ts` v2 methods and
the hooks `useContracts`, `useRateBook`, `useChangeLog`, `useOrgConfig`, plus `lib/excel/readWorkbook.ts`.
Use the `domain/` functions for any business rule. Never re-implement them in a component.

## Your setup (each builder)
- Worktree `~/Documents/Repo/InfraHub-wt/<name>` (branch `v2/w2-<name>`). The lead prepares it: `node_modules`
  is symlinked (do not npm install), and `wrangler.toml` has a FAKE db id plus `migrations_dir`.
- State `~/.hermes/cache/scratch/v2/state-<name>`. Bootstrap it with
  `bash docs/overhaul/v2/tools/bootstrap-local.sh <state-dir>`, which:
  1. imports the anonymised seed;
  2. applies migrations;
  3. starts nothing, so you serve it yourself.
  Then serve with `npm run build && npx wrangler pages dev dist --port <port> --persist-to <state> --compatibility-date=2026-06-18`
  and call `POST /api/v2/admin/migrate-legacy` once.
- Login users: `admin01`, `jurutera01`, `pja01`. The password is line 2 of
  `~/Documents/InfraHub-backups/dev-seed/CREDS.txt`. Read it inside scripts and never print it.
  To log in a Playwright page, POST `/api/auth/login`, then set localStorage `infrahub_user` (the JSON user) and
  `infrahub_login_time` (`Date.now()` string).
- Playwright: `env -u PYTHONPATH ~/.hermes/cache/scratch/v2/pw/bin/python`, with chromium
  `executable_path=/home/rezephyr/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome`. **One browser at a
  time, closed after each run.** Four builders share this machine, so keep a single dev server running and stop it
  by PID (`lsof -ti:<port> | xargs -r kill`). Never `pkill -f`.

## UX bar (the owner rejects "basic", generic or rushed)
- Direction C "Tapak", light only, built from `components/ui` primitives and tokens. **Purple = contract.**
  Product logo = `BrandMark`.
- Phone first for PJA flows: test at 390 and 430 px, plus desktop at 1440. No horizontal overflow, controls of at
  least 44 px, inputs of at least 16 px.
- Malay UI copy, consistent with the existing app. Write it as real sentences, never placeholders.
- No regressions: existing flows you touch must still work. Note in your report which old features you re-tested.

## Ownership (do not edit other files; ask in `docs/overhaul/v2/NEEDS-lead.md` under your heading)
| Builder | Owns |
|---|---|
| **K** Kontrak | `pages/kontrak/**`, `components/kontrak/**`, `pages/AdminSettings.tsx`, `components/admin/settings/**` |
| **P1** Projek list | `pages/Dashboard.tsx`, `pages/ProjectsList.tsx`, `components/dash/**`, `components/projects/**`, `services/pdf/ProjectsListPDFExporter.ts`, `hooks/useProjects.ts` |
| **P2** Projek detail | `pages/ProjectDetail.tsx`, `pages/BQEditor.tsx`, `pages/BQPelarasanEditor.tsx`, `components/detail/**`, `components/bq/**`, `lib/bqShared.tsx`, `services/pdf/BQPDFExporter.ts` (rate-source line only) |
| **O** Organisasi | `pages/organisasi/**`, `components/org/**`, `pages/Login.tsx`, `pages/{CPC,LAD,LoC,Prestasi}Certificate.tsx`, `pages/NotisGenerator.tsx`, `pages/AkuJanjiEditor.tsx`, `services/pdf/**` (except the two above), `services/finance.ts` |
| Lead | everything else: `types.ts`, `services/apiService.ts`, `hooks/use{Contracts,RateBook,ChangeLog,OrgConfig}.ts`, `components/ui/**`, `components/Sidebar.tsx`, `components/AppShell.tsx`, `domain/**`, `functions/**`, `migrations/**`, html files, `vite.config.ts` |

If you need a new API field, hook or primitive, write the exact request in NEEDS-lead.md and continue with a
local, clearly marked adapter inside your own files. The lead folds it into the shared layer when merging.
Do not block on it.

## Report (same contract as wave 1)
- `docs/overhaul/v2/reports/PROGRESS-<name>.md` and `REPORT-<name>.md`, with the sections Done / Evidence /
  Verified vs unverified / Caveats / Numbers.
- Screenshots go in `docs/overhaul/v2/reports/img/<name>/`: PNG, at most 1280 px wide, anonymised seed only.
  Take at least 6 per builder, covering desktop and phone, and include before/after where you changed an
  existing screen. Name them `NN-what.png`.
- Write a Playwright acceptance script, `docs/overhaul/v2/e2e/<name>.spec.py` (python, standalone, takes
  `--base`). Wave 3 runs every spec against the preview deploy, so it must create its own test data via the
  API/UI and clean up after itself, and must not assume ids from the seed.
- Paste the raw output of `coding_standards_check.py --files <yours>`.
