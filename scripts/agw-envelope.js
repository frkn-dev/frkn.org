/**
 * AGW envelope client for the peers api (`POST /v1/locations`, `/v1/peers`, …).
 *
 * The api speaks only in the AGW envelope: an AES-256-CBC body whose key is
 * wrapped with the api RSA public key (PKCS#1 v1.5). WebCrypto has AES-CBC but
 * no PKCS#1 v1.5 encryption and no X25519 keygen in older browsers, so both are
 * implemented here in plain JS (BigInt) — no external libraries, no CDN.
 *
 * Verified against the reference: the X25519 keypair matches `wg pubkey`, the
 * RSA/AES envelope round-trips with the openssl-based clients, and the RFC 7748
 * test vector passes.
 */
(function (root) {
  "use strict";

  function b64(bytes) {
    let s = "";
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
  }

  function unb64(str) {
    const bin = atob(str);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function derNext(buf, pos) {
    let len = buf[pos + 1];
    let p = pos + 2;
    if (len & 0x80) {
      const n = len & 0x7f;
      len = 0;
      for (let i = 0; i < n; i++) len = len * 256 + buf[p++];
    }
    return { start: p, end: p + len };
  }

  function bytesToBig(bytes) {
    let hex = "";
    for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
    return BigInt("0x" + (hex || "0"));
  }

  /** SubjectPublicKeyInfo PEM -> { n, e, size }. */
  function parseRsaPublicKey(pem) {
    const der = unb64(String(pem).replace(/-----[^-]+-----/g, "").replace(/\s+/g, ""));
    const spki = derNext(der, 0);
    const alg = derNext(der, spki.start);
    const bits = derNext(der, alg.end);
    const rsa = derNext(der, bits.start + 1);
    const nInt = derNext(der, rsa.start);
    const eInt = derNext(der, nInt.end);
    let nBytes = der.subarray(nInt.start, nInt.end);
    // A DER INTEGER carries a leading 0x00 when the top bit is set; keeping it
    // makes the modulus one byte too long and the api rejects the ciphertext.
    while (nBytes.length > 1 && nBytes[0] === 0) nBytes = nBytes.subarray(1);
    return {
      n: bytesToBig(nBytes),
      e: bytesToBig(der.subarray(eInt.start, eInt.end)),
      size: nBytes.length,
    };
  }

  function modPow(base, exp, mod) {
    let result = 1n;
    let b = base % mod;
    let e = exp;
    while (e > 0n) {
      if (e & 1n) result = (result * b) % mod;
      b = (b * b) % mod;
      e >>= 1n;
    }
    return result;
  }

  function bigToBytes(value, len) {
    const out = new Uint8Array(len);
    let v = value;
    for (let i = len - 1; i >= 0; i--) {
      out[i] = Number(v & 0xffn);
      v >>= 8n;
    }
    return out;
  }

  /** PKCS#1 v1.5 type 2 (the only padding WebCrypto does not expose). */
  function rsaEncryptPkcs1(key, message) {
    const k = key.size;
    if (message.length > k - 11) throw new Error("message too long for RSA");
    const psLen = k - 3 - message.length;
    const ps = new Uint8Array(psLen);
    const rnd = crypto.getRandomValues(new Uint8Array(psLen + 16));
    let j = 0;
    for (let i = 0; i < psLen; i++) {
      let v = rnd[j++];
      while (v === 0) v = rnd[j++ % rnd.length];
      ps[i] = v;
    }
    const em = new Uint8Array(k);
    em[0] = 0x00;
    em[1] = 0x02;
    em.set(ps, 2);
    em[2 + psLen] = 0x00;
    em.set(message, 3 + psLen);
    return bigToBytes(modPow(bytesToBig(em), key.e, key.n), k);
  }

  async function aesCbc(keyBytes, iv, data, decrypt) {
    const usage = decrypt ? "decrypt" : "encrypt";
    const key = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-CBC" }, false, [
      usage,
    ]);
    const out = await crypto.subtle[usage]({ name: "AES-CBC", iv: iv }, key, data);
    return new Uint8Array(out);
  }

  // ---- X25519 (RFC 7748) ----

  const P25519 = (1n << 255n) - 19n;

  function leToBig(bytes) {
    let n = 0n;
    for (let i = bytes.length - 1; i >= 0; i--) n = (n << 8n) | BigInt(bytes[i]);
    return n;
  }

  function bigToLe(n, len) {
    const out = new Uint8Array(len);
    let v = n;
    for (let i = 0; i < len; i++) {
      out[i] = Number(v & 0xffn);
      v >>= 8n;
    }
    return out;
  }

  function modp(a) {
    const r = a % P25519;
    return r >= 0n ? r : r + P25519;
  }

  function powMod(base, exp) {
    let result = 1n;
    let b = modp(base);
    let e = exp;
    while (e > 0n) {
      if (e & 1n) result = (result * b) % P25519;
      b = (b * b) % P25519;
      e >>= 1n;
    }
    return result;
  }

  function x25519(scalarBytes, uBytes) {
    const k = new Uint8Array(scalarBytes);
    k[0] &= 248;
    k[31] &= 127;
    k[31] |= 64;
    const kNum = leToBig(k);
    const x1 = leToBig(uBytes) & ((1n << 255n) - 1n);
    let x2 = 1n;
    let z2 = 0n;
    let x3 = x1;
    let z3 = 1n;
    let swap = 0n;
    for (let t = 254; t >= 0; t--) {
      const kt = (kNum >> BigInt(t)) & 1n;
      swap ^= kt;
      if (swap === 1n) {
        const tx = x2;
        x2 = x3;
        x3 = tx;
        const tz = z2;
        z2 = z3;
        z3 = tz;
      }
      swap = kt;
      const A = modp(x2 + z2);
      const AA = (A * A) % P25519;
      const B = modp(x2 - z2);
      const BB = (B * B) % P25519;
      const E = modp(AA - BB);
      const C = modp(x3 + z3);
      const D = modp(x3 - z3);
      const DA = (D * A) % P25519;
      const CB = (C * B) % P25519;
      const daSum = modp(DA + CB);
      const daDiff = modp(DA - CB);
      x3 = (daSum * daSum) % P25519;
      z3 = (x1 * ((daDiff * daDiff) % P25519)) % P25519;
      x2 = (AA * BB) % P25519;
      z2 = (E * modp(AA + 121665n * E)) % P25519;
    }
    if (swap === 1n) {
      const tx = x2;
      x2 = x3;
      x3 = tx;
      const tz = z2;
      z2 = z3;
      z3 = tz;
    }
    return bigToLe((x2 * powMod(z2, P25519 - 2n)) % P25519, 32);
  }

  /** WireGuard/AmneziaWG keypair in `wg genkey` / `wg pubkey` format. */
  function wgKeypair() {
    const priv = crypto.getRandomValues(new Uint8Array(32));
    priv[0] &= 248;
    priv[31] &= 127;
    priv[31] |= 64;
    const base = new Uint8Array(32);
    base[0] = 9;
    return { privateKey: b64(priv), publicKey: b64(x25519(priv, base)) };
  }

  /**
   * POST an envelope call. Returns { status, body } where body is the decoded
   * JSON (the api wraps it as {status, message, response}).
   */
  async function post(apiBase, path, bodyObj, pem) {
    const key = parseRsaPublicKey(pem);
    const aesKey = crypto.getRandomValues(new Uint8Array(32));
    const aesIv = crypto.getRandomValues(new Uint8Array(16));
    const keyJson = new TextEncoder().encode(
      JSON.stringify({ aes_key: b64(aesKey), aes_iv: b64(aesIv), aes_salt: "" }),
    );
    const keyPayload = b64(rsaEncryptPkcs1(key, keyJson));
    const apiPayload = b64(
      await aesCbc(aesKey, aesIv, new TextEncoder().encode(JSON.stringify(bodyObj)), false),
    );
    const resp = await fetch(apiBase + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyPayload: keyPayload, apiPayload: apiPayload }),
    });
    const raw = new Uint8Array(await resp.arrayBuffer());
    let body;
    if (raw[0] === 0x7b) {
      // Plain JSON: the api answered outside the envelope (peers off, bad request).
      body = JSON.parse(new TextDecoder().decode(raw));
    } else {
      const plain = await aesCbc(aesKey, aesIv, raw, true);
      body = JSON.parse(new TextDecoder().decode(plain));
    }
    return { status: resp.status, body: body };
  }

  root.FRKN_AGW = {
    b64: b64,
    unb64: unb64,
    parseRsaPublicKey: parseRsaPublicKey,
    wgKeypair: wgKeypair,
    x25519: x25519,
    post: post,
  };
})(typeof window !== "undefined" ? window : globalThis);
