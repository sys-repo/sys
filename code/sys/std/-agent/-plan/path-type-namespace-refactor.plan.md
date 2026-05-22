# Path type namespace refactor plan

## Scope

Package: `code/sys/std`

Primary surface:

- `src/m.Path/t.ts`
- `src/m.Path/t.bounded.ts` new type-plane file
- `src/m.Path/*` runtime files and tests that consume path types

Known downstream callsites to update after the clean break:

- `code/sys/fs`
- `code/sys/cli`
- `code/sys.model/model`

## Intent

Make the path type surface match the runtime noun structure.

Current state is too flat:

- `PathLib`
- `PathFormatLib`
- `PathFormatter`
- `PathJoinLib`
- `PathBoundedLib`
- `PathBoundedOps`
- related support names

Target state is namespace-owned:

- `Path.Lib`
- `Path.Dir.Options`
- `Path.Dir.Builder`
- `Path.Is.Lib`
- `Path.Join.Lib`
- `Path.Join.Platform`
- `Path.Join.Fn`
- `Path.Format.Lib`
- `Path.Format.Formatter`
- `Path.Format.Args`
- `Path.Format.Part`
- `Path.Format.PartIs`
- `Path.FileExtension`
- `PathBounded.Lib`
- `PathBounded.Ops`
- `PathBounded.PosixOps`
- `PathBounded.Invalid`

No compatibility aliases. This is greenfield cleanup; fix all callsites after the clean refactor.

## Target type shape

### `src/m.Path/t.bounded.ts`

```ts
import type { t } from './common.ts';

export declare namespace PathBounded {
  export type Lib = {
    readonly Is: {
      readonly windowsDrive: (input: t.StringPath) => boolean;
    };
    readonly visible: (
      ops: Ops,
      input: unknown,
      invalid?: Invalid,
    ) => t.StringRelativePath;
    readonly parent: (
      input: t.StringRelativePath,
      invalid?: Invalid,
    ) => t.StringRelativePath;
    readonly posix: () => PosixOps;
  };

  export type Ops = {
    readonly isAbsolute: (path: t.StringPath) => boolean;
    readonly normalize: (path: t.StringPath) => t.StringPath;
  };

  export type PosixOps = Ops & {
    readonly join: (...parts: readonly string[]) => t.StringPath;
    readonly resolve: (...parts: readonly string[]) => t.StringAbsolutePath;
    readonly relative: (from: t.StringPath, to: t.StringPath) => t.StringRelativePath;
  };

  export type Invalid = (message: string) => Error;
}
```

### `src/m.Path/t.ts`

- Re-export bounded types:

```ts
export type * from './t.bounded.ts';
```

- Replace `PathLib` and the other flat path-owned types with:

```ts
export declare namespace Path {
  export type Lib = {
    readonly Is: Is.Lib;
    readonly Format: Format.Lib;
    readonly Bounded: t.PathBounded.Lib;
    readonly Join: Join.Lib;
    readonly join: Join.Lib['auto'];
    readonly joinGlobs: typeof StdPath.joinGlobs;
    readonly resolve: typeof StdPath.resolve;
    readonly absolute: (path: t.StringPath) => string;
    readonly relative: typeof StdPath.relative;
    relativePosix(input: string): string;
    readonly normalize: typeof StdPath.normalize;
    readonly fromFileUrl: typeof StdPath.fromFileUrl;
    readonly toFileUrl: typeof StdPath.toFileUrl;
    readonly dirname: typeof StdPath.dirname;
    readonly basename: typeof StdPath.basename;
    readonly extname: typeof StdPath.extname;
    ext(...suffixes: string[]): FileExtension;
    dir(base: t.StringDir, options?: Dir.Options | Join.Platform): Dir.Builder;
  };

  export namespace Dir { ... }
  export namespace Is { ... }
  export namespace Join { ... }
  export namespace Format { ... }
  export type FileExtension = { ... };
}
```

Keep `Path.Lib` first in the namespace. Keep support namespaces ordered by the runtime surface: `Dir`, `Is`, `Join`, `Format`, `FileExtension`.

## Execution plan

### 1. Type-plane refactor in `@sys/std`

- Add `src/m.Path/t.bounded.ts`.
- Move bounded types out of `src/m.Path/t.ts` into `PathBounded` namespace.
- Convert the rest of `src/m.Path/t.ts` into `Path` namespace.
- Remove all flat path type exports from `src/m.Path/t.ts`:
  - `PathLib`
  - `PathDirOptions`
  - `PathBoundedOps`
  - `PathBoundedPosixOps`
  - `PathBoundedInvalid`
  - `PathBoundedLib`
  - `PathIsLib`
  - `PathJoinLib`
  - `PathJoinPlatform`
  - `PathJoiner`
  - `PathFormatLib`
  - `PathFormatter`
  - `PathFormatterArgs`
  - `PathFormatterPart`
  - `PathFormatterPartIs`
  - `PathFileExtension`
  - `PathDirBuilder`

### 2. Update `@sys/std` implementation callsites

Use local `t` lane rather than direct imports from `./t.ts`.

Expected changes:

- `m.Path.ts`: `PathLib` -> `t.Path.Lib`
- `m.Bounded.ts`: `t.PathBoundedInvalid` -> `t.PathBounded.Invalid`; same for `Lib`, `Ops`, `PosixOps`
- `m.Fmt.ts`: `PathFormatLib` -> `t.Path.Format.Lib`; formatter support types -> `t.Path.Format.*`
- `m.Is.ts`: `PathIsLib` -> `t.Path.Is.Lib`
- `m.Join.ts`: `PathJoinLib` -> `t.Path.Join.Lib`
- `u.dir.ts`: `t.PathDirOptions` / `t.PathJoinPlatform` -> `t.Path.Dir.Options` / `t.Path.Join.Platform`
- `u.ext.ts`: `t.PathFileExtension` -> `t.Path.FileExtension`
- `u.rel.ts`: `t.PathLib['relativePosix']` -> `t.Path.Lib['relativePosix']`
- path tests: update type assertions and local fixture types to `t.Path.*` and `t.PathBounded.*`

### 3. Update downstream callsites after the std break

Known replacements:

- `t.PathLib` -> `t.Path.Lib`
- `PathLib` imported from `@sys/std/t` -> import `Path` type namespace and use `Path.Lib`, or route through local `t.Path.Lib`
- `t.PathFormatLib` -> `t.Path.Format.Lib`
- `t.PathFormatter` -> `t.Path.Format.Formatter`
- `t.PathFormatterArgs` -> `t.Path.Format.Args`
- `t.PathBoundedOps` -> `t.PathBounded.Ops`
- `t.PathBoundedPosixOps` -> `t.PathBounded.PosixOps`
- `t.PathBoundedInvalid` -> `t.PathBounded.Invalid`
- `t.PathBoundedLib` -> `t.PathBounded.Lib`

Expected package edits:

- `code/sys/fs/src/common/t.ts`
- `code/sys/fs/src/m.Path/t.ts`
- `code/sys/fs/src/m.Fs/t.ts`
- `code/sys/cli/src/common/t.ts`
- `code/sys/cli/src/m.core/m.Cli/t.ts`
- `code/sys/cli/src/m.core/m.Fmt/t.ts`
- `code/sys.model/model/src/common/t.ts`
- `code/sys.model/model/src/m.files/u/u.path.ts`
- `code/sys.model/model/src/m.files.fs/u/u.path.ts`

Do not opportunistically rename `FsPathLib` or `CliLib` during this pass unless the compile forces it. Those are separate public surfaces and should not be pulled into an uncontrolled cascade.

### 4. Search checks before verification

After edits, run content-location searches to prove no old names remain outside historical notes:

```sh
rg -n "\bPathLib\b|\bPathBounded(?:Invalid|Lib|Ops|PosixOps)\b" /Users/phil/code/org.sys/sys --glob '!**/node_modules/**' --glob '!**/.pi/**'
rg -n "\bPath(?:DirOptions|FileExtension|FormatLib|Formatter|FormatterArgs|FormatterPart|FormatterPartIs|IsLib|JoinLib|JoinPlatform|Joiner)\b" /Users/phil/code/org.sys/sys --glob '!**/node_modules/**' --glob '!**/.pi/**'
```

The only acceptable hits should be this plan or deliberate historical notes.

### 5. Verification order

Run from the owning package roots.

Std first:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/std
deno task test --trace-leaks ./src/m.Path
deno task check
```

Then downstream checks for packages touched by callsite repair:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/fs
deno task check
```

```sh
cd /Users/phil/code/org.sys/sys/code/sys/cli
deno task check
```

```sh
cd /Users/phil/code/org.sys/sys/code/sys.model/model
deno task check
```

If any package lacks a suitable check task, stop and inspect its `deno.json`; do not invent raw commands unless the task surface is missing and the human approves the fallback.

## TMIND review

### Hostile view: this could become a cosmetic rename only

Risk: moving only `PathLib` and `PathBounded*` leaves the rest of the path surface flat and keeps the same disorder under new names.

Resolution: namespace all path-owned support types under `Path` in the same pass. `PathBounded` is separate because it is an exported bounded-path primitive used by non-std packages.

### Hostile view: splitting `PathBounded` may hide it from `@sys/std/t`

Risk: putting bounded types in `t.bounded.ts` without re-exporting them through `m.Path/t.ts` breaks the package type surface.

Resolution: `src/m.Path/t.ts` must `export type * from './t.bounded.ts';`; `src/types.ts` can continue exporting `m.Path/t.ts` as the package-level type entry.

### Hostile view: namespace `Path` may collide with runtime `Path`

Risk: consumers might confuse the runtime value `Path` with the type namespace `Path`.

Resolution: this is intentional TypeScript namespace/value pairing across separate entry surfaces. Runtime imports continue from `@sys/std/path`; type imports come from `@sys/std/t` or local `t` pools. Implementation files should prefer `t.Path.Lib` to make the type-plane lane explicit.

### Hostile view: direct `@sys/std/t` named imports may break in downstream packages

Risk: packages importing `PathLib`, `PathFormatLib`, or `PathBoundedOps` directly will fail after the clean break.

Resolution: update every callsite in the same refactor. Prefer each package's local `t` lane where already available. Where a direct import remains necessary, import the namespace type (`Path` or `PathBounded`) rather than flat names.

### Hostile view: this could cascade into unrelated public API refactors

Risk: while fixing callsites, adjacent flat names such as `FsPathLib` may tempt broader cleanup.

Resolution: keep this pass focused on the `@sys/std` path type surface and the compile-required callsite repairs. Record any adjacent smell as follow-up only.

### Hostile view: tests can pass while public type drift remains

Risk: runtime path tests may pass even if public type exports are broken.

Resolution: include `deno task check` for `@sys/std` and touched downstream packages, plus searches for removed flat type names.

## Non-goals

- Do not change runtime path behavior.
- Do not rename runtime exports (`Path`, `Bounded`, `Format`, `Join`, `Is`).
- Do not add compatibility aliases for old flat type names.
- Do not refactor unrelated std namespaces.
- Do not change package exports in `deno.json` unless the check proves the type surface is unreachable without it.
