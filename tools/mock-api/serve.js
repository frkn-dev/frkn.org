// Mock api.frkn.org server for local testing of /subscription wizard.
// Endpoints used by the wizard (CORS enabled, JSON):
//   GET /subscription/{id}                  — status + locations
//   GET /info/connections/amneziawg?id=&env= — AWG nodes
//   GET /sub?id=&proto=&format=             — sub link body (per proto)
//   GET /referrals?code=                    — referral info
//   POST /validate/email                    — pass
//   POST /account                           — pass
//   POST /promocode/validate                — pass
//   POST /payment/platega/subscription/create → {url: "#"}
//   GET /devices/options, /subscription/{id}.connections — devices (optional)
//   PATCH /devices/{connectionId}?subscription_id= — include_in_main toggle
// Run: node tools/mock-api/serve.js  (port 3000)
const http = require("http");
const crypto = require("crypto");

// Ключи фейковые, но правильной формы (32 байта base64, 44 символа) — иначе
// клиенты AmneziaWG режут конфиг на «Invalid key» ещё до AWG-полей и мок-zip
// нельзя даже импортировать для проверки имён/полей.
const mockKey = (seed) => crypto.createHash("sha256").update(`frkn-mock-${seed}`).digest("base64");
const { URL } = require("url");

const PORT = 3000;

// Конфиги повторяют формат боевого API (AmneziaWG 3.1): базовые поля
// AWG 2.0 (S3/S4, I1–I5, диапазоны H1–H4) плюс у части нод поля 3.0/3.1
// (HeaderProtectionKey, RandomTrailers, DisableCookies, Rekey* и т.д.).
// На этих данных проверяем совместимый экспорт («Для AmneziaWG»: 2.0-поля,
// ноды с HeaderProtectionKey / RandomTrailers=on пропускаются) и имена
// туннелей (<=15 символов, уникальные). `extra` — строки, добавляемые в
// конец [Interface].
const awgForkConfig = (i, label, extra = "") =>
  "[Interface]\n" +
  `PrivateKey = ${mockKey(`priv-${i}`)}\n` +
  "Address = 100.64.1.17" + i + "/32\n" +
  "MTU = 1420\n" +
  "DNS = 1.1.1.1\n" +
  "\n" +
  "Jc = 3\n" +
  "Jmin = 54\n" +
  "Jmax = 133\n" +
  "S1 = 42\n" +
  "S2 = 63\n" +
  "S3 = 28\n" +
  "S4 = 11\n" +
  "H1 = 100000-200000\n" +
  "H2 = 300000-400000\n" +
  "H3 = 500000-600000\n" +
  "H4 = 700000-800000\n" +
  "I1 = <r 128>\n" +
  "I2 = \n" +
  "I3 = \n" +
  "I4 = \n" +
  "I5 = \n" +
  extra +
  "\n" +
  "[Peer]\n" +
  `PublicKey = ${mockKey(`pub-${i}`)}\n` +
  `Endpoint = 192.0.2.${10 + i}:51820\n` +
  "AllowedIPs = 0.0.0.0/0, ::/0\n" +
  "PersistentKeepalive = 25\n" +
  "\n" +
  `# ${label} — conn_id: 00000000-0000-0000-0000-00000000000${i}\n`;

// Матрица нод для e2e:
//   1, 3, 4 — чистый AWG 2.0 → попадают в совместимый архив;
//   2 — RandomTrailers=on без HeaderProtectionKey (как реальные «Suomi 2»)
//       → пропускается;
//   6 — RandomTrailers=off + клиентские тайминги 3.1 → остаётся, поля
//       3.1 вырезаются;
//   5 — полный 3.1 (HeaderProtectionKey + RandomTrailers=on) → пропускается.
// Дубли меток и эмодзи/длинная метка проверяют имена туннелей.
const AWG_NODES = [
  { label: "Uncle Sam (USA)", config: awgForkConfig(1, "Uncle Sam (USA)") },
  {
    label: "Uncle Sam (USA)",
    config: awgForkConfig(
      2,
      "Uncle Sam (USA)",
      "RandomTrailers = on\nDisableCookies = on\n",
    ),
  },
  { label: "Netherlands 67 🏴‍☠️", config: awgForkConfig(3, "Netherlands 67 🏴‍☠️") },
  { label: "Белкон-1 (Москва)", config: awgForkConfig(4, "Белкон-1 (Москва)") },
  {
    label: "Netherlands 67 🏴‍☠️",
    config: awgForkConfig(
      6,
      "Netherlands 67 🏴‍☠️",
      "RandomTrailers = off\n" +
        "DisableCookies = on\n" +
        "ContentPaddingAddition = 0-8\n" +
        "RekeyAfterTime = 110-130\n" +
        "RekeyTimeout = 4-6\n" +
        "RejectAfterTime = 170-190\n" +
        "KeepaliveTimeout = 8-12\n" +
        "MaxHandshakeAttempts = 18\n",
    ),
  },
  {
    label: "France AWG31",
    config:
      "[Interface]\n" +
      `PrivateKey = ${mockKey("priv-5")}\n` +
      "Address = 10.77.1.169/32\n" +
      "MTU = 1420\n" +
      "DNS = 1.1.1.1\n" +
      "\n" +
      "Jc = 7\n" +
      "Jmin = 57\n" +
      "Jmax = 141\n" +
      "S1 = 41\n" +
      "S2 = 54\n" +
      "S3 = 14\n" +
      "S4 = 15\n" +
      "H1 = 100000-200000\n" +
      "H2 = 300000-400000\n" +
      "H3 = 500000-600000\n" +
      "H4 = 700000-800000\n" +
      "I1 = <r 128>\n" +
      "I2 = <rc 64>\n" +
      "I3 = <b 0x17fdfb00><r 96>\n" +
      "I4 = <rd 40>\n" +
      "I5 = <t><r 56>\n" +
      "RandomTrailers = on\n" +
      "DisableCookies = on\n" +
      `HeaderProtectionKey = ${mockKey("hpk-5")}\n` +
      "ContentPaddingAddition = 0-8\n" +
      "RekeyAfterTime = 110-130\n" +
      "RekeyTimeout = 4-6\n" +
      "RejectAfterTime = 170-190\n" +
      "KeepaliveTimeout = 8-12\n" +
      "MaxHandshakeAttempts = 18\n" +
      "\n" +
      "[Peer]\n" +
      `PublicKey = ${mockKey("pub-5")}\n` +
      "Endpoint = 198.51.100.7:8443\n" +
      "AllowedIPs = 0.0.0.0/0, ::/0\n" +
      "PersistentKeepalive = 25\n" +
      "\n" +
      "# France AWG3.1 — conn_id: 00000000-0000-0000-0000-000000000005\n",
  },
];

// Реальные конфиги вместо фикстур: AWG_REAL_DIR=<папка с *.conf> (по
// умолчанию ./frkn-awg-dev, если существует — сюда кладут распакованный
// боевой архив). Метка берётся из финального комментария
// «# <label> — conn_id: …», иначе из имени файла без «.conf».
const fs = require("fs");
const path = require("path");
function loadRealAwgNodes() {
  const dir = process.env.AWG_REAL_DIR || path.join(__dirname, "..", "..", "frkn-awg-dev");
  if (process.env.AWG_REAL_DIR === "" || !fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".conf")).sort();
  if (!files.length) return null;
  const nodes = files.map((f) => {
    const config = fs.readFileSync(path.join(dir, f), "utf8");
    const m = config.match(/^#\s*(.+?)\s+—\s+conn_id:/m);
    return { label: m ? m[1] : f.replace(/\.conf$/i, ""), config };
  });
  console.log(`AWG nodes: ${nodes.length} real configs from ${dir} (AWG_REAL_DIR= to disable)`);
  return nodes;
}
const REAL_AWG_NODES = loadRealAwgNodes();

const WG_NODES = [
  { label: "WireGuard (mock)", config: "[Interface]\nPrivateKey=WWWG\nAddress=10.0.0.5/32\n\n[Peer]\nPublicKey=HHHH\nEndpoint=wg.example.com:51820\nAllowedIPs=0.0.0.0/0\n" },
];

// Каталог цен витрины (GET /payment/plans) — те же 24 цены продуктов, что и в
// config-example.toml payment-gw, плюс короткие стандартные и lite-пакеты.
// Витрина (scripts/plans.js) берёт цены отсюда, поэтому e2e проверяет, что
// показанные цены совпадают с каталогом для всех шести продуктов.
const PRODUCT_PRICES = {
  standard: { 3: 100, 7: 200, 14: 300, 30: 500, 90: 1300, 180: 2700, 365: 4500 },
  gaming: { 30: 300, 90: 780, 180: 1620, 365: 2700 },
  "bs-prem": { 30: 500, 90: 1300, 180: 2700, 365: 4500 },
  "standard-gaming": { 30: 700, 90: 1820, 180: 3780, 365: 6300 },
  "standard-bs-prem": { 30: 700, 90: 1820, 180: 3780, 365: 6300 },
  full: { 30: 800, 90: 2080, 180: 4320, 365: 7200 },
};
const LITE_PRICES = [
  [1, 67, 69],
  [5, 167, 169],
  [10, 267, 269],
  [50, 367, 369],
];
const PLANS = (() => {
  const out = [];
  for (const [product, days] of Object.entries(PRODUCT_PRICES)) {
    for (const [day, price] of Object.entries(days)) {
      out.push({ kind: "standard", product, days: Number(day), price, bonus_days: 7 });
    }
  }
  for (const [gb, price, alt] of LITE_PRICES) {
    out.push({ kind: "lite", product: "standard", days: 0, traffic_gib: gb, price, alt_price: alt });
  }
  return out;
})();

const SUB = {
  id: "demo-uuid-0000",
  // `MOCK_PLAN_KIND=selfhosted node serve.js` switches the cabinet into the
  // selfhosted mode so the users card (/private/*) can be exercised locally.
  plan_kind: process.env.MOCK_PLAN_KIND || "standard",
  limit_bytes: 0,
  uplink: 123456789,
  downlink: 987654321,
  daily_uplink: 1000,
  daily_downlink: 2000,
  monthly_uplink: 3000,
  monthly_downlink: 4000,
  expired_at: Date.now() + 30 * 86400_000,
  locations: [
    {
      env: "dev",
      has_xray: true,
      has_h2: true,
      has_mtproto: true,
      has_wg: true,
      has_awg: true,
    },
    {
      env: "wl",
      has_xray: false,
      has_h2: false,
      has_mtproto: false,
      has_wg: true,
      has_awg: true,
    },
  ],
  connections: [
    {
      id: "conn-1",
      proto: "AmneziaWg",
      env: "dev",
      label: "Мой планшет",
      uplink: 111,
      downlink: 222,
      share_token: "tok-1",
      share_url: "frkn://sub/demo-uuid-0000",
      scope: null,
      include_in_main: true,
    },
    {
      id: "conn-2",
      proto: "Xray",
      env: "wl",
      label: "Рабочий ноутбук",
      uplink: 333,
      downlink: 444,
      share_token: "tok-2",
      share_url: "frkn://sub/demo-uuid-0000-2",
      scope: null,
      include_in_main: false,
    },
  ],
  scope: null,
};

// Selfhosted cabinet fixture: the account's own nodes and the child
// subscriptions it hands out (users). Feeds scripts/selfhosted-users.js via
// GET /private/state, GET /private/nodes, GET/POST /private/users and
// DELETE /private/users/{child}.
const SH_NODES = [
  {
    uuid: "node-1",
    hostname: "de1.frkn.org",
    label: "Frankfurt",
    country: "DE",
    status: "Online",
    env: "custompersonal111122223333",
    inbounds: ["AmneziaWg"],
  },
  {
    uuid: "node-2",
    hostname: "fi1.frkn.org",
    label: "Helsinki",
    country: "FI",
    status: "Offline",
    env: "custompersonal111122223333",
    inbounds: ["AmneziaWgMobile"],
  },
  {
    uuid: "node-3",
    hostname: "nl1.frkn.org",
    label: "Amsterdam",
    country: "NL",
    status: "Online",
    env: "custompersonal111122223333",
    // No AWG inbound: listed, but not selectable for a user.
    inbounds: ["Hysteria2"],
  },
];
const SH_USERS = [
  {
    subscription_id: "child-1",
    subscription_url: "frkn://sub/child-1",
    all_servers: true,
    node_ids: [],
    connections: 1,
    created_at: new Date().toISOString(),
  },
];
const shState = () => ({
  subscription_id: "demo-uuid-0000",
  plan_kind: "selfhosted",
  servers: { used: SH_NODES.length, limit: 5, remaining: 2 },
  users: { used: SH_USERS.length, limit: 20, remaining: 20 - SH_USERS.length },
});

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(res, obj, code = 200) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(body);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  const u = new URL(req.url, "http://localhost:3000");
  const p = u.pathname;

  try {
    if (req.method === "PATCH" && p.startsWith("/devices/")) {
      const connectionId = decodeURIComponent(p.slice("/devices/".length));
      const body = await readJson(req);
      const conn = SUB.connections.find((c) => c.id === connectionId);
      if (!conn || typeof body.include_in_main !== "boolean") {
        return json(res, { status: 400, message: "bad request" }, 400);
      }
      conn.include_in_main = body.include_in_main;
      return json(res, { status: 200, message: "ok" });
    }
    if (req.method === "GET" && p.startsWith("/subscription/")) {
      return json(res, SUB);
    }
    if (req.method === "GET" && p.startsWith("/info/connections/amneziawg")) {
      return json(res, { status: 200, nodes: REAL_AWG_NODES || AWG_NODES });
    }
    if (req.method === "GET" && p.startsWith("/info/connections/wireguard")) {
      return json(res, { status: 200, nodes: WG_NODES });
    }
    if (req.method === "GET" && p === "/sub") {
      const proto = u.searchParams.get("proto") || "Proxy";
      const id = u.searchParams.get("id") || "demo";
      const format = u.searchParams.get("format") || "txt";
      const base = `demo://${proto}/${id}/${format}`;
      let body = base;
      if (proto === "Hysteria2") {
        body = format === "base64" ? Buffer.from(base).toString("base64") : base;
      }
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end(body);
    }
    if (req.method === "GET" && p === "/referrals") {
      return json(res, { status: 200, response: { count: 0 } });
    }
    if (req.method === "GET" && p === "/payment/plans") {
      return json(res, PLANS);
    }
    // Selfhosted account (see scripts/selfhosted-users.js).
    if (req.method === "GET" && p === "/private/state") {
      return json(res, { status: 200, message: "Ok", response: shState() });
    }
    if (req.method === "GET" && p === "/private/nodes") {
      return json(res, { status: 200, message: "Ok", response: SH_NODES });
    }
    // Live gauges for the servers card (scripts/selfhosted-servers.js).
    if (req.method === "GET" && p === "/private/nodes/stats") {
      return json(res, {
        status: 200,
        message: "Ok",
        response: SH_NODES.map((n, i) => ({
          ...n,
          address: `203.0.113.${i + 10}`,
          metrics: {
            cpu_percent: [7.4, 0, 63.2][i] || 12,
            memory_percent: [41.8, 0, 77.5][i] || 30,
            memory_used_bytes: 2147483648,
            memory_total_bytes: 4294967296,
            disk_usage_percent: [23.1, 0, 58.9][i] || 20,
            network_rx_bps: [1250000, 0, 9600000][i] || 400000,
            network_tx_bps: [480000, 0, 3100000][i] || 120000,
            load_percent: [41.8, 0, 77.5][i] || 30,
          },
          traffic: {
            uplink: [10737418240, 0, 3221225472][i] || 0,
            downlink: [48318382080, 0, 9663676416][i] || 0,
            connections: [3, 0, 1][i] || 0,
          },
        })),
      });
    }
    // 24h history: a smooth synthetic curve, enough to eyeball the chart.
    if (req.method === "GET" && p.startsWith("/private/nodes/") && p.endsWith("/series")) {
      const uuid = decodeURIComponent(p.slice("/private/nodes/".length, -"/series".length));
      if (!SH_NODES.some((n) => n.uuid === uuid)) {
        return json(res, { status: 404, message: "node not found" }, 404);
      }
      const q = new URL(req.url, "http://localhost");
      const to = Number(q.searchParams.get("to")) || Date.now();
      const from = Number(q.searchParams.get("from")) || to - 86400000;
      const points = 96;
      const step = (to - from) / points;
      const wave = (ts, base, amp) =>
        Math.round((base + amp * Math.sin((ts - from) / 3600000)) * 100) / 100;
      const series = (base, amp) =>
        Array.from({ length: points }, (_, i) => {
          const ts = Math.round(from + i * step);
          return [ts, wave(ts, base, amp)];
        });
      return json(res, {
        status: 200,
        message: "Ok",
        response: {
          cpu_percent: series(24, 18),
          memory_percent: series(46, 6),
          network_rx_bps: series(2400000, 1800000),
          network_tx_bps: series(900000, 600000),
        },
      });
    }
    if (req.method === "GET" && p === "/private/users") {
      return json(res, { status: 200, message: "Ok", response: SH_USERS });
    }
    if (req.method === "POST" && p === "/private/users") {
      const body = await readJson(req);
      const all = !!body.all_servers;
      const id = `child-${SH_USERS.length + 1}`;
      SH_USERS.push({
        subscription_id: id,
        subscription_url: `frkn://sub/${id}`,
        all_servers: all,
        node_ids: all ? [] : body.node_ids || [],
        connections: all ? 1 : (body.node_ids || []).length,
        created_at: new Date().toISOString(),
      });
      return json(res, {
        status: 200,
        message: "Ok",
        response: {
          subscription_id: id,
          subscription_url: `frkn://sub/${id}`,
          all_servers: all,
          node_ids: all ? [] : body.node_ids || [],
          connections: [],
          users: shState().users,
        },
      });
    }
    if (req.method === "DELETE" && p.startsWith("/private/users/")) {
      const id = decodeURIComponent(p.slice("/private/users/".length));
      const at = SH_USERS.findIndex((u) => u.subscription_id === id);
      if (at !== -1) SH_USERS.splice(at, 1);
      return json(res, {
        status: 200,
        message: "Ok",
        response: { subscription_id: id, deleted: true, connections_deleted: 1 },
      });
    }
    // Named device creation (POST /devices). The cabinet no longer pins a
    // device to a node, so node_id is optional here as well.
    if (req.method === "POST" && p === "/devices") {
      const body = await readJson(req);
      if (!body || !body.env || !body.proto) {
        return json(res, { status: 400, message: "bad request" }, 400);
      }
      const id = `conn-${SUB.connections.length + 1}`;
      SUB.connections.push({
        id,
        proto: body.proto,
        env: body.env,
        label: body.label || "",
        uplink: 0,
        downlink: 0,
        share_token: `tok-${SUB.connections.length + 1}`,
        share_url: `frkn://sub/${SUB.id}-${SUB.connections.length + 1}`,
        scope: null,
        include_in_main: body.include_in_main === true,
      });
      return json(res, { status: 200, message: "ok" });
    }
    if (req.method === "GET" && p === "/devices/options") {
      // Same shape as mrkting: env -> [Tag, ...] (strings, not objects).
      return json(res, {
        status: 200,
        response: { dev: ["AmneziaWg", "AmneziaWgMobile"], ru: ["Wireguard"] },
      });
    }
    if (req.method === "POST" && p === "/validate/email") {
      return json(res, { status: 200 });
    }
    if (req.method === "POST" && p === "/account") {
      return json(res, { status: 200 });
    }
    if (req.method === "POST" && p === "/promocode/validate") {
      return json(res, { valid: true, discount: 0 });
    }
    if (req.method === "POST" && p === "/payment/platega/subscription/create") {
      return json(res, { url: "#mock" });
    }
    if (req.method === "POST" && p === "/key/activate") {
      return json(res, { status: 200, message: "activated" });
    }
    if (req.method === "GET" && p.startsWith("/key/validate")) {
      return json(res, { valid: true });
    }
    console.log("[mock-api] 404:", req.method, p);
    return json(res, { status: 404, message: "not found" }, 404);
  } catch (e) {
    console.error("[mock-api] error:", e);
    return json(res, { status: 500, message: "server error" }, 500);
  }
});

// Фикстуры переиспользует e2e (tools/e2e/awg-zip-test.mjs, tools/e2e/plans-test.mjs).
module.exports = { AWG_NODES, SUB, PLANS, PRODUCT_PRICES };

if (require.main === module) {
  // MOCK_HOST=0.0.0.0 — слушать на всех интерфейсах (проверка с телефона в
  // той же сети: страница берёт адрес мока из своего hostname).
  const HOST = process.env.MOCK_HOST || "127.0.0.1";
  server.listen(PORT, HOST, () => {
    console.log(`mock api.frkn.org on http://${HOST}:${PORT}`);
    if (!REAL_AWG_NODES) console.log(`AWG nodes: ${AWG_NODES.length} (mock fixtures)`);
  });
}
