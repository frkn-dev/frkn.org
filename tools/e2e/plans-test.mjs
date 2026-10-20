// jsdom e2e for the tariff products on the shop front (scripts/plans.js).
//
// Covers the Release 1 acceptance points:
//   - prices come from GET /payment/plans, not from the HTML (a mutated
//     catalogue must replace the numbers baked into the page);
//   - every one of the 24 product prices (6 products x 30/90/180/365) shown on
//     the beta page equals the catalogue;
//   - production (non-beta) shows no product selector and keeps working;
//   - the order carries `product` in create/promo requests;
//   - the modal shows the product name and what it includes.
//
// No live server: the page's scripts are inlined and fetch is stubbed.
// Run: cd tools/e2e && node plans-test.mjs
import { JSDOM } from "jsdom";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dir = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { PLANS, PRODUCT_PRICES } = require("../mock-api/serve.js");

const PLANS_SRC = readFileSync(resolve(__dir, "../../scripts/plans.js"), "utf8");
const UTILS_SRC = readFileSync(resolve(__dir, "../../scripts/utils.js"), "utf8");

let failed = false;
const ok = (...args) => console.log("✅", ...args);
const fail = (...args) => {
  failed = true;
  console.error("❌", ...args);
};
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
async function waitFor(what, fn, timeout = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const value = fn();
    if (value) return value;
    await sleep(20);
  }
  throw new Error(`Timeout waiting for ${what}`);
}

// Inline the page scripts: jsdom must not try to fetch them, but the order
// (utils.js, plans.js, page script) has to stay intact. The page's own inline
// scripts (including the currency declaration) are kept as they are.
function inlineScripts(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<link rel="stylesheet"[^>]*>/g, "")
    .replace(/<script[^>]*src="[^"]*utils\.js[^"]*"[^>]*><\/script>/g, `<script>${UTILS_SRC}</script>`)
    .replace(/<script[^>]*src="[^"]*plans\.js[^"]*"[^>]*><\/script>/g, `<script>${PLANS_SRC}</script>`)
    .replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/g, "");
}

function page(file, url, { catalog = PLANS, key = null, catalogDown = false } = {}) {
  const requests = [];
  let readyResolve;
  const ready = new Promise((r) => (readyResolve = r));
  const dom = new JSDOM(inlineScripts(readFileSync(file, "utf8")), {
    url,
    runScripts: "dangerously",
    beforeParse(window) {
      const resp = (data, okFlag = true, status = 200) => ({
        ok: okFlag,
        status,
        json: async () => JSON.parse(JSON.stringify(data)),
        text: async () => JSON.stringify(data),
      });
      window.fetch = async (rawUrl, options = {}) => {
        const u = new URL(rawUrl, url);
        const method = options.method || "GET";
        let body = null;
        if (options.body) {
          try {
            body = JSON.parse(options.body);
          } catch {
            body = options.body;
          }
        }
        requests.push({ path: u.pathname, method, body });
        if (u.pathname === "/payment/plans") {
          if (catalogDown) return resp({ status: 503, message: "no catalogue" }, false, 503);
          return resp(catalog);
        }
        if (u.pathname === "/key/validate") {
          return resp({ status: 200, message: "Key is valid", response: { instance: { Key: key } } });
        }
        if (u.pathname === "/promocode/validate") {
          const base = body?.product === "full" ? 2080 : 500;
          return resp({
            original_price: base,
            discounted_price: Math.round(base * 0.9),
            discount_percent: 10,
            discount_amount: Math.round(base * 0.1),
            is_valid: true,
            message: null,
          });
        }
        if (u.pathname.startsWith("/payment/")) {
          return resp({ status: "PENDING", url: "#mock", transactionId: "tx-1" });
        }
        return resp(null, false, 404);
      };
      window.QRCode = { toCanvas: () => {} };
      window.alert = () => {};
      window.confirm = () => true;
      window.HTMLElement.prototype.scrollIntoView = function () {};
      window.addEventListener("DOMContentLoaded", () => setTimeout(readyResolve, 80));
    },
  });
  return { dom, requests, ready };
}

const gridCards = (document) => [...document.querySelectorAll(".pricing-grid-main .price-card")];
const extraCards = (document) => [...document.querySelectorAll(".pricing-grid-extra .price-card")];
const prices = (cards) => cards.map((c) => [Number(c.dataset.duration), Number(c.dataset.price)]);

// ---------------------------------------------------------------- beta (RU)
let { dom, requests, ready } = page(
  resolve(__dir, "../../pay/index.html"),
  "http://localhost/pay/?promo=TEST",
);
await ready;
let document = dom.window.document;
let plans = dom.window.FRKNPlans;

check("plans.js exposes FRKNPlans", !!plans);
check("localhost is treated as beta", plans.isBeta === true);

// Catalogue-driven rendering.
await waitFor("chips", () => document.querySelectorAll("#product-chips .product-chip").length);
eq(
  "six product chips",
  [...document.querySelectorAll("#product-chips .product-chip")].map((c) => c.dataset.product),
  ["standard", "gaming", "bs-prem", "standard-gaming", "standard-bs-prem", "full"],
);
check("chips are visible on beta", document.getElementById("product-chips").style.display !== "none");

// Acceptance: every catalogue product price is what the page shows.
const mismatches = [];
for (const [product, days] of Object.entries(PRODUCT_PRICES)) {
  plans.select(product);
  const expected = Object.entries(days)
    .map(([d, p]) => [Number(d), p])
    .filter(([d]) => d >= 30)
    .sort((a, b) => a[0] - b[0]);
  const shown = prices(gridCards(document));
  if (JSON.stringify(shown) !== JSON.stringify(expected)) {
    mismatches.push(`${product}: ${JSON.stringify(shown)} != ${JSON.stringify(expected)}`);
  }
  const shortDays = Object.keys(days).filter((d) => Number(d) < 30);
  const extraVisible = document.getElementById("extra-options-toggle").parentElement.style.display !== "none";
  if (shortDays.length ? !extraVisible : extraVisible) {
    mismatches.push(`${product}: short plans visibility wrong`);
  }
}
eq("24 product prices come from the catalogue", mismatches, []);

// Short standard plans stay available for the classic product only.
plans.select("standard");
eq("short standard plans from catalogue", prices(extraCards(document)), [
  [3, 100],
  [7, 200],
  [14, 300],
]);

// URL promo is applied to catalogue-rendered cards, and re-applied after a
// product switch (the cards are replaced by scripts/plans.js).
await waitFor("promo badge", () => document.querySelector(".pricing-grid-main .discount-badge"));
check(
  "url promo marks catalogue cards",
  !!document.querySelector('.pricing-grid-main .buy-button[data-discounted-price]'),
);

// Order flow: the chosen product travels to the gateway.
plans.select("gaming");
document.querySelector('.pricing-grid-main .buy-button[data-duration="30"]').click();
await waitFor("modal", () => document.getElementById("payment-modal").classList.contains("active"));
check(
  "modal title names the product",
  document.getElementById("modal-title").textContent.includes("Игровой"),
);
eq("modal lists what the product includes", document.querySelectorAll("#product-includes li").length, 2);

document.getElementById("user-email").value = "buyer@example.com";
document.getElementById("final-pay-btn").click();
await waitFor("create request", () => requests.find((r) => r.path === "/payment/platega/key/create"));
const platega = requests.find((r) => r.path === "/payment/platega/key/create");
eq("platega create carries the product", platega.body, {
  duration: 30,
  product: "gaming",
  promocode: null,
  refCode: null,
  email: "buyer@example.com",
});

// Promo validation is product-aware.
plans.select("full");
document.querySelector('.pricing-grid-main .buy-button[data-duration="90"]').click();
await waitFor("modal 2", () => document.getElementById("modal-title").textContent.includes("Полный"));
document.getElementById("user-promo").value = "TEST";
document.getElementById("apply-promo-btn").click();
await waitFor("promo request", () => requests.find((r) => r.path === "/promocode/validate"));
const promo = requests.filter((r) => r.path === "/promocode/validate").pop();
eq("promo validate carries the product", [promo.body.duration, promo.body.product], [90, "full"]);

// Lite packages keep the classic product and take alt_price from the catalogue.
const liteCard = document.querySelector('.pricing-grid-traffic .price-card[data-gb="1"]');
check(
  "lite base price from catalogue",
  liteCard.querySelector('.buy-button:not([data-alt="true"])').textContent.includes("67₽"),
);
check(
  "lite alt price from catalogue",
  liteCard.querySelector('.buy-button[data-alt="true"]').textContent.includes("69₽"),
);
check(
  "lite stays standard",
  liteCard.querySelector(".buy-button").dataset.product === undefined,
);

// ----------------------------------------------------------- production (RU)
// Mutate the catalogue: the page must show the API prices, not the HTML ones.
const mutated = JSON.parse(JSON.stringify(PLANS)).map((p) => {
  if (p.product === "standard" && p.days === 30) return { ...p, price: 555 };
  if (p.traffic_gib === 1) return { ...p, price: 70, alt_price: 71 };
  return p;
});
({ dom, requests, ready } = page(
  resolve(__dir, "../../pay/index.html"),
  "https://frkn.org/pay/",
  { catalog: mutated },
));
await ready;
document = dom.window.document;
plans = dom.window.FRKNPlans;
check("frkn.org is not beta", plans.isBeta === false);
eq("no product chips in production", document.querySelectorAll("#product-chips .product-chip").length, 0);
eq("production main prices come from the API", prices(gridCards(document)), [
  [30, 555],
  [90, 1300],
  [365, 4500],
]);
eq(
  "production short prices come from the API",
  prices(extraCards(document)).sort((a, b) => a[0] - b[0]),
  [
    [3, 100],
    [7, 200],
    [14, 300],
    [180, 2700],
  ],
);
const liteCard2 = document.querySelector('.pricing-grid-traffic .price-card[data-gb="1"]');
check(
  "production lite base price comes from the API",
  liteCard2.querySelector('.buy-button:not([data-alt="true"])').textContent.includes("70₽"),
);
check(
  "production lite alt price comes from the API",
  liteCard2.querySelector('.buy-button[data-alt="true"]').textContent.includes("71₽"),
);

// ---------------------------------------------------------------- beta (EN)
({ dom, requests, ready } = page(resolve(__dir, "../../en/pay/index.html"), "http://localhost/en/pay/"));
await ready;
document = dom.window.document;
plans = dom.window.FRKNPlans;
check("en page loads plans", !!plans);
eq(
  "en chips are localized",
  document.querySelector("#product-chips .product-chip .chip-name").textContent,
  "Standard",
);
const en30 = document.querySelector('.pricing-grid-main .price-card[data-duration="30"] .cost');
check(`en price converted for display (got ${en30 && en30.textContent.trim()})`, en30 && en30.textContent.trim() === "$6.50");
plans.select("gaming");
check(
  "en gaming price converted",
  document.querySelector('.pricing-grid-main .price-card[data-duration="30"] .cost').textContent.trim() === "$3.90",
);

// ---------------------------------------------------------------- activation
// The activation modal names the key's product and what it includes.
({ dom, requests, ready } = page(resolve(__dir, "../../activate/index.html"), "http://localhost/activate/", {
  key: { product: "gaming", days: 30, kind: "standard", activated: false },
}));
await ready;
document = dom.window.document;
document.getElementById("keyId").value = "A".repeat(31);
document.getElementById("activateKeyForm").dispatchEvent(
  new dom.window.Event("submit", { bubbles: true, cancelable: true }),
);
await waitFor("activation modal", () =>
  document.getElementById("activationModal").classList.contains("active"),
);
check("activation modal shows the product", document.getElementById("productName").textContent === "Игровой");
eq("activation modal lists what it includes", document.querySelectorAll("#productIncludes li").length, 2);

// A standard key keeps the modal as it was (no product block).
({ dom, requests, ready } = page(resolve(__dir, "../../activate/index.html"), "http://localhost/activate/", {
  key: { product: "standard", days: 30, kind: "standard", activated: false },
}));
await ready;
document = dom.window.document;
document.getElementById("keyId").value = "B".repeat(31);
document.getElementById("activateKeyForm").dispatchEvent(
  new dom.window.Event("submit", { bubbles: true, cancelable: true }),
);
await waitFor("activation modal 2", () =>
  document.getElementById("activationModal").classList.contains("active"),
);
check("standard key hides the product block", document.getElementById("productLine").hidden === true);

// ------------------------------------------------- renewal options (unit)
// A renewal stays on the subscription's product, so the select must offer that
// product's durations and catalogue prices.
const unit = new JSDOM(`<!doctype html><select id="renewDuration"></select>`, {
  url: "http://localhost/",
  runScripts: "dangerously",
  beforeParse(window) {
    window.fetch = async () => ({ ok: true, status: 200, json: async () => PLANS });
  },
});
unit.window.eval(PLANS_SRC);
await unit.window.FRKNPlans.ready;
const renewSelect = unit.window.document.getElementById("renewDuration");
const keep = unit.window.FRKNPlans.renewOptions(renewSelect, "full", 90);
eq("renewal keeps the chosen duration", keep, 90);
eq(
  "renewal prices come from the catalogue",
  [...renewSelect.options].map((o) => [Number(o.value), Number(o.dataset.price)]),
  [
    [30, 800],
    [90, 2080],
    [180, 4320],
    [365, 7200],
  ],
);
const keep2 = unit.window.FRKNPlans.renewOptions(renewSelect, "gaming", 3);
eq("renewal falls back to a duration the product is sold for", keep2, 30);

// ---------------------------------------- catalogue down (site before gateway)
// The shop front goes live before the gateway endpoint: GET /payment/plans is
// 503/404. The page must keep the prices baked into the HTML and not render a
// product selector (chips would have no prices behind them). Without this the
// beta grid is wiped by render() reading null catalogue entries.
const STATIC_MAIN = [
  [30, 500],
  [90, 1300],
  [365, 4500],
];
const staticSorted = (document) =>
  prices(gridCards(document)).sort((a, b) => a[0] - b[0]);
{
  const down = page(resolve(__dir, "../../pay/index.html"), "http://beta.frkn.org/pay/", {
    catalogDown: true,
  });
  await down.ready;
  const { document } = down.dom.window;
  eq("catalogue down: grid keeps the static cards", staticSorted(document), STATIC_MAIN);
  eq("catalogue down: no empty grid", gridCards(document).length, 3);
  eq(
    "catalogue down: the compact 180 card is still there",
    document.querySelectorAll('.price-card[data-duration="180"]').length,
    1,
  );
  eq("catalogue down: no product chips", document.querySelectorAll("#product-chips .chip").length, 0);
  check(
    "catalogue down: chips container not filled",
    (document.getElementById("product-chips") || { children: [] }).children.length === 0,
  );
  eq("catalogue down: ready resolves null", await down.dom.window.FRKNPlans.ready, null);
  down.dom.window.close();

  // Production without a catalogue: same static prices, no chips either.
  const prod = page(resolve(__dir, "../../pay/index.html"), "http://frkn.org/pay/", {
    catalogDown: true,
  });
  await prod.ready;
  eq(
    "catalogue down (production): static prices kept",
    staticSorted(prod.dom.window.document),
    STATIC_MAIN,
  );
  prod.dom.window.close();
}

console.log(failed ? "\nFAILED" : "\nALL PASSED");
process.exit(failed ? 1 : 0);
