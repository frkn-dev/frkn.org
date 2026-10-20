// jsdom e2e for the selfhosted account flow on the cabinet page:
//   1. plan_kind=selfhosted hides the paid-only blocks and shows the
//      "no nodes yet" empty state;
//   2. plan_kind=standard keeps them (regression);
//   3. the error screen creates an empty account via POST /private/account
//      and remembers the returned uuid;
//   4. a failed creation shows a localized error;
//   5. an exhausted server cap turns the install command into a 409;
//   6. the users card lists/creates/revokes child subscriptions
//      (all_servers XOR node_ids) and skips AWG-less nodes;
//   7. an exhausted user cap disables the add button.
// No live server or CDN; the users card is scripts/selfhosted-users.js, inlined
// here because jsdom drops the external scripts.
// No live server or CDN.
// Run: cd tools/e2e && node selfhosted-account-test.mjs
//      AWG_E2E_LANG=en node selfhosted-account-test.mjs
import { JSDOM, VirtualConsole } from "jsdom";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dir = dirname(fileURLToPath(import.meta.url));
const LANG = process.env.AWG_E2E_LANG === "en" ? "en" : "ru";
const PAGE = resolve(
  __dir,
  LANG === "en"
    ? "../../en/subscription/index.html"
    : "../../subscription/index.html",
);
const require = createRequire(import.meta.url);
const { SUB } = require("../mock-api/serve.js");
const TEXT = {
  ru: {
    create: "Создать selfhosted-аккаунт",
    creating: "Создаём…",
    error: "❌ Не удалось создать аккаунт, попробуй позже",
    emptyTitle: "Своих нод пока нет",
    serversRow: "Серверы: 1 из 3 · свободно 2",
    usersRow: "Пользователи: 0 из 20 · свободно 20",
    limitNote:
      "Свободных серверов нет: 3 из 3. Удали ноду в кабинете или напиши в поддержку.",
    limitMarker: "3 из 3",
    usersTitle: "Пользователи",
    addUser: "Добавить пользователя",
    emptyUsers: "Пользователей пока нет",
    noNodesHint: "Сначала подними ноду — тогда сможешь выдать доступ",
    scopeAll: "Все серверы",
    connectionsLabel: "Подключений",
    userCreate: "Создать",
    noSlots: "Свободных слотов нет",
  },
  en: {
    create: "Create a selfhosted account",
    creating: "Creating…",
    error: "❌ Could not create the account, try again later",
    emptyTitle: "No nodes yet",
    serversRow: "Servers: 1 of 3 · free 2",
    usersRow: "Users: 0 of 20 · free 20",
    limitNote:
      "No free servers: 3 of 3. Delete a node in the cabinet or contact support.",
    limitMarker: "3 of 3",
    usersTitle: "Users",
    addUser: "Add user",
    emptyUsers: "No users yet",
    noNodesHint: "Install a node first — then you can hand out access",
    scopeAll: "All servers",
    connectionsLabel: "Connections",
    userCreate: "Create",
    noSlots: "No free slots",
  },
}[LANG];

const STATE_FIXTURE = {
  subscription_id: "demo-uuid-0000",
  plan_kind: "selfhosted",
  servers: { used: 1, limit: 3, remaining: 2 },
  users: { used: 0, limit: 20, remaining: 20 },
};

const clone = (value) => JSON.parse(JSON.stringify(value));

let failed = false;
const fail = (...args) => {
  failed = true;
  console.error("❌", ...args);
};
const ok = (...args) => console.log("✅", ...args);
const eq = (what, actual, expected) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(what, "\n   got:     ", JSON.stringify(actual), "\n   expected:", JSON.stringify(expected));
  } else ok(what);
};
const check = (what, condition) => {
  if (!condition) fail(what);
  else ok(what);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitFor = async (what, fn, timeout = 4000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const value = fn();
    if (value) return value;
    await sleep(20);
  }
  throw new Error(`Timeout waiting for ${what}`);
};

const html = readFileSync(PAGE, "utf8");
const SH_USERS_SRC = readFileSync(
  resolve(__dir, "../../scripts/selfhosted-users.js"),
  "utf8",
);
// Keep the inline <style> so computed display is testable (the `.hidden`
// rule loses to `.secondary-btn`'s `display` in an unpatched page). The users
// card is a shared script, so it is inlined instead of stripped.
const cleanHtml = html
  .replace(/<link rel="stylesheet"[^>]*>/g, "")
  .replace(
    /<script[^>]*src="[^"]*selfhosted-users\.js[^"]*"[^>]*><\/script>/g,
    `<script>${SH_USERS_SRC}</script>`,
  )
  .replace(/<script[^>]*src="[^"]*"[^>]*><\/script>/g, "");

function boot({
  url,
  sub,
  account,
  failAccount = false,
  state = null,
  installStatus = 200,
  nodes = null,
  users = null,
  userCreateStatus = 200,
  dynamicUsersState = false,
}) {
  const requests = [];
  const liveUsers = users ? clone(users) : null;
  let readyResolve;
  const ready = new Promise((r) => (readyResolve = r));
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (e) => {
    const msg = String((e && e.message) || e);
    // The create flow ends with a real navigation, which jsdom only reports.
    if (/Not implemented: navigation/i.test(msg)) return;
    if (/Could not parse CSS stylesheet/i.test(msg)) return;
    console.error("[jsdom]", msg);
  });
  const dom = new JSDOM(cleanHtml, {
    url,
    runScripts: "dangerously",
    virtualConsole,
    beforeParse(window) {
      window.fetch = async (u, options = {}) => {
        const target = new URL(u, "http://localhost");
        const method = options.method || "GET";
        let body = null;
        if (options.body) {
          try {
            body = JSON.parse(options.body);
          } catch {
            body = options.body;
          }
        }
        requests.push({ url: target.toString(), method, body });
        const resp = (data, ok = true, status = 200) => ({
          ok,
          status,
          json: async () => clone(data),
          text: async () => (typeof data === "string" ? data : JSON.stringify(data)),
        });
        if (target.pathname.endsWith("/subscription/vpn-clients.json")) {
          return resp({
            android: { label: "Android", clients: [] },
            windows: { label: "Windows", clients: [] },
          });
        }
        if (target.pathname === "/private/account" && method === "POST") {
          if (failAccount) return resp({ status: 500, message: "boom" }, false, 500);
          return resp(account);
        }
        if (target.pathname === "/private/state") {
          if (!state) return resp({ status: 404, message: "unknown" }, false, 404);
          const payload = clone(state);
          // The real /private/state counts the users that exist right now;
          // without this the create/revoke flow would read a stale fixture.
          if (dynamicUsersState && liveUsers) {
            const limit = (payload.users && payload.users.limit) || 20;
            payload.users = {
              used: liveUsers.length,
              limit,
              remaining: Math.max(0, limit - liveUsers.length),
            };
          }
          return resp({ status: 200, message: "Ok", response: payload });
        }
        // Selfhosted users card: own nodes + child subscriptions.
        if (target.pathname === "/private/nodes" && method === "GET") {
          if (!nodes) return resp({ status: 404, message: "not found" }, false, 404);
          return resp({ status: 200, message: "Ok", response: clone(nodes) });
        }
        if (target.pathname === "/private/users" && method === "GET") {
          if (!liveUsers) return resp({ status: 404, message: "not found" }, false, 404);
          return resp({ status: 200, message: "Ok", response: clone(liveUsers) });
        }
        if (target.pathname === "/private/users" && method === "POST") {
          if (userCreateStatus === 409) {
            return resp(
              {
                status: 409,
                message: "user limit reached (20/20)",
                response: {
                  code: "user_limit_reached",
                  used: 20,
                  limit: 20,
                  remaining: 0,
                },
              },
              false,
              409,
            );
          }
          const all = !!body.all_servers;
          const child = all
            ? "22222222-2222-2222-2222-222222222222"
            : "33333333-3333-3333-3333-333333333333";
          const created = {
            subscription_id: child,
            subscription_url: `frkn://sub/${child}`,
            all_servers: all,
            node_ids: all ? [] : body.node_ids || [],
            connections: all ? 1 : (body.node_ids || []).length,
            created_at: new Date().toISOString(),
          };
          if (liveUsers) liveUsers.push(created);
          return resp({
            status: 200,
            message: "Ok",
            response: {
              subscription_id: child,
              subscription_url: created.subscription_url,
              all_servers: all,
              node_ids: created.node_ids,
              connections: [],
              users: { used: (liveUsers || []).length, limit: 20, remaining: 20 },
            },
          });
        }
        if (target.pathname.startsWith("/private/users/") && method === "DELETE") {
          const child = target.pathname.split("/").pop();
          if (liveUsers) {
            const at = liveUsers.findIndex((u) => u.subscription_id === child);
            if (at !== -1) liveUsers.splice(at, 1);
          }
          return resp({
            status: 200,
            message: "Ok",
            response: { subscription_id: child, deleted: true, connections_deleted: 1 },
          });
        }
        if (target.pathname === "/private/install-token" && method === "POST") {
          if (installStatus === 409) {
            return resp(
              {
                status: 409,
                message: "server limit reached (3/3)",
                response: {
                  code: "server_limit_reached",
                  used: 3,
                  limit: 3,
                  remaining: 0,
                },
              },
              false,
              409,
            );
          }
          return resp({
            status: 200,
            message: "Ok",
            response: {
              token: "inst_fixture",
              scope_env: "custompersonal111122223333",
              expires_at: new Date(Date.now() + 3600_000).toISOString(),
              install_hint:
                "curl -fsSL https://frkn.org/install | bash -s -- --token inst_fixture",
            },
          });
        }
        if (target.pathname.startsWith("/subscription/")) return resp(sub);
        if (target.pathname === "/referrals") {
          return resp({ status: 200, response: { invited_count: 0 } });
        }
        return resp(null, false, 404);
      };
      window.QRCode = { toCanvas: () => {} };
      window.alert = () => {};
      window.confirm = () => true;
      window.HTMLElement.prototype.scrollIntoView = function () {};
      try {
        window.localStorage.setItem("__t", "1");
      } catch {
        window.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
      }
      if (!window.URL.createObjectURL) {
        window.URL.createObjectURL = () => "blob:fake";
        window.URL.revokeObjectURL = () => {};
      }
      window.addEventListener("DOMContentLoaded", () => setTimeout(readyResolve, 60));
    },
  });
  return { dom, requests, ready };
}

const hiddenByClass = (document, id) =>
  document.getElementById(id)?.classList.contains("hidden") === true;
const displayNone = (window, id) =>
  window.getComputedStyle(window.document.getElementById(id)).display === "none";

// --- 1. selfhosted cabinet ------------------------------------------------
const selfhosted = clone(SUB);
selfhosted.plan_kind = "selfhosted";
selfhosted.expires = null;
selfhosted.connections = [];
selfhosted.locations = [];
selfhosted.limit_bytes = 0;

{
  const { dom, requests, ready } = boot({
    url: "http://localhost/?id=demo-uuid-0000&mock=1",
    sub: selfhosted,
    state: STATE_FIXTURE,
  });
  await ready;
  const { document } = dom.window;
  await waitFor("selfhosted empty state", () =>
    document.getElementById("selfhosted-empty")?.classList.contains("hidden") === false,
  );

  check("body marked plan-selfhosted", dom.window.document.body.classList.contains("plan-selfhosted"));
  check("empty state visible with zero nodes", !hiddenByClass(document, "selfhosted-empty"));
  eq("empty state title", document.querySelector("#selfhosted-empty h3").textContent.trim(), TEXT.emptyTitle);
  check("renew button hidden", displayNone(dom.window, "scrollToAdd"));
  eq("renew button not rendered", displayNone(dom.window, "scrollToAdd"), true);
  check("referral button hidden", displayNone(dom.window, "openReferralModal"));
  eq("referral button not rendered", displayNone(dom.window, "openReferralModal"), true);
  check("traffic limit block hidden", hiddenByClass(document, "traffic-limit-block"));
  check("top-up block hidden", hiddenByClass(document, "topup-block"));
  eq(
    "connect sections hidden while empty",
    [...document.querySelectorAll(".connection-link-section, .quick-start-section")].map((el) =>
      el.classList.contains("hidden"),
    ),
    [true, true],
  );

  // Limits block: "N of M" for servers and users, from GET /private/state.
  await waitFor("limits rendered", () =>
    document.querySelectorAll("#selfhosted-limits .selfhosted-limit-row").length === 2,
  );
  check("limits block visible", !hiddenByClass(document, "selfhosted-limits"));
  eq(
    "state requested once",
    requests.filter((r) => new URL(r.url).pathname === "/private/state").length,
    1,
  );
  const rows = [...document.querySelectorAll("#selfhosted-limits .selfhosted-limit-row")];
  const norm = (el) => el.textContent.replace(/\s+/g, " ").trim();
  eq("servers row", norm(rows[0]), TEXT.serversRow);
  eq("users row", norm(rows[1]), TEXT.usersRow);
  dom.window.close();
}

// --- 1b. users card is visible with the api up but no own nodes -----------
{
  const { dom, ready } = boot({
    url: "http://localhost/?id=demo-uuid-0000&mock=1",
    sub: selfhosted,
    state: STATE_FIXTURE,
    nodes: [],
    users: [],
  });
  await ready;
  const { document } = dom.window;
  await waitFor(
    "users card hint without nodes",
    () =>
      document.querySelector("#selfhosted-users .shu-hint")?.textContent.trim() ===
      TEXT.noNodesHint,
  );

  check("users card visible without own nodes", !hiddenByClass(document, "selfhosted-users"));
  const add = document.querySelector("#selfhosted-users .shu-add");
  eq("add user button label", add.textContent.trim(), TEXT.addUser);
  eq("add user button disabled without nodes", add.disabled, true);
  eq(
    "no users text",
    document.querySelector("#selfhosted-users .shu-empty")?.textContent.trim(),
    TEXT.emptyUsers,
  );
  eq("users counter", document.querySelector("#selfhosted-users .shu-count").textContent.trim(), "· 0 / 20");
  dom.window.close();
}

// --- 2. standard cabinet keeps the paid blocks (regression) ---------------
{
  const standard = clone(SUB);
  standard.plan_kind = "standard";
  standard.expires = new Date(Date.now() + 30 * 86400_000).toISOString();
  const { dom, ready } = boot({
    url: "http://localhost/?id=demo-uuid-0000&mock=1",
    sub: standard,
  });
  await ready;
  const { document } = dom.window;
  await waitFor("device list", () => document.getElementById("days")?.innerText !== "...");

  check("standard: no plan-selfhosted class", !document.body.classList.contains("plan-selfhosted"));
  check("standard: empty state hidden", hiddenByClass(document, "selfhosted-empty"));
  check("standard: renew visible", !displayNone(dom.window, "scrollToAdd"));
  eq("standard: renew rendered", displayNone(dom.window, "scrollToAdd"), false);
  check("standard: referral visible", !displayNone(dom.window, "openReferralModal"));
  check(
    "standard: connect section visible",
    !document.querySelector(".connection-link-section").classList.contains("hidden"),
  );
  check("standard: limits block hidden", hiddenByClass(document, "selfhosted-limits"));
  dom.window.close();
}

// --- 3. error screen creates an empty selfhosted account ------------------
const CREATED_ID = "11111111-2222-3333-4444-555555555555";
{
  const { dom, requests, ready } = boot({
    url: "http://localhost/?mock=1",
    sub: selfhosted,
    account: {
      status: 200,
      message: "Ok",
      response: {
        subscription_id: CREATED_ID,
        plan_kind: "selfhosted",
        scope_env: "custompremium-abc",
      },
    },
  });
  await ready;
  const { document } = dom.window;
  const btn = await waitFor("create button", () => document.getElementById("create-selfhosted-account"));
  eq("create button label", btn.textContent.trim(), TEXT.create);

  btn.click();
  await waitFor("account POST", () =>
    requests.some((r) => r.method === "POST" && new URL(r.url).pathname === "/private/account"),
  );
  await waitFor("uuid stored", () => dom.window.localStorage.getItem("frkn_sub_id") === CREATED_ID);

  const accountReqs = requests.filter(
    (r) => r.method === "POST" && new URL(r.url).pathname === "/private/account",
  );
  eq("exactly one account POST", accountReqs.length, 1);
  eq("account POST target", new URL(accountReqs[0].url).pathname, "/private/account");
  eq("returned uuid stored for the redirect", dom.window.localStorage.getItem("frkn_sub_id"), CREATED_ID);
  eq("no error shown on success", document.getElementById("sub-error").textContent, "");
  eq("button re-enabled", btn.disabled, false);
  eq("button label restored", btn.textContent.trim(), TEXT.create);
  dom.window.close();
}

// --- 4. failed creation reports a localized error -------------------------
{
  const { dom, requests, ready } = boot({
    url: "http://localhost/?mock=1",
    sub: selfhosted,
    failAccount: true,
  });
  await ready;
  const { document } = dom.window;
  const btn = await waitFor("create button", () => document.getElementById("create-selfhosted-account"));
  btn.click();
  await waitFor("localized failure", () =>
    document.getElementById("sub-error").textContent.length > 0,
  );
  eq("failed create shows localized error", document.getElementById("sub-error").textContent, TEXT.error);
  eq("failed create stores nothing", dom.window.localStorage.getItem("frkn_sub_id"), null);
  eq(
    "failed create attempted once",
    requests.filter((r) => r.method === "POST" && new URL(r.url).pathname === "/private/account").length,
    1,
  );
  dom.window.close();
}

// --- 5. exhausted server cap: minting an install command returns 409 -------
{
  const { dom, requests, ready } = boot({
    url: "http://localhost/?id=demo-uuid-0000&mock=1",
    sub: selfhosted,
    state: {
      subscription_id: "demo-uuid-0000",
      plan_kind: "selfhosted",
      servers: { used: 3, limit: 3, remaining: 0 },
      users: { used: 1, limit: 20, remaining: 19 },
    },
    installStatus: 409,
  });
  await ready;
  const { document } = dom.window;
  const btn = await waitFor("node install button", () =>
    document.getElementById("openNodeInstall"),
  );
  btn.click();
  const note = await waitFor("localized limit message", () => {
    const text = document.getElementById("node-install-note").textContent;
    return text.includes(TEXT.limitMarker) ? text : null;
  });
  eq("409 shows the localized limit message", note, TEXT.limitNote);
  eq("409 renders no command", document.getElementById("node-install-cmd").textContent, "");
  check(
    "409 keeps the install box open",
    !document.getElementById("node-install").classList.contains("hidden"),
  );
  eq(
    "exactly one install-token POST",
    requests.filter(
      (r) => r.method === "POST" && new URL(r.url).pathname === "/private/install-token",
    ).length,
    1,
  );
  // The exhausted account renders "0 free" from /private/state.
  await waitFor("full limits rendered", () =>
    document.querySelectorAll("#selfhosted-limits .selfhosted-limit-row").length === 2,
  );
  check(
    "exhausted server count marked",
    document.querySelector(
      '#selfhosted-limits .selfhosted-limit-row[data-kind="servers"] b.is-full',
    )?.textContent === "3",
  );
  dom.window.close();
}

// --- 6. selfhosted users card: list, create (all / subset), revoke --------
const NODES_FIXTURE = [
  {
    uuid: "node-1",
    hostname: "de1.frkn.org",
    label: "Frankfurt",
    country: "DE",
    status: "Online",
    env: "custompersonal111122223333",
    inbounds: ["AmneziaWg"],
  },
  {
    uuid: "node-2",
    hostname: "fi1.frkn.org",
    label: "Helsinki",
    country: "FI",
    status: "Offline",
    env: "custompersonal111122223333",
    inbounds: ["AmneziaWgMobile"],
  },
  {
    uuid: "node-3",
    hostname: "nl1.frkn.org",
    label: "Amsterdam",
    country: "NL",
    status: "Online",
    env: "custompersonal111122223333",
    inbounds: ["Hysteria2"],
  },
];
const USER_A = "aaaaaaaa-1111-2222-3333-444444444444";
const USERS_FIXTURE = [
  {
    subscription_id: USER_A,
    subscription_url: `frkn://sub/${USER_A}`,
    all_servers: true,
    node_ids: [],
    connections: 1,
    created_at: "2026-10-01T00:00:00Z",
  },
];
const USERS_STATE = {
  subscription_id: "demo-uuid-0000",
  plan_kind: "selfhosted",
  servers: { used: 2, limit: 3, remaining: 1 },
  users: { used: 1, limit: 20, remaining: 19 },
};

{
  const { dom, requests, ready } = boot({
    url: "http://localhost/?id=demo-uuid-0000&mock=1",
    sub: selfhosted,
    state: USERS_STATE,
    nodes: NODES_FIXTURE,
    users: USERS_FIXTURE,
    dynamicUsersState: true,
  });
  await ready;
  const { document } = dom.window;
  const card = () => document.getElementById("selfhosted-users");
  const rows = () => [...card().querySelectorAll(".shu-row")];
  const posts = () =>
    requests.filter(
      (r) => r.method === "POST" && new URL(r.url).pathname === "/private/users",
    );
  const norm = (el) => el.textContent.replace(/\s+/g, " ").trim();

  await waitFor("users card with a row", () => rows().length === 1);
  check("users card visible with an own node", !hiddenByClass(document, "selfhosted-users"));
  eq(
    "users card title and count",
    norm(card().querySelector(".shu-head h3")),
    `${TEXT.usersTitle} · 1 / 20`,
  );
  eq(
    "state requested once on load",
    requests.filter((r) => new URL(r.url).pathname === "/private/state").length,
    1,
  );
  const row = rows()[0];
  eq("row id is the child subscription", row.dataset.id, USER_A);
  eq("row shows the frkn:// link", norm(row.querySelector("code")), `frkn://sub/${USER_A}`);
  check("row shows the scope", norm(row.querySelector(".shu-meta")).startsWith(TEXT.scopeAll));
  check(
    "row shows the connection count",
    norm(row.querySelector(".shu-meta")).includes(`${TEXT.connectionsLabel}: 1`),
  );
  eq(
    "row actions",
    [...row.querySelectorAll("button[data-act]")].map((b) => b.dataset.act),
    ["copy", "qr", "revoke"],
  );

  // Node picker: AWG-less nodes are listed but not selectable.
  card().querySelector(".shu-add").click();
  eq(
    "modal opens",
    card().querySelector(".shu-modal").classList.contains("shu-off"),
    false,
  );
  const boxes = () => [...card().querySelectorAll('.shu-nodes input[type="checkbox"]')];
  eq("every own node listed", boxes().length, 3);
  eq("AWG-less node disabled", boxes()[2].disabled, true);
  eq("AWG nodes selectable", [boxes()[0].disabled, boxes()[1].disabled], [false, false]);
  eq(
    "node picker hidden while scope=all",
    card().querySelector(".shu-nodes").classList.contains("shu-off"),
    true,
  );

  // Scope "all servers": all_servers only, no node_ids.
  card().querySelector(".shu-create").click();
  await waitFor("first create POST", () => posts().length === 1);
  eq("all-servers body", posts()[0].body, {
    subscription_id: "demo-uuid-0000",
    all_servers: true,
  });
  await waitFor("list refreshed after create", () => rows().length === 2);
  eq(
    "count follows the create response",
    norm(card().querySelector(".shu-count")),
    "· 2 / 20",
  );
  eq(
    "modal closes after create",
    card().querySelector(".shu-modal").classList.contains("shu-off"),
    true,
  );
  check(
    "new row is the created child",
    rows().some((r) => r.dataset.id === "22222222-2222-2222-2222-222222222222"),
  );

  // Scope "pick servers": node_ids only, and an empty pick is refused locally.
  card().querySelector(".shu-add").click();
  const radios = [...card().querySelectorAll('input[name="shu-scope"]')];
  radios[1].click();
  eq(
    "node picker shown for subset",
    card().querySelector(".shu-nodes").classList.contains("shu-off"),
    false,
  );
  card().querySelector(".shu-create").click();
  eq(
    "empty subset refused before the api",
    card().querySelector(".shu-error").classList.contains("shu-off"),
    false,
  );
  eq("empty subset sends nothing", posts().length, 1);
  boxes()[1].click();
  card().querySelector(".shu-create").click();
  await waitFor("second create POST", () => posts().length === 2);
  eq("subset body", posts()[1].body, {
    subscription_id: "demo-uuid-0000",
    node_ids: ["node-2"],
  });
  await waitFor("list refreshed after subset create", () => rows().length === 3);

  // Revoke: DELETE carries the owner id, the row disappears.
  rows()
    .find((r) => r.dataset.id === USER_A)
    .querySelector('button[data-act="revoke"]')
    .click();
  await waitFor("delete request", () =>
    requests.some(
      (r) => r.method === "DELETE" && new URL(r.url).pathname === `/private/users/${USER_A}`,
    ),
  );
  const del = requests.find((r) => r.method === "DELETE");
  eq("delete carries the owner id", new URL(del.url).searchParams.get("subscription_id"), "demo-uuid-0000");
  await waitFor("list refreshed after revoke", () => rows().length === 2);
  eq(
    "count follows the state after revoke",
    norm(card().querySelector(".shu-count")),
    "· 2 / 20",
  );
  check("revoked row is gone", !rows().some((r) => r.dataset.id === USER_A));
  dom.window.close();
}

// --- 7. exhausted user cap: the add button is off and explains why ---------
{
  const { dom, ready } = boot({
    url: "http://localhost/?id=demo-uuid-0000&mock=1",
    sub: selfhosted,
    state: {
      subscription_id: "demo-uuid-0000",
      plan_kind: "selfhosted",
      servers: { used: 1, limit: 3, remaining: 2 },
      users: { used: 20, limit: 20, remaining: 0 },
    },
    nodes: NODES_FIXTURE,
    users: [],
  });
  await ready;
  const { document } = dom.window;
  const card = () => document.getElementById("selfhosted-users");
  await waitFor("users card", () => !hiddenByClass(document, "selfhosted-users"));
  const norm = (el) => el.textContent.replace(/\s+/g, " ").trim();
  eq("empty users list", norm(card().querySelector(".shu-empty")), TEXT.emptyUsers);
  eq("add disabled with no slots", card().querySelector(".shu-add").disabled, true);
  eq("no-slots hint", norm(card().querySelector(".shu-hint")), TEXT.noSlots);
  dom.window.close();
}

if (failed) {
  console.error("❌ selfhosted account e2e failed");
  process.exit(1);
}
console.log(`✅ selfhosted account e2e passed (${LANG})`);
process.exit(0);
