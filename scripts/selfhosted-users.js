/**
 * Cabinet card for selfhosted "users": the child subscriptions a selfhosted
 * account hands out (one link per user, on the account's own nodes).
 *
 * The card is shared by subscription/ and en/subscription/ (app/ has no
 * selfhosted mode). It renders itself into `#selfhosted-users`, so a page only
 * needs the container, this script and a `mount()` call:
 *
 *   window.FRKNShUsers.mount({ apiBase, subId, state, onChange });
 *
 * API used (fcore, see docs/API.md):
 *   GET    /private/nodes?subscription_id=      own nodes
 *   GET    /private/users?subscription_id=      current users
 *   POST   /private/users                       {all_servers:true} XOR {node_ids:[...]}
 *   DELETE /private/users/{child}?subscription_id=
 *
 * A user only ever gets AWG configs (AWG mobile included): Hysteria2 is out of
 * scope, so nodes without an AWG inbound are shown but cannot be picked, and
 * the API refuses them anyway.
 *
 * If `/private/users` is not there yet (site deployed before the api), the card
 * hides itself instead of showing an error — same rule as `#selfhosted-limits`.
 * With the api up but no own nodes the card stays visible and asks for a node
 * (the add button is disabled): the owner still sees that users are possible.
 */
(function () {
  "use strict";

  // The cabinet pages are separate files per language (`<html lang="en">`);
  // the path check is the fallback for pages built from the same source.
  var PAGE_LANG = String(
    document.documentElement.getAttribute("lang") || "",
  ).toLowerCase();
  var LANG =
    window.FRKN_SH_LANG ||
    (PAGE_LANG.indexOf("en") === 0 || /^\/en(\/|$)/.test(window.location.pathname)
      ? "en"
      : "ru");

  // Which inbounds make a node usable for a user (fcore Tag Display names).
  var AWG_INBOUNDS = ["AmneziaWg", "AmneziaWgMobile"];

  var TEXT = {
    ru: {
      title: "Пользователи",
      add: "Добавить пользователя",
      empty: "Пользователей пока нет",
      loading: "Загружаем…",
      noNodes: "Сначала подними ноду — тогда сможешь выдать доступ",
      noSlots: "Свободных слотов нет",
      allServers: "Все серверы",
      servers: "Серверов",
      connections: "Подключений",
      copy: "Скопировать",
      qr: "QR-код",
      revoke: "Отозвать",
      modalTitle: "Новый пользователь",
      scopeAll: "Все серверы",
      scopeAllHint: "Доступ ко всем твоим серверам, включая добавленные позже.",
      scopePick: "Выбрать серверы",
      scopePickHint: "Отметь серверы, на которых будет работать пользователь.",
      nodeOnline: "онлайн",
      nodeOffline: "оффлайн",
      nodeNoAwg: "без AWG",
      create: "Создать",
      cancel: "Отмена",
      creating: "Создаём…",
      pickOne: "Выберите хотя бы один сервер",
      created: "Пользователь создан",
      revoked: "Пользователь отозван",
      revokeConfirm:
        "Отозвать пользователя? Его подключения перестанут работать.",
      copied: "Ссылка скопирована",
      failed: "Не удалось. Попробуйте ещё раз",
      userLimit: function (used, limit) {
        return "Пользователей уже " + used + " из " + limit;
      },
    },
    en: {
      title: "Users",
      add: "Add user",
      empty: "No users yet",
      loading: "Loading…",
      noNodes: "Install a node first — then you can hand out access",
      noSlots: "No free slots",
      allServers: "All servers",
      servers: "Servers",
      connections: "Connections",
      copy: "Copy",
      qr: "QR code",
      revoke: "Revoke",
      modalTitle: "New user",
      scopeAll: "All servers",
      scopeAllHint: "Access to every server of yours, including ones added later.",
      scopePick: "Pick servers",
      scopePickHint: "Tick the servers this user may use.",
      nodeOnline: "online",
      nodeOffline: "offline",
      nodeNoAwg: "no AWG",
      create: "Create",
      cancel: "Cancel",
      creating: "Creating…",
      pickOne: "Pick at least one server",
      created: "User created",
      revoked: "User revoked",
      revokeConfirm: "Revoke this user? Their connections will stop working.",
      copied: "Link copied",
      failed: "Something went wrong. Try again",
      userLimit: function (used, limit) {
        return used + " of " + limit + " users already";
      },
    },
  };

  function t() {
    return TEXT[LANG] || TEXT.ru;
  }

  var state = null;

  // --- small helpers -----------------------------------------------------

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function toast(message) {
    if (typeof window.showToast === "function") {
      window.showToast(message);
      return;
    }
    if (!state || !state.el) return;
    var el = state.el.querySelector(".shu-toast");
    if (!el) return;
    el.textContent = message;
    el.classList.remove("shu-off");
    clearTimeout(el._timer);
    el._timer = setTimeout(function () {
      el.classList.add("shu-off");
    }, 2200);
  }

  function copyText(value) {
    var done = function () {
      toast(t().copied);
    };
    var fallback = function () {
      var area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.top = "-1000px";
      document.body.appendChild(area);
      area.select();
      try {
        document.execCommand("copy");
      } catch (e) {
        /* clipboard unavailable: the link is visible anyway */
      }
      document.body.removeChild(area);
      done();
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(done, fallback);
        return;
      }
    } catch (e) {
      /* fall through */
    }
    fallback();
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

  function nodeHasAwg(node) {
    var inbounds = (node && node.inbounds) || [];
    for (var i = 0; i < inbounds.length; i++) {
      if (AWG_INBOUNDS.indexOf(inbounds[i]) !== -1) return true;
    }
    return false;
  }

  function nodeName(node) {
    return node.label || node.hostname || String(node.uuid || "");
  }

  // --- styles (once per page) -------------------------------------------

  function ensureStyles() {
    if (document.getElementById("frkn-shu-styles")) return;
    var style = document.createElement("style");
    style.id = "frkn-shu-styles";
    style.textContent = [
      ".selfhosted-users{margin:0 0 14px;padding:14px 16px;border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.04);color:var(--text,#e8e8e8);font-size:14px}",
      ".shu-off{display:none !important}",
      ".shu-head{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:10px}",
      ".shu-head h3{margin:0;font-size:15px}",
      ".shu-count{color:var(--muted,#9aa0a6);font-weight:400;font-size:13px}",
      ".shu-add{padding:7px 12px;border-radius:9px;border:1px solid rgba(34,197,94,.5);background:rgba(34,197,94,.12);color:#e8e8e8;font:inherit;font-size:13px;cursor:pointer}",
      ".shu-add:disabled{opacity:.5;cursor:default}",
      ".shu-hint,.shu-empty,.shu-error{color:var(--muted,#9aa0a6);font-size:13px;margin:6px 0}",
      ".shu-error{color:#f87171}",
      ".shu-list{display:flex;flex-direction:column;gap:8px}",
      ".shu-row{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;padding:10px 12px;border-radius:10px;background:rgba(0,0,0,.18)}",
      ".shu-row code{font-size:13px;color:#e8e8e8;word-break:break-all}",
      ".shu-meta{color:var(--muted,#9aa0a6);font-size:12px;margin-top:3px}",
      ".shu-actions{display:flex;gap:6px;flex-wrap:wrap}",
      ".shu-actions button,.shu-create,.shu-cancel{padding:6px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:#e8e8e8;font:inherit;font-size:12px;cursor:pointer}",
      ".shu-actions .shu-danger{border-color:rgba(248,113,113,.5);color:#fca5a5}",
      ".shu-create{border-color:rgba(34,197,94,.5);background:rgba(34,197,94,.14)}",
      ".shu-modal{position:fixed;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);padding:16px}",
      ".shu-modal-box{width:100%;max-width:420px;max-height:90vh;overflow:auto;background:#14181c;border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:18px}",
      ".shu-modal-box h3{margin:0 0 12px;font-size:16px}",
      ".shu-scope{display:flex;gap:8px;align-items:center;margin:10px 0 2px;cursor:pointer}",
      ".shu-scope-hint{margin:0 0 0 24px;color:var(--muted,#9aa0a6);font-size:12px}",
      ".shu-nodes{margin:12px 0 0;max-height:240px;overflow:auto;display:flex;flex-direction:column;gap:6px}",
      ".shu-node{display:flex;gap:8px;align-items:center;font-size:13px}",
      ".shu-node.is-off{opacity:.55}",
      ".shu-node-tag{color:var(--muted,#9aa0a6);font-size:12px}",
      ".shu-actions-box{display:flex;gap:8px;justify-content:flex-end;margin-top:16px}",
      ".shu-qr{position:fixed;inset:0;z-index:70;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.65);padding:16px}",
      ".shu-qr-box{background:#fff;border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:10px;align-items:center;max-width:100%}",
      ".shu-qr-box code{color:#111;font-size:12px;word-break:break-all;max-width:280px;text-align:center}",
      ".shu-toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:80;background:#1f2937;color:#fff;padding:9px 14px;border-radius:10px;font-size:13px}",
    ].join("");
    document.head.appendChild(style);
  }

  // --- rendering --------------------------------------------------------

  function renderShell(el) {
    el.innerHTML =
      '<div class="shu-head">' +
      "<h3>" +
      escapeHtml(t().title) +
      ' <span class="shu-count"></span></h3>' +
      '<button type="button" class="shu-add">' +
      escapeHtml(t().add) +
      "</button>" +
      "</div>" +
      '<div class="shu-hint shu-off"></div>' +
      '<div class="shu-list"></div>' +
      '<div class="shu-modal shu-off">' +
      '<div class="shu-modal-box" role="dialog" aria-modal="true">' +
      "<h3>" +
      escapeHtml(t().modalTitle) +
      "</h3>" +
      '<label class="shu-scope"><input type="radio" name="shu-scope" value="all" checked><span>' +
      escapeHtml(t().scopeAll) +
      "</span></label>" +
      '<p class="shu-scope-hint">' +
      escapeHtml(t().scopeAllHint) +
      "</p>" +
      '<label class="shu-scope"><input type="radio" name="shu-scope" value="subset"><span>' +
      escapeHtml(t().scopePick) +
      "</span></label>" +
      '<p class="shu-scope-hint">' +
      escapeHtml(t().scopePickHint) +
      "</p>" +
      '<div class="shu-nodes shu-off"></div>' +
      '<p class="shu-error shu-off"></p>' +
      '<div class="shu-actions-box">' +
      '<button type="button" class="shu-cancel">' +
      escapeHtml(t().cancel) +
      "</button>" +
      '<button type="button" class="shu-create">' +
      escapeHtml(t().create) +
      "</button>" +
      "</div>" +
      "</div>" +
      "</div>" +
      '<div class="shu-qr shu-off"><div class="shu-qr-box"><canvas width="240" height="240"></canvas><code></code></div></div>' +
      '<div class="shu-toast shu-off"></div>';

    el.querySelector(".shu-add").addEventListener("click", openModal);
    el.querySelector(".shu-cancel").addEventListener("click", closeModal);
    el.querySelector(".shu-create").addEventListener("click", createUser);
    el.querySelector(".shu-modal").addEventListener("click", function (e) {
      if (e.target === el.querySelector(".shu-modal")) closeModal();
    });
    el.querySelectorAll('input[name="shu-scope"]').forEach(function (radio) {
      radio.addEventListener("change", function () {
        setScope(radio.value);
      });
    });
    el.querySelector(".shu-qr").addEventListener("click", function () {
      el.querySelector(".shu-qr").classList.add("shu-off");
    });
    el.querySelector(".shu-list").addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-act]");
      if (!btn) return;
      var row = btn.closest(".shu-row");
      if (!row) return;
      var user = usersCache.filter(function (u) {
        return u.subscription_id === row.dataset.id;
      })[0];
      if (!user) return;
      if (btn.dataset.act === "copy") copyText(user.subscription_url);
      else if (btn.dataset.act === "qr") showQr(user.subscription_url);
      else if (btn.dataset.act === "revoke") revokeUser(user);
    });
  }

  var usersCache = [];
  var nodesCache = [];

  function currentScope() {
    var picked = state.el.querySelector('input[name="shu-scope"]:checked');
    return picked ? picked.value : "all";
  }

  function setScope(scope) {
    state.el.querySelector(".shu-nodes").classList.toggle("shu-off", scope !== "subset");
  }

  function setHint(text) {
    var hint = state.el.querySelector(".shu-hint");
    hint.textContent = text || "";
    hint.classList.toggle("shu-off", !text);
  }

  function renderCount() {
    var counter = state.el.querySelector(".shu-count");
    var users = state.usage && state.usage.users;
    if (!users) {
      counter.textContent = "";
      return;
    }
    counter.textContent =
      "· " + Number(users.used || 0) + " / " + Number(users.limit || 0);
  }

  function renderList() {
    var list = state.el.querySelector(".shu-list");
    if (!usersCache.length) {
      list.innerHTML =
        '<div class="shu-empty">' + escapeHtml(t().empty) + "</div>";
      return;
    }
    list.innerHTML = usersCache
      .map(function (user) {
        var scope = user.all_servers
          ? t().allServers
          : t().servers + ": " + (user.node_ids || []).length;
        return (
          '<div class="shu-row" data-id="' +
          escapeHtml(user.subscription_id) +
          '">' +
          '<div><code>' +
          escapeHtml(user.subscription_url) +
          "</code>" +
          '<div class="shu-meta">' +
          escapeHtml(scope) +
          " · " +
          escapeHtml(t().connections + ": " + Number(user.connections || 0)) +
          "</div></div>" +
          '<div class="shu-actions">' +
          '<button type="button" data-act="copy">' +
          escapeHtml(t().copy) +
          "</button>" +
          '<button type="button" data-act="qr">' +
          escapeHtml(t().qr) +
          "</button>" +
          '<button type="button" data-act="revoke" class="shu-danger">' +
          escapeHtml(t().revoke) +
          "</button>" +
          "</div></div>"
        );
      })
      .join("");
  }

  function usableNodes() {
    return nodesCache.filter(nodeHasAwg);
  }

  function renderNodesBox() {
    var box = state.el.querySelector(".shu-nodes");
    var usable = usableNodes();
    if (!nodesCache.length) {
      box.innerHTML = '<div class="shu-hint">' + escapeHtml(t().noNodes) + "</div>";
      return;
    }
    box.innerHTML = nodesCache
      .map(function (node) {
        var ok = nodeHasAwg(node);
        var online = node.status === "Online";
        var tag = ok
          ? online
            ? t().nodeOnline
            : t().nodeOffline
          : t().nodeNoAwg;
        return (
          '<label class="shu-node' +
          (ok ? "" : " is-off") +
          '">' +
          '<input type="checkbox" value="' +
          escapeHtml(node.uuid) +
          '"' +
          (ok ? "" : " disabled") +
          ">" +
          "<span>" +
          escapeHtml(nodeName(node)) +
          "</span>" +
          '<span class="shu-node-tag">' +
          escapeHtml(tag) +
          "</span>" +
          "</label>"
        );
      })
      .join("");
    // Nothing pickable: the radio stays on "all servers" so the XOR is clear.
    if (!usable.length) setScope("all");
  }

  function refreshAddState() {
    var add = state.el.querySelector(".shu-add");
    var usable = usableNodes();
    var users = state.usage && state.usage.users;
    var noSlots = users && Number(users.limit || 0) > 0 && Number(users.remaining || 0) <= 0;
    add.disabled = !usable.length || !!noSlots;
    if (!nodesCache.length) setHint(t().noNodes);
    else if (!usable.length) setHint(t().noNodes);
    else if (noSlots) setHint(t().noSlots);
    else setHint("");
  }

  // --- api actions ------------------------------------------------------

  function showQr(link) {
    var overlay = state.el.querySelector(".shu-qr");
    var code = overlay.querySelector("code");
    var canvas = overlay.querySelector("canvas");
    code.textContent = link;
    overlay.classList.remove("shu-off");
    if (window.QRCode && window.QRCode.toCanvas) {
      try {
        window.QRCode.toCanvas(canvas, link, { width: 240 });
      } catch (e) {
        /* QR is decorative: the link is printed below it */
      }
    }
  }

  function openModal() {
    var modal = state.el.querySelector(".shu-modal");
    var picked = state.el.querySelector('input[name="shu-scope"][value="all"]');
    if (picked) picked.checked = true;
    renderNodesBox();
    setScope("all");
    var err = state.el.querySelector(".shu-error");
    err.textContent = "";
    err.classList.add("shu-off");
    modal.classList.remove("shu-off");
  }

  function closeModal() {
    state.el.querySelector(".shu-modal").classList.add("shu-off");
  }

  function showError(text) {
    var err = state.el.querySelector(".shu-error");
    err.textContent = text;
    err.classList.remove("shu-off");
  }

  function createUser() {
    var scope = currentScope();
    var body = { subscription_id: state.subId };
    if (scope === "all") {
      body.all_servers = true;
    } else {
      var ids = [];
      state.el
        .querySelectorAll('.shu-nodes input[type="checkbox"]:checked')
        .forEach(function (box) {
          ids.push(box.value);
        });
      if (!ids.length) {
        showError(t().pickOne);
        return;
      }
      body.node_ids = ids;
    }

    var btn = state.el.querySelector(".shu-create");
    var label = btn.textContent;
    btn.disabled = true;
    btn.textContent = t().creating;
    fetch(api("/private/users"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then(function (res) {
        return res.json().catch(function () {
          return {};
        }).then(function (data) {
          return { res: res, data: data };
        });
      })
      .then(function (out) {
        var res = out.res;
        var data = out.data || {};
        if (res.status === 409) {
          var info = data.response || {};
          showError(t().userLimit(Number(info.used) || 0, Number(info.limit) || 0));
          return refreshUsage();
        }
        if (!res.ok) {
          var message = String(data.message || "");
          if (/no amnezia-wg servers/i.test(message)) showError(t().noNodes);
          else if (/no amnezia-wg inbound/i.test(message)) showError(t().noNodes);
          else showError(t().failed);
          return null;
        }
        closeModal();
        toast(t().created);
        // Fresh counters ship with the create response; the page's own "N of M"
        // block still needs its /private/state refresh (onChange).
        var created = data.response || {};
        if (created.users && state.usage) state.usage.users = created.users;
        return refresh().then(refreshUsage);
      })
      .catch(function () {
        showError(t().failed);
      })
      .then(function () {
        btn.disabled = false;
        btn.textContent = label;
      });
  }

  function revokeUser(user) {
    if (typeof window.confirm === "function" && !window.confirm(t().revokeConfirm)) {
      return;
    }
    fetch(
      api(
        "/private/users/" +
          encodeURIComponent(user.subscription_id) +
          "?subscription_id=" +
          encodeURIComponent(state.subId),
      ),
      { method: "DELETE" },
    )
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        toast(t().revoked);
        return refresh().then(refreshUsage);
      })
      .catch(function () {
        toast(t().failed);
      });
  }

  function refreshUsage() {
    if (typeof state.onChange !== "function") {
      renderCount();
      refreshAddState();
      return Promise.resolve(null);
    }
    return Promise.resolve(state.onChange()).then(function (usage) {
      if (usage) state.usage = usage;
      renderCount();
      refreshAddState();
      return usage;
    });
  }

  function refresh() {
    var el = state.el;
    if (!usersCache.length && !state.loaded) {
      el.querySelector(".shu-list").innerHTML =
        '<div class="shu-empty">' + escapeHtml(t().loading) + "</div>";
    }
    return Promise.all([
      getJson("/private/nodes?subscription_id=" + encodeURIComponent(state.subId)),
      getJson("/private/users?subscription_id=" + encodeURIComponent(state.subId)),
    ]).then(
      function (results) {
        nodesCache = (results[0] && results[0].response) || [];
        usersCache = (results[1] && results[1].response) || [];
        state.loaded = true;
        // No own nodes yet: the card stays visible and tells the owner to
        // install one (the add button is disabled by refreshAddState). Only a
        // missing api hides the card — see the error path below.
        el.classList.remove("hidden");
        renderCount();
        renderList();
        refreshAddState();
      },
      function () {
        // /private/users (or /private/nodes) not deployed yet: keep quiet.
        el.classList.add("hidden");
      },
    );
  }

  function mount(options) {
    var el = document.getElementById("selfhosted-users");
    if (!el) return;
    ensureStyles();
    state = {
      apiBase: String(options.apiBase || "").replace(/\/+$/, ""),
      subId: options.subId,
      usage: options.state || null,
      onChange: options.onChange,
      el: el,
    };
    if (!state.subId) return;
    if (!el.dataset.mounted) {
      el.dataset.mounted = "1";
      renderShell(el);
    }
    renderCount();
    return refresh();
  }

  window.FRKNShUsers = {
    mount: mount,
    refresh: function () {
      return state ? refresh() : null;
    },
  };
})();
