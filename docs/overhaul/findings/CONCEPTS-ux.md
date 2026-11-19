# InfraHub — three UI/UX directions (static mockups)

All screens are HTML rendered to PNG with Playwright (sources in `work/ux/src/A.html`, `B.html`, `C.html`; boards from `src/make_boards.py`). Every name, company, project title and amount on them is **invented** ("Syarikat A Enterprise", "PJA 3", "Jalan Mawar 3"). The status counts on the home screens (29 / 34 / 53 / 32 / 46 / 291) and "60 syarikat panel", "RM 200,000" are the real 2026 aggregates from the brief; everything else is fictional.
Fonts are self-hosted WOFF2 files in `work/ux/fonts/` (Fontshare + Google Fonts); the render script confirms each family is used on the screen and that its `FontFace` loaded.

The audit that motivates these is `AUDIT-ux.md`. All three directions solve the same core problem in their own way:

> **A project is bound to a contract (sebutharga) and a versioned rate book from the moment pricing starts. When the rate book changes, each affected item shows the contract rate against the new rate and asks for an explicit choice: *kekal kadar kontrak* or *guna kadar baharu*. PT manages contracts as dated records with status draf / aktif / ditutup and starts next year with "Klon kontrak".**

That shared model (contract → rate book → version → project lock) is a data change, not a skin; it is needed whichever direction is chosen (see "Shared groundwork" at the end).

---

## A · Saluran — Pipeline / Kanban-first
Board: `concepts/A-board.png`

**Thesis.** The six-status pipeline is the home screen. Every project is a card moving left to right; each card carries its contract chip (`SH/302/25 · K2026`) and its age in the stage, and a strip on top shows the median wait per stage, so the bottlenecks (Menunggu Lantikan, Tuntutan Bayaran) show without a report. The project page repeats the same six steps as a stepper and puts the contract binding directly under the title. The four "phases" become "who acts" inside each status, so there is one vocabulary.

**Type & palette.** Clash Grotesk (display) + General Sans (text) + JetBrains Mono (money, file numbers). Brand emerald/teal on a cool off-white; stages are one sequential green ramp (deeper = further along), amber is reserved for "kadar berubah" and slow stages, MPS purple for "kontrak baharu".

**Serves best.** PT admin and Jurutera, who move projects between stages and chase the slow ones.

| # | Screen | File |
|---|---|---|
| i | Utama — pipeline of 6 statuses, median wait per stage, contract chip on every card, "2 kadar berubah" flag on a draft | `concepts/A/01-saluran-utama.png` |
| ii | Project page — binding bar *Kontrak MPS/SH/302/25 · Kadar 2026 v3 · sah 01.01–31.12.26 · aktif, kadar dikunci 12 Mac*; 6-step stepper with dates and who acts; tasks; documents that inherit the contract; log | `concepts/A/02-projek-butiran.png` |
| iii | BQ editor — purple banner "Buku kadar projek ini: Kadar 2026 v3 / Kontrak baharu tersedia: Kadar 2027"; changed rows highlighted with old rate struck through; a "3 kadar berubah" queue with old → new, % and RM effect, *Kekal kadar kontrak / Guna kadar baharu* per item and in bulk | `concepts/A/03-bq-kontrak-baharu.png` |
| iv | Contracts & rate books as lifecycle lanes Draf / Aktif / Ditutup; validity dates, item and project counts, average use of the RM 200,000 cap, "23 projek guna versi lama"; inline **Klon kontrak** form | `concepts/A/04-kontrak-buku-kadar.png` |

**Pros**
- The pipeline becomes the navigation, so status is never hidden in a dropdown again (audit #5, #6).
- Contract chip on every card makes a project on the wrong rate book visible across the whole list.
- Closest to what PT already does mentally ("which pile is this file in").

**Cons**
- With ~485 projects a year, columns need virtual scrolling and filters; "Siap" has to collapse into a summary (as drawn).
- A BQ is still a table; kanban adds little to the BQ editor itself.
- On a phone a 6-column board must become a stage picker plus list, a second layout to build.

**Effort (estimate, inference).** About 5–7 developer-weeks UI on top of the shared groundwork: new dashboard board, stepper, contract bar, BQ change queue, contract lanes. It reuses most of the existing BQ editor internals.

---

## B · Lejar — Document / ledger-first
Board: `concepts/B-board.png`

**Thesis.** InfraHub is a register of contracts and money, so it should read like one: calm paper, a serif masthead, dense ruled tables with tabular numerals, footnote-style "perlu perhatian" notes instead of cards. The BQ editor becomes a real sheet (column letters, row numbers, formula bar showing *where the rate came from*) with a rate-book side panel: pick the book to compare against, see the item's rate history across versions, decide *kekal / guna baharu*, write a reason.

**Type & palette.** Fraunces (headlines, optical size) + IBM Plex Sans (text) + IBM Plex Mono (all figures). Paper `#F6F3EC`, ink, ruled lines; MPS purple `#3B2E8C` marks anything contractual, green = kekal/ok, brick red = rate difference, pale yellow = highlighted rows. This direction makes MPS purple the institutional anchor, as in the KIK report.

**Serves best.** PT and Jurutera at a desk: checking, signing, reconciling BQ vs Pelarasan vs claims, printing.

| # | Screen | File |
|---|---|---|
| i | Daftar — one-sentence summary headline, proportional status bar, register grouped by status with group totals, contract/version tag per row (`SH/302/25·v2 ≠ v3` flagged), margin notes | `concepts/B/01-daftar-utama.png` |
| ii | Fail projek — vertical file journey on the left, purple "Kontrak terikat" box (*MPS/SH/302/25 · Kadar 2026 v3 · 01.01–31.12.26 · aktif · dikunci 12.03.26 oleh PT*), BQ kontrak vs Pelarasan per Bil with variance, account settlement, lampiran A–H | `concepts/B/02-fail-projek.png` |
| iii | Helaian BQ — sheet with columns *Kadar projek / Kadar buku / Beza*, highlighted changed rows, formula bar citing the rate book; side panel: rate books (semasa / dibanding / ditutup), rate history v1→2027, *Kekal kadar kontrak RM 420 / Guna kadar baharu RM 455*, note, total impact +RM 192.80 | `concepts/B/03-helaian-bq.png` |
| iv | Daftar kontrak — table of contracts with dates, status, items, projects, bound value; version diff 2026 v3 → 2027 draft (41 of 196 changed, % and affected drafts); **Klon kontrak** form | `concepts/B/04-daftar-kontrak.png` |

**Pros**
- Strongest answer to "where does this rate come from": every number has a source and a history.
- Matches the documents InfraHub produces (BQ, CPC), so screen and paper look like the same thing.
- Highest information density on desktop; fewer clicks for PT.

**Cons**
- Weakest on a phone; the sheet needs a separate mobile measuring view (could borrow C's).
- Spreadsheet behaviour (keyboard navigation, frozen rows, fill-down) is the most engineering work of any screen in the three.
- Serif + ledger may feel "old" to younger PJA if pushed into their screens.

**Effort (estimate, inference).** About 7–9 developer-weeks UI: the BQ sheet is the big item (replacing the wizard/accordion editor in `pages/BQEditor.tsx`, ~2,000 lines). Register and file views are simpler than today's.

---

## C · Tapak — Field-first mobile companion + desktop command centre
Board: `concepts/C-board.png`

**Thesis.** The PJA standing at a drain in the sun is the primary user. The phone app is a short sequence of big, single-purpose steps (today's sites → measure item → photo → confirm), one-thumb, with a numeric keypad and a visible "saved on phone, will send when there is signal" state. Rate-book changes reach the PJA as a bottom sheet with two big choices. The desktop becomes a dark command centre for PT: live field activity per PJA on a time track, and a queue of decisions (rate choices to approve, old claims to chase).

**Type & palette.** Bricolage Grotesque (display) + Atkinson Hyperlegible (text and numbers; designed for low-vision legibility, with a slashed zero). Phone: light, high-contrast "siang" palette with lime `#B7F34D` for the one primary action and amber for rate warnings. Desktop: dark "malam" palette (`#0B1513`) so the command centre reads as a different tool from the field app.

**Serves best.** PJA site officers on phones; PT gets an at-a-glance view of what came in from site.

| # | Screen | File |
|---|---|---|
| i (phone) | Hari ini — offline queue banner, next site with "Mula ukur", other visits, counters incl. "2 kadar berubah perlu keputusan" | `concepts/C/m01-hari-ini.png` |
| ii (phone) | Projek — contract chip *Kontrak MPS/SH/302/25 · Kadar 2026 · aktif, dikunci 12 Mac*; vertical 6-step stepper with an inline "giliran anda" card | `concepts/C/m02-projek.png` |
| iii (phone) | Ukur item — item 3 of 6, big dimension tiles vs BQ asal, live quantity and RM, photo slots, large keypad | `concepts/C/m03-ukur-item.png` |
| iii (phone) | Kadar berubah — bottom sheet: contract rate RM 420 vs new RM 455 (+8.3%), *Kekal kadar kontrak / Guna kadar baharu* as large choices, "PT akan sahkan" | `concepts/C/m04-kadar-berubah.png` |
| i (desktop) | Pusat kawalan — status counters, field activity track per PJA, "Menunggu keputusan PT" queue | `concepts/C/d01-pusat-kawalan.png` |
| iii (desktop) | BQ: pilih buku kadar — three rate-book cards (aktif sekarang / aktif 01.01.27 / ditutup), diff table with per-item toggles and impact, three next steps (PJA pilih → PT sahkan → dikunci pada lantikan) | `concepts/C/d02-bq-kontrak.png` |
| iv (desktop) | Kontrak & buku kadar — contract timeline 2025–2027 with "hari ini" marker, version history of Kadar 2026 (v1/v2/v3 with project counts), **Klon kontrak** form | `concepts/C/d03-kontrak.png` |

**Pros**
- Biggest change for the largest user group (12 of the 16 accounts in the local `app_users` copy have role PJA); measuring on site no longer means editing a desktop form on a phone (audit #11, #12).
- Splits decisions cleanly: PJA proposes, PT approves; every rate choice is logged.
- The command centre gives PT live awareness without opening projects.

**Cons**
- Real offline support (service worker, local queue, conflict handling) is a significant engineering step; the mockup only shows the UX.
- Two visual systems (light field app, dark desk app) to maintain.
- The desktop BQ editing experience is not reinvented here; PT still needs B-style tables for checking.

**Effort (estimate, inference).** About 8–11 developer-weeks: phone flows 4–5, offline queue 2–3, command centre and contract timeline 2–3. Highest effort, highest impact for PJA.

---

## Comparison

Scores 1–5 (5 = best). These are design judgements, not measurements.

| Criterion | A · Saluran | B · Lejar | C · Tapak |
|---|---|---|---|
| PJA speed on site | 2 — phone needs a separate list layout | 1 — desk-oriented | **5** — built for it |
| Admin (PT) oversight | **5** — pipeline + stage ages are the home | 4 — register + notes | 4 — live track + decision queue |
| Contract / rate clarity | 4 — chip on every card, change queue | **5** — source, history and diff on every row | 4 — clear choice, less history |
| Learning curve (lower = easier → higher score) | 4 — familiar board metaphor | 3 — sheet conventions to learn | 4 — guided steps on phone, new desk tool |
| Build effort (higher = less work) | **4** (~5–7 wk) | 3 (~7–9 wk) | 2 (~8–11 wk) |
| Fit with current codebase | **4** — dashboard counts, tabs and BQ internals reused | 3 — replaces BQ editor UI | 3 — new mobile flows; reuses `MobileDetailHeader` stepper idea |

```csv
criterion,A_saluran,B_lejar,C_tapak
pja_speed_on_site,2,1,5
admin_oversight,5,4,4
contract_rate_clarity,4,5,4
learning_curve,4,3,4
build_effort_inverse,4,3,2
codebase_fit,4,3,3
```

```csv
direction,effort_weeks_low,effort_weeks_high
A_saluran,5,7
B_lejar,7,9
C_tapak,8,11
```

**Reading the table (inference).** No single direction wins everything. A natural merge is **A's pipeline home + B's BQ sheet and contract register for desktop + C's phone measuring flow for PJA**. All three already share the same contract/rate-book model, so they can be combined without conflict.

## Shared groundwork (needed by every direction)
Inference from the current schema (`library_groups` has no year/contract; `projects.bq_data` keeps only `sourceGroupId/sourceItemId/sourceVariantId`; `system_settings.sebutharga_numbers` is a string list):
1. A `contracts` record per sebutharga: number, rate-book name, valid from/to, status draf/aktif/ditutup.
2. Rate-book **versions** (Kadar 2026 v1/v2/v3): the item list and rates are copied per version; "Klon kontrak" copies a whole version into a new draft contract.
3. On each project: the bound contract + version and a lock date; on each BQ item: the contract rate it was priced at, and the decision (*kekal* / *baharu*) with who and when.
4. A comparison step that lists items where the project's rate differs from the current version, which feeds A's queue, B's diff column and C's bottom sheet.
