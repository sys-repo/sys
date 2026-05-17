# pkg.help resource spine plan

## Status

Completed.

`pkg.help` is now the canonical additive template for a package-local help-resource spine.
The implementation preserves the boundary that this plan required:

```text
authored YAML -> embedded bundle -> typed loader -> package-specific formatter or CLI
```

The template adds resources and loaders only. It does not add CLI routes, command parsing,
rendering, DSL chapters, `deno.json` exports, or root runtime exports.

## Related commits

- `fe6f61a26d5d968d5c84709a75803f9d94e021a7` — `chore(tmpl:pkg): scaffold @sys/server root package`
  - Context commit: surfaced the pure/root-package cleanup pressure that led to the help-spine plan.
- `0981763c8296c19c0952fa1aff88a51bf021efb8` — `docs(server): refine root package description`
  - Context commit: clarified the accepted `@sys/server` root package role.
- `77028e069bee923b3a4b6fc1ed93ff11f9eabf5d` — `docs(tmpl): clarify pure package reduction in pkg DSL`
  - Adjacent DSL commit: recorded the package-template reduction guidance learned from `@sys/server`.
- `92acc826a76470475fc8d33a613a803e3554ab32` — `feat(tmpl): add pkg.help template`
  - Main implementation commit for this plan.
  - Adds `pkg.help`, hardens CLI flag/preflight behavior, adds the canonical DSL chapter,
    adds focused tests, updates generated repo import authority, and normalizes the
    `@sys/cell` DSL type surface to the same `CliFormatChapters` model.

## Final implementation reality

### `@sys/tmpl` canonical template

`pkg.help` exists as an additive template in `code/-tmpl/-templates/tmpl.pkg.help/`.

It writes this spine into an existing package root:

```text
src/m.help/
  mod.ts
  t.ts
  common.ts
  yaml/root.yaml
  -bundle/mod.ts
  -bundle/-bundle.ts
  -bundle/-bundle.json
  u/u.paths.ts
  u/u.load.ts
  u/u.yaml.ts
```

The template setup updates only package-local support surfaces:

- `src/types.ts` gains `export type * from './m.help/t.ts';`.
- `deno.json` gains `help:bundle` when missing.
- `deno.json` task `prep` runs `deno task help:bundle` when missing from `prep`.

The template preflights before writing:

- target must be an existing sys package root;
- target must contain `deno.json`, `src/common.ts`, and `src/types.ts`;
- existing `src/m.help/` requires explicit `--force` approval.

This prevents the unsafe partial-write failure mode that the plan called out.

### CLI contract

`@sys/tmpl` now treats `pkg.help` as an existing-package operation:

- existing package roots are expected and do not require `--force`;
- `--pkgName` and `--name` are rejected for `pkg.help`;
- errors point agents back to `deno run -ERW jsr:@sys/tmpl dsl pkg.help`;
- commit suggestions say `docs(tmpl:pkg.help): add help resources to <path> (<n> files)`.

This matches the speech act precisely: add help resources/spine, not scaffold a new package.

### DSL contract

`code/-tmpl/src/m.help/yaml/dsl.pkg.help.yaml` records the exact agent contract:

- use `pkg.help` only for an existing sys package;
- no `--pkgName` or `--name` is accepted;
- no CLI behavior, command routing, rendering, DSL chapters, package exports, or root runtime exports are added;
- `src/m.help/` is the resource/loading layer;
- run `deno task help:bundle` and `deno check -- ./src/m.help/mod.ts ./src/m.help/-bundle/mod.ts` to verify.

The root `@sys/tmpl` DSL indexes `pkg.help` as an inner package operation and uses the speech act:

```text
add a YAML help-resource spine to <package-dir>
```

### Import/dependency authority

Generated repos now include the authorities required by the help spine:

- `@sys/cli/t`
- `@sys/fs`
- `@sys/fs/t`
- `@sys/tmpl-engine`
- `@sys/tmpl-engine/t`
- `@sys/yaml`
- `@sys/yaml/t`

This closes the earlier `help:bundle` risk for generated workspaces.

### Tests and proof level

The focused integration test proves the main scenario:

1. generate a repo;
2. generate a package with `pkg`;
3. overlay `pkg.help` into that package;
4. prove `deno.json` exports and root `src/mod.ts` are unchanged;
5. prove tasks/types were updated;
6. rewrite local authorities;
7. run `deno task help:bundle` in the generated package;
8. run `deno check -- ./src/m.help/mod.ts ./src/m.help/-bundle/mod.ts`.

CLI tests also cover:

- `pkg.help` into an existing package without `--force`;
- rejection of `--pkgName` and `--name`;
- malformed package preflight before write;
- existing `src/m.help/` requiring `--force`;
- additive commit-message wording.

## Exemplar alignment

### `@sys/tmpl`

`@sys/tmpl` is now the canonical exemplar for this plan:

- `m.help` owns authored resources, bundled JSON, resource paths, YAML parsing, and typed loading.
- `m.tmpl` owns CLI routing, argument behavior, terminal rendering, and skill/human output.
- DSL chapters are registered as chapter resources and loaded through `CliFmt.Chapters.Book`.
- Types use `CliFormatChapters.Chapter`, `.Chapter.Link`, and `.Chapter.Resource<t.StringPath>`.

### `@sys/cell`

`@sys/cell` is coherent with the canonical structure:

- `m.help` owns root/init/task/start help resources plus the DSL chapter book.
- `m.cli` owns CLI behavior and rendering.
- DSL types now use the same `CliFormatChapters` chapter/resource types as `@sys/tmpl`.
- The Cell-specific extra help pages are package-appropriate expansion, not structural drift.

## BMIND review

### Accepted

- Additive `pkg.help` template exists and is not part of default `pkg`.
- The template does not imply CLI behavior.
- The template does not imply DSL behavior.
- Help resources remain internal unless a package explicitly wires exports/routes/rendering.
- CLI behavior remains package-owned.
- YAML resources remain authored source.
- `-bundle.json` remains generated.
- Bundle/build dependencies are localized to bundle and help-loader surfaces.
- DSL remains earned by explicit speech acts and operational command surfaces.
- `@sys/tmpl` and `@sys/cell` now share the same chapter-resource type structure.
- No shared helper extraction was attempted before exemplars were normalized.

### Corrected during implementation

- `pkg.help` now rejects invalid `--pkgName`/`--name` flags instead of silently ignoring them.
- Preflight now runs before copy/write, so malformed targets do not receive partial `src/m.help/` files.
- The target contract names the real required package shape beyond `deno.json`.
- Generated repo authorities now include the packages needed to run `help:bundle`.
- Wording avoids “scaffold” for `pkg.help` and uses additive help-resource language.
- The DSL avoids insider shorthand and states exact side effects/non-effects.

### Deferred deliberately

- Do not add help spine to default `pkg` yet.
- Do not extract shared YAML/load/path helpers yet.
- Do not create `pkg.help.dsl` yet.
- Do not infer DSL chapters from help resources alone.

## Validation

Focused validation after implementation:

```text
cd code/-tmpl && deno task test --trace-leaks ./src/-tests/-pkg.help.test.ts
# passed: 1 test, 1 step

cd code/-tmpl && deno task test --trace-leaks ./src/m.tmpl/-test/-dsl.test.ts
# passed: 1 test, 11 steps

cd code/sys/cell && deno test -P=test --trace-leaks ./src/m.help/-test/-.test.ts ./src/m.cli/-test/-dsl.test.ts ./src/m.cli/-test/-u.help.test.ts
# passed: 3 tests, 36 steps
```

## Final acceptance

A future sys package can now add bundled YAML help resources by applying `pkg.help` to an
existing package root. The package receives a standard `m.help` resource/loading spine and
keeps CLI behavior, rendering, exports, and DSL behavior explicitly package-owned.

BMIND verdict: accepted. The plan is complete, accurate to implementation reality, and ready
for archival as the canonical package help-resource-spine decision record.
