---
name: generate-arch-scheme
description: >-
  Use when generating or updating an architecture diagram for frkn.org.
  Reads /docs + code, produces a single-file HTML+SVG+CSS diagram (site dark theme, accent #38BDF8).
  Supports partial mode — standalone diagram for a single topic.
---

# Generate Arch Scheme

Генерирует (или обновляет) SVG+HTML+CSS диаграмму архитектуры frkn.org.
Один файл: HTML + inline SVG + inline CSS. Без зависимостей, открывается в браузере.

---

## Режимы

### Full (по умолчанию)
- **Триггер:** «обнови схему», «перегенери arch-scheme»
- **Результат:** `docs/arch-scheme.html` — полная диаграмма (сайт, nginx, окружения, API, платежи)
- **Метод:** субагенты по частям + .NET merge (файл большой)

### Partial (указана тема)
- **Триггер:** «arch-scheme про платежи», «покажи flow подписки»
- **Результат:** `docs/<topic>.html` — standalone диаграмма одной секции
- **Метод:** единый Write tool

### Карта тем (keyword → секция)

| Ключевые слова | Секция | Файл вывода |
|---|---|---|
| `architecture`, `overview`, `архитектура` | Статика → Nginx → окружения | `docs/architecture.html` |
| `payment`, `платёж`, `platega` | pay/donate → Platega → transaction polling | `docs/payment-flow.html` |
| `subscription`, `подписка`, `кабинет` | subscription/app/profile → api.frkn.org | `docs/subscription-flow.html` |
| `i18n`, `локализация` | ru/en/fa деревья + i18n.js + partials | `docs/i18n.html` |
| `infra`, `deploy`, `деплой` | GitHub Pages + rsync-зеркала + Docker | `docs/deploy.html` |

Тема не опознана — уточнить у пользователя (один раз).

---

## Когда запускать

- После значимых структурных изменений (новые страницы-домены, новые эндпоинты)
- По явному запросу

---

## Процесс

### 1. Определить режим, прочитать доки
- Full: `docs/ARCHITECTURE.md` + все `docs/domains/*.md`
- Partial: только релевантный домен

### 2. Верифицировать по коду
Доки могут устареть. Имена файлов, эндпоинты, пути — из кода (`grep`, `glob`), не из доков.

### 3. Стиль (тёмная тема сайта)
CSS-переменные из `styles.css`:
- `--bg: #090B10` — фон
- `--card: #121622` — блоки
- `--accent: #38BDF8` — акцент (стрелки, активные)
- `--border: #1F263A` — рамки
- Текст: `#e6e8ef`, приглушённый `#9aa1b2`
- Font: Plus Jakarta Sans

Цветовая кодировка:
- Статика/страницы — accent `#38BDF8`
- api.frkn.org — green `#22c55e`
- Platega/платежи — amber `#f59e0b`
- Инфра/nginx — purple `#aa66ff`

### 4. Правила SVG
- `viewBox`, `preserveAspectRatio="xMidYMid meet"`, `overflow: visible`
- Текст не вылезает за `rect`
- Solid стрелки = запрос, dashed = ответ

---

## Сборка — Full mode (метод частей, критично!)

Файл большой. Запись за один Write падает по таймауту. **ТОЛЬКО частями:**

1. Субагенты (Task tool, `general`) пишут части в `$TEMP\arch-parts\part<N>.html` через Write tool (НЕ PowerShell — ломает UTF-8!)
2. Объединение через .NET (UTF-8 без BOM):

```powershell
$dir = "C:\Users\8523~1\AppData\Local\Temp\opencode\arch-parts"
$utf8 = [System.Text.Encoding]::UTF8
$parts = 1..4 | ForEach-Object { [System.IO.File]::ReadAllText("$dir\part$_.html", $utf8) }
[System.IO.File]::WriteAllText("docs\arch-scheme.html", ($parts -join "`n"), (New-Object System.Text.UTF8Encoding($false)))
```

3. Проверить кириллицу — прочитать файл, убедиться что не «РљРѕРґ».
4. `Remove-Item $dir -Recurse -Force`

### ⚠️ Запрещено
- `Set-Content` / `Out-File` для HTML с кириллицей — Windows-1251, мусор в файле
- Write tool для всего full-файла целиком — таймаут

## Partial mode
Один Write tool вызов (файл маленький). Проверить кириллицу после записи.

---

## Чек-лист
- [ ] Факты сверены с кодом (пути, эндпоинты)
- [ ] Кириллица корректна
- [ ] HTML валиден (баланс тегов)
- [ ] Цвета сайта, не чужие
- [ ] Коммит: `docs: add/update <topic> diagram`
