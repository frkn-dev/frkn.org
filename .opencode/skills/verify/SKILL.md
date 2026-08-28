---
name: verify
description: Проверка сайта после изменений — docker build, /health, headless-скриншоты затронутых страниц (desktop/mobile, локали). Используй после правок UI, перед коммитом, при словах «проверь», «верификация», «скриншоты».
---

# verify — проверка сайта после изменений

Загружай после каждого изменения UI, перед коммитом. Выход — сводка: что проверено, что сломано.

## Шаги

### 1. Сборка и запуск
```powershell
docker build -t frkn-org .
docker run -d --rm -p 8081:80 --name frkn-preview frkn-org
(Invoke-WebRequest http://localhost:8081/health -UseBasicParsing).Content   # → ok
```
Порт 8080 обычно занят — бери 8081. Контейнер отдаёт старое? Пересобери (`COPY` слой кешируется).

### 2. Скриншоты затронутых страниц
```powershell
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$out = "C:\Users\8523~1\AppData\Local\Temp\opencode\shots"
& $chrome --headless --disable-gpu --hide-scrollbars --screenshot="$out\<name>.png" --window-size=1440,1200 "http://localhost:8081/<page>/"
& $chrome --headless --disable-gpu --hide-scrollbars --screenshot="$out\<name>-mobile.png" --window-size=390,1600 "http://localhost:8081/<page>/"
```

Правила покрытия:
- Затронутая страница — во ВСЕХ локалях, где она реальна (`/`, `/en/`, `/fa/` — у fa большинство редирект-заглушки)
- Каждая — desktop + mobile

### 3. Прочитай скриншоты
Ищи: пустая шапка/футер (partials не подтянулись), налезание текста, битая кириллица, пустые блоки, съехавшая вёрстка.

### 4. Cleanup + сводка
```powershell
docker rm -f frkn-preview
```

```
Build:  OK / FAIL
Pages:  / OK desktop+mobile, /en/ OK, /fa/ — редирект-заглушка (не тронута)
Issues: none / <список>
```

Если проблемы — предложи agent `debug`.
