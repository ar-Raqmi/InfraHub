#!/usr/bin/env bash
# Bootstrap a LOCAL v2 dev database: anonymised seed + migrations. Never touches production
# (run it inside a worktree whose wrangler.toml carries the fake database id).
set -euo pipefail
STATE="${1:?usage: bootstrap-local.sh <persist-to state dir>}"
SEED="$HOME/Documents/InfraHub-backups/dev-seed/dev-seed-anon.sql"
if ! grep -q '00000000-0000-4000-8000-000000000000' wrangler.toml; then
  echo "refusing: wrangler.toml is not the fake-id local config" >&2; exit 1
fi
rm -rf "$STATE"; mkdir -p "$STATE"
npx wrangler d1 execute infrahub-db --local --persist-to "$STATE" --file "$SEED" > /dev/null
npx wrangler d1 migrations apply infrahub-db --local --persist-to "$STATE" | grep -E '✅|✘' || true
echo "bootstrapped $STATE (seed + migrations). Serve it, then POST /api/v2/admin/migrate-legacy once."
