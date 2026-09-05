#!/usr/bin/env bash
# Deploy frkn.org static site to our own nginx host (replaces GitHub Pages).
#
# Usage: ./deploy-site.sh [user@host]
#   defaults: root@<api-server>
#
# Deploy = rsync of the local working tree to /opt/frkn.org. No git on the
# server: what you have locally is what goes live (so deploy from a clean
# checkout of the branch you want).
set -euo pipefail

HOST="${1:-root@141.133.173.16}"
REMOTE_DIR="/opt/frkn.org"

echo "Deploying frkn.org (local tree) to ${HOST}:${REMOTE_DIR}..."

# Site content. --delete keeps the remote in sync; VCS/local agent configs
# and macOS junk never leave the machine. dopamine binaries are excluded
# here and synced separately below with fixed permissions.
rsync -av --progress --delete \
    --exclude='.git/' \
    --exclude='.github/' \
    --exclude='.kimi-code/' \
    --exclude='.opencode/' \
    --exclude='.aider.tags.cache.v4/' \
    --exclude='.DS_Store' \
    --exclude='dopamine/*.pkg' \
    --exclude='dopamine/*.msi' \
    --exclude='dopamine/*.apk' \
    --exclude='dopamine/*.dmg' \
    ./ "${HOST}:${REMOTE_DIR}/"

# dopamine binaries are gitignored — they travel outside git, and we force
# 644 so nginx can read them regardless of local umask.
shopt -s nullglob
bins=(dopamine/*.pkg dopamine/*.msi dopamine/*.apk dopamine/*.dmg)
if ((${#bins[@]})); then
    echo "Syncing dopamine binaries: ${bins[*]}"
    rsync -av --progress --chmod=F644 \
        "${bins[@]}" "${HOST}:${REMOTE_DIR}/dopamine/"
fi

echo "Done. Nginx vhost: nginx-site.conf (one-time setup, see header there)."
