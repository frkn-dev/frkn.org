# Install & setup

The `install` script and the `setup/` connection guides.

Marketing page (private / self-hosted users): [`/selfhosted`](../../selfhosted/).  
**Core fleet cheat sheet (internal):** [core-node-install.md](core-node-install.md).

## `install` (bash, Ubuntu or Arch)

Served as `text/plain` at `GET /install` for `curl | bash`.

| Mode | Flag | Who |
|---|---|---|
| private | `--token inst_…` | end users (cabinet) |
| core | `--api-token … --env dev\|ru\|wl\|…` | our shared fleet |
| premium | `--api-token … --env custom…` | managed premium scope |

Profiles: `full` (default) = awg0+awg1+hysteria2+fnode (**no** WireGuard); `awg`; `wg` (plain WireGuard); `hysteria2`.

AWG obfuscation: `--awg-version 3.1` (default) | `2.0` | `1.0` (legacy H=1..4);
mobile override `--awg-mobile-version 3.1|2.0|1.0|legacy`. Existing
`/opt/amnezia/awg*.conf` are kept on re-run; `--force-awg-conf` regenerates
junk (then refresh client sub).
Re-run reuses node uuid from `/root/.env` / `config.toml` and private
`/opt/fnode/api.token` when present.

Banner at start shows `Private` / `Core` / `Premium` by mode.

Aliases: `/install/full`, `/install/amnezia`, `/install/hysteria2`, `/install/legacy`.

Arch: same installer. AmneziaWG comes from AUR (`amneziawg-tools`, `amneziawg-dkms`); headers follow the running kernel (`linux-headers`, `linux-lts-headers`, `linux-zen-headers`, `linux-hardened-headers`). Hysteria2 and fnode-agent are the same binaries as on Ubuntu.

## `setup/`

Static connection guides (no API) — platform tabs and router how-tos.
