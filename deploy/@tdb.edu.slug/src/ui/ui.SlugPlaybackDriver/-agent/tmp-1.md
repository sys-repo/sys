# Commit message: Add slug assets manifest schema lib to @sys/schema and align loader/bundler to canonical schema surfaces.
Goal: Centralize pure wire-format schemas for playback and assets manifests in @sys/schema; keep semantic validation and all fetch logic out of scope.

## Scope (hard)
Defining sentence: Only playback + assets manifest wire formats (JSON shape + parse/standard adapters).

In:
- @sys/schema: playback (already) + assets (new)
Out:
- slug-tree schemas
- any semantic validation (trait registry, alias rules)
- any IO/fetch/bundler logic

## 1) Confirm playback schema is canonical
Defining sentence: Treat @sys/schema `PlaybackSchema.Manifest` as the single playback manifest schema authority.

Actions:
- No code changes required unless there are duplicate validators elsewhere.
- Any consumer must call `PlaybackSchema.Manifest.parse(...)` for runtime validation.

## 2) Add assets manifest schema lib to @sys/schema
Defining sentence: Create a new schema module that mirrors the exact JSON shape emitted in `slug.<docid>.assets.json`.

Create folder:
- code/sys/schema/src/m.slug.assets/

Files (mirror m.timecode.playback pattern exactly):
- common.ts
- t.ts
- u.manifest.schema.ts
- u.manifest.ts
- m.Assets.Manifest.ts
- m.Assets.ts
- mod.ts

Exports:
- `export const AssetsSchema: t.SlugAssetsSchemaLib = { Manifest }`

### 2.1 Types (t.ts)
Defining sentence: Define the wire types and schema-lib surface.

Types:
- `AssetKind = 'video' | 'image'`
- `AssetsManifest = { docid: t.StringId; assets: readonly Asset[] }`
- `Asset = { kind: AssetKind; logicalPath: t.StringPath; hash: string; filename: string; href: string; stats?: { bytes?: number; duration?: t.Msecs } }`
- Schema lib types analogous to `TimecodePlaybackManifestSchemaLib`:
  - `schema(args?: never): t.TSchema`
  - `standard(args?: never): t.StandardSchemaV1<unknown, AssetsManifest>`
  - `parse(input: unknown): t.SchemaResult<AssetsManifest>`

### 2.2 Schema (u.manifest.schema.ts)
Defining sentence: Implement TypeBox schema; no semantic rules beyond shape.

Rules:
- `docid`: Unsafe branded string like playback uses.
- `logicalPath`: Unsafe branded string path.
- `duration`: Unsafe branded number as `t.Msecs`.
- `assets[]` objects: `additionalProperties:false`
- top-level: `additionalProperties:false`

### 2.3 Parse/standard (u.manifest.ts)
Defining sentence: Implement `standard` via `Schema.toStandardSchema` and `parse` via `Schema.Value.Check` and `Schema.Value.Errors`, matching playback module behavior.

## 3) Export wiring
Defining sentence: Ensure consumers can import new schema via @sys/schema public surface.

Actions:
- Follow the same export style used for `m.timecode.playback/mod.ts`.
- Add a new module export `m.slug.assets/mod.ts` (or include it in the central barrel if present in @sys/schema).

## 4) Tests (schema only)
Defining sentence: Prove the parser accepts and rejects the wire shape.

Actions:
- Add minimal BDD tests in the module’s `-test/` folder (mirror existing schema tests).
- Use one valid assets manifest object and one invalid.
- No fixtures required in this step; keep it minimal and purely structural.

## Done criteria
Defining sentence: Assets schema is available from @sys/schema and behaves like playback schema (schema/standard/parse).

Checklist:
- `deno task check` passes in code/sys/schema.
- `deno task test` passes in code/sys/schema.
- No slug-tree work performed.
