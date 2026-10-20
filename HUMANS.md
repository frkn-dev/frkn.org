# HUMANS.md

## Current
- **Repo:** frkn.org
- **Branch:** `feature/premium-copy`
- **Task:** DEVICES-ENV — устройства в ЛК без выбора сервера (env-wide)
- **Status:** решение согласовано, правки не начаты
- **Updated:** 2026-10-20

## Done
- 2026-10-20 — ffcore: мерджи `catalog-pool-version` + `healthcheck-version` в `main` (локально); релиз v0.6.57 (clash hysteria2) собран на us.frkn.org, api задеплоен.
- 2026-10-20 — `d4a20e8` EN traffic tab/lite purchases.
- 2026-10-20 — `3b7fcde` 'Стандарт' naming, bundles; `1eec354` premium plans; `5ccd4ae` one row of plans/products.

## Next
- [ ] DEVICES-ENV: убрать «Сервер» из формы устройства, `node_id` не отправлять.
- [ ] DEVICES-ENV: mrkting — env-wide создание, `include_in_main` для personal без `node_id`.
- [ ] DEVICES-ENV: не-персональные custom env (premium / реселлер) — scope, имя региона, лимиты.
- [ ] запушить ffcore `main` (3 мерджа без релиза).

## Blockers / Notes
- ffcore `main` впереди origin на 3 коммита; релиз 0.6.58 — после правок DEVICES-ENV.
- Пин на ноду (`node_id`) оставляем в API, но убираем из UI: он ломает фейловер пула.
- Секреты не коммитить.

## Related
- `AGENTS.md`
- `PLAN.md`
- `ffcore/HUMANS.md`, `frkn-services/HUMANS.md` (Task DEVICES-ENV)
