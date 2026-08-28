---
name: sync-docs
description: >-
  Scans git diff (current branch vs main/epic, or last merges), categorises
  changes by path, and updates relevant docs in /docs to match.
---

# Sync Docs

Анализирует изменения и обновляет документацию в `/docs` по факту.

---

## 1. Определить scope

```powershell
$onBranch = git branch --show-current

if ($onBranch -match '^(feature|fix|feat)/') {
    # diff с базой: epic/site-dev если есть, иначе main
    $base = "epic/site-dev"
    if (-not (git rev-parse --verify $base 2>$null)) { $base = "main" }
    $diffRange = "$base...HEAD"
} elseif ($onBranch -eq 'epic/site-dev') {
    $mergeBase = git log --merges --oneline -3 --format="%H" | Select-Object -Last 1
    $diffRange = "$mergeBase..HEAD"
} else {
    $diffRange = "HEAD~5..HEAD"
}
```

Если пользователь передал аргумент — использовать его.

---

## 2. Категоризация по маске пути

```powershell
$files = git diff $diffRange --name-status
```

| Маска | Категория | Док |
|---|---|---|
| `index.html`, `<dir>/index.html` (страница) | Page | `domains/site-structure.md` |
| `styles.css` | Styles | `domains/frontend.md` |
| `scripts/*.js` | Shared JS | `domains/frontend.md` |
| `container/*.html` | Partials | `domains/frontend.md` |
| `en/**`, `fa/**` | i18n | `domains/frontend.md` |
| fetch/endpoint в HTML | API | `domains/api-integration.md` |
| `pay/**`, `donate/**`, `transaction/**`, `activate/**` | Payments | `domains/payments.md` |
| `subscription/**`, `app/**`, `profile/**` | Cabinet | `domains/subscription-app.md` |
| `b/**`, `tools/import-tg.mjs` | Blog | `domains/blog.md` |
| `install`, `setup/**` | Install/setup | `domains/install-setup.md` |
| `Dockerfile`, `nginx-testflight.conf`, `deploy*.sh`, `.github/**` | Infra | `domains/infrastructure.md` |
| `Images/**` | Assets | `domains/site-structure.md` (если появились/удалились) |
| `docs/**/*.md` | Doc | — (не трогает сам себя) |
| `AGENTS.md` | Entry | — (флаг ручного review) |

---

## 3. Обновить что нужно

### 3.1 site-structure.md
Добавилась/удалилась страница или директория → строка в таблице (назначение, размер, API-вызовы).

### 3.2 api-integration.md
Новый/изменённый fetch → строка в таблице эндпоинтов + матрица «страница → вызовы».

### 3.3 frontend.md
Изменился `styles.css` (новые компоненты), новый скрипт в `scripts/`, новый partial, cache-bust-версии.

### 3.4 Остальные домены
По таблице выше.

---

## 4. Чек-лист

- [ ] Scope определён
- [ ] Доменные доки соответствуют коду
- [ ] Новые эндпоинты/страницы/ассеты отражены
- [ ] Коммит: `docs: sync — обновлены домены после <scope>`

## 5. Не трогать

- `README.md` — человеческий quickstart, обновляется вручную
- `AGENTS.md` — точка входа, только вручную
