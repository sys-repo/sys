# Upstream Provenance

- Repository: https://github.com/denoland/deno-vite-plugin
- Pinned commit: e04b1a7d496254448309d38dd9c351586b7add62
- Snapshot date: 2026-03-03
- Snapshot scope: upstream `src/` and package metadata files copied into this vendor directory.

## Local patches

1. `src/resolvePlugin.ts`
   - `import { transform } from "esbuild"`
   - changed to `import { transform } from "npm:esbuild@0.23.1"`
   - reason: allow Deno runtime import without external npm import-map wiring.
2. Source imports were adjusted from `.js` to `.ts` within vendored `src/*`
   - reason: source-direct loading in this Deno module (no build step required).
3. `src/utils.ts`
   - normalize `stdout`/`stderr` to strings in `execAsync`.
   - reason: keep local type-checking compatible with current Node typings.

## Local usage

`driver-vite` imports vendored source directly from:
`src/-vendor/deno.vite-plugin/src/index.ts`
