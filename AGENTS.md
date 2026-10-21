# FRKN — frkn.org

Static website for the VPN service FRKN ("Рилзопровод"). Pure HTML/CSS/JS, no build step, served by Nginx.
High-level overview: [ARCHITECTURE.md](docs/ARCHITECTURE.md). Commands & deploy: [RUNBOOK.md](docs/RUNBOOK.md).

## HUMANS.md — статус работы

В корне репозитория есть `HUMANS.md` — человекочитаемый статус: ветка, текущая задача, что сделано, что дальше, блокеры.

- В начале задачи обнови `Current`: ветка, задача, статус, дата.
- В конце задачи добавь пункт в `Done` (дата, короткое описание, commit hash если есть) и обнови `Next`.
- `Done` держи коротким: последние 5–10 пунктов; полная история — в git.
- `HUMANS.md` — это «что делаем сейчас», `AGENTS.md` — «как работаем». Не дублируй правила.
- Не пиши секреты: токены, пароли, приватные ключи.
- Для кросс-репо задач используй одинаковый короткий Task ID и ссылки на другие `HUMANS.md`.
- Если задача заблокирована — зафиксируй это в `Blockers / Notes`, а не только в чате.

`PLAN.md` — более длинный план/идеи, `CHANGELOG.md` — что уже выкачено.

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

## Layout

- RU-страницы — в корне (`pay/`, `activate/`, `install/`, `donate/`, …), EN — зеркало в `en/`, персидский — `fa/`; общие партиалы — `container/`, скрипты — `scripts/`, стили — `styles.css`.
- `dopamine/`, `dopamine/en/` — мини-сайт frkn.app (клиент + бинарники `.pkg/.apk/.bin`), деплоится отдельно.
- `deploy-site.sh` → `/opt/frkn.org`, `deploy-app.sh` → `/opt/frkn.app`, `deploy-beta.sh` → `/opt/beta/frkn.org`, `deploy-testflight.sh` — TestFlight.
- `Dockerfile` + `nginx-frkn-app-redirects.conf` — как сайт отдаётся в контейнере/на хосте.

## Deploy & safety

1. **Прод — только по явной просьбе.** `deploy-site.sh` и `deploy-app.sh` бьют в `root@141.133.173.16`; это rsync рабочего дерева, без git на сервере — на прод едет ровно то, что лежит локально.
2. Бету (`./deploy-beta.sh`) можно катать для проверки, но и там сначала посмотреть diff.
3. Перед точечным деплоем (одна страница/один файл) — rsync конкретных путей, чтобы не выкатить чужие незакоммиченные правки.
4. После деплоя — проверить `curl -s https://frkn.app/ | grep -o 'v4\.8\.14\.[0-9]*'` (и `/en/`), `curl -sI <url>` на 200.
5. Секреты (`.p8`, ключи, токены platega) в репо не кладём — они на сервере.

## Frontend rules

- **i18n:** правка RU-страницы → зеркалим в `en/` (и `fa/`, если страница там есть). Партиалы — `container/*.ru|en|fa.html`, переключение — `scripts/i18n.js`.
- **Cache-busting:** меняешь `scripts/*.js` или `styles.css` — бампай `?v=N` в ссылках на страницах, иначе у юзеров старый файл.
- `scripts/plans.js` — единственный источник витрины тарифов (`disabled: true` скрывает продукт); правки тарифов — там, а не в разметке.
- Платежи идут через Platega (`pay/`, `donate/`, `activate/`) — флоу описан в `docs/domains/payments.md`, эндпойнты в `docs/domains/api-integration.md`.

## Git rules

1. **Never on `main`.** Start any task with `git checkout -b feature/<name>` from `main`. If already on `main` with changes — `git stash -u`, branch, `git stash pop`.
2. **No merge without the word "мержим".** "Continue", "do it", "ok" is not permission. Ask via the question tool before merging.
3. **`--no-ff` merges only.** No squash/rebase merges.
4. Commit atomically, one commit per subtask.
5. Commit and push only on explicit request.

```powershell
# на вин-машине
$branch = git branch --show-current
if ($branch -eq 'main') { Write-Host "STOP! You're on main!" -ForegroundColor Red }
$status = git status --short
if ($status) { Write-Host "Uncommitted changes — stash or commit!" -ForegroundColor Yellow }
```

- Remote repo: `https://github.com/frkn-dev/frkn.org.git`. Work with remotes only on explicit request.
- Commit in PowerShell: `git commit -m "msg"` (NOT `cmd /c` — quotes break). Long messages: `git commit -F <file>`.
- PR base is `main` (there is no `develop` branch).

## Pitfalls

- Нет сборки: «скомпилировать» нечего — проверка только глазами/через бету. Опечатка в HTML ломает страницу молча.
- `deploy-site.sh`/`deploy-app.sh` — rsync с `--delete`: лишние локальные файлы уедут на сервер, отсутствующие — удалятся с сервера.
- `/opt/frkn.org` — легаси-копия; frkn.app отдаётся из `/opt/frkn.app`.
- Прод-версии в `dopamine/index.html` и `dopamine/en/index.html` правятся парой — иначе RU/EN разъезжаются.

## Note

`.opencode/` contains local agent config (agents + skills) adapted for this repo. `.kimi-code/` is a leftover local config from another machine — do not trust it.

## Sibling repos

| Repo | Why it matters |
|---|---|
| `../ffcore` | api.frkn.org backend: subscriptions, connections, share tokens |
| `../frkn-services` | payment-gw/mrkting behind `/pay`, `/activate`, cabinet |
| `../dopamine` | client builds uploaded here for `frkn.app` |
| `../env` | server configs, cross-repo index |
