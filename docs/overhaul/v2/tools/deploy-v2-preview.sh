#!/usr/bin/env bash
# Deploy overhaul/v2 to an ISOLATED Cloudflare preview: its own Pages project, D1 database and R2 bucket,
# loaded with the anonymised dev seed. Production (infra-hub / infrahub-db / infrahub-bucket) is never named here.
#   step 1  ./deploy-v2-preview.sh resources   create D1 + R2 (idempotent), print the D1 id
#   step 2  ./deploy-v2-preview.sh seed <d1-id> load anonymised seed + migrations into the PREVIEW D1 (first time only)
#   step 3  ./deploy-v2-preview.sh deploy <d1-id>  build overhaul/v2 and deploy to the preview Pages project
set -euo pipefail
PROJECT=infrahub-v2-preview
DB=infrahub-v2-preview-db
BUCKET=infrahub-v2-preview-bucket
REPO=/home/rezephyr/Documents/Repo/InfraHub
WORK=/home/rezephyr/Documents/Repo/InfraHub-wt/preview
SEED=/home/rezephyr/Documents/InfraHub-backups/dev-seed/dev-seed-anon.sql

for n in "$PROJECT" "$DB" "$BUCKET"; do
  case "$n" in *v2-preview*) ;; *) echo "refusing: '$n' is not a v2-preview resource" >&2; exit 1 ;; esac
done

write_toml() {
  local id="$1"
  [[ "$id" =~ ^[0-9a-f-]{36}$ ]] || { echo "refusing: bad d1 id" >&2; exit 1; }
  if grep -q "$id" "$REPO/wrangler.toml"; then echo "refusing: that is the PRODUCTION database id" >&2; exit 1; fi
  cat > "$WORK/wrangler.toml" <<EOF
name = "$PROJECT"
compatibility_date = "2026-06-18"
pages_build_output_dir = "dist"

[[d1_databases]]
binding = "DB"
database_name = "$DB"
database_id = "$id"
migrations_dir = "migrations"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "$BUCKET"
EOF
}

prepare_worktree() {
  if [ ! -d "$WORK" ]; then git -C "$REPO" worktree add --detach "$WORK" overhaul/v2 >/dev/null; fi
  git -C "$WORK" checkout -q --detach overhaul/v2
  [ -e "$WORK/node_modules" ] || ln -s "$REPO/node_modules" "$WORK/node_modules"
}

case "${1:-}" in
  resources)
    npx wrangler d1 list --json | python3 -c "import json,sys; sys.exit(0 if any(d['name']=='$DB' for d in json.load(sys.stdin)) else 1)" \
      || npx wrangler d1 create "$DB" >/dev/null
    npx wrangler r2 bucket list | grep -q "name: *$BUCKET\$" || npx wrangler r2 bucket create "$BUCKET"
    npx wrangler d1 list --json | python3 -c "import json,sys; print([d['uuid'] for d in json.load(sys.stdin) if d['name']=='$DB'][0])"
    ;;
  seed)
    prepare_worktree; write_toml "${2:?d1 id}"
    cd "$WORK"
    tables=$(npx wrangler d1 execute "$DB" --remote --json --command "SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name='projects'" | python3 -c "import json,sys; print(json.load(sys.stdin)[0]['results'][0]['n'])")
    if [ "$tables" != "0" ]; then echo "refusing: $DB already seeded"; exit 1; fi
    npx wrangler d1 execute "$DB" --remote --yes --file "$SEED" | tail -3
    npx wrangler d1 migrations apply "$DB" --remote | grep -E '✅|✘' || true
    ;;
  deploy)
    prepare_worktree; write_toml "${2:?d1 id}"
    cd "$WORK"
    npm run build >/dev/null
    npx wrangler pages project list | grep -q " $PROJECT " || npx wrangler pages project create "$PROJECT" --production-branch main
    npx wrangler d1 migrations apply "$DB" --remote | grep -E '✅|✘|No migrations' || true
    npx wrangler pages deploy dist --project-name "$PROJECT" --branch main --commit-dirty=true | tail -4
    ;;
  *) sed -n 2,7p "$0"; exit 2 ;;
esac
