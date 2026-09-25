# Install & setup

The `install` script and the `setup/` connection guides.

Marketing page (private / self-hosted users): [`/selfhosted`](../../selfhosted/).  
**Core fleet cheat sheet (internal):** [core-node-install.md](core-node-install.md).

## `install` (bash, Ubuntu)

Served as `text/plain` at `GET /install` for `curl | bash`.

| Mode | Flag | Who |
|---|---|---|
| private | `--token inst_…` | end users (cabinet) |
| core | `--api-token … --env dev\|ru\|wl\|…` | our shared fleet |
| premium | `--api-token … --env custom…` | managed premium scope |

Profiles: `full` (default) = awg0+awg1+hysteria2+fnode; `awg`; `hysteria2`.

Banner at start shows `Private` / `Core` / `Premium` by mode.

Aliases: `/install/full`, `/install/amnezia`, `/install/hysteria2`, `/install/legacy`.

Arch Linux: planned after Ubuntu is battle-tested.

## `setup/`

Static connection guides (no API) — platform tabs and router how-tos.
