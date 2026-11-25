// Checks which terminal /pay sells with: Planta must be gone, Platega must be
// the single, primary button. Runs the real page + real plans.js in jsdom.
//
// usage (from frkn.org/tools/e2e, where jsdom lives):
//   node pay-terminal-check.mjs ../../pay/index.html ../../en/pay/index.html
import { JSDOM } from "jsdom";
import fs from "node:fs";

const files = process.argv.slice(2);
if (!files.length) {
  console.error("usage: node pay-terminal-check.mjs <page.html> [...]");
  process.exit(1);
}

const plansJs = fs.readFileSync("../../scripts/plans.js", "utf8");
const catalog = JSON.parse(
  await (await fetch("https://api.frkn.org/payment/plans")).text(),
);

for (const file of files) {
  const html = fs
    .readFileSync(file, "utf8")
    .replace(/<script[^>]*src=[^>]*><\/script>/g, "");
  const dom = new JSDOM(html, {
    url: "https://frkn.org/pay/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
  });
  dom.window.fetch = async (url) =>
    String(url).includes("payment/plans")
      ? { ok: true, status: 200, json: async () => catalog }
      : { ok: true, status: 200, json: async () => ({}) };
  dom.window.eval(plansJs);
  if (dom.window.FRKNPlans?.ready) await dom.window.FRKNPlans.ready;
  await new Promise((r) => setTimeout(r, 200));

  dom.window.eval("openModal(30, 500, null)");
  await new Promise((r) => setTimeout(r, 200));

  const out = dom.window.eval(`(() => {
    const pay = document.getElementById("final-pay-btn");
    const planta = document.getElementById("planta-pay-btn");
    const modal = document.getElementById("payment-modal");
    return JSON.stringify({
      modalShown: !!(modal && getComputedStyle(modal).display !== "none" && modal.classList.contains("active") !== false),
      plantaInDom: !!planta,
      payText: pay ? pay.textContent.trim() : null,
      payClass: pay ? pay.className : null,
      payDisabled: pay ? pay.disabled : null,
      payVisible: pay ? getComputedStyle(pay).display !== "none" : null,
      payBg: pay ? getComputedStyle(pay).backgroundColor : null,
      orderPrice: (typeof currentOrder !== "undefined" && currentOrder) ? currentOrder.price : null,
    });
  })()`);
  console.log(file, out);
  dom.window.close();
}
