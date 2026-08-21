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

`.dockerignore`: `.git`, `.github`, `.kimi-code`, `.DS_Store`, `.gitignore`, `Dockerfile`, `LICENSE.txt`, `CNAME`, `README.md`. Note: `nginx-testflight.conf`, `deploy-*.sh`, `tools/` DO ship into the image.

## Nginx (testflight host)

`nginx-testflight.conf` — host Nginx for `testflight.frkn.org` (not Docker): 80→443, Let's Encrypt certs, `root /opt/testflight/frkn.org`. Differs from Dockerfile conf: TLS + HSTS, stricter headers (X-Frame-Options, X-XSS-Protection), 1-year immutable cache, HTML no-cache, extensionless URLs (`$uri.html $uri/index.html`), no `/health`/`/install`.

## Deploy scripts

Three rsync scripts, arg `$1` = `user@host`, `rsync -avz --delete -e ssh` of repo root, exclude `.git .DS_Store .github .gitignore CNAME LICENSE.txt`:

| Script | Destination |
|---|---|
| `deploy.sh` | `/opt/mirror/frkn.org/` (prod mirror) |
| `deploy-beta.sh` | `/opt/beta/frkn.org/` |
| `deploy-testflight.sh` | `/opt/testflight/frkn.org/` |

## CI

`.github/workflows/pages.yml` — deploys static content to GitHub Pages on push to `main` + manual. checkout → configure-pages → upload artifact → deploy-pages. No build/tests/lint.

## Environments

| Env | How | Notes |
|---|---|---|
| `prod` `frkn.org` | GitHub Pages (CNAME) + rsync mirror `/opt/mirror/frkn.org/` | |
| `beta` | rsync `/opt/beta/frkn.org/` | branch `origin/beta` exists; no nginx config in repo; no `beta.frkn.org` domain in code |
| `testflight` `testflight.frkn.org` | rsync `/opt/testflight/frkn.org/` + `nginx-testflight.conf` | branch `origin/testflight` exists |
| `local` | Docker, port 8080 | pages fall back to `localhost:3000/3005/3006/8000` |

## Misc

- `LICENSE.txt` — GPL v3.
- No tests, no linters anywhere. Quality check = `curl /health` + browser.
- `.idea/` is committed IntelliJ cruft despite being in `.gitignore` (predates the rule).
- Remote branches: `main`, `beta`, `testflight`, `react-ts-transition`, plus Jira-style (`FRKN-44`) and feature branches. No unified naming convention.