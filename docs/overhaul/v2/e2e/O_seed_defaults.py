"""Seed Tetapan Organisasi defaults (today's printed values) into an InfraHub deployment through the API.

Idempotent: only keys/rules that do not exist yet are written, so a re-run changes nothing and an admin's
edits are never overwritten. Values come from components/org/org-defaults.json (the same file the app uses as
its fallback), plus the domain DEFAULT_POLICY_RULES that migrate-legacy already seeds.

usage: python O_seed_defaults.py --base http://localhost:8796 [--user admin01]
The password is read from the dev-seed CREDS file (line 2) and never printed.
"""
import argparse
import json
import os
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULTS = os.path.join(HERE, '..', '..', '..', '..', 'components', 'org', 'org-defaults.json')
CREDS = os.path.expanduser('~/Documents/InfraHub-backups/dev-seed/CREDS.txt')


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
            return err.code, err.read().decode()[:200]

    def login(self, username):
        password = open(CREDS).read().splitlines()[1].strip()
        status, body = self.call('/auth/login', 'POST', {'username': username, 'password': password})
        if status != 200:
            raise SystemExit(f'login {username} failed: {status}')
        self.uid = body['user']['id']


def seed(api, defaults):
    written = []
    _, config = api.call('/config')
    for key, value in defaults['config'].items():
        if key not in config:
            status, _ = api.call(f'/config/{key}', 'PUT', {'value': value})
            written.append(f'config {key} -> {status}')
    _, policies = api.call('/policies')
    have = {(p['key'], p['effectiveFrom']) for p in policies}
    have_keys = {p['key'] for p in policies}
    for rule in defaults['policies']:
        if rule['key'] not in have_keys and (rule['key'], rule['effective_from']) not in have:
            status, _ = api.call('/policies', 'POST', rule)
            written.append(f"policy {rule['key']}@{rule['effective_from']} -> {status}")
    return written


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--base', required=True)
    parser.add_argument('--user', default='admin01')
    args = parser.parse_args()
    api = Api(args.base)
    api.login(args.user)
    with open(DEFAULTS, encoding='utf-8') as fh:
        defaults = json.load(fh)
    written = seed(api, defaults)
    print(f'seeded {len(written)} item(s)')
    for line in written:
        print('  ' + line)


if __name__ == '__main__':
    main()
