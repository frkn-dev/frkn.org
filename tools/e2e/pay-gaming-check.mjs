// Checks the pay page's product selector against the LIVE gateway catalogue.
// Runs the real page + real scripts/plans.js in jsdom, with the host set to
// https://frkn.org (so the production branch runs) and `fetch` served from
// https://api.frkn.org/payment/plans.
//
// usage: node pay-gaming-check.mjs
import { JSDOM } from "jsdom";
import fs from "node:fs";

const CATALOGUE_URL = "https://api.frkn.org/payment/plans";

const catalogue = await (await fetch(CATALOGUE_URL)).json();
console.log(`catalogue: ${catalogue.length} plans`);
const products = [...new Set(catalogue.filter((p) => p.kind !== "lite").map((p) => p.product))];
console.log(`products sold by the gateway: ${products.join(", ")}`);

for (const page of ["../../pay/index.html", "../../en/pay/index.html"]) {
  // LIVE=1 checks what the production host serves instead of the working tree.
  const live = process.env.LIVE === "1";
  const pageUrl = live
    ? "https://frkn.org/" + page.replace("../../", "")
    : null;
  let html = live
    ? await (await fetch(pageUrl)).text()
    : fs.readFileSync(page, "utf8");
  html = html
    .replace(/<script[^>]*src="[^"]*plans\.js[^"]*"[^>]*><\/script>/g, "")
    .replace(/<script[^>]*src=[^>]*><\/script>/g, "");

  const pagePath = page.includes("/en/") ? "/en/pay/" : "/pay/";
  const dom = new JSDOM(html, {
    url: "https://frkn.org" + pagePath,
    runScripts: "dangerously",
    pretendToBeVisual: true,
  });
  const { window } = dom;

  window.fetch = async (url) => {
    if (String(url).includes("/payment/plans")) {
      return { ok: true, status: 200, json: async () => catalogue };
    }
    return { ok: true, status: 200, json: async () => ({}) };
  };

  const plansJs = live
    ? await (await fetch("https://frkn.org/scripts/plans.js")).text()
    : fs.readFileSync(new URL("../../scripts/plans.js", import.meta.url), "utf8");
  window.eval(plansJs);
  const plans = window.FRKNPlans;
  await plans.ready;

  const doc = window.document;
  const chips = [...doc.querySelectorAll("#product-chips .product-chip")].map((b) => ({
    id: b.dataset.product,
    name: b.querySelector(".chip-name")?.textContent,
  }));
  const cards = [...doc.querySelectorAll(".pricing-grid-main .price-card")].map((c) => ({
    duration: c.dataset.duration,
    price: c.dataset.price,
    product: c.dataset.product,
  }));

  console.log(`\n== ${page}  (isBeta=${plans.isBeta})`);
  console.log(`chips: ${chips.map((c) => `${c.name}[${c.id}]`).join(" | ") || "none"}`);
  console.log(`visible cards: ${cards.map((c) => `${c.product}/${c.duration}d/${c.price}₽`).join(", ") || "none"}`);

  // Switching to gaming must rebuild the grid from the catalogue.
  const gamingChip = doc.querySelector('#product-chips [data-product="gaming"]');
  if (!gamingChip) {
    console.log("RESULT: gaming chip MISSING");
    process.exitCode = 1;
    continue;
  }
  gamingChip.click();
  const after = [...doc.querySelectorAll(".pricing-grid-main .price-card")].map(
    (c) => `${c.dataset.product}/${c.dataset.duration}d/${c.dataset.price}₽`,
  );
  console.log(`after clicking «${gamingChip.querySelector(".chip-name").textContent}»: ${after.join(", ")}`);
  const ok = after.length > 0 && after.every((c) => c.startsWith("gaming/"));
  console.log(`RESULT: ${ok ? "ok" : "FAILED"}`);
  if (!ok) process.exitCode = 1;
}
