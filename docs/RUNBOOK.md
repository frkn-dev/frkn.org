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

Two site-local sanity tools: a **mock API server** (no api.frkn.org needed) and an **e2e test** for the subscription wizard.

### Mock API for /subscription (AWG wizard, devices, email binding)

```bash
node tools/mock-api/serve.js            # http://127.0.0.1:3000
```

Then open `http://localhost:8080/subscription/?id=any&mock=1` — page switches all
API calls from `api.frkn.org` to the mock (`?mock=1` flag overrides `isLocal`).
The mock now pretends to have every protocol: AmneziaWG, WireGuard, Hysteria2,
Xray, MTProto, "All proxies".

### Manual check — subscription wizard (AmneziaWG bulk .zip)

Full scenario, no real backend needed:

```bash
# terminal 1 — the mock API (leave running)
node tools/mock-api/serve.js

# terminal 2 — the site
docker build -t frkn-org .
docker run -d --rm -p 8081:80 --name frkn-preview frkn-org
```

Then in a browser:

1. Open `http://localhost:8081/subscription/?id=demo-uuid-0000&mock=1`.
2. Click **«Больше настроек и приложений»** — the wizard modal opens.
3. Step 1 → choose **AmneziaWG**; step 2 → any OS (e.g. Windows); step 3 →
   just shows the hint (no client needed for AWG).
4. Step 4 «Готово — ссылка для выбранной конфигурации»: above the per-node
   list there is **«⬇ Скачать все (3 конф., .zip)»**. Click it — a
   `frkn-awg-dev.zip` with 3 `.conf` files should download.
5. If jsDelivr is unreachable the button shows a toast instead of a file.

Cleanup: `docker rm -f frkn-preview`, `Ctrl+C` in the mock terminal.

### e2e — subscription wizard AWG bulk download

```bash
# installs into tools/e2e/node_modules (gitignored)
cd tools/e2e && npm install && node awg-zip-test.mjs
```

jsdom-driven test: opens the wizard, picks AmneziaWG, asserts the
"Скачать все (.zip)" button renders, and the built-in `downloadZip` wires a
blob via JSZip. Exit 0/1 so it can be hooked to CI later.

After any edit to /subscription verify manually:

1. `docker build -t frkn-org . && docker run --rm -p 8080:80 frkn-org`
2. `curl http://localhost:8080/health` → `ok`
3. `cd tools/e2e && node awg-zip-test.mjs` → ✅
4. Open affected pages in browser; check console for fetch errors and 404s on partials/assets.

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