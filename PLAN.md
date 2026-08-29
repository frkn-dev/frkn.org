# PLAN — кнопка «Скачать архив всех конфигов» в визарде /subscription

Задача: на странице `/subscription/?id=<uuid>` в визарде выбора приложений
(финальный шаг «Готово — ссылка для выбранной конфигурации») добавить кнопку
«Скачать все (.zip)», отдающую архив `.conf` для всех серверов выбранного
региона. Первый протокол — AmneziaWG; механизм расширяется на остальные.

## Статусы
[user] проверил | [x] сделано | [ ] не начато | [~] в работе

## Шаги (процесс)

- [x] Исследовать страницу/модалку и зафиксировать в PLAN.md (текст ниже)
- [x] Реализация кнопки + zip для AWG (JSZip через jsDelivr) — ru + en
- [x] Обновить `docs/domains/subscription-app.md` (кнопка опосимова)
- [ ] Мок локалки (`tools/mock-api/`), чтобы без api.frkn.org прогонять визард
- [ ] e2e-тест (`tools/e2e/awg-zip-test.mjs`): клик на кнопку → zip валид
- [ ] RUNBOOK: раздел «Quality checks» дописан — запуск мока + e2e + скриншоты
- [~] Проверка после изменений (chrome headless скриншоты, `verify` skill)
- [ ] Git: [x]→[x] по коммитам; при слове «мержим» — пр-мерж с `--no-ff` (отдельно)

Текущий прогресс: исследование, ru/en-реализация и док-заметка закумчены коммитами
`94a8719…0bc04ed`. Дальше — мок + e2e + RUNBOOK-дописка, потом можно мержить.

## 1. Where things live (research)

### Страница
- `subscription/index.html` (~6551 строк) — single-file SPA (HTML+CSS+JS inline).
- Зеркало на англ.: `en/subscription/index.html`.
- FA-варианта нет. Каталог клиентов: `subscription/vpn-clients.json` (ru+en).
- Доки: `docs/domains/subscription-app.md`, `docs/domains/api-integration.md`.

### Кнопка входа и модалка
- Кнопка «Больше настроек и приложений» — `id="openDeviceModal"` (~3315),
  модалка `#device-modal` (`renew-modal`, 720px).
- Открытие/закрытие — JS ~6144 (`openDeviceModalFn/closeDeviceModalFn`, клик по
  оверлею/Esc).

### Визард (внутри модалки)
Четыре `step-card` (~3565–3606):
1. `protocol-step` — карточки из `AVAILABLE_PROTOCOLS` (~3793), `renderProtocolStep()` (~5588).
2. `os-step` — pills ОС, `renderOsStep()` (~5339).
3. `client-step` — pills клиентов, `renderClientStep()` (~5364); для
   `wireguard|awg|mtproto` — инструкция «Как подключиться» без кнопок.
4. `connection-step` — «Готово — ссылка для выбранной конфигурации»,
   `renderConnectionStep()` (~5444).

Состояние: `selectedProtocol`, `selectedOs`, `selectedClientId`,
`currentConnectionContext` (`{id, env, hasXray, has_wg, has_awg, has_h2, has_mtproto}`).

### AWG-ветка (куда встроена кнопка)
- `renderConnectionStep()` при `selectedProtocol === 'awg'` → `<div id="awg-content">`,
  `renderAwg(id, env, has_awg)` (~5484).
- `renderAwg()` (~5880): GET `${API_BASE}/info/connections/amneziawg?id=&env=` →
  `{nodes: [{config, label}]}`; список с Copy/Download/QR per node.
- `prepareNodeLabels()` (~5857) — очистка+дедупл имена. `downloadWG()` (~5952) — Blob + `<a>`.

### Внешние зависимости
- `qrcode` из jsDelivr — единственная внешняя либа до нас.
- Зип — через JSZip, `https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js`,
  добавлен `<script>` в head обеих локалей.

## 2. Решение (согласовано)

- Генерация zip на клиенте через JSZip (jsDelivr). Бэк не трогаем.
- Кнопка `«⬇ Скачать все (N конф., .zip)»` в `renderAwg()` над списком нод.
- `downloadZip([{name, content}], zipName)` — `JSZip.generateAsync({type:'blob',
  compression:'DEFLATE'})` + `<a download>`. Фолбэк при блоке CDN — тост.
- Имена файлов: `${sanitizeZipEntryName(labels[i])}.conf` (через
  `prepareNodeLabels`); имя архива `frkn-awg-<env>.zip`.
- Охват: пока только AmneziaWG;_wireguard — симметрично при надобности.
- Если позже появится бэк-эндпоинт — кнопка переключается на сервер-URL без UI-прайва.

## 3. Файлы для изменения

- [x] `subscription/index.html` — JSZip script + `sanitizeZipEntryName` +
  `downloadZip` + кнопка в `renderAwg`.
- [x] `en/subscription/index.html` — зеркало.
- [x] `docs/domains/subscription-app.md` — док-заметка.
- [ ] `tools/mock-api/serve.js` — express-мок api.frkn.org на 3000, только
  нужные эндпоинты.
- [ ] `tools/e2e/awg-zip-test.mjs` — Node-чек (node-html? headless — см. подход ниже).
- [ ] `docs/RUNBOOK.md` — раздел про мок/e2e.

## 4. Критерий приёмки

- [x] В визарде (protocol=AmneziaWG, любой env) на шаге «Готово…» есть кнопка
  «Скачать все (N конф., .zip)»; клик собирает zip в браузере и скачивает.
- [x] Существуючие Copy/Download/QR per node — не тронуты.
- [ ] e2e-прогон с мок-api: клик → валидный zip (проверка CRC, имена из мока).
- [ ] Ru/en страницы идентичны по поведению; docs синхронизированы.
- [ ] После изменений следлован чек-ап скриншотами (`verify` skill), затем
  по слову «мержим» — MERGE `--no-ff`, отдельно.
