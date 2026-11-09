/**
 * Homepage live data: ping and the list of countries published by the api.
 *
 * Ping is measured against the api healthcheck (the landing page has no VPN
 * tunnel): the first request is a warm-up that pays DNS + TLS, the second one
 * is what the visitor sees. Countries come from GET /status and are grouped by
 * the unique country code of online nodes. A failed request leaves an honest
 * placeholder instead of inventing data.
 */
(function () {
  "use strict";

  var lang = document.documentElement.lang === "en" ? "en" : "ru";
  var unit = lang === "en" ? "ms" : "мс";

  /* ---------- ping ---------- */
  var pingEl = document.getElementById("nodePing");
  var pingRunning = false;

  function setPing(value) {
    if (pingEl) pingEl.textContent = value;
  }

  function probe() {
    return new Promise(function (resolve, reject) {
      var started = performance.now();
      var controller = new AbortController();
      var timeout = setTimeout(function () {
        controller.abort();
      }, 5000);

      fetch("https://api.frkn.org/healthcheck?ts=" + Date.now(), {
        cache: "no-store",
        signal: controller.signal,
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          resolve(Math.max(1, Math.round(performance.now() - started)));
        })
        .catch(reject)
        .then(function () {
          clearTimeout(timeout);
        });
    });
  }

  function measurePing() {
    if (!pingEl || pingRunning) return;
    pingRunning = true;

    probe()
      .catch(function () {
        return null;
      })
      .then(function () {
        return probe();
      })
      .then(function (ms) {
        setPing(String(ms));
        pingEl.setAttribute("aria-label", ms + " " + unit);
      })
      .catch(function () {
        setPing("—");
      })
      .then(function () {
        pingRunning = false;
      });
  }

  measurePing();
  setInterval(measurePing, 30000);

  /* ---------- countries ---------- */
  var listEl = document.getElementById("countryList");
  var countEl = document.getElementById("countryCount");

  if (!listEl) return;

  var regionNames = null;
  try {
    regionNames = new Intl.DisplayNames([lang], { type: "region" });
  } catch (err) {
    regionNames = null;
  }

  // The api has a few non-ISO / umbrella codes. Keep the public label short
  // and readable instead of showing a bare four-letter code.
  var countryAliases = {
    EST: { ru: "Эстония", en: "Estonia" },
    EU: { ru: "Европа", en: "Europe" },
    KG: { ru: "Кыргызстан", en: "Kyrgyzstan" },
  };

  function countryName(code) {
    var alias = countryAliases[code];
    if (alias) return alias[lang];
    if (!regionNames) return "";
    try {
      var name = regionNames.of(code);
      return name && name !== code ? name : "";
    } catch (err) {
      return "";
    }
  }

  function pluralCountries(n) {
    if (lang === "en") return n + (n === 1 ? " country" : " countries");
    var mod10 = n % 10;
    var mod100 = n % 100;
    var word = "стран";
    if (mod10 === 1 && mod100 !== 11) word = "страна";
    else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
      word = "страны";
    }
    return n + " " + word;
  }

  function showCountries(entries) {
    listEl.textContent = "";

    if (!entries.length) {
      var empty = document.createElement("span");
      empty.className = "node-country-empty";
      empty.textContent = lang === "en" ? "no data" : "нет данных";
      listEl.appendChild(empty);
      if (countEl) countEl.textContent = "";
      return;
    }

    entries.forEach(function (entry) {
      var pill = document.createElement("span");
      pill.className = "node-country";
      pill.title = countryName(entry.code) || entry.code;

      var code = document.createElement("b");
      code.textContent = entry.code;
      pill.appendChild(code);

      var name = countryName(entry.code);
      if (name) {
        var label = document.createElement("span");
        label.textContent = name;
        pill.appendChild(label);
      }

      listEl.appendChild(pill);
    });

    if (countEl) countEl.textContent = pluralCountries(entries.length);
  }

  function loadCountries() {
    var controller = new AbortController();
    var timeout = setTimeout(function () {
      controller.abort();
    }, 6000);

    fetch("https://api.frkn.org/status?ts=" + Date.now(), {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (payload) {
        var nodes = Array.isArray(payload.response) ? payload.response : [];
        var counts = {};

        nodes.forEach(function (node) {
          if (node.status !== "Online" || !node.country) return;
          counts[node.country] = (counts[node.country] || 0) + 1;
        });

        var entries = Object.keys(counts)
          .map(function (code) {
            return { code: code, count: counts[code] };
          })
          .sort(function (a, b) {
            if (b.count !== a.count) return b.count - a.count;
            return a.code.localeCompare(b.code);
          });

        showCountries(entries);
      })
      .catch(function () {
        showCountries([]);
      })
      .then(function () {
        clearTimeout(timeout);
      });
  }

  loadCountries();

  /* ---------- paid clients ---------- */
  var paidCounter = document.getElementById("paidCounter");
  var paidCount = document.getElementById("paidCount");
  var numberFormat = new Intl.NumberFormat(lang === "en" ? "en-US" : "ru-RU", {
    maximumFractionDigits: 0,
  });

  function loadPaidCount() {
    if (!paidCounter || !paidCount) return;

    fetch("https://dashboard.frkn.org/api/public/stats", { cache: "default" })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (payload) {
        var paid = Number(payload.paid);
        if (!Number.isFinite(paid) || paid <= 0) return;
        paidCount.textContent = numberFormat.format(paid);
        paidCounter.hidden = false;
      })
      .catch(function () {
        // Keep the counter hidden when the public aggregate is unavailable.
      });
  }

  loadPaidCount();
})();
