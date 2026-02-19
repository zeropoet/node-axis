# Node Axis

Node Axis is a Next.js visual canvas that renders animated clustered square nodes over a p5.js background.

## Requirements

- Node.js 18+
- npm

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` - Start the Next.js dev server on port `3000`
- `npm run dev:local` - Start dev server with `NEXT_PUBLIC_APP_SOURCE_MODE=local`
- `npm run build` - Create a production build (static export to `out/`)
- `npm run start` - Run the production Next.js server

## Environment Variables

- `NEXT_PUBLIC_IPFS_GATEWAY` (optional)
  - Used to resolve `ipfs://...` node image URLs.
  - Default: `https://ipfs.io/ipfs/`

Example:

```bash
NEXT_PUBLIC_IPFS_GATEWAY=https://cloudflare-ipfs.com/ipfs/ npm run dev
```

## Project Structure

- `/app` - App Router entrypoints and global styles
- `/components/DesktopShell.tsx` - Node stage and square-grid interactions
- `/components/P5Background.tsx` - Animated p5.js background renderer
- `/lib/appRegistry.ts` - Cluster/node registry and image URL resolution

## Updating Content

Edit `/lib/appRegistry.ts` to:

- Add or remove clusters
- Add or remove nodes within clusters
- Update node metadata (`id`, `name`, `description`, `image`)
- Tune optional per-cluster physics (`mass`, `drag`, `spring`, `repulsion`)

`CENTER_DISPLAY_CLUSTERS` is the source of truth for rendered cluster data.

## Visual Behavior

- Node size starts from deterministic random mass and gradually grows toward full cell capacity over ~3 minutes.
- Node movement applies temporary velocity-based compression (shrink on motion), preventing overlap.
- Selecting a node fills its immediate connecting facets (up/down/left/right where neighbors exist) with `rgb(205, 205, 205)`.

## Build and Deploy Notes

- `next.config.mjs` uses `output: "export"`, so `npm run build` emits a static site in `out/`.
- In GitHub Actions (`GITHUB_ACTIONS=true`), `basePath`/`assetPrefix` are set automatically from `GITHUB_REPOSITORY`.
