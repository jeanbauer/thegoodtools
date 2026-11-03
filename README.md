# thegoodtools

Small tools that just work — a shell of fast, free, browser-only utilities.
Hosted on GitHub Pages at `https://<user>.github.io/thegoodtools/`.

## Stack

- Vite + React 19 + TypeScript
- React Router (clean URLs via the 404.html redirect trick for GH Pages)
- Plain CSS with brand tokens in `src/theme.css` — no styling framework
- One SPA: every tool is a lazy-loaded bundle, split per route

## Structure

```
src/
  theme.css            Brand tokens (colors, type, radii) — edit here to rebrand
  app.css              Shell + shared styles
  main.tsx             Router root (basename = Vite base)
  App.tsx              Routes, generated from the tool registry
  shell/Layout.tsx     Header, footer, page frame
  shared/ToolPage.tsx  Standard chrome every tool wraps itself in
  pages/Home.tsx       Landing page — tool grid generated from the registry
  tools/
    registry.ts        CENTRAL REGISTRY — add every tool here
    <tool-id>/         One self-contained folder per tool
```

## Adding a tool

1. Create `src/tools/<id>/index.tsx` with a default-exported component
   (wrap it in `<ToolPage name="…" tagline="…">`).
2. Register it in `src/tools/registry.ts` with a `load: () => import('./<id>')`.

That's it — the landing card and the `/tools/<id>` route appear automatically.
Tool styles go in `src/tools/<id>/` and should consume the theme variables.

## Develop & deploy

```
npm run dev       # local dev server
npm run build     # type-check + production build to dist/
```

Push to `main` deploys automatically via GitHub Actions
(`.github/workflows/deploy.yml`). One-time setup: in the repo's
Settings → Pages, set Source to "GitHub Actions".
