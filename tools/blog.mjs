// Управление публикацией текстов «Блога Тупицы» (/b): архив ↔ публикация.
//
//   node tools/blog.mjs list
//   node tools/blog.mjs publish <slug> [<slug> ...]
//   node tools/blog.mjs unpublish <slug> [<slug> ...]
//   node tools/blog.mjs archive-all      — разово: снять с публикации всё
//   node tools/blog.mjs rebuild          — пересобрать b/index.html и b/rss.xml
//
// Модель: неопубликованные тексты лежат в b/_archive/<slug>/ и НЕ деплоятся
// (deploy-site.sh / deploy-beta.sh исключают каталог). Публикация = перенос
// каталога в b/<slug>/ + карточка в индексе + item в rss. Снятие — обратно.
//
// Метаданные (title/iso/excerpt) — b/_archive/manifest.json. Без iso текст
// опубликовать нельзя: дата нужна и карточке, и rss, а вычислять её из файла
// неоткуда.

import fs from "node:fs";
import path from "node:path";

const B_DIR = "b";
const ARCHIVE = path.join(B_DIR, "_archive");
const MANIFEST = path.join(ARCHIVE, "manifest.json");

const RU_MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const EN_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const EN_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
// Служебные каталоги внутри b/, которые не являются постами.
const NOT_POSTS = new Set(["_archive", "photos"]);

const ruDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${RU_MONTHS[m - 1]} ${y}`;
};
const rssDate = (iso) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dow = EN_DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${dow}, ${String(d).padStart(2, "0")} ${EN_MONTHS[m - 1]} ${y} 00:00:00 +0300`;
};
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escXml = (s) => esc(s).replace(/"/g, "&quot;");

function readManifest() {
  if (!fs.existsSync(MANIFEST)) return {};
  return JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
}
function writeManifest(m) {
  fs.mkdirSync(ARCHIVE, { recursive: true });
  const sorted = Object.fromEntries(
    Object.entries(m).sort((a, b) => (a[1].iso < b[1].iso ? 1 : -1)),
  );
  fs.writeFileSync(MANIFEST, JSON.stringify(sorted, null, 2) + "\n");
}

function isPost(dir) {
  return (
    !NOT_POSTS.has(path.basename(dir)) &&
    !path.basename(dir).startsWith(".") &&
    fs.existsSync(path.join(dir, "index.html"))
  );
}
function publishedSlugs() {
  return fs
    .readdirSync(B_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && isPost(path.join(B_DIR, e.name)))
    .map((e) => e.name);
}
function archivedSlugs() {
  if (!fs.existsSync(ARCHIVE)) return [];
  return fs
    .readdirSync(ARCHIVE, { withFileTypes: true })
    .filter((e) => e.isDirectory() && isPost(path.join(ARCHIVE, e.name)))
    .map((e) => e.name);
}

// Заголовок из самого файла: <title>X — Блог Тупицы</title> → X
function titleFromFile(dir) {
  const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  const m = html.match(/<title>([\s\S]*?)<\/title>/);
  if (!m) return path.basename(dir);
  return m[1]
    .replace(/\s*[—|-]\s*Блог Тупицы\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Анонс для карточки/rss: первый абзац текста, ~200 символов.
function excerptFromFile(dir) {
  const html = fs.readFileSync(path.join(dir, "index.html"), "utf8");
  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  const paras = [...body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => m[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    .filter((t) => t.length > 40);
  const text = (paras[0] || "").slice(0, 200).trim();
  return text ? text.replace(/\s+\S*$/, "") + "…" : "";
}

function rebuild() {
  const manifest = readManifest();
  const posts = publishedSlugs().map((slug) => {
    const meta = manifest[slug] || {};
    const dir = path.join(B_DIR, slug);
    const iso = meta.iso;
    if (!iso) {
      throw new Error(
        `нет iso для «${slug}» в ${MANIFEST} — добавь запись {title, iso, excerpt} и повтори`,
      );
    }
    return {
      slug,
      iso,
      title: meta.title || titleFromFile(dir),
      excerpt: meta.excerpt || excerptFromFile(dir),
    };
  });
  posts.sort((a, b) => (a.iso === b.iso ? (a.slug < b.slug ? 1 : -1) : a.iso < b.iso ? 1 : -1));

  const cards = posts
    .map(
      (p) => `        <li>
          <a href="/b/${p.slug}/">
            <div class="post-date">${ruDate(p.iso)}</div>
            <div class="post-title">${esc(p.title)}</div>
            <div class="post-excerpt">
              ${esc(p.excerpt)}
            </div>
            <span class="post-more">Читать →</span>
          </a>
        </li>`,
    )
    .join("\n");

  const indexHtml = fs.readFileSync(path.join(B_DIR, "index.html"), "utf8");
  const emptyState =
    '<p class="posts-empty" style="opacity:.55;padding:8px 0 32px">Пока ничего не опубликовано.</p>';
  const newIndex = indexHtml.replace(
    /<ul class="posts">[\s\S]*?<\/ul>/,
    posts.length
      ? `<ul class="posts">\n${cards}\n      </ul>`
      : `<ul class="posts"></ul>\n      ${emptyState}`,
  );
  if (newIndex === indexHtml) throw new Error('не нашёл <ul class="posts"> в b/index.html');
  fs.writeFileSync(path.join(B_DIR, "index.html"), newIndex);

  const items = posts
    .map(
      (p) => `    <item>
      <title>${escXml(p.title)}</title>
      <link>https://frkn.org/b/${p.slug}/</link>
      <guid isPermaLink="true">https://frkn.org/b/${p.slug}/</guid>
      <pubDate>${rssDate(p.iso)}</pubDate>
      <description><![CDATA[
        <p>${p.excerpt}</p>
      ]]></description>
    </item>`,
    )
    .join("\n\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Блог Тупицы</title>
    <link>https://frkn.org/b/</link>
    <description>Заметки обо всём на свете.</description>
    <language>ru-ru</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://frkn.org/b/rss.xml" rel="self" type="application/rss+xml" />
${items ? "\n" + items + "\n" : ""}
  </channel>
</rss>
`;
  fs.writeFileSync(path.join(B_DIR, "rss.xml"), rss);
  return posts.length;
}

function move(slug, from, to) {
  const src = path.join(from, slug);
  const dst = path.join(to, slug);
  if (!fs.existsSync(src)) throw new Error(`нет каталога ${src}`);
  if (fs.existsSync(dst)) throw new Error(`уже существует ${dst}`);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.renameSync(src, dst);
}

function cmdList() {
  const manifest = readManifest();
  const pub = publishedSlugs().sort();
  const arc = archivedSlugs().sort();
  console.log(`опубликовано: ${pub.length}`);
  for (const s of pub) console.log(`  • ${s}  ${manifest[s]?.iso || "??"}  ${manifest[s]?.title || ""}`);
  console.log(`\nв архиве: ${arc.length}`);
  for (const s of arc) console.log(`  · ${s}  ${manifest[s]?.iso || "???"}  ${manifest[s]?.title || ""}`);
}

function cmdMove(slugs, dir) {
  const has = new Set(dir === "archive" ? publishedSlugs() : archivedSlugs());
  for (const slug of slugs) {
    if (!has.has(slug)) throw new Error(`«${slug}» нет среди ${dir === "archive" ? "опубликованных" : "архивных"}`);
    if (dir === "archive") move(slug, B_DIR, ARCHIVE);
    else move(slug, ARCHIVE, B_DIR);
    console.log(`${dir === "archive" ? "снят с публикации" : "опубликован"}: ${slug}`);
  }
  const n = rebuild();
  console.log(`индекс и rss пересобраны: ${n} публикаций`);
}

function cmdArchiveAll() {
  const slugs = publishedSlugs();
  const manifest = readManifest();
  for (const slug of slugs) {
    if (!manifest[slug]) {
      manifest[slug] = {
        title: titleFromFile(path.join(B_DIR, slug)),
        iso: null, // дату нужно проставить руками перед публикацией
        excerpt: excerptFromFile(path.join(B_DIR, slug)),
      };
    }
    move(slug, B_DIR, ARCHIVE);
  }
  writeManifest(manifest);
  const n = rebuild();
  console.log(`в архив перенесено: ${slugs.length}; публикаций осталось: ${n}`);
  const missing = Object.entries(manifest).filter(([, m]) => !m.iso);
  if (missing.length) console.log(`без iso (вписать в manifest.json): ${missing.map(([s]) => s).join(", ")}`);
}

const [cmd, ...args] = process.argv.slice(2);
try {
  if (cmd === "list") cmdList();
  else if (cmd === "publish") cmdMove(args, "publish");
  else if (cmd === "unpublish") cmdMove(args, "archive");
  else if (cmd === "archive-all") cmdArchiveAll();
  else if (cmd === "rebuild") console.log(`пересобрано: ${rebuild()} публикаций`);
  else {
    console.log(
      "usage: node tools/blog.mjs list | publish <slug…> | unpublish <slug…> | archive-all | rebuild",
    );
    process.exit(1);
  }
} catch (e) {
  console.error("✗", e.message);
  process.exit(1);
}
