# FRKN — frkn.org

Static website for the VPN service FRKN ("Рилзопровод"). Pure HTML/CSS/JS, no build step, served by Nginx.
High-level overview: [ARCHITECTURE.md](docs/ARCHITECTURE.md). Commands & deploy: [RUNBOOK.md](docs/RUNBOOK.md).

## Tone

"На ты", concise, irony ok, no pathos. Technical terms as-is. Code comments only where not self-evident.

## Navigation — docs first, grep second

**Load only what the task needs. Do not read everything.**

1. Before any grep/glob, read the relevant domain doc in `docs/domains/<domain>.md`.
2. References to `@/docs/...` are lazy: `Read` them on need-to-know.
3. Delegating open-ended search (>3 files, "find where X is") → use the `explore` agent instead of reading everything yourself.

**Domain map:**

| Doc | Covers |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | how it all fits: static site, nginx, partials, scripts, api.frkn.org, environments |
| [RUNBOOK.md](docs/RUNBOOK.md) | docker build/run/health, deploy scripts, CI |
| [domains/site-structure.md](docs/domains/site-structure.md) | map of all ~30 page directories |
| [domains/frontend.md](docs/domains/frontend.md) | styles.css, /scripts/, /container/ partials, i18n (ru/en/fa), analytics |
| [domains/api-integration.md](docs/domains/api-integration.md) | every api.frkn.org endpoint + which page calls it |
| [domains/payments.md](docs/domains/payments.md) | Platega flows: pay, donate, transaction, activate, promocodes |
| [domains/subscription-app.md](docs/domains/subscription-app.md) | subscription/, app/ (Telegram Mini App), profile/ |
| [domains/blog.md](docs/domains/blog.md) | b/ blog + tools/import-tg.mjs |
| [domains/install-setup.md](docs/domains/install-setup.md) | install script (VPN node) + setup/ guides |
| [domains/infrastructure.md](docs/domains/infrastructure.md) | Dockerfile, nginx configs, deploy scripts, CI, prod/beta/testflight/local |

## Git rules

1. **Never on `main`.** Start any task with `git checkout -b feature/<name>` from `main`. If already on `main` with changes — `git stash -u`, branch, `git stash pop`.
2. **No merge without the word "мержим".** "Continue", "do it", "ok" is not permission. Ask via the question tool before merging.
3. **`--no-ff` merges only.** No squash/rebase merges.
4. Commit atomically, one commit per subtask.

```powershell
$branch = git branch --show-current
if ($branch -eq 'main') { Write-Host "STOP! You're on main!" -ForegroundColor Red }
$status = git status --short
if ($status) { Write-Host "Uncommitted changes — stash or commit!" -ForegroundColor Yellow }
```

- Remote repo: `https://github.com/frkn-dev/frkn.org.git`. Work with remotes only on explicit request.
- Commit in PowerShell: `git commit -m "msg"` (NOT `cmd /c` — quotes break). Long messages: `git commit -F <file>`.
- PR base is `main` (there is no `develop` branch).

## Note

`.opencode/` contains local agent config (agents + skills) adapted for this repo. `.kimi-code/` is a leftover local config from another machine — do not trust it.