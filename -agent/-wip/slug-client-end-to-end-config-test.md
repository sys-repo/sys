# Plan: Domain-Free Config + FromDescriptor E2E Test

## Goal
Add an end-to-end test that:
1) Defines a domain-free bundle config as a typed object (no drift).
2) Validates it against bundler schema.
3) Uses `SlugClient.FromDescriptor` to load content via stubbed fetch.

## Scope
- Module: `deploy/@tdb.edu.slug/src/m.slug.compiler/m.bundle` (test lives here)
- Client: `@sys/model-slug` (uses `SlugClient.FromDescriptor`)

## Test Design
### 1) Typed config fixture (domain-free)
- Define a `BundleProfile` config object using:
  - `as const satisfies t.BundleProfile`
- Ensure `hrefBase` uses only paths (e.g., `/assets`) and no domains.
- Example: `staging.cdn/slc/default` + `staging.cdn/slc/video` layout.

### 2) Schema validation
- Validate config using:
  - `Schema.Value.Check(SchemaBundleConfig, config)`
- Assert `true`.

### 3) Descriptor + client
- Build a minimal `dist.client.json` descriptor doc using the **current shape**:
  - `{ bundles: [ ... ] }`
- Include both kinds:
  - `slug-tree:fs` (to exercise split CDN manifests/content bases)
  - `slug-tree:media:seq` (to exercise bundle resolver)
- Use `SlugClient.FromDescriptor.make` (or `SlugClient.fromDescriptor`) to create clients.
- Stub fetch to return:
  - `dist.json`
  - assets manifest
  - playback manifest
  - slug-tree manifest
  - file-content index + payload
- Assert that resolved URLs use path-only hrefs (e.g., `/assets/...`).
- Add `hrefResolver` test using **AssetKind-typed** resolver:
  - media seq: `video | image`
  - fs: `manifest | content` (if a resolver is added for fs later)
- Confirm split-CDN options are honored through `fromDescriptor`.

## File Plan
- New test file (suggested):
  - `deploy/@tdb.edu.slug/src/m.slug.compiler/m.bundle/-test/-config.domain-free.e2e.test.ts`

## Acceptance Criteria
- Test passes without domains in config.
- `SchemaBundleConfig` accepts the typed config.
- `SlugClient.FromDescriptor` loads content via stubbed fetch.
- Assertions confirm path-only href behavior and split-CDN base overrides.
- Resolver asserts are strongly typed via AssetKind unions.
