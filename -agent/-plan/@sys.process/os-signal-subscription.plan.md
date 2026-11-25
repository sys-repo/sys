@sys.process
os-signal-subscription.plan.md
- [x] d28c27405 feat(process): add Process.Signal.on and prove it in the Cell Vite fixture
- [x] 2099a68b4 refactor(cli): adopt Process.Signal.on in CLI and Cell
- [x] 444357263 refactor(server): adopt Process.Signal.on for hosted shutdown

## Intent

Contain native OS signal registration and removal in `@sys/process`. A signal delivered to the
current process does not imply terminal resize, graceful shutdown, child forwarding, or process
exit. The caller owns those policies. `@sys/cli` owns terminal behavior, not OS signal delivery.

Leave sending signals, child process control, exit codes, and existing public `Deno.Signal`
contracts outside the signal registration migration. This plan does not authorize Git mutation.

## Public API

`Process.Signal.on('SIGWINCH', handler)` is the **only public registration API**. Attach it to the
existing frozen `Process.Signal` namespace. No `Process.onSignal`, standalone listener export, or
new `@sys/process/signal` subpath. The existing Process entrypoints keep exporting the same object.

```ts
// t.Process.Signal
export type Lib = {
  on(name: Name, handler: () => void): Subscription;
  /** @deprecated Use Process.readyToken for child stdout readiness. */
  readonly ready: 'PROCESS_READY';
};

export type Name = 'SIGINT' | 'SIGTERM' | 'SIGHUP' | 'SIGWINCH';
export type Subscription =
  | { readonly kind: 'attached'; readonly dispose: () => void }
  | { readonly kind: 'unsupported' };
```

**Child readiness is not an OS signal.** Define `Process.readyToken` as the canonical literal
`'PROCESS_READY'`. Keep `Process.Signal.ready` as a deprecated compatibility property backed by that
same value; do not remove it in this migration. Move Process examples, tests, and the two Pi process
proofs to `Process.readyToken`. Do not change the `spawn({ readySignal })` contract or marker bytes.

**Registration, not a delivery guarantee.** `Name` is a `@sys/process/t` string-literal union, not
`Deno.Signal`. `attached` means the native registration succeeded. An absent add **or** remove
capability, or an independently established unsupported host/signal pair, yields `unsupported`.
Other registration errors propagate. A subscription can change native default handling; it does not
promise passive observation, burst delivery counts, or event-loop liveness.

**One call owns one attachment.** Use a unique native callback per call, even with the same caller
function. Capture the attaching provider, remover, name, and callback. A successful removal makes
disposal idempotent; a failed removal propagates and leaves the attachment retryable. Do not catch
callback failures or add hidden dispatch, registration on import, or fallback exit policy.

**Keep the provider private.** Use the Deno adapter first. The existing Process import graph reads
`Deno.stdout` eagerly in `code/sys/process/src/m.process/u/u.stdout.ts`; the public Process import
is not promised to work without Deno in this slice. Keep capability detection local to Signal so an
absent provider can be tested in isolation. A future non-Deno consumer must earn a cold-import proof
of the real Process entrypoint and a real delivery/teardown proof without adding an alternate signal
API. No stdout refactor, Node adapter, or runtime registry in this slice.

## Adoption order

### 1. Process and the Cell fixture

Historical proof at `d28c27405` (fixture and task later removed by `5823d7aef`):
implement the Process contract and migrate every registration in
`code/sys/cell/src/m.cli/-test/u.fixture.cli.vite.child.ts`: owner `SIGINT`, `SIGTERM`, `SIGWINCH`,
and leaf `SIGTERM`. Update `fixtureReady` in
`code/sys/cell/src/m.cli/-test/-task.cli.vite.process.ts`.

- Keep the early `OWNER` marker for acquiring cleanup authority; add a separate owner-ready marker
  after all three subscriptions attach. The leaf emits readiness only after its `SIGTERM`
  attachment. Require both readiness facts before the harness sends signals. Propagate unexpected
  leaf failure rather than treating a settled `leaf.status` as success.
- A leaf killed by native `SIGTERM` also frees its port. To prove graceful handling, have the leaf
  acknowledge completion only after the signal-driven server shutdown finishes successfully. In
  delayed mode, require that acknowledgement over an owned channel **and** a successful leaf exit
  before the owner prints `CLEAN`. Prove a leaf exit without the acknowledgement cannot count as
  graceful. Preserve the 9-second delay from `6c73a6a31`, stalled mode, and the intentional
  `leader-exit` orphan case.
- Prove rollback for `unsupported` and thrown registration failures at the second and third owner
  attachments and the leaf attachment. No combined readiness; earlier attachments and acquired
  resources are released, the failure stays visible, and no outer group kill or `proof.stop()`
  supplies the cleanup being asserted. Retain the real Vite fixture assertions for `RESIZED`, exit
  status, and descendant port release (`deno task test:cli:vite` in `code/sys/cell`).

### 2. CLI and Cell

- Preserve `Cli.Screen`'s existing Windows resize policy at the CLI edge. An OS signal listener
  attaching is not evidence of console resize delivery. Unsupported observation stays inert;
  registration failure releases upstream ownership and rethrows. Do not change terminal measurement
  or its authority checks. `Cli.keepAlive` must report missing `SIGINT` before entering its wait.
- In Cell shutdown, preserve best-effort attachment, first terminal reason, second-interrupt
  escalation, and cleanup aggregation/retry. Drive captured OS callbacks in tests: `SIGTERM` then
  keyboard interrupt retains `signal:SIGTERM` and calls `exit(130)`. `seal()` and `quit()` are not
  interrupts. Retry only failed handles. Consumer tests inject semantic subscriptions, not native
  listener methods. At `2099a68b4` the then-existing Vite launcher kept its distinct coalescing,
  forwarding, watchdog, and restoration policy.

### 3. Hosted shutdown

WebSocket `start({ lifecycle: 'process' })` keeps only attached disposers and continues past failed
registrations. Manual lifecycle installs nothing. The Cloudflare local serve task instead requires
the attachment before waiting on `server.finished`; `SIGINT` still aborts with that reason and the
server remains owned by `await using`. No public option for choosing required versus best effort.

## Retired scope: Cell sample launcher

`refactor(cell): delegate sample launcher process and terminal lifecycle` was superseded, not
implemented. `5823d7aef` deleted `runVite`, the trusted route that spawned a second Cell process,
its process-group watchdog and terminal snapshot/restore, and its dedicated fixtures. There is no
longer a child on that route for the proposed Process or CLI APIs to own.

The sample menu selects tasks through `DenoTask.Menu`; `@sys/driver-vite/service` owns the Vite
service, not an outer Cell process. Cell's remaining terminal PTY tests are not evidence that the
old launcher's descendant-cleanup or forced-exit guarantees transferred. Revisit extraction only
for a named production caller with a concrete lifecycle requirement.

## Owner proof and review dispositions

- **Public surface:** type-check all four names and reject misspellings. Verify the frozen
  `Process.Signal` surface and the unchanged readiness compatibility property. Verify no alternate
  public registration API is introduced.
- **Ownership:** prove missing add or remove, registration failures, callback error propagation, and
  exact-provider disposal after a provider swap. Make removal throw once, then succeed; a third
  disposal must not call the remover. In a bounded owned Deno child, attach the same callback twice,
  send and acknowledge two calls, dispose one, then send again and acknowledge one. After last
  disposal, compare native signal behavior with a fresh unregistered control on a host with a known
  terminating default. Keep the children alive independently and never signal the test runner or an
  unrelated process.
- **Windows evidence:** local Deno 2.9.8 builtin docs list all four names on Windows. This is
  provider documentation, not proof of Windows delivery. Do not copy Screen's Windows exclusion into
  Process or convert arbitrary add failures to `unsupported`. Record OS, Deno version, signal, and
  stimulus for runtime claims; distinguish add/remove, actual delivery, and console resize. No
  Windows delivery or resize claim without real Windows evidence.
- **Review disposition:** accept the fixture false-green, the Windows ownership distinction, and the
  lifecycle proof corrections. Supersede the review's recommendation for a narrow public entry and
  its corresponding cold-import test: there is one named capability and no alternate entrypoint.
  Preserve the import constraint explicitly rather than implying portability.
- **Scope:** retirement does not resolve the separately recorded animated PTY signal failure
  (`EPERM`). The surviving opt-in Cell signal proof is `test:proofs:signals`. The post-adoption
  scan found native listener references only in the Process adapter, its unit-test doubles, and
  the independent PID, capture, and spawn witnesses. See the
  [Deno API containment audit](../@sys/deno-api-containment.plan.md) for the wider inventory.
