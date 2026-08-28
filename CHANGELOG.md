# Changelog

Notable changes to the frkn.org website. Date-based (no SemVer — the site has no releases).

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
