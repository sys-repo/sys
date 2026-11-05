# Focused candidate and cleanup evidence

Governing plan: [linux-wsl-probe.plan.md](../linux-wsl-probe.plan.md).
This records phases A-D before the application/full-CI rollout. Results below were recorded by
prior passes, not rerun during documentation cleanup. The driver-vite-only CI selection was a
diagnostic, not the continuing acceptance scope. See [phase E proof](./phase-e-proof.md) for the
application launcher inventory, restored matrices and subsequent evidence limits.

## Incident and focused candidate

The inspected runtime/dependencies were Deno 2.9.8 and Vite 8.3.5. Checkpoint CI screenshots showed
driver-vite Linux **63 passed / 2 failed**, both at the optional WSLInterop probe; its proof step was
skipped. The `@sys/dev` application build showed the same error. Other matrix failures were not
assumed to share that cause.

Confirmed error: `NotCapable: Requires all access to
"/proc/sys/fs/binfmt_misc/WSLInterop", run again with the --allow-all flag`.
Non-Linux execution skipped that branch, so macOS success did not establish Linux startup success.
A matched exact-marker masking diagnostic established the mechanism; the mask was not the selected
implementation and must not be repeated as a repair. Earlier upstream research found Deno issue
#37062 and proposed PR #37066, then unmerged/unreleased. No released fix was available at that check;
this is historical research, not a fresh upstream-status claim.

The focused candidate used baseline `bc13dd19eef43dcd49c894bb985cc25ac0828e89` on `phil-work` in
`/Users/phil/code/org.sys/sys`. The local `origin/phil-work` ref matched at inspection; that was local
Git evidence, not verification of remote execution. Reconciliation before phase E used
`0b879c4c534786572fb7e5e2d6ded6edfb214081`. Landing identities and the original-item mappings remain
in the governing plan's opening arc and reconciliation notes.

The focused delta covered child arguments, module test/sample build/dev/info launchers, fresh-parent
proof fixtures, documentation and temporary CI selection. No dependency version, lockfile or
delivery-ownership change was included. Each startup handle retained its own map/shim directory,
stable authority identity, setup rollback and awaited cleanup.

Recorded local macOS evidence:

- Module `check`, command/delivery/lane checks (**3 tests / 31 steps**), `test:unit`
  (**66 tests / 536 steps**), all nine `test:proofs` tasks and the real module build passed.
  The proof aggregate preceded the added ordinary build/dev regression; subsequent `test:dev`
  passed **1 test / 9 steps**, including that case. Localhost access and a color-enabled terminal
  environment were required for existing assertions.
- The ordinary no-path regression used the existing disposable native fixture and child-probe helper.
  It covered absent/independent Deno configuration, build output, dev HTTP and disposal. It used the
  default dependency policy: the independent fixture had no prepared lock and correctly rejected
  `frozen-cache`; dedicated proofs retained frozen coverage.
- Root `prep:ci` generated a driver-vite-only build/Linux selection while preserving publishing,
  Linux graph/cache/proof prerequisites and workflow controls. Windows generation was skipped:
  driver-vite had no Windows task and no Windows workflow was present.
- CI selection belonged to the root callsite, not `@sys/workspace`. The reviewed second `checkPaths`
  list became an optional `filter` over caller-owned `sourcePaths`. Callsite/aggregate tests passed
  **2 tests / 10 steps**; reruns after the predicate change passed the same tests and regeneration
  left workflow outputs unchanged. Publishing continued to use the complete source list.
- The pre-CI pass inspected all 17 implementation paths. Dev/CI fixture writes used `{ throw: true }`;
  README guidance and zero-match workflow-removal docs were corrected. Dev/CI-selection tests passed
  **3 tests / 19 steps**; formatting passed for 15 authored files and `git diff --check` passed.
  Permission-helper cleanup was excluded. A later style pass factored selection/assertions/fixtures
  and compacted leaf collections; affected tests passed **6 tests / 50 steps**, with formatting
  passing for the same 15 authored paths. Generated workflow layout was retained.
- A human-supplied blind review returned **GO for the first focused Linux commit**, reporting no
  material blocker across 17 files, **66 unit tests / 536 steps**, **29 proof tests / 157 steps**,
  and a real sample build on macOS. These are reviewer-reported results, not the authoring pass's
  direct receipts. The review used the earlier two-list CI API; subsequent predicate checks were
  separate evidence. It did not certify later API/documentation revisions or Linux acceptance.
- Documentation findings 1-4 were reconciled: unreleased trusted-child behavior, predicate
  omission/removal semantics, an argument/map-construction test title rather than an executed-startup
  claim, and incident/retirement rationale. Finding 5 defined the permission-helper cleanup scope.
  Static review and commit whitespace checks found no focused-experiment blocker; that pass ran no
  new runtime tests or live GitHub checks.

## Focused GitHub acceptance

The human-provided Actions overview screenshot showed green `test:linux #50` and `build #684` for
`bc13dd1` on `phil-work`, supporting cleanup from baseline `bc13dd19e`.
Individual job logs, counts and run URLs were not inspected at that point. These results covered the
diagnostic selection, not full application/matrix acceptance.

Earlier failing [build](https://github.com/sys-repo/sys/actions/runs/41741553904) and
[test:linux](https://github.com/sys-repo/sys/actions/runs/41741553823) runs concerned `c383f979c`.
The later exact-SHA focused cleanup-baseline runs are linked in the phase E receipt; neither set
certifies the restored full matrices.

## Cleanup receipts

The six-helper deletion was measured against `bc13dd19e`: `permissions`, `ffiRoots`, `writeRoots`,
`viteCacheDir`, `viteConfigTempDir` and `tryRealPath` were private and unreachable in `u.wrangle.ts`.
The 71-line deletion preserved live arguments, dependency selection and startup ownership, with no
launcher, assertion, preset or CI-selection change in that measured delta.

On macOS arm64 / Deno 2.9.8, module `check` passed; startup/delivery/payload/command tests passed
**4 tests / 28 steps**, `test:build` **7 tests / 17 steps**, and `test:dev` **1 test / 9 steps**.
Existing tasks used strict leak checks. Formatting/whitespace checks passed and the six helper names
were absent from edited source. This was not a Linux run or a full proof aggregate.

The broader F2-F4 cleanup was separately validated on macOS arm64 / Deno 2.9.8: formatting passed for
six TypeScript files; module `check` passed; reporting/transport/startup/command checks passed
**7 tests / 51 steps**, `test:loader` **2 tests / 3 steps**, `test:build` **7 tests / 17 steps**,
`test:dev` **1 test / 9 steps**, and `test:entry:process` **2 tests / 10 steps**, including restricted
cached serving. Existing tasks retained strict leak checks. Scoped whitespace and touched-file review
passed. Removed helper/converter/async-builder uses were absent; the retired verdict field remained
only as deliberate legacy input in the reporting regression. The plan identity block was not
blanket-formatted.

The reporting expectation first required a zero-padded index correction, then failed against the
old note-emitting behavior and passed after note removal. Dead-converter removal and the private
synchronous simplification had no new red step; existing behavior tests covered them. That pass did
not rerun performance measurement, Linux, full external/browser/proof aggregates, Pi integration,
generated-workspace execution or full application/CI acceptance.

## Module-wide audit and dispositions

The independent read-only TMIND/STIER audit found no blocker to the six-helper deletion, accepted
F2-F4 and deferred launcher-policy gap F1 to phase E. The human explicitly admitted older tooling
residue: F2 and F4 predate trusted execution and were not consequences of `-A`.

Coverage included public exports/CLI, ordinary/explicit build/dev/configuration, startup
projection/delivery, transport/plugins/services, scripts/presets, selected fixtures/tests/samples/docs
and relevant history. It was broad, not exhaustive line-by-line coverage. It established no Linux,
external/browser aggregate, performance, Pi, generated-workspace or published-JSR parity result.
Reviewer-reported macOS checks did not certify later edits.

Paths below are relative to `code/sys.driver/driver-vite`:

- **F1: phase E scope.** Five restricted Vite-evaluating probe parents and the performance parent
  were a functional policy gap, not dead-code cleanup. Focused Linux CI ran unit/proof lanes, not
  `test:external`, so its green result did not exercise these probes. The pure-JSR build's restricted
  orchestration parent already delegated Vite evaluation to a trusted child and was distinct.
- **F2: removed.** `mediaTypeToLoader` in `src/m.vite.transport/u/u.load.ts`, its test import and sole
  dedicated converter test had no production callers or package public export. Historical
  `953547e31da163d92feff51dd718065ce92ae11c` replaced production esbuild transformation with
  `@deno/loader`. Live loading/transformation/rewriting/cache assertions remained; proof covered load
  tests, loader proof, check and real build/dev.
- **F3: simplified.** Private `wrangle.args` in `src/m.vite/u/u.wrangle.ts` became synchronous and its
  sole caller stopped awaiting it after its last asynchronous operation disappeared. Public
  `Wrangle.command`, package resolution, bootstrap creation and disposal remained asynchronous;
  command values and rejection propagation remained. The removed private microtask boundary was not
  a public timing contract. Proof covered command/startup/delivery and real build/dev.
- **F4: removed.** `PerfRun.deliveryIdentityNote`, the unconditional checkpoint verdict from
  `src/m.vite/-test.external/u.fixture.perf.ts`, and its output in `-scripts/task.perf.ts` were removed.
  A regression exercised the existing printer with a supplied log sink, preserving successful/failed
  rows and rejecting the legacy verdict. Phase/scenario/artifact naming, measurements, per-sample
  outcomes/details and strict exit behavior remained. No performance harness or benchmark claim was
  added.

The audit retained consumer package/native/Vite authority, configuration loading, startup projection,
invocation-owned delivery cleanup, OXC preflight, transport/cache/lifecycle roles, lazy non-Vite
entry isolation, HTTP filesystem/integrity guards and restricted serving. No exhaustive
module-cleanliness claim was made. Module-sync condition-shim removal still lacked parity proof;
lazy visualizer error wrapping had compatibility behavior not proven safe to remove. Those were
excluded, not invitations to expand cleanup.
