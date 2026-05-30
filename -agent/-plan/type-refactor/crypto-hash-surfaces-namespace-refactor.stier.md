# @sys/crypto hash surfaces namespace refactor

- [x] 0cb2eeee5 refactor(crypto): align hash type surfaces with namespace spine

## Scope

Package: `@sys/crypto`.

Target type spines:

- `code/sys/crypto/src/m.Hash/t.ts`
- `code/sys/crypto/src/m.Hash.Composite/t.ts`
- `code/sys/crypto/src/m.Fmt/t.ts`

Runtime surfaces that must remain stable:

- `Hash`, `sha1`, `sha256` from `code/sys/crypto/src/m.Hash/mod.ts`
- `CompositeHash`, `FileHashUri` from `code/sys/crypto/src/m.Hash.Composite/mod.ts`
- `HashFmt` from `code/sys/crypto/src/m.Fmt/mod.ts`

Non-goals:

- do not change hashing, digest, URI, verify, or formatting behavior;
- do not move runtime values into `t.ts` or `t.*.ts`;
- do not remove legacy flat aliases in this refactor;
- do not tighten `Hash.ToHash` from `any` to `unknown` without explicit approval;
- do not refactor `@sys/types` foundational data shapes such as `t.CompositeHash`, `t.HashInput`, or `t.StringFileHashUri`.

## XHIGH review result

The probe direction is correct: these three crypto type spines are legacy flat `XxxLib` surfaces and should move to the canonical namespace spine where the runtime noun owns `Lib` first.

Refinements from the XHIGH pass:

- `Hash.Is` is an earned sub-namespace; the current `t.Is.ts` split is transitional residue once `Hash.Is.Lib` exists in `m.Hash/t.ts`.
- `Hash.shorten` has enough owned detail to merit `Hash.Shorten.Options` and `Hash.Shorten.OptionsInput`; this avoids continuing `Parameters<t.HashLib['shorten']>[2]` in implementation helpers.
- `CompositeHash.Verify` is an earned sub-namespace because verify owns options, loader, loader args, and response.
- `CompositeHash` must also export a root type alias to `@sys/types`' foundational composite-hash data shape so the local `CompositeHash` namespace can merge with the data noun without widening runtime behavior.
- `CompositeHash.Builder` can be both the builder object type and the owner of builder option types, following the same type/namespace merge pattern used by modern modules.
- `FileHashUri` should be a separate root namespace because `FileHashUri` is an exported runtime value, not just a detail of `CompositeHash`.
- `HashFmt.digest` should name its anonymous options object as `HashFmt.DigestOptions`.
- Preserve the legacy `Hash.ToHash` input as `any` for compatibility. Tightening it to `unknown` would reject narrower caller functions under strict function parameter checking and is outside this non-breaking refactor.

Modern comparison references read before this plan:

- `code/sys/fs/src/m.FileMap/t.ts` — namespace-first surface with `FileMap.Lib` first, earned sub-namespaces, and a root data type sharing the namespace name.
- `code/sys/fs/src/m.Dir/t.ts` — compact namespace-first parent contract with nested operation namespaces.

The plan is rejected unless the implementation keeps `t.ts` / `t.*.ts` type-plane pure: `export declare namespace`, `export type`, and type-only imports only.

## Current legacy flat names

`code/sys/crypto/src/m.Hash/t.ts` and `t.Is.ts` currently expose:

- `HashLib`
- `HashIsLib`
- `ToHash`
- `HashOptions`
- `ShortenHashOptions`

`code/sys/crypto/src/m.Hash.Composite/t.ts` currently exposes:

- `HashAlgoInput`
- `CompositeHashLib`
- `CompositeHashBuilderOptionsInput`
- `CompositeHashDigestOptionsInput`
- `CompositeHashVerifyArgsInput`
- `CompositeHashVerifyOptions`
- `HashVerifyLoader`
- `HashVerifyLoaderArgs`
- `HashVerifyResponse`
- `CompositeHashBuildOptions`
- `CompositeHashBuilder`
- `FileHashUriLib`
- `FileHashUriParts`

`code/sys/crypto/src/m.Fmt/t.ts` currently exposes:

- `HashFmtLib`

## Target namespace shape

### `m.Hash/t.ts`

```ts
export declare namespace Hash {
  export type Lib = {
    readonly Is: Is.Lib;
    sha1(input: unknown, options?: Options): string;
    sha256(input: unknown, options?: Options): string;
    toBytes(input: unknown, options?: Options): Uint8Array;
    toHex(bytes: Uint8Array): string;
    shorten(hash: string, length: number | [number, number], options?: Shorten.OptionsInput): string;
    toString(input?: t.HashInput): string;
    prefix(input?: t.StringHash): string;
  };

  export type ToHash = (input: any) => string;
  export type Options = {
    asString?: (input?: unknown) => string;
    prefix?: boolean;
  };

  export namespace Shorten {
    export type Options = {
      trimPrefix?: boolean | string | string[];
      divider?: string;
    };
    export type OptionsInput = Options | boolean;
  }

  export namespace Is {
    export type Lib = {
      composite(input: unknown): input is t.CompositeHash;
      compositeBuilder(input: unknown): input is t.CompositeHash.Builder;
      empty(input: t.HashInput): boolean;
    };
  }
}
```

Compatibility aliases stay at the bottom of `m.Hash/t.ts`.

### `m.Hash.Composite/t.ts`

```ts
import type * as TSys from '@sys/types';

export type CompositeHash = TSys.CompositeHash;

export declare namespace CompositeHash {
  export type Lib = {
    readonly Uri: { readonly File: FileHashUri.Lib };
    builder(options?: Builder.OptionsInput): Builder;
    digest(parts: t.CompositeHash['parts'], options?: Digest.OptionsInput): t.StringHash;
    verify(hash: t.CompositeHash, args: Verify.ArgsInput): Promise<Verify.Response>;
    toComposite(input?: t.CompositeHash | Builder): t.CompositeHash;
    size(
      parts: t.CompositeHashParts,
      filter?: (e: { path: string; uri: FileHashUri.Parts }) => boolean,
    ): t.NumberBytes | undefined;
  };

  export type AlgoInput = 'sha256' | 'sha1' | t.Hash.ToHash;

  export type Builder = t.CompositeHash & {
    readonly length: number;
    readonly algo: AlgoInput;
    add(key: string, value: unknown): Builder;
    remove(key: string): Builder;
    toObject(): t.CompositeHash;
    toString(): string;
  };

  export namespace Builder {
    export type Options = {
      algo?: AlgoInput;
      initial?: { key: string; value: unknown }[];
    };
    export type OptionsInput = Options | Options['algo'] | Options['initial'];
  }

  export namespace Digest {
    export type OptionsInput = Builder.Options;
  }

  export namespace Verify {
    export type ArgsInput = Options | Loader;
    export type Options = { algo?: AlgoInput; loader: Loader };
    export type Loader = (e: LoaderArgs) => Promise<Uint8Array | undefined | void>;
    export type LoaderArgs = { part: string };
    export type Response = {
      is: { valid?: boolean };
      hash: { a: t.CompositeHash; b: t.CompositeHash };
      error?: t.StdError;
    };
  }
}

export declare namespace FileHashUri {
  export type Lib = {
    toUri(hash: string, bytes?: number): t.StringFileHashUri;
    fromUri(input: string): Parts;
  };

  export type Parts = {
    hash: t.StringHash;
    bytes?: number;
  };
}
```

Compatibility aliases stay at the bottom of `m.Hash.Composite/t.ts`.

### `m.Fmt/t.ts`

```ts
export declare namespace HashFmt {
  export type Lib = {
    digest(input?: t.HashInput, options?: DigestOptions): string;
  };

  export type DigestOptions = {
    length?: number;
    algo?: boolean;
  };
}
```

Compatibility alias `HashFmtLib = HashFmt.Lib` stays at the bottom.

## Compatibility alias policy

Keep and mark deprecated, but do not remove:

- `HashLib = Hash.Lib`
- `HashIsLib = Hash.Is.Lib`
- `ToHash = Hash.ToHash`
- `HashOptions = Hash.Options`
- `ShortenHashOptions = Hash.Shorten.Options`
- `HashAlgoInput = CompositeHash.AlgoInput`
- `CompositeHashLib = CompositeHash.Lib`
- `CompositeHashBuilderOptionsInput = CompositeHash.Builder.OptionsInput`
- `CompositeHashDigestOptionsInput = CompositeHash.Digest.OptionsInput`
- `CompositeHashVerifyArgsInput = CompositeHash.Verify.ArgsInput`
- `CompositeHashVerifyOptions = CompositeHash.Verify.Options`
- `HashVerifyLoader = CompositeHash.Verify.Loader`
- `HashVerifyLoaderArgs = CompositeHash.Verify.LoaderArgs`
- `HashVerifyResponse = CompositeHash.Verify.Response`
- `CompositeHashBuildOptions = CompositeHash.Builder.Options`
- `CompositeHashBuilder = CompositeHash.Builder`
- `FileHashUriLib = FileHashUri.Lib`
- `FileHashUriParts = FileHashUri.Parts`
- `HashFmtLib = HashFmt.Lib`

Remove no compatibility alias in the implementation commit. Alias removal is a later breaking-change decision and needs explicit approval.

## Source files expected to change

### Type spines

- `code/sys/crypto/src/m.Hash/t.ts`
  - Replace flat root aliases with `export declare namespace Hash`.
  - Move `Hash.Is.Lib` into this root spine.
  - Add compatibility aliases at the bottom.

- `code/sys/crypto/src/m.Hash/t.Is.ts`
  - Retire after merging `Hash.Is.Lib` into `m.Hash/t.ts`.
  - No public alias is removed; only the obsolete factor file goes away.

- `code/sys/crypto/src/m.Hash.Composite/t.ts`
  - Replace flat root aliases with `CompositeHash`, `CompositeHash.Verify`, `CompositeHash.Builder`, `CompositeHash.Digest`, and `FileHashUri` namespaces.
  - Export root `CompositeHash = TSys.CompositeHash` so the namespace merges with the existing data noun.
  - Add compatibility aliases at the bottom.

- `code/sys/crypto/src/m.Fmt/t.ts`
  - Replace `HashFmtLib` flat root with `HashFmt.Lib` and `HashFmt.DigestOptions`.
  - Add compatibility alias at the bottom.

- `code/sys/crypto/src/types.ts`
  - Reorder type exports only if needed for scanability or type resolution.
  - No runtime export and no generated dependency edit.

- `code/sys/crypto/src/common/t.ts`
  - Explicitly re-export local `CompositeHash` from `../types.ts` before the package type-star export if TypeScript reports ambiguity with `@sys/types`.
  - This preserves `t.CompositeHash` as the foundational data type while adding `t.CompositeHash.*` namespace contracts.

### Hash implementation references

- `code/sys/crypto/src/m.Hash/m.Hash.ts`
  - Replace direct `HashLib` import with local `type t` lane.
  - Type runtime object as `t.Hash.Lib`.

- `code/sys/crypto/src/m.Hash/m.Is.ts`
  - Replace direct `HashIsLib` import with local `type t` lane.
  - Type runtime object as `t.Hash.Is.Lib`.
  - Prefer `unknown` for implementation input parameters where the public contract already says `unknown`.

- `code/sys/crypto/src/m.Hash/u.hash.ts`
  - Replace `t.HashLib[...]` member typing with `t.Hash.Lib[...]`.

- `code/sys/crypto/src/m.Hash/u.shorten.ts`
  - Replace `t.HashLib[...]` with `t.Hash.Lib[...]`.
  - Replace `Parameters<t.HashLib['shorten']>[2]` with `t.Hash.Shorten.OptionsInput`.
  - Replace `t.ShortenHashOptions` with `t.Hash.Shorten.Options`.

### Composite hash implementation references

- `code/sys/crypto/src/m.Hash.Composite/m.CompositeHash.ts`
  - Replace direct `CompositeHashLib` import with local `type t` lane.
  - Type runtime object as `t.CompositeHash.Lib`.

- `code/sys/crypto/src/m.Hash.Composite/m.Uri.ts`
  - Replace direct `FileHashUriLib` import with local `type t` lane.
  - Type runtime object as `t.FileHashUri.Lib`.

- `code/sys/crypto/src/m.Hash.Composite/u.builder.ts`
  - Replace `t.CompositeHashLib['builder']` with `t.CompositeHash.Lib['builder']`.
  - Replace `t.CompositeHashBuilder` with `t.CompositeHash.Builder`.
  - Replace builder option aliases with `t.CompositeHash.Builder.OptionsInput` and `t.CompositeHash.Builder.Options`.

- `code/sys/crypto/src/m.Hash.Composite/u.digest.ts`
  - Replace `t.CompositeHashLib['digest']` with `t.CompositeHash.Lib['digest']`.

- `code/sys/crypto/src/m.Hash.Composite/u.size.ts`
  - Replace `t.CompositeHashLib['size']` with `t.CompositeHash.Lib['size']`.

- `code/sys/crypto/src/m.Hash.Composite/u.toComposite.ts`
  - Replace `t.CompositeHashLib['toComposite']` with `t.CompositeHash.Lib['toComposite']`.

- `code/sys/crypto/src/m.Hash.Composite/u.verify.ts`
  - Replace `t.CompositeHashLib['verify']` with `t.CompositeHash.Lib['verify']`.
  - Replace `t.HashVerifyResponse` with `t.CompositeHash.Verify.Response`.
  - Replace verify arg/option aliases with `t.CompositeHash.Verify.ArgsInput` and `t.CompositeHash.Verify.Options`.

- `code/sys/crypto/src/m.Hash.Composite/u.wrangle.ts`
  - Replace `t.HashAlgoInput` with `t.CompositeHash.AlgoInput`.

- `code/sys/crypto/src/m.Hash.Composite/-.test.ts`
  - Replace `t.HashAlgoInput` with `t.CompositeHash.AlgoInput`.
  - Do not change behavior assertions.

### Hash format implementation references

- `code/sys/crypto/src/m.Fmt/m.HashFmt.ts`
  - Replace direct `HashFmtLib` import with local `type t` lane.
  - Type runtime object as `t.HashFmt.Lib`.

## Expected unchanged files

- `code/sys/crypto/src/m.Hash/mod.ts`
- `code/sys/crypto/src/m.Hash.Composite/mod.ts`
- `code/sys/crypto/src/m.Fmt/mod.ts`
- `code/sys/crypto/src/common.ts`
- `code/sys/crypto/src/common/mod.ts`
- `code/sys/crypto/src/common/libs.ts`

`code/sys/crypto/src/common/t.ts` may change only to resolve the intentional local `CompositeHash` type+namespace merge against the broader `@sys/types` export.

## Outside-reference lanes

Search evidence before implementation found legacy names in:

- `code/sys/crypto/src/m.Hash/**`
- `code/sys/crypto/src/m.Hash.Composite/**`
- `code/sys/crypto/src/m.Fmt/**`
- `code/sys/fs/src/common/t.ts`
- `code/sys/fs/src/m.Dir/t.ts`
- `code/sys/fs/src/m.Dir.Hash/u.verify.ts`
- `code/sys/fs/src/m.Pkg/t.ts`

Downstream `@sys/fs` should not require edits in this refactor because the legacy `HashFmtLib` and `HashVerifyResponse` aliases stay public. Do not update `@sys/fs` to `t.CompositeHash.Verify.Response` in this pass: its local type pool already exports the foundational `t.CompositeHash` data type from `@sys/types`, so importing the crypto `CompositeHash` namespace there is a broader type-pool design question.

## Implementation sequence

1. Rewrite `m.Hash/t.ts` into `Hash` namespace form, merge `Hash.Is.Lib`, and keep all legacy hash aliases.
2. Update hash implementation files to the local `t.Hash.*` lane.
3. Remove the retired `m.Hash/t.Is.ts` file after all references are gone.
4. Rewrite `m.Hash.Composite/t.ts` into `CompositeHash` and `FileHashUri` namespace form with compatibility aliases.
5. If needed, resolve the local `CompositeHash` type-pool merge in `common/t.ts` with an explicit local re-export.
6. Update composite-hash implementation files and tests to `t.CompositeHash.*` and `t.FileHashUri.*` names.
7. Rewrite `m.Fmt/t.ts` into `HashFmt` namespace form with compatibility alias.
8. Update `m.Fmt/m.HashFmt.ts` to `t.HashFmt.Lib`.
9. Run the verification commands below and perform a residue search for old internal references.

## HOLD conditions

HOLD and ask before continuing if any of these occur:

- `deno task check` reports that `t.CompositeHash` cannot carry both the foundational data type and the crypto namespace through `code/sys/crypto/src/common/t.ts` after adding the explicit local `CompositeHash` re-export.
- Any implementation path requires removing a compatibility alias listed above.
- Any downstream package must be edited because aliases no longer resolve.
- The refactor appears to require changing runtime exports, digest behavior, URI formatting, or verify semantics.
- The refactor appears to require tightening `Hash.ToHash` from `any` to `unknown`.

## Verification

Run from the nearest module task surfaces.

Primary package:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/crypto && deno task check
cd /Users/phil/code/org.sys/sys/code/sys/crypto && deno task test --trace-leaks ./src/m.Hash/-.test.ts
cd /Users/phil/code/org.sys/sys/code/sys/crypto && deno task test --trace-leaks ./src/m.Hash.Composite/-.test.ts
cd /Users/phil/code/org.sys/sys/code/sys/crypto && deno task test --trace-leaks ./src
```

Downstream alias consumer smoke check:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/fs && deno task check
```

Residue search after edits:

```sh
rg -n "\b(HashLib|HashIsLib|CompositeHashLib|HashFmtLib|FileHashUriLib|CompositeHashBuilderOptionsInput|CompositeHashBuildOptions|CompositeHashVerifyArgsInput|HashVerifyLoader|HashVerifyResponse|HashAlgoInput|ShortenHashOptions|HashOptions)\b" /Users/phil/code/org.sys/sys/code/sys/crypto/src /Users/phil/code/org.sys/sys/code/sys/fs/src
```

Expected residue after the implementation:

- compatibility alias declarations in the target crypto `t.ts` files;
- downstream `@sys/fs` references that intentionally rely on kept aliases.

## Final reality

Landed implementation commit:

- `0cb2eeee5 refactor(crypto): align hash type surfaces with namespace spine`

Actual changes:

- Converted `Hash`, `CompositeHash`, `FileHashUri`, and `HashFmt` type surfaces to namespace-first `Lib` contracts.
- Merged the former `m.Hash/t.Is.ts` predicate contract into `Hash.Is.Lib` and removed `m.Hash/t.Is.ts`.
- Added `CompositeHash` as a type+namespace merge over the foundational `@sys/types` composite hash data shape.
- Updated crypto implementation files to use canonical local `type t` namespace references.
- Migrated downstream `@sys/fs` type consumers from legacy flat names to `t.HashFmt.Lib` and `t.CompositeHash.Verify.Response['is']`.
- Removed the legacy flat compatibility alias declarations rather than preserving them.
- Preserved runtime exports and hash/composite/format behavior.

Final verification:

```sh
deno fmt --check /Users/phil/code/org.sys/sys/code/sys/crypto/src/m.Hash/t.ts /Users/phil/code/org.sys/sys/code/sys/crypto/src/m.Hash/m.Hash.ts /Users/phil/code/org.sys/sys/code/sys/crypto/src/m.Hash/m.Is.ts /Users/phil/code/org.sys/sys/code/sys/crypto/src/m.Hash/u.hash.ts /Users/phil/code/org.sys/sys/code/sys/crypto/src/m.Hash/u.shorten.ts /Users/phil/code/org.sys/sys/code/sys/crypto/src/m.Hash.Composite/t.ts /Users/phil/code/org.sys/sys/code/sys/crypto/src/m.Hash.Composite/m.CompositeHash.ts /Users/phil/code/org.sys/sys/code/sys/crypto/src/m.Hash.Composite/m.Uri.ts /Users/phil/code/org.sys/sys/code/sys/crypto/src/m.Hash.Composite/u.builder.ts /Users/phil/code/org.sys/sys/code/sys/crypto/src/m.Hash.Composite/u.digest.ts /Users/phil/code/org.sys/sys/code/sys/crypto/src/m.Hash.Composite/u.size.ts /Users/phil/code/org.sys/sys/code/sys/crypto/src/m.Hash.Composite/u.toComposite.ts /Users/phil/code/org.sys/sys/code/sys/crypto/src/m.Hash.Composite/u.verify.ts /Users/phil/code/org.sys/sys/code/sys/crypto/src/m.Hash.Composite/u.wrangle.ts /Users/phil/code/org.sys/sys/code/sys/crypto/src/m.Hash.Composite/-.test.ts /Users/phil/code/org.sys/sys/code/sys/crypto/src/m.Fmt/t.ts /Users/phil/code/org.sys/sys/code/sys/crypto/src/m.Fmt/m.HashFmt.ts /Users/phil/code/org.sys/sys/code/sys/crypto/src/common/t.ts /Users/phil/code/org.sys/sys/code/sys/fs/src/common/t.ts /Users/phil/code/org.sys/sys/code/sys/fs/src/m.Dir/t.ts /Users/phil/code/org.sys/sys/code/sys/fs/src/m.Dir.Hash/u.verify.ts /Users/phil/code/org.sys/sys/code/sys/fs/src/m.Pkg/t.ts
cd /Users/phil/code/org.sys/sys/code/sys/crypto && deno task check
cd /Users/phil/code/org.sys/sys/code/sys/crypto && deno task test --trace-leaks ./src
cd /Users/phil/code/org.sys/sys/code/sys/fs && deno task check
rg -n "@deprecated|\\b(HashLib|HashIsLib|HashOptions|ShortenHashOptions|HashAlgoInput|CompositeHashLib|CompositeHashBuilderOptionsInput|CompositeHashDigestOptionsInput|CompositeHashVerifyArgsInput|CompositeHashVerifyOptions|HashVerifyLoader|HashVerifyLoaderArgs|HashVerifyResponse|CompositeHashBuildOptions|CompositeHashBuilder|FileHashUriLib|FileHashUriParts|HashFmtLib)\\b" /Users/phil/code/org.sys/sys/code/sys/crypto/src /Users/phil/code/org.sys/sys/code/sys/fs/src
```

Final review result:

- SHIP.
- Remaining risk: none found.
