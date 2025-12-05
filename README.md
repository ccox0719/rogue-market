# Rogue Market Deployment Log

## What changed

1. Replaced the broken `peaceiris/actions-gh-pages` workflow with GitHub’s official Pages pipeline (`actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4`) so building via `npm run export-pages` uploads the `dist/` artifact and lets GitHub deploy it without manual pushes or extra permissions.
2. Converted the bond and whale datasets into TypeScript modules (`game/content/bonds.ts`, `game/content/whales.ts`) and updated `game/generators/bondGen.ts` and `game/generators/whaleGen.ts` to import those modules, preventing the browser from trying to treat raw `.json` files as JS modules.

## How to rebuild

1. Run `npm run export-pages` to regenerate `dist/`.
2. Push to `main`—the new workflow builds and deploys automatically.
3. Inspect the Actions tab to ensure the “Build and deploy to GitHub Pages” job finishes green, then hard-refresh `https://ccox0719.github.io/rogue-market/` (Ctrl+Shift+R) to load the updated bundle.
