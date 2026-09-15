# Payments

Platega payment flows across `pay/`, `donate/`, `transaction/`, `activate/`, promocodes. Load when editing any purchase/donation flow.

## Provider

**Platega** only. Card / SBP (fast payments) / crypto. Endpoints live under `api.frkn.org/payment/platega/...` (see [api-integration.md](api-integration.md)).

## Flow overview

1. Page POSTs a `.../create` request → API returns a redirect URL to the Platega gateway.
2. Browser redirects to Platega, user pays.
3. Platega redirects back to `/transaction?txid=<id>`.
4. `transaction/index.html` polls `GET /payment/check/{txid}` every 2 s, up to 150 tries.
5. On `completed`: show activation key (key purchase), or success → `/subscription?id=` (renewal), or "thanks for donating" (donation).

## Pages

| Page | What | Endpoint |
|---|---|---|
| `pay/` | pricing tiers + key purchase + promocode | `POST /payment/platega/key/create`, `POST /promocode/validate` |
| `donate/` | donation with preset amounts | `POST /payment/platega/donation/create` |
| `subscription/` | renewal with promocode | `POST /payment/platega/subscription/create` |
| `transaction/` | return page, polls status | `GET /payment/check/{txid}` |
| `transaction/fail/` | payment error page | — |
| `activate/` | redeem purchased key | `GET /key/validate`, `POST /key/activate` |

## Pricing (`pay/`)

Main: 30d/500₽, 90d/1300₽, 365d/4500₽. Compact: 3d/100₽, 7d/200₽, 14d/300₽, 180d/2700₽.

## Promocodes & referrals

- `pay/`: promocode via `POST /promocode/validate`; referral code from URL.
- `subscription/`: referral code (`GET /referrals?code=`) + renewal promocode.
- `activate/`: referral code field on key activation.

## Key format

Activation keys use `XXXXX-...-X` pattern, validated by `GET /key/validate?key=` before activation.

## Notes

- `switch-to-frkn/` is a marketing page (switch discount) — no payment API, users send a screenshot to support instead.
- After successful key purchase, `transaction/` auto-redirects to `/activate?code=<key>`.<｜end▁of▁thinking｜>

<｜｜DSML｜｜tool_calls>
<｜｜DSML｜｜invoke name="write">
<｜｜DSML｜｜parameter name="content" string="true"># Subscription & Telegram Mini App

The user-facing "cabinet": `subscription/` (web), `app/` (Telegram Mini App), `profile/` (login). Load when editing any of these.

## `subscription/` (168.9 KB, 5439 lines — largest page)

Personal cabinet addressed by `?id=<subscription UUID>`. Single-file SPA, inline CSS/JS.

Features:
- Subscription status: `GET api.frkn.org/subscription/{id}`.
- Connection link per protocol: `GET /sub?id=...&proto=...&format=txt|base64|clash|plain` (protocols: Xray, VlessTcpReality, VlessGrpcReality, VlessXhttpReality, Hysteria2, Proxy).
- QR code (jsDelivr `qrcode` lib) of the connection link.
- Client picker from local `vpn-clients.json` (3.6 KB): dopamine, happ, v2raytun, hiddify, streisand, shadowrocket, etc.
- Traffic/connection details: `GET /info/connections/wireguard`, `/info/connections/amneziawg`.
- Bulk `.conf` archives via client-side JSZip (jsDelivr `jszip`) in the AWG wizard step, three buttons (same logic in `subscription/`, `en/subscription/`, `app/`):
  - **«Скачать все»** (`#awg-download-all`) → `frkn-awg-<env>.zip`: configs exactly as the API serves them, every node, untouched (the API emits **AmneziaWG 3.1** configs).
  - **«AmneziaWG 3.x»** (`#awg-download-all-3x`) → `frkn-awg-<env>-awg3x.zip`: `toAwgClientConfig(config, "3.1")` — every node, the full 3.1 `[Interface]` key set kept, empty values (`I2 = `) and comments dropped. Needs an official client from Aug 2026 or newer (Windows 3.1.0, Android v3.1.20260814 from GitHub releases, iOS/macOS with the 3.1 parser).
  - **«AmneziaWG 2.x»** (`#awg-download-all-2x`) → `frkn-awg-<env>-awg2x.zip`: for the Google Play build (2.0.x as of Sep 2026). `toAwgClientConfig(config, "2.0")` reduces `[Interface]` to the **AWG 2.0 field set** every official client since Feb/Mar 2026 accepts — `PrivateKey Address DNS MTU ListenPort Jc Jmin Jmax S1–S4 H1–H4 I1–I5` (H ranges like `100000-200000` and I templates kept verbatim, empty values dropped, comments dropped, `[Peer]` untouched). Client-local 3.0/3.1 keys are stripped (`ContentPaddingAddition`, `RekeyAfterTime`, `RekeyTimeout`, `RejectAfterTime`, `KeepaliveTimeout`, `MaxHandshakeAttempts`, `DisableCookies`, `RandomTrailers = off`). Keys that must match the server — non-empty `HeaderProtectionKey`, `RandomTrailers = on` — mark the node as a *blocker*: it is left out of this archive and a generic note under the buttons (`#awg-compat-note`) says some servers work only with AmneziaWG 3.1; the button label shows `M из N`, and is disabled when M = 0.
  - Zip entry name = tunnel name in the clients. `awgTunnelNames` produces unique kebab-case names matching `^[a-zA-Z0-9_=+.-]{1,15}$` (Android / `awg-quick` limit; Windows allows 32): Cyrillic transliterated, `Uncle Sam (USA)` → `uncle-sam-usa`, duplicates → `-2`, `-3` with the base cut to fit. Also used for the per-node Download button.
  - Field matrix verified against amneziawg-windows `conf/parser.go` (master, v0.2.0), amneziawg-android `Interface.java` (2.0.1, v3.0.1, master), `Tunnel.java`, amneziawg-tools `awg-quick`.
- Email binding: `POST /validate/email` → `POST /account`.
- Key activation, referral (`GET /referrals?code=`), renewal with promocode → `POST /payment/platega/subscription/create`.

## `sub/` — short-code entry to the cabinet

Redirector page: `/sub/<code>` (e.g. `/sub/38jf-dcrc-23`) serves `sub/index.html` via a dedicated nginx location (`~* ^/sub/[a-z0-9-]+/?$` in `Dockerfile`, `nginx-site.conf`, `nginx-testflight.conf`). The page resolves the code through `GET https://s.frkn.org/<code>` (returns `{subscription_id, subscription_url}`, CORS open for frkn.org) and `location.replace`s to `/subscription/?id=<UUID>` (`/en/` for non-ru browsers). Unknown code → "Код не найден" screen with links to `/` and `/activate`. The plain `/subscription?id=UUID` variant keeps working.

Not to be confused with the API endpoint `api.frkn.org/sub?id=` (connection links) — different host, different thing.

## `app/` — Telegram Mini App (105.6 KB, 2783 lines)

Full subscription cabinet inside Telegram (bot @unlock_internet_bot). Loads `https://telegram.org/js/telegram-web-app.js`; theming via `--tg-theme-*` CSS vars (does NOT use root `styles.css`).

Features: connection links + QR, email binding, referral, key activation, renewal via Platega.

## `profile/` (30.2 KB)

"Access subscription" — login by subscription UUID only (no password), key activation modal (`/key/validate`, `/key/activate`), FAQ.

## Related

- Referral rules static page: `referral/`.
- Key activation standalone page: `activate/`.
- Pricing: `pay/`. Flows: [payments.md](payments.md). Endpoints: [api-integration.md](api-integration.md).