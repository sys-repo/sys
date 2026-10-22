# Original @sys agent kernel

## Decision and evidence status

Design direction: an original, headless, @sys-derived agent kernel serving our own UI through
existing Cmd<T> mechanisms. Pi is a reference for behavior and failure cases, not an implementation
foundation. The subject is a bounded conversation loop, not a replacement coding-agent platform.

This document consolidates Phil's explicit zero-Pi requirement, the second blind design review
supplied in conversation, and the subsequent design discussion. It is a synthesis, not a verbatim
review transcript or an independently executed proof.

The supplied review's verdict was conditional GO for a small original kernel, not a validated Pi
replacement. Its source observations and test references were not independently re-audited during
this documentation pass. No tests, builds, prototypes, provider calls, dependency changes or runtime
migration were performed to establish this design.

The earlier [research report](report.md) remains historical evidence. Its reuse-first recommendation
predates the clarified ownership requirement and is not the chosen direction. Source-level lessons
remain useful; the comparison does not authorize retaining Pi in the destination.

The abandoned upstream proposal/adoption workflows are closed. The
[plan's closure receipt](../agent-kernel-research.plan.md#closed-upstream-path-and-recovery-evidence)
preserves the issue outcome, published patch, validation locations and landed support-work references.
Their removal does not delete the working integration or the separate OSS patch.

## Hard requirements

- No direct or transitive Pi runtime or type dependency in the new kernel and its proposed adapters.
- No vendored, extracted, copied or mechanically translated Pi implementation, including tests.
- No Pi-compatible API, serialized contract or hidden provider/auth helper.
- Use existing @sys primitives where they fit, rather than inventing another transport/framework.
- Own the UI and public contract. Neither CLI nor TUI is required by the kernel.
- Keep model, tool, storage and lifecycle effects explicit. The core must be independently testable.
- Preserve the working integration during future experimentation; this design does not authorize
  removing it, changing its dependency pin or weakening its tool/security policy.

Zero Pi does not require zero dependencies. An independently selected non-Pi model client or SDK
may sit outside the kernel. Audit both runtime and type reachability; renaming a Pi type is not
independence. Existing unrelated Pi dependencies elsewhere in the workspace do not by themselves
contaminate a new isolated graph.

## Minimum subject

One serial conversation loop, one host-owned run lifetime, one fixed model binding initially,
one capability-bound tool dispatcher, and submit / observe / cancel operations through Cmd<T>.

```text
our UI
  → existing Cmd transport
  → host conversation owner
      → original serial kernel
          → selected non-Pi model client
          → host-authorized tool dispatcher
      → context policy, records and bounded observation
```

| Area | Owns | Does not own |
| --- | --- | --- |
| Kernel | Loop decisions, finalized call/result accounting, cancellation precedence, limits and one terminal outcome | Provider login, filesystem, environment, subprocesses, UI or Pi profiles |
| Model client | Concrete protocol, streaming finalization, strict final argument parsing, usage and private continuity | Tool authority, UI lifetime or automatic expansion into a multi-provider framework |
| Tool dispatcher | Trusted capability set, strict validation, current authorization, bounded effects/results and uncertainty classification | Permissions derived from model output or arbitrary executable discovery |
| Context policy | Valid bounded projection before every model request; separately installed summarization policy | Destructive replacement of retained history or pretending visible text is all provider state |
| Host owner | Admission, principal/run authority, run supervision, record ownership, IDs/time, observation and optional persistence | Treating a transport disconnect as an implicit run cancellation |
| Cmd/UI adapter | Validated commands, bounded sanitized state, reconnection and rendering | Mutable kernel state, credentials or automatic durable execution |

A pure transition/effect model is a promising form, not a requirement to create a generic reducer,
actor, workflow engine or plugin framework. The proof must justify each abstraction with behavior.

## State and invariants

Keep three distinct data surfaces:

1. Conversation records: accepted input, finalized replies, call identities, outcomes and interruption
   facts. An in-memory record is not a durable commit.
2. Request context: the bounded projection prepared for one model request.
3. Private model continuity: binding/version-specific material needed for subsequent requests;
   associated with the relevant reply, excluded from UI payloads and credential storage.

Candidate run state: run ID, host epoch, phase, active-effect identity, record position, pending calls
and outcomes, attempt/limit counters, cancellation intent and one terminal outcome. Exact field names
and public types remain design proposals, not implemented @sys APIs.

Essential invariants:

- One active run per conversation; initially reject busy admission rather than create a queue.
- Model previews are provisional display state. They never authorize tool execution.
- Only a successfully finalized response supplies executable calls. Strictly parse and validate the
  entire call set, identities and known tool names before its first dispatch; do not coerce invalid
  arguments into a different accepted meaning.
- Recheck cancellation, current authority and active-effect identity after awaited preparation and
  immediately before dispatch. Fence callbacks by host epoch, run ID and effect ID.
- Classify tool outcomes as known, not started or unknown. Cancellation is not rollback. Unknown
  external outcomes block automatic replay/continuation and require host reconciliation.
- Prepare and budget every model request, including the request after tool results.
- Preserve coherent call/result relationships and required private model continuity.
- Bound model/tool attempts, input, output, retained history, snapshots and observation resources.
- Completion and cancellation are linearized by one owner. A stale callback cannot resurrect a run
  or produce a second terminal outcome.
- Complete means a valid model response ended without more calls, not that the user's objective was
  independently verified. Missing usage remains unknown rather than invented as zero.
- Cmd envelope validity and namespace routing do not establish payload validity or authorization.
- No UI/network observer may control canonical execution or make buffering unbounded.
- Persistence and recovery claims require their own successful storage/host contract. A small loop
  is neither a sandbox nor an exactly-once external-effect system.

## Minimal trace and failure behavior

```text
submit
→ validate/authorize and record admission
→ prepare request one
→ model previews (display only)
→ complete response with strictly valid tool call
→ record reply and required private continuity
→ recheck cancellation and authority
→ execute one host tool
→ record known result
→ prepare request two, including result and fresh budget check
→ final response without calls
→ record reply and settle once
```

No new effect starts after cancellation wins. A started effect may still have acted. Unknown outcome
is not an invented failed result that encourages a retry. Late evidence belongs to reconciliation,
not a second terminal event.

A storage failure before dispatch prevents dispatch. A failure after an effect may leave uncertainty;
do not report durable completion or automatically repeat the effect. A non-cooperative tool cannot
be declared safely stopped merely because an AbortSignal was raised.

Initial policy: no automatic retries. Known tool-domain failures may become model input under explicit
policy; permission denial and uncertain effects must not become generic invitations to try again.

## Cmd interaction and observation

Reuse the real Cmd contracts, with domain validation and authorization at ingress:

- **submit:** admit a run and return a receipt. An identical retry under the same authorized stable
  submission identity returns the same admission; different input under that identity conflicts.
  A transport request ID is not the application's stable run/submission identity.
- **observe:** obtain current sanitized state and subsequent changes according to the selected
  bounded observation strategy. Canceling this request cancels only observation.
- **cancel:** explicitly authorize cancellation of a particular run. Acknowledgement is not proof
  that an external effect was undone or the run has settled.

Admission, observation and run lifetime are distinct. After admission, the host supervises the run
independently of the UI request signal. The UI can reconnect while the host remains alive. A host
restart cannot silently re-admit an old uncertain submission; a resident-memory baseline uses a new
epoch and rejects stale identities.

The second review proposes demand-driven, versioned snapshots with at most one outstanding observer
request, avoiding queued token events. This is a candidate simplification for the first proof, not a
permanent `Events = never` product requirement. Bounded/coalesced Cmd streaming remains an option
for the eventual UI if its end-to-end buffering and reconnection behavior are proved.

Snapshot capture and waiter attachment need a single ownership boundary to avoid missed changes.
Bound snapshots and admission receipt retention; reject capacity exhaustion rather than silently
forgetting idempotency state. Token previews may coalesce, but canonical outcomes cannot be silently
lost. No transport reconnect/replay guarantee follows merely from using a WebSocket adapter.

## Deliberate scope reductions

First proof candidates: text-first input, serial tools, one active run, one fixed model binding,
in-memory host ownership, explicit limits and no automatic retries.

Exclude initially: parallel tools, steering/follow-up queues, provider switching, session trees,
extension/package/skill discovery, dynamic tool installation, nested agents, terminal machinery,
interactive login and durable workflow scheduling.

Long-session context management is an intended product need. The offline proof may explicitly reject
an over-budget request without summarizing. That is a stated proof limitation, not permission to drop
compaction from the eventual usable system. Add summarization as an explicit context policy, retaining
raw history and atomically adopting a valid new projection. It must not split pending call/result
relationships or adopt a truncated/failed summary.

Resident-process reconnection is not eviction-safe execution. A durable host would separately need
admission/intent/outcome recording, recovery rules and wakeup ownership. Do not import that framework
into the first kernel merely because an evictable worker is a possible future host.

## Smallest later proof (not authorized by this record)

One original offline implementation slice, with existing Cmd, scripted model completions, one fake
serial tool and an in-memory/fault-injected host. Use @sys testing conventions and original fixtures.
No Pi dependency, copied Pi fixtures, real UI, credentials, model network call or production store.

| Case | Required assertion |
| --- | --- |
| Normal tool turn | Two model requests, one tool invocation, one terminal outcome |
| Preview followed by malformed/truncated completion | Zero tool starts |
| Cancel during preparation/authorization | No subsequent effect starts |
| Simulated effect happened, reply lost | Unknown outcome; no automatic retry |
| Lost admission response and duplicate submission | Same receipt, no duplicate execution |
| Observer disconnect/reconnect | Run survives; current state is recovered |
| Slow observer with many previews | Bounded observation state |
| Large tool result and opaque continuity | Preparation runs before request two; marker and call/result pairing preserved |
| Recording failure or owner restart | No false durable completion or silent old-epoch readmission |
| Unauthorized/malformed command | No mutation, leakage or execution |
| Late callback or observer failure | No resurrection, duplicate terminal or stranded host outcome |

The fixture model must require the prior opaque marker and correctly paired tool result before its
final response. A text-only history that accidentally succeeds must not pass.

This proves only the owned semantics under the tested host. Separately prove the complete new import
graph and fixture execution on every claimed runtime, including validation paths and initialization.
Local workerd is a candidate, not established compatibility or a chosen host. TypeScript compilation
or successful import alone is insufficient. Runtime proof must not broaden authority after a denial.

## Decisions left open

- First concrete non-Pi provider/protocol/auth route and independent entitlement/support evidence.
- First runtime and host lifetime: resident process versus eviction/restart requirements.
- First tool capabilities, especially writes, and reconciliation of uncertain effects.
- Concrete limits and whether text-first/serial/fixed-model reductions meet the first use case.
- Long-session context policy and eventual observation strategy.
- Actual module/package name and landing location; use canonical human-led scaffolding when approved.

These choices do not require another broad research pass before discussing a bounded offline proof.
They do prevent presenting the prototype as provider/auth/deployment parity with the existing system.

## Evidence anchors for resumption

The supplied second review reported these baselines, not runtime verification:

- sys: `/Users/phil/code/org.sys/sys` at `cedb7a8527c5bbec9b1c983506aad5405e2fe3d1`.
- Pi reference: `/Users/phil/code/-oss/pi` at `7e44966e33f1bc1b8060f71eca5a53fbb5fa8606` (1.3.0).
- Driver-Pi default: 0.85.1 according to `deps.yaml`, `imports.json` and
  `code/sys.driver/driver-pi/src/m.cli/u/u.resolve.pkg.ts::resolvePkg`; overrides were possible and
  actual running selection was not established.

Key source pointers reported by the review, to reopen before implementation:

- `code/sys/event/src/m.cmd/t.ts`, `u.client/u.create.ts`, `u/u.host.ts`: request-scoped lifecycle.
- `code/sys/event/src/m.cmd/m/m.Is.ts`: envelope validation, not domain authority.
- `code/sys/event/src/m.cmd/u.client/u.iterator.ts`, `m.transport/u.from.WebSocket.ts`: buffering and
  transport limits, not reconnection/replay guarantees.
- `code/sys/schema/src/m.core.schema/m.Value.ts`, `u.StandardSchema.ts`: conversion versus strict checks.
- `code/sys/std/src/m.Rx/mod.ts`, `u.polyfill.ts`: transitive initialization must be inspected.
- Pi `packages/ai/src/api/openai-responses-shared.ts`, `utils/json-parse.ts`: reference finalization
  failures and argument handling; not code to copy.
- Pi `packages/agent/src/agent-loop.ts`, `packages/durable/src/harness/tool.ts`: reference cancellation
  and external-effect uncertainty, not implementation dependencies.
- Pi `packages/coding-agent/src/core/agent-session.ts`, `session-manager.ts`, `packages/ai/src/types.ts`:
  context preparation, persistence and private continuity distinctions.

Future work must inspect current source and dependency graphs; this design is not API authority.
No implementation, tests, migration, upstream action or Git mutation follows automatically from it.
