import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { JSDOM } from "jsdom";

const pages = [
  {
    name: "ru",
    file: "/Users/2pizza/c/f/frkn.org/pay/index.html",
    expect: {
      warn: "Важно: не закрывайте окно до подтверждения оплаты",
      pay: "Оплатить",
      planta: null,
      currency: "₽",
    },
  },
  {
    name: "en",
    file: "/Users/2pizza/c/f/frkn.org/en/pay/index.html",
    expect: {
      warn: "Important: do not close this window until payment is confirmed",
      pay: "Pay",
      planta: null,
      currency: "$",
    },
  },
];

for (const p of pages) {
  const html = readFileSync(p.file, "utf8");
  console.log(`\n=== ${p.name}: ${p.file}`);

  // inline script syntax
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  scripts.forEach((code, i) => {
    try {
      execFileSync("node", ["--check", "-"], { input: code, stdio: ["pipe", "pipe", "pipe"] });
    } catch (e) {
      console.log(`  script #${i} SYNTAX ERROR:`, e.stderr?.toString().split("\n").slice(0, 4).join(" "));
    }
  });
  console.log(`  inline scripts checked: ${scripts.length}`);

  const dom = new JSDOM(html, { runScripts: "outside-only" });
  const doc = dom.window.document;
  const warn = doc.querySelector("#payment-modal .modal-warn");
  const pay = doc.querySelector("#final-pay-btn");
  const planta = doc.querySelector("#planta-pay-btn");

  console.log("  warn:", warn?.textContent.replace(/\s+/g, " ").trim() === `⚠ ${p.expect.warn}` ? "ok" : `FAIL ${warn?.textContent}`);
  console.log("  pay button:", pay?.textContent.trim() === p.expect.pay ? "ok" : `FAIL ${pay?.textContent}`);
  console.log("  planta button:", p.expect.planta === null ? (planta ? "FAIL present" : "absent (ok)") : planta?.textContent.trim() === p.expect.planta ? "ok" : "FAIL");
  console.log("  warn before pay button:", warn && pay && (warn.compareDocumentPosition(pay) & 4) ? "ok" : "FAIL");
  console.log("  no cyrillic text nodes:", /[А-Яа-яЁё]/.test(doc.body.textContent.replace(/<script[\s\S]*?<\/script>/g, "")) ? (p.name === "en" ? "FAIL" : "ok (ru)") : "ok");
  console.log("  currency shim:", p.name === "en" ? (/FRKN_PLAN_CURRENCY/.test(html) ? "ok" : "FAIL") : "n/a");
  // prices in markup must use the page currency
  const costs = [...doc.querySelectorAll(".cost")].map((e) => e.textContent.trim());
  const wrong = costs.filter((c) => !c.includes(p.expect.currency));
  console.log(`  card costs use ${p.expect.currency}:`, wrong.length ? `FAIL ${wrong.slice(0, 4)}` : `ok (${costs.length} cards, e.g. ${costs.slice(0, 3)})`);
  const prices = [...doc.querySelectorAll("[data-price]")].map((e) => e.dataset.price);
  const nonNumeric = prices.filter((v) => !/^\d+(\.\d+)?$/.test(v));
  console.log("  data-price numeric:", nonNumeric.length ? `FAIL ${nonNumeric.slice(0, 5)}` : `ok (${prices.length})`);
}
