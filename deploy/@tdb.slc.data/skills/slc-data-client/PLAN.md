# slc-data-client Plan

## Purpose
Create a module-local skill that teaches agents how to consume `@tdb/slc-data` from application code through its published client surface.

This skill should be the consumer-side sibling to `slc-data-stage`:
- `slc-data-stage` teaches how staged data is produced
- `slc-data-client` should teach how staged or published data is consumed

## Boundary
- This skill is the workflow/orchestration layer for consuming `@tdb/slc-data` from application and UI code.
- The published package surface is the execution layer.
- The skill should teach agents how to choose the right client/import surface, use it, integrate it into app/UI code, and verify the result.
- The skill should not reimplement lower-level internals or duplicate staging/deploy workflows.
- Explicitly out of scope: `@tdb/slc-data/fs` (staging pipeline), `@tdb/slc-data/cli` (staging CLI), `@tdb/slc-data/dev` (dev harness).

## Use this skill for
- consuming staged/published SLC data from application code via `DataClient`
- wiring `@tdb/slc-data/ui` components (`HttpOrigin`, `Mounts`) into React surfaces
- understanding which published exports are intended for client-side or UI-side use
- verifying that a client/data read path is working correctly
- discovering available mounts at runtime via `DataClient.Mounts.load`

## Do not use this skill for
- creating or editing stage profiles (use `slc-data-stage`)
- running staging workflows (use `slc-data-stage`)
- deploy workflows
- importing from `@tdb/slc-data/fs` or `@tdb/slc-data/cli` in application code
- debugging lower-level staging pipeline internals unless the published client surface itself is broken

## Published API surface (ground truth)

Inspected from `./deno.json` exports and source. This is the concrete surface the skill must teach.

### In scope: consumer imports

`@tdb/slc-data` (root entrypoint → `./src/mod.ts`):
- `DataClient` — HTTP client for reading staged tree/content datasets
- `SlcMounts` — pure document contract for mount index validation/serialization
- `pkg` — package metadata

`@tdb/slc-data/ui` (→ `./src/ui/mod.ts`):
- `HttpOrigin` — React component (origin selector)
- `Mounts` — React component (mount list)

`@tdb/slc-data/t` (→ `./src/types.ts`):
- Full type surface (re-exports from `m/t.ts`, `fs/t.ts`, `ui/t.ts`)

### Out of scope: not consumer imports

- `@tdb/slc-data/cli` — staging CLI (covered by `slc-data-stage`)
- `@tdb/slc-data/fs` — filesystem/pipeline internals
- `@tdb/slc-data/dev` — dev harness

### `DataClient` API

```ts
import { DataClient } from '@tdb/slc-data';
```

Static methods:
- `DataClient.create({ baseUrl, docid, layout? })` → `Client`
- `DataClient.fromDataset({ origin, dataset, docid?, layout? })` → `Client` (preferred entry point; composes `create` internally)
- `DataClient.Mounts.load(origin)` → `SlugClientResult<SlcMounts.Doc>` (discovers available mounts from HTTP origin)
- `DataClient.refsFromTree(tree, total?)` → `string[]`
- `DataClient.findHash(entries, ref)` → `string | undefined`
- `DataClient.selectOrFirst(selected, refs)` → `string | undefined`

Client instance:
- `client.Tree.load()` → `SlugClientResult<SlugTreeDoc>`
- `client.FileContent.index()` → `SlugClientResult<SlugFileContentIndex>`
- `client.FileContent.get(hash)` → `SlugClientResult<SlugFileContentDoc>`
- `client.TreeContent.load({ ref? })` → `SlugClientResult<TreeContentValue>`

### Result contract

All async methods return `SlugClientResult<T>`:
- `{ ok: true, value: T }` on success
- `{ ok: false, error: { kind: 'http' | 'schema', message, ... } }` on failure

Agents MUST check `.ok` before accessing `.value`. The `kind` discriminant distinguishes network errors from schema validation errors.

### Default layout

`DataClient` assumes this directory layout at the HTTP origin unless overridden:
```ts
{ manifestsDir: 'manifests', contentDir: 'content' }
```
This matches the output structure produced by `slc-data-stage`.

## Target workflow shape
1. (optional) discover available mounts: `DataClient.Mounts.load(origin)`
2. create a client for the target mount: `DataClient.fromDataset({ origin, dataset })`
3. load data: `client.TreeContent.load({ ref? })` (or lower-level `Tree.load` / `FileContent` methods)
4. check `.ok` on every result before accessing `.value`
5. integrate the data into the calling UI/application layer
6. verify the returned data shape and failure behavior

## Draft skill sections
- Use this skill when
- Do not use this skill when
- Boundary
- Authority
- Workflow
- Client usage patterns
- UI integration notes
- Verification
- Source-checkout-only refs

## Authority ladder
Primary (works from outside the source tree):
- `@tdb/slc-data` → `DataClient`, `SlcMounts`
- `@tdb/slc-data/ui` → `HttpOrigin`, `Mounts`
- `@tdb/slc-data/t` → type surface
- `./deno.json` → export map

Source checkout only (when debugging the published surface):
- `./src/m/m.client/` → DataClient implementation
- `./src/m/m.Mounts/` → SlcMounts document contract
- `./src/ui/ui.HttpOrigin/` → HttpOrigin component
- `./src/ui/ui.Mounts/` → Mounts component

## Important design constraints
- keep this separate from `slc-data-stage`
- center the published API, not internal helpers
- do not turn the skill into generic React advice
- do not import from `@tdb/slc-data/fs` or `@tdb/slc-data/cli` in consumer code
- deploy remains downstream and separate
- the `SlugClientResult` contract is load-bearing; the skill must teach `.ok` checking, not let agents assume success

## Naming decision

`slc-data-client` covers the full consumer surface: `DataClient` + `SlcMounts` + UI components. The UI components are thin wrappers over `DataClient` — same concern (reading staged data) in a React context. Splitting them into a separate skill would create a dependency chain without adding clarity.

## Next step
Draft `skills/slc-data-client/SKILL.md` from this plan. The published API surface section above is the ground truth — do not re-inspect unless the source has changed.
