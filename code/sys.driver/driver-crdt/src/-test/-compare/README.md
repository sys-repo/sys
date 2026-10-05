# Mutation-path comparison

Where does a mutation run, and when can a caller observe it?

These fixtures compare two paths over a real worker and Cmd transport:

- **A: async owner.** The caller sends data. An installed worker handler performs the native edit.
- **B: caller-native replica.** A synchronous caller callback edits a local native replica. Its
  history is then submitted to the worker.

The shared [scenarios](u/u.spec.ts) run for [Automerge](../-spec/-compare.automerge.test.ts) and
[Yjs](../-spec/-compare.yjs.test.ts). Neither path is a public driver contract or a selected
production topology.

From `code/sys.driver/driver-crdt`:

```sh
deno task test \
  src/-test/-spec/-compare.automerge.test.ts \
  src/-test/-spec/-compare.yjs.test.ts
```

## Authoring location

| Property            | A: async owner                               | B: caller-native replica      |
| ------------------- | -------------------------------------------- | ----------------------------- |
| Mutation callback   | Installed worker handler                     | Synchronous caller callback   |
| Caller-local data   | Explicit command payload                     | Closure capture               |
| Immediate `current` | Last applied observation                     | Local native projection       |
| Stale list target   | Reject stale index/basis; resolve fixture ID | Preserve native item identity |

A exposes only the fixture's installed commands, not a transported callback or a general command
catalogue. Rejecting a stale positional command preserves its input but does not reconcile it. B
preserves local authoring semantics, but cannot satisfy a requirement that every edit first execute
at the worker.

## Mutation, receipt, and observation

B publishes local value patches and events before the mutation call returns. A updates its client
view when an observation is applied.

An **accepted receipt confirms worker application**. It does not establish persistence, peer
convergence, or client observation. Tests exercise both orders: an observation may be applied before
the receipt, or client application may remain held after the receipt arrives. Local mutation, patch
callbacks, events, receipts, and observation application are traced separately.

Both paths expose retained snapshots and independently disposable event views. RFC6902 patches and
path subscriptions describe **plain-value changes only**. Formatting and native history can change
without value patches. Native context carries the captured basis, metadata, and resolved selection;
it is not reconstructed by querying retained native handles later. Selection tests cover the
fixture's anchored range, not a general editor-selection policy.

## Caller-native authoring

The fixtures preserve each engine's mutation and failure semantics rather than forcing API parity.

- **Automerge replica.** The fixture exposes a restricted writable `ImmutableRef`, usable with
  existing lenses and native draft operations such as `mark()` and `splice()`. A throwing callback
  rolls back document writes, not caller-local effects.
- **Yjs replica.** The fixture exposes transaction-scoped methods for its schema, not a plain-object
  draft or writable `ImmutableRef`. No mutable `Y.Doc` escapes. Earlier writes can survive a
  throwing callback; the client still publishes and submits the resulting native state.

Reentrant mutation is rejected. A's worker-handler failure behavior is not exercised here.

### Automerge: preserve the original text object

The fixture's selection anchors belong to its original native text object. Each mutation receives a
native fork. The fixture checks text-object identity before merging and discards the whole fork if
that identity changed.

Direct `draft.text = value` replaces the text object even when the string is equal. A text-lens
setter is also rejected when it changes the value; the existing lens skips equal-value writes. Title
and list edits, native text splices, and formatting remain available. This is a deliberate
restriction, not complete writable-ref parity or a policy for reanchoring selections after text
replacement.

Forks retain the replica's writer identity and are never authored concurrently. Each fork is freed
on success or failure. This adds native allocation and merge work to contain an upstream hazard:
[the native control](../-spec/-automerge.test.ts) shows that a retained raw draft can write into
subsequently serialized history.

[Automerge regressions](../-spec/-compare.automerge.test.ts) verify that a rejected fork changes no
values, heads, metadata, selection, events, or submissions. They reload saved native history and
check that the next supported edit reaches the worker.

## Rejecting a submission does not remove its history

B intentionally demonstrates this failure:

1. The caller authors E1; the owner rejects its submission.
2. The caller authors E2 using state created by E1.
3. The owner accepts the next full-history submission, which includes E1 as well as E2.

B therefore cannot guarantee that owner-rejected edits stay out of the owner's history. No recovery
or history removal is implemented. This differs from local Automerge validation, which discards a
fork before it is merged into the caller's retained history.

Plain-proxy controls expose related losses: replaying a stale numeric position edits the wrong item;
resetting to owner state discards dependent input; a value-only view cannot represent formatting.
These cases do not prove every richer proxy impossible. They identify information that such a proxy
would have to preserve.

## Ownership and cost

The worker receives a transferred MessagePort; Cmd carries subsequent control and data messages.
Automerge's worker owns one Repo/handle and applies native history through public `Repo.import`.
Yjs's worker owns one shared-type document. No storage or network provider is wired.

An independent native peer can advance the owner while a client submission is held. Owner, peer, and
caller replicas share native history but have independent writer identities.

Both clients retain plain snapshots. B also retains a native document and its history. Projections
copy the fixture's scalar, object, and list fields; cloning a native document is not a substitute.
Transport carries complete saved history or full-state updates, plus captured values and metadata,
not an incremental protocol. Projection copying and diffing add materialization work.

The fixture owns submission promises until settlement. Held observation application is bounded to
eight frames and throws on overflow; this is a test barrier, not Cmd stream backpressure. Requests
have a 20-second timeout and mutations are not retried. No production capacity claim follows.

## Proof limits

Disposal settles submissions, cancels observation streams, disposes client-native state and the
peer, calls owner shutdown, closes the port, and terminates the owned worker. Separate tests verify
that disposing one event view or client leaves another observer and the owner usable. Parent leak
checks and worker termination do not prove heap cleanup inside a surviving worker or immediate Repo
throttle settlement.

[Isolation checks](../-spec/-isolation.test.ts) inspect client, replica, and worker code/type
closures separately. The test peer itself loads an engine in the parent realm. These checks do not
prove an engine-free browser bundle or compare cold-start costs.

The Cmd control plane is trusted, document-local test machinery, not a security API. Reconnect
recovery, owner restart, exactly-once delivery, authorization, malformed-input protection, and
persistence are unimplemented. Browser/editor integration, postcommit observation failures,
cancellation, initialization races, performance distributions, and production lifecycle behavior
remain outside the evidence.
