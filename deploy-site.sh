#!/usr/bin/env bash
# Deploy frkn.org static site to our own nginx host (replaces GitHub Pages).
#
# Usage: ./deploy-site.sh [user@host] [branch]
#   defaults: root@<api-server>, main
#
# The server keeps a plain git checkout at /opt/frkn.org; deploy = fetch +
# reset to origin/<branch>. Deterministic: only committed state goes live.
set -euo pipefail

HOST="${1:-root@141.133.173.16}"
BRANCH="${2:-main}"
REMOTE_DIR="/opt/frkn.org"
REPO_URL="https://github.com/frkn-dev/frkn.org.git"

echo "Deploying frkn.org (${BRANCH}) to ${HOST}:${REMOTE_DIR}..."

ssh "$HOST" bash -s <<EOF
set -euo pipefail
if [ ! -d "${REMOTE_DIR}/.git" ]; then
    git clone "${REPO_URL}" "${REMOTE_DIR}"
fi
cd "${REMOTE_DIR}"
git fetch origin "${BRANCH}"
git checkout "${BRANCH}"
git reset --hard "origin/${BRANCH}"
echo "Deployed: \$(git log --oneline -1)"
EOF

# dopamine binaries (*.pkg, *.apk, *.dmg) are gitignored — they travel
# outside git: rsync straight into the checkout. Untracked files survive
# `git reset --hard`, so later site deploys don't wipe them.
shopt -s nullglob
bins=(dopamine/*.pkg dopamine/*.msi dopamine/*.apk dopamine/*.dmg)
if ((${#bins[@]})); then
    echo "Syncing dopamine binaries: ${bins[*]}"
    rsync -av --progress "${bins[@]}" "${HOST}:${REMOTE_DIR}/dopamine/"
fi

echo "Done. Nginx vhost: nginx-site.conf (one-time setup, see header there)."
