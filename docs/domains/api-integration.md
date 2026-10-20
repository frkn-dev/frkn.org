# API integration

Catalog of every `api.frkn.org` endpoint and which page calls it. Load when touching any page that talks to the API. Local dev falls back to `localhost:3000/3005/3006/8000` (see [ARCHITECTURE.md](../ARCHITECTURE.md)).

## Endpoints

| Method + Path | Purpose | Called from |
|---|---|---|
| `POST /account` | register trial / bind email | `index.html` (`trial.js`), `subscription/`, `app/` |
| `GET /key/validate?key=` | validate activation key format | `activate/`, `profile/` |
| `POST /key/activate` | activate a key | `activate/`, `profile/`, `app/` |
| `GET /subscription/{id}` | subscription status by UUID; `plan_kind` (`standard`/`lite`/`premium`/`selfhosted`); named `connections[]` include boolean `include_in_main` | `subscription/`, `profile/`, `app/` |
| `POST /devices` | create a named device; `include_in_main: false` = separate link only, `true` = also in the main subscription | `subscription/`, `app/` |
| `PATCH /devices/{connectionId}?subscription_id=...` | update a named device with body `{"include_in_main":true|false}`; success `{"status":200,"message":"ok"}` | `subscription/`, `app/` |
| `POST /private/account` | open an empty selfhosted account (`plan_kind=selfhosted`, no expiry, personal env) → `{subscription_id, plan_kind, scope_env}`; public, per-IP rate-limited | `subscription/`, `en/subscription/` |
| `POST /private/install-token` | mint a 1 h node install token for a subscription (selfhosted "Own node"); `409` + `response.code = server_limit_reached` when the account's server cap is already used up | `subscription/`, `en/subscription/` |
| `GET /private/nodes?subscription_id=` | list the subscription's own nodes | `subscription/` |
| `GET /private/state?subscription_id=` | selfhosted counters `{plan_kind, servers:{used,limit,remaining}, users:{used,limit,remaining}}`; `limit` = `subscriptions.server_limit`/`user_limit` (default 3/20), `servers` counts own nodes offline included, `users` counts non-deleted child subscriptions | `subscription/`, `en/subscription/` |
| `POST /private/users` | invite a user: body `{"subscription_id":"<owner>","all_servers":bool,"node_ids":[uuid,…]}` (`all_servers` XOR non-empty `node_ids` without duplicates) → a child subscription on the owner's nodes + the link `frkn://sub/<child>`; AWG family only; `409 user_limit_reached` when the user cap is full, `403` for a node of another account, `404` for an unknown node | `subscription/` (API/`tools/e2e`) |
| `GET /private/users?subscription_id=` | list the account's users (`subscription_url`, `all_servers`, `node_ids`, `connections`) | `subscription/` (API/`tools/e2e`) |
| `DELETE /private/users/{child_uuid}?subscription_id=<owner>` | revoke a user: cuts its connections (tombstones to the nodes) and frees the slot; foreign/premium/already deleted → uniform `404 user not found` | `subscription/` (API/`tools/e2e`) |
| `PUT /admin/api/subscriptions/{owner_uuid}/selfhosted-limits` | admin (bearer token) sets `{"server_limit":N,"user_limit":M}`; lowering deletes nothing, the account just can't grow past the cap | admin CLI/panel |
| `POST /subscription/trial` | create trial subscription | `subscription/` |
| `GET /sub?id=...&proto=...&format=...` | connection link/QR content per protocol | `subscription/`, `app/` |
| `GET /short` | short link helper | `subscription/` |
| `GET s.frkn.org/{code}` | resolve short code → `{subscription_id, subscription_url}` (JSON with `Accept: application/json`, CORS open for frkn.org) | `sub/` |
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
| `subscription/` | `GET /subscription/{id}`, `GET /sub`, `GET /referrals`, `POST /validate/email`, `POST /account`, `POST /private/account`, `POST /private/install-token`, `GET /private/state`, `POST /promocode/validate`, `POST /payment/platega/subscription/create`, `GET /info/connections/*`, `POST /devices`, `PATCH /devices/{connectionId}` |
| `app/` | `GET /subscription/{id}`, `GET /sub`, `POST /account`, `POST /key/activate`, `GET /referrals`, `POST /payment/platega/subscription/create`, `POST /devices`, `PATCH /devices/{connectionId}` |
| `transaction/` | `GET /payment/check/{txid}` |
| `b/` posts | `GET /blog/reactions`, `POST /blog/reaction` |
| `metrics/` | `WS /ws/metrics` |
| `install` (bash) | `POST /auth` |