#!/usr/bin/env python3
"""P2 acceptance: a project is priced from its own sebutharga and moves between sebutharga only with a preview.

Standalone; creates its own data through the API/UI and removes it afterwards. Usage:
  env -u PYTHONPATH ~/.hermes/cache/scratch/v2/pw/bin/python docs/overhaul/v2/e2e/P2.spec.py --base http://localhost:8795 [--shots DIR]

Checks
  1  as pja01: a new project binds to the AKTIF contract; 2 items added through the UI picker price from its book
  2  clone the AKTIF contract (STANDALONE), import a book with one rate changed, publish, activate
  3  "Tukar sebutharga": preview shows exactly 1 KADAR row and totals differ by qty x delta; apply updates kos_projek
  4  a later book changes another rate: the row shows the KADAR_BERUBAH indicator; "Kekal" keeps the old rate,
     "Guna kadar baharu" takes the new rate and records the decision in the row
  5  closed contract + draf project shows "Perlu harga semula"
  6  with No. Inden set the swap is refused (API 423, UI apply disabled) and allowed after "Buka kunci" (logged)
The password is read from the dev-seed CREDS file and never printed.
"""
import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

from playwright.sync_api import sync_playwright

CREDS = Path.home() / 'Documents/InfraHub-backups/dev-seed/CREDS.txt'
CHROME = '/home/rezephyr/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'
RATE_COLUMN = 'KADAR HARGA KONTRAKTOR (RM)'
QTY = 3

RESULTS: list[tuple[str, bool, str]] = []


def check(name: str, ok: bool, detail: str = '') -> bool:
    RESULTS.append((name, ok, detail))
    print(f"{'PASS' if ok else 'FAIL'}  {name}{('  -- ' + detail) if detail else ''}", flush=True)
    return ok


class Api:
    def __init__(self, base: str):
        self.base = base.rstrip('/')
        self.user: dict = {}

    def call(self, method: str, path: str, body=None) -> tuple[int, Any]:
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(f'{self.base}/api{path}', data=data, method=method)
        req.add_header('Content-Type', 'application/json')
        if self.user:
            req.add_header('X-InfraHub-User', str(self.user['id']))
        try:
            with urllib.request.urlopen(req, timeout=30) as res:
                raw = res.read()
                return res.status, (json.loads(raw) if raw else None)
        except urllib.error.HTTPError as e:
            raw = e.read()
            try:
                return e.code, json.loads(raw)
            except ValueError:
                return e.code, raw.decode(errors='replace')

    def ok(self, method: str, path: str, body=None) -> Any:
        status, data = self.call(method, path, body)
        if status >= 300:
            raise RuntimeError(f'{method} {path} -> {status} {str(data)[:200]}')
        return data

    def login(self, username: str) -> dict:
        password = CREDS.read_text().splitlines()[1].strip()
        self.user = {}
        self.user = self.ok('POST', '/auth/login', {'username': username, 'password': password})['user']
        return self.user


def norm(s: str) -> str:
    return re.sub(r'\s+', ' ', (s or '')).strip().lower()


def pick_items(book: list[dict]) -> list[dict]:
    """Two plain items (no variants, rate > 0) whose wording is unique in the book, from groups with unique titles,
    each the FIRST item of its group (so the picker's first 'Pilih Item' in that group adds it)."""
    wording = {}
    for g in book:
        for it in g['items']:
            for v in (it.get('variants') or [None]):
                key = norm(v['label'] if v else it['description']) + '|' + norm(v['unit'] if v else it.get('unit', ''))
                wording[key] = wording.get(key, 0) + 1
    titles = {}
    for g in book:
        titles[norm(g['title'])] = titles.get(norm(g['title']), 0) + 1
    picked = []
    for g in book:
        first = g['items'][0] if g['items'] else None
        if not first or first.get('variants') or not first.get('rate'):
            continue
        if titles[norm(g['title'])] != 1 or wording[norm(first['description']) + '|' + norm(first.get('unit', ''))] != 1:
            continue
        if any(norm(g['title']) in norm(p['group']['title']) or norm(p['group']['title']) in norm(g['title']) for p in picked):
            continue
        picked.append({'group': g, 'item': first})
        if len(picked) == 2:
            return picked
    raise RuntimeError('book has no two plain unique items')


def parsed_book(rows: list[dict]) -> dict:
    """A ParsedBook (what parseMasterBq emits) holding just these rows: [{group, item, rate}]."""
    bills = []
    for i, r in enumerate(rows, start=1):
        g, it = r['group'], r['item']
        bills.append({'no': str(i), 'title': g.get('category') or 'UJIAN', 'sheet': 'E2E', 'groups': [{
            'code': '1', 'title': g['title'], 'row': i * 10, 'items': [{
                'code': '1', 'description': it['description'], 'unit': it.get('unit', ''),
                'rates': {RATE_COLUMN: r['rate']}, 'variants': [], 'notes': [], 'row': i * 10 + 1}]}]})
    stats = {'bills': len(bills), 'groups': len(bills), 'items': len(bills), 'variants': 0, 'pricedRows': len(bills), 'warnings': 0}
    return {'sheets': [{'name': 'E2E', 'title': 'E2E', 'rateColumns': [RATE_COLUMN], 'pricedRows': len(bills)}],
            'rateColumns': [RATE_COLUMN], 'bills': bills, 'warnings': [], 'stats': stats}


def publish_book(api: Api, contract_id: str, rows: list[dict], message: str) -> dict:
    imported = api.ok('POST', f'/contracts/{contract_id}/versions/import', {'fileName': 'e2e-p2.json', 'rateColumn': RATE_COLUMN, 'book': parsed_book(rows)})
    vid = imported['version']['id']
    pending = [m['newRef'] for m in imported['matches'] if m['decision'] == 'PENDING']
    if pending:
        api.ok('PATCH', f'/rate-book/versions/{vid}/matches', {'decisions': [{'new_ref': r, 'decision': 'ACCEPT'} for r in pending]})
    api.ok('POST', f'/rate-book/versions/{vid}/publish', {'message': message})
    return imported


def money(text: str) -> float:
    return float(re.sub(r'[^0-9.\-]', '', text))


def item_rows(project: dict) -> list[dict]:
    return [it for g in project.get('bqData') or [] for it in g['items'] if it.get('type') == 'ITEM']


def wait_project(api: Api, pid: int, pred, timeout: float = 15.0) -> dict:
    end = time.time() + timeout
    p = api.ok('GET', f'/projects/{pid}')
    while not pred(p) and time.time() < end:
        time.sleep(0.4)
        p = api.ok('GET', f'/projects/{pid}')
    return p


class Ui:
    def __init__(self, browser, base: str, user: dict, shots: Path | None):
        self.base, self.shots, self.n = base.rstrip('/'), shots, 0
        self.ctx = browser.new_context(viewport={'width': 1440, 'height': 900})
        self.ctx.add_init_script(f"localStorage.setItem('infrahub_user', {json.dumps(json.dumps(user))});"
                                 "localStorage.setItem('infrahub_login_time', String(Date.now()));")
        self.page = self.ctx.new_page()

    def open(self, pid: int):
        self.page.goto(f'{self.base}/project.html?id={pid}')
        self.page.wait_for_selector('[data-testid=contract-panel]', timeout=20000)
        self.page.wait_for_selector('text=Menyalin Data', state='detached', timeout=20000)

    def shot(self, name: str):
        if self.shots:
            self.n += 1
            self.page.screenshot(path=str(self.shots / f'e2e-{self.n:02d}-{name}.png'))

    def save(self):
        self.page.get_by_title('Simpan Projek').first.click()
        with self.page.expect_response(lambda r: '/api/projects/' in r.url and r.request.method == 'PUT', timeout=15000) as res:
            self.page.get_by_role('button', name='Ya, Simpan').click()
        if res.value.status != 200:
            raise RuntimeError(f'save -> {res.value.status}')

    def add_from_picker(self, group_title: str, code: str) -> bool:
        p = self.page
        p.locator('button:visible', has_text='Tambah Item').first.click()
        heading_ok = code in p.locator('[data-testid=picker-book]').inner_text(timeout=10000)
        p.get_by_placeholder('Cari kumpulan item').fill(group_title)
        block = p.locator('div.space-y-3', has=p.locator('h4', has_text=group_title)).first
        block.get_by_role('button', name='Pilih Item').first.click()
        p.wait_for_selector('text=Item ditambah', timeout=10000)
        self.shot('picker')
        p.get_by_role('button', name='Tutup').first.click()
        return heading_ok

    def open_swap(self, code: str):
        self.page.click('[data-testid=swap-open]')
        try:
            self.page.wait_for_selector('[data-testid=swap-contracts]', timeout=10000)
        finally:
            self.shot('swap-list')
        self.page.click(f'button[data-code="{code}"]')
        self.page.wait_for_selector('[data-testid=reprice-preview]', timeout=20000)


class Scenario:
    """One run: a test project on the AKTIF contract, a cloned STANDALONE contract, and the six checks."""

    def __init__(self, api: Api, ui: Ui):
        self.api, self.ui = api, ui
        self.user = api.user
        contracts = api.ok('GET', '/contracts')
        self.aktif = next(c for c in sorted(contracts, key=lambda c: c.get('activatedAt') or '', reverse=True)
                          if c['status'] == 'AKTIF' and c['kind'] == 'PANEL')
        self.a, self.b = pick_items(api.ok('GET', f"/contracts/{self.aktif['id']}/book"))
        self.stamp = time.strftime('%H%M%S')
        self.pid: int | None = None
        self.test_contract: dict | None = None
        self.delta, self.delta_a = 12.5, 7.0

    def rate_of(self, proj: dict, item_id: str) -> dict:
        return next(r for r in item_rows(proj) if r['sourceItemId'] == item_id)

    def bind_and_add(self) -> None:
        api, a, b = self.api, self.a, self.b
        bill = {'id': 'bil-e2e-p2', 'calculationId': 'calc-e2e-p2', 'title': 'BIL NO. 1 - BUTIRAN KERJA', 'items': [], 'locationIds': []}
        first = {k: api.ok('GET', f'/lookups/{k}')[0]['code'] for k in ('BP', 'ZON', 'MUKIM')}
        created = api.ok('POST', '/projects', {'namaProjek': f'E2E P2 KONTRAK {self.stamp}', 'status': 'FASA_DRAF', 'pjaId': self.user['id'],
                                               'bp': first['BP'], 'zon': first['ZON'], 'mukim': first['MUKIM'], 'lokasi': 'Lokasi ujian e2e',
                                               'noAduan': '', 'tarikhBuka': time.strftime('%Y-%m-%d'), 'bqData': [bill], 'kosProjek': 0})
        self.pid = created['id']
        check('new project binds to the AKTIF contract', created.get('contractId') == self.aktif['id'], f"{created.get('contractId')} vs {self.aktif['id']}")
        self.ui.open(self.pid)
        self.ui.shot('project-header')
        heading = [self.ui.add_from_picker(x['group']['title'], self.aktif['code']) for x in (a, b)]
        check('picker title names the project contract', all(heading), self.aktif['code'])
        self.ui.save()
        proj = wait_project(api, self.pid, lambda p: len(item_rows(p)) == 2)
        rows = {r['sourceItemId']: r for r in item_rows(proj)}
        ok = all(x['item']['id'] in rows and abs(rows[x['item']['id']]['rate'] - x['item']['rate']) < 0.005 for x in (a, b))
        check('2 UI-added items price from the project contract book', ok,
              ', '.join(f"{x['item']['id']}={rows.get(x['item']['id'], {}).get('rate')} book={x['item']['rate']}" for x in (a, b)))
        # quantities so the re-price has money in it (test data setup through the API)
        for it in item_rows(proj):
            it['qty'], it['amount'] = QTY, round(QTY * it['rate'], 2)
        api.ok('PUT', f'/projects/{self.pid}', {'bqData': proj['bqData'], 'kosProjek': round(sum(r['amount'] for r in item_rows(proj)), 2)})

    def clone_with_new_rate(self) -> None:
        api, a, b = self.api, self.a, self.b
        self.test_contract = api.ok('POST', '/contracts', {'code': f'E2E-P2/{self.stamp}', 'title': 'Sebutharga ujian P2 (e2e)', 'kind': 'STANDALONE', 'clone_from': self.aktif['id']})
        imported = publish_book(api, self.test_contract['id'], [{**a, 'rate': a['item']['rate']}, {**b, 'rate': b['item']['rate'] + self.delta}], 'E2E P2: satu kadar berubah')
        methods = sorted(m['method'] for m in imported['matches'])
        check('import matched both rows to their old ids', methods == ['EXACT', 'EXACT'], str(methods))
        api.ok('POST', f"/contracts/{self.test_contract['id']}/status", {'status': 'AKTIF'})

    def swap_with_preview(self) -> None:
        ui, tc = self.ui, self.test_contract
        ui.open(self.pid)
        ui.open_swap(tc['code'])
        ui.shot('reprice-preview')
        kadar, same = ui.page.locator('[data-change=KADAR]').count(), ui.page.locator('[data-change=SAME]').count()
        check('re-price preview shows exactly 1 KADAR row', kadar == 1 and same == 1, f'KADAR={kadar} SAME={same}')
        before = money(ui.page.inner_text('[data-testid=reprice-before]'))
        after = money(ui.page.inner_text('[data-testid=reprice-after]'))
        check('preview totals differ by qty x delta', abs((after - before) - QTY * self.delta) < 0.005, f'before={before} after={after} expected diff={QTY * self.delta}')
        ui.page.click('[data-testid=swap-apply]')
        proj = wait_project(self.api, self.pid, lambda p: p.get('contractId') == tc['id'])
        check('apply: project bound to the new contract and No. Sebutharga updated',
              proj.get('contractId') == tc['id'] and proj.get('noSebutharga') == tc['code'], f"{proj.get('noSebutharga')}")
        check('apply: kos_projek updated to the previewed total', abs(proj['kosProjek'] - after) < 0.005, f"kosProjek={proj['kosProjek']} after={after}")

    def indicator_keep_and_take(self) -> None:
        api, ui, a, b = self.api, self.ui, self.a, self.b
        publish_book(api, self.test_contract['id'], [{**a, 'rate': a['item']['rate'] + self.delta_a}, {**b, 'rate': b['item']['rate'] + self.delta}], 'E2E P2: kadar item A naik')
        ui.open(self.pid)
        flags = ui.page.locator('[data-testid=row-book-flag][data-state=KADAR_BERUBAH]')
        flags.first.wait_for(timeout=15000)
        check('indicator appears on the row whose book rate changed', flags.count() == 1, f'count={flags.count()}')
        ui.shot('row-indicator')
        flags.first.click()
        ui.page.get_by_role('button', name=re.compile('^Kekal kadar kontrak')).click()
        ui.shot('after-kekal')
        unchanged = flags.count() == 1
        ui.save()
        rate_a = self.rate_of(api.ok('GET', f'/projects/{self.pid}'), a['item']['id'])['rate']
        check("'Kekal kadar kontrak' keeps the old rate", unchanged and abs(rate_a - a['item']['rate']) < 0.005, f"rate={rate_a} kept={a['item']['rate']}")
        ui.page.locator('[data-testid=row-book-flag]').first.click()
        ui.page.get_by_role('button', name=re.compile('^Guna kadar baharu')).click()
        gone = ui.page.locator('[data-testid=row-book-flag]').count() == 0
        ui.save()
        row_a = self.rate_of(api.ok('GET', f'/projects/{self.pid}'), a['item']['id'])
        decision = (row_a.get('bookDecision') or {}).get('choice')
        check("'Guna kadar baharu' takes the book rate and records the decision",
              gone and abs(row_a['rate'] - (a['item']['rate'] + self.delta_a)) < 0.005 and decision == 'BAHARU', f"rate={row_a['rate']} decision={decision}")

    def closed_contract_banner(self) -> None:
        self.api.ok('POST', f"/contracts/{self.test_contract['id']}/status", {'status': 'DITUTUP'})
        self.ui.open(self.pid)
        check("'Perlu harga semula' banner on a draf project of a closed contract", self.ui.page.locator('[data-testid=reprice-banner]').is_visible())
        self.ui.shot('ditutup-banner')

    def lock_and_unlock(self) -> None:
        api, page, aktif = self.api, self.ui.page, self.aktif
        api.ok('PUT', f'/projects/{self.pid}', {'noInden': f'E2E{self.stamp}'})
        status, _ = api.call('POST', f'/projects/{self.pid}/contract', {'contractId': aktif['id']})
        check('API refuses the swap once No. Inden is set', status == 423, f'status={status}')
        self.ui.open(self.pid)
        # An issued No. Inden locks the project to its rates (domain/repricing), so the re-price nag goes away;
        # the swap is still reachable through "Tukar sebutharga", where the lock is explained and can be lifted.
        page.wait_for_selector('[data-testid=swap-open]', timeout=20000)
        check('No. Inden hides the re-price banner (locked to its rates)', not page.locator('[data-testid=reprice-banner]').is_visible())
        page.click('[data-testid=swap-open]')
        page.click(f'button[data-code="{aktif["code"]}"]')
        page.wait_for_selector('[data-testid=reprice-preview]', timeout=20000)
        check('UI shows why it is locked and keeps apply disabled',
              page.locator('[data-testid=swap-locked]').is_visible() and page.locator('[data-testid=swap-apply]').is_disabled())
        self.ui.shot('locked-swap')
        page.click('[data-testid=swap-unlock]')
        page.click('[data-testid=swap-apply]')
        proj = wait_project(api, self.pid, lambda p: p.get('contractId') == aktif['id'])
        check("'Buka kunci' path swaps the locked project", proj.get('contractId') == aktif['id'], f"{proj.get('noSebutharga')}")
        actions = [e['action'] for e in api.ok('GET', f'/changelog?entity=project&entityId={self.pid}&limit=20')]
        check('unlock and re-prices are in the change log', 'swap-unlocked' in actions and actions.count('reprice') >= 2, str(actions))

    def cleanup(self) -> None:
        if self.pid:
            status, _ = self.api.call('DELETE', f'/projects/{self.pid}')
            print(f'cleanup: DELETE project -> {status}')
        if self.test_contract:
            tid = self.test_contract['id']
            if self.api.ok('GET', f'/contracts/{tid}')['status'] == 'AKTIF':
                self.api.call('POST', f'/contracts/{tid}/status', {'status': 'DITUTUP'})
            # Allowed once the test project is gone (the API refuses AKTIF or used contracts with 409).
            status, _ = self.api.call('DELETE', f'/contracts/{tid}')
            check('cleanup: test contract deleted', status == 200, f"{self.test_contract['code']} -> {status}")


def run(base: str, shots: Path | None) -> None:
    api = Api(base)
    check('login pja01', bool(api.login('pja01').get('id')))
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=CHROME)
        scenario = Scenario(api, Ui(browser, base, api.user, shots))
        try:
            for step in (scenario.bind_and_add, scenario.clone_with_new_rate, scenario.swap_with_preview,
                         scenario.indicator_keep_and_take, scenario.closed_contract_banner, scenario.lock_and_unlock):
                step()
        finally:
            browser.close()
            scenario.cleanup()


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', required=True)
    ap.add_argument('--shots', type=Path)
    args = ap.parse_args()
    if args.shots:
        args.shots.mkdir(parents=True, exist_ok=True)
    try:
        run(args.base, args.shots)
    except Exception as e:  # report the step that broke, then fail
        check('spec ran to the end', False, f'{type(e).__name__}: {e}')
    failed = [r for r in RESULTS if not r[1]]
    print(f'\n{len(RESULTS) - len(failed)}/{len(RESULTS)} checks passed')
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
