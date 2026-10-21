# REPORT: «поделиться всем env» (шар региона)

Дата: 2026-10-21. Задача: DEVICES-ENV / shared sub.
Статус: **код готов, локально собрано и протестировано; ничего не закоммичено и не выкачено.**

## 1. Что хотели

- В ЛК пользователь выбирает **регион (env) + протокол** и получает ссылку, которая открывает **все серверы этого региона**, а не один.
- Формат ссылки — подписка: `frkn://sub/shared/<UUID>` (не `frkn://conn/<token>`).
- В приложении (dopamine) «поделиться конкретным сервером» остаётся как было.
- Получатель шары должен видеть весь env: список серверов, у каждого свой конфиг.

## 2. Что решили по механике

| Сущность | Как устроено |
|---|---|
| Токен | `share_tokens.kind = 'sub'` (старые — `'conn'`), `node_id = NULL`, `source_connection_id = NULL`, сам токен — UUID (32 hex в БД, в ссылке с дефисами) |
| Child-коннекшен | создаётся при минте, `issued_via = 'shared_sub'`, env+proto берутся из запроса, метки нет (получатель видит чистые имена серверов/пулов) |
| Идемпотентность | одна живая шара на `(subscription_id, "env · proto")`; повторный минт возвращает ту же ссылку |
| Фильтр доступа | шарить можно только env, который реально есть у подписки (иначе 404) |
| Приложение | тот же импорт подписки, но `auth_data = {share_token}`: `/v1/services` → все серверы региона, `/v1/config` → конфиг каждого |
| Сторонние клиенты | `https://…/sub/<uuid>` — фид на все онлайн-ноды env для этого протокола |
| Отзыв | одним DELETE, как и для `conn`-токенов: гасит токен и child-коннекшен |

Ключевое отличие от app-шары: `conn`-токен = один сервер (пин на ноду или «все серверы региона» для `/sub`), `sub`-токен = подписка на регион, у получателя N карточек.

## 3. Что сделали

### ffcore 0.6.62 (api)

Ветка: `main` локально (коммит `b548f15` + несохранённые доводки).

- `src/bin/api/postgres/share.rs` — `kind`, nullable `source_connection_id`, индекс `share_tokens_active_sub (subscription_id, label) WHERE revoked_at IS NULL AND kind='sub'`, `find_active_sub()`.
- `src/bin/api/http/handlers/share.rs` — `POST /share/sub` (`mgmt_share_sub_mint_handler`), `mint_share_inner(kind)`, тип токена (UUID для `sub`), `display_token()`, приём UUID в `normalize_share_token` (32 hex, с дефисами и без), `/v1/config` уважает payload `node_id` для `sub`-токена в рамках env.
- `src/bin/api/http/handlers/amnezia.rs` — `/v1/services` больше не отдаёт 403 для `sub`-токена: собирает сервисы из child-коннекшена (env+proto), по карточке на ноду/пул.
- `src/bin/api/http/handlers/subscription.rs` + `src/http/response.rs` — в `GET /subscription/{id}` добавлен `shared_subs[]` (`share_token`, `share_url`, `share_feed_url`, `env`, `proto`, `created_at`).
- `src/bin/api/http/routes.rs` — маршрут `POST /share/sub`.
- Тесты: 99 lib + 96 api зелёные (добавлены на UUID-токены и маппинг имён протоколов).

### mrkting 0.2.39

Ветка: `feature/devices-main-feed` (не закоммичено).

- `services/mrkting/src/http/request.rs` — `SharedSubRequest { subscription_id, env, proto }`.
- `services/mrkting/src/api_client.rs` — `create_shared_sub()` → fcore `POST /share/sub`.
- `services/mrkting/src/http/handlers.rs` — `post_devices_share_sub_handler` (rate-limit, 404 на чужую/неизвестную подписку, проброс trace-id).
- `services/mrkting/src/http/routes.rs` — `POST /devices/share/sub`.

### Сайт (frkn.org)

Ветка: `feature/premium-copy` (не закоммичено).

- `subscription/index.html`, `en/subscription/index.html`:
  - новый блок **«Поделиться доступом»** в модалке устройств: селекты «Регион» и «Протокол» (из `/devices/options` + scope приватного env), кнопка «Создать ссылку», ниже — список живых шар с «Копировать / QR / Отозвать» и https-фидом;
  - из карточки устройства убран выбор сервера: ссылка устройства всегда на весь регион устройства;
  - блок скрывается, если `/devices/options` недоступен (устройства выключены).
- `docs/domains/api-integration.md` — дописаны `GET /devices/options`, `GET /devices/nodes`, `POST /devices/share`, `POST /devices/share/sub`, `DELETE /devices/share/{token}`.

### Приложение (dopamine)

Ветка: `dev` (не закоммичено).

- `client/ui/controllers/importController.{h,cpp}` — распознавание `frkn://sub/shared/<uuid>` **до** `frkn://sub/`, новый сигнал `frknSharedSubLinkDetected`.
- `client/core/controllers/coreController.cpp` — тот же импорт подписки, но с флагом `shared`.
- `client/ui/controllers/api/apiConfigsController.{h,cpp}` — `fetchSubscriptionConfigs(id, shared)`; при `shared` `auth_data = {share_token}`, кэш `config_rev` для шар-подписок отключён (всегда свежие конфиги).
- macOS-сборка (`deploy/build_macos_local.sh`) проходит.

## 4. Как проверять

### Предусловия

1. Выкатить api и mrkting (после мержа):
   - `FNODE_VERSION=v0.6.62 /opt/update/api.sh`
   - `FNODE_VERSION=v0.2.39 /opt/update/mrkting.sh`
   Миграция `share_tokens` применяется на старте api (`ensure_table`): `kind`, nullable `source_connection_id`, новый индекс.
2. Бета сайта: `./deploy-beta.sh` (или точечно `subscription/`, `en/subscription/`).

### Сценарий A — шара региона из ЛК

1. Открыть `subscription/` с реальной подпиской (например `c63663b9-…`, plan standard, env `dev`, 7 онлайн-нод AWG Mobile).
2. Модалка «Устройства» → блок «Поделиться доступом» → Регион `dev`(Global) → Протокол `AmneziaWgMobile` → «Создать ссылку».
3. Ожидаем: появилась `frkn://sub/shared/<uuid>` + `https://…/sub/<uuid>`. Повторное нажатие возвращает ту же ссылку (идемпотентность).

Что смотреть в БД:

```sql
select token, kind, node_id, source_connection_id, label, revoked_at
from share_tokens where kind = 'sub' order by created_at desc limit 5;

select id, env, proto, label, issued_via
from connections where issued_via = 'shared_sub' order by created_at desc limit 5;
```

### Сценарий B — получатель в приложении

1. Собрать macOS/iOS сборку dopamine из `dev`.
2. Импорт ссылки `frkn://sub/shared/<uuid>` (QR/вставка).
3. Ожидаем: импортируется **несколько карточек** — по одной на ноду/пул региона, каждой соответствует свой конфиг (`/v1/config` с `node_id`).
4. Проверить подключение хотя бы к двум разным карточкам.

Ручной эквивалент через API (если есть чем отправить `keyPayload`):

```
POST /v1/services  {"auth_data":{"share_token":"<uuid>"}}      → connections[] с connection_uuid + node_id
POST /v1/config    {"auth_data":{"share_token":"<uuid>"}, "connection_id":"<child>", "node_id":"<node>", …}
```

### Сценарий C — сторонние клиенты

`https://frkn.org/sub/<uuid>` открыть/вставить в Streisand/INCY: должно быть несколько серверов региона, а не один.

### Сценарий D — отзыв и негативные кейсы

1. «Отозвать» в блоке → ссылка пропадает, `/sub/<uuid>` отдаёт 404, приложение по ней не обновляется.
2. Чужой/несуществующий `subscription_id` → 404 (без оракула).
3. Подписка без такого env (например шарить `ru` у аккаунта только с `dev`) → 404 `subscription_not_found`.
4. Приватный env (personal/реселлер): шара работает только на env, который есть у аккаунта; чужой `personal<uuid>` пошарить нельзя.
5. `conn`-шара из приложения (конкретный сервер) должна вести себя как раньше — один сервер, без регрессий.

## 5. Где смотреть код

| Что | Где |
|---|---|
| Минт региона-шары (ffcore) | `ffcore/src/bin/api/http/handlers/share.rs` → `mgmt_share_sub_mint_handler`, `mint_share_inner`, `shared_sub_tag` |
| Схема токенов | `ffcore/src/bin/api/postgres/share.rs` |
| `/v1/services` для шар-токена | `ffcore/src/bin/api/http/handlers/amnezia.rs` → `gateway_services_handler` (блок `share_row`) |
| `/v1/config` + `node_id` | `ffcore/src/bin/api/http/handlers/share.rs` → `gateway_share_config_handler` |
| `shared_subs[]` в подписке | `ffcore/src/bin/api/http/handlers/subscription.rs`, `ffcore/src/http/response.rs` |
| Прокся в mrkting | `frkn-services/services/mrkting/src/http/handlers.rs` → `post_devices_share_sub_handler` |
| UI в ЛК | `frkn.org/subscription/index.html` (`sharedSubsSection`, `fillSharedSubSelects`, `renderSharedSubs`, `createSharedSub`), зеркало в `en/subscription/index.html` |
| Импорт в приложении | `dopamine/client/ui/controllers/importController.cpp`, `client/core/controllers/coreController.cpp`, `client/ui/controllers/api/apiConfigsController.cpp` (`fetchSubscriptionFeed`, `shared`-ветка) |

## 6. Ограничения / что осталось

- Мини-апп `frkn.org/app/index.html` пока умеет делиться только устройством (регион-шару туда не добавляли).
- Метрики/графики нод в ЛК живут в памяти api — рестарт обнуляет историю (не относится к этой задаче, но видно при проверке).
- Статистика трафика в `/v1/services` отдаёт `end_date` владельца подписки — получатель видит срок владельца; отдельного лимита на шару нет (по замыслу: расход трафика — на владельце).
- Для `sub`-токена не открывали `/v1/account_info` (403, как для `conn`): обновление серверов в приложении идёт через `/v1/config` по каждому серверу.
- Версии в `main` ffcore пока не тегированы; релиз/деплой — после «мержим».

## 7. Проверка (2026-10-21, второй прогон)

Проверял не по отчёту, а по коду и тестам. Нашлось два дефекта, оба исправлены.

1. **Приложение не импортировало ссылку вообще** — `client/ui/controllers/importController.cpp:184` брал `urlCandidate.mid(19)` при длине префикса `frkn://sub/shared/` = 18 → терялся первый символ UUID, регулярка не матчила, юзер получал `ImportInvalidConfigError`. Фикс: `mid(18)`. Проверено отдельным Qt-бинарём на том же коде (dashed и compact формы): mid(19) → match=false, mid(18) → match=true.
2. **Шара на personal/selfhosted env могла не минтиться** — проверка владения требовала живой коннекшен в env. Для selfhosted env принадлежит подписке по построению (`scope_env == Env::personal_for(sub_id)`), поэтому добавил: `owns_env = scope_env == env || есть живой коннекшен в env`. Общие env (dev/prod/…) по-прежнему требуют коннекшен как доказательство.

Что подтверждено:
- ffcore: `cargo test --lib` → 99 passed, `cargo test --bin api` → 96 passed.
- `/v1/services` для `sub`-токена отдаёт карточки по нодам с `node_id`; для `conn`-токена остаётся 403 (регрессии нет).
- `/v1/config` для `sub`-токена принимает `node_id` только из env токена и только Online+с этим inbound; иначе 404, подмены ноды нет.
- Отзыв: fcore сверяет `row.subscription_id` с запросом, гасит токен и чайлд-коннекшен.
- ЛК: `node --check` по инлайн-JS страницы `subscription/` — синтаксис ок; селекты ограничены env'ами пользователя (`currentLocations ∩ deviceOptions` + scope env).
- mrkting шлёт `{subscription_id, env, proto}` — совпадает с текущим (незакоммиченным) `MgmtSharedSubRequest`. Коммит `b548f15` в одиночку несовместим (там ещё обязательный `label`) — коммитить только вместе с рабочей копией.

Осталось / на заметку:
- Для WG-семейства `GET /sub/<uuid>` отдаёт INI одной ноды — «весь регион» у сторонних клиентов работает только для Xray-протоколов. В приложении ограничения нет (там N карточек через `/v1/services`).
- Шар-карточки не обновляются фоновым reload'ом подписки (исключены как `share_token`), конфиг тянется при подключении.
- Политика: child-подписка selfhosted-аккаунта (`is_selfhosted_user`) тоже проходит проверку владения через «есть коннекшен в env» — то есть формально может расшарить весь env родителя. Если так нельзя, нужен отдельный запрет.
- Собраны подписанный+нотаризованный `dopamine/.../pkg/Dopamine-local-4.8.14.70.pkg` (фикс демона + `mid(18)`), не установлен.
