# Site structure

Map of every top-level directory and root file. Load when you need to know which page lives where or touch multiple pages.

## Root files

| Path | Size | What |
|---|---|---|
| `index.html` | 9.7 KB | Landing: hero, 3 features, trial form (email → `POST api.frkn.org/account` via `/scripts/trial.js`, ProtonMail blocked). |
| `404.html` | 1.3 KB | 404 + JS redirect of any `/fa/*` miss → `/en/*`. |
| `styles.css` | 46.9 KB | Shared design system (see [frontend.md](frontend.md)). |
| `install` | 24.5 KB | bash installer for a VPN node (`curl | sh`). See [install-setup.md](install-setup.md). |
| `CNAME` | 8 B | `frkn.org` (GitHub Pages). |

## Page directories

| Dir | What | Notes |
|---|---|---|
| `about/` | "What is Рилзопровод" | static text, shared styles.css |
| `activate/` | Key activation `XXXXX-...` | `GET /key/validate`, `POST /key/activate`, referral field, lots of inline JS |
| `app/` | **Telegram Mini App** (105.6 KB) | full subscription cabinet inside Telegram, `--tg-theme-*` vars, own styles. See [subscription-app.md](subscription-app.md). |
| `b/` | **Blog "Блог Тупицы"** | ~49 posts, `rss.xml`, own dark theme. See [blog.md](blog.md). |
| `confidential/` | Privacy policy | static |
| `contacts/` | Contact cards | pigeon@frkn.org, TG support/bots, GitHub |
| `container/` | **HTML partials** (not a page) | `logo.{html,en,fa}.html`, `footer.{html,en,fa}.html`, `services.html`. See [frontend.md](frontend.md). |
| `donate/` | Donation | `POST /payment/platega/donation/create` → Platega |
| `dopamine/` | FRKN Dopamine client landing | APK (73.3 MB) + TestFlight + app-store badges. `.dmg/.pkg` gitignored. `dopamine/styles.css`, `scripts/`, `container/`, `Images/` are dead duplicates — pages use root `/styles.css`, `/scripts/`. |
| `en/` | **English localization** (22 files) | mirrors of most pages, static HTML |
| `fa/` | **Persian, partial** | only `index.html` + `pay/` real; rest are redirect stubs to `/en/` |
| `Images/` | shared assets (3.3 MB) | logos, favicon, hero, og-image, protocol icons |
| `info/` | explainers | `activation-keys/`, `subscriptions/` (protocols) |
| `metrics/` | internal monitoring dashboard | Chart.js + WS `wss://api.frkn.org/ws/metrics`. No auth. |
| `oferta/` | Public offer | static |
| `pay/` | Pricing + purchase | Platega key purchase, promocode. See [payments.md](payments.md). |
| `premium/` | Personal server landing | 1 Gbps dedicated, CTA → TG @frkn_support |
| `privacy-policy/` | Privacy policy | static |
| `profile/` | Subscription access | login by subscription UUID, key activation modal |
| `referral/` | Referral program rules | static |
| `scripts/` | Shared client JS | analytics, containers, i18n, trial, utils. See [frontend.md](frontend.md). |
| `setup/` | Connection guides | `index.html` (platform tabs), `routers/` (VPN on router), `amneziawg-routers/` (redirect stub) |
| `subscription/` | **Subscription cabinet** (168.9 KB, largest page) | by `?id=`. See [subscription-app.md](subscription-app.md). |
| `switch-to-frkn/` | Promo: switch from another VPN | 6-month discount, send screenshot to support |
| `transaction/` | Payment return | polls `GET /payment/check/{txid}`. `transaction/fail/` = error page. |
| `user-agreement/` | User agreement | static |

## Notable

- Navigation uses absolute paths (`/pay`, `/activate`, `/subscription/`); `en/` mirrors the structure under `/en/`.
- Legal footer links are shared via `container/` partials.
- `setup/`, `info/`, `premium/`, `referral/`, `switch-to-frkn/` are static marketing/help pages with no API calls.