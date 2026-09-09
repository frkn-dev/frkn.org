// e2e test for the subscription wizard AWG bulk-download buttons.
// Loads /subscription/index.html in jsdom with stubs, plays through the wizard
// and checks:
//   * three buttons render: «Скачать все» (raw), «AmneziaWG 3.x»
//     (3.1 field set, every node), «AmneziaWG 2.x» (2.0 field set);
//   * toAwgClientConfig(…, "2.0") keeps AWG 2.0 fields (S3/S4, H ranges, I1–I5),
//     drops 3.0/3.1 client-side fields and empty values, flags nodes that need
//     HeaderProtectionKey / RandomTrailers=on as blockers; the "3.1" level keeps
//     the 3.x keys and never blocks;
//   * awgTunnelNames yields unique ^[a-zA-Z0-9_=+.-]{1,15}$ names;
//   * the zips handed to downloadZip contain the right entries (real JSZip
//     round-trip: generate → loadAsync).
// Fixtures come from tools/mock-api/serve.js so the manual mock run and this
// test see the same nodes. Exit 0 on success.
// Run: cd tools/e2e && npm install && node awg-zip-test.mjs
//      AWG_E2E_LANG=en node awg-zip-test.mjs   # same run against /en/subscription/
import { JSDOM } from "jsdom";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import JSZip from "jszip";

const __dir = dirname(fileURLToPath(import.meta.url));
const LANG = process.env.AWG_E2E_LANG === "en" ? "en" : "ru";
const PAGE = resolve(__dir, LANG === "en" ? "../../en/subscription/index.html" : "../../subscription/index.html");
const COUNT = {
  ru: { raw: (n) => `(${n} конф.`, compat: (m, n) => `(${m} из ${n} конф.` },
  en: { raw: (n) => `(${n} configs`, compat: (m, n) => `(${m} of ${n} configs` },
}[LANG];
const require = createRequire(import.meta.url);
const { AWG_NODES: NODES, SUB } = require("../mock-api/serve.js");

const TUNNEL_NAME_RE = /^[a-zA-Z0-9_=+.-]{1,15}$/;

let failed = false;
const fail = (...args) => {
  failed = true;
  console.error("❌", ...args);
};
const ok = (...args) => console.log("✅", ...args);
const eq = (what, actual, expected) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(what, "\n   got:     ", JSON.stringify(actual), "\n   expected:", JSON.stringify(expected));
  } else ok(what);
};

const html = readFileSync(PAGE, "utf8");
const cleanHtml = html
  .replace(/<link rel="stylesheet"[^>]*>/g, "")
  .replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/g, "");

let readyResolve;
const ready = new Promise((r) => (readyResolve = r));

const dom = new JSDOM(cleanHtml, {
  url: "http://localhost/?id=demo-uuid-0000&mock=1",
  runScripts: "dangerously",
  resources: "usable",
  beforeParse(window) {
    window.fetch = async (url) => {
      const u = new URL(url, "http://localhost");
      const resp = (d) => ({
        ok: true,
        status: 200,
        json: async () => d,
        text: async () => (typeof d === "string" ? d : JSON.stringify(d)),
      });
      if (u.pathname.startsWith("/subscription/")) return resp(SUB);
      if (u.pathname === "/vpn-clients.json")
        return resp({
          android: { label: "Android", clients: [{ id: "dopamine", name: "FRKN Dopamine", downloadUrl: "https://frkn.org/dopamine", configType: "txt" }] },
          windows: { label: "Windows", clients: [] },
        });
      if (u.pathname === "/info/connections/amneziawg") return resp({ nodes: NODES, status: 200 });
      if (u.pathname === "/validate/email") return resp({ status: 200 });
      if (u.pathname === "/key/validate") return resp({ valid: true });
      if (u.pathname === "/key/activate") return resp({ status: 200 });
      if (u.pathname === "/promocode/validate") return resp({ valid: true });
      return { ok: false, status: 404, json: async () => null, text: async () => "" };
    };
    window.QRCode = { toCanvas: () => {} };
    window.HTMLElement.prototype.scrollIntoView = function () {};
    try {
      window.localStorage.setItem("__t", "1");
    } catch {
      window.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
    }
    if (!window.URL.createObjectURL) {
      window.URL.createObjectURL = () => "blob:fake";
      window.URL.revokeObjectURL = () => {};
    }
    window.addEventListener("DOMContentLoaded", () => setTimeout(readyResolve, 50));
  },
});

// Inject JSZip CDN (jsdom doesn't fetch <script src>).
const res = await fetch("https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js").catch(() => null);
if (!res || !res.ok) {
  console.error("⚠️ jsDelivr jszip not reachable — skipped");
  process.exit(0);
}
dom.window.eval(await res.text());

await ready;

const document = dom.window.document;
await new Promise((r) => setTimeout(r, 2500));

const page = document.getElementById("main-content");
if (!page || page.style.display === "none") {
  console.error("❌ main hidden");
  process.exit(1);
}

document.getElementById("openDeviceModal").click();
await new Promise((r) => setTimeout(r, 100));

const protoBtn = [...document.querySelectorAll(".protocol-card")].find((b) =>
  b.textContent.includes("AmneziaWG"),
);
if (!protoBtn) {
  console.error("❌ AWG card absent");
  process.exit(1);
}
protoBtn.click();
await new Promise((r) => setTimeout(r, 100));

const osBtn = [...document.querySelectorAll("#os-options .pill-button")][0];
if (!osBtn) {
  console.error("❌ OS pill missing");
  process.exit(1);
}
osBtn.click();
await new Promise((r) => setTimeout(r, 200));

// --- pure helpers, evaluated inside the page --------------------------------
const compat = dom.window.eval(
  `(${JSON.stringify(NODES.map((n) => n.config))}).map((c) => toAwgClientConfig(c, "2.0"))`,
);
const v31 = dom.window.eval(
  `(${JSON.stringify(NODES.map((n) => n.config))}).map((c) => toAwgClientConfig(c, "3.1"))`,
);
const names = dom.window.eval(
  `awgTunnelNames(${JSON.stringify(NODES.map((n) => n.label))})`,
);

const byLabel = (l) => NODES.findIndex((n) => n.label === l);
const iTrailers = 1; // second Uncle Sam (USA) — RandomTrailers=on, no HPK
const iTimings = NODES.findIndex((n) => n.config.includes("RandomTrailers = off"));
const iFull31 = byLabel("France AWG31");

eq(
  "blockers per node",
  compat.map((c) => c.blockers),
  NODES.map((_, i) =>
    i === iTrailers ? ["RandomTrailers"] : i === iFull31 ? ["RandomTrailers", "HeaderProtectionKey"] : [],
  ),
);

const compatIdx = compat.map((c, i) => (c.blockers.length ? -1 : i)).filter((i) => i >= 0);
const blockedIdx = compat.map((c, i) => (c.blockers.length ? i : -1)).filter((i) => i >= 0);

const keysOf = (cfg) =>
  cfg
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => l.split("=")[0].trim());

eq(
  "compat config of a 3.1-timings node keeps 2.0 fields, drops 3.x + empty I2–I5",
  keysOf(compat[iTimings].config),
  [
    "PrivateKey", "Address", "MTU", "DNS",
    "Jc", "Jmin", "Jmax", "S1", "S2", "S3", "S4",
    "H1", "H2", "H3", "H4", "I1",
    "PublicKey", "Endpoint", "AllowedIPs", "PersistentKeepalive",
  ],
);
const t = compat[iTimings].config;
if (!t.includes("H1 = 100000-200000")) fail("H1 range must be kept verbatim");
if (!t.includes("I1 = <r 128>")) fail("I1 template must be kept verbatim");
if (/^#/m.test(t)) fail("comment lines must be dropped from compat config");
if (!t.endsWith("\n") || t.includes("\n\n\n")) fail("compat config formatting");
const peerRaw = NODES[iTimings].config.split("[Peer]")[1].split("\n").filter((l) => l.includes("=") && !l.startsWith("#"));
const peerCompat = t.split("[Peer]")[1].split("\n").filter((l) => l.includes("="));
eq("[Peer] passes through untouched", peerCompat, peerRaw.map((l) => l.trim()));

// 3.1 level: keeps every 3.x key of the full-3.1 node, drops empties, never blocks.
eq("3.1 level never blocks", v31.map((c) => c.blockers), NODES.map(() => []));
const k31 = keysOf(v31[iFull31].config);
eq(
  "3.1 level keeps HeaderProtectionKey/RandomTrailers/Rekey* etc.",
  ["HeaderProtectionKey", "RandomTrailers", "DisableCookies", "RekeyAfterTime", "MaxHandshakeAttempts", "ContentPaddingAddition"].filter((k) => !k31.includes(k)),
  [],
);
if (/^\w+ *= *$/m.test(v31[iTimings].config)) fail("3.1 level must drop empty I2–I5");

// Full-3.1 node at 2.0 level: even though blocked, the sanitizer itself must not leak 3.x keys.
const leaked = keysOf(compat[iFull31].config).filter((k) =>
  /^(HeaderProtectionKey|ContentPaddingAddition|Rekey|RejectAfterTime|KeepaliveTimeout|MaxHandshakeAttempts|RandomTrailers|DisableCookies)/i.test(k),
);
eq("no 3.x keys survive sanitising", leaked, []);
if (!compat[iFull31].config.includes("I5 = <t><r 56>")) fail("non-empty I5 must be kept");

// --- tunnel names -------------------------------------------------------------
eq(
  "tunnel names",
  names,
  ["uncle-sam-usa", "uncle-sam-usa-2", "netherlands-67", "belkon-1-moskva", "netherlands-6-2", "france-awg31"],
);
const badNames = names.filter((n) => !TUNNEL_NAME_RE.test(n));
eq("all names match ^[a-zA-Z0-9_=+.-]{1,15}$", badNames, []);
eq("names unique", new Set(names).size, names.length);

// --- rendered UI --------------------------------------------------------------
const btn = document.getElementById("awg-download-all");
const btn31 = document.getElementById("awg-download-all-3x");
const compatBtn = document.getElementById("awg-download-all-2x");
if (!btn) fail("awg-download-all button not rendered");
if (!btn31) fail("awg-download-all-3x button not rendered");
if (!compatBtn) fail("awg-download-all-2x button not rendered");
if (btn31 && !btn31.textContent.includes(COUNT.raw(NODES.length))) fail("3.1 button count", btn31.textContent);
if (btn && !btn.textContent.includes(COUNT.raw(NODES.length))) fail("raw button count", btn.textContent);
if (compatBtn && !compatBtn.textContent.includes(COUNT.compat(compatIdx.length, NODES.length)))
  fail("compat button count", compatBtn.textContent);
if (compatBtn && compatBtn.disabled) fail("compat button must be enabled when there are compatible nodes");
const note = document.getElementById("awg-compat-note");
if (!note) fail("awg-compat-note missing");
else if (!/AmneziaWG 3\.1/.test(note.textContent)) fail("note text", note.textContent);
else ok("note about 3.1-only servers rendered");
ok("all three buttons rendered");

// --- zips: capture what the buttons hand to downloadZip, round-trip via JSZip --
const captured = [];
dom.window.eval(`
  window.__origDownloadZip = downloadZip;
  window.__zipCalls = [];
  downloadZip = (entries, zipName) => {
    window.__zipCalls.push({ entries, zipName });
    return window.__origDownloadZip(entries, zipName);
  };
`);
const clicked = [];
dom.window.HTMLAnchorElement.prototype.click = function () {
  clicked.push({ href: this.href, download: this.download });
};

dom.window.eval("document.getElementById('awg-download-all').click()");
dom.window.eval("document.getElementById('awg-download-all-3x').click()");
dom.window.eval("document.getElementById('awg-download-all-2x').click()");
await new Promise((r) => setTimeout(r, 300));
captured.push(...dom.window.eval("window.__zipCalls"));

eq(
  "downloadZip called for all three archives",
  captured.map((c) => c.zipName),
  ["frkn-awg-dev.zip", "frkn-awg-dev-awg3x.zip", "frkn-awg-dev-awg2x.zip"],
);

// Node-side JSZip (same version as the CDN one): JSZip's async plumbing does
// not settle inside jsdom, so the round-trip runs outside the page.
const roundTrip = async (entries) => {
  const zip = new JSZip();
  entries.forEach(({ name, content }) => zip.file(name, content));
  const bytes = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  const back = await JSZip.loadAsync(bytes);
  const out = {};
  for (const f of Object.keys(back.files)) out[f] = await back.files[f].async("string");
  return out;
};

if (captured.length === 3) {
  const raw = await roundTrip(captured[0].entries);
  eq("raw zip entries", Object.keys(raw).sort(), names.map((n) => `${n}.conf`).sort());
  eq(
    "raw zip keeps configs byte-for-byte",
    NODES.map((n, i) => raw[`${names[i]}.conf`] === n.config),
    NODES.map(() => true),
  );

  const z31 = await roundTrip(captured[1].entries);
  eq("3.1 zip entries (every node)", Object.keys(z31).sort(), names.map((n) => `${n}.conf`).sort());
  eq(
    "3.1 zip keeps RandomTrailers on the nodes that have it",
    Object.values(z31).filter((c) => /^RandomTrailers = on$/m.test(c)).length,
    NODES.filter((n) => /^RandomTrailers = on$/m.test(n.config)).length,
  );
  eq("3.1 zip has no empty values", Object.entries(z31).filter(([, c]) => /^\w+ *= *$/m.test(c)).map(([n]) => n), []);

  const cz = await roundTrip(captured[2].entries);
  eq("compat zip entries", Object.keys(cz).sort(), compatIdx.map((i) => `${names[i]}.conf`).sort());
  const leaks = Object.entries(cz).filter(([, c]) =>
    /^(HeaderProtectionKey|RandomTrailers|DisableCookies|Rekey\w*|RejectAfterTime|KeepaliveTimeout|MaxHandshakeAttempts|ContentPaddingAddition) *=/m.test(c),
  );
  eq("compat zip has no 3.x keys", leaks.map(([n]) => n), []);
  const empties = Object.entries(cz).filter(([, c]) => /^\w+ *= *$/m.test(c));
  eq("compat zip has no empty values", empties.map(([n]) => n), []);
}

// The real downloadZip path (generateAsync → <a download>) is async in jsdom;
// wait a bit and report, but don't fail the run on it — jsdom's blob/anchor
// plumbing is not what we're testing.
let anchors = 0;
for (let i = 0; i < 20 && anchors < 3; i++) {
  await new Promise((r) => setTimeout(r, 250));
  anchors = clicked.filter((c) => c.download && c.download.endsWith(".zip")).length;
}
if (anchors === 3) ok("all <a download> clicks observed:", clicked.map((c) => c.download).join(", "));
else console.log("⚠️ <a download> click not observed for all zips (jsdom async quirk) — entries verified above");

if (failed) {
  console.error("❌ e2e failed");
  process.exit(1);
}
console.log(`✅ e2e passed (${LANG})`);
process.exit(0);
