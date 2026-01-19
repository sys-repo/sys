# Goal
Lift pure wire-format schemas for slug publish manifests into @sys/schema, following the exact existing pattern used by m.timecode.playback.

# Non-negotiables
- No fetch, no fs/io, no URL/path conventions, no bundler logic.
- Only JSON schema + parse/standard adapters + TS types.
- Mirror the actual emitted JSON shapes (do not redesign).
- Use the same structure and naming conventions as m.timecode.playback.

# Target module
- code/sys/schema/src/

# Deliverables
## 1) Assets manifest schema module
Create folder: `src/m.slug.assets/`
Files:
- `common.ts` (match local conventions for Schema/Type imports, same as other modules)
- `t.ts` (types for AssetsManifest + SchemaLib)
- `u.manifest.schema.ts` (TypeBox schema builder)
- `u.manifest.ts` (parse + standard)
- `m.Assets.Manifest.ts` (lib object `{ schema, parse, standard }`)
- `m.Assets.ts` (export `{ Manifest }`)
- `mod.ts` (export `AssetsSchema`)

Surface:
- `export const AssetsSchema: t.SlugAssetsSchemaLib = { Manifest }`

## 2) Slug-tree manifest schema module
Create folder: `src/m.slug.tree/`
Files:
- `common.ts`
- `t.ts` (types for SlugTreeManifest (= slug-tree props) + SchemaLib)
- `u.manifest.schema.ts` (recursive schema)
- `u.manifest.ts`
- `m.Tree.Manifest.ts`
- `m.Tree.ts`
- `mod.ts` (export `SlugTreeSchema`)

Surface:
- `export const SlugTreeSchema: t.SlugTreeSchemaLib = { Manifest }`

## 3) Root exports
Update whichever central export file pattern @sys/schema uses (if there is an index mod):
- Ensure new modules are exported similarly to `m.timecode.playback/mod.ts`.

# Schema details
## Assets manifest
- docid: string (unsafe branded to t.StringId like playback does)
- assets: array of objects:
  - kind: union("video","image")
  - logicalPath: string (unsafe branded to t.StringPath)
  - hash: string
  - filename: string
  - href: string
  - stats?: object { bytes?: number; duration?: number } with additionalProperties:false
- Entire manifest: additionalProperties:false

## Slug-tree manifest
Recursive union:
- Ref node:
  - slug: string (minLength 1)
  - ref: string (minLength 1)
  - slugs?: array(Self)
- Inline node:
  - slug: string (minLength 1)
  - description?: string
  - traits?: array({ of: string, as: string }, additionalProperties:false)
  - data?: record<string, unknown>
  - slugs?: array(Self)
Top-level: array of Self
All objects should use additionalProperties:false where applicable.

# Tests
Add minimal BDD tests mirroring existing style:
- parse accepts valid example JSON
- parse rejects invalid shape
Keep tests shallow (schema only, no semantic registry checks).

# Done definition
- `deno task test` in code/sys/schema passes.
- New exports are reachable from @sys/schema consumers.
