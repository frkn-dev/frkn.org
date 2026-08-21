# API integration

Catalog of every `api.frkn.org` endpoint and which page calls it. Load when touching any page that talks to the API. Local dev falls back to `localhost:3000/3005/3006/8000` (see [ARCHITECTURE.md](../ARCHITECTURE.md)).

## Endpoints

| Method + Path | Purpose | Called from |
|---|---|---|
| `POST /account` | register trial / bind email | `index.html` (`trial.js`), `subscription/`, `app/` |
| `GET /key/validate?key=` | validate activation key format | `activate/`, `profile/` |
| `POST /key/activate` | activate a key | `activate/`, `profile/`, `app/` |
| `GET /subscription/{id}` | subscription status by UUID | `subscription/`, `profile/`, `app/` |
| `POST /subscription/trial` | create trial subscription | `subscription/` |
| `GET /sub?id=...&proto=...&format=...` | connection link/QR content per protocol | `subscription/`, `app/` |
| `GET /short` | short link helper | `subscription/` |
| `GET /referrals?code=` | referral info | `subscription/`, `app/` |
| `POST /validate/email` | validate email before bind | `subscription/` |
| `POST /promocode/validate` | validate promocode | `pay/`, `subscription/` |
| `POST /payment/platega/key/create` | create key purchase → Platega redirect | `pay/` |
| `POST /payment/platega/subscription/create` | create subscription renewal → Platega | `subscription/` |
| `POST /payment/platega/donation/create` | create donation → Platega | `donate/` |
| `GET /payment/check/{txid}` | poll payment status | `transaction/` |
| `GET /info/connections/wireguard` | per-node traffic/connection info | `subscription/` |
| `GET /info/connections/amneziawg` | per-node traffic/connection info | `subscription/` |
| `GET /blog/reactions?slug=` | get post reactions | `b/` posts |
| `POST /blog/reaction` | like/dislike a post | `b/` posts |
| `POST /auth` | node auth (used by `install` script) | `install` |
| `WS /ws/metrics?metric=&tags=...` | live metrics stream | `metrics/` |

## Connection protocols (`/sub`)

`proto` values: `Xray`, `VlessTcpReality`, `VlessGrpcReality`, `VlessXhttpReality`, `Hysteria2`, `Proxy`.
`format` values: `txt`, `base64`, `clash`, `plain`.

## Payment provider

Only **Platega**. Flow: page POSTs a `.../create` → gets redirect URL → user pays on Platega → returns to `/transaction?txid=...` → polls `GET /payment/check/{txid}` (2 s interval, up to 150 tries) → `completed` shows key / success. See [payments.md](payments.md).

## Page → endpoint matrix

| Page | Endpoints used |
|---|---|
| `index.html` | `POST /account` (trial) |
| `activate/` | `GET /key/validate`, `POST /key/activate` |
| `profile/` | `GET /key/validate`, `POST /key/activate`, `GET /subscription/{id}` |
| `pay/` | `POST /promocode/validate`, `POST /payment/platega/key/create` |
| `donate/` | `POST /payment/platega/donation/create` |
| `subscription/` | `GET /subscription/{id}`, `GET /sub`, `GET /referrals`, `POST /validate/email`, `POST /account`, `POST /promocode/validate`, `POST /payment/platega/subscription/create`, `GET /info/connections/*` |
| `app/` | `GET /subscription/{id}`, `GET /sub`, `POST /account`, `POST /key/activate`, `GET /referrals`, `POST /payment/platega/subscription/create` |
| `transaction/` | `GET /payment/check/{txid}` |
| `b/` posts | `GET /blog/reactions`, `POST /blog/reaction` |
| `metrics/` | `WS /ws/metrics` |
| `install` (bash) | `POST /auth` |