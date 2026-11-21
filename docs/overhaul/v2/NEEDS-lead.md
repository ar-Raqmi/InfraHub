
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

### Lead: P2 requests resolved (2026-11-21)
- `POST /api/projects/:id/log {action,message,diff}` added (action `^[a-z][a-z-]{2,39}$`, 404 for unknown project);
  `RowBookFlag` now logs `row-rate` with the BookDecision; `BookDecision` + `BQItem.bookDecision` live in `types.ts`.
- `reprice` change_log diff carries `unlocked: true|false`.
- `POST /projects` sets `no_sebutharga = contract.code` when the caller leaves it blank.
- `DELETE /api/contracts/:id`: 409 while AKTIF or while any project uses it; otherwise removes versions, groups,
  matches, panel and the contract in one batch, logged. `apiService.deleteContract()` exists for e2e cleanup.
- Probed on a fresh local state: delete AKTIF 409, delete unused DRAF 200, bad log action 400, row-rate 201,
  new project noSebutharga = MPS/SH/302/25.

## From O (Organisasi), 2026-11-21
1. **Migration 0003 (production seed of today's values).** Fold these exact rows into `migrations/0003_org_defaults.sql`.
   They are generated from `components/org/org-defaults.json` (the app's runtime fallback, so day-one output is
   unchanged even before this runs). `INSERT OR IGNORE` = idempotent; verified on a copy of the local D1: 13 config
   rows after run 1, still 13 after run 2, 2 new policy rows. Dev/preview equivalent through the API:
   `python3 docs/overhaul/v2/e2e/O_seed_defaults.py --base <url>` (writes only missing keys).
```sql
-- 0003_org_defaults.sql: Tetapan Organisasi defaults = the values printed before v2 (idempotent).
-- Generated from components/org/org-defaults.json; INSERT OR IGNORE never overwrites an admin's edit.
INSERT OR IGNORE INTO app_config (key, value, updated_at, updated_by) VALUES ('org.profile', '{"name":"Majlis Perbandaran Selayang","short":"MPS","government":"KERAJAAN MALAYSIA","department":"Jabatan Kejuruteraan","procurementUnit":"Bahagian Perolehan","addressLines":["Persiaran 3, Bandar Baru Selayang,","68100 Batu Caves,","Selangor Darul Ehsan"],"phone":"03-61265896","email":"","website":"","slogans":["“KITASELANGOR MAJU BERSAMA”","“MALAYSIA MADANI”","“BERKHIDMAT UNTUK NEGARA”","“MAMPAN PROGRESIF SEJAHTERA”"],"printLetterhead":false}', '2026-11-21T00:00:00.000Z', NULL);
INSERT OR IGNORE INTO app_config (key, value, updated_at, updated_by) VALUES ('org.logo', '{"src":"https://upload.wikimedia.org/wikipedia/commons/6/6e/Selayang_Seal.png","fileName":"Selayang_Seal.png"}', '2026-11-21T00:00:00.000Z', NULL);
INSERT OR IGNORE INTO app_config (key, value, updated_at, updated_by) VALUES ('doc.cpc', '{"heading1":"{{kerajaan}}","heading2":"{{NAMA_ORGANISASI}}","title":"PERAKUAN SIAP KERJA","subtitle":"(CERTIFICATE OF PRACTICAL COMPLETION)","cidb":"Berdaftar dengan CIDB dalam Gred\" {{gred}}\"","sebuthargaLabel":"Sebutharga Untuk :","body":"Menurut Syarat-Syarat Kontrak, dan tertakluk kepada penyiapan berkaitan dengan pembaikan apa-apa kecacatan, ketidaksempurnaan, kesusutan atau apa-apa dan yang mungkin terzahir dalam Tempoh Tanggungan Kecacatan maka adalah dengan ini di perakui bahawa seluruh Kerja yang tersebut telah siap sejajar dengan syarat-syarat dalam Dokumen Sebut Harga pada {{tarikh_siap}} dan diambil milik pada {{tarikh_mula_dlp}} dan dengan itu Tempoh Tanggungan Kecacatan untuk kerja kerja tersebut bermula pada {{tarikh_mula_dlp}} dan berakhir pada {{tarikh_tamat_dlp}}.","signLeft":"Diperakui di tapak,","signLeftRole":"(Penolong Jurutera/Penyelia Tapak)","signRight":"Disahkan,","signRightRole":"(Jurutera)"}', '2026-11-21T00:00:00.000Z', NULL);
INSERT OR IGNORE INTO app_config (key, value, updated_at, updated_by) VALUES ('doc.aku_janji', '{"recipient":"Pengarah,\n{{jabatan}},\n{{nama_organisasi}}.","title":"AKU JANJI","para1":"Adalah dimaklumkan bahawa, saya memperakukan bahawa kerja-kerja di tapak akan dimulakan dalam tempoh lima (5) hari selepas tarikh penyerahan tapak iaitu pada {{tarikh_serah_tapak}}","para2":"Sekiranya kerja-kerja tersebut gagal dimulakan dalam tempoh lima (5) hari, pihak {{nama_ringkas}} berhak menarik semula perlantikan syarikat saya dan melantik semula syarikat lain bagi kerja tersebut.","closing":"Sekian.","signLeft":"Saya yang berjanji","signRight":"Saksi"}', '2026-11-21T00:00:00.000Z', NULL);
INSERT OR IGNORE INTO app_config (key, value, updated_at, updated_by) VALUES ('doc.notis_umum', '{"salutation":"Tuan,","reference":"Saya dengan segala hormatnya merujuk kepada perkara di atas.","item1":"Menyiapkan kerja mengikut jadual yang ditetapkan","item2":"Menyiapkan kerja di tapak dengan kadar segera","closing":"Sekian dimaklumkan, terima kasih.","signOff":"Saya yang menjalankan amanah,","signerRole":"Jurutera Awam","footer":"PANEL {{tahun}}-PJA {{pja}}"}', '2026-11-21T00:00:00.000Z', NULL);
INSERT OR IGNORE INTO app_config (key, value, updated_at, updated_by) VALUES ('doc.notis_pemberitahuan', '{"title":"NOTIS PEMBERITAHUAN","para1":"Adalah dimaklumkan bahawa pihak {{nama_organisasi}} akan melaksanakan kerja-kerja berkaitan di kawasan berkenaan. Kerja-kerja tersebut akan dilaksanakan pada {{tarikh_mula}} sehingga {{tarikh_tamat}}.","para2":"Sehubungan dengan itu, pihak tuan/puan diminta memberikan kerjasama sepanjang kerja-kerja dijalankan seperti mengalihkan kenderaan dan harta benda tuan/puan di kawasan tersebut.","para3":"Kegagalan pihak tuan/puan untuk memberi kerjasama akan menjejaskan perlaksanaan projek kerajaan. Untuk sebarang pertanyaan, sila hubungi {{jabatan}}, {{nama_organisasi}} di talian {{telefon}}.","closing":"Sekian, dimaklumkan."}', '2026-11-21T00:00:00.000Z', NULL);
INSERT OR IGNORE INTO app_config (key, value, updated_at, updated_by) VALUES ('doc.notis_peringatan_1', '{"title":"PERINGATAN PERTAMA","para2":"2. Berdasarkan surat setuju terima yang telah ditandatangani pada {{tarikh_sst}}, semakan jabatan mendapati pihak tuan perlu mematuhi perkara-perkara seperti berikut :","dateRange":"(Tarikh mula kerja : {{tarikh_mula}} - {{tarikh_tamat}})","para3":"3. Oleh yang demikian, pihak tuan dikehendaki untuk mematuhi perkara di atas dan dikehendaki untuk menyerahkan tuntutan dalam tempoh tujuh (7) hari daripada tarikh surat ini dikeluarkan.","para4":"4. Kelewatan pihak tuan berbuat demikian akan mengakibatkan laporan prestasi kerja syarikat tuan terjejas dan denda kelewatan (LAD) sebanyak{{kadar_lad}}/hari akan dikenakan."}', '2026-11-21T00:00:00.000Z', NULL);
INSERT OR IGNORE INTO app_config (key, value, updated_at, updated_by) VALUES ('doc.notis_peringatan_2', '{"title":"PERINGATAN KEDUA","para2":"2. Berdasarkan surat setuju terima yang telah ditandatangani pada {{tarikh_sst}}, didapati pihak tuan masih gagal melaksanakan perkara-perkara seperti berikut:","dateRange":"(Tarikh mula kerja : {{tarikh_mula}} - {{tarikh_tamat}})","para3":"3. Oleh yang demikian, pihak tuan dikehendaki memberi penjelasan secara bertulis di atas kegagalan pihak tuan mematuhi perkara di atas.","para4":"4. Sehubungan dengan itu, pihak tuan dikehendaki menyerahkan tuntutan dengan kadar segera dan pihak tuan juga telah dikenakan denda lewat LAD sebanyak{{kadar_lad}}/hari dari tarikh tamat kontrak tersebut serta penilaian prestasi syarikat tuan telah terjejas."}', '2026-11-21T00:00:00.000Z', NULL);
INSERT OR IGNORE INTO app_config (key, value, updated_at, updated_by) VALUES ('doc.notis_peringatan_3', '{"title":"PERINGATAN KETIGA","para2":"2. Berdasarkan surat setuju terima yang telah ditandatangani pada {{tarikh_sst}}, didapati pihak tuan masih lagi gagal melaksanakan perkara-perkara seperti berikut:","dateRange":"(Tarikh mula kerja : {{tarikh_mula}}- {{tarikh_tamat}})","para3":"3. Oleh yang demikian, pihak tuan dikehendaki memberi penjelasan secara bertulis di atas kegagalan pihak tuan mematuhi perkara di atas.","para4":"4. Sehubungan dengan itu, pihak tuan dikehendaki menyerahkan tuntutan dalam tempohtujuh (7) hari daripada tarikh surat ini dikeluarkan atau tuan akan dikenakan denda lewat LAD. Kegagalan pihak tuan berbuat demikian akan menjejaskan penilaian prestasi syarikat tuan."}', '2026-11-21T00:00:00.000Z', NULL);
INSERT OR IGNORE INTO app_config (key, value, updated_at, updated_by) VALUES ('doc.kerja_tidak_siap', '{"heading1":"{{kerajaan}}","heading2":"{{NAMA_ORGANISASI}}","heading3":"{{JABATAN}}","title":"PERAKUAN KERJA TIDAK SIAP","subtitle":"(CERTIFICATE OF NON-COMPLETION)","cidb":"Berdaftar dengan C.I.D.B. dalam Gred\"{{gred}}\"","para1":"Dengan ini adalah diperakui bahawa tuan telah gagal menyiapkan Kerja / Sebahagian daripada Kerja* yang tersebut di atas pada \"Tarikh Siap\" yang dinyatakan dalam Lampiran kepada Syarat-Syarat Kontrak ataupun dalam tempoh lanjutan masa yang telah dibenarkan di bawah Klausa 43 Syarat-Syarat Kontrak, iaitu pada {{tarikh_siap_kontrak}} dan mengikut pendapat saya Kerja / Sebahagian daripada Kerja* tersebut itu sepatutnya telah disiapkan pada tarikh ini.","para1En":"It is hereby certified that you have failed to complete the Works / Section of the Works* as mentioned above by the \"Date for Completion\" stated in the Appendix to the Conditions of Contract or within any extended time approved under Clause 43 of the Conditions of Contract, i.e. on {{tarikh_siap_kontrak}} and in my opinion the said Works / Section of the Works* ought to have been completed.","para2":"Menurut Klausa 40 Syarat-Syarat Kontrak, tuan adalah dengan ini diberitahu bahawa tuan kenalah membayar atau membenarkan kepada Kerajaan sejumlah wang yang dikira atas kadar yang dinyatakan dalam Lampiran kepada Syarat-Syarat Kontrak, iaitu {{kadar_lad}} setiap hari sebagai Ganti Rugi Tertentu dan Ditetapkan banyaknya sepanjang tempoh yang Kerja / Sebahagian daripada Kerja* tersebut itu tidak disiapkan sepenuhnya dan saya akan memperakukan supaya potongan sewajarnya dibuat dari apa-apa wang yang kena dibayar atau yang akan kena dibayar kepada tuan di bawah Kontrak ini.","para2En":"In accordance with Clause 40 of the Conditions of Contract, you are hereby informed that you are liable to pay or allow to the Government a sum calculated at the rate stated in the Appendix to the Conditions of Contract, i.e.{{kadar_lad}} per day as Liquidated and Ascertained Damages for the period during which the said Works / Section of the Works* shall so remain and have remain incomplete and I shall certify for deduction such damages from any money due or which may become due to you under this Contract.","signTitle":"Wakil Pegawai Penguasa","signTitleEn":"(Deputy Superintending Officer)","footnote":"* Potong jika tidak berkenaan.","footnoteEn":"Delete if not applicable."}', '2026-11-21T00:00:00.000Z', NULL);
INSERT OR IGNORE INTO app_config (key, value, updated_at, updated_by) VALUES ('doc.lad', '{"title":"DENDA KELEWATAN MENYIAPKAN KERJA","noteSmall":"Bagi Kontrak bernilai kurang RM {{had_lad}}, kadar Denda (LAD) adalah RM {{kadar_lad_rata}}/hari rata.","noteBlr":"BLR {{blr}} ( Maklumat daripada {{unit_perolehan}} )","flatLine":"KADAR DENDA (LAD) = RM {{kadar_lad_rata}} / HARI"}', '2026-11-21T00:00:00.000Z', NULL);
INSERT OR IGNORE INTO app_config (key, value, updated_at, updated_by) VALUES ('doc.loc', '{"title":"DENDA LEWAT TUNTUTAN (LoC)","heading":"PENGIRAAN DENDA LEWAT TUNTUTAN","rule1":"1. Tempoh liabiliti untuk tuntutan bayaran adalah {{hari_tangguh}} hari selepas Tarikh Siap Sebenar.","rule2":"2. Denda dikenakan bermula hari ke-{{hari_mula_denda}} selepas Tarikh Siap Sebenar.","rule3":"3. Kadar denda adalah RM {{kadar_loc}} / Hari."}', '2026-11-21T00:00:00.000Z', NULL);
INSERT OR IGNORE INTO app_config (key, value, updated_at, updated_by) VALUES ('doc.prestasi', '{"title":"BORANG PRESTASI KONTRAKTOR / PEMBEKAL","criterion1":"Keupayaan kontraktor/ pembekal memenuhi permintaan dari segi harga berbanding kontraktor/ pembekal lain.","criterion2":"Keupayaan kontraktor/ pembekal untuk membekalkan barangan /perkhidmatan/kerja mengikut spesifikasi yang ditetapkan.","criterion3":"Keupayaan kontraktor/ pembekal untuk membekalkan barangan/ perkhidmatan dalam jangkamasa yang ditetapkan.","criterion4":"Keupayaan kontraktor/ pembekal untuk membuat tindakan pembetulan sekiranya barangan/ perkhidmatan yang dibekalkan tidak memenuhi spesifikasi yang ditetapkan.","criterion5":"Penilaian terhadap kontraktor/pembekal dari segi sikap dan kerjasama yang ditunjukkan oleh kontraktor/pembekal.","criterion6":"Kekemasan dan kebersihan semasa dan selepas melaksanakan kerja / penghantaran bekalan.","sign1":"PENGESAHAN PEGAWAI PENYELIA TAPAK / PENERIMA BEKALAN","sign2":"PENGESAHAN PEGAWAI / JURUTERA","sign3":"PERAKUAN PENGARAH JABATAN - Maklumat telah dikemaskini di dalam sistem.","footer":"Sila hantar salinan borang ini ke :    {{unit_perolehan}}, {{nama_organisasi}}"}', '2026-11-21T00:00:00.000Z', NULL);
INSERT OR IGNORE INTO policy_rules (key, effective_from, value, note, created_at, created_by) VALUES ('DLP_MONTHS', '2020-01-01', '6', 'CPC: Tempoh Tanggungan Kecacatan (bulan)', '2026-11-21T00:00:00.000Z', NULL);
INSERT OR IGNORE INTO policy_rules (key, effective_from, value, note, created_at, created_by) VALUES ('TEMPOH_KONTRAK_DEFAULT_WEEKS', '2020-01-01', '0', 'Tempoh kontrak lalai untuk projek baharu (minggu; 0 = kosong)', '2026-11-21T00:00:00.000Z', NULL);
```
2. **`domain/policy.ts`**: add `DLP_MONTHS` (6) and `TEMPOH_KONTRAK_DEFAULT_WEEKS` (0) to `POLICY_KEYS` and
   `DEFAULT_POLICY_RULES`, so `migrate-legacy` seeds them too. Until then they live in
   `components/org/orgDefaults.ts` (`EXTRA_POLICY_KEYS`) and the merged default list there.
3. **Policies are append-only, but the API is not.** `POST /policies` upserts on `(key, effective_from)`, which can
   overwrite history. Requests: (a) answer **409** when the pair already exists (the UI already refuses it);
   (b) `DELETE /policies/:key/:effective_from` allowed **only while effective_from > today** ("batal nilai belum
   berkuat kuasa"), logged. Without (b) the O e2e can only neutralise its test value (it posts the old value back on
   the same date), so each run leaves one inert row; the spec picks the next free day so it is re-runnable.
4. **`hooks/useOrgConfig.ts`**: invalidate `['changelog']` after `setConfig` / `addPolicy` / `saveLookups`
   (OrganisasiPage does this locally with a `logged()` wrapper).
5. **`vitest.config.ts`**: add `'components/**/*.test.ts'` to `include` so `components/org/orgDocs.test.ts`
   (11 tests: templates, OrgDocs fallbacks, policyAt boundary, DLP, ladPolicyDate) runs in the gate. Today it runs
   with a scratch config only.
6. **BP / Zon / Mukim dropdowns (not my files):** replace the constants with `useLookups(list).active`
   (value = `code`, text = `label`), keeping the constants only as fallback while loading:
   `pages/ProjectDetail.tsx:1393` (BP), `:1417` (ZON), `:1452` (MUKIM) → P2;
   `pages/ProjectsList.tsx:708` (ZON), `:716` (BP), `:724` (MUKIM) → P1. Codes are the old option strings, so
   existing projects keep matching.
7. **`services/pdf/BQPDFExporter.ts` (P2/lead):** it still hard-codes the letterhead: Selayang seal + imgur MPS logo
   (`:74-75`), `Persiaran 3…`/`68100 Batu Caves` (`:95-96`), `Pengarah / Jabatan Kejuruteraan` (`:112-113`) and
   `Jawatankuasa Sebutharga Majlis Perbandaran Selayang (MPS)` (`:191`). Suggested: `const org = (await
   loadOrgDocs()).forProject(project)` and use `org.logo`, `org.profile.name/addressLines/department/short`;
   pass `org.profile.slogans` as the 6th argument of `PDFBaseHelper.drawGovernmentSlogans` (it defaults to today's
   slogans, so nothing breaks before that).
8. **LAD/LoC dates must agree with P2.** Documents read the LAD rule on `ladPolicyDate(project)` =
   tarikhMulaKontrak → tarikhSerahTapak → tarikhTamatKontrak → today (the rate is fixed by the contract), and LoC on
   `locPolicyDate(project)` = tarikhSiapSebenar → tarikhTuntutanBayaran → today (both in `services/finance.ts`).
   ProjectDetail's stored `ladAmount`/`locAmount` should use the same dates with `domain/money` so the certificate
   and the stored amount never differ. Owner may prefer another date; it is one function to change.
9. **Logo storage:** the logo is a ≤350 kB PNG data URL in `app_config['org.logo']`, because
   `/api/storage/upload` files images into the project photo gallery (user/project fields, gallery listing and
   cleanup). If a dedicated `PUT /api/storage/org-logo` (R2, fixed key) is added later, only `LogoSection` changes;
   `org.logo.src` then holds the URL. Note `change_log.diff` stores before/after, so each logo change logs up to ~0.7 MB.

### Lead: O requests resolved (2026-11-22)
1. `migrations/0003_org_defaults.sql` = O's SQL verbatim + a `doc.bq` row (BQ cover texts). Applied on a fresh state: all 14 doc/org keys present.
2. `DLP_MONTHS`, `TEMPOH_KONTRAK_DEFAULT_WEEKS` are now in `domain/policy` (POLICY_KEYS + DEFAULT_POLICY_RULES); `EXTRA_POLICY_KEYS` aliases them; the duplicate copy in org-defaults.json is gone.
3. `POST /policies` → 409 on an existing (key, date). `DELETE /policies/:key/:date` withdraws only a value not yet in force (409 otherwise, 404 if missing), logged as `withdraw`. O.spec restores via DELETE now.
4. `useOrgConfig` mutations also invalidate `['changelog']`.
5. `vitest.config.ts` includes `components/**/*.test.ts` → 81 tests in the gate.
6. ProjectDetail BP/Zon/Mukim use `useLookupOptions(list, fallback)`; Zon sort follows the list order. ProjectsList: P1 was steered to do the same.
7. BQPDFExporter cover letter reads `doc.bq` + org logo + org slogans. Parity: pdftotext of 3 projects before vs after = IDENTICAL; a changed `doc.bq` changes exactly the 2 edited lines.
8. ONE policy-date rule (`ladPolicyDate`, `locPolicyDate`, `clampToRules` in domain/policy) used by both the form (moneyRules) and the documents (finance.ts re-export): LAD = mula kontrak → lantikan → serah tapak → tamat → buka; LoC = siap sebenar → tuntutan.
9. Config change_log replaces data-URL images with `[imej N aksara]` (5,022-char logo → 77-char diff).

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
