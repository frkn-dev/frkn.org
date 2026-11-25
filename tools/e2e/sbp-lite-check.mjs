// Repro of the lite (67 ₽) SBP flow against the live beta page, with the
// network captured: which request the page sends, what the gateway answers and
// what the UI does with it.
import { JSDOM, VirtualConsole } from "jsdom";

const calls = [];
const vc = new VirtualConsole();
vc.on("error", (m) => calls.push({ console: String(m).slice(0, 160) }));
vc.on("jsdomError", (e) => {
  if (!/Not implemented: navigation/.test(String(e.message))) return;
  calls.push({ nav: e.message.slice(0, 80) });
});

const html = await (await fetch("https://beta.frkn.org/pay/", { cache: "no-store" })).text();
const dom = new JSDOM(html, {
  url: "https://beta.frkn.org/pay/",
  runScripts: "dangerously",
  resources: "usable",
  pretendToBeVisual: true,
  virtualConsole: vc,
  beforeParse(w) {
    w.fetch = async (url, opts = {}) => {
      const u = String(url);
      const rec = { url: u, body: opts.body ? String(opts.body) : null };
      calls.push(rec);
      const res = await fetch(u, { ...opts, headers: opts.headers });
      const clone = res.clone();
      rec.status = res.status;
      try {
        rec.resp = await clone.text();
      } catch {
        rec.resp = null;
      }
      return res;
    };
  },
});

const w = dom.window;
const d = w.document;
await new Promise((r) => setTimeout(r, 5000));

// open the lite card "Зумерам 67₽"
const ALT = process.argv.includes("--alt");
const liteBtn = [...d.querySelectorAll("button.buy-button")].find((b) =>
  ALT ? b.classList.contains("alt") && b.closest("[data-gb=\"1\"]") : b.textContent.includes("67"),
);
console.log("lite button:", liteBtn ? liteBtn.textContent.trim() : "MISSING");
liteBtn?.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));
await new Promise((r) => setTimeout(r, 1200));

const modal = d.getElementById("payment-modal");
console.log("modal open:", modal ? modal.className : "no modal");
console.log("modal title:", (d.getElementById("modal-title")?.textContent || "").replace(/\s+/g, " ").trim());

const sbp = d.getElementById("planta-pay-btn");
console.log("sbp button:", sbp ? `text="${sbp.textContent.trim()}" disabled=${sbp.disabled}` : "MISSING");
sbp?.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));

await new Promise((r) => setTimeout(r, 9000));

console.log("\n--- network ---");
for (const c of calls) {
  if (!c.url) continue;
  console.log(`${c.status ?? "?"} ${c.url}`);
  if (c.body) console.log("   req:", c.body.slice(0, 220));
  if (c.resp) console.log("   res:", c.resp.slice(0, 220));
}
console.log("\n--- ui after 9s ---");
console.log("waiting display:", d.getElementById("planta-waiting")?.style.display);
const err = [...d.querySelectorAll("#error-popup, .popup-overlay")]
  .map((e) => e.textContent.replace(/\s+/g, " ").trim())
  .filter(Boolean);
console.log("error popup:", err.join(" | ").slice(0, 200) || "none");
console.log("popup message:", d.getElementById("popup-message")?.textContent || "n/a");
console.log("console errors:", calls.filter((c) => c.console).map((c) => c.console).join(" | ") || "none");
