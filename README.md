# NeonParker-Copilot Vite + Three.js Starter

This project is a minimal Three.js scene (rotating cube) built with Vite.

## Development
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```
Artifacts output to `dist/`.

## GitHub Pages Deployment
Deployment is handled by the GitHub Actions workflow in `.github/workflows/deploy-pages.yml`. On every push to `main` the site is built and published to:

https://gkay-dev.github.io/NeonParker-Copilot/

If the page appears empty:
- Confirm the latest workflow run succeeded.
- Ensure `vite.config.js` has the correct `base: '/NeonParker-Copilot/'`.

## Troubleshooting
If a workflow was canceled during a rebase or force-push, re-run the workflow via the Actions tab or push a new commit.
