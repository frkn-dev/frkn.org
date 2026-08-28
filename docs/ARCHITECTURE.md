# Architecture

Static website for the VPN service FRKN ("Рилзопровод"), live at [frkn.org](https://frkn.org). No backend in this repo, no build step, no framework. ~134 HTML files, ~126 MB (73 MB of that is one APK).

## Stack

- **Serving:** Nginx (`Dockerfile` → `nginx:1.31.3-alpine-slim`). `/install` served as `text/plain`, `/health` returns `ok`. 404 → `/404.html`.
- **Frontend:** plain HTML + inline CSS/JS. One shared design system `styles.css` (~47 KB). Complex pages (`pay`, `subscription/`, `app/`, `profile/`, `activate/`, `transaction/`) are single-file SPAs with inline `<script>`.
- **No dependencies:** no `package.json`, no framework, no CDN build. Only external CDNs: Google Fonts, `cdn.simpleicons.org`, `cdn.jsdelivr.net` (qrcode, chart.js), `telegram.org/js/telegram-web-app.js`.

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
| `frkn.org` | prod site (GitHub Pages + rsync mirror). |

Local dev: pages fall back to `localhost:3000/3005/3006/8000` when host is `localhost`/`127.0.0.1`, otherwise hit `https://api.frkn.org`.

## Environments

See [domains/infrastructure.md](domains/infrastructure.md) for full matrix. Quick view: `prod` (GitHub Pages + `/opt/mirror`), `beta` (`/opt/beta`), `testflight` (`testflight.frkn.org`, `/opt/testflight` + `nginx-testflight.conf`), `local` (Docker, port 8080).