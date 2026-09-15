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

`nginx-testflight.conf` — host Nginx for `testflight.frkn.org` (not Docker): 80→443, Let's Encrypt certs, `root /opt/testflight/frkn.org`. Differs from Dockerfile conf: TLS + HSTS, stricter headers (X-Frame-Options, X-XSS-Protection), 1-year immutable cache, HTML no-cache, extensionless URLs (`$uri.html $uri/index.html`), no `/health`/`/install`.

## Deploy scripts

Three rsync scripts, arg `$1` = `user@host`, `rsync -avz --delete -e ssh` of repo root, exclude `.git .DS_Store .github .gitignore CNAME LICENSE.txt`:

| Script | Destination |
|---|---|
| `deploy.sh` | `/opt/mirror/frkn.org/` (prod mirror) |
| `deploy-beta.sh` | `/opt/beta/frkn.org/` |
| `deploy-testflight.sh` | `/opt/testflight/frkn.org/` |

`deploy-site.sh` — main nginx host `/opt/frkn.org/` (default `root@141.133.173.16`). Rsync of the local tree with `--delete`, no server-side git. dopamine binaries are excluded from the main pass and synced separately with `--chmod=F644`.

## CI

`.github/workflows/pages.yml` — deploys static content to GitHub Pages on push to `main` + manual. checkout → configure-pages → upload artifact → deploy-pages. No build/tests/lint.

## Nginx (onion mirror)

`nginx-onion.conf` — Tor mirror vhost (`frknnkuwoa2i3rfjmlzcd3q4nczhy7o2vkqqc46vwsefx7em5cogdrid.onion`), lives next to the prod site on the same host: `listen 127.0.0.1:8080`, same `root /opt/frkn.org`, no TLS (onion v3 encrypts end-to-end), `access_log off`. API and the short-code resolver go same-origin: `location /api/` proxies to the local api.frkn.org vhost (loopback + SNI, WS upgrade headers for /ws/metrics), `location /s/` to s.frkn.org. Pages detect `.onion` in `location.hostname` and switch their API base to `location.origin + '/api'` — Tor users never leave the Tor network. Prod vhost advertises the mirror via the `Onion-Location` header. Depends on the `map $http_upgrade $connection_upgrade` block from `sites-available/api`.

Tor side: `tor` package, `torrc` has `HiddenServiceDir /var/lib/tor/frkn-onion/` + `HiddenServicePort 80 127.0.0.1:8080`. Vanity keys generated with mkp224o; backup at `/root/backups/frkn-onion-keys-*.tar.gz` — the keys ARE the address, losing them loses the onion name.

## Environments

| Env | How | Notes |
|---|---|---|
| `prod` `frkn.org` | own nginx `/opt/frkn.org` (`nginx-site.conf`) + rsync mirror `/opt/mirror/frkn.org/` | GitHub Pages no longer used |
| `onion` | Tor → `127.0.0.1:8080` → same `/opt/frkn.org` (`nginx-onion.conf`) | mirrors prod content; API via `/api` proxy |
| `beta` | rsync `/opt/beta/frkn.org/` | branch `origin/beta` exists; beta vhost lives in `sites-available/api` on the server |
| `testflight` `testflight.frkn.org` | rsync `/opt/testflight/frkn.org/` + `nginx-testflight.conf` | branch `origin/testflight` exists |
| `local` | Docker, port 8080 | pages fall back to `localhost:3000/3005/3006/8000` |

## Misc

- `LICENSE.txt` — GPL v3.
- No tests, no linters anywhere. Quality check = `curl /health` + browser.
- `.idea/` is committed IntelliJ cruft despite being in `.gitignore` (predates the rule).
- Remote branches: `main`, `beta`, `testflight`, `react-ts-transition`, plus Jira-style (`FRKN-44`) and feature branches. No unified naming convention.