disposal-protocol-browser-compatibility-cleanup.plan.md
- [x] [disposal-protocol-browser-compatibility.plan.md](./disposal-protocol-browser-compatibility.plan.md)
- [x] 5adfc0c5b test(driver-vite): consolidate external runtime probe fixtures
- [x] e25c15485 test(driver-vite): sharpen browser compatibility proof ownership

Status: Complete and reconciled; JSR publication is in progress.

## Intent

After the browser-compatibility campaign lands, remove the test-harness scar tissue accumulated while
proving disposal symbols, OXC lowering, Vite delivery, bundle graphs, and browser execution.

Preserve every substantive proof while restoring a high signal-to-mechanics ratio. This is test
architecture cleanup, not a feature redesign, compatibility change, or test-count reduction exercise.

## Governing relationship

The directly governing prerequisite is
[`disposal-protocol-browser-compatibility.plan.md`](./disposal-protocol-browser-compatibility.plan.md).
It remains the sole authority for disposal compatibility behavior, browser targets, runtime
semantics, and Safari/Chromium evidence and acceptance status.

Its opening reference is checked because every prerequisite arc item is uniquely landed and the
plan records final reality. Implementation reopened that snapshot, retained its substantive proof,
and did not reopen functional design. This plan grants no Git mutation authority.

## Current reality

The test pyramid remains healthy and every distinct compatibility proof remains in place:

- Commit `5adfc0c5b` landed `u.fixture.probe.ts`, moved the canonical marker out of runtime
  `m.vite/common.ts`, and migrated all four repeated probe callers without adding an execution world.
- `m.vite/-test/u.syntax.ts` remains the sole Explicit Resource Management syntax detector.
- The focused `-u.browserSyntaxTargets.test.ts` now independently locks the exact frozen browser
  floor and fresh mutable helper copies; `-app.test.ts` still owns distinct build/OXC config arrays.
- The synthetic OXC-ordering test is removed while direct injection and real OXC integration proof
  remain.
- The Chromium fixture is renamed to `-browser-syntax.chromium.ts`; its suite title, temporary path,
  and external entry import now identify the actual browser under automation.
- The positive `_usingCtx`, `Object is not disposable.`, and installer-error graph discriminators are
  retained because no equally discriminating replacement was introduced.
- No production behavior, public API, dependency, browser target, bundle policy, or runtime world
  changed. The only non-test source delta was removal of the test-only probe marker from internal
  defaults in the landed first arc.

Commit `e25c15485` uniquely landed the second arc. Both cleanup commits are now reconciled above.
The prerequisite plan records the release handoff and exact JSR targets:
[`@sys/std@0.0.380`](https://jsr.io/@sys/std@0.0.380) and
[`@sys/driver-vite@0.0.474`](https://jsr.io/@sys/driver-vite@0.0.474).

## Proof ownership map

| Contract | Primary owner after cleanup |
|---|---|
| Plugin filtering, injection, idempotence, bootstrap exclusion, source map | `m.DisposeProtocolCompat/-test` |
| Exact browser syntax floor, frozen authority, and fresh helper copies | focused `m.vite.config/-test/-u.browserSyntaxTargets.test.ts` |
| Build/OXC target wiring and distinct config-boundary arrays | `m.vite.config/-test/-app.test.ts` |
| Generated OXC helper authority and dev resolution | `m.vite/-test/-bridge.integration.test.ts` |
| Dynamic, module-worker, and service-worker emitted lowering | `m.vite/-test/-build.test.ts` |
| Incumbent symbols and one installer per client bundle graph | `-dispose-protocol-compat.runtime.ts` |
| Missing-symbol lowering semantics and suppression | `-browser-syntax.runtime.ts` |
| Document dev/production lowering, execution, order, and native identity | renamed Chromium fixture |
| Safari WebDriver attempt and unresolved automation evidence debt | prerequisite plan's final reality |

A cheap supporting assertion may remain when it localizes a different failure. Path proximity or a
second assertion of the same outcome is not independent proof. Do not merge distinct worlds merely
to reduce file count.

## Commit contracts

### `test(driver-vite): consolidate external runtime probe fixtures`

Introduce one narrow `m.vite/-test.external/u.fixture.probe.ts` helper for the established child-probe
protocol. It owns only:

- the canonical probe marker, moved out of runtime `m.vite/common.ts`;
- a temporary TypeScript child path under the package root, derived from a required caller-supplied
  probe name so commands and orphaned files remain attributable;
- bounded Deno invocation through `u.fixture.task.ts`;
- canonical prefixed JSON extraction;
- unconditional child-source cleanup.

Migrate the four existing callers named in the current-reality record. Callers continue to own probe
name, child source, exact permissions, failure message, payload type, Vite lifecycle, and assertions.
Preserve current differences such as `--allow-import` and `--no-lock`; do not silently widen
permissions or environment. Removing the test-only `probeJsonPrefix` field from internal runtime
`DEFAULTS` is the only non-test source change admitted by this cleanup and must not alter runtime
behavior or the remaining `DEFAULTS.port` contract.

Do not create a generic fixture DSL or a new child-process test world. Use the migrated probes as the
helper's integration proof. After mechanics are removed, promote a large child program to a named
`u.fixture.*.child.ts` module only when ordinary type checking and navigation materially improve and
the probe's publish/isolation boundary remains intact. In particular, retain generated source where
the `@sys/std/try` dynamic-localhost publish boundary requires it.

Acceptance:

- the four callers no longer define local equivalents of child execution or prefixed JSON parsing;
- the probe marker has one test-infrastructure owner and no runtime-default owner;
- every generated command path retains a scenario-specific probe name;
- all prior payloads, permissions, diagnostics, and cleanup behavior remain observable;
- the scoped inventory does not exceed its current six child invocations;
- assertion source stays in the scenario file; line-count reduction alone earns no abstraction.

### `test(driver-vite): sharpen browser compatibility proof ownership`

- Add the focused browser-target test with the exact sequence
  `chrome111, edge111, firefox114, safari16.4, ios16.4`; prove the canonical array is frozen and
  `browserSyntaxTargets()` returns a fresh mutable copy per call. Retain `-app.test.ts`'s
  `build.target !== oxc.target` assertion as the config-boundary identity owner; broader config tests
  prove wiring and need not repeat the literal list.
- Delete the synthetic OXC-ordering test if the prerequisite's final snapshot still matches the
  reviewed form. Otherwise rename it to the exact observable transform contract and retain it only if
  it adds failure localization beyond the injection test.
- Rename `-browser-syntax.shipping.ts` to `-browser-syntax.chromium.ts`; update its describe title,
  temporary-directory prefix, and the external entry module. Do not imply that this automated fixture
  proves Safari.
- Keep `u.syntax.ts` as the only emitted-syntax detector.
- Prefer stable resolution, graph, or runtime behavior over private generated fingerprints, but do
  not remove `function _usingCtx`, `Object is not disposable.`, or the installer error-text marker
  until an equally discriminating positive dev-resolution, build-graph, or installer-per-graph
  signal respectively replaces it.
- Reopen the proof map after edits and remove only duplicate assertions; preserve every distinct
  failure family and all source-map, process-isolation, worker, service-worker, suppression, and
  native-identity evidence.

Acceptance:

- each proof-map row has one legible primary owner;
- the scoped inventory adds no build, child-process, worker, service-worker, or browser world;
- two Chromium page loads remain sufficient for dev/build capstone proof;
- the prerequisite's Safari 26.5.2 WebDriver attempt and unresolved Allow Remote Automation debt
  remain explicit; no successful Safari automation claim is introduced;
- production behavior, dependencies, browser targets, and public APIs are unchanged; the sole
  admitted non-test source delta is removal of the test-only probe marker from internal
  `m.vite/common.ts`.

## Efficiency contract

Reuse the prerequisite's final external-lane elapsed time as the baseline when it is recorded. If it
is unavailable, run `deno task test:external` once before the first cleanup edit; never regenerate a
baseline after each change.

Iteration order is fixed:

1. Add the probe helper and migrate `-std-try.runtime.ts` as the single canary.
2. Run that one file; fix the helper until green.
3. Migrate the other three callers as one batch, then run all four migrated files once.
4. Complete proof-ownership edits, then run only the affected config/plugin files. If fingerprint
   ownership changes `-bridge.integration.test.ts` or `-build.test.ts`, run those two files together
   once before browser capstones.
5. Run missing-symbol runtime once and the Chromium capstone once after those edits stabilize.
6. Run package check, package tests, and the full external lane once at final acceptance.

If a targeted run fails, rerun only that file after correction. Do not restart the aggregate lane for
a local fixture or assertion defect.

## Verification

```text
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite && deno task test --trace-leaks ./src/m.vite/-test.external/-std-try.runtime.ts
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite && deno task test --trace-leaks ./src/m.vite/-test.external/-std-try.runtime.ts ./src/m.vite/-test.external/-published-pure-jsr-authority.ts ./src/m.vite/-test.external/-dispose-protocol-compat.runtime.ts ./src/m.vite/-test.external/-browser-syntax.runtime.ts
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite && deno task test --trace-leaks ./src/m.vite.plugins/m.DisposeProtocolCompat/-test ./src/m.vite.config/-test/-app.test.ts ./src/m.vite.config/-test/-u.oxcPreflight.test.ts ./src/m.vite.config/-test/-u.browserSyntaxTargets.test.ts
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite && deno task test --trace-leaks ./src/m.vite/-test/-bridge.integration.test.ts ./src/m.vite/-test/-build.test.ts
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite && deno task test --trace-leaks ./src/m.vite/-test.external/-browser-syntax.runtime.ts ./src/m.vite/-test.external/-browser-syntax.chromium.ts
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite && deno task check
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite && deno task test
cd /Users/phil/code/org.sys/sys/code/sys.driver/driver-vite && deno task test:external
```

Record final elapsed time beside the reused or freshly measured baseline. Completion requires the
same or stronger compatibility evidence, no repeated child-probe mechanics in the four migrated
callers, truthful browser naming, no synthetic OXC claim, no added execution world, and no generic
test framework.

## Verification record

- External baseline: 1m33s.
- External final: 1m32s; compatibility-owned scenarios passed.
- Pre-existing external failures remain the Rolldown signal-listener leak and published UI dependency
  resolution; neither was introduced or widened by this cleanup.
- Final plan state: both arcs are uniquely landed; the cleanup plan is complete.
- JSR publication is governed by [`.github/workflows/jsr.yaml`](../../../.github/workflows/jsr.yaml):
  `@sys/std@0.0.380` is job 1/13 and `@sys/driver-vite@0.0.474` is job 12/13. CI and registry
  visibility remain in progress; this plan makes no completed-publication claim.

## Retirement

Retire this plan together with its prerequisite plan only after this final-reality snapshot is
committed and JSR CI confirms registry visibility for both published versions.
