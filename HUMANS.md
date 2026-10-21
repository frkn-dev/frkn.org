# HUMANS.md

## Current
- **Repo:** frkn.org
- **Branch:** `feature/premium-copy`
- **Task:** шар региона в ЛК (`frkn://sub/shared/<uuid>`)
- **Status:** ЛК RU/EN переделан (регион + протокол вместо выбора сервера), бэкенд ffcore 0.6.62 / mrkting 0.2.39 — локально, не выкачено
- **Updated:** 2026-10-21

## Done
- 2026-10-21 — ЛК: блок «Поделиться доступом» (регион + протокол → `frkn://sub/shared/<uuid>` + https-фид, список живых ссылок с копированием/QR/отзывом) в `subscription/` и `en/subscription/`; из карточки устройства убран выбор сервера (ссылка всегда на весь регион).
- 2026-10-21 — проверка фичи вторым прогоном (см. `docs/REPORT-shared-region.md` §7): найден и исправлен блокер в приложении (`mid(19)`→`mid(18)` — импорт не работал вообще), в ffcore послаблена проверка владения для personal/selfhosted env (`scope_env`). Тесты ffcore 99+96 зелёные, `node --check` по JS страницы ок, PKG dopamine собран.
- 2026-10-21 — AGENTS.md переписан: деплой-гейты (прод/бета/точечный rsync), i18n-паритет ru/en/fa, cache-busting, грабли rsync --delete, соседние репы; не закоммичено.
- 2026-10-21 — bs-prem выключен в витрине: `bs-prem`, `standard-bs-prem`, `full` → `disabled: true` в `scripts/plans.js` (фильтр в `selectableProducts`), «Белые Слоны» убраны со страницы Dopamine (RU/EN), `plans.js?v=7`; бета задеплоена, проверено (`beta.frkn.org/scripts/plans.js` → 3 × `disabled`, страницы Dopamine без упоминаний).
- 2026-10-21 — `19483a7` карточка «Серверы» в ЛК (RU/EN): живые CPU/RAM/диск/сеть, трафик, коннекты + модалка с графиком за 24ч; мок-апи с фикстурами.
- 2026-10-21 — карточка монтируется для всех планов (не только selfhosted), скрывается сама при 0 нод; на бете проверена на реальном personal-аккаунте.
- 2026-10-21 — ffcore 0.6.59: `/private/nodes/stats`, `/private/nodes/{uuid}/series`, имена `Устройство (нода)` / `Устройство (пул)`; тег + GitHub Release, api на проде (`Ok (v0.6.59)`).
- 2026-10-21 — почищены смердженные и старые ветки в ffcore и frkn-services.
- 2026-10-20 — ffcore: мерджи `catalog-pool-version` + `healthcheck-version` в `main` (локально); релиз v0.6.57 (clash hysteria2) собран на us.frkn.org, api задеплоен.
- 2026-10-20 — `d4a20e8` EN traffic tab/lite purchases.
- 2026-10-20 — `3b7fcde` 'Стандарт' naming, bundles; `1eec354` premium plans; `5ccd4ae` one row of plans/products.

## Next
- [ ] закоммитить скрытие bs-prem и смержить `feature/premium-copy` в `main`, выкатить прод-сайт (витрина `/pay` + карточка «Серверы»).
- [ ] ffcore: env-wide share-токен (сделано в v0.6.60) — дожать клиентскую часть.
- [ ] dopamine: импорт `frkn://conn/<token>` через `/sub/<token>`, чтобы получатель видел все серверы, а не один.

## Blockers / Notes
- Метрики нод в ffcore живут в памяти: после рестарта api график за 24ч начинается с нуля (наполняется заново).
- Прод-сайт не деплоен, пока не готова витрина `/pay`; бета катится `./deploy-beta.sh`.
- Пин на ноду (`node_id`) оставляем в API, но убираем из UI: он ломает фейловер пула.
- Секреты не коммитить.

## Related
- `AGENTS.md`
- `PLAN.md`
- `ffcore/HUMANS.md`, `frkn-services/HUMANS.md` (Task DEVICES-ENV)
