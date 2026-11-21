#!/usr/bin/env python3
"""P1 acceptance: Pusat kawalan / Hari ini, Perlu harga semula, report scope totals.

Standalone: python P1.spec.py --base http://localhost:8794
Creates its own data (a STANDALONE clone of the AKTIF contract + one FASA_DRAF project), never edits the AKTIF
contract, deletes the project at the end. The test contract stays (DITUTUP) because the API has no contract DELETE.
Password: line 2 of ~/Documents/InfraHub-backups/dev-seed/CREDS.txt (or env INFRAHUB_E2E_PASSWORD); never printed.
"""
import argparse, datetime, json, os, sys, time, urllib.error, urllib.request
from playwright.sync_api import sync_playwright

CHROME = os.environ.get('CHROME', '/home/rezephyr/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome')
STATUSES = ['FASA_DRAF', 'MENUNGGU_LANTIKAN', 'DALAM_PROSES', 'PEMERIKSAAN_TAPAK', 'TUNTUTAN_BAYARAN', 'SIAP']
results = []


def check(name, ok, detail=''):
    results.append(ok)
    print(f"{'PASS' if ok else 'FAIL'}  {name}{('  ' + detail) if detail else ''}", flush=True)


def password():
    if os.environ.get('INFRAHUB_E2E_PASSWORD'):
        return os.environ['INFRAHUB_E2E_PASSWORD']
    with open(os.path.expanduser('~/Documents/InfraHub-backups/dev-seed/CREDS.txt')) as f:
        return f.read().splitlines()[1].strip()


class Api:
    def __init__(self, base):
        self.base = base.rstrip('/') + '/api'
        self.user = None

    def call(self, method, path, body=None):
        headers = {'Content-Type': 'application/json'}
        if self.user:
            headers['X-InfraHub-User'] = str(self.user['id'])
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(self.base + path, data=data, method=method, headers=headers)
        try:
            with urllib.request.urlopen(req) as r:
                return r.status, json.load(r)
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read() or b'{}')

    def login(self, username):
        status, body = self.call('POST', '/auth/login', {'username': username, 'password': password()})
        assert status == 200, f'login {username} -> {status}'
        self.user = body['user']
        return self.user


def browser_page(browser, base, user, width=1440, height=900):
    mobile = width < 768
    ctx = browser.new_context(viewport={'width': width, 'height': height}, is_mobile=mobile, has_touch=mobile)
    ctx.add_init_script(f"localStorage.setItem('infrahub_user', {json.dumps(json.dumps(user))});"
                        "localStorage.setItem('infrahub_login_time', String(Date.now()));")
    return ctx, ctx.new_page()


def year_of(p):
    return (p.get('tarikhBuka') or '')[:4]


def dashboard_counts_match(browser, base, api, username, width):
    user = api.login(username)
    _, projects = api.call('GET', '/projects')
    year = str(datetime.date.today().year)
    mine = [p for p in projects if year_of(p) == year and (user['role'] != 'PJA' or p.get('pjaId') == user['id'])]
    expected = {s: sum(1 for p in mine if p['status'] == s) for s in STATUSES}
    ctx, page = browser_page(browser, base, user, width, 900)
    page.goto(base + '/dashboard.html', wait_until='networkidle')
    page.wait_for_selector('[data-testid=pipeline-count-SIAP]')
    shown = {s: int(page.inner_text(f'[data-testid=pipeline-count-{s}]')) for s in STATUSES}
    check(f'dashboard counts = /api/projects per status ({username}, {width}px)', shown == expected, f'ui={shown} api={expected}')
    overflow = page.evaluate('document.documentElement.scrollWidth - innerWidth')
    check(f'dashboard no horizontal overflow ({username}, {width}px)', overflow <= 0, f'overflow={overflow}')
    ctx.close()


def make_closed_contract_project(api, stamp):
    """Clone AKTIF -> STANDALONE test contract, activate it, bind a new draft to it, then close the contract."""
    _, contracts = api.call('GET', '/contracts')
    aktif = next(c for c in contracts if c['status'] == 'AKTIF' and c['kind'] == 'PANEL')
    code = f'E2E-P1-{stamp}'
    status, contract = api.call('POST', '/contracts', {'code': code, 'title': 'Ujian e2e P1 (boleh diabaikan)', 'kind': 'STANDALONE', 'company_cap': 200000, 'clone_from': aktif['id']})
    check('create throwaway contract (clone of AKTIF)', status == 201, f'status={status} code={code}')
    status, _ = api.call('POST', f"/contracts/{contract['id']}/status", {'status': 'AKTIF'})
    check('activate throwaway contract', status == 200, f'status={status}')
    today = datetime.date.today().isoformat()
    status, project = api.call('POST', '/projects', {
        'status': 'FASA_DRAF', 'bp': 'E2E', 'namaProjek': f'Ujian e2e P1 {stamp}', 'noFail': f'E2E/P1/{stamp}', 'tarikhBuka': today,
        'pjaId': api.user['id'], 'kosProjek': 12345.67, 'noVote': 'E2E-VOT', 'contractId': contract['id'],
    })
    check('create FASA_DRAF project bound to it', status == 200 and project.get('contractId') == contract['id'], f"status={status} contractId={project.get('contractId')}")
    status, closed = api.call('POST', f"/contracts/{contract['id']}/status", {'status': 'DITUTUP'})
    check('close throwaway contract (AKTIF -> DITUTUP)', status == 200 and closed.get('status') == 'DITUTUP', f'status={status}')
    _, after = api.call('GET', '/contracts')
    still = next(c for c in after if c['id'] == aktif['id'])
    check('the real AKTIF contract is untouched', still['status'] == 'AKTIF' and still.get('closedAt') is None, still['code'])
    return aktif, contract, project


def reprice_visible(browser, base, api, project):
    ctx, page = browser_page(browser, base, api.user)
    page.goto(base + '/dashboard.html', wait_until='networkidle')
    row = page.locator(f"[data-group=reprice] [data-project-id='{project['id']}']")
    row.wait_for(timeout=10000)
    check("project listed under 'Perlu harga semula' on the dashboard", row.count() == 1)
    check('row shows the DITUTUP ContractChip', 'DITUTUP' in row.inner_text(), row.inner_text().replace('\n', ' | ')[:120])
    row.click()
    page.wait_for_load_state('networkidle')
    check('row links to the project page', f"id={project['id']}" in page.url or str(project['id']) in page.url, page.url)
    page.goto(base + '/projects.html', wait_until='networkidle')
    page.locator('[data-testid=projects-page] input[type=search]').first.fill(project['noFail'])
    cell = page.locator(f"[data-reprice=yes][data-project-id='{project['id']}']:visible").first
    cell.wait_for(timeout=10000)
    check('projects list shows the re-pricing indicator on that row', cell.is_visible())
    ctx.close()


def scope_total(page):
    used = float(page.get_attribute('[data-testid=summary-used]', 'data-value'))
    count = int(page.inner_text('[data-testid=summary-count]'))
    return used, count


def expected_total(projects, contract_id, year=None):
    rows = [p for p in projects if p.get('contractId') == contract_id and p.get('noVote') and (year is None or year_of(p) == year)]
    return round(sum(p.get('kosProjek') or 0 for p in rows), 2), len(rows)


def scope_filter_totals(browser, base, api, aktif, contract):
    _, projects = api.call('GET', '/projects')
    year = str(datetime.date.today().year)
    ctx, page = browser_page(browser, base, api.user)
    page.goto(base + '/projects.html', wait_until='networkidle')
    page.get_by_role('button', name='Syarikat').first.click()
    scope = page.locator('[data-testid=report-scope]').first
    scope.locator(f"[data-testid='scope-contract-{aktif['code']}']").click()
    page.wait_for_timeout(500)
    used, count = scope_total(page)
    exp_used, exp_count = expected_total(projects, aktif['id'], year)
    check(f"sebutharga filter {aktif['code']} + Tahun {year}: totals = API sum", abs(used - exp_used) < 0.01 and count == exp_count,
          f'ui=({used:.2f}, {count}) api=({exp_used:.2f}, {exp_count})')
    label = page.inner_text('[data-testid=summary-scope]')
    check('summary is labelled with the filter that produced it', aktif['code'] in label and year in label, label)
    page.get_by_role('button', name='Tapis').first.click()
    page.locator('select[aria-label=Status]:visible').first.select_option('SIAP')
    page.wait_for_timeout(400)
    used2, count2 = scope_total(page)
    check('an on-screen status filter does not change the totals', (used2, count2) == (used, count), f'before=({used:.2f},{count}) after=({used2:.2f},{count2})')
    page.locator('select[aria-label=Status]:visible').first.select_option('ALL')
    scope.locator(f"[data-testid='scope-contract-{aktif['code']}']").click()
    scope.locator(f"[data-testid='scope-contract-{contract['code']}']").click()
    scope.get_by_role('button', name='Semua tahun').click()
    page.wait_for_timeout(400)
    used3, count3 = scope_total(page)
    check(f"sebutharga filter {contract['code']} + Semua tahun: totals = API sum", abs(used3 - 12345.67) < 0.01 and count3 == 1, f'ui=({used3:.2f}, {count3})')
    ctx.close()


def cleanup(api, project):
    status, _ = api.call('DELETE', f"/projects/{project['id']}")
    _, projects = api.call('GET', '/projects')
    gone = all(p['id'] != project['id'] for p in projects)
    check('cleanup: test project deleted', status == 200 and gone, f'status={status}')


def stage(name, fn, *args):
    """Run one block; an exception is recorded as a FAIL instead of aborting the remaining blocks."""
    try:
        return fn(*args)
    except Exception as e:  # noqa: BLE001 - the run must report every block
        check(f'{name} (raised)', False, f'{type(e).__name__}: {str(e).splitlines()[0][:200]}')
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', required=True)
    base = ap.parse_args().base.rstrip('/')
    api = Api(base)
    stamp = time.strftime('%y%m%d%H%M%S')
    project = contract = None
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME, headless=True)
        try:
            stage('dashboard pja01', dashboard_counts_match, browser, base, api, 'pja01', 390)
            stage('dashboard pja01 430', dashboard_counts_match, browser, base, api, 'pja01', 430)
            stage('dashboard admin01', dashboard_counts_match, browser, base, api, 'admin01', 1440)
            aktif, contract, project = make_closed_contract_project(api, stamp)
            stage('perlu harga semula', reprice_visible, browser, base, api, project)
            stage('scope totals', scope_filter_totals, browser, base, api, aktif, contract)
        finally:
            if project:
                cleanup(api, project)
                print(f"NOTE  contract {contract['code']} left in DITUTUP state (the API has no contract DELETE)")
            browser.close()
    print(f'{sum(results)}/{len(results)} checks passed')
    sys.exit(0 if all(results) else 1)


if __name__ == '__main__':
    main()
