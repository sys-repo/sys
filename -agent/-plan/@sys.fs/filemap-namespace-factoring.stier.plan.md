# FileMap namespace factoring S-tier plan

- [ ] refactor(fs): namespace FileMap contract surface

## Purpose

Bring `code/sys/fs/src/m.FileMap` to the modern @sys namespace grammar without changing the runtime FileMap API or materialization behavior.

Target public runtime surface stays stable:

```ts
FileMap.toMap(...)
FileMap.bundle(...)
FileMap.validate(...)
FileMap.filter(...)
FileMap.write(...)
FileMap.Data.*
FileMap.Is.*
```

Target type surface becomes namespace-first:

```ts
t.FileMap.Lib
t.FileMap.Data.Lib
t.FileMap.Is.Lib
t.FileMap.ToMap.*
t.FileMap.Filter.*
t.FileMap.Bundle.*
t.FileMap.Validate.*
t.FileMap.Write.*
```

## XHIGH review result

This should be a compatibility refactor, not a breaking cleanup.

Evidence checked before writing this plan:

- `m.FileMap/t.ts`, `t.bundle.ts`, `t.toMap.ts`, and `t.write.ts` are old flat type spines.
- `m.FileMap/m.FileMap.ts` is the single primary runtime implementation, so `mod.FileMap.ts` is the canonical filename target.
- `m.FileMap/m.Data.ts`, `m.Is.ts`, and `u/*` already express the correct runtime concepts; the main issue is type namespace factoring and import-lane cleanup.
- Downstream workspace code imports flat aliases such as `FileMapLib`, `FileMapBundleResult`, `FileMapOp`, `FileMapProcessor`, and `FileMapWriteResult` from `@sys/fs/t`.
- Therefore this pass must keep flat compatibility aliases while moving first-class internal usage to `FileMap.*` namespaces.
- `@sys/fs` common already exposes `Json`; FileMap validate should use the common `Json` lane rather than raw `JSON.parse`, while preserving the existing validation error contract.
- `m.Data.ts` currently deep-imports `@std/encoding`; route that dependency through the package common lane unless a narrower explicit exception is documented.

## Canonical type shape

Use the same pattern as modern @sys modules that define a root type plus a same-named namespace.

```ts
export type FileMap = { [path: t.StringPath]: string };

export declare namespace FileMap {
  export type Lib = {
    readonly Data: Data.Lib;
    readonly Is: Is.Lib;
    readonly toMap: ToMap.Method;
    readonly bundle: Bundle.Method;
    readonly validate: Validate.Method;
    readonly filter: Filter.Method;
    readonly write: Write.Method;
  };
}
```

Subnamespace targets:

- `FileMap.Data.Lib`
  - `FileMap.Data.ContentType.Lib`
- `FileMap.Is.Lib`
  - `FileMap.Is.Supported.Lib`
  - `FileMap.Is.ContentType.Lib`
- `FileMap.ToMap.Method`
  - `FileMap.ToMap.Options`
  - `FileMap.ToMap.OptionsInput`
- `FileMap.Filter.Method`
  - `FileMap.Filter.Args`
- `FileMap.Bundle.Method`
  - `FileMap.Bundle.Options`
  - `FileMap.Bundle.OptionsInput`
  - `FileMap.Bundle.Result`
  - `FileMap.Bundle.BeforeWrite.Method`
  - `FileMap.Bundle.BeforeWrite.Args`
- `FileMap.Validate.Method`
  - `FileMap.Validate.Result`
- `FileMap.Write.Method`
  - `FileMap.Write.Options`
  - `FileMap.Write.Result`
  - `FileMap.Write.Processor.Method`
  - `FileMap.Write.Processor.Args`
  - `FileMap.Write.Op.Any`
  - `FileMap.Write.Op.Common`
  - `FileMap.Write.Op.Renamed`
  - `FileMap.Write.Op.OfKind<K>`

Keep compatibility aliases at the bottom of `t.ts` for this pass:

```ts
export type FileMapLib = FileMap.Lib;
export type FileMapDataLib = FileMap.Data.Lib;
export type FileMapIsLib = FileMap.Is.Lib;
export type FileMapBundle = FileMap.Bundle.Method;
export type FileMapBundleOptions = FileMap.Bundle.Options;
export type FileMapBundleResult = FileMap.Bundle.Result;
export type FileMapBundleBeforeWrite = FileMap.Bundle.BeforeWrite.Method;
export type FileMapBundleBeforeWriteArgs = FileMap.Bundle.BeforeWrite.Args;
export type FileMapToMap = FileMap.ToMap.Method;
export type FileMapToMapOptions = FileMap.ToMap.Options;
export type FileMapFilter = FileMap.Filter.Method;
export type FileMapFilterArgs = FileMap.Filter.Args;
export type FileMapValidateResult = FileMap.Validate.Result;
export type FileMapWrite = FileMap.Write.Method;
export type FileMapWriteOptions = FileMap.Write.Options;
export type FileMapWriteResult = FileMap.Write.Result;
export type FileMapProcessor = FileMap.Write.Processor.Method;
export type FileMapProcessorArgs = FileMap.Write.Processor.Args;
export type FileMapOp = FileMap.Write.Op.Any;
export type FileMapOpCommon = FileMap.Write.Op.Common;
export type FileMapOpRenamed = FileMap.Write.Op.Renamed;
export type FileMapOpOfKind<K extends FileMapOp['kind']> = FileMap.Write.Op.OfKind<K>;
```

These aliases may be marked `@deprecated` only if we want the migration signal to show in public docs immediately.

## Refactor sequence

1. Rewrite `m.FileMap/t.ts` as the single public type spine.
   - Fold the existing `t.bundle.ts`, `t.toMap.ts`, and `t.write.ts` concepts into namespaced sections.
   - Keep `Lib` first inside `FileMap`.
   - Preserve the current mutable map index signature; do not introduce a readonly map behavior/type change in this refactor.
2. Remove stale sibling type-spine files after all references are gone:
   - `m.FileMap/t.bundle.ts`
   - `m.FileMap/t.toMap.ts`
   - `m.FileMap/t.write.ts`
3. Rename the primary runtime implementation by creating `m.FileMap/mod.FileMap.ts` and retiring `m.FileMap/m.FileMap.ts`.
   - Update `m.FileMap/mod.ts` to export from `./mod.FileMap.ts`.
4. Update FileMap runtime files to use canonical names:
   - `t.FileMap.Lib`
   - `t.FileMap.Data.Lib`
   - `t.FileMap.Is.Lib`
   - `t.FileMap.ToMap.Method`
   - `t.FileMap.Bundle.Method`
   - `t.FileMap.Write.*`
   - Avoid `t.FileMapLib['...']`, `Parameters<F>`, and direct named imports from `./t.ts`.
5. Route dependencies through the local common lane.
   - Import `Json` from `../common.ts` through `m.FileMap/common.ts` in `u.validate.ts`.
   - Route `encodeBase64` / `decodeBase64` through the package common lane, or document the explicit exception if not moved.
6. Preserve validation semantics while replacing raw JSON parsing.
   - Keep the user-facing parse failure message shape: `Invalid FileMap: JSON parse failed`.
   - Avoid accidentally treating an empty string as a valid missing/default JSON value if the current behavior is parse failure.
7. Update local FileMap tests to prefer canonical namespace type names where annotations are touched.
   - Keep downstream packages untouched in this compatibility pass unless `deno task check` requires otherwise.

## Acceptance checks

- `m.FileMap/t.ts` is type-plane only.
- `FileMap.Lib` is the visible first contract under the root namespace.
- Obvious multi-type concepts are rolled up under subnamespaces.
- The runtime value export remains `FileMap`.
- Existing downstream flat aliases from `@sys/fs/t` still type-check.
- No FileMap runtime file imports named types directly from `./t.ts`.
- No FileMap runtime file uses `t.FileMapLib['...']` or `Parameters<F>` where a named public type exists.
- Raw native `JSON.parse` is not used in FileMap runtime code.
- Direct `@std/encoding` imports are moved behind the common lane or explicitly justified.
- Stale `t.bundle.ts`, `t.toMap.ts`, `t.write.ts`, and `m.FileMap.ts` are removed after replacement.

## Verification

Run from the owning module directory:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/fs
deno task test --trace-leaks ./src/m.FileMap
deno task check
```

If these expose downstream alias breakage, keep the compatibility aliases and update only the minimal failing type references needed for the check.

## Non-goals

- Do not change FileMap encoding/decoding behavior.
- Do not change write `dryRun`, `force`, rename, skip, or op-total semantics.
- Do not remove flat public aliases in this pass.
- Do not convert `FileMap` map entries to readonly in this pass.
- Do not expand supported MIME/content-type policy.
