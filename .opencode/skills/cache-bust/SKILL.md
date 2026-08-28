---
name: cache-bust
description: >-
  Use when bumping cache-bust versions (?v=N) of shared assets (styles.css,
  scripts/*.js) across all HTML files after changing them.
---

# Cache-bust

У сайта нет версии как таковой — вместо неё ручные cache-bust query-строки на общих ассетах. Изменил общий ассет → бампни его `?v=N` во всех HTML, иначе пользователи получат старый файл из кеша.

## Текущие версии

| Ассет | Параметр |
|---|---|
| `/styles.css` | `?v=4` |
| `/scripts/i18n.js` | `?v=2` |
| `/scripts/containers.js` | `?v=3` |
| `/scripts/utils.js` | `?v=1` |

## Правила

- Бампать ТОЛЬКО изменённый ассет. Не трогал `styles.css` — не бампай.
- Бамп = +1 во ВСЕХ HTML, где ассет упоминается: ru, en, fa — все деревья.
- Отдельный коммит: `chore: bump styles.css to v5`.

## Шаги

### 1. Найди все упоминания
```powershell
rg -l "styles\.css\?v=" --glob "*.html"
```

### 2. Узнай текущую версию и бампни +1

### 3. Замени во всех файлах
Через Edit tool `replaceAll` по каждому файлу (или rg -l + Edit). НЕ через PowerShell `Set-Content` — сломаешь UTF-8.

### 4. Закоммить отдельно
```powershell
git commit -m "chore: bump styles.css to v5"
```
