#!/usr/bin/env bash
# Regenerate public/github-3d-contrib.svg with yoshi389111/github-profile-3d-contrib
# using the site's amber palette (scripts/3d-contrib-settings.json).
#
# Usage: npm run fetch:contrib-svg [username]
# Auth:  uses `gh auth token`, or set GITHUB_TOKEN explicitly.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
USERNAME="${1:-kaivalya-cyber}"
WORK="${TMPDIR:-/tmp}/3d-contrib"

if [ ! -d "$WORK" ]; then
  git clone --depth 1 https://github.com/yoshi389111/github-profile-3d-contrib.git "$WORK"
fi

cd "$WORK"
if [ ! -d node_modules ]; then
  npm install --no-fund --no-audit
fi

if [ -z "${GITHUB_TOKEN:-}" ]; then
  GITHUB_TOKEN="$(gh auth token)"
fi

GITHUB_TOKEN="$GITHUB_TOKEN" \
SETTING_JSON="$ROOT/scripts/3d-contrib-settings.json" \
  node_modules/.bin/ts-node src/index.ts "$USERNAME"

cp "$WORK/profile-3d-contrib/profile-amber.svg" "$ROOT/public/github-3d-contrib.svg"
node "$ROOT/scripts/theme-contrib-svg.mjs" "$ROOT/public/github-3d-contrib.svg"
echo "updated $ROOT/public/github-3d-contrib.svg"
