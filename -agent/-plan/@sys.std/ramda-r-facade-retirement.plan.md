# Ramda / `R` facade retirement plan

## Status

Complete.

The maintained workspace has retired the legacy Ramda-backed `R` facade arc. `@sys/std` no longer publishes `@sys/std/r`, no longer keeps the compatibility `R` implementation/tests, and the workspace dependency surfaces no longer carry `ramda` or `@types/ramda`.

This was a source-level retirement, not a cache/install workaround:

- no Deno cache deletion;
- no resolver-policy bypass;
- no bundling around broken dependencies;
- no replacement with broad ad-hoc utility clutter.

The useful semantics now live on first-class `@sys` surfaces.

## Landed commits

- [x] `135d024c1 fix(std): remove ramda runtime from R facade`
- [x] `2c1d6c438 fix(std): remove internal R facade usage`
- [x] `84d5316b7 fix(std): harden structural equality kernel`
- [x] `09f8e7707 feat(std): add Eql helpers`
- [x] `8481ceea1 refactor(std): route R equality facade through Eql kernel`
- [x] `97685032c fix(workspace): remove low-risk R facade usage`
- [x] `1d89a99af fix(ui-dom): remove keyboard R facade usage`
- [x] `da5dc5455 fix(ui): remove theme/state R facade usage`
- [x] `b03571182 refactor(std): retire active R facade re-exports`
- [x] `4de8281a6 refactor(std): retire R facade export`

Historical note: `86fe24b83 refactor(std): retire legacy R facade` deleted a spent Eql helper plan; it was not the final `@sys/std/r` removal.

## Final source truth

Exact maintained-workspace scan is clean for:

- `@sys/std/r`
- `"./r"` in `@sys/std` exports
- `npm:ramda`
- `@types/ramda`
- `ramda`
- `libs.R`
- `RLib`
- legacy `R.equals`/`R.uniq`/`R.mergeDeepRight` facade references

Removed `@sys/std` compatibility files:

- `code/sys/std/src/-exports/-r.ts`
- `code/sys/std/src/common/libs.R.ts`
- `code/sys/std/src/common/-test/-libs.R.test.ts`

Cleaned dependency/config surfaces:

- `deps.yaml`
- `imports.json`
- `package.json`
- `deno.lock`
- `deno.graph.json`
- `code/sys/std/deno.json`
- generated template dependency surfaces under `code/-tmpl/`

Remaining `R` identifiers, where present, are not legacy facade usage:

- generic type parameters named `R`;
- local/domain aliases such as `Path.Rel` tests;
- domain type namespaces unrelated to Ramda.

## Replacement map

- `R.equals` → `Eql.deep` / `Obj.eql`.
- `R.clone` → `Obj.clone` where clone semantics are acceptable.
- `R.uniq` → `Eql.unique` for structural dedupe; `Arr.uniq` only for primitive/identity lists.
- `R.uniqBy` → `Eql.uniqueBy`.
- `R.sortBy(R.prop('index'))` → explicit copied-array sort or domain selector.
- `R.mergeDeepRight` → local/domain merge with tests around nested merge and replacement semantics.

## Validation recorded during the arc

Final public-facade removal:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/std
deno task check && deno task test
deno task dry

cd /Users/phil/code/org.sys/sys/code/sys/workspace
deno test -P=test ./src/m.resolve/-test/-.test.ts

cd /Users/phil/code/org.sys/sys
deno task prep:imports
deno task check:graph
```

All passed.

Earlier UI/domain validation included:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.ui/ui-dev
deno test -P=test --trace-leaks ./src/ui.react.devharness/u/m.Bus/-.test.ts
deno test -P=test --trace-leaks ./src/ui.react.devharness
```

Result:

```txt
DevBus: ok | 1 passed (40 steps) | 0 failed
ui.react.devharness: ok | 18 passed (154 steps) | 0 failed
```

Switch theme coverage was also validated:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.ui/ui-components
deno task check
deno test -P=test --trace-leaks ./src/ui.react/Buttons.Switch
```

## Out of scope / do not regress

- Do not reintroduce Ramda, direct Ramda submodule imports, or `@types/ramda`.
- Do not recreate `@sys/std/r` as a compatibility path.
- Do not use bundling, cache deletion, or resolver-policy changes as dependency fixes.
- Keep `-tmp/-archive/**` out of scope.
- Keep the separate Obj type namespace cleanup tracked independently.
