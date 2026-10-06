#!/usr/bin/env bash
# Deploy beta.frkn.app → /opt/beta/frkn.app
#
# Usage: ./deploy-beta-app.sh [user@host]
#   defaults: root@141.133.173.16
set -euo pipefail

HOST="${1:-root@141.133.173.16}"
REMOTE_DIR="/opt/beta/frkn.app"

echo "Deploying beta.frkn.app (local tree) to ${HOST}:${REMOTE_DIR}..."

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
  --exclude='preset/requests.csv' \
  --exclude='preset/requests.csv.*' \
  ./ "${HOST}:${REMOTE_DIR}/"

shopt -s nullglob
bins=(dopamine/*.pkg dopamine/*.msi dopamine/*.apk dopamine/*.dmg dopamine/*.bin)
if ((${#bins[@]})); then
  echo "Syncing dopamine binaries: ${bins[*]}"
  rsync -avz --progress --chmod=F644 \
    "${bins[@]}" "${HOST}:${REMOTE_DIR}/dopamine/"
fi

echo "Done. Docroot ${REMOTE_DIR} (wire nginx + DNS for beta.frkn.app when ready)."
