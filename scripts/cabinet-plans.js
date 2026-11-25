/* Cabinet plan block: one row per plan from `GET /subscription/{id}`.plans[].
 *
 * The row's button never guesses a price or a product. It asks the api —
 * `POST /subscription/{id}/buy` — which answers two questions: may this plan be
 * sold right now (503 `no_live_shard` / `plan_not_configured`, rendered as a
 * human sentence) and what the exact payment-gw call looks like
 * (`payment.routes` + `payment.body`). The price stays in the gateway's
 * `[[app.plans]]`; the cabinet only forwards that body.
 *
 * Super Duper (lite) is sold by traffic package: the row carries a small
 * picker (1/5/10/50 GB, the packages of the `/pay` key catalog), the chosen
 * `traffic_gib` rides into `/buy` and from there into the gateway body — the
 * gateway prices exactly that package and its webhook fulfils the purchase
 * through `POST /subscription/{id}/plan`. The day-based renewal path
 * (no `plan` field) is untouched.
 */
(function () {
  "use strict";

  var PLAN_GATEWAY_READY = true;

  /* Traffic packages sold for Super Duper: the small steps of the `/pay`
   * lite keys plus the bulk packs. The gateway prices each of them from its
   * `[[app.plans]] kind = "lite"` rows — a package missing there is refused
   * at checkout, so this list and the gateway config must move together.
   * The price is never shown here — the gateway owns it. */
  var LITE_PACKAGES = [1, 5, 10, 50, 100, 300, 500];

  var LANG =
    (document.documentElement.lang || "ru").toLowerCase().indexOf("en") === 0
      ? "en"
      : "ru";

  var T = {
    ru: {
      title: "Тарифы",
      activeUntil: "активен до",
      activePill: "активен",
      notConnected: "не подключён",
      comingSoon: "Скоро будет доступен",
      traffic: "Трафик",
      unlimited: "без лимита",
      addMore: "Докупить",
      buy: "Купить Super Duper",
      connect: "Подключить",
      soon: "Скоро",
      soonNote: "Оплата этого тарифа ещё не подключена — скоро.",
      noServersLite: "Super Duper скоро появится — идёт подготовка серверов",
      noServers:
        "Сейчас нет свободных серверов для этого тарифа. Попробуйте позже.",
      notSold: "Этот тариф сейчас не продаётся",
      renewHint: "Продление Standard откроется в окне оплаты",
      creating: "Создаём платёж…",
      failed: "Не удалось начать оплату",
      sbp: "СБП",
      package: "Пакет",
      gbShort: "ГБ",
      units: ["Б", "КБ", "МБ", "ГБ", "ТБ"],
      locale: "ru-RU",
    },
    en: {
      title: "Plans",
      activeUntil: "active until",
      activePill: "active",
      notConnected: "not connected",
      comingSoon: "Coming soon",
      traffic: "Traffic",
      unlimited: "unlimited",
      addMore: "Add more",
      buy: "Buy Super Duper",
      connect: "Connect",
      soon: "Soon",
      soonNote: "Checkout for this plan is not live yet — soon.",
      noServersLite: "Super Duper is coming soon — servers are being prepared",
      noServers: "No free servers for this plan right now. Try again later.",
      notSold: "This plan is not on sale right now",
      renewHint: "Standard renewal opens in the payment dialog",
      creating: "Creating payment…",
      failed: "Could not start the payment",
      sbp: "SBP",
      package: "Package",
      gbShort: "GB",
      units: ["B", "KB", "MB", "GB", "TB"],
      locale: "en-GB",
    },
  }[LANG];

  var lastState = null;

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function apiBase() {
    try {
      if (typeof API_BASE !== "undefined") return API_BASE;
    } catch (e) {}
    return window.location.hostname.endsWith(".onion")
      ? window.location.origin + "/api"
      : "https://api.frkn.org";
  }

  function paymentBase() {
    try {
      if (typeof PAYMENT_API_BASE !== "undefined") return PAYMENT_API_BASE;
    } catch (e) {}
    return apiBase();
  }

  function fmtBytes(bytes) {
    var value = Number(bytes) || 0;
    if (value <= 0) return "0 " + T.units[3];
    var i = 0;
    while (value >= 1024 && i < T.units.length - 1) {
      value /= 1024;
      i++;
    }
    var shown = i === 0 || value >= 10 ? Math.round(value) : value.toFixed(1);
    return shown + " " + T.units[i];
  }

  function fmtDate(iso) {
    var date = new Date(iso);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString(T.locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function planIcon(plan) {
    var wrap = el("div", "plan-icon");
    var svg =
      plan === "lite"
        ? // bolt — Super Duper buys traffic bursts
          '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg>'
        : // shield — Standard is the everyday plan
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7 3v6c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6l7-3z"/></svg>';
    wrap.innerHTML = svg;
    return wrap;
  }

  function buttonLabel(plan) {
    if (plan.plan === "lite") return plan.active ? T.addMore : T.buy;
    return plan.active ? T.addMore : T.connect;
  }

  /* Why the button cannot be pressed right now, or "" when it can. */
  function blockReason(plan) {
    if (!plan.purchasable) {
      return plan.plan === "lite" ? T.noServersLite : T.notSold;
    }
    if (!PLAN_GATEWAY_READY && plan.plan !== "standard") return T.soon;
    return "";
  }

  function trafficLine(plan) {
    if (plan.traffic_limit == null) {
      return plan.active ? T.traffic + ": " + T.unlimited : "";
    }
    var line =
      T.traffic +
      ": " +
      fmtBytes(plan.traffic_used) +
      " / " +
      fmtBytes(plan.traffic_limit);
    return line;
  }

  function row(plan, subId) {
    var root = el("div", "plan-row");
    root.setAttribute("data-plan", plan.plan || "");

    // Why this plan cannot be bought right now: shown as part of the plan
    // description, not as a floating note, so the row reads top to bottom.
    var reason = blockReason(plan);

    root.appendChild(planIcon(plan.plan));

    var body = el("div", "plan-body");
    var titleRow = el("div", "plan-title-row");
    titleRow.appendChild(el("span", "plan-title", plan.title || plan.plan));
    if (plan.active) {
      titleRow.appendChild(el("span", "plan-pill", T.activePill));
    }
    body.appendChild(titleRow);

    // A plan that is not on sale yet says so: "не подключён" read as a fault of
    // the account, while Super Duper is simply not released.
    var isSoonPlan = String(plan.plan || "").toLowerCase() === "lite"
      || String(plan.plan || "").toLowerCase() === "super-duper";
    var statusText = plan.active
      ? T.activeUntil + " " + fmtDate(plan.expires_at)
      : (isSoonPlan ? T.comingSoon : T.notConnected);
    body.appendChild(el("div", "plan-status", statusText));

    var traffic = trafficLine(plan);
    if (traffic) {
      var trafficRow = el("div", "plan-traffic", traffic);
      if (plan.traffic_limit != null && plan.traffic_limit > 0) {
        var bar = el("div", "plan-bar");
        var fill = el("div", "plan-bar-fill");
        var pct = Math.min(
          100,
          Math.max(0, (Number(plan.traffic_used) / plan.traffic_limit) * 100),
        );
        fill.style.width = pct.toFixed(1) + "%";
        bar.appendChild(fill);
        trafficRow.appendChild(bar);
      }
      body.appendChild(trafficRow);
    }

    var reasonEl = null;
    if (reason) {
      reasonEl = el("div", "plan-reason", reason);
      body.appendChild(reasonEl);
    }

    var note = el("div", "plan-note");
    body.appendChild(note);
    root.appendChild(body);

    var actions = el("div", "plan-actions");

    // Super Duper is sold by package: the picker sits next to the button and
    // rides into `/buy`, so the gateway charge matches what the row shows.
    var packSelect = null;
    if (PLAN_GATEWAY_READY && plan.plan === "lite" && !reason) {
      packSelect = el("select", "plan-pack-select");
      packSelect.setAttribute("aria-label", T.package);
      LITE_PACKAGES.forEach(function (gib, idx) {
        var opt = el("option", null, gib + " " + T.gbShort);
        opt.value = String(gib);
        if (idx === 1) opt.selected = true; // 5 GB — the everyday middle
        packSelect.appendChild(opt);
      });
      actions.appendChild(packSelect);
    }

    var btn = el("button", "plan-buy-btn");
    btn.type = "button";
    btn.textContent = buttonLabel(plan);

    if (reason) {
      btn.disabled = true;
      btn.setAttribute("title", reason);
      btn.setAttribute("aria-disabled", "true");
    }

    btn.addEventListener("click", function () {
      if (btn.disabled) return;
      startPurchase(plan, btn, note, subId, "platega", reasonEl, packSelect);
    });
    actions.appendChild(btn);

    // Only Platega is offered in the cabinet: the second provider (SBP/planta)
    // stays in payment.routes but is not shown to users.

    root.appendChild(actions);

    return root;
  }

  function refusalMessage(payload, plan) {
    var inner = payload && payload.response ? payload.response : payload || {};
    var code = inner.error;
    if (code === "no_live_shard") {
      return plan.plan === "lite" ? T.noServersLite : T.noServers;
    }
    if (code === "plan_not_configured") return T.notSold;
    return T.failed;
  }

  function newTraceId() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 3) | 8;
      return v.toString(16);
    });
  }

  async function pollPlanta(txid) {
    var MAX_ATTEMPTS = 20;
    for (var attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        await new Promise(function (resolve) {
          setTimeout(resolve, 3000);
        });
      }
      var res = await fetch(paymentBase() + "/payment/check/" + txid);
      var data = await res.json().catch(function () {
        return {};
      });
      if (data.paymentUrl) return data.paymentUrl;
      if (data.status === "failed" || data.status === "cancelled") {
        throw new Error(T.failed);
      }
    }
    throw new Error(T.failed);
  }

  /* Starts the gateway payment from the api's `payment` description — the body
   * is forwarded verbatim, so no price or product is ever built here. */
  async function pay(payment, provider) {
    var route = payment.routes && payment.routes[provider];
    if (!route) throw new Error(T.failed);
    var res = await fetch(paymentBase() + route, {
      method: payment.method || "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Trace-Id": newTraceId(),
      },
      body: JSON.stringify(payment.body || {}),
    });
    var data = await res.json().catch(function () {
      return {};
    });
    if (!res.ok) throw new Error(data.error || T.failed);

    if (data.transactionId) {
      try {
        localStorage.setItem("frkn_last_transaction_id", data.transactionId);
      } catch (e) {}
    }
    if (payment.body && payment.body.subscription_id) {
      try {
        localStorage.setItem(
          "frkn_last_subscription_id",
          payment.body.subscription_id,
        );
      } catch (e) {}
    }

    if (provider === "planta") {
      if (!data.transactionId) throw new Error(T.failed);
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      window.location.href = await pollPlanta(data.transactionId);
      return;
    }
    if (data.status === "PENDING" && data.url) {
      window.location.href = data.url;
      return;
    }
    throw new Error(T.failed);
  }

  function openRenewDialog() {
    var renew = document.getElementById("renew-modal");
    if (renew) renew.classList.remove("hidden");
  }

  async function startPurchase(plan, btn, note, subId, provider, reasonEl, select) {
    note.textContent = "";
    var label = btn.textContent;
    var refused = false;
    btn.disabled = true;
    btn.textContent = T.creating;
    try {
      var buyBody = { plan: plan.plan };
      if (plan.plan === "lite") {
        // Super Duper is priced by the package: the picker decides what the
        // gateway charges, so the row cannot buy «some» traffic.
        var gib = select ? parseInt(select.value, 10) : 0;
        if (!(gib > 0)) {
          note.textContent = T.failed;
          refused = true;
          return;
        }
        buyBody.traffic_gib = gib;
      }
      var res = await fetch(apiBase() + "/subscription/" + subId + "/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buyBody),
      });
      var payload = await res.json().catch(function () {
        return {};
      });
      if (!res.ok) {
        var message = refusalMessage(payload, plan);
        // The row already explains the same thing when the plan was listed as
        // unsellable: replace that reason instead of printing it twice.
        if (reasonEl && reasonEl.parentNode) {
          reasonEl.textContent = message;
        } else {
          note.textContent = message;
        }
        refused = true;
        return;
      }
      var body = payload.response || payload;
      var payment = body && body.payment;
      if (!PLAN_GATEWAY_READY || !payment || !payment.routes) {
        // The api can place the buyer; the gateway cannot take `plan` yet.
        if (plan.plan === "standard") {
          openRenewDialog();
        } else {
          note.textContent = T.soonNote;
        }
        return;
      }
      await pay(payment, provider || "platega");
    } catch (e) {
      note.textContent = e && e.message ? e.message : T.failed;
    } finally {
      if (btn.isConnected) {
        btn.textContent = label;
        // A 503 means the plan stopped being sellable since the page loaded:
        // keep the button down instead of inviting a retry that must fail.
        btn.disabled = refused;
      }
    }
  }

  function render(data, subId) {
    var card = document.getElementById("plans-card");
    var list = document.getElementById("plans-list");
    if (!card || !list) return;

    var plans =
      data && Array.isArray(data.plans) ? data.plans.filter(Boolean) : [];
    if (!plans.length) {
      card.classList.add("hidden");
      return;
    }

    var heading = card.querySelector(".card-header h2");
    if (heading) heading.textContent = T.title;

    plans.sort(function (a, b) {
      return (a.plan === "standard" ? 0 : 1) - (b.plan === "standard" ? 0 : 1);
    });

    lastState = { subId: subId };
    list.innerHTML = "";
    plans.forEach(function (plan) {
      list.appendChild(row(plan, subId));
    });
    card.classList.remove("hidden");
  }

  /* Re-reads the cabinet state — used when the browser restores the page after
   * the redirect back from the payment provider, so a plan just bought shows up
   * as active without the user reloading by hand. */
  async function refresh() {
    if (!lastState || !lastState.subId) return;
    try {
      var res = await fetch(apiBase() + "/subscription/" + lastState.subId);
      if (!res.ok) return;
      render(await res.json(), lastState.subId);
    } catch (e) {}
  }

  window.addEventListener("pageshow", function (event) {
    if (event.persisted) refresh();
  });

  window.frknCabinetPlans = { render: render, refresh: refresh };
})();
