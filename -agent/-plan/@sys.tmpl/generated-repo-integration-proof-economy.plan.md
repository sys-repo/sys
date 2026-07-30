generated-repo-integration-proof-economy.plan.md
- [ ] test(tmpl): measure generated repository integration cost
- [ ] refactor(tmpl): consolidate generated repository integration proofs
- [ ] test(tmpl): bound generated repository integration liveness

## Position

`@sys/tmpl` owns high-blast-radius integration truth: a generated repository must not merely have
plausible files; its canonical commands, dependency authorities, generated packages, and
cross-package imports must execute successfully.

That signal stays in the default package test route. Do not make the suite fast by deleting the
end-to-end proof, hiding it behind an environment variable, or moving all meaningful integration
coverage to a nightly job.

The current cost is nevertheless outside its own declared calibration. In a real outer Workspace
run, `code/-tmpl` completed 121 tests in approximately 6 minutes and dominated a 9-minute run. The
suite's authored slow-path note says one generated-repository preparation and verification should
take approximately 10–30 seconds.

The likely optimization opportunity is proof consolidation rather than weakened coverage. The
current suite executes the same generated-repository CI envelope repeatedly to establish narrower
claims that can be proved at their natural boundary.

Confidence that runtime can be reduced materially without losing semantic signal: **8/10**. Final
confidence is gated by measured phase timings and a claim-by-claim signal-equivalence table, not by
the raw count of removed `deno task ci` calls.

## Current observed execution shape

The default package task is:

```text
code/-tmpl/deno.json
  test → deno test -P=test
```

At least six tests currently materialize an isolated generated repository and execute its complete
root `deno task ci` command:

1. `src/-tests/-repo.integration.test.ts`
   - generated repository baseline CI;
2. `src/-tests/-repo.integration.test.ts`
   - poisoned unpublished `@sys` versions → local authority rewrite → full CI;
3. `src/m.testing/-test/-m.LocalRepoFixture.test.ts`
   - ordinary `LocalRepoFixture.create()` → full CI;
4. `src/m.testing/-test/-m.LocalRepoFixture.test.ts`
   - silent `LocalRepoFixture.create({ silent: true })` → full CI;
5. `src/m.testing/-test/-m.LocalRepoFixture.pkg.test.ts`
   - one generated package → authority rewrite → full CI;
6. `src/m.testing/-test/-m.LocalRepoFixture.pkg.test.ts`
   - two generated packages with a cross-package import → authority rewrite → full CI.

Each generated root CI expands to:

```text
check → dry → test
```

The package also runs narrower generated commands for upgrade dry-run, prep, package check,
help-bundle generation, and module check. Those commands may be independently valuable and must not
be conflated with the six full root-CI traversals.

`Process.invoke(...)` currently waits on `Deno.Command.output()` without a timeout. A nested command
that never exits can therefore hold `@sys/tmpl` and the outer Workspace run indefinitely. This is an
existing liveness gap, not a viewport-reporter defect.

## Subject and design goal

The subject is **proof economy**:

> Preserve every meaningful generated-repository claim while paying for each expensive executable
> boundary only when that boundary is the smallest honest witness for the claim.

The goal is not the smallest test count. The goal is the smallest non-redundant proof graph.

Target after measurement and consolidation:

- no more than two full generated root-CI traversals in the default `@sys/tmpl` package test;
- all existing semantic claims mapped to equal or stronger deterministic witnesses;
- warm package-local runtime of approximately 60–120 seconds;
- cold or contended runtime reported explicitly and targeted below 3 minutes;
- no silent command can wait forever without a bounded, actionable failure;
- no public `@sys/tmpl` runtime API change unless implementation evidence earns it.

The absolute budgets are provisional. Commit 1 must measure cold, warm, and outer-contention costs
before any threshold becomes an enforced contract.

## Signal inventory

Every current claim must remain represented in the final matrix.

| Signal                          | Required truth                                                                                   | Natural proof boundary                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Repository materialization      | Canonical repo template writes required files and omits template-only artifacts                  | Structural filesystem assertions                                                |
| Setup/prep                      | Initial setup materializes dependency authority, graph snapshot, package metadata, and workflows | Targeted setup plus exact artifact assertions                                   |
| Empty-repository command wiring | A newly generated empty workspace can execute canonical root CI                                  | One full root `deno task ci` canary                                             |
| Local authority localization    | Generated imports/package authorities resolve to current workspace truth                         | Exact authority-file assertions plus one executable consumer                    |
| Poisoned-version recovery       | Unpublished/invalid `@sys` versions are fully replaced by local truth                            | Poison → rewrite → exact assertions → executable integration proof              |
| Silent fixture behavior         | `silent: true` suppresses generation output without changing materialized semantics              | Captured-output assertion plus artifact/authority equivalence                   |
| Fixture helper behavior         | `LocalRepoFixture.create()` returns a usable localized repository                                | Exact returned/root/authority assertions plus a composed executable journey     |
| Single-package generation       | Generated package metadata, scripts, and source type-check                                       | Structural assertions plus package-local check                                  |
| Multi-package resolution        | One generated package imports another through workspace authority                                | Full composed repository CI or the smallest equivalent root check/test boundary |
| Dry-run rejection               | Fixture creation rejects unsupported dry-run semantics                                           | Direct deterministic error assertion                                            |
| Upgrade authority               | Generated repo upgrade dry-run consumes `deps.yaml` and avoids legacy `-deps.yaml`               | Existing targeted upgrade command and exact output/file assertions              |
| Help-resource composition       | Generated help bundle writes and type-checks                                                     | Existing targeted bundle and module-check commands                              |

## Signal-equivalence rule

No expensive witness may be removed until the implementation commit records:

1. the exact claim the witness currently proves;
2. the replacement witness;
3. why the replacement is equal or stronger at the relevant boundary;
4. the failure class that would escape if the replacement were weaker;
5. deterministic red proof that the replacement detects that class.

A passing full CI is not automatically six distinct signals. Conversely, matching generated text is
not a substitute for an execution boundary when command resolution, permissions, task composition,
or workspace graph behavior is the subject.

## Target proof graph

### Journey A: canonical empty-repository canary

Use one isolated repository generated through the canonical repo template path:

```text
generate repo
→ run canonical setup/prep
→ localize authorities
→ assert core authority/artifact truth
→ run root deno task ci once
```

This is the irreducible operator-level canary. It proves that the default generated repository can
execute the exact command users receive.

### Journey B: composed authority and package stress proof

Use one separate isolated fixture and preserve diagnostic phase boundaries:

```text
LocalRepoFixture.create()
→ assert initial localized authority truth
→ add foo and bar packages
→ write bar → foo cross-package import and test
→ poison selected @sys/npm authorities
→ rewrite local authorities
→ assert every poisoned authority was restored exactly
→ run root deno task ci once
```

This one journey may replace several repeated full-CI witnesses because it executes the strongest
composition of fixture creation, package materialization, authority recovery, graph/package wiring,
and cross-package resolution. Exact assertions before the final CI keep failures localizable rather
than turning the composition into one opaque mega-test.

### Narrow proofs

- `silent: true` must prove silence directly and compare materialized authority/artifact truth; it
  does not earn another root CI.
- One-package metadata and script shape remain exact structural assertions, followed by the smallest
  package-local type/check command that can detect invalid generated code.
- Prep graph, workflow generation, upgrade authority, and help-bundle behavior keep their existing
  focused command/assertion boundaries.
- `dryRun: true` remains a direct error contract.

## Fixture strategy

Prefer composing more claims inside two isolated generated repositories over creating six unrelated
repositories that all repeat setup and CI.

Do not introduce a process-global mutable fixture shared by independently scheduled tests. That
would create order dependence, mutation leakage, and false green results.

Do not begin with a cached pre-generated snapshot. Snapshot-only tests can hide breakage in the
actual template write/setup route. A prepared immutable base that is copied into isolated scenarios
is allowed only if measurement proves setup duplication dominates and at least one default test
still exercises canonical generation from source on every run.

If immutable-base copying is earned:

- build it once through the real generator;
- never mutate the base after publication;
- fork each scenario into a unique temp root;
- prove a fork cannot modify the base or another fork;
- retain one uncached canonical generation canary;
- treat cache invalidation as test-process-local, never persistent workspace state.

## Measurement contract

Commit 1 adds diagnostic timing without changing pass/fail semantics or removing coverage.

Measure at minimum:

- template write;
- default setup/prep;
- local authority rewrite;
- package generation;
- root `check`;
- root `dry`;
- root `test`;
- complete root `ci`;
- upgrade dry-run;
- package-local check;
- help bundle/check;
- total per scenario;
- total package runtime.

Capture both:

- cold package-local execution;
- immediate warm package-local execution;
- observed outer Workspace execution with normal job contention.

The timing format must identify scenario and phase. It must not dump child streams on success or
make exact-duration assertions that become platform-flaky.

Commit 1 acceptance:

- every full generated CI witness is enumerated by stable scenario name;
- phase timing makes repeated setup, command execution, and contention visible;
- existing 121-test semantic result remains unchanged;
- package-local tests remain green with leak tracing where supported;
- no optimization is proposed from aggregate elapsed time alone.

## Consolidation contract

Commit 2 may remove redundant full-CI traversals only through the signal-equivalence rule.

Expected direction:

- retain Journey A;
- build Journey B;
- replace ordinary/silent fixture full CIs with direct fixture contracts;
- replace the single-package root CI with exact package assertions plus package-local check;
- fold poisoned-authority recovery into Journey B after exact pre-CI authority assertions;
- retain the two-package executable import/test proof inside Journey B;
- preserve all focused prep, graph, workflow, upgrade, and help proofs.

Commit 2 acceptance:

- no more than two default full root-CI traversals;
- every row in the signal inventory has an explicit green witness;
- deliberate corruption of each replacement boundary produces a focused red;
- generated empty-repo CI still executes the exact shipped root command;
- poisoned authority recovery still fails if any poisoned value survives;
- cross-package import/test still fails if workspace resolution is broken;
- silent fixture behavior is proved as silence rather than inferred from repository health;
- no global mutable fixture or order-dependent test state;
- no production template output changes unless separately identified and justified;
- package-local runtime improves materially against Commit 1 measurements.

## Liveness contract

Commit 3 addresses the real nested-command hang class without choosing an arbitrary deadline first.

Use the existing canonical `Process.capture(...)` timeout/cancellation surface only if focused proof
shows it safely owns the full generated command lifecycle. Do not widen `@sys/process`, adopt shell
wrappers, or assume terminating the immediate `deno task` process also terminates every descendant.

Required design:

- one test-local generated-command runner;
- stable scenario/phase labels;
- bounded stdout/stderr capture;
- elapsed-time reporting;
- calibrated timeout by command class or one justified package integration bound;
- graceful termination followed by bounded escalation;
- exact timeout diagnosis naming root, command, phase, elapsed, and termination result;
- no timeout applied to ordinary unit/structural tests;
- no retry that can turn deterministic failure into probabilistic success.

Required hostile proof:

- a deliberate nested command that never exits;
- timeout returns a failed test rather than hanging;
- no child or descendant survives the test;
- no timer, reader, or process handle leaks;
- ordinary nonzero command exits remain ordinary failures, not timeouts;
- successful slow commands retain complete required diagnostic evidence;
- cancellation cleanup cannot mask the original timeout/failure.

If canonical process ownership cannot yet prove descendant cleanup, stop after measurement and
consolidation and open a separate `@sys/process` plan. Do not claim bounded liveness from a timer
that leaves grandchildren running.

## TMIND review

### Keep

- real generated repositories;
- canonical shipped root commands;
- isolated temp roots;
- exact authority rewriting;
- poisoned-version recovery;
- package and cross-package execution;
- focused artifact assertions;
- complete failure diagnostics;
- default-route integration signal.

### Reject

- deleting integration tests to optimize a dashboard number;
- moving every executable proof to nightly CI;
- skipping slow tests through ambient environment flags;
- replacing execution with snapshots alone;
- sharing one mutable fixture across independent tests;
- making all nested CI runs parallel and increasing cache/CPU contention;
- retaining six full CI runs merely because each scenario has a different title;
- enforcing the authored 10–30 second note as a hard threshold before measuring platforms;
- adding a timeout without process-tree termination proof;
- coupling this work to Workspace viewport/presentation behavior;
- changing the generic template's sequential runner baseline as a performance workaround.

### Hostile questions

- Does Journey B still go red when local authority rewrite leaves exactly one poisoned import?
- Can adding packages accidentally repair a broken empty-repository command path? Journey A must
  remain independent.
- Can a structural assertion pass while a generated task has invalid permissions or command
  composition? Keep an executable witness where that is possible.
- Can one scenario mutate another? Every root must remain isolated.
- Can a warm global Deno cache hide missing declared dependency authority? Poison/rewrite assertions
  must inspect authority files directly before execution.
- Can outer Workspace parallelism oversubscribe nested Deno work and dominate runtime? Measure both
  package-local and outer-contended runs before adding inner concurrency.
- Can bounded capture truncate the only useful failure evidence? Failure output policy must remain
  actionable and explicitly sized.
- Can timeout terminate the parent while leaving generated test descendants alive? Prove process
  ownership or do not land the timeout.

## DMIND review

The operator need is confidence that generated repositories work, not reassurance that many similar
CI commands were launched.

The humane form is:

- one unmistakable empty-repository canary;
- one strong composed stress journey;
- narrow proofs for narrow behavior;
- phase labels when waiting;
- a bounded and actionable failure when a child stops making progress.

This keeps the simple path simple while preserving deeper diagnosis. Fewer full traversals should
make each retained traversal more meaningful, not less.

## File boundary

Expected primary paths:

- `code/-tmpl/src/-tests/-repo.integration.test.ts`
- `code/-tmpl/src/m.testing/-test/-m.LocalRepoFixture.test.ts`
- `code/-tmpl/src/m.testing/-test/-m.LocalRepoFixture.pkg.test.ts`
- `code/-tmpl/src/m.testing/-test/u.fixture.ts`
- `code/-tmpl/src/-tests/u.fmt.ts`
- a narrowly named test helper under `code/-tmpl/src/m.testing/-test/` or `code/-tmpl/src/-tests/`
  if measurement proves it is shared coherently

Possible but not presumed:

- `code/-tmpl/src/m.testing/m.LocalRepoFixture.ts`
- `code/-tmpl/src/m.testing/t.ts`

Out of scope unless separately earned:

- `code/sys/workspace/**`
- `code/sys/process/**`
- root `-scripts/task.test.ts`
- generated template presentation policy
- template output changes unrelated to test proof
- repository-wide test-runner defaults

## Commit arc

### Commit 1 — `test(tmpl): measure generated repository integration cost`

- add stable scenario/phase timing;
- establish cold, warm, and contended baselines;
- write the concrete signal-equivalence matrix next to the implementation plan;
- change no semantic witness and remove no full CI.

### Commit 2 — `refactor(tmpl): consolidate generated repository integration proofs`

- implement Journey A and Journey B;
- replace redundant full-CI witnesses with equal or stronger focused proofs;
- keep every signal-inventory row green;
- compare before/after phase and package totals.

### Commit 3 — `test(tmpl): bound generated repository integration liveness`

- add the smallest safe generated-command timeout/cancellation harness;
- prove descendant cleanup and bounded diagnostics;
- if process-tree ownership is not provable locally, stop and open the separate process plan
  instead.

## Verification

Use package-local proof; do not repeatedly invoke the full repository merely to tune this suite.

1. Run individual changed test modules with leak tracing.
2. Run the two retained journeys independently from cold temp roots.
3. Run full `code/-tmpl` package tests once for each baseline/final comparison.
4. Run an immediate warm repetition and record phase differences.
5. Validate authored/generated template bundle parity if any template source changes.
6. Run `code/-tmpl` check and formatting.
7. Run `git diff --check`.
8. Use one human-observed outer Workspace run after the optimized package is green to validate
   contended runtime; do not make repeated full-workspace runs the development loop.

## Completion criteria

The plan is complete when:

- all signal-inventory claims have explicit equal-or-stronger witnesses;
- default full generated root-CI traversals are reduced from six to at most two;
- baseline empty-repository CI remains real and canonical;
- poisoned authority and cross-package resolution remain executable proofs;
- silent and fixture-helper contracts are tested at their actual boundaries;
- no mutable fixture state crosses scenario boundaries;
- measured warm runtime is approximately 60–120 seconds or the plan records concrete evidence for a
  different honest budget;
- cold/contended runtime is visible and targeted below 3 minutes;
- nested command hangs fail within a calibrated bound without surviving descendants;
- complete useful failure evidence remains available;
- no Workspace, Process, or generated-template policy drift is smuggled into the optimization;
- focused tests, full `@sys/tmpl`, check, formatting, and diff verification pass.
