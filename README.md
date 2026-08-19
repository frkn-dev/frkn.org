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
