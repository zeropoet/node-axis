# Node Axis

Node Axis is a Next.js visual canvas that renders clustered square nodes over a p5.js animated background. Selecting a node opens a centered display window with the node image and metadata.

## Requirements

- Node.js 18+
- npm

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` - Start the Next.js dev server on port `3000`
- `npm run dev:local` - Start dev server with `NEXT_PUBLIC_APP_SOURCE_MODE=local`
- `npm run build` - Production build
- `npm run start` - Run production server

## Environment Variables

- `NEXT_PUBLIC_IPFS_GATEWAY`
  - Optional IPFS gateway base URL.
  - Default: `https://ipfs.io/ipfs/`
  - Used to resolve `ipfs://...` node image URLs.

Example:

```bash
NEXT_PUBLIC_IPFS_GATEWAY=https://cloudflare-ipfs.com/ipfs/ npm run dev
```

## Project Structure

- `/app` - Next.js app router entrypoints and global styles
- `/components/DesktopShell.tsx` - Main interactive stage, node layout, and centered display overlay
- `/components/P5Background.tsx` - p5 background renderer
- `/lib/appRegistry.ts` - Cluster/node data and image URL resolution

## Updating Content

Edit `/lib/appRegistry.ts` to:

- Add or remove clusters
- Add or remove nodes within a cluster
- Change node names, descriptions, and images

The UI reads clusters from `CENTER_DISPLAY_CLUSTERS` and assigns palette colors by cluster order.
