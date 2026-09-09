rooted-streaming-tree.plan.md
- [x] GATE human accepts cooperative-filesystem ZIP extraction and admits this Rooted writer as its current filesystem prerequisite
- [x] 26c414675 feat(fs): add owned streaming tree construction to Rooted stages

## Completion

This implementation arc is complete. The opening gate records the human's cooperative-filesystem
acceptance, and the writer commit is reachable with its exact recorded subject. Retirement is a
separate action after this final plan snapshot is committed.

The required consumer landed in `2487b8b62` (`feat(zip): add bounded ZIP extraction through a tree
sink`), followed by Driver Pi integration in `951a682ec`. Subsequent Rooted failure-evidence
corrections landed in `8294315b9`; they preserve mutation and primary/cleanup truth rather than
strengthening the cooperative-filesystem threat model.

The completed ZIP plan at `122e8b283`, path
`-agent/-plan/@sys.archive.zip/zip.plan.md`, retains the downstream acceptance record: the final Fs
correction passed 26 settlement steps, Rooted 23 tests / 178 steps, Fs process 4 tests / 6 steps,
package check, and publish dry-run. Renewed Pi artifact correspondence, selected-host acceptance,
narrow-permission proof, and independent native-I/O probes covered consumption of the corrected Fs
owner. These are recorded historical results, not fresh runs during this closeout. The ZIP plan was
subsequently retired in `4e59fdd53` and remains recoverable through that completed snapshot.

No implementation or required consumer work remains in this arc. Native hostile-ancestry
confinement and unbounded host-I/O settlement remain explicit exclusions, not deferred acceptance
obligations.

## Purpose

Extend `Fs.Capability.Rooted.Stage` with one bounded writer that constructs a complete private tree
from declarative directories and pull-driven file content. Keep path admission, filesystem mutation,
stage ownership, lifecycle settlement, and publication safety entirely within `@sys/fs`.

The primitive constructs an unpublished tree. Publication continues through the existing
cooperatively coordinated no-clobber `rooted.Stage.promote()` operation. It does not claim a native
atomic no-replace rename, add archive semantics, select a destination, restore metadata, overwrite,
or introduce another filesystem owner.

Planning, review, and readiness do not authorize implementation or Git mutation.

## Earned consumer and admission gate

The concrete current adopter is `feat(zip): add bounded ZIP extraction through a tree sink` in
[`zip.plan.md`](../@sys.archive.zip/zip.plan.md). That item supplies normalized bounded ZIP entries
through this writer, and its Driver Pi successor owns destination orchestration. `@sys/fs` remains
the lowest truthful owner of private tree construction; it takes no runtime dependency on
`@sys/archive` or Driver Pi.

Gate-creation provenance (`2026-09-02`): the human architecture owner required mutating ZIP
extraction to remain blocked until that owner accepts its cooperative-filesystem threat model. The
human architecture owner is the decision authority. This plan owns that one finite admission gate
because, without the extraction adopter, this public writer is not earned. The gate controls these
exact later actions:

- `feat(fs): add owned streaming tree construction to Rooted stages`;
- `feat(zip): add bounded ZIP extraction through a tree sink`; and
- `feat(driver-pi): expose ZIP extraction under a cooperative-filesystem contract`.

The pass condition is an explicit human decision equivalent to:

> I accept cooperative-filesystem ZIP extraction for isolated or hygienic single-user launches.
> Adversarial concurrent mutation of destination ancestry, Rooted metadata or stage state, and the
> published extraction tree is out of scope, and I admit the Rooted tree writer as its filesystem
> prerequisite.

Gate resolution (`2026-09-07`): the human architecture owner explicitly accepted this boundary and
its Rooted prerequisite in these exact words:

```text
- ZIP extraction may run in an isolated or hygienic single-user
  workspace.
- During extraction, no untrusted same-user process may race to rename
  or replace the destination, its parents, Rooted metadata, or the
  private stage.
- Rooted still validates paths, rejects links, avoids overwrite,
  builds privately, and publishes only the complete tree.
- It does not claim protection against another process with equivalent
  filesystem authority actively changing those paths at the same time.

yes I accept this - IFF and i thinkg this is true THIS IS THE existing security posture - over this class of "security forward posture - fail to safe" - AND the next thing - loosely coupled - is to ensure it runs in a sandbox - WHEN/IF just the above, is no longer an acceptable level of trust/safety
```

This acceptance treats the stated cooperative posture as the local-first baseline. If hostile
same-authority concurrency later enters scope, sandboxing or a native handle-relative broker is a
separate, loosely coupled security layer; a sandbox qualifies only when it actually prevents peer
mutation of the mounted ancestry. The gate resolves product admission only and grants no
implementation or Git-mutation authority.

## Public contract

Extend a private active stage with:

```ts
await stage.writer.writeTree(entries, {
  maxEntries,
  maxPathBytes,
  maxPathDepth,
  maxFileBytes,
  maxTreeBytes,
  until,
  timeout,
});
```

Add structurally compatible owner types under `t.FsRooted`:

```ts
type TreeDirectory = { readonly kind: 'directory'; readonly path: t.StringPath };
type TreeFile = {
  readonly kind: 'file';
  readonly path: t.StringPath;
  readonly expectedBytes: number;
  readonly content: AsyncIterable<Uint8Array>;
};
type TreeEntry = TreeDirectory | TreeFile;
type TreeWriteOptions = {
  readonly maxEntries: number;
  readonly maxPathBytes: number;
  readonly maxPathDepth: number;
  readonly maxFileBytes: number;
  readonly maxTreeBytes: number;
  readonly until?: t.UntilInput;
  readonly timeout: t.Msecs;
};
type StageWriter = {
  readonly writeTree: (
    entries: readonly TreeEntry[],
    options: TreeWriteOptions,
  ) => Promise<void>;
};
```

`Stage` gains one frozen `readonly writer: StageWriter`; `t.FsRooted.Operation` adds `write-tree`,
and `t.FsRooted.FailureKind` adds `timeout`, `limit-exceeded`, and `producer-failure`. A write-tree
failure has `committed: false` before its first private mutation and `committed: true` afterward;
that flag reports private-stage reconciliation, never destination publication. Producer-thrown
values are untrusted causes and can never authenticate their own Rooted operation, kind, or
commitment.

## Admission, ordering, and filesystem invariants

`entries` is one immutable construction specification captured before producer execution or
filesystem mutation. Admission uses captured intrinsics and preserves these exact rules:

- `entries` is a native non-proxy dense ordinary array with `Array.prototype`, one own data property
  for every index, its ordinary `length`, and no extra string or symbol keys; an empty batch is valid;
- each entry and the options value is a native non-proxy ordinary record with `Object.prototype`,
  only the declared own data properties, and no accessors, unknown string keys, or symbol keys;
- capture every entry field, option, and lifecycle container before I/O; capture the complete
  lifecycle-container graph before validating executable leaves, so a leaf getter cannot replace a
  later sibling's signal; copied containers are immutable while admitted signal/event leaves remain
  live;
- lifecycle containers and leaves must be non-proxy; this also excludes canonical
  `Dispose.omitDispose()` projections, which are Proxies; a plain `t.LifecycleView` retains terminal
  state, while an explicit observable supplies stop emissions; direct `t.LifecycleAsync` objects are
  not `t.UntilInput`, and passing any lifetime input transfers no disposal authority;
- capture each file's `content` reference without looking up or invoking its iterator method during
  static admission; the content object may be an ordinary async generator rather than a plain record;
- `maxEntries`, `maxPathBytes`, `maxPathDepth`, `maxFileBytes`, and `maxTreeBytes` are positive safe
  integers; `timeout` is a non-negative safe integer; zero selects `timeout` after exact input and
  lifecycle snapshotting but before writer claim, producer lookup, or filesystem work; and
  `expectedBytes` is a non-negative safe integer, so zero-byte files are valid;
- reject a raw path whose code-unit length already exceeds `maxPathBytes`, reject ill-formed Unicode,
  enforce raw UTF-8 bytes, normalize through Rooted's portable lexical target grammar, then enforce
  normalized UTF-8 bytes and normalized segment depth against the same path limits;
- `maxEntries` counts supplied normalized entries only; parents are never synthesized, and every
  non-root parent must be supplied as a directory entry; reject duplicate normalized paths and every
  file-as-parent conflict;
- require each `expectedBytes <= maxFileBytes`, use checked subtraction before aggregate addition,
  require aggregate expected bytes `<= maxTreeBytes`, and enforce actual per-file and tree bytes
  while consuming;
- create explicit directories non-recursively in deterministic depth-then-code-unit order, then
  create files with create-new semantics and consume file content sequentially in supplied file
  order with no cross-file prefetch;
- reject pre-existing user or Rooted metadata entries when the writer claims its stage; after claim,
  reject unexpected topology, symlinks, special files, multiply linked files, missing parents,
  collisions, and identity drift;
- admit every yielded chunk as a native non-proxy fixed ordinary `Uint8Array`, reject zero-length or
  larger-than-64-KiB chunks, and copy the complete admitted chunk through captured intrinsics before
  the first write await;
- count a valid chunk before writing, loop through short writes until it is complete, sync, stat and
  verify descriptor identity and exact size before synchronous close, then recheck pathname kind,
  identity, link count, and size after close; and
- no method overwrites, follows a link, recursively deletes, or mutates outside the verified private
  stage.

## Failure selection and cleanup ownership

Static malformed options fail as `invalid-options`; malformed batch, entry, or path values fail as
`invalid-target`; duplicate and file-parent conflicts fail as `target-collision`; and declared or
actual policy-bound excess fails as `limit-exceeded`. Producer method lookup, iterator acquisition,
`next()`/`return()` invocation or result, thrown/rejected values, invalid chunks, and early or excess
EOF relative to `expectedBytes` fail as `producer-failure` unless an owner-controlled terminal has
already won.

One private monotonic terminal latch preserves the first owner-authoritative lifecycle, limit,
producer, or filesystem failure. At each yielded result, check an already-selected lifecycle
terminal first, validate chunk grammar second, enforce policy bytes third, and enforce the declared
expected size fourth. Thus malformed chunks are `producer-failure`, a valid chunk crossing a policy
bound is `limit-exceeded`, and excess relative only to `expectedBytes` is `producer-failure`. Normal
EOF must equal `expectedBytes`. Cleanup failure is observed but never replaces the primary failure.

Construction identities detect writer failure and prevent promotion; they do not create a second
per-entry cleanup ownership ledger. Existing `rooted.Stage.discard()` continues to own current
ordinary descendants through the verified stage container, marker, and content-root identities under
the cooperative-filesystem threat model. It may remove a current replacement inside that verified
container. It refuses cleanup and may leave private residue when container-level ownership or
removal reconciliation is lost.

## Stage ownership and activity

Add one Rooted-private stage activity token and pass it into the child Rooted instance created for
`stage.files`; nested stages inherit the complete ancestor token chain. Every externally initiated
operation through any retained or destructured descendant method acquires one ancestor-aware borrow
before I/O. Creating-instance `Tree.inspectSeal(stage)` and `Tree.seal(stage)` use the same token.
Whole-stage sealing requires zero live borrows in that stage's subtree and holds a temporary sealing
exclusion through its complete method and handle settlement. New descendant admissions check that
exclusion along their ancestor chain, preventing sealing and a nested writer from overlapping in
both orders. Ordinary shared borrows still coexist; sealing does not consume the writer claim.
Composite operations such as `Tree.removeBatch` reuse their admitted outer borrow for internal calls
rather than reacquiring authority. The token is a Rooted stage mechanism, not a generic activity
framework.

A borrow spans the complete method promise and every file or mode handle owned by that call. Frozen
target, stage, and instance handles do not themselves retain a borrow; later calls through them must
re-enter the guard. A returned child lease does not keep an ancestor borrow for its caller-owned
lifetime. Its ordinary operations must re-enter the guard, while `lease.release()` remains
cleanup-only and callable after revocation under its existing Rooted settlement contract. Any lease
acquisition leaves Rooted metadata, so the writer's pristine-stage check rejects a stage used for
that purpose.

The writer is single-use with internal state `unclaimed | writing | complete | failed`. Its first
call atomically claims writer ownership only while the creating stage is active, no borrow in its
subtree is live, and the ancestor chain admits new work (including no whole-stage sealing); otherwise
it rejects `invalid-state` without waiting. Once claimed, every ordinary
`stage.files` or descendant operation rejects before I/O. The writer then verifies that the stable
content root has no entries. A non-pristine stage fails as `invalid-state`, remains writer-claimed,
and can only be discarded. Success becomes `complete` only after every producer, write, sync,
descriptor/path check, and proven handle closure settles. Any failure becomes `failed`.

Promotion atomically changes `active` to `promoting` only with zero live borrows and, for a
writer-claimed stage, writer state `complete`; otherwise it rejects `invalid-state` without renaming.
Only the winning promotion token may validate or mutate while status is `promoting`, so internal
validation does not incorrectly require the public `active` state. `writing` and `failed` stages
cannot promote.

Discard's destructive prepublication transition wins only from `active`; a competing `promoting`
operation makes it reject `invalid-state`. Once discard wins, it changes status to `discarding`,
blocks new borrows, aborts an active writer through the stage-owned controller, and awaits already
borrowed operations and proven handle closure before container validation and removal. Promotion then
rejects. `discarding` records admission revocation, never cleanup authorization. Each destructive
attempt must retain prior successful ownership and closure proof for the exact stage identities or
re-establish that proof; failed validation or unresolved closure remains unauthorized. If a borrowed
host operation never settles or closure cannot be proved, discard has no bounded settlement claim and
must not remove the stage. Existing cleanup of residual containers from a settled `published` stage
remains retryable through `rooted.Stage.discard()`.

An unclaimed stage retains existing sequential manually constructed-stage behavior; in-flight
admission fences whole-stage sealing, promotion, and discard. Idle long-lived child handles do not acquire stronger
lifetime guarantees. No operation admitted after writer claim, promotion, or discard begins may
mutate the stage, and no descriptor write may occur after publication or removal.

## Producer lifecycle and deadline

Paths, counts, yielded bytes, and executable `AsyncIterable` behavior are untrusted. The monotonic
deadline starts at `writeTree` invocation before option and batch admission. After exact input and
lifecycle snapshotting, check the deadline before claiming the writer; zero timeout therefore leaves
the stage unclaimed and performs no producer or filesystem work. Rearm finite host timers against the
remaining deadline, capped at the canonical native-delay maximum; do not pass an oversized timeout
directly to a host timer.

After complete static admission:

- look up and invoke each file's async-iterator method exactly once only when that file becomes
  current; inherited ordinary async-generator methods are valid, while lookup/call failure is
  producer execution failure;
- never acquire or pull a later file early, and invoke `next()` serially with no second call until the
  first settles;
- require ordinary object iterator results and treat a valid `done: true` only as source EOF, which
  succeeds only at exact `expectedBytes`;
- on cancellation, timeout, write or sync failure, malformed iterator behavior, or another early
  exit, select the primary terminal and revoke the writer token before producer cleanup;
- invoke callable `return()` at most once when present, never invoke producer `throw()`, and attach
  settlement and late-rejection observers to every abandoned `next()` or `return()` promise;
- await producer cleanup only while it settles within the remaining deadline; after expiry, do not
  wait indefinitely behind a pending `next()` or queued `return()`; and
- settle the independently owned file handle without allowing producer-cleanup failure to replace
  the primary terminal.

Iterator-method lookup, iterator acquisition, and the synchronous prefixes of `next()` and
`return()` are cooperative JavaScript boundaries that cannot be preempted. A late producer result
cannot write because the token is already revoked and the producer never receives filesystem
authority.

Timeout is a logical deadline and terminal-selection rule, not an unconditional wall-clock bound on
filesystem cleanup. Rooted checks it before and after every host operation, but the current IO seam
cannot cancel an already pending `open`, `write`, `sync`, or `stat`; writer and discard settlement may
therefore wait for non-cooperative host IO. `FileHandle.close(): void` remains the truthful
synchronous private seam and is not widened solely for delayed test doubles. If close throws and
closure cannot be proved, record unresolved private handle authority, fail the writer, and make
discard refuse destructive cleanup rather than pretending an attempted close settled the resource.

No partially constructed destination becomes visible. A published result followed by a Rooted
cleanup error is a committed failure: the complete destination may exist and must not be deleted
speculatively.

## Proof

Owner tests in `@sys/fs` prove:

- only an active, zero-borrow, pristine creating stage accepts its one writer claim; empty trees and
  zero-byte files succeed, while zero timeout and pre-aborted, disposed, or synchronously terminal
  lifecycle input leave it unclaimed and perform zero producer or filesystem work;
- native dense-array and exact-record snapshotting rejects sparse arrays, extra string/symbol keys,
  non-ordinary prototypes, accessors, proxies, malformed Unicode, raw path excess, missing explicit
  parents, collisions, and prefix conflicts before producer invocation or mutation; the captured
  operation remains invariant despite later container mutation, while current path normalization is
  proved non-expanding and normalized depth remains independently bounded;
- boundary tables cover positive safe limits, non-negative exact expected sizes, checked aggregate
  arithmetic, exact path/depth/entry/file/tree boundaries, EOF underflow/overflow, simultaneous
  producer/policy violations, and exact operation/kind/commitment selection;
- deterministic non-recursive directory creation and create-new file writes preserve explicit
  parent-first topology and supplied file order;
- each content iterator is acquired exactly once only when current; ordinary async generators,
  serial demand, no cross-file prefetch, normal EOF, malformed results, throwing lookup/acquisition,
  early or missing `return()`, delayed/non-settling cleanup, and late rejection preserve the producer
  boundary;
- short writes, exact non-empty and 64-KiB chunk boundaries, whole-chunk snapshot before the first
  write await, mutation after yield, policy/expected byte precedence, sync, pre-close descriptor
  verification, synchronous close, and post-close path verification are enforced;
- timeout uses a monotonic rearmed deadline, races delayed or non-settling producer promises, revokes
  writes before `return()`, observes late settlement, and never claims bounded non-cooperative host
  IO settlement;
- synchronous close failure leaves closure unproved and makes discard refuse removal; ordinary
  write/sync/close failures that do settle release their borrow before retryable discard;
- discard revocation alone never authorizes removal: failed ownership validation followed by retry
  removes nothing, while cleanup previously authorized for the same stage identities remains
  retryable after partial removal;
- a central guard-coverage test enumerates descendant public operation entrypoints, while focused
  races prove an existing borrow versus writer claim, retained/destructured methods, nested stages,
  creating-instance seal/inspect, ancestor sealing versus a nested writer in both admission orders,
  composite-operation re-entry, and promotion/discard competition;
- writer claim, promotion, and discard block new descendant work at their exact transitions;
  promotion's internal token remains valid in `promoting`, writer-owned promotion requires
  `complete`, and failed writers never promote;
- unexpected entry and identity drift fail construction, while discard retains container-owned
  cleanup, refuses container-level ownership loss, and preserves existing manual-stage behavior;
- no destination is visible before `rooted.Stage.promote()`, no descriptor writes after publication,
  and occupied, published, committed-cleanup, and ownership-loss outcomes preserve existing Rooted
  contracts; and
- producer-thrown forged Rooted failures cannot select a trusted operation, kind, or commitment.

Use representative transition tests plus central guard enumeration rather than a Cartesian test for
every method/race combination. Run all Rooted unit and process proofs, package check, and affected
workspace tests. The immediately following ZIP extraction item in `zip.plan.md` must adopt the landed
writer and prove the structurally compatible tree-sink boundary.

## Non-goals

- no archive-format or compression semantics and no runtime dependency on `@sys/archive` or Driver
  Pi;
- no destination selection or orchestration;
- no overwrite, merge, recursive deletion, or selective tree construction;
- no symlinks, hard links, special files, ownership, modes, ACLs, xattrs, or timestamp restoration;
- no public payload-stream abstraction beyond standard `AsyncIterable<Uint8Array>`;
- no generic activity framework, per-entry cleanup provenance ledger, or asynchronous file-close seam;
- no strengthening of existing manual-stage or returned-lease lifetime guarantees beyond operation
  admission and the in-flight borrow fence;
- no claim of confinement against a hostile same-user process mutating filesystem ancestry; and
- no claim that staging, syncing, or cooperatively coordinated publication establishes provenance,
  native atomic no-replace behavior, or persistence across sudden power loss.
