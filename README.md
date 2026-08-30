# FRKN

Development env with static website for [frkn.org](https://frkn.org), served by Nginx. Suitable for web dev iterations.

## Run locally with Docker

### Requirements

- [Docker](https://docs.docker.com/get-docker/)/[Podman](https://podman.io/docs/installation)/[OrbStack](https://orbstack.dev/download/)

### Build and start

From the repository root:

```bash
docker build -t frkn-org .
docker run --rm -p 8080:80 frkn-org
```

Open the site at:

```text
http://localhost:8080
```

- The container serves port `80`; `-p 8080:80` maps it to port `8080` on the host.

- Stop the server with `Ctrl+C`. The `--rm` flag removes the container automatically.

- Verify the container

The image exposes a health endpoint:

```bash
curl http://localhost:8080/health
```

Expected response:

```text
ok
```

## Run the subscription wizard without a backend

`/subscription/?id=…` normally talks to `api.frkn.org`. To click through the
wizard (including the AmneziaWG "download all configs as .zip" button) fully
locally, run the mock API and open the page with `&mock=1`:

```bash
# terminal 1 — mock api.frkn.org (http://127.0.0.1:3000)
node tools/mock-api/serve.js

# terminal 2 — the site
docker build -t frkn-org .
docker run -d --rm -p 8081:80 --name frkn-preview frkn-org
```

Then open:

```text
http://localhost:8081/subscription/?id=demo-uuid-0000&mock=1
```

Click **«Больше настроек и приложений»** → AmneziaWG → pick an OS → the
final step shows **«⬇ Скачать все (N конф., .zip)»**.

## Docs

- [docs/RUNBOOK.md](docs/RUNBOOK.md) — build/run/health, mock API, e2e test,
  screenshots, deploy.
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — how the static site fits together.
