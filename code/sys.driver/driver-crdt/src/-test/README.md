# Contract fixtures

Native controls and test-only mutation-path experiments for immutable state, Automerge, Yjs, and
Cmd. No public driver API is defined here.

## Run

From the repository root:

```sh
cd code/sys.driver/driver-crdt
deno task check
deno task test
deno task lint
deno task fmt
```

The test task enables leak tracing. Graph collection and native probes run in separate Deno
processes; parent test flags such as `--cached-only` do not propagate to them.

## Suites

Executable suites live in `-spec/`; `-test.ts`, `common.ts`, and `t.ts` remain root-level support.
Shared test utilities and standalone native probes live in `u/`; fixture constructors live in
`-fixtures/`. Comparison-only machinery stays in `-compare/u/`. Probe entrypoints are invoked
separately, never combined in a runtime barrel.

- [Immutable](-spec/-immutable.test.ts): synchronous mutation, event timing, retained values, and
  lenses.
- [Automerge](-spec/-automerge.test.ts): causal identity, marks, heads, cursors, and callback
  rollback.
- [Yjs](-spec/-yjs.test.ts): shared types, projection boundaries, relative positions, and
  transaction failure.
- [Repo](-spec/-repo.test.ts): public existing-document import with concurrent native changes.
- [Delivery](-spec/-delivery.test.ts): controlled pauses over a real Cmd/MessagePort transport.
- [Isolation](-spec/-isolation.test.ts): code/type reachability and fresh-process native
  initialization.
- [Mutation paths](-compare/README.md): async owner versus caller-native replica over worker Cmd.

## Constraints

Replicas share native clone/update history, not independently reconstructed values. The value
projection omits formatting and anchored positions. Yjs mapping is specific to the fixture schema,
not a general plain-object draft mapper.

Automerge 3.5.0 retains historical values/heads, but `marks()` reads current shared-backend
metadata, including through `view()`. The control distinguishes captured marks from later native
queries.

Repo 2.5.6 leaves a sync-throttle timer pending after `shutdown()`. Its standalone control awaits
bounded natural child exit, not a fixed sleep. This does not prove in-process shutdown quiescence or
native heap cleanup.

Isolation follows resolved code edges, literal dynamic imports, and conservative npm dependency
closure. Type resolution is reported separately. Poisoned entries test rejection of forbidden
imports; legitimate fixtures never import them. These are fixture graph checks, not browser bundle
proofs or coverage of runtime-computed imports.
