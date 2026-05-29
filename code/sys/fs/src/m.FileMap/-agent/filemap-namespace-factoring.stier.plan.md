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

Target type surface is namespace-first:

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

This is a compatibility refactor, not a breaking cleanup.

Evidence checked before implementation:

- `m.FileMap/t.ts`, `t.bundle.ts`, `t.toMap.ts`, and `t.write.ts` were old flat type spines.
- `m.FileMap/m.FileMap.ts` was the single primary runtime implementation, so `mod.FileMap.ts` was the canonical filename target.
- `m.FileMap/m.Data.ts`, `m.Is.ts`, and `u/*` already expressed the correct runtime concepts; the main issue was type namespace factoring and import-lane cleanup.
- Downstream workspace code imports flat aliases such as `FileMapLib`, `FileMapBundleResult`, `FileMapOp`, `FileMapProcessor`, and `FileMapWriteResult` from `@sys/fs/t`.
- Therefore this pass keeps flat compatibility aliases while moving first-class internal usage to `FileMap.*` namespaces.
- `@sys/fs` common already exposes `Json`; FileMap validate uses the common `Json` lane rather than raw `JSON.parse`, while preserving the existing validation error contract.
- `m.Data.ts` previously deep-imported `@std/encoding`; the base64 helpers now route through the package common lane.

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
  - `FileMap.Filter.Predicate`
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

Compatibility aliases remain at the bottom of `t.ts` for this pass:

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
export type FileMapFilter = FileMap.Filter.Predicate;
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

## Implementation reality

Completed in the working tree.

- `t.ts` now owns the FileMap namespace-first public contract surface.
- Compatibility aliases remain for downstream `@sys/fs/t` consumers.
- `mod.FileMap.ts` is the primary runtime implementation file.
- Stale `m.FileMap.ts`, `t.bundle.ts`, `t.toMap.ts`, and `t.write.ts` are removed.
- FileMap runtime code uses the local common lane for `Json` and base64 helpers.
- Local FileMap tests use canonical namespace type names where annotations were touched.

## Acceptance checks

- `m.FileMap/t.ts` is type-plane only.
- `FileMap.Lib` is the visible first contract under the root namespace.
- Obvious multi-type concepts are rolled up under subnamespaces.
- The runtime value export remains `FileMap`.
- Existing downstream flat aliases from `@sys/fs/t` still type-check.
- No FileMap runtime file imports named types directly from `./t.ts`.
- No FileMap runtime file uses `t.FileMapLib['...']` or `Parameters<F>` where a named public type exists.
- Raw native `JSON.parse` is not used in FileMap runtime code.
- Direct `@std/encoding` imports are moved behind the common lane.
- Stale `t.bundle.ts`, `t.toMap.ts`, `t.write.ts`, and `m.FileMap.ts` are removed after replacement.

## Verification

Passed from the owning module directory:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/fs
deno task test --trace-leaks ./src/m.FileMap
deno task check
deno task test
```

## Non-goals

- Do not change FileMap encoding/decoding behavior.
- Do not change write `dryRun`, `force`, rename, skip, or op-total semantics.
- Do not remove flat public aliases in this pass.
- Do not convert `FileMap` map entries to readonly in this pass.
- Do not expand supported MIME/content-type policy.
