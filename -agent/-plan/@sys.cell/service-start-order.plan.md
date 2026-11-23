@sys.cell
service-start-order.plan.md
- [x] 8a891e8d4 feat(cell): support declared service startup prerequisites
- [x] 6f056a0ee feat(http): support strict listener ports for static and proxy services
- [x] 5159899c3 feat(driver-stripe): support strict listener ports in the Stripe fixture
- [x] 44f14fed5 feat(cell): start the Stripe sample proxy after its upstreams
- [x] b17656507 feat(cell): preview and confirm stopping a selected sample

## One question for the service author

Which services must have successfully started before Cell may call this service's `start()`?
If the answer is “none”, write nothing. Keep independent services parallel. If there is a real
ordering constraint, declare it once on the dependent service using an optional `startAfter`
list of service names. It describes startup, not ongoing health or shutdown order.

For the [Stripe descriptor](../../../code/sys/cell/-sample/cell.stripe/-config/@sys.cell/cell.yaml),
`cell:proxy` declares:

```yaml
startAfter: ['ui:static:views', 'stripe:dev:fixture']
```

Its [proxy config](../../../code/sys/cell/-sample/cell.stripe/-config/@sys.http/proxy.yaml) already
sends the root and view assets to `4040` and the fixture route to `9090`, through a front listener
on `8080`. Putting the proxy last in YAML does **not** make it start last. Strict binds alone
would suffice for traffic *after* CLI readiness, but this run's proxy must not accept traffic
while an upstream is still starting. Keep all three services separately named and attributable.
Passkey has no proxy today; a future proxy could depend on its selected view and accounts, not
files. Do not infer dependencies from URLs, port probes, names, descriptor order or service kind.

## Cell contract

[Cell startup](../../../code/sys/cell/src/m.cell/u.services/u.start.ts) activates independent
services concurrently and waits for declared prerequisites before activating dependents.
Results remain in descriptor order. CLI readiness is reported after the batch resolves;
that announcement does not gate traffic to a listener already bound.

- Put `startAfter` on the service identity, not its variant, owner config, or CLI. A reference to
  `view` means its selected binding in this mode. Use one relation validator at descriptor load
  and planning, including for direct `Services.start` callers. Resolve against all service names:
  allow forward references; reject unknown, repeated, self and cyclic edges before any start.
  Name the offending reference and its descriptor path. Gate activation, not service discovery.
- Invoke a dependent exactly once after Cell has **accepted all its named starts** and while the
  batch is active. Do not wait for unrelated peers. A failure, timeout or cancellation cannot
  release waiting work. Start the endpoint timeout at activation (including import), not while
  waiting. At handoff, Cell either takes ownership of the returned handle or closes it exactly
  once. Preserve the original failure attribution, descriptor-ordered results and existing close
  order; do not wait indefinitely for a cancelled endpoint to return.
- Reuse the existing `start(args)` contract. Cell treats a successful return as the owner's word
  that startup is complete. It does not authenticate a port occupant or establish continuing
  availability. No new ready callback, health polling, process supervisor or task-graph framework.
- Keep descriptor types, schema/validation, planning, startup, and the effective service DSL in
  agreement. Show omission and the single-field example in the bundled service DSL; proxy help
  should refer to the service rule, not define a second one. Do not expose scheduler state
  or forward dependency names to endpoints.

## Exact binds are a separate owner responsibility

Ordering alone is insufficient if a prerequisite can return success on a different port.
[HttpStatic](../../../code/sys/http/src/http.server/m.HttpStatic/u.start.ts) and
[HttpProxy](../../../code/sys/http/src/http.server/m.HttpProxy/m/m.HttpProxy.ts) carry
`strictPort` through owner config and startup to `HttpServer.start`; their config writers
recognize strictness-only changes.
[StripeFixture](../../../code/sys.driver/driver-stripe/src/server/m.StripeFixture/u.start.ts)
also forwards strictness from owner YAML or start arguments. Enable it for all three Stripe listeners. Preserve preferred-port
behavior when omitted and HTTP's port-zero semantics. Do not add port selection, reservation,
HTTP policy or Stripe knowledge to Cell. Passkey's Serve binding belongs to its own adoption work.

## Proof and handoff

1. **Cell:** Use controlled start promises and an invocation log, not sleeps. Put the dependent
   first in the descriptor. Hold two prerequisites; release one and prove the dependent has not
   started; release the other and prove it starts once even while an unrelated peer remains
   pending. Cover forward references in default and variant modes, a transitive edge and invalid
   graphs (including one changed after load) with zero starts. Retain concurrency and close tests.
2. **Cancellation at handoff:** The existing late-handle test returns a handle *after* timeout.
   Also cancel after an endpoint returns a closeable handle but before activation accepts it.
   First demonstrate the suspected ownership gap with a controlled endpoint and close counter;
   do not claim a reproduced leak from source inspection. Test a failing or timed-out prerequisite
   with a sibling that returns late. Require zero dependent invocations, one close per acquired
   handle with the winning reason, and the original service and cause even if cleanup also fails.
3. **Listener owners:** Exercise each owner through `paths.config` on loopback. On an occupied
   fixed port, strict must fail and omission must yield a working alternate. On a free fixed port,
   strict must return that exact port. Round-trip strictness through supported HTTP config edits,
   including a strictness-only change, then repeat the collision check.
4. **Stripe happy path:** Use the actual descriptor, configs and `deno task sample:stripe` from
   `code/sys/cell` in a credential-free environment with no ancestor `.env`. Through the proxy, GET `/` for the sample page and GET
   `/-/stripe/payment-intent` for the fixture's method error (`405`, `Allow: POST`, fixture body).
   Loopback only; no credentials, payment requests or external Stripe calls.
5. **Collision control:** In a controlled fixture, occupy `4040` and `9090` in separate trials
   with a counting listener. Hold the corresponding upstream before bind and record proxy endpoint
   entries. After the hold is acknowledged, complete a marked GET to `8080` on the route for that
   upstream *before* releasing the hold. With the edge, require no front response, zero proxy starts
   through rejection and late cleanup, and zero forwarded requests. Verify a sibling that bound
   can be rebound after cleanup. As a positive control, omit only the held upstream's edge, let
   the other upstream succeed and the proxy bind, then send the same GET during the hold: the
   occupant must receive it. A `502`, a final startup error or a zero count alone is not proof.

Run focused schema, service and help checks in the Cell owner, listener tests in their owners, then
module checks and exact-file fmt/lint.

**Stripe verification:** `deno task test:sample:stripe` passed all five steps on remapped,
test-owned loopback ports: both proxy GETs and the collision trial with and without each
upstream's edge. The configured-port proof (`deno task test:sample:stripe -- --fixed`) and the
literal `deno task sample:stripe` launch were deferred, not passed. Passkey was out of scope.

## Follow-on: `deno task sample kill`

From `code/sys/cell`, let the operator select a service sample without remembering its directory
or mode. Handle `kill` in [`-scripts/task.sample.ts`](../../../code/sys/cell/-scripts/task.sample.ts);
keep bare `sample`, exact task selection, help/list and non-interactive behavior intact. Do not
change the shared `DenoTask.Menu`. A non-interactive invocation must never imply confirmation.

| Target | Root | Explicit mode |
| --- | --- | --- |
| Stripe | `./-sample/cell.stripe` | `default` |
| Deploy | `./-sample/cell.deploy` | `default` |
| Vite | `./-sample/cell.vite` | `default` |
| Vite (dev) | `./-sample/cell.vite` | `dev` |

Deploy means `sample:deploy:start`, not the staging task `sample:deploy`. Always pass the mode:
without a session record, Cell needs it to consult declared listeners such as the Stripe static
view on `127.0.0.1:4040`. A listener at the declared address is not proof of sample ownership.

1. Handle only the `sample kill` gesture, including the menu's optional leading `--`, in
   `-scripts/task.sample.ts`. Delegate bare selection, exact task dispatch and child status,
   help/list and their aliases, and invalid arguments to the existing menu. Offer the four service
   starts by task name plus `(exit)`. Selection is not consent. With `--non-interactive` or without
   interactive stdin and stdout, refuse the kill picker before opening either prompt or dispatching
   cleanup. Do not add `sample:kill` to the start menu.
2. Await `CellCli.run({ argv })` in-process with `kill`, the selected root, `--mode`, its explicit
   value, and `--dry-run`. The CLI prints its report once; do not echo `result.text`. Only a
   successful `kind: 'kill'` dry run with `would-terminate` in either `sessions` or `resources`
   warrants confirmation. Leave mixed results and skip reasons visible. Empty, inactive,
   stale-record-only and skipped-only previews return without mutation. Do not infer ownership or
   availability from a successful preview, or discover additional ports from sample YAML.
3. Name the selected root and mode at confirmation. Ask: **“Cell will scan again. It may remove
   dead session records and stop recorded supervisors and processes it finds listening at declared
   addresses. Those processes may be unrelated or different from the preview. SIGTERM can escalate
   to SIGKILL. Run this cleanup?”** Use `Cli.Input.Confirm` with `default: false`. Only explicit yes
   invokes the same argv once with only `--dry-run` removed. Never add `--force`. Exit or No is a
   successful no-op; prompt errors and unexpected results fail closed. Use `setExitCode` at the
   entrypoint to propagate a preview failure or the actual live status, including partial failure.
4. With injected prompts and a fake runner, prove all four mappings, menu delegation, refusal
   before prompting in non-interactive mode, mixed and non-actionable statuses, confirmation
   wording/default, yes-only dispatch and exit codes. Exercise one real CLI dry run under `-P=sample`
   against a temporary sample, an empty isolated session registry and a test-owned loopback listener.
   Assert one visible report identifying the listener before confirmation; decline and verify it
   still serves. Use the kill owner's tests for targeting semantics, not a fake runner as evidence
   of process identity. Run scoped tests and package checks from `code/sys/cell`; do not signal
   developer listeners.
