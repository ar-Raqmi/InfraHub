# InfraHub — UI/UX audit of the current app (local copy, 2026-11-20)

Scope: the live build served from the local D1 copy on :8790, logged in as the local test admin.
Screens captured at desktop 1440×900 (saved at 1280 wide) and phone 430×932 @2x (saved at 645 wide).
All company and staff names were replaced in the DOM before capture (see REPORT-ux.md, leak check = 0 on every shot).
Project used for detail/BQ shots: a 2026 project in status SIAP with a contract BQ and a different BQ Pelarasan.

Screenshot key (all in `work/ux/current/`):

| id | desktop | phone |
|---|---|---|
| Dashboard | `d-01-dashboard.png`, `d-01b-dashboard-full.png` | `m-01-dashboard.png`, `m-01b-dashboard-full.png` |
| Projects list | `d-02-projects.png` | `m-02-projects.png` |
| Project detail (tab 1) | `d-03-project-detail.png` | `m-03-project-detail.png` |
| BQ editor (contract BQ) | `d-04b-bq-editor-view.png`, `d-04-bq-editor-full.png` | `m-04b-bq-editor-view.png`, `m-04-bq-editor-full.png` |
| Tab 2 File Creation (PT) | `d-05-phase2-file.png`, `-full` | `m-05-phase2-file.png`, `-full` |
| Tab 3 BQ Pelarasan | `d-06-pelarasan.png`, `-full` | `m-06-pelarasan.png`, `-full` |
| Tab 4 Penutup | `d-07-penutup.png` | `m-07-penutup.png` |
| CPC certificate preview | `d-08-cpc-preview.png` | `m-08-cpc-preview.png` |
| Settings (top, full) | `d-09-settings-top.png`, `d-09b-settings-full.png` | `m-10-settings-company.png`, `-vote`, `-sebutharga` |
| Pustaka BQ (library) | `d-10-pustaka.png` | `m-10-settings-pustaka.png` |

Severity: **S1** = causes wrong money/contract decisions or blocks a core task; **S2** = slows every user every day; **S3** = polish/consistency.

---

## S1 — The contract behind a BQ is invisible

### 1. No screen says which sebutharga / rate book a project's rates come from
- Evidence: `d-04b-bq-editor-view.png` — the BQ editor header shows "BIL NO. 1 – KERJA-KERJA PERMULAAN · Total RM 2,040.00" and each item shows a bare "Kadar 510". Nothing says *where* 510 came from (which library version, which contract, which year).
- The only contract field is **No. Sebutharga**, a dropdown deep in Tab 2 "File Creation (PT)" (`d-05-phase2-file-full.png`, bottom row). It is filled by PT *after* the PJA has already priced the BQ in Tab 1. So the order in the UI is: price first, choose contract later.
- The contract number then appears once more, inside the CPC certificate (`d-08-cpc-preview.png`, "No. Sebutharga : MPS/SH/302/25").
- Code fact: when a template is inserted, rates are re-read from the library at that moment (`pages/BQEditor.tsx:598-615`); after that the project keeps a frozen copy in `projects.bq_data`. The project stores only `sourceGroupId/sourceItemId/sourceVariantId` — no rate-book id, no date, no original rate.

### 2. No warning when the library rate differs from the rate frozen in a project
- Evidence: `d-10-pustaka.png` lets PT edit any preset rate; `d-04b-bq-editor-view.png` shows the project's rate with no "changed since" badge.
- Consequence: when PT changes a rate for a new contract, older projects silently keep the old rate (good for finished jobs, risky for drafts), and newly inserted templates silently take the new one. A PJA cannot see that two projects in the same month use different rates for the same item.

### 3. The settings page implies the BQ library is per-year — it is not
- Evidence: `d-09-settings-top.png` header "Tetapan Sistem — Uruskan data utama bagi tahun **2026**" with a year picker. Meeting, sebutharga, company and vote lists are per year (`system_settings` has one row per year), but **Pustaka BQ** further down the same page (`d-10-pustaka.png`) is one global list with no year and no contract. `library_groups` has no year or contract column (lead-verified schema), so the year picker cannot change what Pustaka shows (inferred from the schema; not clicked through). The page's framing is misleading about the single most money-sensitive data set.

### 4. The sebutharga list is only a string
- Evidence: `d-09-settings-top.png` / `m-10-settings-sebutharga.png` — "Senarai No. Sebutharga (2026)" holds one text row `MPS/SH/302/25`. No start/end date, no status (draft/active/closed), no linked rate book, no RM 200,000 cap per company shown next to it, no count of projects using it.

---

## S2 — Workflow and navigation

### 5. Two pipelines that do not line up: 6 statuses vs 4 tabs
- Status dropdown at top-left of the project ("SIAP", `d-03-project-detail.png`) uses the 6 statuses (Draf → Menunggu Lantikan → Dalam Proses → Pemeriksaan Tapak → Tuntutan Bayaran → Siap).
- The tabs below use 4 phases "1. BQ Building (PJA) / 2. File Creation (PT) / 3. Pelarasan (PJA) / 4. Penutup (PT)".
- Nothing maps one to the other; the user must know that "Pemeriksaan Tapak" means "work in tab 3". The tab colours (yellow / blue / yellow / orange) are role colours, not progress colours, so a finished project looks the same as a fresh one.

### 6. Status is an editable dropdown, not a visible pipeline
- Dashboard status tiles (`d-01-dashboard.png`: 29 / 34 / 53 / 32 / 46 / 291) are good counts, but they are six equal boxes with large faded ghost icons; there is no sense of flow, ageing or bottleneck (e.g. how long the 46 in Tuntutan Bayaran have waited).
- On the project page the status is a plain `<select>` in the top bar: changing it is easy, understanding *why* a project is in that status is not.

### 7. Projects list: 485 rows, 10 per page, titles in 5-line ALL CAPS
- Evidence: `d-02-projects.png` — "Paparan 1 hingga 10 dari 485", 49 pages. Each row's Nama Projek wraps to 4–5 lines of capitals, so a 900 px screen shows ~3.5 projects. The useful columns (PJA, status, progress) are narrow and pale (status pill "Draf 0%").
- No grouping by status or by sebutharga/company, which is how PT actually works through the list.

### 8. The project top bar overlaps itself and cries wolf
- Evidence: `d-03-project-detail.png` top bar — the amber "BELUM DISIMPAN" badge collides with the "PRESTASI PROJEK" label; the badge shows on a fresh load with no edits (also noted in the screenshot skill). A permanent "unsaved" warning trains users to ignore it.

### 9. Long forms, flat hierarchy
- Tab 2 (`d-05-phase2-file-full.png`, 2,672 px tall) is a 3-column grid of ~20 same-weight fields (No. Fail, Syarikat, Bulan, No. Vot, Tarikh Lantikan, BPP, Tempoh, ... No. Sebutharga). Dates that the system computes ("AUTO") look the same as fields the user must type, except for a tiny "Auto" tag.
- Tab 3 (`d-06-pelarasan-full.png`) repeats this pattern with LAD/LoC/wang tahanan; the money results (Harga Kontrak vs Harga Akhir) sit as grey read-only inputs at the bottom instead of a summary.

### 10. BQ editor: wizard-style navigation for a spreadsheet task
- Evidence: `d-04b-bq-editor-view.png` — left rail "NAVIGASI BQ" with one card per Bil (Kerja Permulaan, Longkang, Crossing Culvert, Laluan Keluar/Masuk, Tambahan); right side shows one Bil at a time with nested accordions (1.0 All quantity are provisional / 2.0 Insurans / 2.1 long paragraph). The user never sees the whole BQ with quantities × rates as a sheet, which is how contractors, Jurutera and finance read it.
- Item descriptions are full paragraphs at body size, so measurements (P/L/T, Kiraan) are visually secondary to boilerplate text.

---

## S2 — Mobile vs desktop

### 11. Phone project page is a desktop form stacked vertically
- `m-03-project-detail.png`: header + 4 numbered circles + full-width title card + status + notice accordion consume the whole first screen before any task content. The stepper circles (1–4) are good, but they are the 4 phases, not the 6 statuses.
- `m-04b-bq-editor-view.png`: the BQ editor on phone shows nested accordions with small P/L/T inputs; there is no "measure this item" flow for a PJA standing on site.
- Sticky bottom bar "BELUM DISIMPAN · PDF · Simpan" is always present (again the false unsaved state).

### 12. Six-item bottom navigation
- `m-01-dashboard.png` and every phone shot: Dashboard / Projek / Laporan / Pengguna / Profil / Tetapan. PJA users never need Pengguna/Tetapan; six 10 px labels make every target narrow. A PJA's real top tasks (my active projects, measure, upload photos) are not first-class.

---

## S3 — Visual language and consistency

### 13. Typography has no voice
- `public/global.css:5` sets **Manrope**, and every HTML entry also loads **Plus Jakarta Sans** and **Inter** (`dashboard.html:22`) — three near-identical geometric sans families. Hierarchy is carried by uppercase micro-labels at ~10 px with wide tracking (every form label), which reads as "AI dashboard" and is hard to read on phones outdoors.
- Money uses a mono font in the top bar (`RM 39,037.39`) but not in tables or cards, so figures do not align.

### 14. Colour is decorative, not semantic
- The same screen uses emerald (save, nav), yellow (tab 1/3), blue (tab 2), orange (tab 4, "Simpan Tetapan Mesyuarat" button), red (Jana Notis), indigo/purple/orange/red/pink for the four certificate buttons (`d-06-pelarasan.png`), and red/blue/green bars for "Prestasi Projek". None of these colours mean the same thing twice. MPS purple (#3B2E8C) appears only in reports.
- Large faded "ghost" icons in dashboard tiles and soft gradients add noise without information.

### 15. Mixed English / Malay labels
- "BQ Building (PJA)", "File Creation (PT)", "Closing File / Project", "BQ Pelarasan Building", "Wizard Mode", "Collapse All", "Global Calculation", "Template" next to Malay labels. The users and documents are Malay.

### 16. Admin settings is one very long page
- `d-09b-settings-full.png` (3,397 px): Mesyuarat, Sebutharga, Template BQ, Pustaka BQ, Syarikat, Vot all on one scroll with different card styles (orange gradient button, purple cube icon, emerald icon tiles). The Pustaka editor's right pane is an empty state ("Pilih kumpulan…") taking ~60 % of the width until a group is chosen (`d-10-pustaka.png`).

---

## What already works (keep it)
- The status counts on the dashboard and the phone numbered stepper are the right ideas, just under-powered.
- Live totals in the top bar (Jumlah Kos / Harga Akhir with the strike-through contract price on Pelarasan, `m-06-pelarasan.png`) — this "contract vs final" pairing is exactly the pattern the rate-book problem needs.
- CPC preview is a faithful document render (`d-08-cpc-preview.png`) — documents are a strength.
- Phone settings sub-routes (`#pustaka`, `#company`, `#vote`, `#sebutharga`) already give each admin list its own screen.

## Design implications carried into the three directions
1. A project must carry a visible **contract binding** chip (sebutharga + rate book + status) from the moment BQ pricing starts, not after.
2. Rate books need **versions with dates and a status** (draft / aktif / ditutup) and a **clone** action; the library stops being one global list.
3. The BQ editor must show **"kadar berubah"** per item with an explicit choice: *kekal kadar kontrak* vs *guna kadar baharu*.
4. One pipeline vocabulary (6 statuses), with the 4 phases shown as *who acts* inside each status.
5. One typeface system with real numerals; colour reserved for status and money meaning.
