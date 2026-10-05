# Contract fixtures

Native controls establish what immutable state, Automerge, Yjs, and Cmd do. The
[mutation-path comparison](-compare/README.md) examines which semantics survive a worker boundary.
These are experiments, not a public driver API or a choice of production topology.

## Run

From the repository root:

```sh
cd code/sys.driver/driver-crdt
deno task check
deno task test
deno task lint
deno task fmt
```

Tests use the versions selected by workspace `deps.yaml` and the frozen lockfile. They do not test a
multi-version compatibility matrix. Leak tracing is enabled. Graph collection and native probes run
in separate Deno processes; parent flags such as `--cached-only` do not propagate to them.

## Evidence

- [Immutable](-spec/-immutable.test.ts): callback, patches, events, and `current` before `change()`
  returns; retained values and independently disposable event views.
- [Automerge](-spec/-automerge.test.ts): shared history, object identity, marks, heads, cursors, and
  rollback when a change callback throws.
- [Yjs](-spec/-yjs.test.ts): shared types, plain projections, anchored positions, and writes that
  survive a transaction callback throwing.
- [Repo](-spec/-repo.test.ts): concurrent edits merge through public `Repo.import` in the same
  handle.
- [Delivery](-spec/-delivery.test.ts): holding one command phase does not block an independent Cmd
  request.
- [Isolation](-spec/-isolation.test.ts): required and forbidden engine reachability, plus native
  initialization in fresh processes.
- [Mutation paths](-compare/README.md): caller authoring versus owner authoring; local visibility
  versus owner acceptance and client observation.
- [Workspace](-spec/-workspace.test.ts): private task identity with no public exports.

## Read the results

### Equal values do not imply equal native state

Replicas start from shared native history, not independently reconstructed values. Plain projections
omit formatting and anchored positions. The Yjs projection maps one fixture schema; it is not a
general object-draft adapter.

With the pinned Automerge, historical values and heads remain available, but `marks()` reads current
shared-backend metadata, including through `view()`. The control distinguishes marks captured before
a change from later queries through the retained document. In Yjs, a delete-only change can leave
the state vector unchanged while changing the document and its snapshot.

### Reachability does not prove initialization

Isolation checks follow resolved code edges, literal dynamic imports, and conservative npm
package-dependency closure. They inspect code-only and type-inclusive reachability separately.
Required engines are matched by exact package identity; dependency versions remain owned by
`deps.yaml` and the lockfile. Deliberately leaking fixtures verify that forbidden imports are
rejected.

Separate process probes exercise import and first native use. Neither form of evidence proves a
browser bundle boundary or covers runtime-computed imports.

### Process exit does not prove native cleanup

The pinned Repo's `shutdown()` leaves a sync-throttle timer pending. Its standalone control waits
for natural child exit within a deadline; it does not use a fixed sleep or disable leak checks. This
establishes bounded process completion, not immediate in-process quiescence or native heap cleanup.

## Source layout

Suites live in `-spec/`, fixture constructors in `-fixtures/`, and shared utilities and standalone
probes in `u/`. Comparison machinery stays in `-compare/u/`. Native probes remain separate
entrypoints so each engine's imports can be inspected and executed independently.
