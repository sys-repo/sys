dispose-until-snapshot.plan.md
- [x] cbab2f17d refactor(std): centralize bounded cancellation-input admission

## Closeout

The primitive, readonly type compatibility, both immediate adopters, independent tests, and prepared
Pi artifact landed together in the opening commit. Its subject and identity reconcile to reachable
history. Closeout found no subsequent changes to the Snapshot/Server implementation or either
consumer admission file; the historical verification record below remains scoped to that delivery.

No implementation, consumer adoption, or required proof remains. Rooted adoption and shared deadline
mechanics are separate opportunities, not incomplete work in this plan. Preserve this completion
snapshot in history before archiving it; the retired ZIP plan retains its checked reference to this
exact filename and path.

## Purpose and relationship to ZIP

Centralize the cancellation-container admission already implemented by Archive and Fs Snapshot as
`Dispose.Snapshot.until()`. This is behavior-preserving maintenance for those consumers, with an
additive public primitive and a readonly type-contract correction; it is not a generic `operation()`
framework or a change to cancellation/deadline execution.

The concrete adopters replace the former `snapshotUntil` traversal and its wrapper in:

- `code/sys/archive/src/m.Zip/u/u.input.ts`; and
- `code/sys/fs/src/m.Snapshot/u/u.input.ts`.

This plan owns the primitive, type compatibility, both call-site replacements, independent tests,
and affected Driver Pi artifact regeneration as one coherent commit. Do not land an unused shared
API and leave adoption to another plan.

The completed ZIP snapshot at
`122e8b283:-agent/-plan/@sys.archive.zip/zip.plan.md` retains a checked reference to this plan.
ZIP was subsequently retired in `4e59fdd53`. That reference participated in ZIP closure, not
admission of the preceding extraction implementation. The shared primitive preserves the preceding
ZIP/Snapshot admission contract; this historical backlink is not a reciprocal prerequisite.

The independent Rooted plan is preserved at
`f105e983e:-agent/-plan/@sys.fs/rooted-streaming-tree.plan.md` and was retired in `35f32ae37`.
Its implementation and proof remain separate. This maintenance neither migrated Rooted nor made
it depend on this plan. Shared type compatibility required coordination, not a prohibition on
independent work.

Planning, review, and readiness do not authorize implementation or Git mutation.

## Runtime owner and platform boundary

Add an opt-in `@sys/std/dispose/server` entrypoint exporting the frozen `Dispose` namespace extended
with one frozen `Snapshot` namespace. Preserve the existing Dispose methods by reference; do not
mutate or extend the universal runtime object. `@sys/std/dispose` and existing `Rx` aliases retain
their existing runtime surfaces and behavior.

```ts
import { Dispose } from '@sys/std/dispose/server';

const captured = Dispose.Snapshot.until(input);
const life = Dispose.abortable(captured);
```

`Snapshot` names capture of an input representation. Existing `Dispose.until()` continues to adapt
inputs into observable stop signals; this primitive does not replace that operation.

The snapshot concept and its types are general. The runtime restriction is required by trap-free
proxy rejection through `Is.Native.proxy` from `@sys/std/is/server`, backed by `node:util.types`. It
is not a filesystem or network restriction. Preserve the native classifier's initialization
precondition; browsers provide no equivalent standard proxy detector. Do not weaken admission to
obtain a universal import, inject a classifier framework, or leak the server runtime into browser
entrypoints.

House capture behavior under `code/sys/std/src/m.Dispose/m.Snapshot/` and the server composition
under `code/sys/std/src/m.Dispose/m.Server/`. Add only the necessary package export/import wiring.
Keep the public type contract in the canonical Dispose type plane, with no server runtime imports.

## Public type contract

Under `t.Dispose.Snapshot`, expose:

```ts
type Lib = {
  readonly until: (input?: unknown) => Until;
};

type Until =
  | Exclude<t.UntilInput, readonly unknown[]>
  | readonly Until[];
```

The leaf union projects from the canonical input vocabulary rather than duplicating its members.
`Until` promises recursively readonly containers, not readonly lifecycle objects, deep freezing of
leaves, a captured cancellation state, or transferred disposal authority. Bounds and admission truth
come from construction, not from the descriptive type alias; do not introduce a brand or trust
token.

Under `t.Dispose.Server`, define `Lib` as the existing `t.Dispose.Lib` plus
`readonly Snapshot: t.Dispose.Snapshot.Lib`. Do not add `Snapshot` to the universal `Dispose.Lib`.

Before this refactor, canonical `DisposeInput` in `code/sys/types/src/t/t.Dispose.ts` used mutable
recursive arrays; `UntilInput` aliases it. Widen that array branch to `readonly DisposeInput[]` so both
existing mutable inputs and captured readonly outputs fit existing lifecycle call boundaries. Keep
all leaf alternatives unchanged. Prove assignability and consumer compatibility; do not bridge the
mismatch with casts, copied mutable arrays, or a second lifecycle-input vocabulary. This input-type
widening does not authorize runtime changes or unrelated readonly migrations. If compatibility
requires a broader behavioral change, stop and report the concrete conflict.

## Exact capture behavior

Preserve the current consumers' admission semantics:

- Omitted input and top-level `undefined` return `undefined`. A valid scalar lifecycle leaf is
  returned by identity. Empty arrays remain valid; nested arrays retain their shape and order.
- Copy and freeze every admitted array container without mutating the source or freezing its leaves.
  Repeated leaf identities remain valid. Reject cycles and repeated array-container identities,
  including acyclic shared containers, as the current visited-set contract does.
- Enforce at most 256 total input/array nodes, counting nested `undefined` placeholders, and at most
  32 nested array levels. Check array length against the remaining node budget before bulk key or
  descriptor collection. These are fixed admission bounds, not caller-configurable knobs.
- Require native non-proxy dense ordinary arrays with `Array.prototype`, their ordinary length, own
  enumerable data at every index, and no extra string or symbol keys. Reject sparse arrays,
  accessors, subclasses, and malformed containers without invoking container getters or iterators.
- Reject direct proxies and proxy-bearing prototype chains before structural leaf validation.
  Preserve existing canonical `Is.untilInput` leaf semantics: getters on structural lifecycle leaves
  may execute as caller-provided code. Retain live leaf references, not captured property values.
- Do not subscribe, dispose, create timers, yield, or perform filesystem work. Validation is
  synchronous but is not a purity or bounded-wall-clock claim about executable leaf getters, host
  reflection, or arbitrary caller code.
- Invalid input or a failure during capture rejects synchronously with
  `TypeError('Invalid UntilInput')`; never interpolate input data or arbitrary thrown text. Admission
  refusal has no own `cause`. Exceptions during capture are retained opaquely by identity in an own
  `cause`, including a thrown `undefined` or a TypeError from an earlier capture. Distinguish refusal
  by a private internal identity, not an exception's type or message. The primitive supplies no
  Archive/Fs failure kind, authenticated domain error, or error factory option.

This captures cancellation containers only. Do not absorb general options-record validation, byte
ownership, path policy, or other defensive admission into a universal validation framework.

## Consumer adoption and compatibility

Replace the duplicated cancellation-container traversal in Archive and Fs Snapshot with the shared
primitive. Keep their options validation, public-operation start times, initial lifecycle
settlement, checkpoints, timeout selection, and cleanup exactly where they are.

Each consumer retains its own error boundary: map admission refusal to its existing authenticated
`invalid-options` failure. For capture exceptions, recover the wrapper's own data cause without
reading inherited properties and apply the owner's existing authentication and wrapping rules.
Archive preserves authenticated failures as the outer operation error's direct cause and other
exceptions as its nested cause; Fs rethrows its authenticated failures by identity and maps other
exceptions to `invalid-options` without a cause. Preserve public error fields and bounded messages.
Do not expose the primitive's wrapper TypeError as a new consumer failure ABI. A caller-thrown
TypeError remains ordinary opaque provenance, not an admission-refusal discriminator.

Leaf behavior remains live after capture; pre-terminal and synchronously emitting inputs still
settle through existing lifecycle machinery before byte or filesystem work. Capture retains the
existing depth-first ordering, not an atomic snapshot guarantee against executable leaf getters
that mutate not-yet-visited sibling containers.

Keep both `u/u.operation.ts` implementations unchanged. In particular, preserve Archive's
operation/entry context and Snapshot's terminal-cause and successful-settlement checks.

Regenerate/admit the affected read-only Driver Pi ZIP artifact from the adopted owners in the same
commit. Preserve its `node:util` / `node:zlib` import boundary, policy injection, byte ownership,
limits, and runtime grants. Use the current build owner; do not introduce another bundle path,
private Pi import, provider proof, process harness, or permission grant.

## Proof and completion boundary

Independent std-owner tests must establish:

- scalar/undefined/empty/nested behavior, exact node/depth limits and plus-one refusal, placeholder
  counting, repeated-leaf acceptance, and cycle/shared-container rejection;
- frozen copied containers, preserved shape/order and leaf identity, and immunity to later caller
  array mutation without freezing or disposing caller leaves;
- sparse/extra-key/accessor/proxy/subclass refusal, zero container getter/iterator/proxy-trap calls,
  valid structural leaf getters, fixed failure text, opaque exception provenance (including thrown
  undefined, hostile values, and lookalike TypeErrors), and no subscription during capture;
- readonly output cannot be mutated through its public type and can be passed directly to existing
  lifecycle APIs without casts; existing mutable callers still compile;
- pre-aborted signals, disposed views, synchronous observable emission, live cancellation, and
  subscription disposal retain their existing behavior when capture precedes lifecycle creation; and
- frozen server composition, identity of inherited Dispose methods, and a universal/browser import
  graph that does not acquire `node:util` or the server snapshot runtime.

Retain Archive and Fs Snapshot boundary/cancellation/error regressions and direct Snapshot-to-Zip
interoperability. Independently pin Archive's ordinary-exception cause chain, authenticated failure
operation/entry context, Fs authenticated failure identity/kind, refusal mapping, bounded messages,
and absence of exception inspection or coercion. Run Rooted regressions as compatibility evidence
without modifying its scope or attributing concurrent writer work to this item. Run checks/tests for
`@sys/types`, `@sys/std`, and `@sys/archive`; run Fs `check`, `test:unit`, and `test:process`; run
Driver Pi `prep:zip`, `check`, ZIP owner tests, and `test:unit`, using each package's configured tasks.
Run scoped formatting/lint, whitespace checks, and affected workspace type checks for the shared
input vocabulary.

A compile/test failure caused by readonly-input widening is a compatibility finding to adjudicate,
not permission for casts or a repository-wide rewrite. Report unrelated concurrent failures
separately. Keep source, type/export wiring, owner tests, immediate adoption, and prepared artifact
coherent; passing tests do not establish live Pi callability.

### Verification evidence

The exception-provenance regressions failed before the correction and passed afterward. They pin
opaque thrown values, thrown undefined, lookalike TypeErrors, owner authentication and context,
fixed messages, and refusal to read an inherited TypeError cause getter.

Post-correction verification through the declared tasks passed:

- Workspace `check`: 54 packages, zero failures.
- Types `test`: 21 passed / 79 steps; seven steps ignored.
- Std `test`: 195 passed / 2,269 steps.
- Archive `test`: 13 passed / 100 steps.
- Fs `test:unit`: 70 passed / 662 steps; `test:process`: four passed / six steps.
- Driver Pi `test:unit`: 69 passed / 434 steps; the ZIP-filtered rerun passed three / 15 steps.
- Scoped source/artifact formatting, source lint, and Git whitespace checks passed.

Driver Pi `prep:zip` regenerated and admitted the artifact from the corrected owners through the
existing build path. Its digest was
`sha256-33cfeb195a8315f064c2f12300805fc0e084c9ea40c2dcf6596d6578bffaae70`.
The universal Dispose/Rx browser fixture bundled successfully without externalizing `node:util`.
Both operation runners, Rooted, and the ZIP source/build owners retained their pre-refactor bytes.
These are bounded package/build proofs, not full-workspace runtime, browser-execution, or live
Pi/provider-loop release evidence.

## Non-goals and deferred opportunity

No Rooted adoption, stage activity abstraction, deadline runner, timer rearming refactor, new
lifecycle execution API, configurable admission policy, generic snapshot framework, or browser
proxy-detection fallback belongs to this item.

The duplicated cooperative deadline mechanics remain a separate opportunity. Any later proposal must
establish its own narrow contract while preserving owner-specific failure/settlement behavior and
coordinate with [time-canon.plan.md](./time-canon.plan.md). That opportunity is neither this plan's
implementation item nor a prerequisite for its completion.
