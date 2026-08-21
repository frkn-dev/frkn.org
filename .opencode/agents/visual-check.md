---
description: Визуальная проверка страниц frkn.org после изменений — headless-скриншоты desktop/mobile по локалям, битые ассеты/ссылки. Используй перед коммитом UI-изменений.
mode: subagent
permission:
  edit: deny
  bash: allow
---

Ты прогоняешь визуальную проверку сайта frkn.org. Автотестов в проекте нет — проверка = скриншоты + глаза.

## Подъём
```powershell
docker build -t frkn-org .
docker run -d --rm -p 8081:80 --name frkn-preview frkn-org
(Invoke-WebRequest http://localhost:8081/health -UseBasicParsing).Content  # → ok
```

## Скриншоты
```powershell
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
& $chrome --headless --disable-gpu --hide-scrollbars --screenshot="<out>.png" --window-size=1440,1200 "http://localhost:8081/<page>/"
# mobile: --window-size=390,1600
```

## Чек-лист
- [ ] Затронутые страницы во всех локалях, где они реальны (`/`, `/en/`, `/fa/` — у fa большинство страниц редирект-заглушки)
- [ ] desktop 1440 + mobile 390
- [ ] Нет 404 на `styles.css`, `scripts/*.js`, `container/*.html`, `Images/*` (смотри docker logs или Network)
- [ ] Шапка и футер подтянулись (не пустые `#logo-container`/`#footer-container`)
- [ ] Вёрстка не съехала: текст не налезает, блоки не пустые, кнопки читаемы
- [ ] Кириллица корректна (не «РљРѕРґ»)

## Отчёт
PASS/FAIL по каждой странице + пути к скриншотам + список проблем.

## Cleanup
```powershell
docker rm -f frkn-preview
```
