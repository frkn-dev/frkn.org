# HUMANS.md

## Current
- **Repo:** frkn.org
- **Branch:** `feature/premium-copy`
- **Task:** DEVICES-ENV — устройства env-wide + статистика своих серверов в ЛК
- **Status:** карточка «Серверы» на бете, api 0.6.59 на проде; прод-сайт ждёт витрину `/pay`
- **Updated:** 2026-10-21

## Done
- 2026-10-21 — `19483a7` карточка «Серверы» в ЛК (RU/EN): живые CPU/RAM/диск/сеть, трафик, коннекты + модалка с графиком за 24ч; мок-апи с фикстурами.
- 2026-10-21 — карточка монтируется для всех планов (не только selfhosted), скрывается сама при 0 нод; на бете проверена на реальном personal-аккаунте.
- 2026-10-21 — ffcore 0.6.59: `/private/nodes/stats`, `/private/nodes/{uuid}/series`, имена `Устройство (нода)` / `Устройство (пул)`; тег + GitHub Release, api на проде (`Ok (v0.6.59)`).
- 2026-10-21 — почищены смердженные и старые ветки в ffcore и frkn-services.
- 2026-10-20 — ffcore: мерджи `catalog-pool-version` + `healthcheck-version` в `main` (локально); релиз v0.6.57 (clash hysteria2) собран на us.frkn.org, api задеплоен.
- 2026-10-20 — `d4a20e8` EN traffic tab/lite purchases.
- 2026-10-20 — `3b7fcde` 'Стандарт' naming, bundles; `1eec354` premium plans; `5ccd4ae` one row of plans/products.

## Next
- [ ] смержить `feature/premium-copy` в `main` и выкатить прод-сайт (витрина `/pay` + карточка «Серверы»).
- [ ] ffcore: env-wide share-токен (`share_tokens.node_id` nullable, `/sub/<token>` отдаёт все ноды env).
- [ ] dopamine: импорт `frkn://conn/<token>` через `/sub/<token>`, чтобы получатель видел все серверы, а не один.
- [ ] dashboard: форма лимитов серверов/юзеров для реселлера (`PUT /admin/api/subscriptions/{uuid}/selfhosted-limits` уже есть).

## Blockers / Notes
- Метрики нод в ffcore живут в памяти: после рестарта api график за 24ч начинается с нуля (наполняется заново).
- Прод-сайт не деплоен, пока не готова витрина `/pay`; бета катится `./deploy-beta.sh`.
- Пин на ноду (`node_id`) оставляем в API, но убираем из UI: он ломает фейловер пула.
- Секреты не коммитить.

## Related
- `AGENTS.md`
- `PLAN.md`
- `ffcore/HUMANS.md`, `frkn-services/HUMANS.md` (Task DEVICES-ENV)
