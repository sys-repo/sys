# @sys/ui-dom m.File + m.LocalStorage namespace type refactor

- [x] 371658cfc refactor(ui-dom): move file and local-storage types to namespace spines

## XHIGH review

The probe direction is sound, with one refinement: `LocalStorageImmutable` has live external callers, but they are concrete and small enough to migrate in the same clean refactor. Do not keep a compatibility alias if those callers are migrated.

Modern comparison baseline:

- `code/sys/crypto/src/m.Hash/t.ts` uses `export declare namespace Hash` with `Hash.Lib` first, then related detail types and sub-namespaces.
- `code/sys/crypto/src/m.Hash/m.Hash.ts` binds the runtime surface as `export const Hash: t.Hash.Lib`.

Apply the same contract pattern here: runtime public values stay unchanged; only the type spine moves from flat names to namespace-owned names.

Rejected alternatives:

- Do not add `FileLib`, `FileLibDefaults`, or `FileSizeLib` aliases. Current searches found no live callers outside the target module internals.
- Do not keep `LocalStorageImmutable` if the two downstream caller lanes are updated in this refactor.
- Do not rename runtime exports (`File`, `FileSize`, `LocalStorage`). This is a type-surface refactor, not a runtime API change.
- Do not move constants, implementations, or runtime helpers into `t.ts`.

## Current legacy flat names

`code/sys.ui/ui-dom/src/m.File/t.ts` currently exports:

- `FileLibDefaults`
- `FileLib`
- `FileSizeLib`

`code/sys.ui/ui-dom/src/m.LocalStorage/t.ts` currently exports:

- `LocalStorageLib`
- `LocalStorageImmutable<T>`
- `LocalStorage<T>`

## Target namespace shape

### File

Target root concept: `File`.

```ts
export declare namespace File {
  export type Lib = {
    readonly DEFAULTS: Defaults;
    readonly Size: Size.Lib;
    toBlob(data: Uint8Array, mimetype?: string): Blob;
    toUint8Array(input: Blob | BrowserFile): Promise<Uint8Array>;
    toFile(args: ToFileArgs): BrowserFile;
    fromFile(input: BrowserFile, opts?: FromFileOptions): Promise<t.BinaryFile>;
    fromBlob(input: Blob, opts?: FromBlobOptions): Promise<t.BinaryFile>;
    download(filename: string, data: Uint8Array | Blob, options?: DownloadOptions): Promise<void>;
    downloadUrl(url: string, filename: string): Promise<void>;
  };

  export type Defaults = {
    readonly mimetype: string;
  };

  export type ToFileArgs = {
    bytes: Uint8Array;
    name: string;
    type?: string;
    modifiedAt?: number;
  };

  export type FromFileOptions = {
    computeHash?: (bytes: Uint8Array) => string | Promise<string>;
  };

  export type FromBlobOptions = FromFileOptions & {
    name?: string;
    defaultType?: string;
    defaultModifiedAt?: number;
  };

  export type DownloadOptions = {
    mimetype?: string;
  };

  export namespace Size {
    export type Lib = {
      toString: t.FormatBytes;
    };
  }
}
```

Use a local type alias such as `type BrowserFile = globalThis.File;` before the namespace so `File` can be the root namespace without shadowing the DOM `File` instance type inside the namespace.

### LocalStorage

Target root concept: `LocalStorage`.

```ts
export declare namespace LocalStorage {
  export type Lib = {
    ns<T extends t.JsonMapLikeU>(prefix: string): Namespace<T>;
    immutable<T extends t.JsonMapLikeU>(key: string, initial: T): Immutable<T>;
  };

  export type Immutable<T extends t.JsonMapLikeU> = t.ImmutableRef<
    T,
    t.Rfc6902PatchOperation,
    t.ImmutableEvents<T, t.Rfc6902PatchOperation, t.ImmutableChange<T, t.Rfc6902PatchOperation>>
  > & {
    reset(initial?: T): void;
  };

  export type Namespace<T extends t.JsonMapLikeU> = {
    readonly namespace: string;
    get<K extends keyof T>(key: K, defaultValue: T[K]): T[K];
    put<K extends keyof T>(key: K, value: T[K]): T[K];
    delete<K extends keyof T>(key: K): void;
    clear(): void;
    object(initial: T): T;
  };
}
```

Prefer `Namespace<T>` over `LocalStorage<T>` inside the `LocalStorage` namespace to avoid `LocalStorage.LocalStorage<T>` stutter.

## Expected source changes

### `code/sys.ui/ui-dom/src/m.File/t.ts`

Replace flat exports with `export declare namespace File`. Put `Lib` first. Move defaults, method option details, and size helper contract under `File.*`.

Keep the file type-plane pure:

- type-only import from `./common.ts` remains allowed;
- no runtime constants;
- no runtime imports;
- no compatibility aliases.

### `code/sys.ui/ui-dom/src/m.File/common.ts`

Change `DEFAULTS` from `t.FileLibDefaults` to `t.File.Defaults`.

### `code/sys.ui/ui-dom/src/m.File/m.File.ts`

Change the runtime contract from `t.FileLib` to `t.File.Lib`.

No runtime behavior changes.

### `code/sys.ui/ui-dom/src/m.File/m.FileSize.ts`

Remove the direct `import type { FileSizeLib } from './t.ts'` lane.

Use the local common lane instead:

- import `type t` from `./common.ts` alongside `Str`;
- type the value as `t.File.Size.Lib`.

### `code/sys.ui/ui-dom/src/m.LocalStorage/t.ts`

Replace flat exports with `export declare namespace LocalStorage`. Put `Lib` first. Move immutable and namespace-wrapper contracts under `LocalStorage.*`.

Do not keep `LocalStorageImmutable` if downstream callers are migrated in this refactor.

### `code/sys.ui/ui-dom/src/m.LocalStorage/m.LocalStorage.ts`

Replace direct `LocalStorageLib` import from `./t.ts` with the package type lane:

- `import { type t } from '../common.ts';`
- `export const LocalStorage: t.LocalStorage.Lib = ...`.

### `code/sys.ui/ui-dom/src/m.LocalStorage/u.immutable.ts`

Update internal references:

- `t.LocalStorageImmutable<T>` → `t.LocalStorage.Immutable<T>`
- `t.LocalStorageImmutable<t.JsonMapLikeU>` → `t.LocalStorage.Immutable<t.JsonMapLikeU>`

### `code/sys.ui/ui-dom/src/m.LocalStorage/u.namespace.ts`

Update internal references:

- return type `t.LocalStorage<T>` → `t.LocalStorage.Namespace<T>`
- local object type `t.LocalStorage<T>` → `t.LocalStorage.Namespace<T>`

### `code/sys.ui/ui-react-components/src/common/t.ts`

Migrate the external type lane from the flat alias to the namespace:

- `LocalStorageImmutable` → `LocalStorage`

Keep `KeyboardModifierFlags` unchanged.

### `code/sys.ui/ui-react-components/src/ui/Media.Devices/use.DeviceSelection.Lifecycle.ts`

Update the concrete caller:

- `type Store = t.LocalStorageImmutable<Stored>;`
- to `type Store = t.LocalStorage.Immutable<Stored>;`

### `code/sys.driver/driver-automerge/src/common/t.ts`

Migrate the external type lane from the flat alias to the namespace:

- `LocalStorageImmutable` → `LocalStorage`

Keep `KeyboardModifierFlags` unchanged.

### `code/sys.driver/driver-automerge/src/ui/ui.DocumentId/use.LocalStorage.ts`

Update the concrete caller:

- `type StorageImmutable = t.LocalStorageImmutable<Storage>;`
- to `type StorageImmutable = t.LocalStorage.Immutable<Storage>;`

## Legacy alias disposition

Do not keep these aliases:

- `FileLibDefaults`
- `FileLib`
- `FileSizeLib`
- `LocalStorage<T>`
- `LocalStorageLib`
- `LocalStorageImmutable<T>`

Caller evidence for `LocalStorageImmutable<T>` exists in two external lanes, but the exact callers are listed above and should be migrated in this same refactor. Alias retention is justified only if one of those migrations is explicitly declared out of scope.

## Reference/import lanes to update

Internal `@sys/ui-dom` lanes:

- `t.FileLibDefaults` → `t.File.Defaults`
- `t.FileLib` → `t.File.Lib`
- direct `FileSizeLib` import → `t.File.Size.Lib`
- direct `LocalStorageLib` import → `t.LocalStorage.Lib`
- `t.LocalStorageImmutable<T>` → `t.LocalStorage.Immutable<T>`
- `t.LocalStorage<T>` → `t.LocalStorage.Namespace<T>`

External current caller lanes:

- `@sys/ui-dom/t` re-export consumers should import/export the `LocalStorage` namespace rather than `LocalStorageImmutable`.
- Concrete downstream type references should use `t.LocalStorage.Immutable<T>`.

## Verification

Run the nearest module task surfaces.

Primary module:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.ui/ui-dom && deno task check
cd /Users/phil/code/org.sys/sys/code/sys.ui/ui-dom && deno task test --trace-leaks ./src/m.File
cd /Users/phil/code/org.sys/sys/code/sys.ui/ui-dom && deno task test --trace-leaks ./src/m.LocalStorage
```

Downstream caller modules, because the plan migrates exact live callers instead of keeping an alias:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.ui/ui-react-components && deno task check
cd /Users/phil/code/org.sys/sys/code/sys.ui/ui-react-components && deno task test --trace-leaks ./src/ui/Media.Devices
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-automerge && deno task check
```

Optional final confidence pass if the narrow commands pass and time permits:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-automerge && deno task test --trace-leaks ./src/ui
```

## HOLD conditions

Hold before editing if any of these become true:

- downstream migration of `ui-react-components` or `driver-automerge` is declared out of scope;
- any additional live caller of `LocalStorageImmutable`, `FileLib`, `FileLibDefaults`, or `FileSizeLib` is found and cannot be migrated in the same clean refactor;
- `globalThis.File` is not accepted by the checker as the DOM file instance type after introducing the `File` namespace;
- a compatibility alias appears necessary for anything other than exact live caller evidence;
- any proposed edit would move runtime values into `t.ts` or change runtime public exports.

If a HOLD condition fires, stop and ask whether to split a dedicated compatibility-alias/removal pass.

## Final reality

Landed implementation commit:

- `371658cfc` `refactor(ui-dom): move file and local-storage types to namespace spines`

Actual changes:

- `code/sys.ui/ui-dom/src/m.File/t.ts` now exposes `File.Lib`, `File.Defaults`, method option detail types, and earned `File.Size.Lib`.
- `code/sys.ui/ui-dom/src/m.File/common.ts`, `m.File.ts`, and `m.FileSize.ts` now bind runtime contracts through `t.File.*`.
- `code/sys.ui/ui-dom/src/m.LocalStorage/t.ts` now exposes `LocalStorage.Lib`, `LocalStorage.Immutable<T>`, and `LocalStorage.Namespace<T>`.
- `code/sys.ui/ui-dom/src/m.LocalStorage/m.LocalStorage.ts`, `u.immutable.ts`, and `u.namespace.ts` now bind implementation types through `t.LocalStorage.*`.
- Downstream current callers in `ui-react-components` and `driver-automerge` were migrated from `LocalStorageImmutable<T>` to `LocalStorage.Immutable<T>`.
- No compatibility aliases were retained for `FileLibDefaults`, `FileLib`, `FileSizeLib`, `LocalStorageLib`, `LocalStorageImmutable<T>`, or `LocalStorage<T>`.

Final verification/proof:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.ui/ui-dom && deno task check
cd /Users/phil/code/org.sys/sys/code/sys.ui/ui-dom && deno task test --trace-leaks ./src/m.File
cd /Users/phil/code/org.sys/sys/code/sys.ui/ui-dom && deno task test --trace-leaks ./src/m.LocalStorage
cd /Users/phil/code/org.sys/sys/code/sys.ui/ui-react-components && deno task check
cd /Users/phil/code/org.sys/sys/code/sys.ui/ui-react-components && deno task test --trace-leaks ./src/ui/Media.Devices
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-automerge && deno task check
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-automerge && deno task test --trace-leaks ./src/ui
```

Final review result:

- SHIP for `.ts` code changes.
- Remaining risk: none found for code mechanics.
- Commit hygiene note: unrelated plan/prompt working-tree changes were intentionally excluded from the implementation commit.
