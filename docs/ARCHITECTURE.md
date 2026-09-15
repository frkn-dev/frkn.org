# Architecture

Static website for the VPN service FRKN ("Рилзопровод"), live at [frkn.org](https://frkn.org). No backend in this repo, no build step, no framework. ~134 HTML files, ~126 MB (73 MB of that is one APK).

## Stack

- **Serving:** Nginx (`Dockerfile` → `nginx:1.31.3-alpine-slim`). `/install` served as `text/plain`, `/health` returns `ok`. 404 → `/404.html`.
- **Frontend:** plain HTML + inline CSS/JS. One shared design system `styles.css` (~47 KB). Complex pages (`pay`, `subscription/`, `app/`, `profile/`, `activate/`, `transaction/`) are single-file SPAs with inline `<script>`.
- **No runtime deps:** no build step, no framework, no `package.json` in the served site. Only external CDNs: Google Fonts, `cdn.simpleicons.org`, `cdn.jsdelivr.net` (qrcode, jszip, chart.js), `telegram.org/js/telegram-web-app.js`. Dev-only test harness lives in `tools/e2e/` (own `package.json` with jsdom, `node_modules` gitignored) — not part of the served site.

## How it fits together

```
page.html ──fetch──> /container/logo.html + /container/footer.html   (via /scripts/containers.js)
page.html ──pixel──> https://media.frkn.org/pixel?...                 (via /scripts/analytics.js)
page.html ──XHR───>  https://api.frkn.org/...                        (payment, subscription, keys...)
page.html ──WS────>  wss://api.frkn.org/ws/metrics?metric=...        (metrics/ dashboard)
install (bash) ────>  https://api.frkn.org/auth, github.com/frkn-dev/fcore
```

### Shared assets (root level)

| Path | Role |
|---|---|
| `styles.css` | single design system (CSS vars `--bg/--card/--accent/--border`, dark theme, RTL block). Cache-busted `?v=4`. |
| `scripts/` | `analytics.js` (pixel), `containers.js` (fetch header/footer partials + status badge), `i18n.js` (ru/en/fa switch), `trial.js`/`trial.en.js`, `utils.js` (UUID). |
| `container/` | HTML partials `logo.{html,en.html,fa.html}`, `footer.{html,en.html,fa.html}`, `services.html` (commented out). |
| `Images/` | logos, favicon, hero `main.png/webp`, og-image, protocol icons. |

### i18n (ru/en/fa)

Separate static trees `/` (ru), `/en/`, `/fa/`. `scripts/i18n.js` handles `[data-lang-switch]` buttons, stores choice in `localStorage frkn-lang`, auto-redirects (max 2 redirects/session). `fa/` is partially translated (only `index.html` + `pay/` are real, rest are ~650 B redirect stubs to `/en/`); RTL via `dir="rtl"` + `[dir="rtl"]` block in `styles.css`.

### External domains

| Domain | Purpose |
|---|---|
| `api.frkn.org` | REST + WebSocket (metrics). Full catalog: [domains/api-integration.md](domains/api-integration.md). |
| `media.frkn.org` | self-hosted analytics pixel. |
| `status.frkn.org` | status badge (injected by `containers.js`). |
| `frkn.org` | prod site (own nginx, `/opt/frkn.org`). |
| `frknnkuwoa2i3rfjmlzcd3q4nczhy7o2vkqqc46vwsefx7em5cogdrid.onion` | Tor mirror of prod (`nginx-onion.conf`, API via same-origin `/api` proxy). |

Local dev: pages fall back to `localhost:3000/3005/3006/8000` when host is `localhost`/`127.0.0.1`, on `*.onion` they use same-origin `/api` (proxied to api.frkn.org by the onion vhost), otherwise hit `https://api.frkn.org`. Additionally `subscription/` supports `?mock=1` to force the mock API (`tools/mock-api/serve.js`) on any host — see [RUNBOOK.md](RUNBOOK.md).

## Environments

See [domains/infrastructure.md](domains/infrastructure.md) for full matrix. Quick view: `prod` (own nginx `/opt/frkn.org` + `/opt/mirror` rsync copy), `onion` (Tor mirror of prod), `beta` (`/opt/beta`), `testflight` (`testflight.frkn.org`, `/opt/testflight` + `nginx-testflight.conf`), `local` (Docker, port 8080).