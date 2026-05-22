# catalog.edu retirement plan

## Archive landing

Retired material from `code/sys.dev/src/catalog.edu` is archived under:

```text
-tmp/-archive/-dev/sys.dev/catalog.edu.01/
```

The `.01` suffix marks the single temporary backup/archive copy for this retirement.
Do not leave the retired `catalog.edu` tree live inside `code/sys.dev/src/`.

## Status

`code/sys.dev/src/catalog.edu` appears to be an old draft stratum inside `@sys/dev`.
It is still wired internally by `@sys/dev`, but no external imports were found in this workspace during the initial scan.

Observed internal wires:

- `code/sys.dev/deno.json`
  - exports `./catalog.edu`, `./catalog.edu/slug`, `./catalog.edu/slug.traits`, `./catalog.edu/t`
  - includes `./src/catalog.edu/t.global.d.ts` in compiler options
- `code/sys.dev/src/-test/-specs.ts`
  - imports `../catalog.edu/-test/-specs.ts`
- `code/sys.dev/src/catalog.edu/-.test.ts`
  - self-tests the exported `@sys/dev/catalog.edu` surface

Observed replacement gravity:

- `code/sys.model/model-slug` owns cleaner slug model surfaces:
  - `@sys/model-slug/core`
  - `@sys/model-slug/schema`
  - `@sys/model-slug/client`
  - `@sys/model-slug/bundle`
  - `@sys/model-slug/fs`
- `deploy/@tdb.edu.slug` owns the active product/draft app layer.
- `deploy/@tdb.data` owns staged data/source/runtime client work.

## Goal

Retire `code/sys.dev/src/catalog.edu` from the live `@sys/dev` package if it is no longer a needed public or internal surface.

Archive the removed source tree under:

```text
-tmp/-archive/-dev/sys.dev/catalog.edu.01/
```

## Non-goals

- Do not migrate old code opportunistically.
- Do not preserve old DevHarness samples as live specs unless a current owner explicitly needs them.
- Do not move `catalog.edu` into another shared package as-is.
- Do not conflate this cleanup with new `@draft/app-shell` work.

## Phase 1 — confirm retirement safety

1. Re-run a narrow import scan for:
   - `@sys/dev/catalog.edu`
   - `@sys/dev/catalog.edu/slug`
   - `@sys/dev/catalog.edu/slug.traits`
   - `catalog.edu`
2. Inspect `code/sys.dev/README.md`, `deno.json`, and root test/spec entrypoints.
3. Decide whether any historical concept needs an explicit recovery anchor before retirement.

Exit criteria:

- We can state whether `catalog.edu` is externally unused, internally self-wired only, or still live.

## Phase 2 — archive source tree

Completed by human before live cleanup:

1. `code/sys.dev/src/catalog.edu` was copied to:

   ```text
   -tmp/-archive/-dev/sys.dev/catalog.edu.01/
   ```

2. This plan file remains adjacent to the archive copy:

   ```text
   -tmp/-archive/-dev/sys.dev/catalog-edu-retirement.plan.md
   ```

3. Ensure the archived tree is not imported by live `@sys/dev` code.

Exit criteria:

- The old source tree is preserved in the archive backup.
- The live `code/sys.dev/src/catalog.edu` path is removed.

## Phase 3 — detach internal wires

1. Remove `catalog.edu` subpath exports from `code/sys.dev/deno.json`.
2. Remove `./src/catalog.edu/t.global.d.ts` from compiler options if no longer needed.
3. Remove the catalog spec import/spread from `code/sys.dev/src/-test/-specs.ts`.
4. Remove any root-level `@sys/dev` test dependency on catalog exports.

Exit criteria:

- `@sys/dev` no longer advertises or loads `catalog.edu`.

## Phase 4 — remove retired live files

1. Remove `code/sys.dev/src/catalog.edu`.
2. Run the narrow `@sys/dev` check/test surface from `code/sys.dev`.
3. Fix only direct retirement fallout.

Exit criteria:

- `deno task check` passes from `code/sys.dev`.
- Narrow tests pass or remaining failures are unrelated and documented.

## Commit shape

Prefer a retirement commit with recovery anchors:

```text
chore(sys.dev): retire superseded catalog.edu draft surface

catalog.edu was internally wired by @sys/dev but superseded by model-slug and deploy-local slug work.
The retired material is archived under -tmp/-archive/-dev/sys.dev/catalog.edu.01.

Recovery-anchors:
- catalog.edu
- @sys/dev/catalog.edu/slug
- @sys/model-slug
- deploy/@tdb.edu.slug
- deploy/@tdb.data
```
