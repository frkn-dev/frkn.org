// Разовый импорт Telegram-экспорта в «Блог Тупицы» (/b).
// Запуск из корня репо:
//   node tools/import-tg.mjs                      — из ChatExport_2026-07-18/messages.html
//   node tools/import-tg.mjs /tmp/export-msgs.json — из JSON-дампа (id,date,text,photo)
import fs from "node:fs";
import path from "node:path";

const MSGS_SOURCE = process.argv[2] || "ChatExport_2026-07-18/messages.html";
const EXPORT_BASE = path.dirname(MSGS_SOURCE);
const B_DIR = "b";
const PHOTOS_OUT = "b/photos";

// ---------- спека постов ----------
// msgs — id сообщений из экспорта (объединяются в один пост, в хронологии спека)
// shortNotes — для сборника «Коротко»: список id, каждый станет строкой с датой
const POSTS = [
  { slug: "relziki-service", title: "Как я написал сервис для скачивания рилзиков", iso: "2026-07-09", msgs: [1019, 1020] },
  { slug: "pogonchik-belyh-slonov", title: "Погонщик Белых Слонов. Часть первая — TECHSTYLE", iso: "2026-05-16", msgs: [1015] },
  { slug: "platezhka-samozanyatogo", title: "Платёжка для самозанятого", iso: "2026-04-23", msgs: [1014] },

  { slug: "risk", title: "Риск", iso: "2025-12-25", msgs: [1010] },
  { slug: "nozh", title: "Он достал нож", iso: "2025-12-16", msgs: [1006, 1007, 1008] },
  { slug: "kak-ya-poshel-v-taksisty", title: "Как я пошёл в таксисты", iso: "2025-12-14", msgs: [1005] },
  { slug: "cheburechki", title: "Чебуречки", iso: "2025-12-07", msgs: [991, 992, 993, 995, 996, 997, 998, 999, 1000] },
  { slug: "draki", title: "Кулаки сбиты", iso: "2025-12-03", msgs: [989] },
  { slug: "nalivayki", title: "Наливайки", iso: "2025-12-02", msgs: [988] },
  { slug: "ya-snova-svoboden", title: "Я опять свободен", iso: "2025-11-29", msgs: [984, 985] },
  { slug: "krutit-pedali", title: "Опять крутить педали", iso: "2025-11-28", msgs: [983] },
  { slug: "dofamin", title: "Дофамин", iso: "2025-11-26", msgs: [981, 982] },
  { slug: "taxi-economics", title: "Как это — работать водителем такси", iso: "2025-11-20", msgs: [979] },
  { slug: "opyat-krasny", title: "Опять красный", iso: "2025-11-10", msgs: [975] },
  { slug: "vy-silno-toropites", title: "— А вы сильно торопитесь?", iso: "2025-11-09", msgs: [973] },
  { slug: "details", title: "Дьявол кроется в деталях", iso: "2025-11-07", msgs: [971, 972] },
  { slug: "sdelay-sam", title: "Сделай сам", iso: "2025-11-06", msgs: [965, 966, 967, 968, 969, 970] },
  { slug: "pogoda", title: "— Слушай, а ты погоду смотрел?", iso: "2025-11-05", msgs: [962] },
  { slug: "glava-3-nikto", title: "Глава 3. Никто", iso: "2025-11-01", msgs: [958, 959, 960, 961] },
  { slug: "barbershop", title: "Подпольная парикмахерская", iso: "2025-10-31", msgs: [957] },
  { slug: "kontakt-bar", title: "Ночь у контакт-бара", iso: "2025-10-27", msgs: [951, 952, 953, 954, 955] },
  { slug: "novy-zakaz", title: "Новый заказ", iso: "2025-10-25", msgs: [950] },
  { slug: "shtrafstoyanka", title: "Штрафстоянка", iso: "2025-10-24", msgs: [947, 948, 949] },
  { slug: "noch-u-zapravki", title: "Ночь у заправки", iso: "2025-10-23", msgs: [946] },
  { slug: "zvonki-iz-banka", title: "Звонки из банка", iso: "2025-10-22", msgs: [944, 945] },
  { slug: "spasibo-kotyatki", title: "Спасибо вам, котятки", iso: "2025-10-21", msgs: [939, 940, 941, 942, 943] },
  { slug: "dyrki-v-syre", title: "Теория дырок в сыре", iso: "2025-10-21", msgs: [937] },
  { slug: "taxi-18-20-oktyabrya", title: "Такси-дневник: 18–20 октября", iso: "2025-10-20", msgs: [931, 932, 933, 934] },
  { slug: "taxi-15-16-oktyabrya", title: "Такси-дневник: 15–16 октября", iso: "2025-10-16", msgs: [922, 923, 924, 925, 928, 929] },
  { slug: "taxi-14-oktyabrya", title: "Такси-дневник: 14 октября", iso: "2025-10-14", msgs: [913, 914, 915, 916, 917, 918, 919, 920, 921] },
  { slug: "taxi-epigraf", title: "такси.txt. Эпиграф", iso: "2025-10-05", msgs: [908, 909] },
  { slug: "illyuziya-vybora", title: "Иллюзия выбора", iso: "2025-10-02", msgs: [905, 906] },
  { slug: "denki-ubivayut-vesele", title: "Деньги убивают всё веселье", iso: "2025-08-22", msgs: [901] },
  { slug: "neyroseti-vorvalis", title: "Нейросети ворвались в нашу жизнь", iso: "2025-08-22", msgs: [900] },
  { slug: "rkn-vs-vpn", title: "РКН против VPN: гонка вооружений", iso: "2025-08-16", msgs: [898], disclaimer: true },
  { slug: "bukovski", title: "Буковски", iso: "2025-08-01", msgs: [895, 896] },
  { slug: "zapusti-docker", title: "Запусти Docker", iso: "2025-08-01", msgs: [894] },
  { slug: "this-is-your-life", title: "This is your life", iso: "2025-06-20", msgs: [890] },
  { slug: "tupica-na-svyazi", title: "Тупица на связи", iso: "2025-06-05", msgs: [889] },
  { slug: "stil", title: "Стиль — это ответ на всё", iso: "2025-06-05", msgs: [888] },
  { slug: "supergeroi", title: "Супергерои", iso: "2025-05-27", msgs: [884] },

  { slug: "produktivnost", title: "Продуктивность", iso: "2024-10-04", msgs: [815] },
  { slug: "goroda", title: "Города", iso: "2024-09-06", msgs: [796] },
  { slug: "slova", title: "Слова и поступки", iso: "2024-07-19", msgs: [652, 653] },
  { slug: "rasstavaniya", title: "О расставаниях", iso: "2024-07-12", msgs: [627] },
  { slug: "neyroshlem", title: "Нейрошлем", iso: "2024-01-01", msgs: [286] },

  { slug: "razrabotka", title: "Разработка", iso: "2023-08-25", msgs: [284] },

  {
    slug: "korotko",
    title: "Короткие заметки",
    iso: "2026-06-27",
    shortNotes: [52, 341, 495, 535, 620, 621, 891, 897, 907, 938, 956, 976, 987, 1001, 1003, 1016],
  },
];

// существующий пост, тоже попадает в индекс и RSS
const INTRO = {
  slug: "intro",
  title: "Введение",
  iso: "2026-03-01",
  excerpt:
    "Я порой вспоминаю 2008 год. Тогда я жил в общаге, варил пельмени и продавал интернет через VPN. Сегодня практически ничего не изменилось. Разве что пельмени стали хуже.",
};

// ---------- парсинг экспорта ----------
function decodeEntities(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&");
}

function parseMessages(html) {
  const map = new Map();
  const re =
    /<div class="message default clearfix(?: joined)?" id="message(\d+)">([\s\S]*?)(?=<div class="message )/g;
  let m;
  while ((m = re.exec(html))) {
    const body = m[2];
    const date =
      (body.match(/<div class="pull_right date details" title="([^"]+)"/) || [])[1] || "";
    const textMatch = body.match(/<div class="text">([\s\S]*?)<\/div>/);
    let text = "";
    if (textMatch) {
      text = decodeEntities(
        textMatch[1].replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, ""),
      ).trim();
    }
    const photo =
      (body.match(/<a class="photo_wrap[^>]*href="([^"]+)"/) || [])[1] || "";
    map.set(Number(m[1]), { date, text, photo });
  }
  return map;
}

// ---------- форматтеры ----------
const RU_MONTHS = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const EN_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const EN_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function ruDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${RU_MONTHS[m - 1]} ${y}`;
}

function rssDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dow = EN_DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${dow}, ${String(d).padStart(2, "0")} ${EN_MONTHS[m - 1]} ${y} 00:00:00 +0300`;
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeXml(s) {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

// ---------- чтение шаблона из b/intro ----------
const introHtml = fs.readFileSync(path.join(B_DIR, "intro/index.html"), "utf8");
const css = introHtml.match(/<style>([\s\S]*?)<\/style>/)[1];
const inlineScripts = [...introHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[0]);
if (inlineScripts.length !== 3) {
  throw new Error(`ожидалось 3 inline-скрипта в b/intro, найдено ${inlineScripts.length}`);
}
const [headScript, toggleScript, reactionsScript] = inlineScripts;

const EXTRA_CSS = `
      .meta {
        font-size: 13px;
        color: var(--muted);
        margin: -24px 0 32px;
      }

      html.read .meta {
        font-size: 12px;
        letter-spacing: 0.5px;
        color: #1a1a1a;
        opacity: 0.65;
      }

      article p.photo {
        text-align: center;
      }

      article img {
        max-width: 100%;
        border-radius: 10px;
        margin: 0 0 18px;
      }

      html.read article img {
        border-radius: 0;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15);
      }
`;

const DISCLAIMER = `        <p class="disclaimer">
          <strong>*Дисклеймер</strong> — использование VPN для повседневных
          целей не является уголовным преступлением.<br />
          Эта информация носит ознакомительный характер.
        </p>

`;

function renderArticle({ slug, title, iso, contentHtml, disclaimer }) {
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>${escapeHtml(title)} — Блог Тупицы</title>
    <meta name="description" content="${escapeHtml(excerptOf(contentHtml))}" />
    <link rel="canonical" href="https://frkn.org/b/${slug}/" />

    <link
      href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:ital,wght@0,400;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
      rel="stylesheet"
    />
    <link
      rel="alternate"
      type="application/rss+xml"
      title="Блог Тупицы"
      href="/b/rss.xml"
    />
    <link rel="icon" href="/Images/favicon.ico" type="image/x-icon" />
    ${headScript}
    <style>${css}${EXTRA_CSS}</style>
  </head>

  <body>
    <div class="page">
      <div class="topbar">
        <a class="back" href="/b/">← Все статьи</a>
        <button type="button" class="read-toggle" id="read-toggle">
          📖 Read mode
        </button>
      </div>

      <article>
${disclaimer ? DISCLAIMER : ""}        <h1>${escapeHtml(title)}</h1>
        <div class="meta">${ruDate(iso)} · Блог Тупицы</div>

${contentHtml}
        <div class="reactions" data-article="b/${slug}">
          <span class="reactions-label">Оцените статью:</span>
          <button type="button" class="reaction-btn" data-reaction="1">
            👍 <span class="reaction-count" data-count="1">–</span>
          </button>
          <button type="button" class="reaction-btn" data-reaction="-1">
            👎 <span class="reaction-count" data-count="-1">–</span>
          </button>
        </div>
      </article>
    </div>

    ${toggleScript}
    ${reactionsScript}
    <script src="/scripts/analytics.js" defer></script>
  </body>
</html>
`;
}

// ---------- сборка контента ----------
function excerptOf(contentHtml) {
  const text = contentHtml
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 200 ? text.slice(0, 197).trimEnd() + "…" : text;
}

function contentFor(msgIds, msgs) {
  const chunks = [];
  for (const id of msgIds) {
    const m = msgs.get(id);
    if (!m) throw new Error(`сообщение ${id} не найдено в экспорте`);
    if (m.photo) {
      if (photoExists(m.photo)) {
        chunks.push(
          `        <p class="photo"><img src="/b/photos/${path.basename(m.photo)}" alt="" loading="lazy" /></p>`,
        );
      } else {
        missingPhotos.push(m.photo);
      }
    }
    if (m.text) {
      for (const line of m.text.split(/\n+/)) {
        const t = line.trim();
        if (t) chunks.push(`        <p>${escapeHtml(t)}</p>`);
      }
    }
  }
  return chunks.join("\n") + "\n";
}

function shortNotesContent(ids, msgs) {
  const key = (ddmmyyyy) => {
    const [d, m, y] = ddmmyyyy.split(".");
    return `${y}-${m}-${d}`;
  };
  const items = ids
    .map((id) => {
      const m = msgs.get(id);
      if (!m) throw new Error(`сообщение ${id} не найдено в экспорте`);
      const dateShort = m.date.slice(0, 10);
      const text = m.text.replace(/\s+/g, " ").trim();
      return { dateShort, text };
    })
    .sort((a, b) => (key(a.dateShort) < key(b.dateShort) ? -1 : 1));
  return (
    items
      .map((i) => `        <p><b>${i.dateShort}</b> — ${escapeHtml(i.text)}</p>`)
      .join("\n") + "\n"
  );
}

// ---------- основной прогон ----------
let msgs;
if (MSGS_SOURCE.endsWith(".json")) {
  msgs = new Map(
    JSON.parse(fs.readFileSync(MSGS_SOURCE, "utf8")).map((m) => [
      Number(m.id),
      { date: m.date, text: m.text, photo: m.photo || "" },
    ]),
  );
} else {
  msgs = parseMessages(fs.readFileSync(MSGS_SOURCE, "utf8"));
}
console.log(`сообщений распознано: ${msgs.size}`);

const missingPhotos = [];
function photoExists(href) {
  return fs.existsSync(path.join(EXPORT_BASE, href));
}

fs.mkdirSync(PHOTOS_OUT, { recursive: true });
const usedPhotos = new Set();

const built = [];

for (const post of POSTS) {
  const contentHtml = post.shortNotes
    ? shortNotesContent(post.shortNotes, msgs)
    : contentFor(post.msgs, msgs);

  // собираем фото этого поста (только существующие файлы)
  const ids = post.shortNotes || post.msgs;
  for (const id of ids) {
    const m = msgs.get(id);
    if (m && m.photo && photoExists(m.photo)) usedPhotos.add(m.photo);
  }

  const html = renderArticle({ ...post, contentHtml });
  const dir = path.join(B_DIR, post.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
  built.push({
    slug: post.slug,
    title: post.title,
    iso: post.iso,
    firstMsg: (post.msgs || post.shortNotes)[0],
    excerpt: excerptOf(contentHtml),
  });
  console.log(`пост: b/${post.slug}/`);
}

for (const href of usedPhotos) {
  const src = path.join(EXPORT_BASE, href);
  const dst = path.join(PHOTOS_OUT, path.basename(href));
  fs.copyFileSync(src, dst);
}
console.log(`фото скопировано: ${usedPhotos.size}`);
if (missingPhotos.length) {
  console.log(
    `ВНИМАНИЕ: не найдены файлы фото (${new Set(missingPhotos).size}): посты сгенерированы без них. Верните папку экспорта и перезапустите скрипт.`,
  );
  [...new Set(missingPhotos)].forEach((p) => console.log(`  - ${p}`));
}

// ---------- индекс ----------
const introEntry = { ...INTRO, firstMsg: 0 };
const all = [...built, introEntry].sort((a, b) =>
  a.iso === b.iso ? b.firstMsg - a.firstMsg : a.iso < b.iso ? 1 : -1,
);

const cards = all
  .map(
    (p) => `        <li>
          <a href="/b/${p.slug}/">
            <div class="post-date">${ruDate(p.iso)}</div>
            <div class="post-title">${escapeHtml(p.title)}</div>
            <div class="post-excerpt">
              ${escapeHtml(p.excerpt)}
            </div>
            <span class="post-more">Читать →</span>
          </a>
        </li>`,
  )
  .join("\n");

const indexHtml = fs.readFileSync(path.join(B_DIR, "index.html"), "utf8");
const newIndex = indexHtml.replace(
  /<ul class="posts">[\s\S]*?<\/ul>/,
  `<ul class="posts">\n${cards}\n      </ul>`,
);
if (newIndex === indexHtml) throw new Error("не нашёл <ul class=\"posts\"> в b/index.html");
fs.writeFileSync(path.join(B_DIR, "index.html"), newIndex);
console.log(`индекс обновлён: ${all.length} карточек`);

// ---------- RSS ----------
const items = all
  .map(
    (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
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

${items}

  </channel>
</rss>
`;
fs.writeFileSync(path.join(B_DIR, "rss.xml"), rss);
console.log(`rss.xml пересобран: ${all.length} item`);
