---
name: new-page
description: >-
  Use when scaffolding a new site page. Creates <dir>/index.html with the
  standard skeleton (partials, scripts, og-tags) and the en/ mirror.
---

# New Page Scaffold

Шаблон новой страницы frkn.org. Смотри образцы: `about/`, `contacts/` — простые статические страницы.

## Шаги

### 1. Создай `<name>/index.html` (ru)

Обязательный скелет:

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="description" content="..." />
    <link rel="canonical" href="https://frkn.org/<name>/" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://frkn.org/<name>/" />
    <meta property="og:title" content="..." />
    <meta property="og:description" content="..." />
    <meta property="og:image" content="https://frkn.org/Images/preview.jpeg" />
    <title>...</title>
    <link rel="icon" href="/Images/favicon.ico" sizes="any" type="image/x-icon">
    <link rel="apple-touch-icon" href="/Images/apple-touch-icon.png" sizes="180x180">
    <link rel="stylesheet" href="/styles.css?v=4" />
  </head>
  <body>
    <div class="container">
      <header><div id="logo-container"></div></header>
      <!-- контент -->
      <div id="footer-container"></div>
    </div>
    <script src="/scripts/analytics.js" defer></script>
    <script src="/scripts/i18n.js?v=2"></script>
    <script src="/scripts/containers.js?v=3"></script>
  </body>
</html>
```

### 2. Зеркало `en/<name>/index.html`

Та же структура: `lang="en"`, canonical → `/en/<name>/`, тексты переведены, ссылки внутри — на `/en/...`.

### 3. fa — НЕ создавай по умолчанию

fa частичная. Если пользователь явно просит — создавай `fa/<name>/` с `dir="rtl"`. Иначе фолбэк на /en/ сделает 404.html.

### 4. Ссылки на страницу

Если страница в навигации — добавь ссылку в `container/footer.{html,en.html}` (или `logo.*.html`), все локали.

### 5. Документация

Обнови `docs/domains/site-structure.md` — добавь строку в таблицу.

## Чек-лист
- [ ] `<name>/index.html` создан
- [ ] `en/<name>/index.html` создан
- [ ] canonical/og-url правильные
- [ ] partials + analytics + i18n подключены
- [ ] `docs/domains/site-structure.md` обновлён
- [ ] Скриншоты desktop/mobile по обеим локалям (skill `verify`)
