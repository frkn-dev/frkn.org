// jsdom e2e for named-device main-subscription controls. No live server or CDN.
// Run: cd tools/e2e && npm install && node devices-main-feed-test.mjs
//      AWG_E2E_LANG=en node devices-main-feed-test.mjs
//      AWG_E2E_PAGE=app node devices-main-feed-test.mjs
import { JSDOM } from "jsdom";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dir = dirname(fileURLToPath(import.meta.url));
const APP = process.env.AWG_E2E_PAGE === "app";
const LANG = !APP && process.env.AWG_E2E_LANG === "en" ? "en" : "ru";
const PAGE = resolve(
  __dir,
  APP
    ? "../../app/index.html"
    : LANG === "en"
      ? "../../en/subscription/index.html"
      : "../../subscription/index.html",
);
const TEXT = {
  ru: {
    create: "Добавить устройство в общую подписку",
    list: "В общей подписке",
    error: "Не удалось изменить настройку общей подписки",
  },
  en: {
    create: "Include the device in the main subscription",
    list: "In the main subscription",
    error: "Failed to update the main subscription setting",
  },
}[LANG];
const require = createRequire(import.meta.url);
const { AWG_NODES, SUB } = require("../mock-api/serve.js");
const clone = (value) => JSON.parse(JSON.stringify(value));
const sub = clone(SUB);

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
const check = (what, condition) => {
  if (!condition) fail(what);
  else ok(what);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitFor = async (what, fn, timeout = 4000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const value = fn();
    if (value) return value;
    await sleep(20);
  }
  throw new Error(`Timeout waiting for ${what}`);
};

const html = readFileSync(PAGE, "utf8");
const cleanHtml = html
  .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
  .replace(/<link rel="stylesheet"[^>]*>/g, "")
  .replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/g, "");

const requests = [];
const alerts = [];
let subscriptionGets = 0;
let holdPatch = false;
let failPatch = false;
let releasePatch = null;
let readyResolve;
const ready = new Promise((r) => (readyResolve = r));

const dom = new JSDOM(cleanHtml, {
  url: "http://localhost/?id=demo-uuid-0000&mock=1",
  runScripts: "dangerously",
  beforeParse(window) {
    window.fetch = async (url, options = {}) => {
      const u = new URL(url, "http://localhost");
      const method = options.method || "GET";
      let body = null;
      if (options.body) {
        try {
          body = JSON.parse(options.body);
        } catch {
          body = options.body;
        }
      }
      requests.push({ url: u.toString(), method, body });
      const resp = (data, ok = true, status = 200) => ({
        ok,
        status,
        json: async () => clone(data),
        text: async () => (typeof data === "string" ? data : JSON.stringify(data)),
      });
      if (u.pathname.endsWith("/subscription/vpn-clients.json")) {
        return resp({
          android: { label: "Android", clients: [{ id: "dopamine", name: "FRKN Dopamine", downloadUrl: "https://frkn.org/dopamine", configType: "txt" }] },
          windows: { label: "Windows", clients: [] },
        });
      }
      if (u.pathname.startsWith("/subscription/")) {
        subscriptionGets += 1;
        return resp(sub);
      }
      if (u.pathname === "/devices/options") {
        return resp({ status: 200, response: { dev: ["AmneziaWg", "Xray"], wl: ["AmneziaWg"] } });
      }
      if (u.pathname === "/devices/nodes") {
        return resp({ status: 200, response: [{ node_id: "node-1", label: "Node 1" }] });
      }
      if (u.pathname === "/devices" && method === "POST") {
        return resp({ status: 200, message: "ok" });
      }
      if (method === "PATCH" && /^\/devices\/[^/]+$/.test(u.pathname)) {
        const update = () => {
          const id = decodeURIComponent(u.pathname.slice("/devices/".length));
          const conn = sub.connections.find((c) => c.id === id);
          conn.include_in_main = body.include_in_main;
          return resp({ status: 200, message: "ok" });
        };
        if (holdPatch) {
          return new Promise((resolve) => {
            releasePatch = () => resolve(update());
          });
        }
        if (failPatch) return resp({ status: 500, message: "mock failure" }, false, 500);
        return update();
      }
      if (u.pathname === "/info/connections/amneziawg") return resp({ nodes: AWG_NODES, status: 200 });
      if (u.pathname === "/referrals") return resp({ status: 200, response: { count: 0 } });
      if (u.pathname === "/validate/email") return resp({ status: 200 });
      if (u.pathname === "/key/validate") return resp({ valid: true });
      if (u.pathname === "/key/activate") return resp({ status: 200 });
      if (u.pathname === "/promocode/validate") return resp({ valid: true });
      return resp(null, false, 404);
    };
    window.QRCode = { toCanvas: () => {} };
    window.alert = (message) => alerts.push(String(message));
    window.confirm = () => true;
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

await ready;
const document = dom.window.document;
const creates = () =>
  requests.filter((r) => r.method === "POST" && new URL(r.url).pathname === "/devices");
const patches = () => requests.filter((r) => r.method === "PATCH");
const getBox = (id) =>
  document.querySelector(`#devicesList .device-main-feed-checkbox[data-connection-id="${id}"]`);

await waitFor("initial device list", () => document.querySelectorAll("#devicesList .device-main-feed-checkbox").length === 2);
await waitFor("device create options", () => document.getElementById("deviceNodeSelect")?.options.length > 1);

const initialBoxes = [...document.querySelectorAll("#devicesList .device-main-feed-checkbox")];
eq("initial include_in_main states", initialBoxes.map((b) => b.checked), [true, false]);
eq("initial device ids", initialBoxes.map((b) => b.dataset.connectionId), ["conn-1", "conn-2"]);
eq(
  "localized list labels",
  initialBoxes.map((b) => b.closest("label").textContent.trim()),
  [TEXT.list, TEXT.list],
);
const createRow = document.getElementById("deviceMainFeedRow");
const createBox = document.getElementById("deviceMainFeed");
check("create checkbox visible for ordinary scope", !createRow.classList.contains("hidden"));
eq("create checkbox defaults to false", createBox.checked, false);
eq("localized create label", createRow.textContent.trim().replace(/\s+/g, " "), TEXT.create);

const labelInput = document.getElementById("deviceLabelInput");
const envSelect = document.getElementById("deviceEnvSelect");
const nodeSelect = document.getElementById("deviceNodeSelect");
const submitBtn = document.getElementById("deviceSubmitBtn");
labelInput.value = "Default device";
nodeSelect.value = "node-1";
let refreshCount = subscriptionGets;
submitBtn.click();
await waitFor("default create and refresh", () => creates().length === 1 && subscriptionGets > refreshCount && !submitBtn.disabled);
eq("create payload defaults include_in_main to false", creates()[0].body.include_in_main, false);

createBox.checked = true;
envSelect.dispatchEvent(new dom.window.Event("change"));
await waitFor("node options after env change", () => nodeSelect.options.length > 1);
check("env change preserves create checkbox choice", createBox.checked);
labelInput.value = "Included device";
nodeSelect.value = "node-1";
refreshCount = subscriptionGets;
submitBtn.click();
await waitFor("explicit create and refresh", () => creates().length === 2 && subscriptionGets > refreshCount && !submitBtn.disabled);
eq("create payload sends explicit include_in_main true", creates()[1].body.include_in_main, true);

holdPatch = true;
refreshCount = subscriptionGets;
const pendingBox = getBox("conn-2");
pendingBox.click();
check("checkbox disabled during PATCH", pendingBox.disabled);
eq("PATCH request count", patches().length, 1);
eq("PATCH method and URL", [patches()[0].method, patches()[0].url], [
  "PATCH",
  "http://localhost:3000/devices/conn-2?subscription_id=demo-uuid-0000",
]);
eq("PATCH request body", patches()[0].body, { include_in_main: true });
releasePatch();
await waitFor("refresh after successful PATCH", () => subscriptionGets > refreshCount && getBox("conn-2") !== pendingBox);
check("successful PATCH refreshes device list", getBox("conn-2") !== pendingBox);
eq("successful PATCH renders updated state", getBox("conn-2").checked, true);

holdPatch = false;
failPatch = true;
const alertCount = alerts.length;
const rollbackBox = getBox("conn-1");
rollbackBox.click();
await waitFor("failed PATCH rollback", () => alerts.length > alertCount && !rollbackBox.disabled);
eq("failed PATCH restores previous checked state", rollbackBox.checked, true);
eq("failed PATCH localized error", alerts[alerts.length - 1], TEXT.error);
eq("failed PATCH request body", patches()[1].body, { include_in_main: false });

dom.window.close();
if (failed) {
  console.error("❌ devices main-feed e2e failed");
  process.exit(1);
}
console.log(`✅ devices main-feed e2e passed (${LANG})`);
process.exit(0);
