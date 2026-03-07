# Slug Bundle Descriptor Plan

## Goal
Define a server-agnostic bundle descriptor schema with kind-specific variants, wire it into `SlugClient.fromDescriptor`, and emit `dist.client.json` during bundle compilation.

## Scope
- Repo: `@sys/slug-model` and bundle compiler under `deploy/@tdb.edu.slug`.
- Descriptor is part of the bundle output contract.
- Config/tooling schemas stay separate (not moved into model-slug).

## Constraints
- **No `baseUrls`** in descriptor (server-agnostic).
- **`basePath` allowed** to support sub-path deployments.
- Do **not** flatten kind schemas into the root descriptor module.

## Module Layout
- Root: `@sys/slug-model/src/m.schema/m.Bundle`
  - Defines the common/core descriptor shape and kind dispatch.
- Kind submodules:
  - `@sys/slug-model/src/m.schema/m.Bundle/kind.tree.fs/`
  - `@sys/slug-model/src/m.schema/m.Bundle/kind.tree.media.seq/`
  - Each kind module includes its own `t.ts`, `mod.ts`, schema, and tests.

## Top-Level Shape
- `bundles: BundleDescriptor[]`
  - Each entry is a full descriptor (core + kind payload).

## Phases
### Phase 1: Schemas
1. Add core descriptor schema in `src/m.schema/m.Bundle`.
2. Add kind-specific schemas in each `kind.*` submodule.
3. Add schema tests for core and each kind.

### Phase 2: Client
1. Add `SlugClient.fromDescriptor()`.
2. Parse core fields and optionally branch on `kind`.
3. Keep API aligned with server-agnostic descriptor (uses `basePath`).

### Phase 3: Bundler Emit
1. Emit `dist.client.json` from:
   `deploy/@tdb.edu.slug/src/m.slug.compiler/m.bundle`
2. Validate against the descriptor schema.

## Core Descriptor Shape (draft)
- `kind` (discriminator)
- `version` (schema version)
- `docid`
- `basePath` (optional)
- `layout` (manifests/content/media dirs, etc.)
- `payload` (kind-specific block)

## Kind Variants (examples)
- `kind: slug-tree:fs`
- `kind: slug-tree:media:seq`

## Output File
- `dist.client.json`

## Deliverables
- Schema + tests in `@sys/slug-model`.
- `SlugClient.fromDescriptor()`.
- Compiler emits `dist.client.json` during bundle step.
