FOUNDATION READY

# InfraHub v2 API (wave 1, sub-Yiyi F)

All routes live under `/api`, take and return JSON, and read the acting user from the header
`X-InfraHub-User: <app_users.id>` (the client sends it from the stored session; the server looks up the
name for the change log). Every write appends one `change_log` row **in the same D1 batch** as the change.

Errors: `{error, message, detail?}` with `400` bad input, `404` not found, `409` conflict / wrong state,
`423` project contract locked (No. Inden set), `501` no AI binding.

Conventions: request bodies for contracts use the column names from CONTRACT §3 (`valid_from`,
`company_cap`, ...); responses are camelCase (`types.ts`: `Contract`, `RateBookVersion`, `ChangeLogEntry`...).
Rate-book rows: a `ref` is `groupId/itemId[/variantId]`; ids of rows an officer matched stay the same across
versions, so `bq_data[].sourceItemId/sourceVariantId` keep resolving.

Every example below was captured with curl from the local server on port 8791 (anonymised dev seed, legacy
migration run first). Long arrays are cut to the first entries and project payloads are reduced to ids, codes
and amounts. Timings are local workerd wall time.

## Route list
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/contracts` | | `Contract[]` with `stats {projects, versions, currentVersion, panelSize}` |
| POST | `/contracts` | `{code,title,kind?,valid_from?,valid_to?,company_cap?,meeting_number?,meeting_date?,notes?,clone_from?}` | `201 Contract` (status DRAF; `clone_from` copies the source's current book as v1 CLONE + its panel) |
| GET / PATCH | `/contracts/:id` | PATCH: any editable field above | `Contract` |
| POST | `/contracts/:id/status` | `{status}` | `Contract`; only DRAF→AKTIF (needs a TERBIT book) and AKTIF→DITUTUP |
| GET / PUT | `/contracts/:id/companies` | PUT: `[{name, cap?, details?}]` in panel order | `ContractCompany[]` |
| GET | `/contracts/:id/book?version=` | `version` = number or version id; default current TERBIT | `PresetGroup[]` (header `X-Rate-Book-Version`) |
| GET | `/contracts/:id/versions` | | `RateBookVersion[]` newest first (the commit log) |
| POST | `/contracts/:id/versions/import` | `{fileName, rateColumn, book: ParsedBook}` | `201 {version, stats, matches: RowMatch[], removed: BookRow[]}` |
| GET | `/rate-book/versions/:vid` | | `{version, groups, matches, removed}` |
| PATCH | `/rate-book/versions/:vid/matches` | `{decisions:[{new_ref, decision, old_group_id?, old_item_id?, old_variant_id?}]}` | `RateBookMatchRow[]` (giving `old_*` makes it MANUAL) |
| POST | `/rate-book/versions/:vid/publish` | `{message}` | `{version, diff}`; `409` while any match is PENDING |
| GET | `/rate-book/diff?from=&to=` | version ids | `BookDiff` |
| POST | `/projects/:id/contract` | `{contractId, unlock?}` | project; `423` when No. Inden is set and `unlock` is not true |
| POST | `/projects/:id/reprice` | `{toContractId, dryRun, unlock?}` | dry: `{dryRun, contract, rateBookVersionId, plan}`; apply: `{dryRun:false, plan, project}` |
| GET | `/changelog?entity=&entityId=&limit=` | | `ChangeLogEntry[]` newest first (limit 1-500, default 50) |
| GET / PUT | `/config`, `/config/:key` | PUT `{value}` | all keys / `{key, value}` |
| GET / PUT | `/lookups/:list` | PUT `LookupValue[]` | `LookupValue[]` (lists seeded: BP, ZON, MUKIM) |
| GET / POST | `/policies` | POST `{key, effective_from, value, note?}` | all rules / rules of that key |
| POST | `/ai/match-suggest` | | `501` (no AI binding) |
| POST | `/v2/admin/migrate-legacy` | | migration summary (idempotent) |
| GET | `/system/library_groups` | | COMPAT: the AKTIF contract's current book (legacy table if no contract yet) |
| PUT | `/system/library_groups` | `PresetGroup[]` | COMPAT: new TERBIT `EDIT` version on the AKTIF contract; nothing is deleted |
| GET | `/projects` | | rows now carry `contractId`, `rateBookVersionId` (read-only through PUT) |
| POST | `/projects` | as before, optional `contractId` | new project bound to that contract, else the default AKTIF one |

Matching rules (`domain/rateBook/matchItems.ts`): EXACT = same normalised wording + variant + unit → ACCEPT;
CODE = same item number + unit → ACCEPT when the wording is still similar, else PENDING; FUZZY (same unit,
text similarity ≥ 0.6) → always PENDING; NEW → ACCEPT (new id). REJECT on a suggestion makes the row NEW at publish.
Default AKTIF contract for new projects: the most recently activated AKTIF PANEL contract.

## Examples

### POST /v2/admin/migrate-legacy (first run)
```bash
curl -s -X POST 'http://localhost:8791/api/v2/admin/migrate-legacy' -H 'X-InfraHub-User: <id>'
```
Response `200` (0.207s, trimmed):
```json
{
 "activeContract": "MPS/SH/302/25",
 "createdContracts": [
  "MPS/25/25/25",
  "MPS/SH/2025/001",
  "… 1 more"
 ],
 "changedRows": 1362,
 "before": {
  "contracts": 0,
  "companies": 0,
  "contract_companies": 0,
  "rate_book_versions": 0,
  "rate_book_groups": 0,
  "lookup_values": 0,
  "policy_rules": 0,
  "projects_linked": 0
 },
 "after": {
  "contracts": 3,
  "companies": 63,
  "contract_companies": 60,
  "rate_book_versions": 3,
  "rate_book_groups": 207,
  "lookup_values": 36,
  "policy_rules": 10,
  "projects_linked": 490
 }
}
```
### POST /v2/admin/migrate-legacy (second run: nothing changes)
Idempotency proof: `changedRows: 0`, `before == after`.
```bash
curl -s -X POST 'http://localhost:8791/api/v2/admin/migrate-legacy' -H 'X-InfraHub-User: <id>'
```
Response `200` (0.037s, trimmed):
```json
{
 "activeContract": "MPS/SH/302/25",
 "createdContracts": [],
 "changedRows": 0,
 "before": {
  "contracts": 3,
  "companies": 63,
  "contract_companies": 60,
  "rate_book_versions": 3,
  "rate_book_groups": 207,
  "lookup_values": 36,
  "policy_rules": 10,
  "projects_linked": 490
 },
 "after": {
  "contracts": 3,
  "companies": 63,
  "contract_companies": 60,
  "rate_book_versions": 3,
  "rate_book_groups": 207,
  "lookup_values": 36,
  "policy_rules": 10,
  "projects_linked": 490
 }
}
```
### GET /contracts
```bash
curl -s -X GET 'http://localhost:8791/api/contracts' -H 'X-InfraHub-User: <id>'
```
Response `200` (0.006s, trimmed):
```json
[
 {
  "id": "legacy-mps-sh-302-25",
  "code": "MPS/SH/302/25",
  "title": "Sebutharga MPS/SH/302/25",
  "kind": "PANEL",
  "status": "AKTIF",
  "validFrom": null,
  "validTo": null,
  "companyCap": 200000,
  "meetingNumber": "26/2025",
  "meetingDate": "9 Disember 2025",
  "notes": "Dicipta oleh migrasi data lama (tetapan 2026)",
  "clonedFrom": null,
  "createdAt": "2026-11-21T14:59:12.904Z",
  "createdBy": 1,
  "activatedAt": "2026-11-21T14:59:12.904Z",
  "closedAt": null,
  "stats": {
   "projects": 488,
   "versions": 1,
   "currentVersion": 1,
   "panelSize": 60
  }
 },
 {
  "id": "legacy-mps-25-25-25",
  "code": "MPS/25/25/25",
  "title": "Sebutharga MPS/25/25/25",
  "kind": "PANEL",
  "status": "DITUTUP",
  "validFrom": null,
  "validTo": null,
  "companyCap": 200000,
  "meetingNumber": null,
  "meetingDate": null,
  "notes": "Dicipta oleh migrasi data lama (tetapan 2025)",
  "clonedFrom": null,
  "createdAt": "2026-11-21T14:59:12.904Z",
  "createdBy": 1,
  "activatedAt": null,
  "closedAt": "2026-11-21T14:59:12.904Z",
  "stats": {
   "projects": 1,
   "versions": 1,
   "currentVersion": 1,
   "panelSize": 0
  }
 },
 "… 1 more"
]
```
### GET /contracts/:id
```bash
curl -s -X GET 'http://localhost:8791/api/contracts/legacy-mps-sh-302-25' -H 'X-InfraHub-User: <id>'
```
Response `200` (0.006s, trimmed):
```json
{
 "id": "legacy-mps-sh-302-25",
 "code": "MPS/SH/302/25",
 "title": "Sebutharga MPS/SH/302/25",
 "kind": "PANEL",
 "status": "AKTIF",
 "validFrom": null,
 "validTo": null,
 "companyCap": 200000,
 "meetingNumber": "26/2025",
 "meetingDate": "9 Disember 2025",
 "notes": "Dicipta oleh migrasi data lama (tetapan 2026)",
 "clonedFrom": null,
 "createdAt": "2026-11-21T14:59:12.904Z",
 "createdBy": 1,
 "activatedAt": "2026-11-21T14:59:12.904Z",
 "closedAt": null,
 "stats": {
  "projects": 488,
  "versions": 1,
  "currentVersion": 1,
  "panelSize": 60
 }
}
```
### GET /contracts/:id/companies
Company details reduced to non-contact fields here.
```bash
curl -s -X GET 'http://localhost:8791/api/contracts/legacy-mps-sh-302-25/companies' -H 'X-InfraHub-User: <id>'
```
Response `200` (0.011s, trimmed):
```json
[
 {
  "name": "Syarikat 61 Enterprise",
  "sortIndex": 0,
  "cap": 200000,
  "details": {
   "gred": "G1",
   "name": "Syarikat 61 Enterprise",
   "limit": 200000
  }
 },
 {
  "name": "Syarikat 38 Enterprise",
  "sortIndex": 1,
  "cap": 200000,
  "details": {
   "gred": "G1",
   "name": "Syarikat 38 Enterprise",
   "limit": 200000
  }
 },
 "… 58 more"
]
```
### GET /contracts/:id/book
```bash
curl -s -X GET 'http://localhost:8791/api/contracts/legacy-mps-sh-302-25/book' -H 'X-InfraHub-User: <id>'
```
Response `200` (0.014s, trimmed):
```json
[
 {
  "id": "PB-5",
  "title": "TEMPAT DUDUK",
  "category": "Perhentian Bas",
  "items": [
   {
    "id": "PB-5-01",
    "description": "Kerja-kerja membuka dan menanggal struktur tempat duduk sedia ada termasuk kerja-kerja …",
    "unit": "L/S",
    "rate": 425
   },
   "… 2 more"
  ]
 },
 "… 68 more"
]
```
### GET /contracts/:id/versions
```bash
curl -s -X GET 'http://localhost:8791/api/contracts/legacy-mps-sh-302-25/versions' -H 'X-InfraHub-User: <id>'
```
Response `200` (0.010s, trimmed):
```json
[
 {
  "id": "legacy-mps-sh-302-25-v1",
  "contractId": "legacy-mps-sh-302-25",
  "versionNo": 1,
  "status": "TERBIT",
  "message": "Pustaka semasa (migrasi)",
  "source": "LEGACY",
  "sourceFile": null,
  "rateColumn": null,
  "stats": {
   "groups": 69
  },
  "createdAt": "2026-11-21T14:59:12.904Z",
  "createdBy": 1,
  "publishedAt": "2026-11-21T14:59:12.904Z",
  "publishedBy": 1
 }
]
```
### PUT /system/library_groups (COMPAT edit)
Creates version 2 (`source: EDIT`); version 1 keeps its 69 groups and `library_groups` is untouched.
```bash
curl -s -X PUT 'http://localhost:8791/api/system/library_groups' -H 'X-InfraHub-User: <id>' -H 'Content-Type: application/json' --data-binary @body.json
```
Request body (trimmed):
```json
[
 {
  "id": "PB-5",
  "title": "TEMPAT DUDUK",
  "category": "Perhentian Bas",
  "items": [
   {
    "id": "PB-5-01",
    "description": "Kerja-kerja membuka dan menanggal struktur tempat duduk sedia ada termasuk kerja-kerja …",
    "unit": "L/S",
    "rate": 426
   },
   "… 2 more"
  ]
 },
 "… 68 more"
]
```
Response `200` (0.036s, trimmed):
```json
{
 "success": true,
 "versionId": "rbv_41758f17b09c",
 "versionNo": 2,
 "diff": {
  "unchanged": 385,
  "rateChanged": 1,
  "wordingChanged": 0,
  "added": 0,
  "removed": 0
 }
}
```
### GET /contracts/:id/versions after the compat edit
```bash
curl -s -X GET 'http://localhost:8791/api/contracts/legacy-mps-sh-302-25/versions' -H 'X-InfraHub-User: <id>'
```
Response `200` (0.009s, trimmed):
```json
[
 {
  "id": "rbv_41758f17b09c",
  "contractId": "legacy-mps-sh-302-25",
  "versionNo": 2,
  "status": "TERBIT",
  "message": "Suntingan Pustaka",
  "source": "EDIT",
  "sourceFile": null,
  "rateColumn": null,
  "stats": {
   "diff": {
    "unchanged": 385,
    "rateChanged": 1,
    "wordingChanged": 0,
    "added": 0,
    "removed": 0
   },
   "baseVersionId": "legacy-mps-sh-302-25-v1"
  },
  "createdAt": "2026-11-21T14:59:16.041Z",
  "createdBy": 1,
  "publishedAt": "2026-11-21T14:59:16.041Z",
  "publishedBy": 1
 },
 {
  "id": "legacy-mps-sh-302-25-v1",
  "contractId": "legacy-mps-sh-302-25",
  "versionNo": 1,
  "status": "TERBIT",
  "message": "Pustaka semasa (migrasi)",
  "source": "LEGACY",
  "sourceFile": null,
  "rateColumn": null,
  "stats": {
   "groups": 69
  },
  "createdAt": "2026-11-21T14:59:12.904Z",
  "createdBy": 1,
  "publishedAt": "2026-11-21T14:59:12.904Z",
  "publishedBy": 1
 }
]
```
### POST /contracts (clone of the AKTIF contract)
```bash
curl -s -X POST 'http://localhost:8791/api/contracts' -H 'X-InfraHub-User: <id>' -H 'Content-Type: application/json' --data-binary @body.json
```
Request body (trimmed):
```json
{
 "code": "MPS/SH/TEST/2026",
 "title": "Sebutharga ujian v2",
 "kind": "PANEL",
 "valid_from": "2026-12-01",
 "company_cap": 200000,
 "clone_from": "legacy-mps-sh-302-25"
}
```
Response `201` (0.031s, trimmed):
```json
{
 "id": "ctr_163b84fb762b",
 "code": "MPS/SH/TEST/2026",
 "title": "Sebutharga ujian v2",
 "kind": "PANEL",
 "status": "DRAF",
 "validFrom": "2026-12-01",
 "validTo": null,
 "companyCap": 200000,
 "meetingNumber": null,
 "meetingDate": null,
 "notes": null,
 "clonedFrom": "legacy-mps-sh-302-25",
 "createdAt": "2026-11-21T14:59:19.151Z",
 "createdBy": 1,
 "activatedAt": null,
 "closedAt": null,
 "stats": {
  "projects": 0,
  "versions": 1,
  "currentVersion": 1,
  "panelSize": 60
 }
}
```
### POST /contracts with an existing code
```bash
curl -s -X POST 'http://localhost:8791/api/contracts' -H 'X-InfraHub-User: <id>' -H 'Content-Type: application/json' --data-binary @body.json
```
Request body (trimmed):
```json
{
 "code": "MPS/SH/TEST/2026",
 "title": "dup"
}
```
Response `409` (0.007s, trimmed):
```json
{
 "error": "Error",
 "message": "Kod MPS/SH/TEST/2026 sudah wujud"
}
```
### PATCH /contracts/:id
```bash
curl -s -X PATCH 'http://localhost:8791/api/contracts/ctr_163b84fb762b' -H 'X-InfraHub-User: <id>' -H 'Content-Type: application/json' --data-binary @body.json
```
Request body (trimmed):
```json
{
 "meeting_number": "Bil. 9/2026",
 "meeting_date": "2026-11-20"
}
```
Response `200` (0.018s, trimmed):
```json
{
 "id": "ctr_163b84fb762b",
 "code": "MPS/SH/TEST/2026",
 "title": "Sebutharga ujian v2",
 "kind": "PANEL",
 "status": "DRAF",
 "validFrom": "2026-12-01",
 "validTo": null,
 "companyCap": 200000,
 "meetingNumber": "Bil. 9/2026",
 "meetingDate": "2026-11-20",
 "notes": null,
 "clonedFrom": "legacy-mps-sh-302-25",
 "createdAt": "2026-11-21T14:59:19.151Z",
 "createdBy": 1,
 "activatedAt": null,
 "closedAt": null,
 "stats": {
  "projects": 0,
  "versions": 1,
  "currentVersion": 1,
  "panelSize": 60
 }
}
```
### POST /contracts/:id/versions/import (real master BQ, KESELURUHAN, kontraktor column)
The ParsedBook comes from `parseMasterBq` in the browser; descriptions are cut here.
```bash
curl -s -X POST 'http://localhost:8791/api/contracts/ctr_163b84fb762b/versions/import' -H 'X-InfraHub-User: <id>' -H 'Content-Type: application/json' --data-binary @body.json
```
Request body (trimmed):
```json
{
 "fileName": "master-bq.xls",
 "rateColumn": "KADAR HARGA KONTRAKTOR (RM)",
 "book": {
  "sheets": [
   {
    "name": "KESELURUHAN",
    "title": "JADUAL KADAR HARGA 2024/2025",
    "rateColumns": [
     "KADAR HARGA JABATAN (RM)",
     "… 1 more"
    ],
    "pricedRows": 465
   }
  ],
  "rateColumns": [
   "KADAR HARGA JABATAN (RM)",
   "… 1 more"
  ],
  "bills": [
   {
    "no": "1",
    "title": "KERJA-KERJA PERMULAAN",
    "sheet": "KESELURUHAN",
    "groups": [
     {
      "code": "1",
      "title": "Menyediakan polisi insuran berikut bagi merangkumi tempoh pekerjaan yang perlu",
      "row": 8,
      "items": [
       {
        "code": "1",
        "description": "Menyediakan polisi insuran berikut bagi merangkumi tempoh pekerjaan yang perlu seperti …",
        "variants": [
         {
          "code": "1(i)",
          "label": "Bagi nilai kerja yang kurang RM 25,000.00. Liputan minima adalah RM 10,000.00",
          "unit": "L/S",
          "rates": {
           "KADAR HARGA JABATAN (RM)": 400,
           "KADAR HARGA KONTRAKTOR (RM)": 340
          },
          "row": 14
         },
         "… 2 more"
        ],
        "notes": [
         "Bagi perkara di atas, Kontraktor adalah dikehendaki mengemukakan Nota Liputan",
         "… 2 more"
        ],
        "row": 14
       }
      ]
     },
     "… 3 more"
    ]
   },
   "… 15 more"
  ],
  "warnings": [],
  "stats": {
   "bills": 16,
   "groups": 98,
   "items": 174,
   "variants": 342,
   "pricedRows": 465,
   "warnings": 0
  }
 }
}
```
Response `201` (0.097s, trimmed):
```json
{
 "version": {
  "id": "rbv_b2be5be6dd01",
  "contractId": "ctr_163b84fb762b",
  "versionNo": 2,
  "status": "DRAF",
  "message": null,
  "source": "IMPORT",
  "sourceFile": "master-bq.xls",
  "rateColumn": "KADAR HARGA KONTRAKTOR (RM)",
  "stats": {
   "parse": {
    "bills": 16,
    "groups": 98,
    "items": 174,
    "variants": 342,
    "pricedRows": 465,
    "warnings": 0
   },
   "warnings": [],
   "match": {
    "EXACT": 195,
    "CODE": 0,
    "FUZZY": 154,
    "AI": 0,
    "MANUAL": 0,
    "NEW": 116,
    "removed": 37,
    "pending": 154
   },
   "baseVersionId": "rbv_0421b86d75df"
  },
  "createdAt": "2026-11-21T14:59:19.298Z",
  "createdBy": 1,
  "publishedAt": null,
  "publishedBy": null
 },
 "stats": {
  "parse": {
   "bills": 16,
   "groups": 98,
   "items": 174,
   "variants": 342,
   "pricedRows": 465,
   "warnings": 0
  },
  "warnings": [],
  "match": {
   "EXACT": 195,
   "CODE": 0,
   "FUZZY": 154,
   "AI": 0,
   "MANUAL": 0,
   "NEW": 116,
   "removed": 37,
   "pending": 154
  },
  "baseVersionId": "rbv_0421b86d75df"
 },
 "matches": [
  {
   "newRef": "b2be5b-B1-G1/b2be5b-B1-G1-I1/b2be5b-B1-G1-I1-v1",
   "old": {
    "groupId": "G1-1",
    "itemId": "1-01",
    "variantId": "1-01-v1"
   },
   "method": "FUZZY",
   "score": 0.836,
   "decision": "PENDING",
   "alternatives": [
    {
     "ref": "G1-1/1-01/1-01-v2",
     "score": 0.745
    },
    "… 1 more"
   ]
  },
  "… 464 more"
 ],
 "removed": [
  {
   "groupId": "PB-5",
   "itemId": "PB-5-03",
   "groupTitle": "TEMPAT DUDUK",
   "category": "Perhentian Bas",
   "itemDescription": "Kerja-kerja membekal dan membina concrete bench bersaiz 2000mm (L) termasuk kerja-kerja…",
   "ref": "PB-5/PB-5-03",
   "key": "PB-5-03/",
   "unit": "L/S",
   "rate": 1700
  },
  "… 36 more"
 ]
}
```
### GET /rate-book/versions/:vid
```bash
curl -s -X GET 'http://localhost:8791/api/rate-book/versions/rbv_b2be5be6dd01' -H 'X-InfraHub-User: <id>'
```
Response `200` (0.032s, trimmed):
```json
{
 "version": {
  "id": "rbv_b2be5be6dd01",
  "contractId": "ctr_163b84fb762b",
  "versionNo": 2,
  "status": "DRAF",
  "message": null,
  "source": "IMPORT",
  "sourceFile": "master-bq.xls",
  "rateColumn": "KADAR HARGA KONTRAKTOR (RM)",
  "stats": {
   "parse": {
    "bills": 16,
    "groups": 98,
    "items": 174,
    "variants": 342,
    "pricedRows": 465,
    "warnings": 0
   },
   "warnings": [],
   "match": {
    "EXACT": 195,
    "CODE": 0,
    "FUZZY": 154,
    "AI": 0,
    "MANUAL": 0,
    "NEW": 116,
    "removed": 37,
    "pending": 154
   },
   "baseVersionId": "rbv_0421b86d75df"
  },
  "createdAt": "2026-11-21T14:59:19.298Z",
  "createdBy": 1,
  "publishedAt": null,
  "publishedBy": null
 },
 "groups": [
  {
   "id": "b2be5b-B1-G1",
   "title": "Menyediakan polisi insuran berikut bagi merangkumi tempoh pekerjaan yang perlu",
   "category": "Permulaan",
   "items": [
    {
     "id": "b2be5b-B1-G1-I1",
     "code": "1",
     "description": "Menyediakan polisi insuran berikut bagi merangkumi tempoh pekerjaan yang perlu seperti …",
     "notes": [
      "Bagi perkara di atas, Kontraktor adalah dikehendaki mengemukakan Nota Liputan",
      "… 2 more"
     ],
     "variants": [
      {
       "id": "b2be5b-B1-G1-I1-v1",
       "code": "1(i)",
       "label": "Bagi nilai kerja yang kurang RM 25,000.00. Liputan minima adalah RM 10,000.00",
       "unit": "L/S",
       "rate": 340
      },
      "… 2 more"
     ]
    }
   ],
   "code": "1",
   "bill": "1"
  },
  "… 97 more"
 ],
 "matches": [
  {
   "newRef": "b2be5b-B1-G1/b2be5b-B1-G1-I1/b2be5b-B1-G1-I1-v1",
   "oldGroupId": "G1-1",
   "oldItemId": "1-01",
   "oldVariantId": "1-01-v1",
   "method": "FUZZY",
   "score": 0.836,
   "decision": "PENDING"
  },
  "… 464 more"
 ],
 "removed": [
  {
   "groupId": "PB-5",
   "itemId": "PB-5-03",
   "groupTitle": "TEMPAT DUDUK",
   "category": "Perhentian Bas",
   "itemDescription": "Kerja-kerja membekal dan membina concrete bench bersaiz 2000mm (L) termasuk kerja-kerja…",
   "ref": "PB-5/PB-5-03",
   "key": "PB-5-03/",
   "unit": "L/S",
   "rate": 1700
  },
  "… 36 more"
 ]
}
```
### POST /rate-book/versions/:vid/publish while matches are PENDING
```bash
curl -s -X POST 'http://localhost:8791/api/rate-book/versions/rbv_b2be5be6dd01/publish' -H 'X-InfraHub-User: <id>' -H 'Content-Type: application/json' --data-binary @body.json
```
Request body (trimmed):
```json
{
 "message": "x"
}
```
Response `409` (0.018s, trimmed):
```json
{
 "error": "Error",
 "message": "154 padanan belum diputuskan",
 "detail": {
  "pending": 154
 }
}
```
### PATCH /rate-book/versions/:vid/matches
```bash
curl -s -X PATCH 'http://localhost:8791/api/rate-book/versions/rbv_b2be5be6dd01/matches' -H 'X-InfraHub-User: <id>' -H 'Content-Type: application/json' --data-binary @body.json
```
Request body (trimmed):
```json
{
 "decisions": [
  {
   "new_ref": "b2be5b-B1-G1/b2be5b-B1-G1-I1/b2be5b-B1-G1-I1-v1",
   "decision": "ACCEPT"
  },
  {
   "new_ref": "b2be5b-B1-G1/b2be5b-B1-G1-I1/b2be5b-B1-G1-I1-v2",
   "decision": "ACCEPT"
  },
  "… 152 more"
 ]
}
```
Response `200` (0.107s, trimmed):
```json
[
 {
  "newRef": "b2be5b-B1-G1/b2be5b-B1-G1-I1/b2be5b-B1-G1-I1-v1",
  "oldGroupId": "G1-1",
  "oldItemId": "1-01",
  "oldVariantId": "1-01-v1",
  "method": "FUZZY",
  "score": 0.836,
  "decision": "ACCEPT"
 },
 {
  "newRef": "b2be5b-B1-G1/b2be5b-B1-G1-I1/b2be5b-B1-G1-I1-v2",
  "oldGroupId": "G1-1",
  "oldItemId": "1-01",
  "oldVariantId": "1-01-v2",
  "method": "FUZZY",
  "score": 0.836,
  "decision": "ACCEPT"
 },
 "… 463 more"
]
```
### POST /rate-book/versions/:vid/publish
```bash
curl -s -X POST 'http://localhost:8791/api/rate-book/versions/rbv_b2be5be6dd01/publish' -H 'X-InfraHub-User: <id>' -H 'Content-Type: application/json' --data-binary @body.json
```
Request body (trimmed):
```json
{
 "message": "Jadual Kadar Harga 2024/2025 (KESELURUHAN, kontraktor)"
}
```
Response `200` (0.052s, trimmed):
```json
{
 "version": {
  "id": "rbv_b2be5be6dd01",
  "contractId": "ctr_163b84fb762b",
  "versionNo": 2,
  "status": "TERBIT",
  "message": "Jadual Kadar Harga 2024/2025 (KESELURUHAN, kontraktor)",
  "source": "IMPORT",
  "sourceFile": "master-bq.xls",
  "rateColumn": "KADAR HARGA KONTRAKTOR (RM)",
  "stats": {
   "parse": {
    "bills": 16,
    "groups": 98,
    "items": 174,
    "variants": 342,
    "pricedRows": 465,
    "warnings": 0
   },
   "warnings": [],
   "match": {
    "EXACT": 195,
    "CODE": 0,
    "FUZZY": 154,
    "AI": 0,
    "MANUAL": 0,
    "NEW": 116,
    "removed": 37,
    "pending": 154
   },
   "baseVersionId": "rbv_0421b86d75df",
   "diff": {
    "unchanged": 140,
    "rateChanged": 101,
    "wordingChanged": 107,
    "added": 117,
    "removed": 38
   }
  },
  "createdAt": "2026-11-21T14:59:19.298Z",
  "createdBy": 1,
  "publishedAt": "2026-11-21T14:59:19.536Z",
  "publishedBy": 1
 },
 "diff": {
  "unchanged": 140,
  "rateChanged": 101,
  "wordingChanged": 107,
  "added": 117,
  "removed": 38
 }
}
```
### GET /rate-book/diff?from=&to=
```bash
curl -s -X GET 'http://localhost:8791/api/rate-book/diff?from=rbv_0421b86d75df&to=rbv_b2be5be6dd01' -H 'X-InfraHub-User: <id>'
```
Response `200` (0.047s, trimmed):
```json
{
 "unchanged": [
  {
   "key": "2-01/",
   "before": {
    "groupId": "G1-2",
    "itemId": "2-01",
    "groupTitle": "PELAN PENGURUSAN LALULINTAS (TRAFFIC MANAGEMENT)",
    "category": "Permulaan",
    "itemDescription": "Membekal dan menyediakan jentera alat pengangkutan pekerja, papan tanda isyarat lalu li…",
    "ref": "G1-2/2-01",
    "key": "2-01/",
    "unit": "L/S",
    "rate": 1275
   },
   "after": {
    "groupId": "G1-2",
    "itemId": "2-01",
    "groupTitle": "PELAN PENGURUSAN LALULINTAS (TRAFFIC MANAGEMENT)",
    "category": "Permulaan",
    "itemDescription": "Membekal dan menyediakan jentera alat pengangkutan pekerja, papan tanda isyarat lalu li…",
    "ref": "G1-2/2-01",
    "key": "2-01/",
    "code": "2.1",
    "unit": "L/S",
    "rate": 1275
   }
  },
  "… 139 more"
 ],
 "rateChanged": [
  {
   "key": "b2be5b-B2-G1-I1/2-01-v1",
   "before": {
    "groupId": "G2",
    "itemId": "2-01",
    "groupTitle": "KERJA PENGOREKAN",
    "category": "Longkang",
    "itemDescription": "Kerja-kerja menggali dan membuang tembok longkang sedia ada tidak melebihi 1500mm ukura…",
    "ref": "G2/2-01/2-01-v1",
    "key": "2-01/2-01-v1",
    "variantId": "2-01-v1",
    "label": "Dengan jentera",
    "unit": "m³",
    "rate": 21.17
   },
   "after": {
    "groupId": "G2",
    "itemId": "b2be5b-B2-G1-I1",
    "groupTitle": "KERJA PENGOREKAN",
    "category": "Longkang",
    "itemDescription": "Kerja-kerja menggali dan membuang tembok longkang sedia ada tidak melebihi 1500mm ukura…",
    "ref": "G2/b2be5b-B2-G1-I1/2-01-v1",
    "key": "b2be5b-B2-G1-I1/2-01-v1",
    "variantId": "2-01-v1",
    "code": "1.1(i)",
    "label": "Dengan jentera",
    "unit": "M3",
    "rate": 18.7
   }
  },
  "… 100 more"
 ],
 "wordingChanged": [
  {
   "key": "1-01/1-01-v1",
   "before": {
    "groupId": "G1-1",
    "itemId": "1-01",
    "groupTitle": "INSURANS",
    "category": "Permulaan",
    "itemDescription": "Menyediakan polisi insuran berikut bagi merangkumi tempoh pekerjaan yang perlu seperti …",
    "ref": "G1-1/1-01/1-01-v1",
    "key": "1-01/1-01-v1",
    "variantId": "1-01-v1",
    "label": "Bagi nilai kerja yang kurang RM 25,000.00. Liputan minima adalah RM 10,000.00",
    "unit": "L/S",
    "rate": 340
   },
   "after": {
    "groupId": "G1-1",
    "itemId": "1-01",
    "groupTitle": "Menyediakan polisi insuran berikut bagi merangkumi tempoh pekerjaan yang perlu",
    "category": "Permulaan",
    "itemDescription": "Menyediakan polisi insuran berikut bagi merangkumi tempoh pekerjaan yang perlu seperti …",
    "ref": "G1-1/1-01/1-01-v1",
    "key": "1-01/1-01-v1",
    "variantId": "1-01-v1",
    "code": "1(i)",
    "label": "Bagi nilai kerja yang kurang RM 25,000.00. Liputan minima adalah RM 10,000.00",
    "unit": "L/S",
    "rate": 340
   }
  },
  "… 106 more"
 ],
 "added": [
  {
   "key": "b2be5b-B1-G3-I1/",
   "after": {
    "groupId": "b2be5b-B1-G3",
    "itemId": "b2be5b-B1-G3-I1",
    "groupTitle": "Membekalkan laporan bergambar mengikut proses pembinaan pada waktu sebelum mula",
    "category": "Permulaan",
    "itemDescription": "Membekalkan laporan bergambar mengikut proses pembinaan pada waktu sebelum mula kerja, …",
    "ref": "b2be5b-B1-G3/b2be5b-B1-G3-I1",
    "key": "b2be5b-B1-G3-I1/",
    "code": "3",
    "unit": "L/S",
    "rate": 255
   }
  },
  "… 116 more"
 ],
 "removed": [
  {
   "key": "PB-5-03/",
   "before": {
    "groupId": "PB-5",
    "itemId": "PB-5-03",
    "groupTitle": "TEMPAT DUDUK",
    "category": "Perhentian Bas",
    "itemDescription": "Kerja-kerja membekal dan membina concrete bench bersaiz 2000mm (L) termasuk kerja-kerja…",
    "ref": "PB-5/PB-5-03",
    "key": "PB-5-03/",
    "unit": "L/S",
    "rate": 1700
   }
  },
  "… 37 more"
 ],
 "stats": {
  "unchanged": 140,
  "rateChanged": 101,
  "wordingChanged": 107,
  "added": 117,
  "removed": 38
 }
}
```
### POST /contracts/:id/status (invalid transition)
```bash
curl -s -X POST 'http://localhost:8791/api/contracts/ctr_163b84fb762b/status' -H 'X-InfraHub-User: <id>' -H 'Content-Type: application/json' --data-binary @body.json
```
Request body (trimmed):
```json
{
 "status": "DITUTUP"
}
```
Response `409` (0.007s, trimmed):
```json
{
 "error": "Error",
 "message": "Tidak boleh tukar DRAF -> DITUTUP"
}
```
### POST /contracts/:id/status DRAF → AKTIF
```bash
curl -s -X POST 'http://localhost:8791/api/contracts/ctr_163b84fb762b/status' -H 'X-InfraHub-User: <id>' -H 'Content-Type: application/json' --data-binary @body.json
```
Request body (trimmed):
```json
{
 "status": "AKTIF"
}
```
Response `200` (0.035s, trimmed):
```json
{
 "id": "ctr_163b84fb762b",
 "code": "MPS/SH/TEST/2026",
 "title": "Sebutharga ujian v2",
 "kind": "PANEL",
 "status": "AKTIF",
 "validFrom": "2026-12-01",
 "validTo": null,
 "companyCap": 200000,
 "meetingNumber": "Bil. 9/2026",
 "meetingDate": "2026-11-20",
 "notes": null,
 "clonedFrom": "legacy-mps-sh-302-25",
 "createdAt": "2026-11-21T14:59:19.151Z",
 "createdBy": 1,
 "activatedAt": "2026-11-21T14:59:19.690Z",
 "closedAt": null,
 "stats": {
  "projects": 0,
  "versions": 2,
  "currentVersion": 2,
  "panelSize": 60
 }
}
```
### POST /projects/:id/reprice (dryRun)
```bash
curl -s -X POST 'http://localhost:8791/api/projects/1778059711091/reprice' -H 'X-InfraHub-User: <id>' -H 'Content-Type: application/json' --data-binary @body.json
```
Request body (trimmed):
```json
{
 "toContractId": "ctr_163b84fb762b",
 "dryRun": true
}
```
Response `200` (0.077s, trimmed):
```json
{
 "dryRun": true,
 "contract": {
  "id": "ctr_163b84fb762b",
  "code": "MPS/SH/TEST/2026"
 },
 "rateBookVersionId": "rbv_b2be5be6dd01",
 "plan": {
  "rows": [
   {
    "groupIndex": 0,
    "itemIndex": 3,
    "bqItemId": "hpfvzaw4v",
    "qty": 1,
    "status": "SAME",
    "from": {
     "description": "Bagi nilai kerja diantara RM25,000.00 hingga RM 50,000.00. Liputan minima adalah RM 25,…",
     "unit": "L/S",
     "rate": 510,
     "amount": 510
    },
    "to": {
     "description": "Bagi nilai kerja diantara RM25,000.00 hingga RM 50,000.00. Liputan minima adalah RM 25,…",
     "unit": "L/S",
     "rate": 510,
     "amount": 510,
     "sourceGroupId": "G1-1",
     "sourceItemId": "1-01",
     "sourceVariantId": "1-01-v2"
    }
   },
   {
    "groupIndex": 0,
    "itemIndex": 5,
    "bqItemId": "wi5lfujnw",
    "qty": 1,
    "status": "SAME",
    "from": {
     "description": "Membekal dan menyediakan jentera alat pengangkutan pekerja, papan tanda isyarat lalu li…",
     "unit": "L/S",
     "rate": 1275,
     "amount": 1275
    },
    "to": {
     "description": "Membekal dan menyediakan jentera alat pengangkutan pekerja, papan tanda isyarat lalu li…",
     "unit": "L/S",
     "rate": 1275,
     "amount": 1275,
     "sourceGroupId": "G1-2",
     "sourceItemId": "2-01"
    }
   },
   "… 13 more"
  ],
  "totals": {
   "before": 41253.88,
   "after": 40729.45,
   "missing": 6,
   "changed": 2,
   "same": 7
  }
 }
}
```
### POST /projects/:id/reprice (apply)
```bash
curl -s -X POST 'http://localhost:8791/api/projects/1778059711091/reprice' -H 'X-InfraHub-User: <id>' -H 'Content-Type: application/json' --data-binary @body.json
```
Request body (trimmed):
```json
{
 "toContractId": "ctr_163b84fb762b",
 "dryRun": false
}
```
Response `200` (0.116s, trimmed):
```json
{
 "dryRun": false,
 "plan": {
  "rows": [
   {
    "groupIndex": 0,
    "itemIndex": 3,
    "bqItemId": "hpfvzaw4v",
    "qty": 1,
    "status": "SAME",
    "from": {
     "description": "Bagi nilai kerja diantara RM25,000.00 hingga RM 50,000.00. Liputan minima adalah RM 25,…",
     "unit": "L/S",
     "rate": 510,
     "amount": 510
    },
    "to": {
     "description": "Bagi nilai kerja diantara RM25,000.00 hingga RM 50,000.00. Liputan minima adalah RM 25,…",
     "unit": "L/S",
     "rate": 510,
     "amount": 510,
     "sourceGroupId": "G1-1",
     "sourceItemId": "1-01",
     "sourceVariantId": "1-01-v2"
    }
   },
   "… 14 more"
  ],
  "totals": {
   "before": 41253.88,
   "after": 40729.45,
   "missing": 6,
   "changed": 2,
   "same": 7
  }
 },
 "project": {
  "id": 1778059711091,
  "status": "FASA_DRAF",
  "contractId": "ctr_163b84fb762b",
  "rateBookVersionId": "rbv_b2be5be6dd01",
  "noSebutharga": "MPS/SH/TEST/2026",
  "kosProjek": 40729.45,
  "noInden": null,
  "…": "other project fields omitted"
 }
}
```
### POST /projects/:id/contract on a project with No. Inden
```bash
curl -s -X POST 'http://localhost:8791/api/projects/1766712662663/contract' -H 'X-InfraHub-User: <id>' -H 'Content-Type: application/json' --data-binary @body.json
```
Request body (trimmed):
```json
{
 "contractId": "ctr_163b84fb762b"
}
```
Response `423` (0.017s, trimmed):
```json
{
 "error": "Error",
 "message": "Kontrak projek dikunci selepas No. Inden; hantar {unlock:true} untuk buka"
}
```
### POST /projects/:id/contract with unlock
```bash
curl -s -X POST 'http://localhost:8791/api/projects/1766712662663/contract' -H 'X-InfraHub-User: <id>' -H 'Content-Type: application/json' --data-binary @body.json
```
Request body (trimmed):
```json
{
 "contractId": "ctr_163b84fb762b",
 "unlock": true
}
```
Response `200` (0.025s, trimmed):
```json
{
 "id": 1766712662663,
 "status": "SIAP",
 "contractId": "ctr_163b84fb762b",
 "rateBookVersionId": "rbv_b2be5be6dd01",
 "noSebutharga": "MPS/SH/TEST/2026",
 "kosProjek": 24579.859999999997,
 "noInden": "A00001",
 "…": "other project fields omitted"
}
```
### POST /projects (bound to the default AKTIF contract)
```bash
curl -s -X POST 'http://localhost:8791/api/projects' -H 'X-InfraHub-User: <id>' -H 'Content-Type: application/json' --data-binary @body.json
```
Request body (trimmed):
```json
{
 "status": "FASA_DRAF",
 "…": "other project fields omitted"
}
```
Response `200` (0.013s, trimmed):
```json
{
 "id": 1795273162952,
 "status": "FASA_DRAF",
 "contractId": "ctr_163b84fb762b",
 "rateBookVersionId": "rbv_b2be5be6dd01",
 "kosProjek": 0,
 "…": "other project fields omitted"
}
```
### GET /projects
```bash
curl -s -X GET 'http://localhost:8791/api/projects' -H 'X-InfraHub-User: <id>'
```
Response `200` (0.034s, trimmed):
```json
[
 {
  "id": 1795139494623,
  "status": "FASA_DRAF",
  "contractId": "legacy-mps-sh-302-25",
  "rateBookVersionId": "legacy-mps-sh-302-25-v1",
  "noSebutharga": null,
  "kosProjek": 10890.27,
  "noInden": null,
  "…": "other project fields omitted"
 },
 "… 489 more"
]
```
### GET /changelog?limit=5
```bash
curl -s -X GET 'http://localhost:8791/api/changelog?limit=5' -H 'X-InfraHub-User: <id>'
```
Response `200` (0.006s, trimmed):
```json
[
 {
  "id": 11,
  "at": "2026-11-21T14:59:22.930Z",
  "userId": 1,
  "userName": "<nama pegawai>",
  "entity": "project",
  "entityId": "1766712662663",
  "action": "swap-unlocked",
  "message": "Tukar kontrak ke MPS/SH/302/25",
  "diff": {
   "contractId": [
    "ctr_163b84fb762b",
    "legacy-mps-sh-302-25"
   ],
   "rateBookVersionId": [
    "rbv_b2be5be6dd01",
    "rbv_41758f17b09c"
   ],
   "noSebutharga": [
    "MPS/SH/TEST/2026",
    "MPS/SH/302/25"
   ],
   "unlocked": true
  }
 },
 {
  "id": 10,
  "at": "2026-11-21T14:59:22.900Z",
  "userId": 1,
  "userName": "<nama pegawai>",
  "entity": "project",
  "entityId": "1766712662663",
  "action": "swap-unlocked",
  "message": "Tukar kontrak ke MPS/SH/TEST/2026",
  "diff": {
   "contractId": [
    "legacy-mps-sh-2025-001",
    "ctr_163b84fb762b"
   ],
   "rateBookVersionId": [
    "legacy-mps-sh-2025-001-v1",
    "rbv_b2be5be6dd01"
   ],
   "noSebutharga": [
    "MPS/SH/2025/001",
    "MPS/SH/TEST/2026"
   ],
   "unlocked": true
  }
 },
 {
  "id": 9,
  "at": "2026-11-21T14:59:21.423Z",
  "userId": 1,
  "userName": "<nama pegawai>",
  "entity": "project",
  "entityId": "1778059711091",
  "action": "reprice",
  "message": "Harga semula ke MPS/SH/TEST/2026",
  "diff": {
   "contractId": [
    "legacy-mps-sh-302-25",
    "ctr_163b84fb762b"
   ],
   "rateBookVersionId": [
    "legacy-mps-sh-302-25-v1",
    "rbv_b2be5be6dd01"
   ],
   "kosProjek": [
    41253.88,
    40729.45
   ],
   "totals": {
    "before": 41253.88,
    "after": 40729.45,
    "missing": 6,
    "changed": 2,
    "same": 7
   }
  }
 },
 "… 2 more"
]
```
### PUT /config/:key
```bash
curl -s -X PUT 'http://localhost:8791/api/config/org.profile' -H 'X-InfraHub-User: <id>' -H 'Content-Type: application/json' --data-binary @body.json
```
Request body (trimmed):
```json
{
 "value": {
  "name": "Majlis Perbandaran Contoh",
  "short": "MPC"
 }
}
```
Response `200` (0.013s, trimmed):
```json
{
 "key": "org.profile",
 "value": {
  "name": "Majlis Perbandaran Contoh",
  "short": "MPC"
 }
}
```
### GET /config
```bash
curl -s -X GET 'http://localhost:8791/api/config' -H 'X-InfraHub-User: <id>'
```
Response `200` (0.006s, trimmed):
```json
{
 "org.profile": {
  "name": "Majlis Perbandaran Contoh",
  "short": "MPC"
 }
}
```
### GET /lookups/:list
```bash
curl -s -X GET 'http://localhost:8791/api/lookups/MUKIM' -H 'X-InfraHub-User: <id>'
```
Response `200` (0.006s, trimmed):
```json
[
 {
  "code": "BATU",
  "label": "BATU",
  "sortIndex": 0,
  "active": true
 },
 {
  "code": "RAWANG",
  "label": "RAWANG",
  "sortIndex": 1,
  "active": true
 }
]
```
### PUT /lookups/:list
```bash
curl -s -X PUT 'http://localhost:8791/api/lookups/MUKIM' -H 'X-InfraHub-User: <id>' -H 'Content-Type: application/json' --data-binary @body.json
```
Request body (trimmed):
```json
[
 {
  "code": "BATU",
  "label": "BATU",
  "sortIndex": 0,
  "active": true
 },
 {
  "code": "RAWANG",
  "label": "RAWANG",
  "sortIndex": 1,
  "active": true
 },
 {
  "code": "SETAPAK",
  "label": "SETAPAK",
  "sortIndex": 9,
  "active": true
 }
]
```
Response `200` (0.017s, trimmed):
```json
[
 {
  "code": "BATU",
  "label": "BATU",
  "sortIndex": 0,
  "active": true
 },
 {
  "code": "RAWANG",
  "label": "RAWANG",
  "sortIndex": 1,
  "active": true
 },
 {
  "code": "SETAPAK",
  "label": "SETAPAK",
  "sortIndex": 9,
  "active": true
 }
]
```
### GET /policies
```bash
curl -s -X GET 'http://localhost:8791/api/policies' -H 'X-InfraHub-User: <id>'
```
Response `200` (0.006s, trimmed):
```json
[
 {
  "key": "COMPANY_CAP",
  "effectiveFrom": "2020-01-01",
  "value": 200000,
  "note": "Had nilai kerja setiap syarikat panel (RM), amaran sahaja",
  "createdAt": "2026-11-21T14:59:12.904Z",
  "createdBy": 1
 },
 {
  "key": "LAD_BLR_PCT",
  "effectiveFrom": "2020-01-01",
  "value": 6.65,
  "note": "LAD: BLR (%)",
  "createdAt": "2026-11-21T14:59:12.904Z",
  "createdBy": 1
 },
 {
  "key": "LAD_SMALL_PROJECT_DAILY_RATE",
  "effectiveFrom": "2020-01-01",
  "value": 20,
  "note": "LAD: kadar harian tetap untuk kontrak kecil (RM/hari)",
  "createdAt": "2026-11-21T14:59:12.904Z",
  "createdBy": 1
 },
 "… 7 more"
]
```
### POST /policies
```bash
curl -s -X POST 'http://localhost:8791/api/policies' -H 'X-InfraHub-User: <id>' -H 'Content-Type: application/json' --data-binary @body.json
```
Request body (trimmed):
```json
{
 "key": "LOC_DAILY_RATE",
 "effective_from": "2027-01-01",
 "value": 120,
 "note": "contoh kadar baharu"
}
```
Response `201` (0.013s, trimmed):
```json
[
 {
  "key": "LOC_DAILY_RATE",
  "effectiveFrom": "2020-01-01",
  "value": 100,
  "note": "LoC: denda lewat tuntutan (RM/hari)",
  "createdAt": "2026-11-21T14:59:12.904Z",
  "createdBy": 1
 },
 {
  "key": "LOC_DAILY_RATE",
  "effectiveFrom": "2027-01-01",
  "value": 120,
  "note": "contoh kadar baharu",
  "createdAt": "2026-11-21T14:59:23.132Z",
  "createdBy": 1
 }
]
```
### POST /ai/match-suggest
```bash
curl -s -X POST 'http://localhost:8791/api/ai/match-suggest' -H 'X-InfraHub-User: <id>' -H 'Content-Type: application/json' --data-binary @body.json
```
Request body (trimmed):
```json
{}
```
Response `501` (0.002s, trimmed):
```json
{
 "error": "Error",
 "message": "Tiada binding AI; padanan AI tidak tersedia"
}
```