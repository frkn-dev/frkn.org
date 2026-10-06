#!/usr/bin/env python3
from __future__ import annotations

import csv
import json
import os
import re
import time
import urllib.request
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

HOST = os.environ.get("PRESET_INBOX_HOST", "127.0.0.1")
PORT = int(os.environ.get("PRESET_INBOX_PORT", "9120"))
CSV_PATH = Path(
    os.environ.get("PRESET_INBOX_CSV", "/opt/frkn.app/preset/requests.csv")
)
KNOWN_PATH = Path(
    os.environ.get("PRESET_INBOX_KNOWN", "/opt/frkn.app/preset/known.json")
)
MRKTING_URL = os.environ.get(
    "PRESET_INBOX_MRKTING_URL", "http://127.0.0.1:9103/split_presets"
)
MRKTING_TOKEN = os.environ.get("PRESET_INBOX_MRKTING_TOKEN", "")
SUPPORT_URL = os.environ.get("PRESET_INBOX_SUPPORT", "https://t.me/frkn_support")
MAX_BODY = 16_384
MAX_ITEMS = 20
CACHE_TTL = 60

HOST_RE = re.compile(
    r"^(?=.{1,253}$)(?!-)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?"
    r"(?:\.(?!-)[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$",
    re.I,
)
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
CONTACT_RE = re.compile(r"^[@a-zA-Z0-9_./:\-]{3,80}$")

_known_cache: dict | None = None
_known_at = 0.0


def norm_text(s: str) -> str:
    return re.sub(r"\s+", " ", (s or "").strip().lower().replace("ё", "е"))


def normalize_host(raw: str) -> str | None:
    s = (raw or "").strip()
    if not s or len(s) > 500 or " " in s:
        return None
    if "://" not in s:
        if "/" in s or s.count(".") >= 1:
            s = "https://" + s
        else:
            return None
    try:
        u = urlparse(s)
    except Exception:
        return None
    if u.scheme not in ("http", "https"):
        return None
    host = (u.hostname or "").strip(".").lower()
    if not host or not HOST_RE.match(host):
        return None
    if u.username or u.password:
        return None
    return host


def looks_like_url_or_host(raw: str) -> bool:
    s = (raw or "").strip()
    if not s:
        return False
    if "://" in s or "/" in s:
        return True
    if " " in s:
        return False
    return bool(HOST_RE.match(s.strip().lower()))


def normalize_contact(raw: str) -> str | None:
    s = (raw or "").strip()
    if not s:
        return None
    if len(s) > 120:
        return None
    if EMAIL_RE.match(s):
        return s.lower()
    if s.startswith("https://t.me/") or s.startswith("http://t.me/"):
        s = s.split("t.me/", 1)[1].split("?")[0].strip("/")
        s = "@" + s.lstrip("@")
    if s.startswith("t.me/"):
        s = "@" + s[5:].split("?")[0].strip("/")
    if not s.startswith("@") and re.fullmatch(r"[A-Za-z0-9_]{4,32}", s):
        s = "@" + s
    if CONTACT_RE.match(s):
        return s
    return None


def load_known_file() -> list[dict]:
    try:
        data = json.loads(KNOWN_PATH.read_text(encoding="utf-8"))
    except Exception:
        return []
    presets = data.get("presets") if isinstance(data, dict) else data
    if not isinstance(presets, list):
        return []
    out = []
    for p in presets:
        if not isinstance(p, dict) or not p.get("id"):
            continue
        out.append(
            {
                "id": str(p["id"]),
                "name": str(p.get("name") or p["id"]),
                "aliases": [str(a) for a in (p.get("aliases") or [])],
                "domains": [str(d).lower() for d in (p.get("domains") or []) if d],
            }
        )
    return out


def fetch_live_presets() -> list[dict]:
    if not MRKTING_TOKEN:
        return []
    req = urllib.request.Request(
        MRKTING_URL,
        headers={"Authorization": f"Bearer {MRKTING_TOKEN}"},
        method="GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"[preset-inbox] live presets fetch failed: {e}")
        return []
    rows = data.get("presets") if isinstance(data, dict) else []
    out = []
    for p in rows or []:
        if not isinstance(p, dict) or not p.get("id"):
            continue
        if p.get("active") is False:
            continue
        domains = []
        for d in p.get("domains") or []:
            ds = str(d).lower()
            if "/" in ds:
                continue
            domains.append(ds)
        out.append(
            {
                "id": str(p["id"]),
                "name": str(p.get("name") or p["id"]),
                "aliases": [],
                "domains": domains,
            }
        )
    return out


def merge_presets(base: list[dict], extra: list[dict]) -> list[dict]:
    by_id: dict[str, dict] = {}
    for p in base + extra:
        cur = by_id.get(p["id"])
        if not cur:
            by_id[p["id"]] = {
                "id": p["id"],
                "name": p["name"],
                "aliases": list(p.get("aliases") or []),
                "domains": list(p.get("domains") or []),
            }
            continue
        if p.get("name"):
            cur["name"] = p["name"]
        for a in p.get("aliases") or []:
            if a not in cur["aliases"]:
                cur["aliases"].append(a)
        for d in p.get("domains") or []:
            if d not in cur["domains"]:
                cur["domains"].append(d)
    return list(by_id.values())


def get_known() -> list[dict]:
    global _known_cache, _known_at
    now = time.time()
    if _known_cache is not None and now - _known_at < CACHE_TTL:
        return _known_cache
    merged = merge_presets(load_known_file(), fetch_live_presets())
    _known_cache = merged
    _known_at = now
    return merged


def host_matches(host: str, domain: str) -> bool:
    host = host.lower().rstrip(".")
    domain = domain.lower().rstrip(".")
    if not domain or "/" in domain:
        return False
    return host == domain or host.endswith("." + domain)


def match_known(item: str, known: list[dict]) -> dict | None:
    host = normalize_host(item) if looks_like_url_or_host(item) else None
    if host:
        for p in known:
            for d in p["domains"]:
                if host_matches(host, d):
                    return {
                        "input": item,
                        "id": p["id"],
                        "name": p["name"],
                        "via": "domain",
                    }
        return None

    key = norm_text(item)
    if not key or len(key) > 80:
        return None
    for p in known:
        names = [p["id"], p["name"], *p.get("aliases", [])]
        for n in names:
            if key == norm_text(n):
                return {
                    "input": item,
                    "id": p["id"],
                    "name": p["name"],
                    "via": "name",
                }
    return None


def classify_item(raw: str) -> dict | None:
    s = (raw or "").strip()
    if not s or len(s) > 200:
        return None
    if looks_like_url_or_host(s):
        host = normalize_host(s)
        if not host:
            return None
        return {"kind": "host", "value": host, "input": s}
    name = re.sub(r"\s+", " ", s).strip()
    if len(name) < 2:
        return None
    if not re.search(r"[A-Za-zА-Яа-яЁё0-9]", name):
        return None
    return {"kind": "name", "value": name, "input": s}


def extract_items(payload: dict) -> list[dict]:
    raw_items: list[str] = []
    for key in ("url", "name", "query"):
        if isinstance(payload.get(key), str):
            raw_items.append(payload[key])
    for key in ("urls", "names", "items"):
        val = payload.get(key)
        if isinstance(val, str):
            raw_items.extend(x.strip() for x in re.split(r"[\n;]+", val) if x.strip())
        elif isinstance(val, list):
            raw_items.extend(str(x) for x in val if x is not None)

    out: list[dict] = []
    seen: set[tuple[str, str]] = set()
    for raw in raw_items:
        item = classify_item(raw)
        if not item:
            continue
        key = (item["kind"], norm_text(item["value"]))
        if key in seen:
            continue
        seen.add(key)
        out.append(item)
        if len(out) >= MAX_ITEMS:
            break
    return out


def append_csv(rows: list[dict], contact: str | None, ip: str) -> None:
    CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    new_file = not CSV_PATH.exists()
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    with CSV_PATH.open("a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        if new_file:
            w.writerow(["added_at", "kind", "value", "contact", "ip"])
        for row in rows:
            w.writerow([now, row["kind"], row["value"], contact or "", ip])


class Handler(BaseHTTPRequestHandler):
    server_version = "preset-inbox/1.1"

    def log_message(self, fmt: str, *args) -> None:
        print(f"[preset-inbox] {self.address_string()} {fmt % args}")

    def _cors(self) -> None:
        origin = self.headers.get("Origin") or ""
        if origin in ("https://frkn.app", "https://www.frkn.app", "https://frkn.org"):
            self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "86400")

    def _json(self, code: int, body: dict) -> None:
        data = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self._cors()
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self) -> None:
        if self.path.rstrip("/") in ("", "/health"):
            self._json(200, {"ok": True, "known": len(get_known())})
            return
        self._json(404, {"ok": False, "error": "not_found"})

    def do_POST(self) -> None:
        if self.path.rstrip("/") not in ("", "/submit", "/preset/submit"):
            self._json(404, {"ok": False, "error": "not_found"})
            return
        length = int(self.headers.get("Content-Length") or "0")
        if length <= 0 or length > MAX_BODY:
            self._json(400, {"ok": False, "error": "bad_body"})
            return
        raw = self.rfile.read(length)
        try:
            payload = json.loads(raw.decode("utf-8"))
        except Exception:
            self._json(400, {"ok": False, "error": "invalid_json"})
            return
        if not isinstance(payload, dict):
            self._json(400, {"ok": False, "error": "invalid_json"})
            return

        items = extract_items(payload)
        if not items:
            self._json(400, {"ok": False, "error": "no_valid_items"})
            return

        contact_raw = payload.get("contact") or payload.get("email") or payload.get("telegram")
        contact = None
        if isinstance(contact_raw, str) and contact_raw.strip():
            contact = normalize_contact(contact_raw)
            if contact is None:
                self._json(400, {"ok": False, "error": "bad_contact"})
                return

        known = get_known()
        already = []
        accepted = []
        for item in items:
            hit = match_known(item["input"], known) or match_known(item["value"], known)
            if hit:
                already.append(hit)
            else:
                accepted.append(item)

        if not accepted and already:
            names = ", ".join(sorted({a["name"] for a in already}))
            self._json(
                409,
                {
                    "ok": False,
                    "error": "already_known",
                    "already": already,
                    "support": SUPPORT_URL,
                    "message": (
                        f"Уже есть в каталоге: {names}. "
                        f"Если что-то не работает — напиши в поддержку {SUPPORT_URL}"
                    ),
                },
            )
            return

        ip = (
            (self.headers.get("X-Forwarded-For") or "").split(",")[0].strip()
            or self.client_address[0]
        )
        try:
            append_csv(accepted, contact, ip)
        except OSError:
            self._json(500, {"ok": False, "error": "write_failed"})
            return

        body = {
            "ok": True,
            "accepted": [{"kind": a["kind"], "value": a["value"]} for a in accepted],
        }
        if already:
            body["already"] = already
            body["support"] = SUPPORT_URL
            body["message"] = (
                "Часть уже есть в каталоге. Если пресет не работает — "
                f"напиши в поддержку {SUPPORT_URL}"
            )
        self._json(200, body)


def main() -> None:
    CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
    httpd = ThreadingHTTPServer((HOST, PORT), Handler)
    print(
        f"[preset-inbox] listening on {HOST}:{PORT} csv={CSV_PATH} known={KNOWN_PATH}"
    )
    httpd.serve_forever()


if __name__ == "__main__":
    main()
