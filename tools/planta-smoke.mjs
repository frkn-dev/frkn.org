#!/usr/bin/env node
const API = (process.env.PLANTA_API_BASE || "https://api.frkn.org").replace(
  /\/$/,
  "",
);
const POLL_TRIES = Number(process.env.PLANTA_POLL_TRIES || 8);
const POLL_MS = Number(process.env.PLANTA_POLL_MS || 2500);

const cases = [
  {
    name: "lite 1 GiB (~67 RUB)",
    body: { duration: 0, kind: "lite", traffic_gib: 1, alt_price: false },
  },
  {
    name: "lite 5 GiB (~167 RUB)",
    body: { duration: 0, kind: "lite", traffic_gib: 5, alt_price: false },
  },
  {
    name: "unlimited 30d (~500 RUB)",
    body: { duration: 30 },
  },
];

let failed = 0;

function log(ok, ...args) {
  console.log(ok ? "✅" : "❌", ...args);
  if (!ok) failed += 1;
}

async function create(body, label) {
  const traceId = `planta-smoke-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const res = await fetch(`${API}/payment/planta/key/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Trace-Id": traceId,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`${label}: non-JSON ${res.status} ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    throw new Error(
      `${label}: HTTP ${res.status} ${data.error || text.slice(0, 200)}`,
    );
  }
  return { ...data, _traceSent: traceId };
}

async function check(txid) {
  const res = await fetch(`${API}/payment/check/${txid}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`check ${txid}: HTTP ${res.status}`);
  return data;
}

async function waitPaymentUrl(txid, label) {
  for (let i = 0; i < POLL_TRIES; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, POLL_MS));
    const data = await check(txid);
    if (data.paymentUrl) return data.paymentUrl;
    if (data.status === "failed" || data.status === "cancelled") {
      throw new Error(`${label}: status ${data.status}`);
    }
  }
  return null;
}

async function runCase(c) {
  process.stdout.write(`\n—— ${c.name} ——\n`);
  const created = await create(c.body, c.name);
  console.log(
    "create:",
    JSON.stringify({
      transactionId: created.transactionId,
      status: created.status,
      paymentUrl: created.paymentUrl,
      traceId: created.traceId || created._traceSent,
    }),
  );
  if (!created.transactionId) {
    log(false, c.name, "no transactionId");
    return;
  }
  let url = created.paymentUrl || null;
  if (!url) {
    console.log(`paymentUrl null on create → poll ×${POLL_TRIES}`);
    url = await waitPaymentUrl(created.transactionId, c.name);
  }
  if (!url) {
    log(
      false,
      c.name,
      `no paymentUrl (txid=${created.transactionId})`,
    );
    return;
  }
  const nspk = /^https:\/\/qr\.nspk\.ru\//.test(url);
  log(nspk, c.name, nspk ? url : `unexpected url: ${url}`);
}

console.log(`Planta smoke → ${API}`);
console.log(`poll: ${POLL_TRIES} × ${POLL_MS}ms`);

for (const c of cases) {
  try {
    await runCase(c);
  } catch (e) {
    log(false, c.name, e.message);
  }
}

console.log(
  failed
    ? `\nFAIL: ${failed}/${cases.length} cases`
    : `\nPASS: ${cases.length}/${cases.length} cases`,
);
process.exit(failed ? 1 : 0);
