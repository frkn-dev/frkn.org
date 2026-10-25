# Blog

Personal blog "Блог Тупицы" under `b/`, plus the import tool that generates it. Load when editing blog posts, layout, or the importer.

## Structure

- `b/index.html` — static post list; пересобирается из состояния (опубликовано / архив).
- `b/rss.xml` — RSS 2.0, тоже пересобирается.
- `b/<slug>/index.html` — один самодостаточный HTML на текст (14–28 КБ).
- `b/_archive/<slug>/` — **неопубликованные** тексты. Каталог исключён из `deploy-site.sh`
  и `deploy-beta.sh`, на прод не уезжает и по URL недоступен.
- `b/_archive/manifest.json` — метаданные архива: `slug → {title, iso, excerpt}`.
  Без `iso` текст опубликовать нельзя (дата нужна карточке и rss).
- `b/photos/` — картинки текстов (копирует импортёр).

## Публикация (archive ↔ live)

Публикуется не «весь блог», а конкретные тексты по команде. Состояние — это
наличие каталога: `b/<slug>/` = опубликован, `b/_archive/<slug>/` = в архиве.

```bash
node tools/blog.mjs list              # что опубликовано, что в архиве
node tools/blog.mjs publish  <slug>   # архив → live + карточка + rss item
node tools/blog.mjs unpublish <slug>  # live → архив + убрать карточку и item
node tools/blog.mjs rebuild           # пересобрать index/rss по состоянию
```

Деплой после публикации — точечно, только блог:

```bash
RSYNC_RSH="ssh -i ~/.ssh/ed25519_frkn -o IdentitiesOnly=yes" \
  rsync -av --delete --exclude='_archive/' b/ root@141.133.173.16:/opt/frkn.org/b/
```

`--delete` обязателен (иначе снятые с публикации тексты останутся на сервере),
`--exclude='_archive/'` — чтобы архив не уехал. После синка: `/b/` 200,
`/b/<slug>/` 200 для опубликованного и 404 для архивного, `/b/_archive/…` 404.

## Post pages

- Own inline CSS (dark theme + light "read mode" via `localStorage frkn-read-mode`), fonts IBM Plex Mono + Plus Jakarta Sans. Root `styles.css` NOT used.
- Like/dislike per post: `GET api.frkn.org/blog/reactions?slug=` (read) + `POST api.frkn.org/blog/reaction` (write).

## Import tool — `tools/import-tg.mjs` (~700 lines, Node ESM)

Генератор первичной заливки: собирает посты из Telegram-экспорта. Для текущей
жизни блога нужен `tools/blog.mjs` (см. выше) — импортёр больше не запускается.

One-off importer of a Telegram channel export into `b/`. Run:

```bash
node tools/import-tg.mjs [path]
```

What it does:
- Parses `messages.html` or JSON dump.
- Generates post pages from the `b/intro` template.
- Copies photos to `b/photos`.
- Rebuilds `b/index.html` and `b/rss.xml`.

Post spec is hardcoded in the `POSTS` array. Uses node stdlib only — no dependencies.