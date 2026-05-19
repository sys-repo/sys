# PLAN — Extract path glob matcher to @sys/std/glob

## Final status

Complete. This plan records the completed extraction of the Files/fs glob matcher into `@sys/std/glob` and the subsequent model adoption.

Landed surfaces:

- `@sys/std/glob`
- `code/sys/std/src/m.Glob/`
- `Glob.matches(pattern, path)`
- `t.Glob.*`

Model adoption:

- `code/sys.model/model/src/common/libs.ts` exposes `Glob` from `@sys/std/glob`.
- Files policy/list matching uses `Glob.matches`.
- The local Files/fs glob implementation and test were removed after std coverage existed.

## Original implementation sources

The extracted implementation and behavior tests originally lived in Files/fs:

- `code/sys.model/model/src/m.files.fs/u.glob.ts`
- `code/sys.model/model/src/m.files.fs/-test/-u.glob.test.ts`

The implementation was pure string logic. It did not touch filesystem state, path stats, cwd, environment, network, or process globals.

## Decision

Extract the matcher as a real `@sys/std` leaf module:

```text
@sys/std/glob
```

Runtime surface:

```ts
Glob.matches(pattern, path)
```

Type surface:

```ts
export declare namespace Glob {
  export type Lib = {
    readonly matches: (pattern: Pattern | undefined, path: Path) => boolean;
  };

  export type Pattern = t.StringGlob | readonly t.StringGlob[];
  export type Path = t.StringPath;
}
```

Non-goal: this is not shell glob, minimatch, gitignore, or filesystem traversal. It is a small deterministic path-string matcher.

The full `m.Glob/` boundary is the canonical module shell. The earned behavior is still only `Glob.matches`.

## STIER shape

Create a standard std module boundary, aligned with `code/-tmpl/-templates/tmpl.m.mod` and existing std modules:

```text
code/sys/std/src/m.Glob/
  common.ts
  m.matches.ts
  mod.ts
  t.ts
  -test/
    -.test.ts
    -m.matches.test.ts
```

Expected file roles:

- `common.ts` re-exports `../common.ts` and exposes needed canonical helpers.
- `t.ts` owns the `Glob` namespace and type aliases.
- `m.matches.ts` owns the `Glob.matches` implementation and private helpers.
- `mod.ts` is the leaf runtime entrypoint and composes `Glob: t.Glob.Lib`.
- `-test/-.test.ts` proves the public leaf API.
- `-test/-m.matches.test.ts` proves matcher behavior.

Package export updates:

- Add `"./glob": "./src/m.Glob/mod.ts"` to `code/sys/std/deno.json`.
- Add `export type * from './m.Glob/t.ts';` to `code/sys/std/src/types.ts`.
- Do not add `Glob` to the root `@sys/std` barrel. Leaf-authoritative std policy applies.

## Public API rules

Keep API intentionally small:

```ts
Glob.matches(pattern, path)
```

Do not add yet:

- `Glob.compile`
- AST/parser types
- filesystem helpers
- cwd/root options
- shell/minimatch compatibility flags
- ignore-file semantics

If repeated matching becomes hot, add an internal optimization first. Public `compile` must be earned by real consumers.

## Semantics preserved

- `undefined` pattern returns `false`.
- Pattern arrays match if any pattern matches.
- Normalization is intentionally small:
  - `\` becomes `/`.
  - leading `./` is ignored.
  - no cwd resolution.
  - no leading slash stripping.
  - no `.` / `..` collapse.
- Exact normalized string equality short-circuits.
- `*` matches inside one path segment only.
- `**` matches across path segments.
- `**/` may match zero or more leading directories.
- `**` and `**/*` match all paths.
- Terminal `/**` matches the base path and descendants.
- Regex control characters are literal unless they are glob operators.
- `''` matches `''` by exact normalized equality.
- `''` does not match non-empty paths.
- `[]` returns `false`.

## Proof plan used

Std proof:

```bash
cd /Users/phil/code/org.sys/sys/code/sys/std
deno task test --trace-leaks ./src/m.Glob
deno task check
deno task dry
```

Model proof after switching to std:

```bash
cd /Users/phil/code/org.sys/sys/code/sys.model/model
deno task test --trace-leaks ./src/m.files.fs
deno task check
deno task dry
```

## Commit sequence / follow-along checklist

### Phase 1 — std Glob leaf substrate

```text
feat(std): add path Glob matcher
```

Checklist:

- [x] Run existing Files/fs glob test before extraction.
- [x] Create canonical `code/sys/std/src/m.Glob/` module boundary.
- [x] Add `Glob` namespace in `m.Glob/t.ts` with `Lib` first.
- [x] Add `Glob.matches` runtime.
- [x] Add `@sys/std/glob` module JSDoc with non-shell/non-FS contract.
- [x] Port Files/fs behavior tests into std Glob tests.
- [x] Add std edge tests for zero-depth `**/`, terminal `/**`, empty strings, and empty pattern arrays.
- [x] Add `./glob` leaf export to `code/sys/std/deno.json`.
- [x] Add `m.Glob/t.ts` to `code/sys/std/src/types.ts`.
- [x] Do not add `Glob` to root `@sys/std` barrel.
- [x] Run std proof commands.

### Phase 2 — model Files/fs adoption

```text
refactor(model): use std Glob matcher
```

Checklist:

- [x] Expose `Glob` through `code/sys.model/model/src/common/libs.ts` from `@sys/std/glob`.
- [x] Replace Files/fs policy matcher usage with `Glob.matches`.
- [x] Replace Files/fs list-entry matcher usage with `Glob.matches`.
- [x] Remove local `m.files.fs/u.glob.ts`.
- [x] Remove local `m.files.fs/-test/-u.glob.test.ts` after std coverage exists.
- [x] Run model proof commands.
