# Runbook

Commands for building, running, and deploying frkn.org. There are no tests or linters in this repo.

## Local (Docker)

```bash
docker build -t frkn-org .
docker run --rm -p 8080:80 frkn-org
# open http://localhost:8080
# health check:
curl http://localhost:8080/health   # → "ok"
```

Requirements: Docker / Podman / OrbStack.

## Deploy

Three manual rsync scripts, arg `$1` = `user@host` (SSH keys assumed). All exclude `.git`, `.github`, `.DS_Store`, `.gitignore`, `CNAME`, `LICENSE.txt`:

```bash
./deploy.sh            $SERVER   # prod mirror  → /opt/mirror/frkn.org/
./deploy-beta.sh       $SERVER   # beta          → /opt/beta/frkn.org/
./deploy-testflight.sh $SERVER   # testflight    → /opt/testflight/frkn.org/
```

Note: `dopamine/*.dmg|*.pkg` are gitignored but NOT excluded from rsync — they sync to the server if present locally.

## CI

`.github/workflows/pages.yml` — "Deploy static content to Pages". Triggers: push to `main` + `workflow_dispatch`. Steps: checkout → configure-pages → upload-pages-artifact (repo root) → deploy-pages. No build, no tests.

## Quality checks

None automated. After editing, verify manually:

1. `docker build -t frkn-org . && docker run --rm -p 8080:80 frkn-org`
2. `curl http://localhost:8080/health` → `ok`
3. Open affected pages in browser; check console for fetch errors and 404s on partials/assets.

## Screenshots (visual check)

No test suite — verification is screenshots. With the container running (port 8081 if 8080 is busy):

```powershell
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$out = "$env:TEMP\frkn-shots"
New-Item -ItemType Directory -Path $out -Force | Out-Null

# desktop 1440, mobile 390 — for every affected page and locale
& $chrome --headless --disable-gpu --hide-scrollbars --screenshot="$out\home.png"        --window-size=1440,1200 http://localhost:8081/
& $chrome --headless --disable-gpu --hide-scrollbars --screenshot="$out\home-mobile.png" --window-size=390,1600  http://localhost:8081/

explorer $out   # open the folder
docker rm -f frkn-preview
```

Screenshots are session artifacts in `%TEMP%\frkn-shots` — never committed.

## Blog import

```bash
node tools/import-tg.mjs [path-to-telegram-export]
```

Regenerates `b/` post pages, `b/index.html`, `b/rss.xml`. Uses node stdlib only. See [domains/blog.md](domains/blog.md).