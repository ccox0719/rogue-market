# Project Overview

## Purpose
Rogue Market is a hybrid: roguelike progression, stock simulator, market monitors, and campaign hub bundled into one browser experience. The interface hooks into underlying game systems via a single `GameRunner` that drives `ui_main.ts`, serialization systems, and meta-state managers.

## Layout

```
/
├── game/             # TypeScript sources (core systems, generators, content, UI)
│   ├── core/         # Rune engine, state, lifecycle, and bond/portfolio systems
│   ├── content/      # Static data (bonds, challenges, campaigns)
│   ├── generators/   # Factory helpers (bonds, carriers, campaigns)
│   ├── systems/      # Simulation rules, bond/portfolio handling, triggers
│   ├── ui/           # View controllers (dashboard, meta, portfolio, helpers)
│   └── charts/        # Canvas helpers (sparkline, mini pie)
├── scripts/          # Build helpers (copy static, deploy helpers)
├── dist/             # Compiled JS/CSS that GitHub Pages serves
├── assets/           # Static media/logos
├── README.md         # Deployment notes (workflow + rebuild steps)
├── PROJECT_OVERVIEW.md
└── tsconfig.json
```

## Runtime flow

1. `npm run export-pages` compiles the TypeScript into `dist/` and copies static JSON/content.
2. The official GitHub Pages workflow (`.github/workflows/deploy.yml`) runs `npm run export-pages`, uploads `dist/` as an artifact, then calls `actions/deploy-pages@v4` to publish the site.
3. `main.js` bootstraps the UI by importing `game/core/runLoop.js` from `dist/` when hosted, with a fallback for dev builds.

## Content/data

- `game/content/bonds.ts` now loads directly as a JS module; JSON-only imports were removed to avoid MIME errors.
- `game/content/campaigns.ts`, `challengeModes.ts`, and `legacyBuffs.ts` provide structured metadata consumed by generators and UI cards.

## UI structure

- `game/ui/ui_main.ts` controls the Run dashboard (buy window, holdings, bond market, lifecycle log) and market/regulatory panels.
- `game/ui/ui_meta.ts` shows progression stats and difficulty grid only.
- Supporting modules (`ui_portfolio.ts`, `ui_events.ts`, `ui_eras.ts`, `ui_helpers.ts`) handle cross-panel behaviors (tickers, charts, watch orders).

## Systems

- `game/core` orchestrates the simulation loop, lifecycle updates, and bond/portfolio systems.
- `game/generators` produce bond instances plus helper APIs like `findBondDefinition`.
- `game/systems` houses domain logic (e.g., `bondSystem.ts`, `watchOrders.ts`, `portfolioSystem.ts`).

## Build & deploy

- Locally: `npm run build` runs `tsc` + `scripts/copyStatic.js`. `npm run export-pages` is an alias that builds and prepares the deploy packages.
- CI: `.github/workflows/deploy.yml` uses Node 22, caches npm, builds/export-pages, uploads artifacts, and triggers Github Pages deployment with `pages: write`.
- README contains instructions for rerunning builds and verifying deploys; this overview fills in the structural context so future editors (human or AI) know how pieces connect.
