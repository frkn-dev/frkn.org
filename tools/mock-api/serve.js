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

const SUB = {
  id: "demo-uuid-0000",
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
    },
  ],
  scope: null,
};

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function json(res, obj, code = 200) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(body);
}

const server = http.createServer((req, res) => {
  cors(res);
  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  const u = new URL(req.url, "http://localhost:3000");
  const p = u.pathname;

  try {
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
    if (req.method === "GET" && p === "/devices/options") {
      return json(res, { status: 200, response: { dev: [{ id: "n1", name: "Белкон-1" }] } });
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

// Фикстуры переиспользует e2e (tools/e2e/awg-zip-test.mjs).
module.exports = { AWG_NODES, SUB };

if (require.main === module) {
  server.listen(PORT, "127.0.0.1", () => {
    console.log(`mock api.frkn.org on http://127.0.0.1:${PORT}`);
    if (!REAL_AWG_NODES) console.log(`AWG nodes: ${AWG_NODES.length} (mock fixtures)`);
  });
}
