# @sys/tmpl Additive Type Export Plan

- [x] fix(tmpl): make module type export updates additive

## Intent
- Fix the module template pointer update so scaffolding never erases an existing `types.ts` rollup.
- Keep the generator simple: additive pointer only, no custom rollup inference.
- Preserve human cleanup as the place where package-specific type routing is curated.

## Problem
- `tmpl.m.mod/.tmpl.ts` previously updated the nearest `types.ts` by modifying the last line.
- In a package with an existing aggregate such as `export type * from './ui.react/t.ts';`, scaffolding a leaf module could replace that aggregate with a direct leaf export.
- This silently narrowed the package type surface and bypassed the intended rollup chain.

## Invariant
- Template pointer updates may add a type export.
- Template pointer updates must never delete, replace, or reorder an existing type rollup.
- Re-running the same scaffold/update must not duplicate the pointer line.
- Empty or placeholder-only type surfaces should become clean real export surfaces.

## Final behavior
Given an existing `types.ts`:

```ts
export type * from './ui.react/t.ts';
```

and a new module `src/ui.react/ui.files/ui.InfoPanel.Config/t.ts`, the update now produces:

```ts
export type * from './ui.react/t.ts';
export type * from './ui.react/ui.files/ui.InfoPanel.Config/t.ts';
```

A later human cleanup may remove the temporary direct leaf export and wire the leaf through the package's curated aggregate.

## Implementation reality
Patched:

- `code/-tmpl/-templates/tmpl.m.mod/.tmpl.ts`
- `code/-tmpl/src/-tests/-m.mod.test.ts`

`updateTypesFile(...)` now:

1. computes the desired export line: `export type * from './<rel>';`
2. no-ops if that exact line already exists
3. inserts after the last existing `export type * from ...` line
4. appends at EOF when no star type export exists
5. replaces the inert `export type {};` placeholder cleanly
6. writes whitespace-only type surfaces as a single export line

It does not infer package-specific rollup hierarchies such as `ui.react/t.ts` or `ui.files/t.ts`.

## Test reality
Regression coverage now proves:

- existing aggregate line is preserved
- new direct leaf export is added
- running the update twice does not duplicate the export
- fallback append works when `types.ts` has no existing star export lines
- inert placeholder export is replaced cleanly
- empty/whitespace-only `types.ts` becomes a single real export

The tests are grouped under:

- `describe('write', ...)`
- `describe('updateTypesFile', ...)`

## Proof
From `code/-tmpl`:

- `deno task test --trace-leaks ./src/-tests/-m.mod.test.ts`
- `deno task check`

Both passed.

## Commit message

```text
fix(tmpl): make module type export updates additive
```

## Non-goals preserved
- No custom inference of nested aggregate structures.
- No broad template rewrite.
- No changes to `m.mod.ui` beyond consuming the safer shared helper.
