# Minimal headless agent engine: boundary assessment

> Historical assessment under the earlier reuse/extract/own question. Phil subsequently required an
> original @sys kernel with zero Pi code, types or dependencies. The reuse recommendation and
> reuse-based proof below are superseded by [design.md](design.md); they are not current work
> instructions. The original analysis is retained as evidence, not runtime verification. References
> to the old PR/adoption plans and their worktree state describe the research baseline; those plans
> have since been removed as abandoned workflows. Their closure and recovery evidence is in the
> [governing plan](../agent-kernel-research.plan.md#closed-upstream-path-and-recovery-evidence).

Research decision report for `docs(agent-kernel): assess minimal headless engine boundaries`.
Governing brief: [agent-kernel-research.plan.md](../agent-kernel-research.plan.md).
This is design research, not implementation or runtime verification.

## 1. Recommendation

**Own the node contract and its policy; first try reusing Pi's headless `Agent` behind it. Do not
replace the working Driver-Pi integration or extract a kernel yet.** The inspected agent package
already separates the conversational loop from the coding-agent application. Explicit `streamFn`
injection supplies a credible seam for a selected model adapter without launching the CLI/TUI.

The smallest coherent subject is not a miniature coding-agent application. It is a **single-owner
conversation runner**, with a bounded tool/model continuation cycle and an explicit settlement
contract. Its surrounding host owns admission, authority, credentials, storage and observation.
Context preparation is a separate policy, not incidental array trimming.

Recommended responsibility split:

- **Runner:** one active run per conversation, finalized messages, tool continuation, cooperative
  cancellation and terminal outcome. Initially reuse Pi's `Agent` and tool machinery.
- **Context policy:** valid next-request projection, budgets, optional summarization and explicit
  failure. Preserve retained history independently of this projection.
- **Selected model adapter:** protocol parsing, provider metadata, request options, usage and error
  normalization. Keep auth resolution behind this adapter; never send credentials to the UI.
- **Node host:** authenticated admission, tool capabilities and limits, canonical storage,
  idempotency/recovery decisions, run lifetime and observer delivery.
- **UI/Cmd adapter:** validated commands and public snapshots/events, not mutable Pi state or a new
  transport protocol.

**Confidence:** high in the headless/application separation at the inspected Pi revision; moderate
that reuse is the cheapest fit; unproven on the eventual deployment runtime. Provider/auth,
residency and recovery requirements remain human choices. No package-size, performance, import-time
or portability result was measured.

The recommendation changes if a bounded proof finds an unavoidable forbidden runtime dependency,
if required host guarantees cannot be enforced at the existing hooks, or if dependency acquisition
itself must exclude the unused provider SDKs. If mid-turn recovery is essential, assess Pi Durable
before building an equivalent scheduler around agent-core. If Phil deliberately accepts a much
smaller semantic contract and single-provider maintenance, an owned loop becomes more credible.

### Strongest case against replacement

The custom UI does not require a new loop: `Agent` already has no terminal presentation dependency.
The difficult retained obligations are terminal stream handling, incomplete tool arguments,
call/result integrity, abort settlement, provider reasoning metadata, context policy and uncertain
external effects. Removing the CLI does not remove any of these. Pi's focused tests contain concrete
regressions and ordering rules a short replacement would otherwise rediscover [P1–P4, P8, P10].
Extraction also keeps semantic coupling while transferring maintenance to @sys. Fewer files are not
proof of lower lifetime cost. Upstream contribution history is not evidence that this boundary is
technically unstable, nor a reason to discard the working compile-cache fallback.

## 2. Evidence baseline and interpretation

All source citations use these exact roots and revisions:

| Label | Root | Inspected baseline |
| --- | --- | --- |
| Pi | `/Users/phil/code/-oss/pi` | `7e44966e33f1bc1b8060f71eca5a53fbb5fa8606`, branch `fix/optional-compile-cache`; inspected agent/AI packages version `1.3.0`; clean worktree |
| sys | `/Users/phil/code/org.sys/sys` | `cedb7a8527c5bbec9b1c983506aad5405e2fe3d1`; live source inspected with pre-existing plan changes preserved |

At entry, sys had modified `-agent/-plan/@sys.driver-pi/pi-compile-cache-pr.plan.md` and
`-agent/-plan/@sys.driver-pi/upstream-runtime-compatibility.plan.md`, plus untracked
`-agent/-plan/@sys.driver-pi/agent-kernel-research.plan.md` and
`-agent/-plan/@sys.workspace/commit-free-test-fixtures.plan.md`. They are not outputs of this report.

**Material version boundary:** sys `deps.yaml` and Driver-Pi's `PI_AGENT_IMPORT_VERSION` select
`@earendil-works/pi-coding-agent@0.85.1`, not the inspected Pi 1.3.0 source. Explicit package overrides
can supersede that default [S1]. No running installation or deployed package identity was verified.
The 1.3.0 hooks, transcript contract and provider organization must not be attributed to 0.85.1.
Reuse here is a candidate dependency selection, not an instruction to upgrade the current launcher.

Evidence vocabulary used below:

- **Observed:** control flow, imports, types or assertions opened in local source. Tests were read,
  not executed; their assertions show intended coverage, not passing results in this environment.
- **Documented:** a README, specification or live primary-source page says this. Documentation is
  not runtime proof, including when it is normative for its own project.
- **Proposed:** an @sys ownership or API decision recommended here, not an existing implementation.
- **Unproven:** portability, complete transitive initialization, deployed compatibility and live
  provider behavior. No builds, tests, installs, provider requests or credential reads occurred.

The six agent source files were the primary loop audit; focused agent tests supplied behavioral
cross-checks. AI, coding-agent and durable inspection followed relevant edges and selected paths,
not every source file or test in those packages. No CLI/TUI implementation survey was needed to
establish the direct agent dependency separation. Public research used unauthenticated primary
sources [W1–W3]. Large OpenAI responses were output-truncated; only visible relevant sections inform
this report. Live docs are not pinned to the local checkout. The brief's earlier pi.dev/RFC-index
reconnaissance is not treated as an individual RFC audit.

## 3. Observed dependency and responsibility map

### 3.1 Runtime graph, not just package names

```text
@sys UI
  → existing Cmd endpoint + owned node adapter                 proposed connection
  → owned run/session host
      → pi-agent-core Agent / runAgentLoop                     observed headless seam
          → pi-ai transcript, event stream, argument validation
          → explicitly injected StreamFn
              → selected provider/API adapter
              → host-owned auth/credential context
      → host-supplied tool implementations
      → context policy + storage

coding-agent AgentSession / SessionManager / compaction
  → application policy, extensions, settings, session entries   reference, not default dependency

pi-durable Harness / Session / ToolTask
  → durable scheduling, storage, Chord documents                conditional alternative
```

Observed dependency distinctions [P1–P7]:

1. `packages/agent/package.json` depends on pi-ai and TypeBox, not coding-agent or TUI.
   `src/index.ts` exports `Agent`, loop APIs, proxy and types. `types.ts` imports AI/TypeBox types;
   those type-only edges are not runtime provider initialization. Runtime imports in `agent.ts`
   and `agent-loop.ts` do call pi-ai transcript helpers, `EventStream` and validation.
2. Pi AI's root exports runtime helpers, model/auth abstractions, an in-memory faux provider and
   session-resource helpers. Provider option exports are type-only. Real provider factories and
   OAuth implementations are separated from the root; `/compat` restores broad legacy exports and
   built-in registration. Do not use `/compat` in the proposed node merely for convenience.
3. This is not a promise that the root loads nothing. `models.ts` reaches telemetry;
   `validation.ts` imports TypeBox compilation/value helpers; `json-parse.ts` is on the exported
   utility surface. `session-resources.ts` has a module-level cleanup registry. Explicit stream
   injection avoids agent-core's module-global default, but does not prove all shared state absent.
4. Selected factories use lazy API loading; `lazyApi` defers implementation loading until a stream
   call. The OpenAI factory also includes catalog/classifier configuration and lazy OAuth, so even
   one factory is broader than one Responses wire adapter. A direct API subpath can reduce that
   scope, at the cost of supplying model configuration and auth orchestration explicitly.
5. **Installation, loaded modules and emitted bundle size are different.** Pi AI's manifest still
   lists Anthropic, AWS, Google and OpenAI SDK dependencies. Lazy imports do not remove installation
   dependencies. Neither tree shaking nor the final acquisition/bundle footprint was proved.
6. Both manifests declare Node `>=22.19.0`. The loop uses ordinary JS promises, abort signals,
   clocks and injected tools; this is encouraging, not proof of Deno/worker/CSP compatibility.
   TypeBox compilation, dynamic imports, SDK dependencies and selected OAuth must be checked in the
   exact target. No bare-runtime permission or import probe was run.

### 3.2 What the loop actually owns

Observed in `runLoop`, `streamAssistantResponse`, tool helpers and `Agent` [P1–P4]:

- Pending inputs become message events; `prepareRequest` runs before every conversational model
  request, including the first. `transformContext` precedes `convertToLlm`, then normalization.
- System messages carry prompt/tool declarations. `declareToolChanges` reconciles executable tools
  with the transcript before requests. This is more than a plain user/assistant string list.
- Partial assistant state is provisional. A finalized assistant message precedes tool dispatch.
  An `error` or `aborted` assistant ends the loop without executing its tool calls.
- A `length` response with tool calls produces error results for all those calls instead of
  executing possibly truncated arguments. Final JSON validity alone would not be enough.
- Tool dispatch resolves a registered tool, prepares and validates arguments, runs `beforeToolCall`,
  executes, then applies `afterToolCall`. Validation may coerce values. Unknown/invalid/blocked
  calls become error results. `runToolCall` exposes the same path for nested calls, but callers
  must actually use it; arbitrary host functions do not acquire mediation automatically.
- Parallel execution is the default. Preflight is sequential; completed-tool events follow
  completion order; tool-result message artifacts follow assistant source order. Any sequential
  tool forces its whole batch sequential. A reduced node can choose sequential execution initially.
- Steering is taken at defined polls, not instantaneously during a model response or effect. Current
  tool calls finish before normal steering injection. Follow-ups wait for natural stopping.
  `finishTurn` can end before further queue polling; its `continue` requests one next response,
  not one additional response on top of tool/queue continuation. Repeated continuation can be
  unbounded. No inherent run budget follows from having this hook.
- `Agent` rejects overlapping prompts/reset while active. It keeps in-memory queues and transcript,
  but does not make them durable. Exposed state is mutable; assigned arrays are shallow-copied.
  The UI must not receive this state object or mutation authority.

**Barrier distinction:** `Agent.processEvents` first reduces internal state, then awaits listeners
in registration order. A finalized assistant's listener work can therefore complete before tool
preflight. `agent_end` is the last normal loop event, not proof that the run is idle:
`prompt()`/`waitForIdle()` settle after those subscribers. In contrast, `agentLoop()`'s `EventStream`
consumer is observational; awaiting work in its `for await` body does not impose a producer barrier.
`runAgentLoop` accepts an awaited sink, but the class supplies lifecycle/failure handling as well.
Do not pick the raw stream merely because it looks smaller [P1–P4].

There are important host obligations even with reuse:

- Never await UI/network observers directly inside `Agent.subscribe`. They would stall the runner,
  and upstream/provider event queues can still grow while consumption is slow. A barrier is not
  end-to-end backpressure: `EventStream` has an unbounded FIFO [P7].
- `StreamFn` specifies errors as terminal stream events, not rejected calls. Raw low-level wrappers
  launch a promise without a rejection-to-terminal handler. A violating stream/hook can break their
  normal terminal sequence. `Agent.runWithLifecycle` catches failures and synthesizes failure
  events; normal provider failure may therefore resolve `prompt()` rather than reject it.
- A throwing subscriber can fail event processing, including the synthetic failure path. The node
  must own one controlled sink and a separate outer outcome/settlement guard. Exactly-one public
  terminal outcome is a proposed node invariant, not a blanket claim about arbitrary Pi listeners.
- Abort is cooperative. A tool that ignores its signal can continue its external effect; cancellation
  does not establish rollback. Remaining call/result pairs may require explicit interrupted/not-started
  projection treatment after an aborted batch. No blind `continue()` on arbitrary saved state.

### 3.3 Context and persistence are not hidden in agent-core

Observed application ownership [P9–P10]:

- `AgentSession._installAgentRequestProjection` rebuilds request context from SessionManager.
  `_installAgentNextTurnRefresh` and `_compactBeforeNextAssistantResponse` coordinate later requests
  with application compaction. Settings, extensions, model routing and retry policy participate.
- `prepareCompaction` uses the projected branch and a retained-tail cut point, including split-turn
  handling. `compact` also manages previous summaries and file-operation details. Its imports reach
  application messages, SessionManager and legacy completion helpers. It is not an independent
  kernel utility just because its own functions are described as pure.
- `getSummarizationFailure` rejects a length-limited summary; regression #7048 asserts that such a
  summary is not persisted. Replacing this with “take whatever summary text arrived” is unsafe.
- `AgentSession._handleAgentEvent` dispatches extension/public events before its message persistence.
  `SessionManager._appendEntry` updates memory then `_persist` writes filesystem JSONL. These source
  paths do not establish commit-before-publication or transactional crash recovery for external tools.

**Proposed context contract:** retain canonical history; separately derive the current model-visible
projection; separately track provider cache/session/opaque state. A cache/session ID is neither a
transcript nor a recovery checkpoint. Preserve prompt/tool authority and complete retained
call/result groups. Preserve protocol-required opaque reasoning/phase items within retained active
turns; do not flatten everything to text [P8, W2].

Budget admission must exist in the first usable runner. Automatic summarization should be an
**injected context policy**, not hardcoded scheduling inside the loop. A short-session proof may
refuse an over-budget request explicitly. That refusal is not a substitute for long-session use:
a usable long-session node needs an installed, tested policy that summarizes closed history,
retains the recent coherent suffix and atomically adopts the new projection. Keep raw history.
Do not copy coding-agent's branch UI, file tracking and prompts merely to get this behavior.

### 3.4 Provider/auth choices remain separate decisions

No first provider, model, endpoint or auth arrangement is confirmed. OpenAI was examined as a
concrete counterexample to treating all auth paths as equivalent, not selected for Phil [P5–P8].

| Candidate path | Observed boundary | Unresolved before adoption |
| --- | --- | --- |
| Selected Pi AI factory + `Models` | Lazy API loading; provider-scoped auth, catalog and stream normalization | Exact factory/version, acceptable installation breadth, injected credential store and non-ambient auth context |
| Selected Pi AI API subpath | Responses adapter can be called with an explicit model and options | Host must supply metadata/auth and preserve `StreamFn` failure semantics; `streamSimple` can throw for missing key before streaming |
| Retain/extract one adapter | Can remove unwanted factory/catalog dependencies | Transitive helpers, SDK/license obligations, fixtures and provider churn become owned; not a one-file copy |
| Direct supported provider integration | Official API/SDK can supply one selected protocol | Own message conversion, streaming terminal rules, arguments, reasoning state, usage/cache fields, retries and error mapping; OAuth suitability is a separate question |

For the inspected OpenAI factory, API-key auth and “Sign in with ChatGPT” OAuth both exist. The
separate `openai-codex` factory is another protocol/auth route. The Responses implementation changes
request fields for ChatGPT tokens; its focused tests assert omission of fields retained for API
keys. The OAuth implementation imports Node crypto/HTTP and uses a localhost callback on port 1455.
This is source evidence, **not** proof that subscription use is supported for Phil's remote node,
that a server may appropriate a desktop login flow, or that model availability matches API keys.
Provider authorization, login location, refresh/revocation and tenancy must be explicitly settled.

Ambient access is not removed by writing `env: {}`. `defaultProviderAuthContext` can consult
`process.env` and Node filesystem existence; auth env overrides overlay the base context.
`getProviderEnvValue` also falls through to process environment and a Bun sandbox fallback.
Credential-store refresh coordination matters: `refreshStoredOAuthCredential` refreshes under
`modify`, with a bounded refresh that can outlive caller cancellation to preserve rotated tokens.
The in-memory store only serializes within its own process/store instance. A multi-node durable
credential owner must provide the relevant atomicity; do not share mutable ambient stores by default.
These were code reads only, not access to credentials or environment values [P6].

## 4. Current demand and keep / adapt / exclude matrix

“Used” below means the inspected integration supplies or depends on the capability, not that Phil
has exercised every feature. “Desired” comes from the brief. “Not established” is not a claim that
no user anywhere needs it.

| Capability | Current / desired demand | Treatment for proposed node | Cost or capability lost |
| --- | --- | --- | --- |
| Profile-driven Pi process launch | Used: `run`, `PiArgs`, profile resolution, settings/runtime roots [S1–S2] | Keep existing launcher as fallback; exclude from kernel | Node needs its own deployment/configuration admission, not upstream CLI flag compatibility |
| Filesystem/tool mediation | Used: generated sandbox guards and scoped grants [S3] | Keep requirements; adapt behind explicit host tools | Omitting launcher machinery must not omit path bounds, protected paths, cancellation or output limits |
| Cmd requests, events, result and cancellation | Existing library; desired UI/node seam [S4–S6] | Keep transport/algebra; add domain validation and lifetime adapter | No automatic auth, deduplication, replay, persistence or bounded observer queues |
| Headless conversational tool loop | Desired; not an existing Driver-Pi `Pi` engine API [S1, P1] | Reuse first | Dependency pinning and adapter conformance still owned |
| Custom UI and public state | Desired; driver root `Pi` is empty, `src/ui/mod.ts` is not an agent UI implementation | Own projection; no terminal dependency | Existing coding-agent interaction patterns are not automatically reproduced |
| CLI/TUI modes and terminal rendering | Current launcher targets application entrypoints; not desired inside nodes | Exclude from node, retain fallback integration | No TUI session browser, terminal shortcuts or application command surface in node |
| Context budget + long-session compaction | Desired to avoid silently losing long-session usability | Keep budget admission; adapt injected compaction policy | No automatic Pi compaction merely by importing Agent; quality/retention tests required |
| Branch/tree history and file-operation summary tracking | Available application behavior; not confirmed node demand | Exclude initially; retain linear canonical history | No arbitrary branch navigation, branch summaries or Pi file-list prompt behavior |
| Extension/package/skill discovery and prompt assembly | Launcher/application machinery supplies this [S2] | Exclude discovery; host explicitly supplies trusted prompt/tool configuration | No drop-in extension ecosystem or implicit AGENTS/skill loading; required instruction contributions must be assembled by host |
| Multiple providers, live catalogs, interactive login | Breadth available; exact required path unknown | Select only after confirmation; no universal catalog requirement | No transparent provider switching/discovery/login UI; explicit metadata can become stale |
| Steering and follow-up queues | Agent has both; desired initial UI semantics unconfirmed | Optional; initial proposed admission rejects busy submissions | No mid-run steering/queued input UI unless deliberately added and bounded |
| Parallel tools, nested execution, special tools | Agent supports richer execution; no minimal-node requirement established | Sequential tools first; nested calls only through mediated host path | Less throughput; no implied MCP/codemode/subagent platform |
| Automatic retries and recovery | Application and durable packages supply different semantics | Bounded provider/context policy; never blindly replay effects | No transparent recovery from every failure |
| Mid-turn durable tasks, Chord documents, wakeups | Conditional on deployment/recovery needs [P11–P12] | Exclude for completed-turn-only resident design; compare Durable if needed | No automatic continuation after eviction or interrupted effects |
| Provider usage and cache reporting | Needed for budgets and truthful UI | Keep selected adapter's reports; distinguish estimates from billing | Dropping provider breadth must not drop usage/opaque metadata correctness |

Driver-Pi's Deno grants and path guards are **not** enclosing process confinement. Native subprocesses
need a real host isolation policy; they do not inherit Deno filesystem bounds. A smaller loop is
not a stronger sandbox. No profile or tool-policy change is proposed or authorized [S1–S3].

## 5. Proposed minimal node boundary

This is a candidate contract, not code or a finalized package API. All three loop alternatives must
satisfy the same chosen contract. Avoid a new general-purpose framework for each port.

### 5.1 Three commands using existing Cmd shapes

| Proposed command | Payload / result | Real Cmd mapping and lifetime |
| --- | --- | --- |
| `submit` | Conversation ID, client submission key, expected revision, bounded user input → run ID + admission revision | `client.send`; handler validates/adopts input. After admission the host owns the run, not `ctx.signal`. Duplicate key + same input returns the prior admission; different input conflicts. Busy conversation initially rejects. |
| `observe` | Run ID, optional cursor → initial snapshot, then public events; terminal result is run outcome | `client.stream`; `ctx.emit` carries typed event payloads; `stream.done` carries terminal result. `ctx.signal` cancels this observation only. Late attachment to a terminal run returns its snapshot/outcome. |
| `cancel` | Run ID + expected run identity → cancellation-requested or already-terminal acknowledgement | `client.send`; authenticated host requests runner abort. Acknowledgement is not proof of settlement or effect rollback; observe the terminal outcome. |

Use `Cmd.make<N, P, R, E>`, existing `Cmd.Endpoint`, and the existing MessageChannel/WebSocket
adapters. No new envelope protocol is needed. `Cmd.Handler.Context.id` identifies a transport
request; it is **not** the stable run ID or client submission idempotency key. The existing Cmd
implementation does not deduplicate submissions. Admission and durable key retention belong to the
node host if retry across restart is promised [S4–S6].

Why split submit and observe? `stream.dispose()`, client disposal, timeout and iterator `return()`
can send `cmd:cancel`; host cancellation aborts that request and suppresses later responses.
Connecting a run directly to that signal would make leaving a UI iterator stop work. An explicitly
request-scoped product could choose that behavior, but it must not be confused with a reconnectable
node. A lost submit acknowledgement is resolved with the same submission key, never a fresh blind
submission. Cancellation before admission must be checked; after admission it cannot roll back work.

`Cmd.Is` validates envelopes, not the domain payload. Namespace routing is not authentication.
Bound input sizes, validate payload schemas and bind conversation/run authority to an authenticated
connection principal at the host. The WebSocket adapter only JSON-encodes/decodes messages; it does
not supply reconnect, close-driven settlement, authentication or authorization [S5–S6].

### 5.2 State, events and finality

Keep one canonical history and derive views; do not maintain a second competing transcript in Cmd.

- **Canonical records:** admitted input, finalized assistant/tool results, context checkpoint and
  terminal outcome; stable conversation/run/message/call identities, schema version and revision.
- **Runtime state:** phase (`preparing`, `model`, `tools`, `settling`, terminal), active abort
  controller, pending calls, limits/counters and a bounded provisional draft. One writer per
  conversation. Runtime state is not automatically a restart checkpoint.
- **Public state:** sanitized snapshot with revision, phase, finalized visible messages, bounded draft,
  pending tool status, usage and error category. Do not expose executable tools, raw credentials,
  mutable Pi objects or all provider/debug details. Opaque provider continuity stays private.
- **Context state:** projection revision, summary coverage/retained-tail boundary, effective prompt
  and tool declarations, budget estimate and separately retained protocol metadata.

Minimal event families: `snapshot`, `message.delta`, `message.final`, `tool.status`, `context.changed`
and `run.settled`. Exact field names can wait for the proof. Include run identity and a versioned
cursor. Delta/tool-progress events are provisional; finalized means the producer is finished, not
necessarily persisted. Public durable claims require a successful storage receipt first.

For a resident design, coalesce/drop superseded provisional progress under pressure and publish a
fresh snapshot; never silently drop canonical finalized outcomes. A cursor from another host epoch
or outside retention requires explicit resynchronization. Snapshot capture plus live attachment must
have a single boundary so reconnect cannot miss or duplicate canonical transitions. Cmd itself has
no replay: its test explicitly expects late consumers to receive no historical events [S6].

Use one controlled Agent subscriber for canonical reduction/barriers and a bounded out-of-band UI
publisher. Do not serialize the entire growing partial message for every token. Do not claim
boundedness merely by moving events to another unbounded queue: Cmd async iteration also queues
without a capacity, and WebSocket delivery has its own pressure. Bound/coalesce before publication,
use a bounded UI reducer, and specify slow-observer disconnection/resync behavior [P7, S5–S6].

Emit `run.settled` only after runner completion **and** required host persistence/cleanup, not from
inside `agent_end` before its listeners finish. A canceled observation has a Cmd cancellation error;
a successfully observed failed run has an explicit domain failure outcome. Neither is equivalent to
a successful agent answer. The outer host must settle even when a hook/listener violates its contract.

### 5.3 Explicit host ports

| Port / owner | Smallest responsibility |
| --- | --- |
| Model adapter / host | Selected model metadata, stream + terminal result, abort/deadline, protocol metadata and usage; resolves auth privately and restricts destinations/options |
| Tool capability set / host | Fixed registry, argument validation/coercion contract, current authorization at execution, bounded outputs, abort/deadline, effect classification; no ambient shell by default |
| Context policy / host | Build valid request projection from canonical revision; reserve output/tool headroom; summarize closed history when configured; refuse unsafe/oversized requests |
| Store / host | Load and commit chosen canonical/checkpoint records with revision checks; define acknowledgement, crash and storage-error semantics; effect journal only if recovery requires it |
| Runtime / host | IDs, time/deadlines, per-conversation serialization, total turn/tool/token/cost limits, teardown; persistent wakeups only for a deployment that needs them |
| Observation / adapter | Immutable redacted snapshots and bounded updates; no dependency of run survival on the UI connection |

Auth is an internal dependency of the selected model adapter, not another UI command API. Existing
@sys tool implementations/policy requirements may be adapted, but no migration of them is part of
this report. A policy callback inside the same privileged process is not adversarial containment.

## 6. Concrete traces and failure boundaries

In these proposed traces, **P** means provisional, **F** producer-finalized, **C** committed under the
chosen store contract. With an in-memory proof, C is not durable across process loss. Pi's observed
ordering supplies the inner cycle; admission, durable claims, resynchronization and outer outcomes
are proposed host responsibilities.

### Normal text

`submit(key) → validate/authorize → commit admission C → return run ID → prepare context → model`

`message deltas P → assistant message F → commit message C → finishTurn → agent_end listeners`

`runner settles → commit terminal outcome C → run.settled → observe.done`

A subscriber failure, store failure or provider error must not be converted to a successful answer.
If admission succeeds but the response is lost, retrying the same key retrieves that admission.
A new model attempt can incur new cost; provider usage from an interrupted stream may be incomplete.

### Tool continuation

`assistant tool-argument deltas P → final assistant F → argument completeness check → assistant C`

`resolve tool → validate → authorize exact effective args → record intent if required → execute`

`tool progress P → result F → result C → coherent projection → next model request → settled`

No execution from a partial JSON object. Pi's length-stop guard and the selected parser's terminal
checks both matter. The OpenAI Responses parser refuses a stream without a terminal response and,
for a tool-use response, refuses unfinished calls; its error path strips parsing scratch buffers
[P1, P8]. These guarantees are adapter-specific, not supplied to arbitrary injected streams.
`tool_execution_start` happens before validation in agent-core; it is not evidence that an effect
actually started. Public status should distinguish requested, denied, running and completed.

If a batch has multiple calls, parallel completion order may differ from transcript result order.
Preserve source-ordered call/result artifacts. Initial sequential mode is simpler but still requires
complete interruption accounting. If a policy hook changes effective arguments, validate again at
the dispatch boundary; schema acceptance does not authorize filesystem paths or remote effects.

### Abort, failure and queued input

- `cancel → abort requested → model/tool observes signal → final aborted/error state → barriers →
  settled`. While a tool ignores cancellation, report stopping/unsettled rather than successful
  cancellation. Host process termination may be the only bound; it creates effect uncertainty.
- Provider terminal error → no tools from that response → failure outcome. For reuse, inspect the
  final message/outcome; a resolved `Agent.prompt()` alone does not indicate success.
- Invalid arguments, unknown tool or denied capability → one error result for that call → bounded
  continuation if policy permits. Sanitize errors separately for model and UI; validation messages
  and exception strings can contain sensitive input.
- During a tool response, steering waits for the current batch to finish; then it precedes another
  request. Follow-up is selected only when tool/steering work would stop. `finishTurn: end` and
  error/aborted exits retain unconsumed queues. If exposed later, the node must report/limit these
  queues, not claim queued input was executed [P1–P4].
- A raw stream/hook rejection or listener failure → host outer guard records failure and releases
  ownership. Do not promise normal inner events for a contract violation.

After an interrupted tool batch, classify calls individually as completed, never started or
outcome unknown. The next provider request must have valid call/result structure. Synthetic
interruption results must be truthful; they cannot claim an unknown effect failed or was undone.

### Compaction

`before request → project revision r → budget check → select closed prefix + coherent recent suffix`

`summary generation P → validate complete non-tool summary F → commit checkpoint at r C`

`adopt new projection → context.changed → build next request`

On cancellation, length stop, provider failure, invalid summary or failed/conflicting commit:
retain raw history and the prior projection; report the failure. Continue only if the old projection
is still valid and within budget; otherwise stop explicitly. Bound retries so overflow does not
create an endless summarize/retry loop. Do not compact away pending call/result relationships or
active-turn protocol metadata. A too-large indivisible recent turn needs a defined refusal or
host tool-output policy, not arbitrary slicing [P9–P10, W2].

### UI disconnection

`observe iterator return / socket loss → observation detaches → run remains host-owned`

`reconnect(run ID, cursor) → authorized snapshot + retained updates, or explicit resync → outcome`

Only an explicit authorized cancel targets the run. Socket loss is not reliably a received cancel
frame; the host needs observer cleanup/timeout independent of the Cmd handler. If a client cannot
keep up, discard that observer's provisional backlog and resync; do not slow canonical persistence
behind a remote acknowledgement or pretend lost deltas were durable [S5–S6].

### Restart: two different products

**Resident process/container, completed-turn recovery:** persist admission and coherent completed
turn checkpoints. A restart restores the last checkpoint and marks an active run interrupted. It
may accept a new explicit continuation, but it does not blindly repeat the lost suffix. A checkpoint
ending in completed tool results can support the next model request; a final assistant answer waits
for new input. If effects may have happened after that checkpoint, require reconciliation or a
separately sufficient effect journal. “Completed-turn resume” does not make a crash during a tool
safe. Volatile deltas are lost, and the next observation must resync.

**Evictable worker/durable actor, mid-turn recovery:** commit effect intent → perform effect outside
the transaction → commit outcome. A crash after intent but before outcome leaves uncertainty:

| Crash position | Recovery rule |
| --- | --- |
| Before committed admission | Same submission key may admit once; storage uncertainty must first be resolved |
| Admitted, before model output is checkpointed | A new model attempt is a policy choice with potential extra cost, not continuation of an in-memory stream |
| Before tool intent | No admitted effect from that intent; reauthorize before any dispatch |
| After intent, before committed result | Effect may have happened; rerun only with a valid replay/idempotency contract, otherwise report unknown/interrupted and reconcile |
| After result commit, before UI delivery | Reconstruct/replay state, never execute the completed effect again |
| During context checkpoint commit | Adopt only committed revision; uncertain store failure requires reopening/reconciliation, not success publication |

Pi Durable is a meaningful counterexample to “save messages and restart the loop.” Its specification
separates effects from atomic commits, defines submissions, persisted task phases/sleeps and host
wakeups. Observed `Session.#runCommit` commits storage before adoption/publication. Observed
`ToolTask` stores effective arguments and replay policy before execution; recovery reruns only when
both stored and current policy are safe, otherwise reports an interrupted effect. Focused recovery
tests assert these cases [P11–P12]. The ordinary agent-core `AgentTool.replay` property alone does
not implement this recovery protocol.

Durable's README marks the API experimental and describes Cloudflare hosting. That is an adoption
risk and a documented option, not target-runtime proof. Chord/task/document machinery may be too
much for a resident runner. Conversely, if it replaces an otherwise necessary recovery framework,
it may be cheaper than a superficially smaller owned kernel. Host-owned alarms/wakeups and storage
are still required; a JS timer or open UI connection is not a durable schedule. Cloudflare's live
lifecycle docs explicitly describe memory loss, shutdown and the absence of reliable shutdown hooks
[W3]. No exactly-once guarantee exists for arbitrary external effects, even with durable storage.

## 7. Correctness/security invariants and proposed acceptance cases

All cases below are **proposed deterministic tests, not executed verification**. Use scripted model
streams, captured requests, in-memory/fault-injected stores, barriers and fake tools. No paid model
calls are needed to prove the boundary. Existing test sources are behavioral references, not an
oracle where @sys intentionally changes semantics.

| Invariant | Acceptance case / distinguishing assertion |
| --- | --- |
| One admitted run per conversation | Concurrent submits with one revision admit at most one; busy rejects; duplicate submission key returns same run; changed payload with same key conflicts |
| Ordered public state and one outcome | Normal/error/abort streams, including no `start` event and early EOF; public terminal result occurs once after required barriers; no later canonical event for that run |
| No execution from incomplete arguments | Split JSON produces zero effects before finalization and one dispatch after a valid final call; invalid final JSON, a valid-looking length-truncated call, missing `output_item.done` or terminal error after a partial call → zero effects [P1, P8] |
| Validate and authorize actual dispatch | Unknown tool, schema failure/coercion, denied path and revoked authority; verify exact arguments executed, no effect for denial; nested call cannot bypass the same boundary |
| Call/result integrity | Multiple calls finishing in reverse order; transcript artifacts remain paired/source-ordered; abort before/within a batch produces truthful per-call recovery state |
| Settlement includes controlled barriers | Hold persistence at assistant final → no tool dispatch yet; hold `agent_end` subscriber → not idle; detached/slow UI never holds either barrier [P3–P4] |
| Contract violations fail boundedly | Throw/reject from stream setup, context hook, subscriber and progress callback; outer host records failure, releases ownership, does not hang or publish successful settlement |
| Cancellation is not rollback | Cooperative tool observes abort; non-cooperative fake tool remains unsettled until host policy intervenes; later effect is not reported as undone |
| Continuation is finite | Tool loop, repeated `finishTurn: continue`, queued-input flood, provider retries and compaction overflow all stop under explicit turn/time/tool/token/output budgets |
| Context change is atomic and honest | Incomplete/empty/tool-producing/aborted summary and store conflict leave prior checkpoint/history intact; successful projection preserves required prompt/tool/call/reasoning metadata [P10, W2] |
| Reconnect is observation, not execution | Break iterator, dispose client, lose socket, attach late, replay old cursor and overflow observer buffer → no new run/effect; snapshot-to-live handoff has no canonical gap |
| No cross-node authority/state leakage | Two instances with different stream/tool/auth/store dependencies and overlapping human-visible IDs; no global default mutation, credential crossover, cleanup of another node or shared mutable snapshots |
| Persistence precedes durable claims | Fail admission/message/outcome commit; no success receipt or durable event; reopening resolves uncertain commit before retry |
| No blind side-effect replay | Crash injection before intent, after intent, after effect and after outcome; replay-safe effect uses stable idempotency key; unsafe effect stops for reconciliation [P12] |
| No ambient/excluded runtime requirement | Inspect and execute exact emitted import entry in target's approved minimal authority; fake provider request + schema validation completes without CLI/TUI, unintended provider initialization, home/env/credential discovery or shell access |
| Public data is bounded and sanitized | Oversized input/progress/result, malicious wire payload and exception containing a fake secret; domain validation rejects safely and public errors expose only approved fields |
| Selected protocol fidelity | Fixture request/response round trip retains usage/cache fields, tool IDs, phase/signatures and chosen auth-specific request constraints; terminal failures cannot become successful results |

The import test must distinguish **not loaded** from **not installed** and include a fake stream
request, not just importing a barrel. The runtime/authority for it must be explicitly approved.
No denial should be “fixed” by broadening permissions. If future network-visible Cmd is used, test
principal/namespace/run authorization separately from shape validation and routing.

## 8. Compare the same bounded alternatives

Common confirmed requirements: own UI through existing Cmd; headless nodes; explicit tools and
host authority; no required coding-agent CLI/TUI. Common proposed correctness requirements are in
sections 5–7. Provider/auth, residency and recovery remain conditional for **all** options.

| Dimension | Reuse agent-core behind owned adapter | Extract coherent subset + tests | Narrow @sys-owned loop |
| --- | --- | --- | --- |
| Headless/UI fit | Already exposes explicit stream/tools/events | Can retain same seam | Can tailor public semantics exactly |
| Initial semantic burden | Adapter, policy and lifecycle gaps; retain existing loop fixes | Dependency closure + copied semantics/tests + adaptation | Design/prove loop, streaming/tool/abort rules plus same host gaps |
| Dependency control | Selected loaded graph; package installation remains broad | Can reduce manifest/import surface if extraction is genuinely coherent | Most control; selected provider SDK may still be substantial |
| Provider maintenance | Retain selected pi-ai behavior and upgrade conformance | Retained adapter/helpers need a deliberate upstream sync path | Direct supported adapter still needs protocol/SDK change tracking |
| Context/persistence | Must supply chosen policy/store; no free application semantics | Same obligation | Same obligation; smaller loop does not remove it |
| Mid-turn durability | Compare Durable instead of bolting on ad hoc journal/scheduler | Extraction of durable behavior greatly expands scope | Own recovery protocol and host integration, not just loop |
| Coupling | Pi types/hooks stay behind adapter; pin and prove upgrades | Frozen Pi semantics become local ownership; selective upstream merging | Own schema/event semantics and migrations; fewer upstream loop assumptions |
| Rollback | Keep current launcher untouched; replace experimental adapter independently | Fork drift increases rollback/data compatibility work | Highest new behavioral/data compatibility burden |
| Best justification | Current evidence: existing boundary fits most of the loop demand | Proven runtime/install blocker, with source semantics still substantially right | Deliberately reduced requirements plus demonstrable inability to adapt economically |

**Fair case for extraction:** if acquisition must not include other provider SDKs, or a precise
runtime edge cannot be removed with supported exports, freezing the audited loop and its required
helpers/tests can offer control without inventing behavior. Preserve MIT copyright/permission
notices from Pi `LICENSE` [P13], record the source revision, retain relevant regression fixtures and
name an upstream/security-fix maintenance owner. Extracting only `agent-loop.ts` while quietly keeping
its pi-ai root dependency does not meet a no-provider-installation requirement.

**Fair case for ownership:** a fixed single protocol, sequential tools, no steering/follow-ups,
linear history and completed-turn-only recovery could support a simpler runner with explicit
outcomes and limited hook extensibility. It could avoid reproducing mutable public Agent state and
legacy defaults. Those are genuine reductions only if Phil accepts the lost capabilities. It still
needs the selected protocol's parsing/metadata, context policy, security and recovery tests. No
source-line target or rewrite time estimate is justified by this audit.

### Decisions still needed

1. **Provider:** exact first model/protocol/endpoint; API key, subscription OAuth or an explicitly
   bounded pair; supported deployment use; where login/refresh/revocation and secrets live.
2. **Host:** resident isolated process/container or an evictable worker/actor; runtime version and
   actual filesystem/network/process restrictions, including tool isolation.
3. **Recovery:** completed-turn checkpoints with interrupted work surfaced, or mid-turn automatic
   recovery; which external tools are idempotent and who reconciles ambiguous outcomes.
4. **Interaction:** initial busy rejection versus steering/follow-ups; whether disconnect should
   preserve runs; required observation retention and storage acknowledgement strength.
5. **Context:** long-session requirement, budget/reserve policy and summary quality expectations.
6. **Dependency constraint:** smaller loaded graph/bundle versus no acquisition of unused SDKs;
   who owns dependency pinning and protocol upgrades.

Phil resolves product/provider/host choices. Source inspection cannot settle account entitlement,
acceptable auth custody, paid behavior or the deployment's actual lifetime guarantees. No unseen
credential or launch configuration was used to infer them.

### Smallest later proof — recommend, do not execute

**One offline adapter-conformance slice, not three prototype engines.** After explicit authorization,
pin the exact candidate agent-core version and use existing local Cmd transport with one `Agent`,
a scripted `StreamFn`, one fake sequential tool and a fault-injected in-memory store/sink. No UI,
CLI, provider credentials, network call, production storage or package migration is needed.

Prove this single trace with controlled forks:

`submit → provisional model output → finalized tool call → persisted assistant barrier → fake tool`

`→ persisted result → second scripted response → listener settlement → terminal run outcome`

Detach/reobserve once; repeat with truncated arguments, cancellation and a failed persistence barrier.
Check that a rejected/throwing hook cannot strand the host outcome. Use the same assertions as an
acceptance contract for extraction or ownership only if reuse fails a material requirement.

The slice answers the most immediate question: can the existing headless runner preserve @sys's
admission, observation and settlement semantics without taking over the application? It does **not**
prove real provider/auth behavior, durable crash recovery or worker compatibility. If an evictable
host with mid-turn resume is selected first, change the proof's subject to Durable's intent/outcome
recovery seam rather than presenting an in-memory Agent proof as sufficient.

Separately, within the subsequently approved exact runtime, inspect/verify the selected emitted
import graph and one fixture-backed provider request under minimal permissions. A demonstrated
forbidden edge or unadaptable semantic gap is the reason to consider extraction/ownership; an
unmeasured preference for less code is not. Do not broaden authority when that proof encounters a
denial. The working Driver-Pi/compile-cache fallback remains intact throughout.

**Stop here:** this report does not authorize the proof, a dependency upgrade, extraction, engine
implementation, profile change, Git mutation or upstream action. The governing checkbox is unchanged.

## Source anchors

Paths below are exact relative paths beneath the roots in section 2. Symbols/test names identify the
inspected evidence; they do not imply whole-package review. Ranges describe selected long-file reads.

### Pi

- **P1 — Loop:** `packages/agent/src/agent-loop.ts`: `agentLoop`, `agentLoopContinue`,
  `runAgentLoop`, `runAgentLoopContinue`, `runLoop`, `declareToolChanges`,
  `streamAssistantResponse`, `failToolCallsFromTruncatedMessage`, `prepareToolCall`,
  `executeToolCallsParallel`, `executeToolCallsSequential`, `runToolCall`.
- **P2 — Contracts/entry:** `packages/agent/src/types.ts`: `StreamFn`, `AgentLoopConfig`,
  `AgentTool`, `AgentState`, `AgentEvent`; `packages/agent/src/stream-fn.ts`:
  `setDefaultStreamFn`, `getDefaultStreamFn`; `packages/agent/src/index.ts`;
  `packages/agent/src/proxy.ts`: `streamProxy`, `processProxyEvent`;
  `packages/agent/package.json`.
- **P3 — Stateful lifecycle:** `packages/agent/src/agent.ts`: `Agent`, `PendingMessageQueue`,
  `createMutableAgentState`, `processEvents`, `runWithLifecycle`, `handleRunFailure`, `finishRun`,
  `createLoopConfig`, `continue`; `packages/agent/README.md`: Event Flow, Low-Level API
  (documentation agrees on awaited subscribers versus observational streams).
- **P4 — Focused loop tests:** `packages/agent/test/agent.test.ts`: async subscriber/idle barriers,
  thrown run failures, late tool updates, concurrent prompt/reset rejection, queued continuation;
  `packages/agent/test/agent-loop.test.ts`: transforms, tools/hooks, parallel order, request
  preparation, `action:end`, termination hints and `runToolCall` assertions. Source only; not run.
- **P5 — AI dependency seam:** `packages/ai/package.json`; `packages/ai/src/index.ts`;
  `packages/ai/src/compat.ts`; `packages/ai/src/models.ts`: `createModels`, `createProvider`,
  provider/auth/stream delegation; `packages/ai/src/api/lazy.ts`: `lazyStream`, `lazyApi`;
  `packages/ai/src/telemetry.ts`: `AI_TELEMETRY_SCHEMA`, `observeModelRequest`;
  `packages/telemetry/src/index.ts`; `packages/ai/src/session-resources.ts`.
- **P6 — Auth:** `packages/ai/src/auth/context.ts`: `defaultProviderAuthContext`;
  `packages/ai/src/auth/credential-store.ts`: `InMemoryCredentialStore`;
  `packages/ai/src/auth/helpers.ts`: `envApiKeyAuth`, `lazyOAuth`;
  `packages/ai/src/auth/resolve.ts`: `resolveProviderAuth`, `overlayEnvAuthContext`,
  `refreshStoredOAuthCredential`; `packages/ai/src/utils/provider-env.ts`: `getProviderEnvValue`;
  `packages/ai/src/auth/oauth/openai-chatgpt.ts`; `packages/ai/src/providers/openai.ts`:
  `openaiProvider`; `packages/ai/src/providers/openai-codex.ts`: `openaiCodexProvider`.
- **P7 — Shared semantics:** `packages/ai/src/utils/event-stream.ts`: `EventStream`,
  `AssistantMessageEventStream`; `packages/ai/src/utils/validation.ts`: `validateToolArguments`;
  `packages/ai/src/utils/transcript.ts`: normalization, prompt/tool replay;
  `packages/ai/src/api/transform-messages.ts`: `transformMessages`.
- **P8 — Concrete provider:** `packages/ai/src/api/openai-responses.ts`: `stream`, `streamSimple`,
  `isChatGPTSignIn`, cache/options/error handling; `packages/ai/src/api/openai-responses-shared.ts`:
  `convertResponsesMessages`, `convertResponsesTools`, `processResponsesStream`;
  `packages/ai/test/openai-responses-terminal-event.test.ts`;
  `packages/ai/test/openai-responses-partial-json-cleanup.test.ts`;
  `packages/ai/test/openai-responses-chatgpt-sign-in.test.ts`.
- **P9 — Application context/session:** `packages/coding-agent/src/core/agent-session.ts`:
  `_installAgentRequestProjection`, `_installAgentNextTurnRefresh`,
  `_compactBeforeNextAssistantResponse`, `_handleAgentEvent`, `_runAutoCompaction` (selected paths);
  `packages/coding-agent/src/core/session-manager.ts`: `buildSessionProjection`, `appendMessage`,
  `_appendEntry`, `_persist` (selected paths).
- **P10 — Compaction:** `packages/coding-agent/src/core/compaction/compaction.ts`:
  `estimateProjectedContextTokens`, `prepareCompaction`, `findProjectedCutPoint`, `compact`,
  `getSummarizationFailure`;
  `packages/coding-agent/test/suite/regressions/7048-compaction-truncated-summary.test.ts`:
  `does not persist a length-limited summary`.
- **P11 — Durable documentation:** `packages/durable/README.md`: experimental warning,
  persistence/resumption/host wakeups; `packages/durable/docs/spec.md`: section 1 invariants,
  section 5.2 external-effect recovery, section 5.6 sleeping/timers/wakeups, submissions (selected
  sections, not a complete specification audit).
- **P12 — Durable implementation:** `packages/durable/src/session/session.ts`: `#runCommit`,
  storage commit → `tx.adopt` → `#publish` (around lines 716–806);
  `packages/durable/src/session/transaction.ts`: transaction settlement/adoption;
  `packages/durable/src/harness/tool.ts`: `ToolTask`, `call`/`execute` phases;
  `packages/durable/test/harness-tools-recovery.test.ts`: unsafe interruption, stored/current
  replay-policy agreement, pre-intent interruption (selected cases).
- **P13 — License:** `LICENSE`: MIT grant and copyright/permission-notice condition.

### sys

- **S1 — Current integration identity:** `deps.yaml`;
  `code/sys.driver/driver-pi/src/m.cli/u/u.resolve.pkg.ts`: `PI_AGENT_IMPORT_VERSION`, `resolvePkg`;
  `code/sys.driver/driver-pi/README.md`;
  `code/sys.driver/driver-pi/src/m.core/mod.ts`: empty `Pi` namespace;
  `code/sys.driver/driver-pi/src/ui/mod.ts`.
- **S2 — Launcher:** `code/sys.driver/driver-pi/src/m.cli/m.run.ts`: `run`;
  `code/sys.driver/driver-pi/src/m.cli/u/u.args.ts`: `PiArgs`;
  `code/sys.driver/driver-pi/src/m.cli/u/u.invoke.ts`;
  `code/sys.driver/driver-pi/src/m.cli/m.profiles/u/u.resolve.run.ts`;
  `code/sys.driver/driver-pi/src/m.cli/-test/-m.run.test.ts`.
- **S3 — Mediation:** `code/sys.driver/driver-pi/src/m.core/m.extension/m.sandbox/tmpl/mod.ts`;
  `code/sys.driver/driver-pi/src/m.core/m.extension/m.sandbox/tmpl/u.guard.ts`;
  `code/sys.driver/driver-pi/src/m.core/m.extension/m.sandbox/-test/-.test.ts`.
- **S4 — Cmd contract:** `code/sys/event/src/m.cmd/t.ts`: `Cmd.Factory`, `Handler.Context`,
  `Client.Handle`, `Stream.Handle`, `Wire`, `Error.Detail`;
  `code/sys/event/src/m.cmd/u/u.make.ts`: `make`.
- **S5 — Cmd implementation:** `code/sys/event/src/m.cmd/u/u.host.ts`: `makeHost`, `cancelActive`;
  `code/sys/event/src/m.cmd/u.client/u.create.ts`: `makeClient`, `stream`, `cancelPending`;
  `code/sys/event/src/m.cmd/u.client/u.iterator.ts`: `createAsyncIterator`;
  `code/sys/event/src/m.cmd/m/m.Is.ts`: `CmdIs`, `isWire`;
  `code/sys/event/src/m.cmd/m.transport/u.from.WebSocket.ts`: `fromWebSocket`.
- **S6 — Cmd test contracts:** `code/sys/event/src/m.cmd/-test/-m.Cmd.stream.test.ts`: events
  before result, late consumers/no replay, stream disposal/iterator return cancellation;
  `code/sys/event/src/m.cmd/-test/-m.Cmd.lifecycle.test.ts`: host/client disposal and endpoint
  ownership. Source read; no test execution.

### Public primary sources, retrieved during this research pass

- **W1 — OpenAI, Function calling:**
  <https://developers.openai.com/api/docs/guides/function-calling.md>.
  Visible protocol guidance: model-generated calls require application execution and corresponding
  outputs; streamed arguments are assembled before use. Not evidence of Phil's auth entitlement.
- **W2 — OpenAI, Reasoning:**
  <https://developers.openai.com/api/docs/guides/reasoning.md>.
  Visible sections “Preserve reasoning across calls,” “Keeping reasoning items in context” and
  “phase parameter”: visible messages and opaque reasoning continuity differ; retained tool-turn
  items and assistant phase matter. Response output was truncated; no exhaustive page audit or
  compatibility claim for every documented model/feature.
- **W3 — Cloudflare, Lifecycle of a Durable Object:**
  <https://developers.cloudflare.com/durable-objects/concepts/durable-object-lifecycle/index.md>.
  Retrieved page labels itself updated October 15, 2026. Hibernation discards memory; shutdown can
  interrupt work; reliable shutdown hooks are not provided. This supports explicit persistence and
  recovery ownership, not an assertion that every pending request is immediately evicted.
