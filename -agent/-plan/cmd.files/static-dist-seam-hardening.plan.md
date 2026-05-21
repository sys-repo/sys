# Files static DistPkg seam hardening plan

## Status

Follow-on design plan. This is synergistic with the completed durable files/fs write-remove arc and
should be landed as a small boundary-hardening pass.

Prerequisites are now complete: writable `@sys/fs` bridge support and the WebSocket durable-write
proof have landed. No implementation has been landed from this static-dist seam plan yet.

## Relationship to durable files/fs write-remove work

The durable write/remove plan is about keeping the real filesystem bridge honest:

```text
@sys/model/files/fs
  consumes structural fs capabilities only

@sys/fs
  adapts real filesystem operations into those structural capabilities
```

This plan applies the same boundary discipline to frozen dist metadata:

```text
Pkg.Dist.compute/load/verify
  mints or verifies frozen distribution metadata

@sys/model/files/static
  consumes DistPkg through one static seam

files:manifest
  emits FilesManifest only
```

The two plans reinforce one invariant: the Files model is a bounded runtime grammar, not a place where
build-time filesystem/package concepts become ambient dependencies.

## BMIND premise

Do not start by making `FilesManifest` and `DistPkg` nominal enemies.

Start from the current shape:

- `FilesManifest` is a bounded Files-view projection.
- `DistPkg` is frozen distribution metadata.
- The shapes are currently different enough that structural assignability is not the live risk.
- The live risk is accidental coupling: someone reaches for dist/package machinery from a Files
  manifest handler because static dist manifests already exist nearby.

The right hardening is therefore not a speculative brand wall. It is a named seam plus a mechanical
rule that makes boundary drift loud.

## HARD TMIND review

Adversarial failure modes:

- A future `files:manifest` handler imports or references `DistPkg` and starts returning dist-shaped
  data because both concepts contain paths, hashes, and manifest-like nouns.
- A future contributor imports `Pkg.Dist` into `m.files` or `m.files.fs` because it is available from
  the model root `common.ts` helper pool.
- A dependency-graph test misses the violation because `DistPkg` comes through the global `t` type
  pool (`t.DistPkg`), not a direct import from `@sys/fs`.
- A dependency-graph test also misses `Pkg.Dist` if it is reached through `../common.ts`, because the
  root model `common/libs.ts` currently exports `Pkg` from `@sys/std/pkg`.
- A too-broad rule accidentally bans the legitimate static seam: `FilesStatic.fromDist` and its index
  builder need to consume canonical dist metadata.
- A too-weak rule only forbids `@sys/fs`, while the actual current static adapter uses `@sys/std/pkg`
  runtime guards/helpers (`Pkg.Is.dist`, `Pkg.Dist.Part.parse`).
- Branding the types now creates noise without proving the active failure mode. Worse, it may teach
  reviewers to trust a nominal type barrier while the real import/coupling boundary still drifts.

Conclusion: the hardening must be source/seam-aware, not just type-shape-aware and not only import-graph-aware.

## Current code reality to respect

- `FilesManifest` is defined at `code/sys.model/model/src/m.files/t/t.manifest.ts`.
- `files:manifest` returns `FilesManifest.Manifest` through the Files Cmd grammar.
- `m.files.fs` and `m.files.memory` manifest handlers already emit normal Files manifests.
- `m.files.static` is the only production Files adapter that should consume `DistPkg`.
- `m.files.static` currently imports `Pkg` through the model common lane and uses `@sys/std/pkg`
  semantics, not `@sys/fs/pkg`.
- `@sys/model` boundary tests already forbid runtime imports from `@sys/fs` in core/static/fs Files
  areas. Keep those tests.
- `t.DistPkg` is globally reachable through the `@sys/types` pool, so import-graph checks alone do
  not prove the seam.

## Target invariant

`DistPkg` may enter the Files world only through the static dist seam.

More explicitly:

- `Files.Manifest` describes a bounded runtime Files view.
- `DistPkg` describes a frozen distribution package/hash tree minted or verified outside the model layer.
- `FilesStatic.fromDist(...)` is the only production Files seam that accepts dist metadata.
- Static dist metadata is translated into ordinary Files entries and content refs before any Files
  command result is emitted.
- `files:manifest` must never emit `DistPkg`, import dist package machinery, or expose build/package
  metadata as the manifest contract.
- `m.files` and `m.files.fs` must remain dist-unaware.
- `m.files.fs` must remain model-only and must not import `@sys/fs`.

## Implementation spine

### 1. Add a seam note where the types are first encountered

Small JSDoc, no doctrine dump:

- On `FilesManifest.Manifest`: name it as the bounded runtime Files-view manifest and point at the
  static seam for frozen dist input.
- On `FilesStatic.FromDistOptions.dist`: name `FilesStatic.fromDist` as the only production Files
  seam that accepts `DistPkg`.
- Optional, if touching `@sys/types`: on `DistPkg`, name it as frozen distribution metadata and not
  a Files manifest.

Do not add branding in this step.

### 2. Add a source-level seam test

Add a test that scans production `src/m.files*` files and forbids dist coupling outside an explicit
allowlist.

Allowlist should be narrow:

- `src/m.files.static/t.ts` may name `t.DistPkg` in `FromDistOptions`.
- `src/m.files.static/m.fromDist.ts` may remain part of the named seam, even if it does not directly
  reference `DistPkg` today.
- `src/m.files.static/u/u.index.ts` may use dist validation and part parsing while translating to
  Files entries/content refs.

Candidate forbidden production tokens:

- `DistPkg`
- `Pkg.Dist`
- `Pkg.Is.dist`
- `dist.hash.parts`
- `PkgDist`
- `@sys/fs/pkg`

Test fixtures may construct `t.DistPkg` values, but production command handlers should not.
If tests need coverage for fixture leakage, keep that as a separate test assertion so the production
boundary remains easy to read.

### 3. Keep and sharpen graph-boundary tests

Do not replace existing runtime graph tests. They prove different things:

- `m.files` stays free of host IO, server layers, and concrete adapters.
- `m.files.fs` stays structural and does not import `@sys/fs`.
- `m.files.static` stays free of `@sys/fs` and sibling Files adapters.

The new seam test covers what graph tests cannot see: globally reachable `t.DistPkg` and common-lane
`Pkg` usage.

### 4. Consider narrowing the model common helper pool only if the seam test exposes friction

Today `src/common/libs.ts` exports `Pkg` globally for the whole model package.

Preferred minimum move: keep the helper pool stable and let the seam test enforce usage.

Stronger move, only if earned:

- remove `Pkg` from root `src/common/libs.ts`
- expose `Pkg` only from `src/m.files.static/common.ts`
- update static files to import through that local common lane

Do not take the stronger move just for aesthetic purity. It has broader blast radius and should be
justified by actual coupling pressure.

### 5. Add a canon/truth note after the test proves the invariant

Potential canon wording:

```text
Files.Manifest is a bounded runtime Files-view manifest. DistPkg is frozen distribution metadata
minted or verified outside the model layer. DistPkg may enter Files only through
FilesStatic.fromDist, where it is translated into ordinary Files entries/content refs. files:manifest
must never emit DistPkg or import dist/package machinery.
```

Preferred placement is a truth-locked canon or module-level doctrine file, not only this plan.
Do not update canon before implementation/test reality matches it.

## Acceptance

- Existing Files boundary tests remain green.
- A new seam test fails if any production `m.files` or `m.files.fs` source references `DistPkg`,
  `Pkg.Dist`, or other dist-coupling tokens.
- The seam test allows only the named static dist seam files.
- `files:manifest` result type remains `FilesManifest.Manifest`.
- Static `fromDist` still accepts canonical `t.DistPkg` and translates it into Files entries/content refs.
- No `@sys/fs` import is introduced into `@sys/model` Files runtime code.
- No nominal branding is introduced unless the shapes start converging enough to become structurally
  assignable in a realistic call path.

## Non-goals

- Do not add static write/remove.
- Do not import `@sys/fs` into `@sys/model`.
- Do not replace `FilesManifest` with `DistPkg` for `files:manifest`.
- Do not make `Pkg.Dist.compute/load/verify` available from model Files handlers.
- Do not introduce a broad root compatibility alias or generalized dist-to-files factory.
- Do not brand `FilesManifest` or `DistPkg` in this pass.
- Do not convert this boundary hardening into a larger static adapter refactor unless a test failure
  proves the need.

## Branding flip condition

Branding becomes justified only if the two types begin to converge structurally in a way that makes a
real mistaken assignment plausible.

Examples that would flip the decision:

- `FilesManifest` grows a top-level hash tree and build/provenance metadata.
- `DistPkg` grows command/runtime capability fields and cursor/paging semantics.
- A compile-time or runtime path can accidentally pass one into the other without obvious shape failure.

Until then, the seam/test boundary is the right hardening: it addresses the active coupling risk
without adding speculative type noise.

## Suggested commit shape

```text
feat(model): confine DistPkg Files coupling to static seam

- add a production source-boundary test for DistPkg/Pkg.Dist references
- document FilesManifest vs DistPkg at the type seam
- keep files:manifest outputs on the bounded FilesManifest contract
```
