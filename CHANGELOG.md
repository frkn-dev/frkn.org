# Changelog

Notable changes to the frkn.org website. Date-based (no SemVer — the site has no releases).

## 2026-09-09 — AmneziaWG bulk archives (`feature/awg-zip-official-format`)

### Added

- **«AmneziaWG 3.x» zip** next to «Скачать все»: `frkn-awg-<env>-awg3x.zip` — every node with the full 3.1 field set, empty values and comments dropped, for 3.x clients (Aug 2026+)
- **«AmneziaWG 2.x» zip** in the subscription wizard (ru/en) and the Telegram Mini App: `frkn-awg-<env>-awg2x.zip` with configs reduced to the AWG 2.0 field set that every official AmneziaWG client since spring 2026 imports (`S1–S4`, `H1–H4` ranges and `I1–I5` kept; `HeaderProtectionKey`/`RandomTrailers`/`Rekey*` and other 3.x keys dropped). Nodes that require AmneziaWG 3.1 (`HeaderProtectionKey`, `RandomTrailers = on`) are skipped, with a note under the buttons
- Mock API fixtures cover the AWG field matrix (2.0 / 3.1-timings / RandomTrailers / full 3.1); the mock serves real configs from `frkn-awg-dev/` when present; e2e test round-trips both archives through JSZip

### Changed

- AWG `.conf` file names (per-node Download and both zips) are now valid tunnel names: `^[a-zA-Z0-9_=+.-]{1,15}$`, kebab-case, Cyrillic transliterated, duplicates suffixed (`uncle-sam-usa-2.conf`) — Android and `awg-quick` rejected `Uncle Sam (USA) 1.conf`
- «Скачать все» zip is unchanged content-wise (raw configs as served); only the file names inside changed

## 2026-08-21 — Landing revamp + LLM docs (`epic/site-dev`)

### Added

- **LLM documentation**: rewritten `AGENTS.md` (described a different project before) + new `docs/` tree: `ARCHITECTURE.md`, `RUNBOOK.md`, and `docs/domains/` — site-structure, frontend, api-integration, payments, subscription-app, blog, install-setup, infrastructure
- **Landing pricing carousel** (ru/en/fa): 4 cards — Free (0₽, anchors to test-drive), 1 month 500₽, 3 months 1300₽, 12 months 4500₽. Grid on desktop, swipe carousel on mobile
- **"Переход с другого сервиса" hero button** — hero now has 4 buttons in one row (Try for free / Free TG proxies / Pricing / Switch)
- **`.opencode/` agent config** adapted for this repo (was AIdventure leftovers): agents `frontend-dev`, `debug`, `visual-check`; skills `plan`, `resume`, `verify`, `page-audit`, `code-review`, `sync-docs`, `cache-bust`, `new-page`, `share`, `generate-arch-scheme`
- **RUNBOOK**: screenshot-based visual check section (docker + headless Chrome, `%TEMP%\frkn-shots`)

### Changed

- **Test-drive section moved up** — right after hero, before features (was the last section on the page)
- fa landing hero: single-column centered card, buttons in a row (RTL-aware)
- `.opencode/` is now tracked in git

### Removed

- Hero image (top right) from ru/en/fa landings
- Dead CSS: `.hero-image-wrapper`, `image-shine` keyframes, `.hero-empty` (~80 lines)
- Stale `main.webp` preload link from all three landings
- AIdventure leftovers: agents `backend-dev`, `prompt-engineer`; skills `test-run`, `test-audit`, `version-bump`, `new-domain` (replaced with static-site equivalents)
