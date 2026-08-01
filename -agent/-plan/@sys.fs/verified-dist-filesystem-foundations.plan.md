verified-dist-filesystem-foundations.plan.md
- [x] 2af88fca9 fix(std): strictly parse Dist part metadata
- [x] b1a2e7d9a feat(fs): add root-confined no-clobber writes
- [x] dbbf98435 feat(fs): verify pinned strict Dist generations
- [x] b8e41c39f refactor(fs): group Rooted utilities
- [x] dd9dd8cdb refactor(fs): group pinned verification utilities
- [x] ef9765a09 refactor(fs): group package logging utilities
- [x] cd4fff701 fix(fs): reject untrustworthy Rooted identities
- [x] 7df5daf5b fix(fs): enforce pinned entry limits before part admission
- [x] REVIEW: rerun the MAX BMIND closing security review
- [x] 752d66c8e docs(jsr): complete quality docs for registry and runtime packages
- [x] f71ca51ea test(fs): prove Rooted empty-target preservation
- [x] 690b06bdd fix(fs): bound pinned ignore matching and preserve failure truth
- [x] 0707f1c35 fix(std): safely reject partial Dist shapes
- [x] REVIEW: rerun MAX closure over the external-audit corrections
- [x] EXTERNAL REVIEW: complete adjudication of the blind Opus audit

This file is the sole source of truth for this prerequisite commit arc.

Status: **COMPLETE — GO.** The original foundation passed internal MAX BMIND review at
`7df5daf5b`. A blind external Opus audit then produced two confirmed required corrections plus
bounded advisory polish. The public contract portions landed within cross-cutting documentation
commit `752d66c8e`; the remaining proof and runtime corrections landed as `f71ca51ea`, `690b06bdd`,
and `0707f1c35`. Every external finding was independently reproduced or rejected with documented
rationale, all accepted work landed and validated, and final MAX code/security closure found no
remaining required correction within the documented threat boundary.

Only the two exact filesystem contract paths from broad documentation commit `752d66c8e` belong to
this scoped correction tail; its other files remain outside this audit scope. The downstream hosting
handoff is corrected in `local-dist-host.plan.md` and remains annexed to that plan's eventual
landing; it is not a standalone commit in this filesystem arc.

Retirement: this prerequisite plan is closed and historical. Do not append materialization or hosting
implementation here. Continue with `../@sys.server/verified-dist-materialization.plan.md`; retain the
local-host authority handoff in `../@sys.server/local-dist-host.plan.md` for its later server landing.

Commit three previously passed its bounded MAX architecture review and exact public-contract/file/
red-test latch, then completed XHIGH red → green implementation and hard TMIND/DMIND/BMIND
correction without changing the public API shape. The final MAX/TMIND/STIER review corrected the
remaining bounded residue: all post-observation path transitions report `changed`; authenticated
manifest identity precedes generic tree classification; stable identity/timestamp metadata requires
safe numeric values; evidence freezing is iterative; the ignored-file and ancestor-symlink proofs
are genuine; and public JSDoc carries limits, result meanings, and the observed-state threat
boundary. The closing MAX pass replaced duplicate local comparators with
`Str.Compare.codeUnit()`, centralized verifier-private numeric/byte-limit policy, added direct
legacy, invalid-ignore-digest, ignored-declared-part, unsafe-arithmetic, and special-entry proofs,
and made injected-IO path probes platform-canonical. The focused verifier suite passed 32 steps;
complete `m.Pkg` passed 70 steps; Rooted passed 43 steps; `@sys/std` `m.Pkg` passed 61 steps; and the
downstream static-model suite passed 14 steps. All three owning and downstream checks passed. The
landed logging move subsequently passed the complete 70-step `m.Pkg` suite, the focused 37-step
Dist/logging suite, `@sys/fs` checks, formatting, focused lint, and whitespace checks.

### Current implementation layout

```text
b8e41c39f  m.Fs.capability/m.Rooted/u/u.{create,error,file,io,path,stage,target}.ts
dd9dd8cdb  m.Pkg/u.verify/u.pinned{,.io,.limit,.manifest,.tree}.ts
ef9765a09  m.Pkg/u.log/u{,.children,.dist}.ts
cd4fff701  Rooted identity admission, ownership proofs, and public contract documentation
7df5daf5b  Pinned declared-entry admission bound and failure-precedence proof
752d66c8e  Rooted cleanup/durability and pinned-ignore strict-profile contract corrections
f71ca51ea  Rooted empty-target no-clobber regression proof
690b06bdd  Pinned ignore admission bound and first-failure preservation
0707f1c35  Total Dist guards and direct consumer classification proofs
```

The logging move updates `m.Pkg/m.Log.ts` and includes only formatter/lint normalization in the
moved surface (`const` for an unchanged local and a type-only import). It does not change the public
logging API or behavior.

Landed external-audit correction tail:

```text
f71ca51ea  test(fs): prove Rooted empty-target preservation
690b06bdd  fix(fs): bound pinned ignore matching and preserve failure truth
0707f1c35  fix(std): safely reject partial Dist shapes
```

The std commit owns the shared guard and its direct consumers; the pinned-verifier commit owns
admission and first-failure truth; the Rooted commit is a test-only no-clobber proof. Their
corresponding public contract text landed in `752d66c8e`. Neither untracked plan file was included in
these code commits.

## MAX BMIND correction tail

### `fix(fs): reject untrustworthy Rooted identities`

Before `cd4fff701`, `Rooted` admitted `dev` and `ino` through `Is.number`, which permits negative,
fractional, infinite, and unsafe integer values. These values are ownership evidence for root
revalidation, temporary-file cleanup, stage/marker cleanup, and persistent lock identity. Rounded
unsafe integers can compare equal without proving the same filesystem object.

The landed commit:

- require both identity fields to be non-negative values accepted by `Num.Is.safeInt`;
- return `unsupported` whenever trustworthy identity is unavailable;
- preserve committed truth if an invalid identity is observed after publication;
- add direct injected-IO proofs for invalid root, temp, stage, marker, and lock identities;
- leave the public Rooted API and documented threat boundary unchanged.

Landed working set:

- `code/sys/fs/src/m.Fs.capability/m.Rooted/u/u.path.ts`;
- focused Rooted tests under `code/sys/fs/src/m.Fs.capability/m.Rooted/-test/`;
- Rooted public contract documentation aligned with the corrected `unsupported` behavior.

Landed validation: Rooted passed 50 steps, complete filesystem capability passed 67 steps,
`@sys/fs` check passed, and focused formatting, lint excluding unchanged `require-await` residue,
and whitespace checks passed.

### `fix(fs): enforce pinned entry limits before part admission`

Before `7df5daf5b`, pinned manifest admission called the general Dist guard, traversed all part
values, and allocated `Object.entries(hash.parts)` before checking `limits.entries`. Manifest bytes
remained bounded, but the independent declared-entry work limit was not enforced at its promised
boundary.

The landed commit:

- establish the plain `hash.parts` object before calling the general Dist guard;
- count own part keys with early exit at `limits.entries + 1`;
- return `limit-exceeded` before parsing excess part values or allocating the complete entries array;
- allocate and parse entries only after the declared count is admitted;
- add direct proof that declared-entry exhaustion wins before malformed excess-part processing;
- leave successful verification, evidence, and all other failure classifications unchanged.

Landed working set:

- `code/sys/fs/src/m.Pkg/u.verify/u.pinned.manifest.ts`;
- `code/sys/fs/src/m.Pkg/-test/-Pkg.Dist.verifyPinned.manifest.test.ts`.

Landed validation: the focused manifest suite passed 8 steps, complete `m.Pkg` passed 71 steps,
`@sys/fs` check passed, and focused formatting, lint, and whitespace checks passed. The commit-level
MAX review added exact-boundary proof alongside the malformed-excess precedence proof and found no
remaining required correction.

### Annexed downstream hosting handoff

The local-host plan previously selected legacy `Pkg.Dist.verify`, which is not the landed
exact-manifest security boundary. `local-dist-host.plan.md` now requires:

```ts
Pkg.Dist.verifyPinned({ dir, integrity, limits, until });
```

Hosting consumes only `result.evidence.dist`, preserves required caller-owned limits and sanitized
failure mapping, propagates lifecycle cancellation, and opens no listener before successful
verification. It explicitly forbids legacy `Pkg.Dist.verify` as executable-materialization or
hosting authority and prohibits duplicated parsing, traversal, hashing, path, or resource-limit
policy.

This handoff is annexed to the eventual server-plan landing. It is not a standalone commit or a
runtime change in this filesystem prerequisite arc.

### Closing review gate

Final MAX result: **GO — gate closed.**

The first closing sequence froze `7df5daf5b`, passed internal MAX review, and produced the blind Opus
audit. The final closure reviewed every accepted correction against the original authority,
confinement, no-clobber, bounded-work, failure-truth, immutable-evidence, and observed-state
contracts. It found no false `verified` path, confinement or overwrite regression, matcher-admission
bypass, cleanup-authority widening, or unresolved required external finding.

Final landed-tip validation passed: `@sys/std` `m.Pkg` 62 steps, `@sys/fs` capability 68 steps,
`@sys/fs` `m.Pkg` 74 steps, downstream static-model 14 steps, all three owning/downstream checks, and
whitespace checks. Existing non-semantic `require-await` test residue and historical Deno wrapping
drift remain outside this security correction; neither was introduced by the landed correction
logic. The documented same-principal race, cooperative-locking, private-residue, and sudden-power-
loss durability limits remain explicit and are not closure defects.

The external audit is fully adjudicated: both required findings and accepted advisories are closed;
the retained and rejected recommendations remain documented below. This prerequisite is complete,
and verified materialization may proceed under its own plan.

### Blind external audit adjudication

The independent audit found no false `verified` result, confinement escape, overwrite path,
unproven cleanup, or false publication outcome. Its two required findings were independently
reproduced against the exact local implementation and accepted. The auditor's inability to read
workspace canon and run Deno reduced procedural confidence in its report, so no finding was accepted
on external authority alone; local red proofs and the owning Deno matrices are authoritative.

#### `fix(std): safely reject partial Dist shapes`

Accepted finding: `Pkg.Is.dist` and `Pkg.Is.distCompat` read `hash.digest` before establishing that
`hash` was an object. Ordinary partial JSON could therefore throw through the public predicate,
`Pkg.Dist.load`, child-Dist loading, and the downstream static adapter.

The landed correction (`0707f1c35`):

- snapshots `build` and `hash`, establishes both with `Is.object`, and only then reads hash fields;
- preserves all accepted canonical and legacy shapes without narrowing the general guard to the
  verifier's stricter plain-object profile;
- directly proves false—not throw—for missing, null, and numeric hash shapes;
- proves `Pkg.Dist.load` returns its documented `invalid` classification;
- proves `FilesStatic.fromDist` maps the same malformed shape to `FilesStaticError.InvalidPath`.

Landed working set:

```text
code/sys/std/src/m.Pkg/m.Is.ts
code/sys/std/src/m.Pkg/-test/-m.Pkg.Is.test.ts
code/sys/fs/src/m.Pkg/-test/-Pkg.Dist.test.ts
code/sys.model/model/src/m.files.static/-test/-m.fromDist.test.ts
```

Genuine red result: the std predicate and filesystem loader threw a raw `TypeError`, while the model
adapter surfaced `TypeError` instead of `FilesStaticError.InvalidPath`. Focused and complete green
validation passed after the one production guard correction.

#### `fix(fs): bound pinned ignore matching and preserve failure truth`

Accepted finding: authenticated ignore metadata reached the synchronous regex-backed matcher with no
structural cost admission. Small bounded probes against the exact locked `ignore@7.0.6` dependency
confirmed rapidly multiplying match time, and cooperative cancellation could not run while a match
occupied the isolate.

The landed correction (`690b06bdd`):

- admits ignore rules before matcher construction with one linear structural pass;
- permits at most one cross-directory `**` segment per rule;
- permits at most one ordinary unescaped `*` in every other path segment;
- retains common non-ambiguous forms such as `*.map`, `**/*.map`, and `foo/**/bar`;
- rejects ambiguous repetition as `malformed` without adding a timing threshold, worker, dependency,
  public limit, or alternate ignore implementation;
- applies the strict executable profile already documented in `752d66c8e` while leaving general
  `Ignore` and `Pkg.Dist.compute` semantics unchanged;
- preserves an already-observed verifier classification when closing the same handle also fails;
  close failure remains `io-failure` when no earlier failure exists.

This strict-profile narrowing is intentional. Exact pinning authenticates bytes but does not make
attacker-shaped metadata benevolent, and the strict executable verifier is already narrower than
general Dist computation through required sizes, portable paths, exact-tree semantics, and caller
limits.

Landed working set:

```text
code/sys/fs/src/m.Pkg/u.verify/u.pinned.manifest.ts
code/sys/fs/src/m.Pkg/u.verify/u.pinned.tree.ts
code/sys/fs/src/m.Pkg/-test/-Pkg.Dist.verifyPinned.manifest.test.ts
code/sys/fs/src/m.Pkg/-test/-Pkg.Dist.verifyPinned.io.test.ts
```

The matching public-contract correction in `code/sys/fs/src/m.Pkg/t.ts` landed separately at
`752d66c8e`. Genuine red results: ambiguous rules were admitted through a
`verified` result, and a secondary close fault replaced prior `changed` truth with `io-failure`.
Both proofs are green after the correction.

#### `test(fs): prove Rooted empty-target preservation`

Accepted proof gap: the occupied-directory proof used a non-empty destination, which the host rename
operation can reject independently; it did not prove that Rooted protects an existing empty
directory. The related public-contract gaps—failed-publication residue and stage-promotion
durability—are already corrected in `752d66c8e`.

The landed test correction (`f71ca51ea`):

- proves an already-existing empty target directory remains untouched and the staged loser is
  cleaned;
- changes no Rooted production runtime, authority, result, cleanup behavior, or public contract.

Landed working set:

```text
code/sys/fs/src/m.Fs.capability/m.Rooted/-test/-stage.test.ts
```

The matching public-contract correction in `code/sys/fs/src/m.Fs.capability/m.Rooted/t.ts` is already
landed at `752d66c8e`. The landed follow-up is intentionally test-only and closes the no-clobber
proof gap whose empty-directory host behavior differs from the old fixture.

#### Advisory disposition and validation

- retained by design: unresolved cleanup failure remains the actionable Rooted failure rather than
  being hidden behind the originating operation failure;
- rejected: extracting the verifier's Rooted path import would split the intentional single grammar
  owner and weaken security DRY;
- no second matcher, path grammar, public token, or hosting/materialization behavior was introduced.

Post-correction validation passed: `@sys/std` `m.Pkg` 62 steps, `@sys/fs` capability 68 steps,
`@sys/fs` `m.Pkg` 74 steps, downstream static-model 14 steps, all three package checks, focused
formatting and lint, and whitespace checks.

## Purpose

Provide the shared filesystem foundations required by verified Dist materialization without placing
path, write, verification, or publication policy in HTTP or Server code:

```text
canonical Dist part metadata
  → root-confined complete-file publication
  → exact pinned generation verification
```

The arc is independently cohesive. `@sys/http` consumes the confined writer, and `@sys/server/dist`
consumes both the writer and strict verifier. Neither consumer may reproduce a private substitute.

## Dependency direction

```text
@sys/std/pkg Dist part grammar
  → @sys/fs rooted capability + Pkg.Dist strict verification
  → @sys/http Pull and @sys/server/dist
```

No dependency returns from `@sys/fs` to HTTP, Server, Model, Tools, or a product package.

## Commit ownership

### `fix(std): strictly parse Dist part metadata`

Own the canonical parser used for `dist.hash.parts[path]` values.

Current failure to remove:

- `Pkg.Dist.Part.parse` accepts SHA-256 values shorter than the canonical 64 lowercase hex digits;
- a malformed, non-finite, or unsafe `:size=` value silently degrades into a hash-only result;
- `Pkg.Is.dist` validates only the hash prefix and does not require the complete part value to parse.

Target semantics:

- accept only canonical lowercase `sha256-<64 hex>` hashes;
- accept either the hash-only legacy shape or `<hash>:size=<bytes>`;
- do not trim, case-fold, or rely on a regular-expression `$` match that can stop before a final line
  terminator; admission covers the exact complete input;
- when `:size=` is present, require `0 | [1-9][0-9]*`, converted to one non-negative value accepted by
  `Num.Is.safeInt`;
- reject leading zeroes, whitespace, signs, decimals, exponents, Unicode digits, unsafe integers,
  malformed suffixes, and trailing data;
- reject the complete value when a present size is invalid; never return a hash-only partial parse;
- make `Pkg.Is.dist` delegate complete part-value admission to the shared parser;
- derive canonical SHA-256-only checks for Dist digest metadata from the parser's hash-only result
  rather than retaining a second Dist hash grammar;
- make `Part.hash` and `Part.size` reuse the parser without `this`;
- keep hash-only Dist parts valid for general compatibility;
- let strict pinned generation verification separately require byte sizes.

Expected narrow working set:

- `code/sys/std/src/m.Pkg/m.Dist.Part.ts`;
- its focused tests;
- `code/sys/std/src/m.Pkg/m.Is.ts` and focused Dist-shape tests when required;
- `code/sys/std/src/m.Pkg/common.ts` only if the canonical numeric helper needs a local re-export.

This commit changes parser correctness only. It does not change hashing, filesystem traversal,
materialization, or `Pkg.Dist.compute` output.

## Root-confined capability contract

### `feat(fs): add root-confined no-clobber writes`

Add one `@sys/fs`-owned capability rooted at a caller-selected directory. The landed runtime
namespace is `Fs.Capability.Rooted`; HTTP and Server must not invent a parallel interface. Its public
factory, admitted-target handles, file publication, stage lifecycle, promotion results, and stable
failure contract are owned by `t.FsRooted`.

The capability must provide the minimum operations needed by its consumers:

- create the rooted instance asynchronously because root identity and symlink state require IO;
- admit a complete batch of bounded root-relative targets before network work;
- return frozen admission data and opaque admitted-target handles that the instance validates;
- resolve admitted targets under one canonical absolute root without later accepting arbitrary
  absolute paths;
- report exact normalized-target collisions and file-versus-parent structural collisions
  deterministically;
- reserve capability-owned temp and lock namespaces from caller targets;
- reject absolute paths, traversal, NULs, backslashes, and platform-reserved portable-path forms;
- reject a root, ancestor, parent, or final target observed as a symlink;
- create missing parent directories one segment at a time without knowingly traversing a symlink;
- publish a complete file value atomically without replacing an existing target;
- expose filesystem-owned staging and promotion with explicit ownership and concurrent-winner
  behavior;
- clean only temporary or staging identities proven to be owned by the current capability.

Portable segment admission additionally rejects Windows device names, trailing dots/spaces, control
characters, `:`, `"`, `<`, `>`, `|`, `?`, `*`, and the capability's reserved internal names. The
consumer supplies admitted relative paths. The capability does not derive filesystem targets from
URLs and does not know about HTTP resources or Dist manifests.

### Async IO and durability boundary

All public operations remain asynchronous. `sync` in this contract means `await file.sync()` on a
complete temporary file; it does not mean `openSync`, `readFileSync`, or `writeFileSync`. Blocking
APIs add no atomicity or confinement and must not be introduced for this work.

Raw `Deno.open`, `Deno.link`, `Deno.mkdir`, `Deno.readDir`, file-handle stat/sync, and advisory-lock
calls remain private `@sys/fs` adapter mechanics. Do not widen root `Fs` with Deno-shaped methods.
Promote a reusable semantic filesystem operation only after a second independent use proves that
public boundary.

A successful operation promises atomic process-visible publication after complete temp-file sync. It
does not claim portable power-loss durability for the new directory entry; that stronger contract
requires parent-directory sync and a truthful post-linearization durability result.

### File publication

A successful file write must satisfy all of:

1. The target belongs to the complete approved admission and is lexically contained by the rooted
   `Path.Bounded` policy.
2. Every observed existing ancestor is a real directory and not a symlink.
3. A uniquely owned same-directory temp file is created with no-clobber semantics.
4. Complete bytes are written with forward-progress checks, synced, closed, and size-checked.
5. Observed ancestor and target state is revalidated before publication.
6. Publication fails if the destination already exists.
7. Readers never observe a partial destination value.
8. Temporary cleanup never removes an identity not proven to be capability-owned.

A plain rename that can replace an existing file is not a no-clobber primitive. The selected file
linearization point is successful hard-link creation from the complete same-directory temp file to
the absent target. Cancellation before that point removes only the owned temp; cancellation after it
must report committed truth. Compare target/temp device and inode identity when the platform exposes
it, then remove the temporary link.

If hard-link publication or required identity checks are unsupported, fail as unsupported; do not
fall back to replacement or direct partial writes. A failure after the linearization point must not
be reported as though no target was created.

### Directory promotion

Dist generation promotion must have a separately truthful contract:

- a stage is created under the rooted store on the same filesystem and carries an ownership identity
  checked before cleanup or promotion;
- cooperative concurrent materializers use one stable target-specific filesystem-owned advisory
  lock beneath the reserved internal namespace;
- the lock artifact must be observed as a real regular file, and lock acquisition uses a
  cancellation-aware `tryLock` loop so process death releases ownership without stale reservation
  authority;
- unsupported advisory locking fails explicitly rather than weakening concurrency semantics;
- after acquiring the lock, revalidate stage ownership and target state;
- one caller may rename its owned stage to the absent generation target;
- successful rename is the directory-promotion linearization point;
- a structurally admissible target found under the lock returns `occupied`, not `existing`;
- losers never replace or merge with the winner and remove only their own stage;
- Server may translate `occupied` to `existing` only after independent pinned strict verification;
- an existing invalid, empty, symlink, or malformed target fails closed at the composing verifier;
- cancellation before the linearization point removes only caller-owned staging;
- cancellation after successful publication returns `published` and never reports the committed
  generation as absent or rolled back.

Do not remove a persistent lock file while other processes may hold handles to it; doing so can split
future lock identity. Do not claim portable kernel-level no-clobber directory rename when the
platform does not expose it. The cooperative protocol narrows concurrency among participants that
honor the same lock; it is not a substitute for an `openat`/`renameat2`-style primitive against a
non-cooperating same-principal process.

### Threat boundary

The caller grants authority to the selected root and its parent. The capability guarantees canonical
lexical containment, fail-closed observed-symlink checks, no replacement through its own publication
methods, and cooperative concurrent-winner handling.

It does not claim to defeat a malicious concurrent process running as the same OS principal that can
replace admitted ancestors between checks. That stronger claim requires pinned directory handles and
no-follow relative syscalls with equivalent `openat` semantics. If that adversary is in scope, stop at
this boundary rather than approximating the guarantee with repeated string/path checks.

Portable preflight rejects exact normalized duplicate targets and structural file/parent conflicts.
Remaining physical aliases caused by filesystem case folding, Unicode normalization, or
platform-specific naming rules are fail-closed at publication. The capability must not claim that
lexical preflight proves every physical filesystem identity on every platform.

Expected narrow working set:

- `code/sys/fs/src/m.Fs.capability/t.ts`;
- `code/sys/fs/src/m.Fs.capability/mod.ts` and focused rooted-capability implementation files;
- `code/sys/fs/src/m.Fs.capability/-test/` focused adversarial tests;
- the minimal `Fs.Capability` type re-export needed by `t.Fs`.

The rooted feature earned and landed the reviewed `m.Fs.capability/m.Rooted` semantic submodule
boundary. The generated scaffold was narrowed to files serving the capability; template generation
did not substitute for public-contract approval.

Do not change the existing model-facing `Fs.Capability.Files.Writable.writeFileAtomic` replacement
contract accidentally. A new no-clobber rooted capability must be named distinctly unless that older
contract is deliberately migrated with its own compatibility proof.

## Pinned strict generation verification

### `feat(fs): verify pinned strict Dist generations`

Add `Pkg.Dist.verifyPinned` as the distinct executable-materialization proof. Do not silently widen or
change the legacy `Pkg.Dist.verify` contract.

Conceptual input:

```text
dir        generation directory
integrity  caller-pinned canonical SHA-256 of exact dist.json bytes
limits     required caller-owned upper bounds
  manifestBytes  exact dist.json bytes
  entries        all observed descendants, including directories and dist.json
  fileBytes      any one declared asset
  totalBytes     aggregate declared asset bytes, excluding dist.json
until      optional cancellation lifecycle
```

`limits` names the policy once; its fields do not repeat a `max` prefix. Values must be safe integers
with positive bounds where zero cannot perform useful verification. There is no implicit unlimited
mode. The manifest is bounded before allocation or parsing, declared and observed entries consume
the entry budget, every asset is bounded before allocation, and aggregate arithmetic fails closed
before it can exceed a safe integer or the caller's total-byte limit.

The exact method, evidence shape, and result union are locked types-first under
`t.Pkg.Dist.VerifyPinned` before runtime implementation. The union must distinguish `verified`,
`invalid-input`, `missing`, `malformed`, `integrity-mismatch`, `content-mismatch`, `unsafe-path`,
`symlink`, `unexpected-entry`, `limit-exceeded`, `changed`, `unsupported`, `io-failure`, and
`cancelled`. A read-only verifier has no committed state: only the `verified` branch is success, and
all other branches are failures. Classification follows the verification sequence: invalid caller
input is rejected before IO; initial root/manifest absence is `missing`; a syntactically valid wrong
pin is `integrity-mismatch` before parsing; authenticated schema/policy self-inconsistency is
`malformed`; manifest target grammar is `unsafe-path`; resource bounds are `limit-exceeded` before
unbounded work; every observed symlink is `symlink`; stable extra/special entries are
`unexpected-entry`; stable declared-byte/kind/hash mismatch is `content-mismatch`; disagreement
between observations is `changed`; unavailable required identity is `unsupported`; and other host
faults are `io-failure`. Cancellation is returned when first observed at a documented cooperative
boundary; a later host-handle close fault while unwinding is still `io-failure`. When several
conditions already coexist, the earliest completed check in this fixed sequence is the result.

Cancellation is cooperative: observe it before filesystem work, between awaited operations and
enumerated entries, around bounded read/hash work, and immediately before returning success. A
synchronous bounded hash cannot be interrupted mid-call, so check immediately before and after it.
Cancellation never returns partial evidence. Expected parsing, policy, filesystem, and host failures
are mapped into the result union; `unsupported` is distinct from ordinary `io-failure`, and raw host
exceptions do not escape as public diagnostics.

Approved public contract:

```ts
/** Verify a generation against an exact authenticated manifest. */
readonly verifyPinned: VerifyPinned.Method;

export namespace VerifyPinned {
  /** Verify one generation against an exact authenticated manifest. */
  export type Method = (args: Args) => Promise<Result>;

  /** Arguments passed to `Pkg.Dist.verifyPinned`. */
  export type Args = {
    dir: t.StringPath;
    integrity: t.StringHash;
    limits: Limits;
    until?: t.UntilInput;
  };

  /** Required resource limits. No unlimited defaults are applied. */
  export type Limits = {
    manifestBytes: t.NumberBytes;
    entries: t.NumberTotal;
    fileBytes: t.NumberBytes;
    totalBytes: t.NumberBytes;
  };

  /** Result of pinned generation verification. */
  export type Result = Verified | Failure;

  /** Successful verification with immutable owner-derived evidence. */
  export type Verified = {
    readonly kind: 'verified';
    readonly evidence: Evidence;
  };

  /** Immutable evidence produced by the verifier. */
  export type Evidence = {
    readonly integrity: t.StringHash;
    readonly dist: t.DeepReadonly<t.DistPkg>;
    readonly manifestBytes: t.NumberBytes;
    readonly assets: {
      readonly files: t.NumberTotal;
      readonly totalBytes: t.NumberBytes;
      readonly packageBytes: t.NumberBytes;
    };
  };

  /** Failed verification without raw host errors or local paths. */
  export type Failure = {
    readonly kind: FailureKind;
  };

  /** Stable failure classification. */
  export type FailureKind =
    | 'invalid-input'
    | 'missing'
    | 'malformed'
    | 'integrity-mismatch'
    | 'content-mismatch'
    | 'unsafe-path'
    | 'symlink'
    | 'unexpected-entry'
    | 'limit-exceeded'
    | 'changed'
    | 'unsupported'
    | 'io-failure'
    | 'cancelled';
}
```

Input records intentionally omit `readonly`: canon treats inputs as requirements, not guarantees.
The verifier does not mutate them. Returned result/evidence fields remain readonly and are deeply
frozen at runtime because they are promises made by the API.

A successful proof must establish all of:

1. The input integrity is a canonical hash-only SHA-256 value.
2. The generation root exists as a real directory and is not a symlink.
3. `dist.json` is observed as a regular non-symlink file.
4. Exact `dist.json` bytes hash to the caller pin before UTF-8 decoding or JSON parsing.
5. Strict UTF-8 decoding and `Json` parsing operate on those same authenticated bytes; no second
   manifest load supplies runtime meaning.
6. Before calling the shallow general `Pkg.Is.dist` guard, the verifier safely establishes the plain
   object base shape required to prevent malformed nested input from throwing. Arrays do not satisfy
   object fields. `Pkg.Is.dist` remains necessary but is not sufficient for the strict profile.
7. The parsed value satisfies the complete executable-generation Dist profile: required build
   fields; safe non-negative integer timestamp and sizes; `pkg <= total`; valid package and signature
   descriptors when present; required hash-policy and ignore metadata; a canonical digest; and at
   least one complete part value.
8. Hash-policy URLs are authenticated provenance, not executable authority and not a current-package
   version gate. Strict verification applies its supported explicit ignore format, normalized rules,
   and digest semantics; it never dispatches behavior from an arbitrary policy URL.
9. Every raw part key already equals its normalized portable form and passes the same bounded
   portable-target policy used by Rooted. Normalized duplicates, file/parent conflicts, reserved
   internal names, nested or root `dist.json`, signature sidecar paths, and portable reserved forms
   are rejected.
10. Every part value has a canonical SHA-256 hash and required safe byte size. Declared part count,
    individual sizes, aggregate sizes, and all arithmetic remain within caller limits and safe
    integers before asset allocation.
11. `CompositeHash.digest` reproduces the declared manifest digest.
12. The ignore rules equal their canonical normalized form, `Ignore.digest` reproduces the declared
    digest, and the shared matcher reproduces the selected declared part set. Ignored filesystem
    entries are never silently admitted by strict verification.
13. A deterministic bounded no-follow tree snapshot finds exactly `dist.json`, declared assets, and
    their structural directories.
14. Every declared asset is a regular non-symlink file. Its opened-handle identity and observed size
    are checked before a bounded exact read, then those exact bytes and `Hash.sha256` checksum are
    verified one file at a time.
15. Every structural parent is a real directory and not a symlink.
16. Undeclared files, ignored files, signature sidecars, temp artifacts, empty extra directories,
    special entries, and symlinks fail verification.
17. Owner-derived asset/package totals match canonical manifest totals, but returned evidence uses
    only owner-derived values and never promotes self-reported build metadata to pin authority.
18. A second deterministic tree/metadata observation detects changes observed during verification,
    and the final manifest is reopened through the same no-follow identity discipline. Its bytes must
    remain byte-identical to the authenticated bytes and match the exact caller pin before success.

An authenticated `build.sign` descriptor is inert metadata in this slice. Its sidecar is not fetched
or trusted, its portable canonical path cannot also be a declared asset, and any sidecar present in
the generation fails the exact-tree proof.

Use pre-open `lstat`, opened-handle stat, bounded exact reads, post-read observations, a second tree
snapshot, and final byte-identical manifest confirmation. Require stable filesystem identity for the
root, manifest, assets, and observed entries; if required device/inode identity is unavailable,
return `unsupported` rather than weakening the proof. Compare identity, kind, size, and available
modification metadata across observations. Deno does not expose portable `openat`/`O_NOFOLLOW`; this
proves observed stability, not an attacker-proof filesystem snapshot or immunity to same-inode
malicious mutation. Sort security-relevant paths with stable code-unit ordering rather than
locale-dependent comparison.

Do not call `DirHash.verify`, `CompositeHash.verify`, generic `Fs.read`, or `Fs.readJson` inside this
strict kernel. Their path-based or higher-level contracts lose required handle identity, exact-tree,
or same-byte evidence and can cause redundant reads. Compose the lower semantic primitives
`Hash.sha256`, `CompositeHash.digest`, strict `Json` parsing, `Ignore.normalize/digest/create`, and the
shared portable target policy instead of duplicating their algorithms. Extract the landed Rooted
portable-target admission into a package-private pure seam consumed by both Rooted and the verifier;
do not create a new public path API merely for this second internal use.

Whole-file hashing is acceptable only because the caller's required limits bound every allocation.
If very-large-file streaming becomes a requirement, extend `@sys/crypto` with incremental SHA-256
first; do not import a private hash implementation into `@sys/fs`.

The successful result must contain deeply frozen, owner-produced evidence suitable for Server
composition: the exact integrity pin, authenticated strict Dist value, manifest byte count, asset
count, owner-derived total asset bytes, and owner-derived package bytes. Result objects and nested
manifest evidence are immutable at runtime and in the public type contract. Evidence contains no
local root path. Failure results expose stable classification without raw host exceptions,
cancellation reasons, local paths, credentials, or path-bearing causes; the exact minimal diagnostic
shape remains part of the types-first latch. Serving re-runs this shared proof; returned evidence is
operational output, not a forgeable bypass token.

Approved working set:

Public contract and wiring:

- `code/sys/fs/src/m.Pkg/t.ts`;
- `code/sys/fs/src/m.Pkg/m.Pkg.Dist.ts`.

Private verifier kernel (current grouped paths after `dd9dd8cdb`):

- `code/sys/fs/src/m.Pkg/u.verify/u.pinned.ts`;
- `code/sys/fs/src/m.Pkg/u.verify/u.pinned.io.ts`;
- `code/sys/fs/src/m.Pkg/u.verify/u.pinned.limit.ts`;
- `code/sys/fs/src/m.Pkg/u.verify/u.pinned.manifest.ts`;
- `code/sys/fs/src/m.Pkg/u.verify/u.pinned.tree.ts`.

Shared package-private portable-target policy extraction (current grouped paths after `b8e41c39f`):

- `code/sys/fs/src/m.Fs.capability/m.Rooted/u/u.target.ts`;
- `code/sys/fs/src/m.Fs.capability/m.Rooted/u/u.path.ts`;
- `code/sys/fs/src/m.Fs.capability/m.Rooted/u/u.create.ts`;
- `code/sys/fs/src/m.Fs.capability/m.Rooted/-test/-admit.test.ts`.

Focused red-test scaffold:

- `code/sys/fs/src/m.Pkg/-test/-Pkg.Dist.verifyPinned.test.ts`;
- `code/sys/fs/src/m.Pkg/-test/-Pkg.Dist.verifyPinned.manifest.test.ts`;
- `code/sys/fs/src/m.Pkg/-test/-Pkg.Dist.verifyPinned.tree.test.ts`;
- `code/sys/fs/src/m.Pkg/-test/-Pkg.Dist.verifyPinned.io.test.ts`;
- `code/sys/fs/src/m.Pkg/-test/-u.verifyPinned.fixture.ts`.

This contract and working set passed the human latch and landed without a new public path API or a
widened root `Fs` surface. The later utility-grouping refactor preserved that boundary.

## Adversarial proof

### Dist part grammar

Prove rejection of:

- short, uppercase, or non-hex SHA-256 values;
- empty, signed, leading-zero, decimal, exponent, Unicode-digit, whitespace-padded, overflow, and
  unsafe sizes;
- valid hash plus malformed size suffix;
- trailing data, final line terminators, and duplicate suffix material;
- partial-parse degradation.

Prove canonical hash-only compatibility, zero, and maximum-safe byte-size parsing.

### Root capability

Prove:

- absolute, traversal, backslash, NUL, portable-reserved, and internal-namespace rejection;
- exact normalized and structural file/parent collision rejection before effects;
- root, ancestor, final-target, and directory symlink rejection;
- complete-byte visibility only;
- existing target no-clobber behavior;
- write, short-write/no-progress, sync, link, identity-check, and cleanup failure truth;
- unsupported hard-link or advisory-lock publication fails rather than weakening semantics;
- honest concurrent file publication has one kernel no-clobber winner;
- honest concurrent directory promotion has one `published` result and one `occupied` result without
  replacement;
- cancellation immediately before and after each publication linearization point;
- stage identity loss prevents recursive cleanup;
- no cleanup outside proven caller-owned temporary or staging identities;
- process-owned lock release does not create a stale reservation authority.

Use a private injected IO seam for deterministic failure and linearization tests without widening the
public capability. Where platform alias behavior cannot be deterministically exercised, test the
canonical key policy separately and state the remaining filesystem-dependent boundary.

### Pinned strict verification

Prove failure for:

- noncanonical caller integrity, malformed limits, and a wrong exact manifest pin;
- manifest-byte, entry, individual-file, and aggregate-byte limit exhaustion before an unbounded
  allocation or traversal can occur;
- invalid UTF-8, malformed JSON, array-shaped object fields, legacy manifest, and incomplete strict
  Dist fields without allowing malformed nested objects to throw through `Pkg.Is.dist`;
- zero declared parts, malformed or missing part size, unsafe integer arithmetic, and incomplete hash
  policy or ignore metadata;
- noncanonical raw path, path escape, reserved manifest/signature path, normalized collision, and
  structural collision through the shared Rooted policy;
- missing, truncated, enlarged, or tampered asset;
- undeclared file, ignored file, signature sidecar, temp artifact, special entry, and empty extra
  directory;
- file, directory, root, and ancestor symlink;
- composite digest/parts mismatch;
- noncanonical ignore rules, invalid ignore-policy digest, or selected-set replay mismatch;
- inconsistent build totals;
- mutation observed between handle/path/tree observations, including final manifest replacement or
  byte change;
- unavailable required stable identity;
- cancellation before work, during enumeration/read, and at the final success boundary;
- unreadable manifest/asset and enumeration failure.

Use a private injected IO seam for deterministic mutation, cancellation, unsupported-platform, and
IO-failure proof without adding public test hooks. Prove one valid canonical generation, immutable
owner-produced evidence, no local-path/raw-cause leakage from failures, and deterministic totals
derived from validated parts and actual files rather than trusting `build.size`.

## Per-commit latches

For each arc item:

1. Approve exact public types, state transitions, errors/results, expected files, and any required
   template landing before implementation.
2. Add focused red tests for that commit only.
3. Implement without importing later-arc behavior.
4. Run the focused owning-module tests with leak tracing.
5. Run the owning module `deno task check`.
6. Review the complete semantic diff before staging.
7. Stage only exact files/hunks and create one signed commit.
8. Update this opening arc with the landed short hash before advancing.

## Verification

Run from each owning module:

```text
code/sys/std         deno task test --trace-leaks ./src/m.Pkg
code/sys/std         deno task check
code/sys/fs          deno task test --trace-leaks ./src/m.Fs.capability
code/sys/fs          deno task test --trace-leaks ./src/m.Pkg
code/sys/fs          deno task check
code/sys.model/model deno task test --trace-leaks ./src/m.files.static
code/sys.model/model deno task check
```

The focused `@sys/model/files/static` suite proves the shared Dist parser and filesystem type changes
did not break its public seam.

## Non-goals

- HTTP fetching, redirects, retries, progress, or HTTP lifecycle ownership.
- Deriving target paths from URLs.
- Server materialization or serving.
- Product activation, mutable aliases, rollback pointers, or garbage collection.
- Reclaiming staging directories not proven to belong to the current capability instance.
- Claiming portable power-loss durability for published directory entries.
- Replacing legacy `Pkg.Dist.verify` semantics.
- Migrating the model-facing writable Files adapter unless independently required and reviewed.
- Claiming race-safe confinement against a malicious concurrent same-principal process without a
  stronger platform primitive.

## Deferred plan seed: composable rooted filesystem capabilities

Search terms: `Rooted.Readonly`, `Rooted.Publish`, `Rooted.Mutable`, `general rooted filesystem`,
`root-scoped filesystem authority`, `root-confined read list walk`.

Status: parked; explicitly outside this three-commit prerequisite arc. Spin this seed into a separate
plan only when a concrete consumer requires ordinary filesystem access beneath a selected root.
Do not extend commit two or delay pinned Dist verification for it.

The current `Fs.Capability.Rooted` is the publication facet: target admission, no-clobber complete-file
publication, and owned stage promotion. A future plan may evaluate this conceptual decomposition,
but these names are not yet approved public API:

```text
Rooted.Readonly   stat, read, list/walk
Rooted.Publish    admit, publishFile, stage/promotion
Rooted.Mutable    overwrite/remove — only when independently required
```

Required boundaries for that future plan:

- expose genuinely separate runtime capability objects; narrower TypeScript views of one more-powerful
  object do not enforce least authority;
- preserve canonical root binding, root-relative admission, internal-namespace exclusion, cancellation,
  and fail-closed observed-symlink/identity checks for every operation;
- treat read and enumeration as information authority rather than harmless convenience;
- define deterministic list/walk ordering, metadata shape, special-entry behavior, symlink policy,
  mutation-during-read truth, and whether reads return snapshots or streams;
- never expose `.sys-rooted` ownership, staging, temporary, or lock artifacts through ordinary
  traversal;
- keep the existing `Fs.Capability.Files` model adapter contract distinct unless a deliberate
  compatibility migration proves otherwise;
- do not place overwrite or removal on the publication capability: replacement, recursive deletion,
  cleanup ownership, and post-commit failure truth require their own threat model and adversarial proof;
- retain the current observed-state confinement limit unless equivalent pinned-handle/no-follow
  relative syscalls become available; do not market string/path revalidation as an OS sandbox;
- review compatibility before renaming or nesting the landed `Fs.Capability.Rooted` surface.

Restart trigger: at least one named consumer with exact read/list or mutation workflows and a clear
reason ambient `Fs` authority is too broad. Begin with a separate types-first/public-contract latch,
focused red tests, and an owning-module plan; `Rooted.Mutable` additionally requires an independently
approved destructive-operation use case.
