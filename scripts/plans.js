/**
 * Tariff products for the shop front (pay page and friends).
 *
 * Prices are NOT stored here: they come from the payment gateway catalogue
 * (`GET /payment/plans`, see services/payment-gw API.md §9), which is built
 * from the gateway config. This file only holds what the catalogue cannot know:
 * product names, the included-access copy, visibility and the display currency.
 *
 * Two modes:
 *   - beta (and localhost): the unlimited grid is rendered from the catalogue
 *     and a product selector is shown; every product is selectable.
 *   - production: nothing is re-rendered. Prices of the existing cards are
 *     synced from the catalogue so HTML and gateway never drift apart.
 *     Products other than `standard` stay hidden until the release is enabled.
 *
 * If the catalogue request fails, the page keeps its static HTML prices: the
 * shop must never disappear because the API is down.
 *
 * Currency: the catalogue is in roubles. A page that sells in another currency
 * converts for display only, by declaring the rate before this script:
 *   window.FRKN_PLAN_CURRENCY = { rate: 0.013, symbol: "$", prefix: true }
 * (data-rate / data-symbol / data-prefix on the script tag also work.)
 * The gateway still charges the config price; the rate is presentation only.
 *
 * Exposes `window.FRKNPlans`:
 *   ready            → Promise<catalog|null>
 *   isBeta           → boolean (are non-standard products shown?)
 *   lang             → "ru" | "en" | "fa"
 *   selected         → currently selected product id
 *   products()       → [{id, name, tagline, includes, betaOnly}]
 *   plan(product,days)→ catalogue entry {kind,product,days,price,alt_price?,bonus_days?}
 *   litePlan(gb)     → catalogue entry for a traffic package
 *   meta(id)         → product metadata (or null)
 *   name(id)         → localized product name
 *   includes(id)     → [localized included-access string]
 *   durations(id)    → [catalogue durations sold for a product, ascending]
 *   durationLabel(d) → localized duration label
 *   money(rub)       → price formatted in the page's display currency
 *   renewOptions(selectEl, id, currentValue) → refill a renewal <select>
 *   select(id)       → switch the displayed product
 */
(function () {
  "use strict";

  var langMatch = window.location.pathname.match(/^\/(en|fa)(\/|$)/);
  var LANG = langMatch ? langMatch[1] : "ru";

  // Display currency: the catalogue is in roubles, a page may show another
  // unit. Declared by the page before this script:
  //   window.FRKN_PLAN_CURRENCY = { rate: 0.013, symbol: "$", prefix: true };
  // (data-rate / data-symbol / data-prefix on this script tag also work.)
  var currency = window.FRKN_PLAN_CURRENCY || null;
  if (!currency) {
    var el = document.currentScript;
    if (el && el.dataset && el.dataset.rate) {
      currency = {
        rate: parseFloat(el.dataset.rate),
        symbol: el.dataset.symbol,
        prefix: el.dataset.prefix === "true",
      };
    }
  }
  var rate = currency && currency.rate ? currency.rate : 1;
  var symbol = (currency && currency.symbol) || "₽";
  var prefix = !!(currency && currency.prefix);
  var decimals = rate === 1 ? 0 : 2;

  // Same base rules as the pay page's inline `apiFetch`.
  var host = window.location.hostname;
  var isLocal = host === "localhost" || host === "127.0.0.1";
  var onIon = host.endsWith(".onion");
  var API_BASE = isLocal
    ? "http://localhost:3006"
    : onIon
      ? window.location.origin + "/api"
      : "https://api.frkn.org";

  // Non-standard products are beta-only for Release 1: the gateway can sell
  // them, but production must not advertise them yet.
  var isBeta = isLocal || host.indexOf("beta.") === 0;

  // Product order is the display order. `id` is the wire value accepted by the
  // gateway and stored in fcore (`standard`, `gaming`, ...).
  var PRODUCTS = [
    {
      id: "standard",
      betaOnly: false,
      ru: {
        name: "Стандарт",
        tagline: "Комфорт для ежедневного использования: YouTube и соцсети",
        includes: [
          "Безлимитный трафик",
          "Высокая скорость",
          "Любое количество устройств",
        ],
      },
      en: {
        name: "Standard",
        tagline: "Comfort for everyday use: YouTube and social media",
        includes: [
          "Unlimited traffic",
          "High speed",
          "Any number of devices",
        ],
      },
    },
    {
      id: "gaming",
      betaOnly: true,
      ru: {
        name: "Игровой",
        tagline: "Серверы в Турции",
        includes: ["Игровые серверы в Турции", "Безлимитный трафик"],
      },
      en: {
        name: "Gaming",
        tagline: "Servers in Turkey",
        includes: ["Gaming servers in Turkey", "Unlimited traffic"],
      },
    },
    {
      id: "bs-prem",
      betaOnly: true,
      ru: {
        name: "Белые Слоны",
        tagline: "Работает там, где ничего не работает",
        includes: ["Серверы Белые Слоны", "Безлимитный трафик"],
      },
      en: {
        name: "White Elephants",
        tagline: "Works where nothing else does",
        includes: ["White Elephants servers", "Unlimited traffic"],
      },
    },
    {
      id: "standard-gaming",
      betaOnly: true,
      ru: {
        name: "Стандарт + Игровой",
        tagline: "Стандарт и серверы в Турции",
        includes: ["Все обычные серверы", "Игровые серверы"],
      },
      en: {
        name: "Standard + Gaming",
        tagline: "Standard and Turkey servers",
        includes: ["All regular servers", "Gaming servers"],
      },
    },
    {
      id: "standard-bs-prem",
      betaOnly: true,
      ru: {
        name: "Стандарт + Белые Слоны",
        tagline: "Стандарт и Белые Слоны",
        includes: ["Все обычные серверы", "Серверы Белые Слоны"],
      },
      en: {
        name: "Standard + White Elephants",
        tagline: "Standard and White Elephants",
        includes: ["All regular servers", "White Elephants servers"],
      },
    },
    {
      id: "full",
      betaOnly: true,
      ru: {
        name: "Полный",
        tagline: "Все серверы сразу",
        includes: [
          "Все обычные серверы",
          "Игровые серверы",
          "Серверы Белые Слоны",
        ],
      },
      en: {
        name: "Full",
        tagline: "Every server at once",
        includes: [
          "All regular servers",
          "Gaming servers",
          "White Elephants servers",
        ],
      },
    },
  ];

  var TEXT = {
    ru: {
      badge: "БЕЗЛИМИТ",
      regularPrice: "Обычная цена",
      choose: "Выбрать тариф",
      chooseShort: "Выбрать",
      productLabel: "Тариф",
      perDay: "/день",
      premiumName: "Premium",
      premiumTagline: "Выделенный IP",
    },
    en: {
      badge: "UNLIMITED",
      regularPrice: "Regular price",
      choose: "Choose plan",
      chooseShort: "Choose",
      productLabel: "Plan",
      perDay: "/day",
      premiumName: "Premium",
      premiumTagline: "Dedicated IP",
    },
  };

  var DURATIONS = {
    ru: {
      3: "3 дня",
      7: "7 дней",
      14: "14 дней",
      30: "1 месяц",
      90: "3 месяца",
      180: "6 месяцев",
      365: "1 год",
    },
    en: {
      3: "3 days",
      7: "7 days",
      14: "14 days",
      30: "1 month",
      90: "3 months",
      180: "6 months",
      365: "1 year",
    },
  };

  function strings() {
    return TEXT[LANG] || TEXT.en;
  }

  function localized(product) {
    return product[LANG] || product.en;
  }

  function meta(id) {
    for (var i = 0; i < PRODUCTS.length; i++) {
      if (PRODUCTS[i].id === id) return PRODUCTS[i];
    }
    return null;
  }

  function nameOf(id) {
    var product = meta(id);
    return product ? localized(product).name : id;
  }

  function includes(id) {
    var product = meta(id);
    return product ? localized(product).includes.slice() : [];
  }

  function durationLabel(days) {
    var table = DURATIONS[LANG] || DURATIONS.en;
    return table[days] || days + " " + strings().perDay.replace("/", "");
  }

  // "3 дня доступа" / "3 days of access".
  function accessLine(days) {
    if (LANG === "ru") {
      var mod10 = days % 10;
      var mod100 = days % 100;
      var word = "дней";
      if (mod10 === 1 && mod100 !== 11) word = "день";
      else if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) word = "дня";
      return days + " " + word + " доступа";
    }
    return days + (days === 1 ? " day" : " days") + " of access";
  }

  // Display amount: catalogue value is in roubles, page may show another unit.
  function moneyValue(rub, fractionDigits) {
    var text = (rub * rate).toFixed(fractionDigits);
    return prefix ? symbol + text : text + symbol;
  }

  function money(rub) {
    return moneyValue(rub, decimals);
  }

  // Price written into the DOM. The pay page's own modal and promo code print
  // `data-price` with a hardcoded symbol, so it must stay in the page's unit —
  // the same unit as the static markup it replaces. Payments are created from
  // duration + product, never from this value.
  function domPrice(rub) {
    return rate === 1 ? String(rub) : (rub * rate).toFixed(decimals);
  }

  function perDay(rub, days) {
    if (days <= 0) return "";
    return "≈ " + moneyValue(rub / days, 1) + strings().perDay;
  }

  var catalog = null;
  var selected = "standard";

  function plan(product, days) {
    if (!catalog) return null;
    for (var i = 0; i < catalog.length; i++) {
      var p = catalog[i];
      if (p.kind !== "lite" && p.product === product && p.days === days) return p;
    }
    return null;
  }

  function litePlan(gb) {
    if (!catalog) return null;
    for (var i = 0; i < catalog.length; i++) {
      var p = catalog[i];
      if (p.kind === "lite" && p.traffic_gib === gb) return p;
    }
    return null;
  }

  function soldDurations(id) {
    if (!catalog) return [];
    var days = [];
    for (var i = 0; i < catalog.length; i++) {
      var p = catalog[i];
      if (p.kind !== "lite" && p.product === id) days.push(p.days);
    }
    return days.sort(function (a, b) {
      return a - b;
    });
  }

  // --- rendering ---------------------------------------------------------

  function ensureStyles() {
    if (document.getElementById("frkn-plans-styles")) return;
    var style = document.createElement("style");
    style.id = "frkn-plans-styles";
    style.textContent = [
      ".product-chips{display:flex;flex-direction:column;gap:10px;margin:0 auto 22px;max-width:1240px;padding:0 16px}",
      ".chips-row{display:grid;gap:10px}",
      ".chips-row-main{grid-template-columns:repeat(4,minmax(0,1fr))}",
      ".chips-row-compact{grid-template-columns:repeat(3,minmax(0,1fr));max-width:720px;margin:0 auto;width:100%}",
      ".chips-row-compact .product-chip{padding:8px 12px}",
      ".chips-row-compact .chip-name{font-size:13px}",
      ".chips-row-compact .chip-tagline{font-size:11px}",
      ".product-chip{display:flex;flex-direction:column;gap:2px;align-items:flex-start;min-width:0;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:10px 16px;color:#e8e8e8;cursor:pointer;font:inherit;text-align:left;transition:border-color .15s,background .15s,box-shadow .15s}",
      ".product-chip:hover{border-color:rgba(255,255,255,.3)}",
      ".product-chip.active{border-color:#22c55e;background:rgba(34,197,94,.16);box-shadow:inset 0 0 0 1px rgba(34,197,94,.35)}",
      ".product-chip-link{text-decoration:none}",
      ".product-chip .chip-name{font-weight:600;font-size:15px}",
      ".product-chip .chip-tagline{font-size:12px;color:#9aa0a6;line-height:1.25}",
      "@media (max-width:900px){.chips-row-main{grid-template-columns:repeat(2,minmax(0,1fr))}}",
      "@media (max-width:620px){.chips-row-main,.chips-row-compact{grid-template-columns:repeat(2,minmax(0,1fr))}}",
      "#product-includes{margin:8px 0 0;padding:0;list-style:none;font-size:13px;color:#9aa0a6}",
      "#product-includes li{margin:2px 0}",
    ].join("");
    document.head.appendChild(style);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function featuresHtml(productId) {
    return includes(productId)
      .map(function (line) {
        return "<li>" + escapeHtml(line) + "</li>";
      })
      .join("");
  }

  function cardHtml(p, index) {
    var t = strings();
    var cls = index === 1 ? "price-card recommended" : "price-card accent-border";
    return (
      '<div class="' +
      cls +
      '" data-duration="' +
      p.days +
      '" data-price="' +
      domPrice(p.price) +
      '" data-product="' +
      escapeHtml(p.product) +
      '">' +
      '<span class="unlimited-badge">∞ ' +
      escapeHtml(t.badge) +
      "</span>" +
      "<h3>" +
      escapeHtml(durationLabel(p.days)) +
      "</h3>" +
      '<div class="duration">' +
      escapeHtml(accessLine(p.days)) +
      "</div>" +
      '<div class="cost-wrapper"><span class="old-price"></span>' +
      '<div class="cost">' +
      money(p.price) +
      "</div></div>" +
      '<div class="savings-text regular">' +
      escapeHtml(t.regularPrice) +
      "</div>" +
      '<div class="price-per-day">' +
      perDay(p.price, p.days) +
      "</div>" +
      '<button class="buy-button" data-duration="' +
      p.days +
      '" data-price="' +
      domPrice(p.price) +
      '" data-product="' +
      escapeHtml(p.product) +
      '">' +
      escapeHtml(t.choose) +
      "</button>" +
      '<ul class="feature-list">' +
      featuresHtml(p.product) +
      "</ul>" +
      "</div>"
    );
  }

  function compactCardHtml(p) {
    var t = strings();
    return (
      '<div class="price-card compact" data-duration="' +
      p.days +
      '" data-price="' +
      domPrice(p.price) +
      '" data-product="' +
      escapeHtml(p.product) +
      '">' +
      '<span class="unlimited-badge">∞ ' +
      escapeHtml(t.badge) +
      "</span>" +
      "<h3>" +
      escapeHtml(durationLabel(p.days)) +
      "</h3>" +
      '<div class="duration">' +
      escapeHtml(accessLine(p.days)) +
      "</div>" +
      '<div class="cost-wrapper"><span class="old-price"></span>' +
      '<div class="cost">' +
      money(p.price) +
      "</div></div>" +
      '<div class="price-per-day">' +
      perDay(p.price, p.days) +
      "</div>" +
      '<button class="buy-button" data-duration="' +
      p.days +
      '" data-price="' +
      domPrice(p.price) +
      '" data-product="' +
      escapeHtml(p.product) +
      '">' +
      escapeHtml(t.chooseShort) +
      "</button>" +
      "</div>"
    );
  }

  function selectableProducts() {
    var out = [];
    for (var i = 0; i < PRODUCTS.length; i++) {
      var product = PRODUCTS[i];
      if (product.betaOnly && !isBeta) continue;
      // Only offer a product the gateway actually sells.
      if (soldDurations(product.id).length === 0) continue;
      out.push(product);
    }
    return out;
  }

  function chipHtml(product) {
    var info = localized(product);
    var active = product.id === selected;
    return (
      '<button type="button" class="product-chip' +
      (active ? " active" : "") +
      '" data-product="' +
      escapeHtml(product.id) +
      '" aria-pressed="' +
      active +
      '">' +
      '<span class="chip-name">' +
      escapeHtml(info.name) +
      "</span>" +
      '<span class="chip-tagline">' +
      escapeHtml(info.tagline) +
      "</span>" +
      "</button>"
    );
  }

  // Premium is sold through Telegram, not the gateway: same card shape, but a
  // link to the landing instead of a selectable product.
  function premiumChipHtml() {
    var t = strings();
    var href = LANG === "ru" ? "/premium/" : "/en/premium/";
    return (
      '<a class="product-chip product-chip-link" href="' +
      href +
      '"><span class="chip-name">' +
      escapeHtml(t.premiumName) +
      " ↗</span>" +
      '<span class="chip-tagline">' +
      escapeHtml(t.premiumTagline) +
      "</span></a>"
    );
  }

  function renderChips(container) {
    var chips = selectableProducts();
    if (chips.length < 2) {
      container.innerHTML = "";
      container.style.display = "none";
      return;
    }
    // Inline style, because the markup starts with display:none.
    container.style.display = "flex";
    container.setAttribute("aria-label", strings().productLabel);

    // Base products on top (next to the Premium link), bundles on a smaller
    // second row. A product is "base" if it is sold on its own.
    var base = [];
    var bundles = [];
    for (var i = 0; i < chips.length; i++) {
      var id = chips[i].id;
      if (id === "standard" || id === "gaming" || id === "bs-prem") base.push(chips[i]);
      else bundles.push(chips[i]);
    }

    container.innerHTML =
      '<div class="chips-row chips-row-main">' +
      base.map(chipHtml).join("") +
      premiumChipHtml() +
      "</div>" +
      (bundles.length
        ? '<div class="chips-row chips-row-compact">' +
          bundles.map(chipHtml).join("") +
          "</div>"
        : "");

    container.querySelectorAll("button.product-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        selectProduct(chip.dataset.product);
      });
    });
  }

  function render() {
    var chips = document.getElementById("product-chips");
    if (chips) {
      ensureStyles();
      renderChips(chips);
    }

    var grid = document.querySelector(".pricing-grid-main");
    if (!grid) return;

    var days = soldDurations(selected);
    var main = days.filter(function (d) {
      return d >= 30;
    });
    var extra = days.filter(function (d) {
      return d < 30;
    });

    grid.innerHTML = main
      .map(function (d, i) {
        return cardHtml(plan(selected, d), i);
      })
      .join("");

    var extraGrid = document.querySelector(".pricing-grid-extra");
    var extraToggle = document.getElementById("extra-options-toggle");
    var extraBlock = document.getElementById("extra-options");
    if (extraGrid) {
      extraGrid.innerHTML = extra
        .map(function (d) {
          return compactCardHtml(plan(selected, d));
        })
        .join("");
    }
    // The short plans (3/7/14 days) only exist for the classic product.
    var hasExtra = extra.length > 0;
    if (extraToggle && extraToggle.parentElement) {
      extraToggle.parentElement.style.display = hasExtra ? "" : "none";
    }
    if (extraBlock && !hasExtra) extraBlock.classList.add("hidden");
  }

  function selectProduct(id) {
    if (!meta(id) || soldDurations(id).length === 0) return;
    if (selected === id) return;
    selected = id;
    render();
    // Cards were replaced: the page re-applies its URL promo (if any).
    window.dispatchEvent(
      new CustomEvent("frkn:plans-rendered", { detail: { product: selected } }),
    );
  }

  // Fill a renewal <select> with the durations a product is sold for and the
  // catalogue prices — a renewal always stays on the subscription's product, so
  // the page must show that product's prices (returns the value to keep).
  function renewOptions(selectEl, product, currentValue) {
    var days = soldDurations(product);
    if (!selectEl || !days.length) return null;
    var keep = days.indexOf(Number(currentValue)) !== -1 ? Number(currentValue) : null;
    if (keep === null) keep = days.indexOf(30) !== -1 ? 30 : days[days.length - 1];
    selectEl.innerHTML = days
      .map(function (d) {
        var entry = plan(product, d);
        return (
          '<option value="' +
          d +
          '" data-price="' +
          entry.price +
          '">' +
          escapeHtml(durationLabel(d)) +
          " — " +
          money(entry.price) +
          "</option>"
        );
      })
      .join("");
    selectEl.value = String(keep);
    return keep;
  }

  // --- non-beta / fallback: keep HTML prices in sync with the gateway -----

  function syncCardPrices() {
    document.querySelectorAll(".price-card").forEach(function (card) {
      var btn = card.querySelector(".buy-button");
      if (!btn) return;
      var duration = parseInt(btn.dataset.duration, 10);
      var gb = btn.dataset.gb ? parseInt(btn.dataset.gb, 10) : null;
      var entry = gb
        ? litePlan(gb)
        : plan(btn.dataset.product || "standard", duration);
      if (!entry) return;

      card.dataset.price = domPrice(entry.price);
      var cost = card.querySelector(".cost");
      if (cost) cost.textContent = money(entry.price);

      var baseBtn = card.querySelector('.buy-button:not([data-alt="true"])');
      if (baseBtn) {
        baseBtn.dataset.price = domPrice(entry.price);
        baseBtn.textContent = replaceAmount(baseBtn.textContent, entry.price);
      }

      // "Millennial" tier, when the config defines it.
      var altBtn = card.querySelector('.buy-button[data-alt="true"]');
      if (altBtn && entry.alt_price) {
        altBtn.dataset.price = domPrice(entry.alt_price);
        altBtn.textContent = replaceAmount(altBtn.textContent, entry.alt_price);
      }

      var perDayEl = card.querySelector(".price-per-day");
      if (perDayEl && duration > 0) perDayEl.textContent = perDay(entry.price, duration);
    });
  }

  // Rewrite the amount inside a button label ("Зумерам 67₽", "Millennials $0.90").
  function replaceAmount(text, rub) {
    var amount = money(rub);
    var pattern = new RegExp("\\d+(?:[.,]\\d+)?" + (prefix ? "" : symbol));
    if (prefix) pattern = new RegExp(symbol + "\\d+(?:[.,]\\d+)?");
    return text.replace(pattern, amount);
  }

  // --- bootstrap ---------------------------------------------------------

  function fetchCatalog() {
    return fetch(API_BASE + "/payment/plans", {
      mode: "cors",
      credentials: "omit",
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        return Array.isArray(data) ? data : null;
      })
      .catch(function (err) {
        console.warn("[plans] catalogue unavailable, using static prices", err);
        return null;
      });
  }

  function bootstrap() {
    var isPayPage = !!document.querySelector(".pricing-grid-main");
    if (!isPayPage) return;
    ensureStyles();
    // Re-rendering the grid needs the catalogue — `plan()` answers null
    // without it, which would wipe the cards. No catalogue (the shop front
    // deployed before the gateway): keep the static HTML prices, and leave the
    // product selector out: chips with no prices behind them are worse than
    // none. `syncCardPrices` below is a no-op in that case.
    if (document.getElementById("product-chips") && isBeta && catalog) render();
    // Traffic (lite) packages are never re-rendered, only price-synced.
    syncCardPrices();
  }

  var ready = fetchCatalog().then(function (data) {
    catalog = data;
    // The page's markup sits above this script, so the grid already exists.
    bootstrap();
    return catalog;
  });

  window.FRKNPlans = {
    ready: ready,
    isBeta: isBeta,
    lang: LANG,
    get selected() {
      return selected;
    },
    products: selectableProducts,
    plan: plan,
    litePlan: litePlan,
    meta: meta,
    name: nameOf,
    includes: includes,
    durations: soldDurations,
    durationLabel: durationLabel,
    money: money,
    renewOptions: renewOptions,
    select: selectProduct,
  };
})();
