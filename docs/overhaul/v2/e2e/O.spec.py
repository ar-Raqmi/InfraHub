"""Acceptance spec for builder O (Tetapan Organisasi). Standalone; creates and restores its own changes.

usage: python O.spec.py --base http://localhost:8796 [--shots DIR] [--headed]

Steps (admin01 through the UI, verified through the API):
 1. change the organisation short name (Profil) and one Notis Peringatan 1 paragraph (Teks dokumen);
 2. add a new LAD BLR value effective tomorrow (Peraturan);
 3. assert the change_log recorded each save;
 4. assert the Notis preview on a real project shows the new paragraph with the new short name;
 5. assert the LAD check uses the OLD rate for today and the NEW rate for tomorrow (policyAt);
 6. assert pja01 gets the "Akses terhad" screen on organisasi.html;
 7. restore every original value.
The password is read from the dev-seed CREDS file and never printed.
"""
import argparse
import datetime as dt
import json
import os
import re
import sys
import urllib.error
import urllib.request

from playwright.sync_api import expect, sync_playwright

CHROME = '/home/rezephyr/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'
CREDS = os.path.expanduser('~/Documents/InfraHub-backups/dev-seed/CREDS.txt')
HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULTS = os.path.join(HERE, '..', '..', '..', '..', 'components', 'org', 'org-defaults.json')
P1 = 'doc.notis_peringatan_1'
BLR = 'LAD_BLR_PCT'
TREASURY = 'LAD_TREASURY_PCT'
SHORT = 'MPX-E2E'
PARA3 = '3. TEKS UJIAN E2E: pihak {{nama_ringkas}} meminta tuntutan diserahkan dalam tempoh tujuh (7) hari.'


class Api:
    def __init__(self, base):
        self.base = base.rstrip('/') + '/api'
        self.uid = None

    def call(self, path, method='GET', body=None):
        headers = {'Content-Type': 'application/json'}
        if self.uid:
            headers['X-InfraHub-User'] = str(self.uid)
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(self.base + path, method=method, data=data, headers=headers)
        try:
            with urllib.request.urlopen(req) as res:
                raw = res.read()
                return res.status, json.loads(raw) if raw else None
        except urllib.error.HTTPError as err:
            return err.code, None

    def login(self, username):
        password = open(CREDS).read().splitlines()[1].strip()
        status, body = self.call('/auth/login', 'POST', {'username': username, 'password': password})
        assert status == 200, f'login {username}: {status}'
        return body['user']


def check(label, ok, detail=''):
    print(('PASS ' if ok else 'FAIL ') + label + (f' ({detail})' if detail else ''))
    if not ok:
        raise AssertionError(label)


def policy_at(rules, key, day):
    found = [r for r in rules if r['key'] == key and r['effectiveFrom'] <= day]
    return max(found, key=lambda r: r['effectiveFrom'])['value']


def first_free_day(rules, key):
    # History is append-only and there is no DELETE route, so a re-run on the same day cannot reuse tomorrow:
    # take tomorrow when free, else the next day without a rule for this key.
    taken = {r['effectiveFrom'] for r in rules if r['key'] == key}
    day = dt.date.today() + dt.timedelta(days=1)
    while day.isoformat() in taken:
        day += dt.timedelta(days=1)
    return day.isoformat()


def lad_rate(total, blr, treasury):
    return round((total * ((blr - treasury) / 100)) / 365 + sys.float_info.epsilon, 2)


def context_for(browser, user, width):
    ctx = browser.new_context(viewport={'width': width, 'height': 900})
    ctx.add_init_script(f"localStorage.setItem('infrahub_user', {json.dumps(json.dumps(user))});"
                        "localStorage.setItem('infrahub_login_time', String(Date.now()));")
    return ctx


def pick_project(api):
    _, projects = api.call('/projects')
    for p in projects:
        if p.get('tarikhTamatKontrak') and p.get('tarikhMulaKontrak') and p.get('noFail') and (p.get('kosProjek') or 0) > 20000:
            return p
    raise AssertionError('no project with contract dates')


def shot(page, shots, name):
    if shots:
        page.screenshot(path=os.path.join(shots, name), full_page=True)


def edit_via_ui(page, base, shots):
    page.goto(f'{base}/organisasi.html#profil')
    page.fill('#org-short', SHORT)
    page.click('[data-testid=save-profil]')
    expect(page.get_by_text('Direkod dalam log perubahan')).to_be_visible()
    shot(page, shots, 'e2e-01-profil-saved.png')

    page.goto(f'{base}/organisasi.html?dok={P1}#teks')
    area = page.locator('textarea[data-field=para3]')
    area.fill(PARA3)
    expect(page.locator('[data-testid=preview-para3]')).to_contain_text(f'pihak {SHORT}')
    page.click('[data-testid=save-teks]')
    expect(page.get_by_text('Direkod dalam log perubahan')).to_be_visible()
    shot(page, shots, 'e2e-02-teks-saved.png')


def add_policy_via_ui(page, base, tomorrow, new_blr, shots):
    page.goto(f'{base}/organisasi.html#peraturan')
    page.select_option('#pol-key', BLR)
    page.fill('#pol-value', str(new_blr))
    page.fill('#pol-from', tomorrow)
    page.fill('#pol-note', 'Ujian e2e O')
    page.click('[data-testid=save-policy]')
    expect(page.get_by_text('Direkod dalam log perubahan')).to_be_visible()
    shot(page, shots, 'e2e-03-peraturan-saved.png')


def lad_check(page, total, day):
    page.fill('#lad-sum', str(total))
    page.fill('#lad-date', day)
    return page.locator('[data-testid=lad-check-rate]').inner_text()


def verify_saved(api, tomorrow):
    _, config = api.call('/config')
    check('profile short name saved', config['org.profile']['short'] == SHORT)
    check('Peringatan 1 paragraph saved', config[P1]['para3'] == PARA3)
    _, log = api.call('/changelog?entity=config&limit=10')
    check('change_log has the profile save', any(e['entityId'] == 'org.profile' for e in log))
    check('change_log has the text save', any(e['entityId'] == P1 for e in log))
    _, plog = api.call(f'/changelog?entity=policy&entityId={BLR}&limit=5')
    check('change_log has the policy add', any(tomorrow in (e.get('message') or '') for e in plog))


def verify_lad(page, st, shots):
    today_rate = lad_check(page, 50000, st['today'])
    effective_rate = lad_check(page, 50000, st['tomorrow'])
    want_old = lad_rate(50000, st['old_blr'], st['treasury'])
    want_new = lad_rate(50000, st['new_blr'], st['treasury'])
    check('LAD for today uses the old BLR', today_rate == f'RM {want_old:,.2f}', today_rate)
    check('LAD on the effective day uses the new BLR', effective_rate == f'RM {want_new:,.2f}', effective_rate)
    shot(page, shots, 'e2e-04-lad-check.png')


def verify_notis_preview(page, base, project, shots):
    page.goto(f'{base}/project.html?id={project["id"]}')
    page.get_by_role('button', name=re.compile('File Creation')).click()
    page.get_by_role('button', name='Jana Notis').click()
    page.locator('select').filter(has_text='Notis Pemberitahuan').select_option('PERINGATAN_1')
    expect(page.locator('[data-testid=notis-preview]')).to_contain_text(f'pihak {SHORT} meminta tuntutan')
    check('Notis preview shows the new paragraph and short name', True)
    shot(page, shots, 'e2e-05-notis-preview.png')


def verify_pja_denied(browser, base, pja, shots):
    ctx = context_for(browser, pja, 1440)
    page = ctx.new_page()
    page.goto(f'{base}/organisasi.html#profil')
    expect(page.locator('[data-testid=org-no-access]')).to_be_visible()
    check('pja01 sees Akses terhad', page.locator('[data-testid=org-page]').count() == 0)
    shot(page, shots, 'e2e-06-pja-denied.png')
    ctx.close()


def snapshot(api):
    defaults = json.load(open(DEFAULTS, encoding='utf-8'))['config']
    _, config = api.call('/config')
    _, rules = api.call('/policies')
    today = dt.date.today().isoformat()
    old_blr = policy_at(rules, BLR, today)
    return {
        'profile': config.get('org.profile', defaults['org.profile']), 'p1': config.get(P1, defaults[P1]),
        'today': today, 'tomorrow': first_free_day(rules, BLR), 'old_blr': old_blr,
        'new_blr': round(old_blr + 1, 2), 'treasury': policy_at(rules, TREASURY, today),
    }


def restore(api, st):
    api.call('/config/org.profile', 'PUT', {'value': st['profile']})
    api.call(f'/config/{P1}', 'PUT', {'value': st['p1']})
    # No DELETE route for policies (history is append-only): neutralise the test value instead.
    api.call('/policies', 'POST', {'key': BLR, 'effective_from': st['tomorrow'], 'value': st['old_blr'], 'note': 'Ujian e2e O: dipulihkan'})
    _, config = api.call('/config')
    _, rules = api.call('/policies')
    restored = (config['org.profile'] == st['profile'] and config[P1] == st['p1']
                and policy_at(rules, BLR, st['tomorrow']) == st['old_blr'])
    print(('PASS ' if restored else 'FAIL ') + 'originals restored')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', required=True)
    ap.add_argument('--shots')
    ap.add_argument('--headed', action='store_true')
    args = ap.parse_args()
    base = args.base.rstrip('/')
    if args.shots:
        os.makedirs(args.shots, exist_ok=True)
    api = Api(base)
    admin = api.login('admin01')
    api.uid = admin['id']
    pja = api.login('pja01')
    st = snapshot(api)
    project = pick_project(api)
    print(f"project {project['id']}, BLR today {st['old_blr']} -> {st['new_blr']} from {st['tomorrow']}")
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(executable_path=CHROME, headless=not args.headed)
            ctx = context_for(browser, admin, 1440)
            page = ctx.new_page()
            edit_via_ui(page, base, args.shots)
            add_policy_via_ui(page, base, st['tomorrow'], st['new_blr'], args.shots)
            verify_saved(api, st['tomorrow'])
            verify_lad(page, st, args.shots)
            verify_notis_preview(page, base, project, args.shots)
            ctx.close()
            verify_pja_denied(browser, base, pja, args.shots)
            browser.close()
    finally:
        restore(api, st)


if __name__ == '__main__':
    main()
