# Install & setup

The `install` script (self-hosted VPN node installer) and the `setup/` connection guides. Load when editing either.

## `install` (24.5 KB, 823 lines, bash)

Interactive installer for a user's own FRKN VPN node, served as `text/plain` at `GET /install` (special Nginx location) for `curl | sh`.

Steps:
- Checks root + OS, installs packages via apt/yum/dnf.
- Installs **Xray-core** (releases from `github.com/XTLS/Xray-core`, default v26.3.27, generates Reality x25519 keys).
- Installs **Hysteria2** (`github.com/apernet/hysteria`, ACME, masquerade as microsoft.com, optional HTTP auth via `https://api.frkn.org/auth`).
- Installs **Fnode** (`github.com/frkn-dev/fcore`).
- All with systemd units. Menu: install Xray / Hysteria2 / Fnode.

## `setup/`

Static connection guides (no API):

| Path | What |
|---|---|
| `setup/index.html` (27.7 KB) | "How to connect" with platform tabs |
| `setup/routers/` (45.5 KB) | "VPN on router": XKeen / OpenWRT / AmneziaWG |
| `setup/amneziawg-routers/` | redirect stub → `/setup/routers/` |

## Related

- `dopamine/` is the landing for FRKN's own client (not setup docs). See [site-structure.md](site-structure.md).
- Protocol explainers live in `info/subscriptions/`.