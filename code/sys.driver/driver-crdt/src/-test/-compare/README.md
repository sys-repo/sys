# Mutation-path comparison

Test-only specimens, not public driver contracts or a selected topology. The shared
[scenarios](u/u.spec.ts) run separately for [Automerge](../-spec/-compare.automerge.test.ts) and
[Yjs](../-spec/-compare.yjs.test.ts).

From the module directory:

```sh
deno task test --cached-only src/-test/-spec/-compare.automerge.test.ts src/-test/-spec/-compare.yjs.test.ts
```

## Contract matrix

| Property                | A: async owner, either engine         | B: Automerge replica              | B: Yjs replica                 |
| ----------------------- | ------------------------------------- | --------------------------------- | ------------------------------ |
| Caller callback         | No; installed owner handler           | Synchronous native draft          | Synchronous scoped author      |
| Caller-local values     | Explicit command data                 | Closure capture                   | Closure capture                |
| Immediate `current`     | Last applied observation              | Local native projection           | Local native projection        |
| Writable immutable ref  | No                                    | Restricted draft/lens behavior    | No general object mapping      |
| Native extension        | Installed fixture handler             | Native `mark()` in draft callback | Shared-text formatting         |
| Stale list target       | Reject index/basis; accept fixture ID | Preserve native B                 | Preserve native B              |
| Mutation callback throw | Not exercised here                    | Native rollback                   | Earlier writes may commit      |
| Rejected local history  | No local native author                | Re-enters through dependent E2    | Re-enters through dependent E2 |

A's data handlers are fixture-specific witnesses, not an application command catalogue proposal.
Rejecting stale positional intent retains its input but does not reconcile it. B's local authoring
does not first execute at the worker Cmd host; it is incompatible with that stricter boundary.
Neither an async-only surface nor the Yjs schema author impersonates `change(fn): void`.

Both variants expose stable captured values and native context through independently disposable
immutable event views. RFC6902 patches and path subscriptions describe **value changes only**.
Formatting-only and heads-only observations may have no value patches. Metadata is captured at its
basis, not queried later through retained native handles. Selection checks cover the fixture's
anchored range, not a general editor-selection policy or arbitrary document replacement.

B publishes local patches/events synchronously before returning. A publishes when its observation
arrives. Receipt means **worker application**, not persistence, peer convergence, or client
observation: tests hold client application while still receiving the receipt. Local mutation, patch
callback, events, receipt, and observation application are traced separately. Reentrant mutation
scopes are explicitly rejected.

### Automerge writable-ref restriction

The fixture's anchored selection belongs to its original native text object. B rejects replacing
that object **before merging the authored fork**, discarding all changes in that fork. This includes
`draft.text = replacement` and a text-lens setter when it changes the value. Direct native
assignment of an equal string still replaces the object and is rejected; the existing lens skips
equal-value writes, which remain no-ops. Title/list edits and native `splice()`/formatting remain
available. This is restricted fixture behavior, not complete writable `ImmutableRef<T>` parity or a
text-replacement selection policy.

[Automerge regressions](../-spec/-compare.automerge.test.ts) check unchanged values, heads,
metadata, selection, events, and submissions after rejection, independently reload saved native
history, and prove that the next supported edit still reaches the worker.

## Ownership and representation costs

A real worker receives a transferred MessagePort; thereafter the existing Cmd runtime carries all
fixture traffic. Automerge's worker owns one Repo/handle and uses public existing-document
`Repo.import`; Yjs's worker owns one shared-type document. No storage or network provider is wired.
An independent native peer advances the owner while submission is held. All replicas originate from
shared native history, with independent writer identities.

A client retains a plain snapshot. Both engines explicitly project the fixture's scalar, object, and
list fields; a general object clone is not a substitute for projecting a native document. Current
and retained event values are tested separately from native saved history. B additionally retains a
native document/history. The Automerge replica lends a **native fork per mutation**, validates its
text-object identity before merging, then frees the fork even on rejection:
[the native control](../-spec/-automerge.test.ts) demonstrates that a raw retained Automerge 3.5.0
draft can otherwise write into subsequently serialized history. Forks preserve the replica's actor
and are never authored concurrently. This is additional native allocation/merge work, not
plain-value reconstruction. Yjs lends only transaction-scoped fixture methods; no mutable `Y.Doc`
escapes.

Transport carries complete native saved history/updates plus captured values and metadata, not an
optimized incremental protocol. Projection cloning/diffing adds materialization work. Each test owns
its submission promises; held observation application is bounded to eight frames and throws on
overflow. This is a test barrier, not backpressure on Cmd's stream queue. Cmd requests use a
20-second timeout; mutation commands are not retried. No payload-size or production capacity claim
is made.

Disposal settles submissions, cancels observation streams, disposes client-native state and the
peer, calls owner shutdown, closes the port and **terminates the owned worker**. Tests also retain a
second observer and the owner while disposing one client. Parent leak sanitizers and worker
termination do not establish surviving-worker heap cleanup or immediate Repo throttle settlement.

[Isolation checks](../-spec/-isolation.test.ts) inspect client, replica, and worker code/type
closures separately. The test peer itself loads an engine in the parent realm; these checks do not
prove an engine-free browser bundle or compare cold-start costs.

## Explicit limits

B's permissive full-history admission is **not valid for rejected-history non-admission**: E2
reintroduces rejected E1. No recovery or history removal for owner-rejected edits is implemented.
This is separate from discarding an unmerged Automerge fork. Disconnection/reconnect recovery, owner
restart, exactly-once delivery, field-level authorization, malformed-input protection, and
persistence are also unimplemented. The Cmd control plane is trusted, document-local test machinery,
not a security API.

The bounded plain-proxy controls reproduce wrong-target numeric replay, loss of dependent input on
reset, and invisible formatting. They do not prove every richer proxy impossible; preserving those
semantics would require additional identity/history/reconciliation machinery.

Only the named fixture interactions are covered. These suites do not supply browser/editor,
postcommit observation-failure, cancellation, initialization-race, performance-distribution, or
production lifecycle evidence.
