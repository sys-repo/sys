@sys.driver-crdt
cmd-first-kernels.plan.md
- [x] 7b0f48ff3 test(driver-crdt): establish isolated native and immutable contract fixtures
- [x] f24076d6c test(driver-crdt): compare async-owner and native-replica mutation paths
- [ ] test(driver-crdt): prove editor reconciliation and boundary failure behavior
- [ ] docs(driver-crdt): specify draft-one contracts from topology evidence

## Purpose and delivery boundary

Design small, native-backed Cmd kernels for collaborative state. `ImmutableRef<T>` is the primary
state-manipulation contract to design from, not the architecture of the existing Automerge package.
Cmd remains the invocation/streaming substrate; native libraries retain CRDT mechanics.

This initial arc delivers bounded executable prototypes, reproducible comparison evidence, and a
proposed type-led draft-1 contract. It does not deliver two production drivers or select synchronous
versus asynchronous remote writes in advance. A recommendation must distinguish preserved
requirements from concessions; an experiment cannot approve a changed product requirement.

The repository root is `/Users/phil/code/org.sys/sys`. The experiment lives in
`code/sys.driver/driver-crdt/`. This plan is workspace-local because it crosses driver, immutable,
Cmd, and editor boundaries.

Planning and review do not authorize implementation, dependency changes, publishing, or Git
mutations. There are no prerequisite implementation plans or ceremonial review gates in this arc.
Its last item produces a proposal, not automatic authority to publish an API or proceed with
migration.

Historical review input:
[cmd-first-crdt-kernel.brief.md](../@sys.crdt/cmd-first-crdt-kernel.brief.md). This plan supersedes
that brief as the governing document; the link is not an arc dependency. Blind reviews of this plan
should derive their findings from the current plan and source, without importing earlier review
context.

## Settled design constraints

1. **Fresh package ownership.** Target the `@sys/driver-crdt` family, with intended `/core`,
   `/automerge`, and `/yjs` boundaries. Preserve the existing `@sys/driver-automerge` during
   evaluation. Do not depend on that package to implement the new kernels.
2. **Immutable state is the design anchor.** Account for draft mutation, `current`, instance
   identity, before/after values, patches, events, and path subscriptions. Read the actual contracts
   and consumers. Do not reduce the product to an application command catalogue merely because
   transport makes callbacks difficult.
3. **Timing is not settled.** An explicitly asynchronous counterpart is a valid candidate if it
   materially simplifies the system. Do not change or impersonate the current synchronous contract.
   A cached readable projection alone is not a complete writable `ImmutableRef<T>` implementation.
4. **Kernel-owned write surface.** Applications and editor adapters enter the kernel's defined
   mutation path. An unmodified native editor binding must not independently mutate a native
   document around that path. Native objects may be used internally by the driver, not exposed as a
   write bypass.
5. **Worker default, explicit placement.** Normally place Repo/storage/network ownership in a
   worker. Other placements remain possible. A native document replica in the UI is distinct from
   ownership of the worker's Repo and must be declared, measured, and lifecycle-managed.
6. **Native capabilities remain useful.** Ordinary data, collaborative text, annotations, positions,
   and richer native operations must remain accessible without an exhaustive universal facade. Keep
   native semantics visible where they differ; no function-source serialization or remote
   evaluation.
7. **Bounded Yjs support initially.** Do not build general arbitrary nested plain-object draft
   mapping over Yjs in this arc. Use native shared types and explicit mapping for the fixture
   schema. Report that limitation rather than claiming complete writable-ref parity from a
   schema-specific witness.
8. **Earn sharing.** Reuse existing system primitives. `/core` may be very small or type-only; do
   not create dummy runtime exports to complete the package diagram. Cmd streaming does not by
   itself normalize mutation intent, native metadata, or conflict behavior.
9. **No duplicate framework.** No replacement command bus, CRDT algorithm, generic plugin registry,
   universal patch/history/cursor language, or replacement peer synchronization protocol.

The intended dependency direction is each engine entry toward neutral core/system primitives and its
own upstream libraries. No sibling-engine dependency and no dependency from core to either engine.
No shared runtime barrel or root selector may import both engines. Export maps alone do not enforce
these constraints: inspect transitive module graphs. Keep public type ownership canonical and
measure type-resolution reachability separately from runtime/bundle isolation.

## Contract questions the experiment must answer

For every candidate and engine, record a compatibility matrix rather than one generic "supported":

- Where does an application callback execute, and can it capture caller-local values?
- When does `current` change, and is it native local state, a last-observed view, or optimistic
  state?
- Do retained before/after values remain stable? What native information lies outside plain `T`?
- Are patch callbacks and change events synchronous, deferred, or remote? Are annotations observable
  when plain values are equal? What does path filtering promise?
- Does an awaited result mean owner application, client observation, persistence, or something else?
- Which current immutable helpers/consumers work unchanged? Which require an explicit async
  contract?
- Which native operations are expressible, and which fixture conveniences are not general APIs?
- How are rejection, cancellation, disconnection, pending edits, and disposal exposed?

Do not use TypeScript's void-return assignability to disguise Promise-returning mutation. In
particular, `curryChangeFunction` reads `after` immediately following `change`, and immutable lenses
currently delegate synchronously. Awaiting a void result does not await remote acceptance. Keep
native mutation callbacks synchronous within their native transaction; asynchronous acquisition
happens outside that mutation section. Synchronous mutation need not imply synchronous outward
events; prove callback, patch-delivery and event timing separately.

An async candidate may keep synchronous snapshot reads. An editor may display pending input before
owner acceptance, but that pending state is additional machinery to disclose, not authoritative
`current` by implication.

## Candidates and fair comparison

### A. Async owner execution with an immutable client view

The worker owns the native document and executes native changes through installed Cmd handlers. The
client observes a coherent immutable projection. Define the result/observation ordering and report
whether an awaited write includes observing the resulting state.

Installed owner callbacks and data commands do not constitute arbitrary UI-side `change(fn)`
support. If an async draft convenience is evaluated, identify where the function runs, what
representation is submitted, and how stale bases/native capabilities are handled. Do not silently
add a general Yjs mapper. Any missing immutable contract remains a visible compatibility gap.

### B. Synchronous native-replica editing through the kernel

A kernel-owned client replica supplies real local native state. Application mutation enters only the
kernel facade; driver-private code authors native changes and exchanges native data with the worker
through Cmd. The worker owns Repo/storage/network. The UI replica has no separate peer/provider path
that bypasses the worker's admission boundary in this experiment.

This candidate does not claim that Cmd synchronously invokes a remote callback. Its local authoring
step and subsequent Cmd exchange are explicit. Whether this satisfies the intended Cmd boundary is a
named product decision in the final proposal; it cannot be approved by renaming the local write. If
the requirement is that every native mutation first execute at a worker Cmd host, reject this
candidate for that requirement rather than concealing an exception.

Local success does not imply worker acceptance. Include rejected/disconnected native submissions:
local divergence, pending work, recovery and any inability to retract an authored change are part of
this candidate's cost. Do not promise rollback or exactly-once delivery by construction.

### Challenger: synchronous optimistic plain-object proxy

Test the premise that one patch-updated object can cheaply supply the writable surface for all
engines. Use a bounded counterexample or fixture, not a third framework implementation. Include
stale list identity, dependent pending edits, a rejected first edit, and annotations absent from
plain data. If an existing primitive actually closes these cases, inspect and demonstrate it. Do not
categorically reject the candidate without evidence, or build a reconciliation engine merely to keep
it viable.

### Equal treatment

- Begin each candidate/engine with a supported-integration-seam and contract-timing witness. A
  proven incompatibility may disqualify that branch before expensive editor/performance work.
  Preserve its evidence; do not score unimplemented behavior as zero cost or build a framework to
  rescue it.
- Exercise viable A/B branches with both engines over the same real MessagePort/worker boundary. Run
  a co-located native control separately. A successful local Yjs binding is not proof of a worker
  contract. Explicitly record any disqualified branch and the scope of the remaining comparison.
- Use the same fixture schema, user actions, peer schedules, document sizes, authorization scope,
  and measurement milestones. Preserve driver-specific native outcomes where appropriate.
- Common comparison authority is document-scoped read/write access. Validate unauthorized document
  access and malformed input. Do not claim opaque native updates enforce field-level permissions;
  record stricter-policy compatibility separately.
- No candidate wins by dropping callbacks, annotations, pending input, failure reporting, or
  lifecycle requirements without naming the concession. Stale-basis rejection can be correct yet
  still fail an interaction requirement; it is not equivalent to successful collaborative
  reconciliation.
- Do not require equal conflict winners, mark expansion, cursor affinity, undo grouping, or history
  APIs. Common invariants concern declared intent, observation truth, convergence and ownership.

## Bounded fixture and proof matrix

Use one document containing a title, an ordered list of independently identifiable items, and text
with one formatting attribute and one anchored selection. Implement fixture-specific Yjs mapping,
not a general object mapper. Include one driver-specific native operation not represented by the
common value projection to prove the extension route preserves useful native capability.

Use explicit barriers and controlled peer delivery, not sleeps as correctness proofs. Initially use
one editing client, one independent native peer and a second observer for disposal checks. Add a
second outstanding local edit where a pending-input/rejection test needs it. Keep test traces
bounded.

- **Contract timing:** invoke mutation; read caller-local capture and `current` before/after return
  and acknowledgement. Establish callback location, visibility, helper compatibility and Promise
  ownership.
- **Native composition:** change title and formatting in one driver-native mutation section. Observe
  both effects and establish the actual transaction/failure guarantees.
- **Held-owner stale list:** retain client state [A, B]. Hold client submission and client
  application of owner observations; let the peer insert X before A at the owner. From the retained
  view, request an edit of B using a caller-local value. Release the held paths using only schedules
  allowed by the actual transport. Trace callback location and caller-local effects, immediate
  `current`, patches/events, acknowledgement and observation separately. Preserve B as the target or
  explicitly reject while retaining pending intent. Never silently mutate A; rejection is not
  successful reconciliation.
- **Text race:** insert b into ac while the peer prefixes X; issue another local edit before
  acknowledgement. Establish convergence, authored basis, pending-input reconciliation and selection
  validity.
- **Metadata visibility:** change only formatting; exercise a delete-only Yjs update and an
  Automerge heads-only change. Avoid false unchanged-state conclusions; capture values and metadata
  coherently.
- **Snapshot lifetime:** retain before/after values while later local and peer mutations execute.
  Retained snapshots must not change; declare native metadata ownership.
- **Initialization:** deliver a native update at observation initialization and between successive
  requests. No gaps, duplicate application, or unlabelled restart.
- **Failure phases:** throw during mutation, then separately during observation/delivery after
  mutation. Distinguish callback rollback from partial/committed effects; no error-means-no-write
  guarantee.
- **Cancellation:** hold acquisition, process cancellation at the owner, then release; separately
  cancel after commit. Prevent mutation after owner-observed precommit cancellation; retain
  postcommit uncertainty.
- **Lost receipt:** commit, drop acknowledgement and reconnect. Distinguish command re-execution
  from native update replay; no blind command retry or hidden pending/unknown outcome. If restart
  recovery is claimed, repeat across an actual owner restart and record document, actor/client,
  ref-instance and observation-session identities. Otherwise label restart recovery unsupported.
- **Rejected local edit:** reject the first locally authored edit while a second depends on it.
  Demonstrate recovery or explicit unsupported behavior without losing input or falsely declaring
  convergence. Track whether later native submissions carry the rejected history back into the
  owner; a compensating edit is not proof of non-admission.
- **Slow observer:** delay consumption while producing many native changes. Measure or declare a
  bound; distinguish latest-state observation from a lossless stream.
- **Authority/encoding:** send wrong-document, wrong-engine, malformed-range and oversized input.
  Reject at the appropriate boundary; establish fidelity only on supported transports.
- **Ownership:** dispose one observer/binding while retaining another and the native owner; then
  terminate the owner. Prove independent lifetimes, listener cleanup, settlement and resource
  release.

MessagePort is the initial transport profile. JSON-WebSocket binary support is not presumed or built
merely for parity. Declare payload limits, observation buffering policy, timeout behavior and
restart identity. Cmd's Endpoint shape does not provide native encoding, replay, backpressure, or
transport failure detection automatically.

For editor proof use a real Monaco model/editor through a kernel-owned adapter. Test rapid edits,
selection and composition behavior, not just one text replacement. Any native binding used as a
control must remain labelled as a control, not a compliant public mutation path. Include teardown
while the editor survives, with awareness/cursor listeners when that control uses them. Fake models
and source inspection alone do not close browser claims.

Use an existing authorized browser execution surface when available. If none can run the proof,
report that concrete harness/evidence gap; do not silently replace browser evidence with mocks or
install an undeclared runner. Adding required harness work must remain bounded to this experiment.

## Comparison measurements and selection rule

Correctness and contract coverage come first. Compare only compatible capabilities as equivalent.
For each candidate/engine record:

- user action to local display, owner application, client observation, and peer convergence
  separately;
- native engine instances, full document/projection copies, retained history and pending-edit
  buffers;
- messages/bytes and full materializations per scenario;
- runtime/bundle dependency closure for neutral, Automerge and Yjs entry fixtures;
- new production-shaped concepts and maintenance obligations, not just lines of code;
- unsupported behavior and assumptions, including authorization differences.

Use deterministic fixtures at 1 KiB, 100 KiB and 1 MiB text sizes with the same edit schedules.
Record runtime/browser, dependency versions, machine context, warmup/repetition method and relevant
budgets before interpreting timing. Report distributions rather than an invented universal latency
threshold. Do not compare cold startup for one candidate with warm editing for another. These sizes
are test inputs, not promises about maximum document support.

Prefer the smallest implementation that meets the chosen contract. Native replicas may remove custom
reconciliation at the cost of native state on the UI; async ownership may reduce replicas at the
cost of callback compatibility or explicit editor state. Neither trade-off is pre-approved as a
winner. If evidence cannot select a compatible option, the last item must produce the smallest
precise human decision, not an unbounded implementation or a guessed default.

## Commit scopes and acceptance

### Establish isolated native and immutable contract fixtures

Create the minimum unpublished proof area under `code/sys.driver/driver-crdt/`, with declared owning
check/test tasks and narrow permissions. Keep experiment implementations internal. Follow canonical
module/type conventions; do not create a public API merely to host tests.

Keep Automerge 3.5.0 and Repo 2.5.6 as the baseline. Evaluate Yjs 13.6.33 as an explicit pinned
proof dependency, not an implicit latest/prerelease upgrade. Dependency/workspace edits require
explicit implementation authority; planning alone does not authorize them. Inspect relevant upstream
APIs at the actual resolved versions; experimental APIs are not silently adopted.

Establish synchronous contract witnesses, native engine controls, isolated graph-entry fixtures and
controllable delivery barriers. Seed replicas from shared native history, not independently rebuilt
plain values, and record writer identities. Reuse owning package tooling. The held-owner stale-list
trace shapes these barriers; implementing and comparing A/B paths belongs to the next item.

Report static runtime reachability and type-resolution reachability separately. For runtime entry
fixtures, observe native initialization in a fresh realm at import and at first native use; lazy
initialization does not establish graph exclusion. Do not create a core runtime solely for this
check. Acceptance: fixtures distinguish native state from projections and reject
sibling/legacy-driver runtime dependency leakage.

### Compare async-owner and native-replica mutation paths

Implement only A/B fixture paths, using existing Cmd and upstream native mechanisms. Neither old
worker snapshot replacement nor ephemeral native documents rebuilt from plain snapshots are a valid
substitute for native operation identity. Avoid hidden/experimental upstream integration APIs;
report an unavailable supported seam rather than reaching through internals to force the topology.

Repo 2.5.6 exposes public `Repo.import(binary, { docId })` as a candidate existing-document
integration seam. Its declaration requires shared history for the same document ID; the installed
implementation uses native `loadIncremental`. This is source evidence of a seam, not a selected
update protocol or proof of worker admission, recovery or performance. Evaluate it without calling
hidden `DocHandle.update` directly; native integration still needs an executed witness.

Start with the held-owner stale-list witness, then extend through the timing, composition, metadata
and snapshot proofs. Explicitly demonstrate or delimit writable-ref support per engine. Evaluate the
optimistic-proxy challenger with the same semantic witnesses. Acceptance: a reproducible comparison
and honest contract matrix, not a declared winner based on aesthetics.

Keep the eight executable `*.test.ts` files under `code/sys.driver/driver-crdt/src/-test/-spec/`;
`-test.ts`, `common.ts`, and `t.ts` remain at the test root. Shared test utilities and standalone
probes live in `-test/u/`; comparison-only machinery lives in `-test/-compare/u/`. Worker URLs and
graph/probe process paths must resolve correctly from the executable specs. The owning check covers
`src/*`, following the module template rather than enumerating fixture directories. This
organization is housekeeping within this item, not a new arc item.

Automerge captured values require explicit fixture-schema projection, not a general clone of a
native document. The caller-native fixture rejects text-object replacement before merging its
mutation fork, retaining the original anchored selection and dropping the whole rejected fork.
Direct assignment and the existing text lens require separate witnesses, including subsequent-edit
usability and independently reloaded history. This is a precisely restricted writable-ref witness,
not complete immutable-ref parity or a selected replacement-selection policy.

### Prove editor reconciliation and boundary failure behavior

For viable branches, close the text/editor, initialization, cancellation, failure, rejection,
slow-consumer, authority, encoding and lifecycle proofs. For disqualified branches, retain the
precise counterexample or verified unsupported seam instead of pretending to have run the remaining
matrix. Include resource checks for workers, ports, subscriptions, native instances and bindings.
Run the comparison measurements and identify where the actual complexity lives. Keep editor policy
outside neutral core. Attribute retries and shutdown diagnostics to their owner and scenario.
Passing test counts alone do not prove lifecycle correctness; diagnostic text alone does not prove a
leak. Use explicit settlement, subscription and resource assertions for those claims. Acceptance:
executed proof with exact commands and outcomes, or explicit unmet criteria that prevent claiming
the experiment complete.

### Specify draft-one contracts from topology evidence

Write a compact proposed type spine and representative call sites under the new module's design
area. They are design artifacts, not untested public exports. State callback execution, visibility,
acknowledgement, observation, native extension, lifecycle, transport and authority guarantees.

Recommend a topology with evidence and explicit concessions, or return the precise unresolved
product choice. Explain the relationship to `@sys/crdt` without silently changing its existing
contract. If an async primitive would extend the shared immutable surface, identify the lowest
truthful owner and compatibility proof instead of inventing a driver-local imitation.

For each proposed shared primitive name its concrete adopter, semantic owner, independent proof and
what breaks if it is removed. Extracting no shared runtime is a valid result. Remove unused
experiment abstractions; retain only reproducible witnesses and useful reference implementations.
Acceptance: draft-1 proposal supported by executed evidence, explicit remaining limits, and a
bounded extraction scope. Production extraction requires a subsequent plan-scope instruction; it is
not hidden inside this documentation item.

## Existing primitives and source anchors

All paths below are relative to the repository root. Read their current implementation and relevant
tests; a type name or this plan is not proof of behavior.

- `code/sys/types/src/t/t.Immutable.ts` and `code/sys/types/src/t/t.Immutable.events.ts`: canonical
  contract plane.
- `code/sys/immutable/src/m.rfc6902/m.Immutable.cloner.ts`: local cloning/diffing reference
  behavior; not a performance or native-CRDT adapter guarantee.
- `code/sys/immutable/src/m.rfc6902/m.Events.ts` and
  `code/sys/immutable/src/m.rfc6902/m.Events.path.ts`: event adaptation/filtering; inspect
  synchronous assumptions and patch-path representations.
- `code/sys/immutable/src/m.core/m.Immutable.Lens/u.make.ts`: existing synchronous consumer
  behavior.
- `code/sys/std/src/m.Async/`, `code/sys/std/src/m.Async.Await/`, and
  `code/sys/std/src/m.Async.Schedule/`: inspect `singleton`, `Lease`, `Await.semaphore`, and
  scheduling before inventing ownership/queue helpers. A semaphore only orders work admitted through
  it; `Schedule.queue` is not a serial transaction queue.
- `code/sys/event/src/m.cmd/`: concrete invocation, stream, timeout, cancellation and transport
  behavior.
- `code/sys.model/model/src/m.files/`: grammar/handler/client architectural comparison, not CRDT
  policy.
- `code/sys/crdt/src/types/t.m.Ref.ts` and `code/sys/crdt/src/types/t.ns.Crdt.ts`: current shared
  contract and compatibility scope.
- `code/sys.driver/driver-automerge/src/m.Crdt.Ref/` and
  `code/sys.driver/driver-automerge/src/m.Crdt.Repo/`: native integration evidence.
- `code/sys.driver/driver-automerge/src/m.worker/` and
  `code/sys.driver/driver-automerge/src/m.Cmd.commands/`: existing transport evidence, not the
  implementation skeleton or approved native mutation semantics.
- `code/sys.driver/driver-monaco/src/ui/m.Crdt/` and
  `code/sys.driver/driver-monaco/src/ui/m.Markers.Folding/`: concrete editor consumers.
- `deps.yaml`, `imports.json`, `deno.lock` and owning `deno.json` files: dependency/toolchain
  authority.

Consult official Automerge/Yjs documentation and versioned source/tests for native semantics. Record
actual source versions and distinguish source-derived facts from executed tests. Distribution tags,
prior reports, and commit subjects do not establish compatibility. Preserve unrelated worktree edits
and attribute any verification result to the exact source state used.

## Later scope and retirement intent

After topology selection, a separately authorized extension can extract the smallest production
kernels, adopt them in real consumers, and prove the final subpath graph/bundle boundaries. Do not
make `/core` a second implementation of Cmd or a competing copy of existing immutable contracts.

The intended successor is `@sys/driver-crdt/automerge`. Retire `@sys/driver-automerge` from active
`/sys` usage and deprecate its JSR package only after a consumer/capability inventory, demonstrated
migration coverage, and explicit release authorization. Verify JSR's supported mechanism at that
time; do not assume a CLI or deprecation API. Preserve historical imports; deprecation is not
version yanking. Any temporary compatibility adapter points old to new, never new to old.

This arc does not implement general Yjs object mapping, universal history/undo, durable command
exactly-once delivery, unrestricted remote native-update ingestion, automatic optimistic rebasing,
new public network protocols, consumer migration, package publication, or remote deprecation.
