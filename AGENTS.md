# PolyVis — Agent Guide

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint (flat config, `js.configs.recommended`) |
| `npm run lint:fix` | ESLint with `--fix` |
| `npm run format` | Prettier (`--write` all `src/`) |
| `npm run format:check` | Prettier check-only |
| `npm test` | **No-op** — no test suite exists |

No typecheck or CI/CD tooling is configured.

## Tech Stack

- **Vanilla JS** (ES modules, no framework, no TypeScript)
- **Vite 5** (build target: `esnext`)
- **`@uwdata/vgplot`** (Mosaic) — declarative visualization grammar
- **DuckDB-WASM** — in-browser SQL analytics; all data lives in DuckDB tables (`signal`, `hypn`, `arou`, `resp`)
- **CSS custom properties** — dark theme (GitHub-dark-inspired palette)

## Architecture

- **Entrypoint:** `index.html` → `src/app.js` (SPA router/controller)
- **Routes:** `/` (overview), `/analysis`, `/about` — hash-free SPA with `history.pushState`
- **Vite SPA fallback** (`vite.config.js:20-29`): rewrites `/analysis` and `/about` to `/index.html` in dev middleware
- **Reactive state:** `src/state/params.js` — vgplot `Param`/`Selection` objects (`xs`, `sampleDomain`, `dispArou`, `dispResp`, `hypnPoint`)
- **Components** (in `src/components/`): functions that imperatively create vgplot charts and append to DOM; rendered once (tracked by `rendered` Set)
- **Data:** CSV files in `Resources/` — single patient (`0000_*`); loaded into DuckDB on startup via `src/data/loader.js`
- **Vendor chunking:** `@uwdata` packages extracted into separate `vendor` chunk (`vite.config.js:12-14`)

## Key Conventions

- **kebab-case** for CSS classes and HTML IDs; **camelCase** for JS names
- All data analysis runs as raw SQL on DuckDB tables via `q()` helper
- vgplot marks use `vg.plot()`, `vg.line()`, `vg.ruleX()`, `vg.rectX()`, `vg.barY()`, etc.
- Silent error handling pattern: `.catch(() => {})`
- DuckDB logging disabled via `coord.logger(null)`

## Known Gaps

- No tests, linting, formatting, or type checking
- No CI/CD
- Single hardcoded patient dataset (`0000`); no multi-patient navigation
