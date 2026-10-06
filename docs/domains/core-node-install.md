# Core node install (internal)

Cheat sheet for raising **our** fleet nodes with the same `install` script.
Not linked from the public `/selfhosted` page.

Public self-hosted users only see `--token inst_…` (private). Core and
premium both use the API service token; mode is picked from `--env`:

| `--env` | Mode |
|---|---|
| `dev` / `ru` / `wl` / `prod` / `experimental` | **core** |
| `custom…` (subscription scope_env) | **premium** |
| `custompersonal…` | rejected — use `--token inst_…` |

## Core one-liner

```bash
curl -fsSL https://frkn.org/install | bash -s -- \
  --api-token 'SERVICE_TOKEN' \
  --env dev \
  --profile full \
  --label 'SWE2' \
  --country SWE
```

## Premium one-liner

Same token, scope env from the subscription (`scope_env`, usually `custom…`):

```bash
curl -fsSL https://frkn.org/install | bash -s -- \
  --api-token 'SERVICE_TOKEN' \
  --env 'customSCOPE' \
  --profile full \
  --label 'PREM-…' \
  --country SWE
```

Reuse an existing node uuid on reinstall:

```bash
curl -fsSL https://frkn.org/install | bash -s -- \
  --api-token 'SERVICE_TOKEN' \
  --env dev \
  --profile full \
  --uuid 'b57b5785-d79e-4365-9101-94b0d695d9ea' \
  --label 'SWE2' \
  --country SWE
```

## Env file

```bash
# /root/frkn-setup.env
API_TOKEN=…
ENV=dev
PROFILE=full
LABEL=SWE2
COUNTRY=SWE
UUID=…                    # optional
HOSTNAME=swe2.frkn.org    # optional; ACME / node.hostname
API_ENDPOINT=https://api.frkn.org
ZMQ_ENDPOINT=tcp://api.frkn.org:3001
METRICS_ZMQ_ENDPOINT=tcp://api.frkn.org:3002
MAX_BANDWIDTH_BPS=200000000
```

```bash
curl -fsSL https://frkn.org/install | bash -s -- --env-file /root/frkn-setup.env
```

`--token` and `--api-token` are mutually exclusive. Core/premium never use `inst_…`.

## Profiles

| Profile | Packages |
|---|---|
| `full` (default) | awg0 + awg1 + hysteria2 + fnode (**no** WireGuard) |
| `awg` | awg0 + awg1 + fnode |
| `wg` | wireguard wg0 + fnode |
| `hysteria2` | hysteria2 + fnode |

### WireGuard-only (core)

Matches API `wireguard_network = 10.100.0.0/16`. Path: `/opt/wireguard/wg0.conf`.

```bash
curl -fsSL https://frkn.org/install | bash -s -- \
  --api-token 'SERVICE_TOKEN' \
  --env ru \
  --profile wg \
  --label 'MSK TW' \
  --country RU \
  --hostname msk-tw.frkn.org
```

`--force-wg-conf` regenerates server keys (then refresh client sub).

## AWG obfuscation generation

| Flag | Values | Default |
|---|---|---|
| `--awg-version` | `3.1` \| `2.0` | `3.1` (awg0 + awg1) |
| `--awg-mobile-version` | `3.1` \| `2.0` \| `legacy` | same as `--awg-version` |
| `--force-awg-conf` | — | keep existing `/opt/amnezia/awg{0,1}.conf` |

- **3.1** — S1–S4, H-ranges, `I1=<r 128>`, `RandomTrailers=on`, `DisableCookies=on`
- **2.0** — same field set without 3.1 device flags (LTE fallback when 3.1 stalls)
- **legacy** (mobile) — `H1=1…H4=4`, only S1/S2 — aggressive RU LTE middleboxes

After `--force-awg-conf`: `systemctl restart fnode` (script does) + **full**
client subscription refresh. Stale junk → Unknown message / Invalid MAC.
Prefer changing generation over reshuffling mobile↔desktop ports.

## Idempotent re-run

Second run should not fail: uuid reused from `/root/.env` or
`/opt/fnode/config.toml`; awg/hysteria confs kept unless `--force-awg-conf`;
private mode reuses `/opt/fnode/api.token` (can omit a fresh `--token`).
`awg-quick` is brought down/up with leftover link cleanup.

Aliases (still need flags/`--env-file` for the token):

- `https://frkn.org/install/full`
- `https://frkn.org/install/amnezia` → profile `awg`
- `https://frkn.org/install/hysteria2`

## What the script writes

- `/opt/amnezia/awg0.conf` — AmneziaWg (`100.64.0.0/10`, port 51820)
- `/opt/amnezia/awg1.conf` — AmneziaWgMobile (`10.77.0.0/16`, port 8443)
- `/opt/hysteria2/` + `hysteria2.service` (not legacy `hysteria`)
- `/opt/fnode/config.toml` + `/opt/fnode/fnode`
- `/root/.env` (sourced cheat sheet on the box)

Register: `POST /node` with the service token. Personal/`custompersonal…` is
rejected on this path (use private install). Premium custom scopes are fine.

## Checklist before first start

1. DNS A for hostname if profile includes hysteria2 (ACME :443).
2. Correct `--env` for the fleet bucket or premium scope.
3. Stable `--uuid` if replacing a dead box that should keep the same node id.
4. `systemctl status fnode awg-quick@awg0 awg-quick@awg1 hysteria2`

## Related

- Public page: `/selfhosted` (private only)
- Script notes: [install-setup.md](install-setup.md)
- API private nodes: `ffcore/docs/private-nodes.md`
