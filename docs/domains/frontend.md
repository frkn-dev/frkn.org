# Frontend

Design system, shared scripts, header/footer partials, i18n, analytics. Load when editing styles, shared JS, or any "normal" page (not `b/`, `app/`, `metrics/` which have own themes).

## Design system — `styles.css` (46.9 KB, 2456 lines)

One shared stylesheet for ~40 "normal" pages. Connected as `/styles.css?v=4`.

- CSS vars in `:root`: `--bg:#090B10`, `--card:#121622`, `--accent:#38BDF8`, `--border:#1F263A`, etc. Dark theme.
- Components: header, hero, cards, buttons, modals, toasts, pricing, language switch.
- RTL block `[dir="rtl"]` (lines ~1659–1771) for `fa/`.

**Not used in:** `b/` (own dark + light "read mode" theme, IBM Plex Mono + Plus Jakarta Sans), `app/` (Telegram `--tg-theme-*` vars), `metrics/` (own Chart.js UI).

## Shared scripts — `scripts/`

| File | Purpose | Cache-bust |
|---|---|---|
| `analytics.js` | self-hosted pixel: `GET https://media.frkn.org/pixel?page=&host=&ref=&lang=&utm_*`. Loaded in 123/134 pages. | — |
| `containers.js` | fetch header/footer partials into `#logo-container`/`#footer-container`; injects "Status" badge → `status.frkn.org` (skipped on subscription pages). | `?v=3` |
| `i18n.js` | ru/en/fa switch: `[data-lang-switch]` buttons, `localStorage frkn-lang`, auto-redirect (max 2/session). `FA_PAGES` whitelist hardcoded. | `?v=2` |
| `trial.js` / `trial.en.js` | trial form → `POST api.frkn.org/account` | — |
| `utils.js` | UUID v4 generator | `?v=1` |

## Header/footer partials — `container/`

`containers.js` fetches these into every page. Three locales each: `.html` (ru), `.en.html`, `.fa.html`.

- `logo.{html,en,fa}.html` — top bar: logo, RU/EN switch, "Sign in", "Support".
- `footer.{html,en,fa}.html` — footer with legal links.
- `services.html` — "services are back" banner, currently fully commented out.

## i18n (ru/en/fa)

- Separate static trees: `/` (ru), `/en/`, `/fa/`. No JS translation — separate HTML per locale.
- `fa/` partially translated: real `fa/index.html` + `fa/pay/index.html` (`<html dir="rtl" lang="fa">`); ~24 other fa files are ~650 B stubs: `<meta http-equiv="refresh">` + `window.location.replace("/en/...")`.
- `404.html` catches `/fa/*` misses → `/en/*`.
- RTL: `dir="rtl"` in HTML + `[dir="rtl"]` block in `styles.css`.

## Analytics

Self-hosted, no GA/Yandex. `analytics.js` fires a pixel to `media.frkn.org` with page/host/referrer/lang/UTM params.

## External CDNs / fonts

- `fonts.googleapis.com` / `fonts.gstatic.com` — Plus Jakarta Sans, Inter, IBM Plex Mono.
- `cdn.simpleicons.org` — brand icons (contacts).
- `cdn.jsdelivr.net` — qrcode (subscription, app), chart.js + chartjs-adapter-date-fns (metrics).
- `telegram.org/js/telegram-web-app.js` — app/.

## Asset versioning

Manual cache-busting query strings: `styles.css?v=4`, `i18n.js?v=2`, `containers.js?v=3`, `utils.js?v=1`. Bump when changing a shared asset.