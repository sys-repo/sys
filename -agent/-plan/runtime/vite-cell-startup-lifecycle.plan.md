# Cell + Vite service startup lifecycle hardening

## Commit plan

- [x] fix(driver-vite): avoid runtime vite import in config define facade — 4e0ba7190
- [x] feat(cell): show elapsed service startup progress — 3911f958d
- [x] feat(cell): bound service startup with timeout — 229b715dc
- [x] fix(process): reject spawn readiness on early child exit — 51e048615
- [x] test(process): factor shared process test fixtures — ccbb0cab3
- [x] fix(driver-vite): harden cell vite startup readiness — 4a0483843

## Status

This plan is complete. Cell startup progress, generic Cell startup timeout, the prerequisite
`@sys/process` readiness contract fix, and Vite-specific strict-port/readiness hardening are
committed. Cell timeout validation remains deterministic and does not depend on live Vite/JSR
startup.

Current stable commits:

```text
4e0ba7190 fix(driver-vite): avoid runtime vite import in config define facade
3911f958d feat(cell): show elapsed service startup progress
229b715dc feat(cell): bound service startup with timeout
51e048615 fix(process): reject spawn readiness on early child exit
ccbb0cab3 test(process): factor shared process test fixtures
4a0483843 fix(driver-vite): harden cell vite startup readiness
```

Final tree hygiene:

- Commit this completed plan as a plan lifecycle artifact only.
- Do not include unrelated external probe edits unless explicitly approved.
- Do not reintroduce a live Vite/JSR startup proof into `@sys/cell` CI.
- Do not commit random localhost URL lockfile churn from Vite dev/test runs.

## Trigger

`deno task dev` runs:

```sh
deno run -P=dev @sys/cell start . --mode dev
```

In `deploy/@draft.shell`, `--mode dev` selects:

```yaml
service: draft:ui
use: ViteService
from: jsr:@sys/driver-vite/service
config: ./-config/@sys.driver-vite/view.dev.yaml
```

A previous timed-out run left a `deno` process listening on `1234`. Direct `dev:vite` fell forward
to another port, while Cell startup stayed in the startup phase with weak failure signal.

## Diagnosis

Four seams need tightening together:

1. **Startup progress visibility**
   - The CLI currently shows only `starting two services...` while startup is pending.
   - If startup takes longer than expected, there is no elapsed-time signal and no clue whether work is
     still alive.
   - Existing repo examples avoid noisy sub-second elapsed text and show elapsed only after 1s:
     - `code/sys.tools/src/cli.deploy/u.menu/run.stagingWithSpinner.ts`
     - `code/sys.driver/driver-vite/src/m.vite/u.build.ts`
   - Cell should follow that pattern: no elapsed suffix before 1s; after that, refresh spinner text with
     elapsed time, e.g. `starting two services... 1s`.

2. **Service startup timeout**
   - Cell service startup currently has no generic bounded startup window.
   - A service import/start promise can hang and leave the CLI spinner alive indefinitely.
   - Add a Cell-owned startup timeout around service verify/start composition. Default should be
     long enough for normal Vite cold start but short enough to be humane; start with `10s` unless
     real app evidence says `5s` is safe.
   - Add an optional per-service `timeout` descriptor field for known slow services.

3. **Service port contract**
   - A Cell service config port is operational intent.
   - If `port: 1234` is occupied, startup should fail clearly instead of silently falling forward.
   - Ad-hoc `dev:vite` may still keep Vite's fall-forward behavior.

4. **Child readiness failure and cleanup**
   - `Vite.dev(...)` waits for readiness from process output / HTTP probes.
   - If the child exits before readiness, startup must reject with useful cause/context.
   - A readiness promise must not hang forever after child failure.
   - On startup failure, timeout, or cancellation, any in-flight child process must be disposed.
   - Cell should close already-started services in reverse order, but not learn Vite-specific details.

## Target behavior

For Cell mode:

```text
Cell.Services.start: failed to start service 'draft:ui'.
caused by: ViteService: port 1234 is already in use
```

Invariants:

- Cell remains service-generic.
- Cell owns generic startup UX: elapsed spinner and bounded startup timeout.
- `@sys/driver-vite` owns Vite port/readiness semantics.
- `@sys/process` owns child process completion/readiness primitives.
- Direct `dev:vite` behavior is not broken by strict Cell service behavior.
- No stale child process remains after failed startup.

## Implementation plan

### 1. Add elapsed startup spinner text

Likely files:

```text
code/sys/cell/src/m.cli/u.start.ts
code/sys/cell/src/m.cli/-test/-start.test.ts
```

Plan:

- Start with existing text: `starting two services...`.
- Refresh spinner text every second while startup is pending.
- Show no elapsed suffix before 1s.
- After 1s, append dim/gray elapsed using `Time.elapsed(startedAt).toString()`.
- Clear the interval in all paths.

### 2. Add generic startup timeout to Cell services

Likely files:

```text
code/sys/cell/src/common/libs.ts
code/sys/cell/src/m.cell/common.ts
code/sys/cell/src/m.cell/t.ts
code/sys/cell/src/m.cell/u.services/u.start.ts
code/sys/cell/src/m.cell/u.schema/u.schema.descriptor.ts
code/sys/cell/src/m.cell/u.schema/-test/-.test.ts
code/sys/cell/src/m.cell/-test/-u.services.start.test.ts
```

Plan:

- Use a simple earned timeout API:
  - runtime option: `Cell.Services.start(cell, { timeout?: t.Msecs })`
  - descriptor binding field: `timeout?: t.Msecs`
  - no `startupTimeout`, no `startupTimeoutMs`, and no nested `{ timeout: { startup } }` until
    additional timeout dimensions prove real.
- Add the default at the closest Cell default seam:
  - `D.services.start.timeout = 10_000 as t.Msecs`
- Effective per-service timeout precedence:
  - `options.timeout ?? selectedService.timeout ?? D.services.start.timeout`
- Start selected services concurrently. Cell has no dependency model, so descriptor order must not
  imply serialized startup. If ordered dependencies are needed later, they should be explicit DSL.
- Apply timeout per selected service, not as an accumulated startup timeout for the full set.
  Total normal startup is therefore bounded by roughly the max selected service timeout.
- Preserve descriptor ordering in the returned `started.services` array and close services in reverse
  descriptor order.
- Use Cell-owned abortable lifecycles:
  - bridge caller `until` into a batch lifecycle
  - create one per-service abortable lifecycle
  - pass the per-service signal as endpoint `args.until`
  - timeout/cancel aborts that service's lifecycle
  - `started.close(reason)` aborts Cell-owned lifecycles and then closes/disposes owner handles
- Bound endpoint import/verify and `endpoint.start(args)` wait. Keep dynamic `import()` as the runtime
  endpoint mechanism; `import defer` is not expected to help because Cell must access the selected
  export before calling `start(...)`, which is where deferred evaluation would occur.
- Best-effort late cleanup: if a timed-out import/start promise resolves after failure with a handle,
  close/dispose that late handle.
- On timeout, throw a clear named-service cause while preserving the outer start error shape:
  - `Cell.Services.start: failed to start service 'view'.`
  - cause: `Cell.Services.start: service 'view' startup timed out after 10s.`
- On first startup failure or cancellation, abort sibling service startup lifecycles and close any
  handles that already resolved.
- BMIND caveat: dynamic `import()` cannot be force-killed in-process. This commit bounds Cell's wait
  and aborts compliant services; full preemption of hostile top-level-await modules would require
  Worker/process isolation and is outside this commit.

### 3. Fix spawned process readiness contract

Likely files:

```text
code/sys/process/src/m.process/t.proc.ts
code/sys/process/src/m.process/u.proc.spawn.ts
code/sys/process/src/m.process/-test/-m.Process.spawn.test.ts
```

Plan:

- Treat `Process.spawn(...).whenReady()` as a real readiness contract:
  - resolve only when the ready signal is observed,
  - reject if the child exits before readiness,
  - reject if the handle is disposed before readiness.
- Surface a useful error with command/pid/status context.
- Keep existing ready-signal behavior intact for successful long-running children.
- Add bounded process tests with short `deno eval` children; no sleeps longer than necessary.

Committed:

```text
51e048615 fix(process): reject spawn readiness on early child exit
ccbb0cab3 test(process): factor shared process test fixtures
```

### 4. Add strict-port path for Cell-owned Vite services

Likely files:

```text
code/sys.driver/driver-vite/src/m.service/t.ts
code/sys.driver/driver-vite/src/m.service/u.dev.ts
code/sys.driver/driver-vite/src/m.vite/t.ts
code/sys.driver/driver-vite/src/m.vite/u.dev.ts
code/sys.driver/driver-vite/src/m.vite/u.wrangle.ts
```

Plan:

- Add `strictPort?: boolean` to the driver Vite dev path.
- Add `--strictPort` to the Vite command only when explicitly opted in.
- Have `ViteService` pass `strictPort: true` when owner config declares a concrete `port`.
- Keep direct/template `Vite.dev` and `dev:vite` fall-forward unchanged unless they opt in.

### 5. Make driver-vite readiness failure-aware

Likely files:

```text
code/sys/process/src/m.process/u.proc.spawn.ts
code/sys/process/src/m.process/t.proc.ts
code/sys.driver/driver-vite/src/m.vite/u.dev.ts
```

Plan:

- Remove the readiness failure mask:
  - no `proc.whenReady().catch(() => new Promise<never>(() => {}))`.
- Use process output readiness as the authority for the resolved Vite URL.
- After output readiness, HTTP-probe the resolved URL to confirm the server is reachable.
- Do not let an arbitrary HTTP server on the requested port falsely satisfy startup readiness.
- Fail fast on child early exit or caller disposal.
- On startup failure, dispose the child process and bootstrap resources.
- Preserve useful stderr/stdout context where available.
- Keep Cell generic: driver-vite owns Vite-specific startup causes; Cell only reports the service cause.

Committed:

```text
4a0483843 fix(driver-vite): harden cell vite startup readiness
```

### 6. Verify cleanup on failed startup

Likely files:

```text
code/sys.driver/driver-vite/src/m.vite/-test/-dev.test.ts
code/sys.driver/driver-vite/src/m.service/-test/-.test.ts
code/sys/cell/src/m.cell/-test/-u.services.start.test.ts
```

Plan:

- Test startup spinner hides elapsed before 1s and shows elapsed after 1s.
- Test default service start timeout is `D.services.start.timeout === 10_000`.
- Test services start concurrently and preserve descriptor-order result ordering.
- Test service start timeout names the timed-out service and closes already-started services.
- Test descriptor accepts per-service `timeout` and rejects invalid values.
- Test hung endpoint import/verify times out.
- Test hung endpoint start times out.
- Test caller `until` cancels startup cleanly.
- Test late-resolving handles after timeout are closed/disposed best-effort.
- Test `Process.spawn(...).whenReady()` rejects when a child exits before the ready signal.
- Test direct `Vite.dev` still falls forward to the next port by default.
- Test `Vite.dev({ strictPort: true })` with occupied port rejects quickly and disposes.
- Test `ViteService` passes `strictPort: true` when owner config declares `port`.
- Test child exits before ready → `Vite.dev` rejects; no hanging readiness promise.
- Do not restore a live Vite/JSR proof inside `@sys/cell` CI.

## Validation

Run narrow first:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/process
deno test -P=test --trace-leaks ./src/m.process/-test/-m.Process.spawn.test.ts

cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite
deno task test --trace-leaks ./src/m.vite/-test/-dev.test.ts ./src/m.service/-test/-.test.ts
```

Then prove the affected app:

```sh
cd /Users/phil/code/org.sys/sys/deploy/@draft.shell
deno task dev
```

## Non-goals

- Do not make Cell know about Vite.
- Do not remove Vite's normal fall-forward behavior from direct `dev:vite`.
- Do not fold this into the Vite config facade plan; that is a separate dependency-ownership cleanup.
