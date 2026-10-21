/**
 * Cabinet card for the selfhosted account's own nodes: live gauges and a 24h
 * history chart per server.
 *
 * Shared by subscription/ and en/subscription/ (app/ has no selfhosted mode).
 * A page only needs the container and a mount() call:
 *
 *   window.FRKNShServers.mount({ apiBase, subId });
 *
 * API used (fcore):
 *   GET /private/nodes/stats?subscription_id=        gauges + inbound totals
 *   GET /private/nodes/{uuid}/series?subscription_id=&from=&to=
 *
 * Both endpoints are ownership-checked server-side against the account's
 * personal env. If /private/nodes/stats is not deployed yet, the card hides
 * itself instead of showing an error (same rule as the users card).
 */
(function () {
  "use strict";

  var PAGE_LANG = String(
    document.documentElement.getAttribute("lang") || "",
  ).toLowerCase();
  var LANG =
    window.FRKN_SH_LANG ||
    (PAGE_LANG.indexOf("en") === 0 || /^\/en(\/|$)/.test(window.location.pathname)
      ? "en"
      : "ru");

  var TEXT = {
    ru: {
      title: "Серверы",
      online: "онлайн",
      offline: "оффлайн",
      cpu: "CPU",
      ram: "RAM",
      disk: "Диск",
      net: "Сеть",
      traffic: "Трафик",
      connections: "Подключений",
      stats: "Статистика",
      loading: "Загружаем…",
      noNodes: "Своих нод пока нет",
      chartTitle: "За 24 часа",
      chartCpuRam: "CPU и память",
      chartNet: "Сеть",
      chartEmpty: "Данных пока нет — нода только подключилась",
      rx: "вход",
      tx: "исход",
      close: "Закрыть",
      stale: "нет свежих данных",
    },
    en: {
      title: "Servers",
      online: "online",
      offline: "offline",
      cpu: "CPU",
      ram: "RAM",
      disk: "Disk",
      net: "Network",
      traffic: "Traffic",
      connections: "Connections",
      stats: "Statistics",
      loading: "Loading…",
      noNodes: "No servers yet",
      chartTitle: "Last 24 hours",
      chartCpuRam: "CPU and memory",
      chartNet: "Network",
      chartEmpty: "No data yet — the node has just connected",
      rx: "in",
      tx: "out",
      close: "Close",
      stale: "no fresh data",
    },
  };

  function t() {
    return TEXT[LANG] || TEXT.ru;
  }

  var state = null;

  // --- helpers -----------------------------------------------------------

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function api(path) {
    return state.apiBase + path;
  }

  function getJson(path) {
    return fetch(api(path), { method: "GET" }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json().catch(function () {
        return null;
      });
    });
  }

  function num(value) {
    var n = Number(value);
    return isFinite(n) ? n : null;
  }

  function fmtPercent(value) {
    var n = num(value);
    return n === null ? "—" : Math.round(n) + "%";
  }

  function fmtBytes(value) {
    var n = num(value);
    if (n === null) return "—";
    var bytes =
      LANG === "en"
        ? { base: " B", units: ["KB", "MB", "GB", "TB"] }
        : { base: " Б", units: ["КБ", "МБ", "ГБ", "ТБ"] };
    if (n < 1024) return Math.round(n) + bytes.base;
    var units = bytes.units;
    var i = -1;
    do {
      n /= 1024;
      i += 1;
    } while (n >= 1024 && i < units.length - 1);
    return (n >= 100 ? Math.round(n) : n.toFixed(1)) + " " + units[i];
  }

  function fmtBits(value) {
    var n = num(value);
    if (n === null) return "—";
    var bps =
      LANG === "en"
        ? { base: " bps", units: ["Kbps", "Mbps", "Gbps"] }
        : { base: " б/с", units: ["Кбит/с", "Мбит/с", "Гбит/с"] };
    if (n < 1000) return Math.round(n) + bps.base;
    var units = bps.units;
    var i = -1;
    do {
      n /= 1000;
      i += 1;
    } while (n >= 1000 && i < units.length - 1);
    return (n >= 100 ? Math.round(n) : n.toFixed(1)) + " " + units[i];
  }

  function nodeName(node) {
    return node.label || node.hostname || String(node.uuid || "");
  }

  function isOnline(node) {
    return String(node.status || "").toLowerCase() === "online";
  }

  // --- styles ------------------------------------------------------------

  function ensureStyles() {
    if (document.getElementById("frkn-shs-styles")) return;
    var style = document.createElement("style");
    style.id = "frkn-shs-styles";
    style.textContent = [
      ".selfhosted-servers{margin:0 0 14px;padding:14px 16px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.04);color:var(--text,#e8e8e8);font-size:14px}",
      ".shs-off{display:none !important}",
      ".shs-head{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:10px}",
      ".shs-head h3{margin:0;font-size:15px}",
      ".shs-count{color:var(--muted,#9aa0a6);font-weight:400;font-size:13px}",
      ".shs-empty{color:var(--muted,#9aa0a6);font-size:13px;margin:6px 0}",
      ".shs-list{display:flex;flex-direction:column;gap:8px}",
      ".shs-row{padding:10px 12px;border-radius:10px;background:rgba(0,0,0,.18)}",
      ".shs-row-head{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between}",
      ".shs-name{display:flex;gap:8px;align-items:center;min-width:0}",
      ".shs-name b{font-weight:600}",
      ".shs-dot{width:8px;height:8px;border-radius:50%;background:#f87171;flex:0 0 auto}",
      ".shs-dot.is-on{background:#34d399}",
      ".shs-meta{color:var(--muted,#9aa0a6);font-size:12px;margin-top:3px;word-break:break-all}",
      ".shs-stats{display:flex;flex-wrap:wrap;gap:6px 14px;margin-top:8px;font-size:12px;color:var(--muted,#9aa0a6)}",
      ".shs-stats b{color:#e8e8e8;font-weight:600}",
      ".shs-btn{padding:6px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#e8e8e8;font:inherit;font-size:12px;cursor:pointer}",
      ".shs-modal{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);padding:16px}",
      ".shs-modal-box{width:100%;max-width:560px;max-height:90vh;overflow:auto;background:#14181c;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:18px}",
      ".shs-modal-box h3{margin:0 0 4px;font-size:16px}",
      ".shs-modal-sub{color:var(--muted,#9aa0a6);font-size:12px;margin:0 0 14px}",
      ".shs-chart-title{font-size:12px;color:var(--muted,#9aa0a6);margin:12px 0 6px}",
      ".shs-chart{width:100%;height:120px;display:block}",
      ".shs-legend{display:flex;gap:14px;flex-wrap:wrap;font-size:11px;color:var(--muted,#9aa0a6);margin-top:6px}",
      ".shs-legend span::before{content:'';display:inline-block;width:8px;height:2px;margin-right:5px;vertical-align:middle;background:currentColor}",
      ".shs-actions-box{display:flex;justify-content:flex-end;margin-top:16px}",
    ].join("");
    document.head.appendChild(style);
  }

  // --- rendering ---------------------------------------------------------

  function renderShell(el) {
    el.innerHTML =
      '<div class="shs-head"><h3>' +
      escapeHtml(t().title) +
      ' <span class="shs-count"></span></h3></div>' +
      '<div class="shs-list"></div>' +
      '<div class="shs-modal shs-off" role="dialog" aria-modal="true">' +
      '<div class="shs-modal-box">' +
      '<h3 class="shs-modal-title"></h3>' +
      '<p class="shs-modal-sub"></p>' +
      '<div class="shs-chart-title">' +
      escapeHtml(t().chartCpuRam) +
      "</div>" +
      '<canvas class="shs-chart shs-chart-sys" width="520" height="120"></canvas>' +
      '<div class="shs-legend"><span style="color:#38BDF8">CPU</span><span style="color:#a78bfa">RAM</span></div>' +
      '<div class="shs-chart-title">' +
      escapeHtml(t().chartNet) +
      "</div>" +
      '<canvas class="shs-chart shs-chart-net" width="520" height="120"></canvas>' +
      '<div class="shs-legend"><span style="color:#34d399">' +
      escapeHtml(t().rx) +
      '</span><span style="color:#fbbf24">' +
      escapeHtml(t().tx) +
      "</span></div>" +
      '<div class="shs-actions-box"><button type="button" class="shs-btn shs-close">' +
      escapeHtml(t().close) +
      "</button></div>" +
      "</div></div>";

    el.querySelector(".shs-close").addEventListener("click", closeChart);
    el.querySelector(".shs-modal").addEventListener("click", function (e) {
      if (e.target === el.querySelector(".shs-modal")) closeChart();
    });
    el.querySelector(".shs-list").addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-uuid]");
      if (!btn) return;
      openChart(btn.dataset.uuid);
    });
  }

  function renderList() {
    var el = state.el;
    var list = el.querySelector(".shs-list");
    var nodes = state.nodes || [];
    el.querySelector(".shs-count").textContent = nodes.length
      ? String(nodes.length)
      : "";

    if (!nodes.length) {
      list.innerHTML =
        '<div class="shs-empty">' + escapeHtml(t().noNodes) + "</div>";
      return;
    }

    list.innerHTML = nodes
      .map(function (node) {
        var metrics = node.metrics || {};
        var traffic = node.traffic || {};
        var online = isOnline(node);
        var statusText = online ? t().online : t().offline;
        var trafficText =
          fmtBytes(traffic.uplink) + " ↑ / " + fmtBytes(traffic.downlink) + " ↓";
        var netText =
          fmtBits(metrics.network_rx_bps) + " ↓ / " + fmtBits(metrics.network_tx_bps) + " ↑";
        return (
          '<div class="shs-row" data-uuid="' +
          escapeHtml(node.uuid) +
          '">' +
          '<div class="shs-row-head">' +
          '<div><div class="shs-name"><span class="shs-dot' +
          (online ? " is-on" : "") +
          '"></span><b>' +
          escapeHtml(nodeName(node)) +
          "</b><span class=\"shs-meta\">" +
          escapeHtml(node.country || "") +
          " · " +
          escapeHtml(statusText) +
          "</span></div>" +
          '<div class="shs-meta">' +
          escapeHtml(node.hostname || "") +
          (node.address ? " · " + escapeHtml(node.address) : "") +
          "</div></div>" +
          '<button type="button" class="shs-btn" data-uuid="' +
          escapeHtml(node.uuid) +
          '">' +
          escapeHtml(t().stats) +
          "</button>" +
          "</div>" +
          '<div class="shs-stats">' +
          "<span>" +
          escapeHtml(t().cpu) +
          " <b>" +
          fmtPercent(metrics.cpu_percent) +
          "</b></span>" +
          "<span>" +
          escapeHtml(t().ram) +
          " <b>" +
          fmtPercent(metrics.memory_percent) +
          "</b></span>" +
          "<span>" +
          escapeHtml(t().disk) +
          " <b>" +
          fmtPercent(metrics.disk_usage_percent) +
          "</b></span>" +
          "<span>" +
          escapeHtml(t().net) +
          " <b>" +
          escapeHtml(netText) +
          "</b></span>" +
          "<span>" +
          escapeHtml(t().traffic) +
          " <b>" +
          escapeHtml(trafficText) +
          "</b></span>" +
          "<span>" +
          escapeHtml(t().connections) +
          " <b>" +
          (num(traffic.connections) === null
            ? "—"
            : Math.round(traffic.connections)) +
          "</b></span>" +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  // --- charts ------------------------------------------------------------

  function seriesValues(points) {
    return (points || [])
      .map(function (p) {
        return [Number(p[0]), num(p[1])];
      })
      .filter(function (p) {
        return isFinite(p[0]) && p[1] !== null;
      });
  }

  function drawSeries(canvas, groups, fixedMax) {
    var ctx = canvas.getContext("2d");
    var w = canvas.width;
    var h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    var pad = 6;
    var values = [];
    groups.forEach(function (g) {
      values = values.concat(
        g.points.map(function (p) {
          return p[1];
        }),
      );
    });

    if (!values.length) {
      ctx.fillStyle = "#9aa0a6";
      ctx.font = "12px sans-serif";
      ctx.fillText(t().chartEmpty, pad, h / 2);
      return;
    }

    var max = fixedMax || Math.max.apply(null, values) || 1;
    max *= 1.1;
    var allTs = [];
    groups.forEach(function (g) {
      g.points.forEach(function (p) {
        allTs.push(p[0]);
      });
    });
    var minTs = Math.min.apply(null, allTs);
    var maxTs = Math.max.apply(null, allTs);
    var span = Math.max(1, maxTs - minTs);

    // Baseline grid: three faint horizontal lines.
    ctx.strokeStyle = "rgba(255,255,255,.07)";
    ctx.lineWidth = 1;
    for (var i = 0; i <= 3; i += 1) {
      var y = pad + ((h - pad * 2) * i) / 3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    groups.forEach(function (group) {
      if (group.points.length < 2) {
        // A single sample: draw a dot so the chart never looks broken.
        var only = group.points[0];
        if (only) {
          var dx = w - pad;
          var dy = h - pad - ((only[1] / max) * (h - pad * 2));
          ctx.fillStyle = group.color;
          ctx.beginPath();
          ctx.arc(dx, dy, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        return;
      }
      ctx.strokeStyle = group.color;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      group.points.forEach(function (p, idx) {
        var x = pad + ((p[0] - minTs) / span) * (w - pad * 2);
        var y = h - pad - (p[1] / max) * (h - pad * 2);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });

    ctx.fillStyle = "#9aa0a6";
    ctx.font = "10px sans-serif";
    ctx.fillText(
      fixedMax ? "100%" : fmtBits(max),
      pad,
      pad + 8,
    );
  }

  function openChart(uuid) {
    var el = state.el;
    var node = (state.nodes || []).filter(function (n) {
      return n.uuid === uuid;
    })[0];
    if (!node) return;
    el.querySelector(".shs-modal-title").textContent = nodeName(node);
    el.querySelector(".shs-modal-sub").textContent =
      t().chartTitle + " · " + (node.hostname || "");
    el.querySelector(".shs-modal").classList.remove("shs-off");

    var to = Date.now();
    var from = to - 24 * 60 * 60 * 1000;
    var url =
      "/private/nodes/" +
      encodeURIComponent(uuid) +
      "/series?subscription_id=" +
      encodeURIComponent(state.subId) +
      "&from=" +
      from +
      "&to=" +
      to;

    getJson(url)
      .then(function (data) {
        var series = (data && data.response) || {};
        drawSeries(
          el.querySelector(".shs-chart-sys"),
          [
            { color: "#38BDF8", points: seriesValues(series.cpu_percent) },
            { color: "#a78bfa", points: seriesValues(series.memory_percent) },
          ],
          100,
        );
        drawSeries(el.querySelector(".shs-chart-net"), [
          { color: "#34d399", points: seriesValues(series.network_rx_bps) },
          { color: "#fbbf24", points: seriesValues(series.network_tx_bps) },
        ]);
      })
      .catch(function () {
        drawSeries(el.querySelector(".shs-chart-sys"), [], 100);
        drawSeries(el.querySelector(".shs-chart-net"), []);
      });
  }

  function closeChart() {
    if (!state || !state.el) return;
    state.el.querySelector(".shs-modal").classList.add("shs-off");
  }

  // --- data --------------------------------------------------------------

  function refresh() {
    var el = state.el;
    if (!state.nodes) {
      el.querySelector(".shs-list").innerHTML =
        '<div class="shs-empty">' + escapeHtml(t().loading) + "</div>";
    }
    return getJson(
      "/private/nodes/stats?subscription_id=" + encodeURIComponent(state.subId),
    ).then(
      function (data) {
        var nodes = (data && data.response) || [];
        state.nodes = nodes;
        // No own nodes: the limits card already says "Серверы: 0 из N", so the
        // empty stats card would only repeat it.
        el.classList.remove("hidden");
        el.classList.toggle("shs-off", nodes.length === 0);
        renderList();
      },
      function () {
        // Endpoint not deployed yet (site released before the api): stay quiet.
        el.classList.add("hidden");
      },
    );
  }

  function startPolling() {
    if (state.timer) clearInterval(state.timer);
    state.timer = setInterval(function () {
      if (document.hidden) return;
      if (!state.el.classList.contains("shs-off")) refresh();
    }, 15000);
  }

  function mount(options) {
    var el = document.getElementById("selfhosted-servers");
    if (!el) return;
    ensureStyles();
    state = {
      apiBase: String(options.apiBase || "").replace(/\/+$/, ""),
      subId: options.subId,
      el: el,
      nodes: null,
    };
    if (!state.subId) return;
    if (!el.dataset.mounted) {
      el.dataset.mounted = "1";
      renderShell(el);
      startPolling();
    }
    return refresh();
  }

  window.FRKNShServers = {
    mount: mount,
    refresh: function () {
      return state ? refresh() : null;
    },
  };
})();
