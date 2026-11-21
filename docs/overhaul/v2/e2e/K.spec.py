#!/usr/bin/env python3
"""K (Kontrak & buku kadar) acceptance spec.

Against --base, as pja01 (any officer may do this):
  clone the AKTIF contract (unique code) through the UI -> duplicate-code error comes from the API ->
  import a synthetic .xlsx built from the live book (1 unchanged, 1 rate-changed, 1 reworded, 1 new) ->
  review counts -> resolve the pending suggestion -> publish with a message -> version log, diff counts,
  change_log -> AKTIF contract untouched -> clean up the test contract.

Run:  env -u PYTHONPATH ~/.hermes/cache/scratch/v2/pw/bin/python docs/overhaul/v2/e2e/K.spec.py --base http://localhost:8793
Needs playwright + openpyxl in that python. Creates its own data; assumes no seed ids.
"""
import argparse, json, re, sys, tempfile, time, urllib.error, urllib.request
from pathlib import Path

from openpyxl import Workbook
from playwright.sync_api import sync_playwright
from e2e_http import USER_AGENT

CHROME = '/home/rezephyr/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'
CREDS = Path.home() / 'Documents/InfraHub-backups/dev-seed/CREDS.txt'
NEW_UNIT = 'SET-E2E'
REWORD_TAIL = ' termasuk semua kerja sampingan yang diarahkan oleh Pegawai Penguasa'

results = []


def check(name, ok, detail=''):
    results.append((name, bool(ok)))
    print(f"{'PASS' if ok else 'FAIL'}  {name}{'  ' + str(detail) if detail else ''}", flush=True)
    return ok


class Api:
    def __init__(self, base):
        self.base = base.rstrip('/')
        self.user = None

    def call(self, method, path, body=None):
        headers = {'Content-Type': 'application/json', 'User-Agent': USER_AGENT}
        if self.user:
            headers['X-InfraHub-User'] = str(self.user['id'])
        req = urllib.request.Request(f'{self.base}/api{path}', method=method, headers=headers,
                                     data=None if body is None else json.dumps(body).encode())
        try:
            with urllib.request.urlopen(req) as r:
                return r.status, json.loads(r.read() or b'null')
        except urllib.error.HTTPError as e:
            raw = e.read()
            try:
                return e.code, json.loads(raw or b'null')
            except ValueError:
                return e.code, raw.decode(errors='replace')[:200]

    def login(self, username, password):
        st, body = self.call('POST', '/auth/login', {'username': username, 'password': password})
        assert st == 200, f'login failed: {st}'
        self.user = body['user']
        return self.user


def flat_rows(groups):
    """One entry per priced line, like domain/rateBook/rows.flattenBook."""
    rows = []
    for g in groups:
        for it in g['items']:
            if it.get('variants'):
                rows += [{'group': g['id'], 'desc': it['description'], 'label': v.get('label'), 'unit': v.get('unit'), 'rate': v['rate'], 'variant': True} for v in it['variants']]
            else:
                rows.append({'group': g['id'], 'desc': it['description'], 'label': None, 'unit': it.get('unit') or '', 'rate': it.get('rate') or 0, 'variant': False})
    return rows


def pick_items(groups):
    """Three plain (variant-less) items whose wording is unique in the book, from three groups."""
    rows = flat_rows(groups)
    norm = lambda s: re.sub(r'\s+', ' ', (s or '')).strip().lower()
    counts = {}
    for r in rows:
        counts[norm(r['desc'])] = counts.get(norm(r['desc']), 0) + 1
    picked, seen_groups = [], set()
    for r in rows:
        if r['variant'] or not r['unit'] or r['rate'] <= 0 or counts[norm(r['desc'])] != 1:
            continue
        if not (60 <= len(r['desc']) <= 400) or r['group'] in seen_groups:
            continue
        picked.append(r); seen_groups.add(r['group'])
        if len(picked) == 3:
            return picked, len(rows)
    raise SystemExit('book has too few unique plain items for the spec')


def build_xlsx(path, same, rate, reword, tag):
    wb = Workbook(); ws = wb.active; ws.title = 'KESELURUHAN'
    jab = lambda k: round(k / 0.85, 2)
    new_rate = round(rate['rate'] * 1.1 + 1, 2)
    ws.append([1, f'JADUAL KADAR HARGA UJIAN {tag}', 'LAMPIRAN A', None, None])
    ws.append([None, None, None, None, None])
    ws.append(['BIL', 'KETERANGAN', 'UNIT', 'KADAR HARGA JABATAN\n(RM)', 'KADAR HARGA KONTRAKTOR\n(RM)'])
    ws.append([None, 'BIL NO. 1 - KERJA-KERJA UJIAN AUTOMATIK', None, None, None])
    ws.append([None, None, None, None, None])
    ws.append([1, 'KERJA UJIAN AUTOMATIK', None, None, None])
    ws.append(['1.1', same['desc'], same['unit'], jab(same['rate']), same['rate']])
    ws.append(['1.2', rate['desc'], rate['unit'], jab(new_rate), new_rate])
    ws.append(['1.3', reword['desc'] + REWORD_TAIL, reword['unit'], jab(reword['rate']), reword['rate']])
    ws.append(['1.4', f'Kerja ujian automatik {tag} yang tiada dalam buku kadar lama dan mesti menjadi item baharu', NEW_UNIT, 117.65, 100])
    wb.save(path)
    return new_rate


def tiles(page, testid):
    """StatTile grid -> {label: number}."""
    out = {}
    for t in page.locator(f'[data-testid={testid}] > *').all():
        lines = [l.strip() for l in t.inner_text().split('\n') if l.strip()]
        if len(lines) >= 2 and re.fullmatch(r'[\d,]+', lines[0]):
            out[lines[1]] = int(lines[0].replace(',', ''))
    return out


def aktif_snapshot(api):
    _, cs = api.call('GET', '/contracts')
    return sorted((c['id'], c['status'], c.get('activatedAt'), (c.get('stats') or {}).get('currentVersion')) for c in cs if c['status'] == 'AKTIF')


def cleanup(api, cid, code):
    st, _ = api.call('DELETE', f'/contracts/{cid}')
    if 200 <= st < 300:
        return check('cleanup: test contract deleted', True, f'DELETE {st}')
    st2, body2 = api.call('POST', f'/contracts/{cid}/status', {'status': 'DITUTUP'})
    if st2 == 200:
        return check('cleanup: test contract closed', True)
    st3, _ = api.call('PATCH', f'/contracts/{cid}', {'title': f'[E2E selesai] {code}', 'notes': 'Data ujian automatik K.spec.py; tiada projek; selamat dipadam.'})
    print(f'NOTE  no delete route (DELETE {st}) and DRAF->DITUTUP refused ({st2}: {body2.get("message") if isinstance(body2, dict) else body2}); test contract left DRAF and labelled [E2E selesai] (PATCH {st3})')
    return check('cleanup: test contract labelled as finished test data', st3 == 200)


class SpecRun:
    """One pass through the UI; keeps the ids the later steps and the cleanup need."""

    def __init__(self, base, api, page, aktif):
        self.base, self.api, self.page, self.aktif = base, api, page, aktif
        self.tag = f'E2E-K-{int(time.time())}'
        self.code = f'MPS/SH/{self.tag}'
        self.cid = self.message = None
        self.old_rows = 0

    def clone(self):
        page = self.page
        page.goto(f'{self.base}/kontrak.html')
        page.wait_for_selector('[data-testid=contract-row]', timeout=30000)
        check('register lists contracts, AKTIF first', page.locator('[data-testid=contract-row]').first.get_attribute('data-code') == self.aktif['code'])
        page.get_by_role('button', name=f"Salin {self.aktif['code']}").click()
        page.fill('#ct-code', self.code); page.fill('#ct-title', f'Ujian automatik {self.tag}')
        page.click('[data-testid=create-submit]')
        page.wait_for_selector('[data-testid=contract-code]', timeout=30000)
        check('clone created and opened', page.inner_text('[data-testid=contract-code]').strip() == self.code)
        self.cid = re.search(r'[?&]c=([^&]+)', page.url).group(1)

    def duplicate_code(self):
        page = self.page
        page.click('text=Semua kontrak'); page.click('[data-testid=new-contract]')
        page.fill('#ct-code', self.code); page.fill('#ct-title', 'duplikat')
        page.click('[data-testid=create-submit]')
        page.wait_for_selector('[data-testid=create-error]')
        err = page.inner_text('[data-testid=create-error]')
        check('duplicate code shows the API validation message', 'sudah wujud' in err, err)
        page.keyboard.press('Escape')

    def workbook(self):
        _, book = self.api.call('GET', f'/contracts/{self.cid}/book')
        (same, rate, reword), self.old_rows = pick_items(book)
        xlsx = Path(tempfile.mkdtemp()) / f'{self.tag}.xlsx'
        new_rate = build_xlsx(xlsx, same, rate, reword, self.tag)
        print(f'INFO  book rows={self.old_rows}; rate change {rate["rate"]} -> {new_rate}; workbook {xlsx.name}')
        return xlsx

    def import_book(self, xlsx):
        page = self.page
        page.goto(f'{self.base}/kontrak.html?c={self.cid}')
        page.click('[data-testid=open-import]')
        page.set_input_files('[data-testid=bq-file]', str(xlsx))
        page.wait_for_selector('[data-testid=to-preview]', timeout=30000)
        col = page.locator('[data-testid=rate-column][aria-checked=true]').inner_text()
        check('default rate column is the KONTRAKTOR header', 'KONTRAKTOR' in col, col.split('\n')[0])
        page.click('[data-testid=to-preview]')
        page.wait_for_selector('[data-testid=preview-stats]')
        prev = tiles(page, 'preview-stats')
        check('preview: 4 rates, 0 warnings', prev.get('Kadar diimport') == 4 and prev.get('Amaran') == 0, prev)
        page.click('[data-testid=send-import]')
        page.wait_for_selector('[data-testid=review-counts]', timeout=60000)
        counts = tiles(page, 'review-counts')
        expected = {'Sama': 1, 'Kadar berubah': 1, 'Perkataan berubah (cadangan)': 1, 'Baharu': 1, 'Dibuang': self.old_rows - 3}
        check('review counts 1/1/1/1/removed', counts == expected, counts)

    def resolve(self):
        page = self.page
        check('publish is blocked while a match is pending', page.locator('[data-testid=to-publish]').is_disabled())
        card = page.locator('[data-testid=candidate]')
        check('one PENDING candidate shown side by side', card.count() == 1 and card.first.get_attribute('data-decision') == 'PENDING')
        card.first.locator('[data-testid=accept]').click()
        page.wait_for_selector('[data-testid=candidate][data-decision=ACCEPT]', timeout=20000)
        check('suggestion accepted, nothing pending', 'Semua padanan' in page.inner_text('[data-testid=pending-count]'))

    def publish(self):
        page = self.page
        page.click('[data-testid=to-publish]')
        page.click('[data-testid=publish]')
        check('empty commit message is refused', page.locator('#pub-msg-error').count() == 1)
        self.message = f'Ujian automatik {self.tag}: 1 kadar naik, 1 item diubah perkataan, 1 item baharu'
        page.fill('[data-testid=publish-message]', self.message)
        page.click('[data-testid=publish]')
        page.wait_for_selector('[data-testid=publish-result]', timeout=60000)
        diff = tiles(page, 'publish-diff')
        want = {'Kadar berubah': 1, 'Perkataan berubah': 1, 'Ditambah': 1, 'Dibuang': self.old_rows - 3, 'Sama': 1}
        check('published diff counts', diff == want, diff)
        page.wait_for_selector('[data-testid=publish-changelog]', timeout=20000)
        log_text = page.inner_text('[data-testid=publish-changelog]')
        check('change_log entry shown after publish', self.message in log_text and 'publish' in log_text)

    def versions(self):
        page, removed = self.page, self.old_rows - 3
        page.click('[data-testid=see-versions]')
        page.wait_for_selector('[data-testid=version-row]')
        top = page.locator('[data-testid=version-row]').first
        text = top.inner_text()
        check('version log: v2 on top, TERBIT, Import Excel, message', top.get_attribute('data-version') == '2' and 'TERBIT' in text and 'Import Excel' in text and self.message in text)
        stats = top.locator('[data-testid=version-stats]').inner_text()
        check('version stats line', stats.startswith(f'1 kadar berubah · 1 perkataan · +1 / −{removed} · 1 sama'), stats)
        page.click('[data-testid=diff-run]')
        page.wait_for_selector('[data-testid=diff-list]')
        tabs = [t.replace('\n', ' ') for t in page.locator('[data-testid=diff-list] [role=tab]').all_inner_texts()]
        check('diff viewer tab counts', tabs == ['Kadar berubah 1', 'Perkataan berubah 1', 'Ditambah 1', f'Dibuang {removed}', 'Sama 1'], tabs)

    def all_steps(self):
        self.clone()
        self.duplicate_code()
        self.import_book(self.workbook())
        self.resolve()
        self.publish()
        self.versions()


def browser_page(p, user, headed):
    browser = p.chromium.launch(executable_path=CHROME, headless=not headed)
    ctx = browser.new_context(viewport={'width': 1440, 'height': 900})
    ctx.add_init_script(f"localStorage.setItem('infrahub_user', {json.dumps(json.dumps(user))}); localStorage.setItem('infrahub_login_time', String(Date.now()));")
    page = ctx.new_page()
    page.errors = []
    page.on('pageerror', lambda e: page.errors.append(str(e)))
    return browser, page


def run(base, username, password, headed):
    api = Api(base)
    user = api.login(username, password)
    before = aktif_snapshot(api)
    _, contracts = api.call('GET', '/contracts')
    aktif = next(c for c in contracts if c['status'] == 'AKTIF' and c['kind'] == 'PANEL')
    with sync_playwright() as p:
        browser, page = browser_page(p, user, headed)
        spec = SpecRun(base, api, page, aktif)
        try:
            spec.all_steps()
            check('no page errors', not page.errors, page.errors[:3])
            verify_server(api, spec.cid, user, spec.message, before)
        except Exception:
            shot = Path(tempfile.gettempdir()) / f'K-spec-failure-{spec.tag}.png'
            page.screenshot(path=str(shot), full_page=True)
            print(f'INFO  failure screenshot {shot} at {page.url}')
            raise
        finally:
            browser.close()
            if spec.cid:
                cleanup(api, spec.cid, spec.code)


def verify_server(api, cid, user, message, before):
    _, versions = api.call('GET', f'/contracts/{cid}/versions')
    v2 = versions[0]
    check('API: v2 TERBIT IMPORT with the message', v2['versionNo'] == 2 and v2['status'] == 'TERBIT' and v2['source'] == 'IMPORT' and v2['message'] == message)
    _, log = api.call('GET', f'/changelog?entity=rate_book&entityId={v2["id"]}&limit=10')
    actions = [e['action'] for e in log]
    check('API: change_log has import, match, publish', {'import', 'match', 'publish'} <= set(actions), actions)
    pub = next(e for e in log if e['action'] == 'publish')
    check('API: publish entry carries actor + diff', pub['userId'] == user['id'] and pub['diff'].get('rateChanged') == 1, {k: pub['diff'].get(k) for k in ('rateChanged', 'wordingChanged', 'added', 'removed', 'unchanged')})
    check('AKTIF contract(s) untouched', aktif_snapshot(api) == before)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', required=True)
    ap.add_argument('--user', default='pja01')
    ap.add_argument('--password-file', default=str(CREDS), help='line 2 = password')
    ap.add_argument('--headed', action='store_true')
    a = ap.parse_args()
    password = Path(a.password_file).read_text().splitlines()[1].strip()
    t0 = time.time()
    try:
        run(a.base, a.user, password, a.headed)
    except Exception as e:  # a crashed step is a failed check, never a silent pass
        check('spec ran to the end', False, f'{type(e).__name__}: {str(e)[:300]}')
    failed = [n for n, ok in results if not ok]
    print(f'\n{len(results) - len(failed)}/{len(results)} checks passed in {time.time() - t0:.1f}s')
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
