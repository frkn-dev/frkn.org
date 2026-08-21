# Blog

Personal blog "Блог Тупицы" under `b/`, plus the import tool that generates it. Load when editing blog posts, layout, or the importer.

## Structure

- `b/index.html` (41 KB) — static post list (~49 posts).
- `b/rss.xml` (34 KB) — RSS 2.0.
- `b/<slug>/index.html` — one self-contained HTML per post (14–28 KB each).
- `b/photos/` — post images (copied by importer).

## Post pages

- Own inline CSS (dark theme + light "read mode" via `localStorage frkn-read-mode`), fonts IBM Plex Mono + Plus Jakarta Sans. Root `styles.css` NOT used.
- Like/dislike per post: `GET api.frkn.org/blog/reactions?slug=` (read) + `POST api.frkn.org/blog/reaction` (write).

## Import tool — `tools/import-tg.mjs` (~700 lines, Node ESM)

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