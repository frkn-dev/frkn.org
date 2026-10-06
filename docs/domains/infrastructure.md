# Infrastructure

Docker, nginx configs, deploy scripts, CI, environments. Load when touching deployment or serving.

## Docker

`Dockerfile`: `nginx:1.31.3-alpine-slim`, static root `/usr/share/nginx/html`, inline `default.conf`. Highlights:
- `error_page 404 /404.html`; gzip for text/JSON/SVG.
- Security headers: `X-Content-Type-Options: nosniff`, `Referrer-Policy`.
- `location = /health` → `200 "ok"` (HEALTHCHECK wget's it).
- `location = /install` → serves `install` as `text/plain`.
- Denies dotfiles (`/\.(?!well-known)`); static assets cached 7 days.
- `RUN rm -rf .git .github .kimi-code .DS_Store`.

`.dockerignore`: `.git`, `.github`, `.kimi-code`, `.DS_Store`, `.gitignore`, `Dockerfile`, `LICENSE.txt`, `CNAME`, `README.md`. Note: `nginx-testflight.conf`, `nginx-onion.conf`, `deploy-*.sh`, `tools/` DO ship into the image.

## Nginx (testflight host)

`nginx-testflight.conf` — vhost for `testflight.frkn.org`. **Disabled:** both
HTTP and HTTPS return `410 Gone` (site retired; content under `/opt/testflight`
is unused). Re-enable by restoring the previous try_files config from git
history.

## Deploy scripts

Three rsync scripts, arg `$1` = `user@host`, `rsync -avz --delete -e ssh` of repo root, exclude `.git .DS_Store .github .gitignore CNAME LICENSE.txt`:

| Script | Destination |
|---|---|
| `deploy-site.sh` | `/opt/frkn.org/` → `frkn.org` |
| `deploy-app.sh` | `/opt/frkn.app/` → `frkn.app` |
| `deploy-beta.sh` | `/opt/beta/frkn.org/` → `beta.frkn.org` |
| `deploy-beta-app.sh` | `/opt/beta/frkn.app/` → `beta.frkn.app` (docroot; vhost/DNS optional) |
| `deploy-testflight.sh` | `/opt/testflight/frkn.org/` |
| `deploy.sh` | `/opt/mirror/frkn.org/` (prod mirror) |

`deploy-site.sh` — main nginx host (default `root@141.133.173.16`). Rsync of the local tree with `--delete`, no server-side git. dopamine binaries are excluded from the main pass and synced separately with `--chmod=F644`. App deploys exclude `preset/requests.csv` so the suggestion queue survives `--delete`.

## CI

`.github/workflows/pages.yml` — deploys static content to GitHub Pages on push to `main` + manual. checkout → configure-pages → upload artifact → deploy-pages. No build/tests/lint.

## Nginx (onion mirror)

`nginx-onion.conf` — Tor mirror vhost (`frknnkuwoa2i3rfjmlzcd3q4nczhy7o2vkqqc46vwsefx7em5cogdrid.onion`), lives next to the prod site on the same host: `listen 127.0.0.1:8080`, same `root /opt/frkn.org`, no TLS (onion v3 encrypts end-to-end), `access_log off`. API and the short-code resolver go same-origin: `location /api/` proxies to the local api.frkn.org vhost (loopback + SNI, WS upgrade headers for /ws/metrics), `location /s/` to s.frkn.org. Pages detect `.onion` in `location.hostname` and switch their API base to `location.origin + '/api'` — Tor users never leave the Tor network. Prod vhost advertises the mirror via the `Onion-Location` header. Depends on the `map $http_upgrade $connection_upgrade` block from `sites-available/api`.

Tor side: `tor` package, `torrc` has `HiddenServiceDir /var/lib/tor/frkn-onion/` + `HiddenServicePort 80 127.0.0.1:8080`. Vanity keys generated with mkp224o; backup at `/root/backups/frkn-onion-keys-*.tar.gz` — the keys ARE the address, losing them loses the onion name.

## Environments

| Env | How | Notes |
|---|---|---|
| `prod` `frkn.org` | `/opt/frkn.org` + rsync mirror `/opt/mirror/frkn.org/` | host is the api.frkn.org box |
| `prod` `frkn.app` | `/opt/frkn.app` (`nginx-frkn-app.conf`) | Dopamine mini-site; `/preset/` → CSV inbox; other paths 302 → frkn.org |
| `onion` | Tor → `127.0.0.1:8080` → same `/opt/frkn.org` | mirrors prod; API via `/api` proxy |
| `beta` `beta.frkn.org` | `/opt/beta/frkn.org/` | vhost in `sites-available/api` |
| `beta` `beta.frkn.app` | `/opt/beta/frkn.app/` | docroot ready; wire DNS+nginx when needed |
| `testflight` | `/opt/testflight/frkn.org/` + `nginx-testflight.conf` | currently `410 Gone` |
| `local` | Docker, port 8080 | pages fall back to `localhost:3000/3005/3006/8000` |

Layout on disk (siblings):

```
/opt/frkn.org
/opt/frkn.app
/opt/beta/frkn.org
/opt/beta/frkn.app
```

Preset queue CSV: `/opt/frkn.app/preset/requests.csv` (not web-served).

## Misc

- `LICENSE.txt` — GPL v3.
- No tests, no linters anywhere. Quality check = `curl /health` + browser.
- `.idea/` is committed IntelliJ cruft despite being in `.gitignore` (predates the rule).
- Remote branches: `main`, `beta`, `testflight`, `react-ts-transition`, plus Jira-style (`FRKN-44`) and feature branches. No unified naming convention.