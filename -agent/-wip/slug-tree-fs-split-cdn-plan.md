# Plan: slug-tree:fs Split-CDN Support

## Goal
Allow `slug-tree:fs` to load manifests and content JSON from different CDNs (e.g., manifests on one domain, content JSON on another), without polluting the generic IO plane.

## Problem
`SlugClient.FromEndpoint.Tree` and `SlugClient.FromEndpoint.FileContent` currently derive URLs from a single `baseUrl` + `layout`.
If manifests and content JSON live on separate CDNs, there’s no override mechanism today.

## Design Options
### Option A: Explicit base URL overrides (recommended)
Add fs-specific load options:
- `manifestsBaseUrl?: string`
- `contentBaseUrl?: string`

Then:
- `Tree.load` uses `manifestsBaseUrl ?? baseUrl`.
- `FileContent.index` uses `manifestsBaseUrl ?? baseUrl`.
- `FileContent.get` uses `contentBaseUrl ?? baseUrl`.

This keeps overrides explicit and avoids resolver foot-guns.

### Option B: Resolver functions
Add:
- `manifestResolver?: (args) => string`
- `contentResolver?: (args) => string`

More flexible, but introduces complexity and potential for inconsistent URL semantics.

## Normalization + Generic Resolver (context)
This split-CDN change is **fs-specific** and explicit. In parallel, we should adopt a
**bundle-level** resolver pattern that is generic across bundle kinds:
- Normalize hrefs to absolute URLs before resolver calls.
- Resolver is typed by **AssetKind** (per bundle kind), not by `BundleDescriptorKind`.
- `AssetKind` is declared in each bundle kind module (e.g., `kind.tree.media.seq`,
  `kind.tree.fs`) and exported alongside schema/types.

This keeps the bundle client API generic and type-safe while allowing per-kind mapping
rules (timeline assets vs fs manifests/content).

## Scope
- `code/sys.model/model-slug/src/m.client/m.io.Tree.ts`
- `code/sys.model/model-slug/src/m.client/m.io.FileContent.ts`
- `code/sys.model/model-slug/src/m.client/t.io.ts` (new fs-specific option types)
- Tests in `code/sys.model/model-slug/src/m.client/-test/`

## Acceptance Criteria
- `Tree.load` can fetch manifests from a separate CDN.
- `FileContent.index` and `FileContent.get` can fetch content JSON from a separate CDN.
- Existing callers unaffected if no overrides are provided.
- Unit tests cover split-domain configuration.
