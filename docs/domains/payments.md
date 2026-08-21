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
- After successful key purchase, `transaction/` auto-redirects to `/activate?code=<key>`.
