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
const { URL } = require("url");

const PORT = 3000;

const AWG_NODES = [
  { label: "Белкон-1 (Москва)", config: "[Interface]\nPrivateKey=AAAA\nAddress=10.0.0.2/32\nDNS=1.1.1.1\n\n[Peer]\nPublicKey=BBBB\nEndpoint=msk.example.com:51820\nAllowedIPs=0.0.0.0/0\n" },
  { label: "Общага (1)", config: "[Interface]\nPrivateKey=CCCC\nAddress=10.0.0.3/32\n\n[Peer]\nPublicKey=DDDD\nEndpoint=shared-1.example.com:51820\nAllowedIPs=0.0.0.0/0\n" },
  { label: "Общага (2)", config: "[Interface]\nPrivateKey=EEEE\nAddress=10.0.0.4/32\n\n[Peer]\nPublicKey=FFFF\nEndpoint=shared-2.example.com:51820\nAllowedIPs=0.0.0.0/0\n" },
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
    { env: "dev", has_xray: false, has_h2: false, has_mtproto: false, has_wg: false, has_awg: true },
    { env: "wl", has_xray: false, has_h2: false, has_mtproto: false, has_wg: false, has_awg: true },
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
      return json(res, { status: 200, nodes: AWG_NODES });
    }
    if (req.method === "GET" && p.startsWith("/info/connections/wireguard")) {
      return json(res, { status: 200, nodes: [] });
    }
    if (req.method === "GET" && p === "/sub") {
      const proto = u.searchParams.get("proto") || "Proxy";
      const id = u.searchParams.get("id") || "demo";
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end(`demo://${proto}/${id}`);
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

server.listen(PORT, "127.0.0.1", () => {
  console.log(`mock api.frkn.org on http://127.0.0.1:${PORT}`);
  console.log(`AWG nodes: ${AWG_NODES.length}`);
});
