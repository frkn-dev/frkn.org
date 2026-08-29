# PLAN — кнопка «Скачать архив всех конфигов» для AmneziaWG в визарде

Задача: в `/subscription/?id=<uuid>` добавить кнопку скачивания архива (zip) конфигов
для **всех доступных серверов** в финальном шаге визарда («Готово — ссылка для
выбранной конфигурации»), когда выбран протокол AmneziaWG.

## 1. Where things live (research)

### Страница

- `subscription/index.html` (~6551 строк) — single-file SPA (HTML+CSS+JS inline).
- Зеркало на англ.: `en/subscription/index.html` (та же структура, синхронизация обязательна).
- FA-варианта нет.
- Каталог клиентов: `subscription/vpn-clients.json` (ru) + `en/subscription/vpn-clients.json`.
- Доки: `docs/domains/subscription-app.md`, `docs/domains/api-integration.md`.

### Кнопка входа и модалка

- Кнопка «Больше настроек и приложений» — `id="openDeviceModal"`, ~строка 3315.
- Модалка `id="device-modal"` (классы `renew-modal`) — ~строка 3549, ширина `max-width: 720px`.
- Открытие/закрытие — JS ~строка 6144 (`openDeviceModalFn` / `closeDeviceModalFn`, клик по
  оверлею и Esc). Стили модалок: `.renew-modal` (~строка 263).

### Визард (внутри модалки)

Четыре `step-card` (~строки 3565–3606):

1. `protocol-step` — карточки из `AVAILABLE_PROTOCOLS` (~строка 3793), генерит
   `renderProtocolStep()` (~5588). Для awg можно ещё переместить флаг `recommended`.
2. `os-step` — pill-кнопки ОС, `renderOsStep()` (~5339).
3. `client-step` — pill-кнопки клиентов из `vpn-clients.json`, `renderClientStep()` (~5364).
   Для протоколов `wireguard`/`awg`/`mtproto` клиент не нужен — вместо кнопок показывается
   инструкция «Как подключиться» (~строка 5384).
4. `connection-step` — финальный экран, заголовок «Готово — ссылка для выбранной
   конфигурации», рендерит `renderConnectionStep()` (~5444).

Состояние визарда: `selectedProtocol`, `selectedOs`, `selectedClientId`,
`currentConnectionContext` (`{ id, env, hasXray, has_wg, has_awg, has_h2, has_mtproto }`).

### AWG-ветка (куда встраивается кнопка)

- `renderConnectionStep()` при `selectedProtocol === 'awg'` вставляет
  `<div id="awg-content">` и вызывает `renderAwg(id, env, has_awg)` (~строка 5484).
- `renderAwg()` (~строка 5880):
  - запрос `GET {API_BASE}/info/connections/amneziawg?id=<id>&env=<env>`;
  - ответ: `{ nodes: [{ config, label, ... }] }`;
  - рендерит список: Copy / Download (по одному `.conf`) / QR toggle.
  - `prepareNodeLabels()` (~5857) очищает/дедуплицирует имена нод.
- Скачивание файла: `downloadWG(content, name)` (~5952) и его дубль
  `downloadAWG` (~5964) — Blob + `<a download>`.
- Регион (env) берётся из `picker-env-switcher` внутри модалки (`setEnv()`, ~4468) —
  список в `currentLocations` из `GET /subscription/{id}`. Поэтому «все серверы» =
  все нод**ы** текущего env.
- Та жеAWG-ветка работает и на самой странице: кнопки `.quick-protocol` (5676) просто
  проставляют `selectedProtocol` и вызывают те же render-функции.

### Запасной источник правды по формату

- Модалка «Именованные устройства» (`user-devices-modal`) грузит конфиги устройства через
  `loadDeviceConfigs()` (~4882): WG-family (Wireguard/AmneziaWg/AmneziaWgMobile) — тот же
  `/info/connections/*` с `&conn=`, ответ парсится как INI-блоки/строки `scheme://`.
  Там есть `parseDeviceConfigs()` (~4847) и `sanitizeDeviceFileName()` (~4874) — можно
  переиспользовать подход к именованию.

### Внешние зависимости

- Единственная внешняя JS-либа сейчас — `qrcode` с jsDelivr (см. `<script>` в head).
- Zip-либы в проекте нет (jszip/fflate не найдены). Для архива понадобится JSZip через CDN
  либо собственный минимальный zip-генератор (store-only, без сжатия — ~100 строк).

## 2. Решение (согласовано)

Бэк не трогаем — генерим zip **на клиенте** через JSZip (jsDelivr `jszip@3.10.1`, как
qrcode). Схема эндпоинта бэка отменяется, но осталась как вариант для будущего.

Разделение работ:
1. **Фронт (этот репо)**: кнопка «Скачать все (.zip)» в шаге «Готово — ссылка для
   выбранной конфигурации», ветка `awg`. Сборка — JSZip, скачивание — Blob +
   `<a download>` (как `downloadWG`).

### Фронт-детали

- Точка встраивания — `renderAwg()`: после успешного fetch нод, над `.proxy-list`,
  рендерим кнопку (`id="awg-download-all"`).
- `downloadZip([{name, content}], zipName)` — создаёт JSZip, `generateAsync({type:"blob",
  compression:"DEFLATE"})`, затем скачать. Фолбэк, если скрипт не загрузился — тост.
- Имена файлов: `${sanitizeZipEntryName(labels[i])}.conf` (дедупликация через
  `prepareNodeLabels`); имя архива — `frkn-awg-<env>.zip`.
- Охват: **пока только AmneziaWG**; wireguard — симметрично при надобности.
- Если бэк позже отдаст эндпоинт — кнопка можно переключить на сервер-URL без
  изменения UI.

## 3. Файлы для изменения

- `subscription/index.html` — кнопка в `renderAwg()` + `downloadZip` + `<script>` JSZip.
- `en/subscription/index.html` — зеркало.
- `docs/domains/subscription-app.md` — приписка о кнопке. Приписка эндпоинта в
  api-integration — оставлена на случай будущего бэка.

## 4. Критерий приёмки

- Фронт: в визарде (protocol=AmneziaWG, любой env) на шаге «Готово…» есть кнопка
  «Скачать все (.zip)»; клик собирает zip в браузере и скачивает. Если jsDelivr
  заблокирован — тост об ошибке, остальные контролы рабочие.
- Существующие Copy/Download/QR на отдельных нодах не сломаны.
- Ru и en страницы идентичны по поведению; док синхронизирован.
