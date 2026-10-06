#!/usr/bin/env bash
# Deploy to beta.frkn.org → /opt/beta/frkn.org
#
# Usage: ./deploy-beta.sh [user@host]
#   defaults: root@141.133.173.16
#   RSYNC_RSH=... for custom ssh (same as deploy-site.sh)
set -euo pipefail

HOST="${1:-root@141.133.173.16}"
REMOTE_DIR="/opt/beta/frkn.org"

echo "Deploying beta.frkn.org to ${HOST}:${REMOTE_DIR}..."

rsync -avz --progress --delete \
  --exclude='.git/' \
  --exclude='.github/' \
  --exclude='.kimi-code/' \
  --exclude='.opencode/' \
  --exclude='.DS_Store' \
  --exclude='.gitignore' \
  --exclude='CNAME' \
  --exclude='LICENSE.txt' \
  --exclude='dopamine/*.pkg' \
  --exclude='dopamine/*.msi' \
  --exclude='dopamine/*.apk' \
  --exclude='dopamine/*.dmg' \
  --exclude='dopamine/*.bin' \
  ./ "${HOST}:${REMOTE_DIR}/"

shopt -s nullglob
bins=(dopamine/*.pkg dopamine/*.msi dopamine/*.apk dopamine/*.dmg dopamine/*.bin)
if ((${#bins[@]})); then
  echo "Syncing dopamine binaries: ${bins[*]}"
  rsync -avz --progress --chmod=F644 \
    "${bins[@]}" "${HOST}:${REMOTE_DIR}/dopamine/"
fi

echo "Done. Live at https://beta.frkn.org/"
