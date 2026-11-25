import { JSDOM } from "jsdom";
import fs from "node:fs";

const files = ["../../setup/index.html", "../../en/setup/index.html"];

for (const f of files) {
  // External scripts are stripped: only the inline tab filter matters here.
  const html = fs
    .readFileSync(f, "utf8")
    .replace(/<script[^>]*src=[^>]*><\/script>/g, "");
  const dom = new JSDOM(html, { runScripts: "dangerously" });
  const doc = dom.window.document;

  const rows = [];
  for (const tab of doc.querySelectorAll(".platform-tab")) {
    tab.click();
    const visible = [...doc.querySelectorAll(".setup-card")]
      .filter((c) => !c.classList.contains("hidden"))
      .map((c) => c.querySelector("h2").textContent.trim());
    rows.push(`${tab.dataset.filter.padEnd(8)} -> ${visible.join(", ")}`);
  }
  console.log(f);
  console.log(rows.map((r) => "  " + r).join("\n"));
}
