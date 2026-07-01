# Obj type namespace tidy plan

## Commit list

- [ ] `refactor(std): tidy Obj type namespace`

## Status

Draft plan. This is intentionally separate from `fix(std): remove internal R facade usage`.

## Position

`code/sys/std/src/m.Obj/t.ts` has older loose top-level type re-exports for subordinate Obj concepts such as lens,
path codec, curried path, path diff, and path relation types.

This is workable, but it does not match the modern type-plane shape as well as it should. The public Obj contract
should be scanable through the `Obj` namespace first, with subordinate concepts grouped under `Obj.Path`, `Obj.Lens`,
and related nested namespaces.

Do not fold this into the Ramda/R cleanup. That commit should stay focused on removing internal `R` facade usage.

## Current smell

Examples of the current loose public type surface:

```ts
export type {
  ObjLens,
  ObjLensRef,
  ReadonlyObjLens,
  ReadonlyObjLensRef,
} from '../m.Obj.Lens/t.lens.ts';

export type { ObjPathCodec, ObjPathCodecKind } from '../m.Obj.Path/t.codec.ts';
export type { ObjDiffOp, ObjDiffOptions, ObjDiffReport } from '../m.Obj.Path/t.diff.ts';
export type { PathRelation } from '../m.Obj.Path/t.rel.ts';
```

Concerns:

- subordinate/detail Obj types are flattened into the root type pool;
- `Obj.Path.*`, `Obj.Lens.*`, and root `Obj.*` concepts are mixed at the same level;
- `Obj.Lib` is not the first member of the public `Obj` namespace;
- the type spine is harder to audit against the modern type-plane canon.

## Desired shape

Prefer a curated namespace spine such as:

```ts
export declare namespace Obj {
  export type Lib = { /* runtime contract */ };

  export namespace Lens {
    export type Lib = TLens.Lib;
    export type ObjLens = TLens.ObjLens;
    export type ObjLensRef = TLens.ObjLensRef;
  }

  export namespace Path {
    export type Lib = TPath.Lib;

    export namespace Codec {
      export type Lib = TPathCodec.Lib;
      export type ObjPathCodec = TPathCodec.ObjPathCodec;
    }

    export namespace Rel {
      export type Lib = TPathRel.Lib;
      export type PathRelation = TPathRel.PathRelation;
    }
  }
}
```

Exact names should be chosen after reading current consumers.

## Migration rules

- Read all current consumers before editing exported type names.
- Preserve public compatibility unless deliberately choosing a breaking change.
- Prefer introducing nested names first, then migrating internal consumers, then retiring loose aliases if safe.
- Avoid broad churn in packages unrelated to Obj type consumption.
- Keep runtime imports untouched unless a type-only import can be safely removed.
- Keep `t.ts` type-plane pure.

## Candidate execution phases

### Phase 1: audit consumers

Find usage of loose Obj type names, especially:

```txt
ObjLens
ObjLensRef
ReadonlyObjLens
ReadonlyObjLensRef
LensToObjectOptions
UnwrapLenses
ObjPathCodec
ObjPathCodecKind
ObjPathDecodeOptions
ObjPathEncodeOptions
CurriedPath
ObjDiffOp
ObjDiffOptions
ObjDiffReport
ObjPathFix
ObjPathSanitizeOptions
PathTryDecodeOptions
PathTryDecodeResult
PathRelation
```

Classify as:

- internal `@sys/std` usage;
- active external package usage;
- tests only;
- archived/out-of-scope usage.

### Phase 2: add nested namespace aliases

Add nested aliases under the public `Obj` namespace while keeping loose top-level aliases temporarily.

Acceptance:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/std
deno task check
```

### Phase 3: migrate maintained consumers

Move maintained callsites to nested `t.Obj.*` names where that improves clarity.

Acceptance:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/std
deno task check
```

Run targeted checks for any packages touched outside `@sys/std`.

### Phase 4: decide whether loose aliases stay or retire

If loose aliases are public compatibility surface, keep them with clear comments until a breaking-release window.
If they are not used or are internal-only, retire them in the same refactor.

## Acceptance

- `Obj.Lib` is first in the `Obj` namespace.
- Subordinate Obj concepts are discoverable under `Obj.Path`, `Obj.Lens`, etc.
- No runtime graph changes are introduced by type-only cleanup.
- Public compatibility decision is explicit.
- Tests/checks pass for `@sys/std` and any touched consumer packages.

Commit shape:

```txt
refactor(std): tidy Obj type namespace
```
