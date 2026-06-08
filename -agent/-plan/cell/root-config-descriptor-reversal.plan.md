# Cell root-config descriptor reversal plan

Status: retired — implemented and committed.

## Commit arc

- [x] refactor(cell): restore config-root Cell descriptor path
- [x] feat(cell): migrate branded Cell descriptors back to config root
- [x] docs(cell): align Cell guidance with config-root descriptor

## Current reality

The descriptor reversal, legacy descriptor migration, template move, help bundle, and README/help prose
landed together so code and public guidance describe the same canonical path.

Committed as:

```text
adc67052c43a6ac8c880cc8db1e4503ab6a6762b refactor(cell): restore config-root Cell descriptor path
```

## Decision

Back out the root `-cell/cell.yaml` canonical path. The canonical descriptor lives under the standard
root config tree:

```text
-config/
  @sys.cell/
    cell.yaml
```

DMIND shape: `-config/` is the root noun; `@sys.cell/` supplies ownership. A Cell remains the folder
boundary, but it does not need a branded top-level control directory.

## Implemented code facts

- `code/sys/cell/src/m.cell/u/paths.ts` makes `-config/@sys.cell/cell.yaml` canonical and
  `-cell/cell.yaml` legacy.
- `code/sys/cell/src/m.cell/u/load.ts` loads canonical first, falls back to legacy, and fails on
  ambiguity.
- `code/sys/cell/src/m.cell/u.migrate/-01.ts` migrates from `-cell/cell.yaml` to
  `-config/@sys.cell/cell.yaml`.
- `code/sys/cell/src/m.tmpl/tmpl.cell.default/-config/@sys.cell/cell.yaml` and the template bundle
  materialize the config-root descriptor.
- `code/sys/cell/src/m.cli/u/u.root.ts` uses both canonical and legacy descriptor paths for ancestor
  discovery.
- Tests treat config-root descriptors as canonical and `-cell/cell.yaml` as the legacy fallback.
- Samples use `-config/@sys.cell/cell.yaml`.
- Help/DSL docs and generated help bundle describe `-config/@sys.cell/cell.yaml` as canonical.

## Target path constants

Target `CellPaths` shape:

```ts
export const CellPaths: t.Cell.MetadataPaths = {
  metaDir: '-config/@sys.cell',
  descriptor: '-config/@sys.cell/cell.yaml',
  configDir: '-config',
  legacy: {
    descriptor: '-cell/cell.yaml',
  },
};
```

Type docs in `m.cell/t.ts` should say:

- canonical descriptor: `<root>/-config/@sys.cell/cell.yaml`
- root owner config directory: `<root>/-config`
- legacy descriptor: `<root>/-cell/cell.yaml`

Do not introduce `-cell/-config` as a new canonical lane.

## Migration design

Reverse the descriptor migrator.

Required behavior:

- dry-run with only `-cell/cell.yaml` plans `-cell/cell.yaml` → `-config/@sys.cell/cell.yaml`
- non-dry-run moves the descriptor, preserving descriptor bytes
- canonical-only roots are no-ops
- no-descriptor roots are no-ops
- both descriptors present fails before mutation
- invalid legacy YAML/schema fails before mutation
- `Cell.load` keeps a temporary fallback for `-cell/cell.yaml` and emits compatibility metadata
- no owner config files are rewritten implicitly

Nested config posture:

- The first migrator is descriptor-only.
- If `-cell/-config` exists with files, report it as legacy residue rather than silently moving it.
- A future explicit migration can rewrite descriptor `config` refs and move owner configs if real user
  data proves that path was used.
- Empty `-cell` directory cleanup is optional and must be non-recursive/empty-only if implemented.

## Implementation chunks

### 1. Path spine and loader

- Update `CellPaths` and type docs.
- Update `Cell.load` fallback messages to say legacy `-cell/cell.yaml` is temporary.
- Update path tests first so the red step proves the intended reversal.

### 2. Init/template surface

- Move template resource from:

  ```text
  src/m.tmpl/tmpl.cell.default/-cell/cell.yaml
  ```

  to:

  ```text
  src/m.tmpl/tmpl.cell.default/-config/@sys.cell/cell.yaml
  ```

- Rebuild `src/m.tmpl/-bundle/-bundle.json` through `deno task tmpl:bundle`.
- Update init tests and CLI output expectations to show `./-config/@sys.cell/cell.yaml`.
- Preserve coexistence with `.pi/` and other `-config/*` owner namespaces.

### 3. Migrator reversal

- Reverse `m.cell/u.migrate/-01.ts` source/target paths.
- Keep validation and byte-preserving move semantics.
- Update CLI migrate tests and help text.
- Keep result wording neutral: migrate Cell descriptor/config-runtime item, not branded folder.

### 4. Help, DSL, and README

- Replace canonical-path prose in `src/m.help/yaml/*.yaml` from `-cell/cell.yaml` to
  `-config/@sys.cell/cell.yaml`.
- Update migrate help so legacy-only means `-cell/cell.yaml` → `-config/@sys.cell/cell.yaml`.
- Update README command help and prose.
- Rebuild `src/m.help/-bundle/-bundle.json` through `deno task help:bundle`.

### 5. Tests and samples

- Keep existing samples under `-sample/*/-config/@sys.cell/cell.yaml`.
- Update any test fixtures that intentionally exercise legacy fallback to use `-cell/cell.yaml`.
- Update start/task happy-path fixtures to use canonical `-config/@sys.cell/cell.yaml`.

## Verification plan

From `code/sys/cell`:

```sh
deno task tmpl:bundle
deno task help:bundle
```

Iteration note: the package `test` task currently hard-codes `./src`, so it is not a true targeted
surface. Use raw Deno only for narrow proof where the task surface cannot express the scope, then
finish through the package tasks:

```sh
deno test -P=test ./src/m.cell
deno test -P=test ./src/m.cli
deno task check
deno task test
```

## Acceptance checks

- [x] `CellPaths.descriptor` is `-config/@sys.cell/cell.yaml`.
- [x] `CellPaths.legacy.descriptor` is `-cell/cell.yaml`.
- [x] `@sys/cell init` creates `./-config/@sys.cell/cell.yaml`.
- [x] `Cell.load` loads canonical config-root descriptors without compatibility warnings.
- [x] `Cell.load` still loads `-cell/cell.yaml` during the compatibility window with a legacy warning.
- [x] `@sys/cell migrate --dry-run` reports `-cell/cell.yaml` → `-config/@sys.cell/cell.yaml`.
- [x] `@sys/cell migrate` preserves descriptor bytes.
- [x] Ambiguous roots with both descriptors fail before mutation.
- [x] Help/DSL/README no longer call `-cell/cell.yaml` canonical.
- [x] Template and help bundles are regenerated from source YAML/template files.

## Non-goals

- No descriptor schema change.
- No service/task config semantics change.
- No automatic rewrite of owner config files or descriptor `config` refs.
- No new root-level Cell control directory.
- No removal of legacy fallback until a later explicit compatibility-window closeout.
