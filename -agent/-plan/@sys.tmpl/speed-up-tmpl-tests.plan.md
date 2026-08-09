speed-up-tmpl-tests.plan.md
- [x] 14b91f39 test(tmpl): strengthen generated repository integration invariants
- [x] 5610aad refactor(tmpl): consolidate generated repository integration proofs

## Status

- 🟢 **BASELINE GATE COMPLETE — NO COMMIT**: research evidence is captured below; no empty or
  plan-only commit was created.
- 🟢 **COMMIT 1 LANDED — `14b91f39`**: the additive invariant checkpoint is committed with its exact
  three-file test boundary; that landed checkpoint retained all predecessors.
- 🟢 **CONSOLIDATION VERIFIED**: final focused, package, check, formatting, and Workspace evidence
  is recorded below; the opening arc records the landed commits.
- Review posture: final MAX holistic + TMIND pass; executed at `xhigh`.
- Current implementation boundary: package `0.0.469`, two full-CI witnesses, 10 generated-repo
  scenarios, sole canonical plan.
- Commit 2 verification: focused leak-traced checkpoints, two full leak-traced package runs, package
  check, targeted formatting, and one outer Workspace run green; no production/template behavior.

## Position

`@sys/tmpl` owns high-blast-radius integration truth: a generated repository must not merely have
plausible files; its canonical commands, dependency authorities, generated packages, and
cross-package imports must execute successfully.

That signal stays in the default package test route. Do not make the suite fast by deleting the
end-to-end proof, hiding it behind an environment variable, or moving all meaningful integration
coverage to a nightly job.

The current cost is nevertheless outside its own declared calibration. An earlier outer Workspace
run reported 121 test units for `code/-tmpl` in approximately 6 minutes and dominated a 9-minute
run. The baseline gate now reports 24 top-level tests / 97 BDD steps in 7m44s–7m45s package-local
and a 9m29.54s outer Workspace total. Those counters are reporter-specific and must not be compared
as if they were the same unit. The suite's authored slow-path note says one generated-repository
preparation and verification should take approximately 10–30 seconds.

The likely optimization opportunity is proof consolidation rather than weakened coverage. The
current suite executes the same generated-repository CI envelope repeatedly to establish narrower
claims that can be proved at their natural boundary.

Confidence that runtime can be reduced materially without losing semantic signal: **9/10** for the
proof-consolidation direction. The baseline lowers confidence in the original 60–120 second target
to **4/10**: five test modules each consume approximately 1m23s–1m44s, and two of those costs are
not full root CI. The implementation must optimize executable boundaries and repeated
materialization, not merely reduce the raw count of `deno task ci` calls.

This is bounded maintenance, not new template behavior. Relative implementation complexity is
medium: the edits are test-local, while semantic risk is controlled by additive replacement and the
signal matrix. Expected elapsed operator time is 1.5–2.5 hours with a hard three-hour cap. The
checkpoint and green baseline gate are complete; implementation may begin from this recorded state.

## Current observed execution shape

The default package task is:

```text
code/-tmpl/deno.json
  test → deno test -P=test
```

Exactly six tests currently materialize an isolated generated repository and execute its complete
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

| Current full-CI witness    | Final owner         | Action                                   |
| -------------------------- | ------------------- | ---------------------------------------- |
| Canonical empty repository | Journey A           | Keep                                     |
| Poisoned-version recovery  | Journey B           | Fold, then remove predecessor            |
| Ordinary fixture           | Journey B           | Fold contract, then remove predecessor   |
| Silent fixture             | Focused silent test | Replace CI with direct assertions        |
| Single package             | Journey B           | Fold assertions, then remove predecessor |
| Two-package import         | Journey B           | Keep and strengthen                      |

Each generated root CI expands to:

```text
check → dry → test
```

The package also runs narrower generated commands for upgrade dry-run, prep, package check,
help-bundle generation, and module check. Those commands may be independently valuable and must not
be conflated with the six full root-CI traversals.

`Process.invoke(...)` currently waits on `Deno.Command.output()` without a timeout. That existing
liveness gap is recorded but deliberately deferred: current `Process.capture(...)` termination owns
only its directly spawned child and does not establish descendant-process cleanup for nested
`deno task` commands. Timeout/process-tree work is not part of this cleanup.

## Subject and design goal

The subject is **proof economy**:

> Preserve every meaningful generated-repository claim while paying for each expensive executable
> boundary only when that boundary is the smallest honest witness for the claim.

The goal is not the smallest test count. The goal is the smallest non-redundant proof graph.

Target after baseline capture and consolidation:

- no more than two full generated root-CI traversals in the default `@sys/tmpl` package test;
- all existing semantic claims mapped to equal or stronger deterministic witnesses;
- materially fewer generated-repository materializations and independently expensive executable
  module boundaries;
- warm package-local runtime at or below 4 minutes as the first evidence-backed checkpoint; the old
  60–120 second target is not credible from CI-count reduction alone;
- one first-post-checkpoint and one immediate-warm package-local result, plus one observed outer
  Workspace result;
- no public `@sys/tmpl` runtime API or generated-template behavior change.

The runtime budget is a comparison target, not a pass/fail contract. The completed non-commit
baseline gate captures the facts; the real commits own additive invariant strengthening followed by
before/after consolidation.

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
| Single-package generation       | Generated package metadata, scripts, and source type-check                                       | Structural assertions plus Journey B execution                                  |
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
→ assert returned root and initial localized authority truth
→ add foo and assert single-package metadata/scripts
→ add and execute foo help-resource composition
→ add bar and write bar → foo cross-package import and test
→ poison selected @sys/npm authorities
→ rewrite local authorities
→ assert every poisoned authority was restored exactly
→ execute bar package test directly
→ run root deno task ci as a wiring canary
```

This one journey may replace several repeated full-CI witnesses because it executes the strongest
composition of fixture creation, package materialization, authority recovery, help generation, and
cross-package resolution. Exact assertions and direct package commands keep failures localizable;
the final root CI is not treated as the authority for child-package failure propagation.

### Narrow proofs

- `silent: true` must prove the existing contract directly—no generator `console.info`/`warn`
  emissions—then compare materialized authority/artifact truth; it does not earn another root CI and
  does not redefine error reporting.
- One-package metadata and script shape remain exact structural assertions; Journey B owns the
  generated-code type/execution boundary through direct generated package commands.
- Prep graph, workflow generation, and upgrade authority keep their existing focused boundaries;
  help structure stays focused while Journey B now also owns its executable boundary.
- `dryRun: true` remains a direct error contract.

## Fixture strategy

Prefer composing more claims inside two isolated generated repositories over creating six unrelated
repositories that all repeat setup and CI.

Do not introduce a process-global mutable fixture shared by independently scheduled tests. That
would create order dependence, mutation leakage, and false green results.

Do not add cached repositories, immutable-base copying, persistent fixtures, or parallel nested CI
in this chore. Snapshot-only tests can hide breakage in the actual template write/setup route, and
cache isolation would consume the timebox. If two consolidated journeys still miss the target,
record measurements and open a separate optimization plan rather than widening this one.

## Baseline gate and comparison contract

The non-commit baseline gate captures the pre-refactor comparison point without removing a witness
or adding a timing framework. Prefer existing Deno task/test timing and one operator stopwatch over
permanent instrumentation unless a phase is genuinely opaque.

Record one compact evidence table next to this plan with:

- stable scenario name;
- current claim and executable boundary;
- whether it invokes full root `deno task ci`;
- current scenario-level elapsed time reported by the test runner;
- first-post-checkpoint and immediate-warm package-local elapsed time, without purging shared
  caches;
- the observed outer-contended elapsed time from the completed checkpoint;
- replacement witness proposed for the implementation;
- failure signal that must remain actionable.

Characterization assertions capture semantic invariants, not giant stdout snapshots. Preserve exact
command, authority, artifact, package-resolution, silence, and failure facts at their natural
boundaries. Timings are evidence, never exact-duration assertions.

Baseline-gate acceptance:

- all six full generated-CI witnesses are enumerated by stable scenario name;
- every signal-inventory row maps to its current witness before refactoring;
- no existing test or full-CI invocation is removed;
- no production/template behavior changes;
- package-local tests remain green with leak tracing where supported;
- one first-post-checkpoint, one immediate-warm, and one outer-contended baseline are recorded;
- the work may stop here with a green tree and no behavioral delta.

### Recorded baseline gate

Observed at package `0.0.469` on 2026-07-30. Shared caches were not purged; "first" means the first
package-local run after the operator's CI/BumpPublish checkpoint.

| Measure                               | Baseline                                      |                               Final |
| ------------------------------------- | --------------------------------------------- | ----------------------------------: |
| Full root-CI traversals               | 6                                             |                                   2 |
| Generated-repository materializations | 16 source-level scenarios                     |                                  10 |
| First package-local elapsed           | 7m49.30s real; Deno 7m44s                     |           3m37.67s real; Deno 3m33s |
| Immediate-warm package-local elapsed  | 7m46.25s real; Deno 7m45s                     |           3m32.85s real; Deno 3m32s |
| Package-local result                  | 24 passed / 97 BDD steps / 0 failed           | 24 passed / 91 BDD steps / 0 failed |
| Prior outer `code/-tmpl` observation  | approximately 6m; current reporter omitted it |                              Record |
| Current outer Workspace elapsed       | 9m29.54s real; reporter 9m                    |          6m25.57s real; reporter 6m |
| Signal-inventory claims mapped        | 12/12                                         |                               12/12 |
| Actionable failure-signal review      | 11 strong; silent-output witness weak         |                                Pass |

The immediate repetition improved real time by only 3.05 seconds (0.65%). There is no meaningful
package-level warm-run gain to credit.

Warm scenario timing exposed the actual cost shape:

| Module / scenario group                | Elapsed | Dominant observed boundary                      |
| -------------------------------------- | ------: | ----------------------------------------------- |
| `src/-tests/-pkg.help.test.ts`         |   1m28s | generated help bundle + module check            |
| `src/-tests/-repo.integration.test.ts` |   1m44s | first root CI 1m26s; upgrade 11s                |
| `-m.LocalRepoAuthorities.test.ts`      |   1m23s | poisoned authority rewrite 1m23s                |
| `-m.LocalRepoFixture.pkg.test.ts`      |   1m28s | first root CI 1m26s; later two-package CI 1s    |
| `-m.LocalRepoFixture.test.ts`          |   1m26s | first root CI 1m25s; later silent-fixture CI 1s |

These five modules account for approximately 7m29s of the 7m45s Deno total. Child-step timings are
order-warmed observations, not independent cold costs: Deno's top-level `--filter` cannot isolate
nested BDD steps without changing test source. The implementation must compare final package totals
rather than summing apparent one-second successors or claiming four removed CI calls save four cold
CIs.

### Baseline signal-equivalence map

1. Repository materialization — `src/-tests/-repo.test.ts` directly asserts required files/tasks and
   omitted template-only artifacts; retain as focused structural proof or absorb exact assertions
   into Journey A only if locality remains.
2. Setup/prep — `src/-tests/-repo.integration.test.ts` directly asserts graph snapshot, canonical
   imports, and generated workflows; keep focused claims or compatible Journey A checkpoints.
3. Empty-repository command wiring — the first repo-integration scenario executes shipped root
   `deno task ci`; this remains Journey A.
4. Local authority localization — repo-integration authority assertions plus
   `-m.LocalRepoAuthorities.test.ts` inspect exact import/package truth; executable consumption
   moves into Journey B.
5. Poisoned-version recovery — `-m.LocalRepoAuthorities.test.ts` checks restored `@sys`/npm values,
   while the final repo-integration scenario executes CI after `@sys` poisoning; Journey B must own
   both exact restoration and execution.
6. Silent fixture behavior — the current silent fixture scenario proves repository health after
   `silent: true` but does not directly assert suppressed `console.info`/`warn`; this is the one
   baseline witness gap and must become direct focused proof.
7. Fixture helper behavior — the ordinary fixture scenario consumes its returned root in full CI;
   Journey B must add exact returned-root/authority assertions before mutation.
8. Single-package generation — repo-integration package check plus the first fixture-package CI
   prove generated metadata/scripts and executable validity; fold exact shape and execution into
   Journey B without paying twice.
9. Multi-package resolution — the second fixture-package scenario writes the `bar → foo`
   import/test. Commit 1 negative control proved its root CI could return success for a missing
   import, so Journey B now executes `bar`'s package test directly before retaining root CI as a
   command-wiring canary.
10. Dry-run rejection — the focused fixture `dryRun: true` error assertion is direct and unchanged.
11. Upgrade authority — the focused repo-integration upgrade dry-run asserts `deps.yaml`, rejects
    legacy `-deps.yaml`, and stays unchanged.
12. Help-resource composition — `src/-tests/-pkg.help.test.ts` directly asserts generated help
    shape, runs `help:bundle`, and checks modules; retain structural locality while deciding whether
    its executable boundary can compose into Journey B.

## Invariant-strengthening contract

Commit 1 — `test(tmpl): strengthen generated repository integration invariants` — is additive test
work. It creates the replacement proof before Commit 2 removes any predecessor.

Expected direction:

- extend the existing two-package fixture scenario into Journey B rather than creating another
  generated repository or root-CI traversal;
- assert the fixture's returned root and initial localized authority truth before mutation;
- assert exact single-package metadata/scripts after adding `foo`, before adding `bar`;
- retain the existing `bar → foo` cross-package import/test;
- poison selected `@sys` and npm import/package authorities, rewrite them, and assert every poisoned
  value is restored exactly before Journey B's existing root CI;
- add the help resource to a Journey B package and execute the same generated `help:bundle` and
  module-check boundary while the existing help witness remains;
- strengthen the existing silent-fixture scenario with scoped `console.info`/`warn` capture plus
  materialization and authority-equivalence assertions while its existing root CI remains;
- demonstrate focused red behavior during implementation by temporarily leaving one poisoned value,
  breaking the cross-package import, breaking the help task, and emitting one captured console call;
  do not commit those mutations.

Commit 1 acceptance:

- all six existing full root-CI calls and all predecessors remain;
- no additional generated repository or full root-CI call is introduced;
- Journey B contains explicit fixture, package, authority-recovery, help, and cross-package phase
  assertions before its existing root CI;
- silent behavior is directly asserted, with console methods restored in `finally`;
- each behavioral replacement boundary has demonstrated a focused red; deterministic structural
  assertions are exact rather than snapshot-wide;
- no production/template behavior changes;
- focused modules, full package tests, check, and targeted formatting pass.

### Recorded Commit 1 evidence

Landed commit: `14b91f39 test(tmpl): strengthen generated repository integration invariants`

Exact committed test-only paths:

- `code/-tmpl/src/m.testing/-test/u.fixture.ts`
- `code/-tmpl/src/m.testing/-test/-m.LocalRepoFixture.test.ts`
- `code/-tmpl/src/m.testing/-test/-m.LocalRepoFixture.pkg.test.ts`

Journey B now asserts the returned fixture/root authority contract, exact `foo` metadata/tasks,
generated help shape and execution, six deliberately poisoned `@sys`/npm authorities and their exact
restoration, persisted authority files, and direct `bar → foo` package execution before its existing
root CI. Repository, package, and help materialization use the canonical internal `tmplCli` route;
tests no longer reproduce template-engine write/setup orchestration. The silent fixture now captures
`console.info`/`warn`, restores both in `finally`, and asserts equivalent materialized authority
truth before retaining its existing root CI.

The poison helper now corrupts the existing exact `react-icons/vsc` authority rather than
fabricating an absent `react-dom/` prefix. That ensures every poisoned value has workspace-owned
replacement truth and prevents a false recovery claim.

Focused negative controls produced the intended actionable failures:

- skipped authority rewrite → exact surviving `@sys/std@999.0.0` assertion red;
- emitted `console.info` call → direct captured-output assertion red;
- missing `@tmp/foo` import → direct generated `bar` package test red with `TS2307`;
- missing `help:bundle` task → direct command assertion red with full stderr.

The missing-import probe also proved the generated root CI can currently return success after a
Workspace child package failure. Commit 1 therefore adds the direct package command as the
cross-package authority; root CI remains only a wiring canary in this chore. Fixing generated root
Workspace failure propagation is a separate Workspace concern.

Verification evidence:

- focused changed/affected modules: 3 passed / 7 steps / 0 failed in 4m27s;
- full leak-traced package: 24 passed / 97 steps / 0 failed in Deno 7m56s, 478.64s real;
- package check and targeted formatting green;
- six full root-CI calls and 16 generated-repository scenarios unchanged.

Commit 1 is intentionally additive and is 12.39 seconds slower than the immediate-warm 466.25-second
baseline. No speedup is expected until Commit 2 removes predecessors; this checkpoint buys stronger,
red-proven signal first.

## Consolidation contract

Commit 2 — `refactor(tmpl): consolidate generated repository integration proofs` — may remove an
expensive predecessor only through the signal-equivalence rule. Commit 1 is landed and green at
`14b91f39`, so this phase may now enter pre-implementation.

Expected direction:

- retain the existing canonical empty-repository root CI unchanged as Journey A;
- retain Journey B's direct generated `bar` package test as the cross-package execution authority;
- retain the strengthened two-package fixture root CI as a non-empty command-wiring canary unless
  the final matrix proves Journey A plus direct Journey B commands fully subsume it;
- remove the separate poisoned-version root CI after confirming Journey B owns exact restoration and
  executable consumption;
- remove the ordinary fixture root CI after confirming Journey B owns the fixture contract;
- remove the silent-fixture root CI while retaining its direct silence, materialization, and
  authority-equivalence proof;
- remove the standalone single-package root CI and any package check already subsumed by Journey B;
- remove the independently expensive poisoned-authority rewrite test only after its exact assertions
  are represented in Journey B, while retaining distinct focused read/shape truth;
- retain focused `pkg.help` structural assertions but remove its duplicate executable boundary only
  after Journey B proves the same generated bundle/module behavior;
- preserve focused repo materialization, prep, graph, workflow, and upgrade claims unless compatible
  exact assertions can move without weakening failure locality;
- remove `src/-tests/u.repo.local.ts` if the strengthened fixture helper fully supersedes it and no
  consumer remains.

The baseline proves repeated materialization and executable module boundaries warrant consolidation.
Fold a claim into Journey A or B only when setup order is compatible and intermediate assertions
keep failure locality. Otherwise retain the focused test; do not add shared fixtures or exceed the
timebox to chase a target.

Commit 2 acceptance:

- no more than two default full root-CI traversals;
- every row in the signal inventory has an explicit green witness;
- deliberate corruption of each replacement boundary produces a focused red;
- generated empty-repo CI still executes the exact shipped root command;
- poisoned authority recovery still fails if any poisoned value survives;
- cross-package import/test still fails if workspace resolution is broken;
- silent fixture behavior is proved as silence rather than inferred from repository health;
- any console interception used to prove silence is scoped, serialized if necessary, and restored in
  `finally` before the test completes;
- no global mutable fixture or order-dependent semantic state; cache warmth may affect duration but
  never correctness;
- no production template output changes;
- generated-repository materializations are materially below 16;
- package-local runtime improves materially against 7m46.25s, with ≤4 minutes as the first target.

### Recorded Commit 2 implementation evidence

Exact source boundary:

- `code/-tmpl/src/-tests/-repo.integration.test.ts`
- `code/-tmpl/src/-tests/-pkg.help.test.ts`
- `code/-tmpl/src/-tests/u.repo.local.ts` — removed after its final consumer;
- `code/-tmpl/src/m.testing/-test/-m.LocalRepoAuthorities.test.ts`
- `code/-tmpl/src/m.testing/-test/-m.LocalRepoFixture.test.ts`
- `code/-tmpl/src/m.testing/-test/-m.LocalRepoFixture.pkg.test.ts`
- `code/-tmpl/src/m.testing/-test/u.fixture.ts`

Journey A remains the unchanged canonical empty-repository root CI. Journey B now owns direct silent
fixture capture, independent workspace authority truth, exact poisoned-value restoration, persisted
files, generated help bundling, canonical `foo` package checking, direct `bar → foo` execution, and
the retained non-empty root-CI wiring canary.

The package-check replacement demonstrated focused red with a temporary generated
`src/check-only.ts`; `deno task check` failed directly with `TS2304` for `MissingCheckOnly`. The
corruption was removed before predecessor deletion. Commit 1's authority, silence, help, and
cross-package negative controls remain the evidence for their replacement boundaries.

Removed or trimmed predecessors:

- ordinary and silent fixture root-CI scenarios; focused `dryRun` rejection retained;
- standalone single-package root-CI scenario;
- unpublished-version repo root-CI scenario and its now-unused poison helper;
- independently expensive authority-rewrite scenario; focused authority-read proof retained;
- standalone repo generated-package check;
- duplicate standalone help bundle/check execution; structural help-composition proof retained;
- redundant explicit help-module check inside Journey B, because canonical package check traverses
  the generated help modules.

Final evidence:

- exactly two full root-CI traversals: Journey A and Journey B;
- 10 generated-repository materialization scenarios, down from 16;
- all 12 signal-inventory claims retain explicit equal-or-stronger witnesses;
- first final full package: 24 passed / 91 steps / 0 failed in Deno 3m33s, 217.67s real;
- immediate repeat: 24 passed / 91 steps / 0 failed in Deno 3m32s, 212.85s real;
- first real-time improvement: 251.63s / 53.6%; warm improvement: 253.40s / 54.4%;
- outer Workspace: 53 packages / 10,683 tests green in reporter 6m, 385.57s real, improving 183.97s
  / 32.3% against the recorded 569.54-second observation;
- package check and targeted formatting green;
- no production, template, Workspace, Process, caching, concurrency, or liveness change.

## Safe-stop contract

This chore must be abort-safe:

1. add and pass a replacement witness before removing its expensive predecessor;
2. remove at most one old full-CI invocation at a time, then run the narrow affected module;
3. keep Journey A untouched while Journey B is being composed;
4. stop opening new work at 2.5 hours and reserve the final 30 minutes for a green checkpoint;
5. if a replacement remains incomplete, restore only that current surgical delta and retain the old
   witness—slow and green is the required fallback;
6. never use automated git reset/stash/revert as cleanup and never leave the package knowingly red.

Safe checkpoints exist at the completed baseline gate, after additive Commit 1, and after each
predecessor removal in Commit 2. The chore may stop at any one of them without changing production
behavior.

## Deferred root failure-propagation observation

A deliberate missing `@tmp/foo` import made the generated `bar` package test fail with `TS2307`, but
the generated root `deno task ci` still returned success through its Workspace task scripts. Journey
B now owns direct executable cross-package proof, so this cleanup does not depend on that
false-green exit status. Do not modify generated root scripts, Workspace APIs, or template behavior
here; route exit-status propagation through separate Workspace work.

## Deferred liveness observation

Nested `Process.invoke(...)` commands can still wait indefinitely. Do not address that here.
`Process.capture(...)` currently signals its direct `Deno.ChildProcess`; it does not prove ownership
of descendants launched by `deno task`. A local timer would therefore create false boundedness.
Record the gap for a separate `@sys/process` plan if prioritized, and do not modify Process APIs or
command lifecycle in either commit.

## Final BMIND → DMIND → TMIND review

### BMIND: irreducible subject

This is test-maintenance proof consolidation. The system must still demonstrate that a canonical
empty generated repository works and that a localized multi-package repository survives authority
repair and cross-package execution. Four additional full-CI traversals are not independently
valuable when narrower witnesses preserve their distinct claims.

The smallest honest design is two isolated executable journeys plus focused assertions. It requires
no production API, cache, scheduler, Process, Workspace, or template-output change.

### DMIND: operator experience

The operator needs confidence that generated repositories work, not reassurance that many similar CI
commands were launched. The humane result is one unmistakable empty-repository canary, one strong
composed stress journey, narrow proofs for narrow behavior, stable scenario names, and failure
messages that identify the broken boundary. Fewer traversals make each retained traversal more
meaningful and the package test usable in the normal feedback loop.

### TMIND: keep

- real generated repositories and canonical shipped root commands;
- isolated temp roots;
- exact authority rewriting and poisoned-version recovery;
- package and cross-package execution;
- focused artifact assertions and complete failure diagnostics;
- default-route integration signal.

### TMIND: reject

- deleting integration claims to optimize elapsed time;
- moving executable truth to nightly CI or hiding it behind ambient flags;
- replacing execution with snapshots alone;
- sharing mutable fixtures or adding cache invalidation in this chore;
- parallelizing nested CI and increasing contention;
- retaining six full CI runs merely because their scenario titles differ;
- adding timeout/process-tree work, production hooks, or public APIs;
- coupling the cleanup to Workspace presentation or template runner policy;
- continuing beyond the three-hour cap in a red state.

### TMIND: hostile checks

- Does Journey B go red when exactly one poisoned import or npm authority survives rewrite?
- Can package creation accidentally repair a broken empty-repository command path? Journey A remains
  independent and unchanged.
- Could structural assertions pass while task permissions, composition, or workspace resolution are
  broken? Each such failure class retains an executable witness.
- Does Journey B preserve diagnostic phase boundaries rather than becoming an opaque mega-test?
- Can a warm global Deno cache hide bad authority files? Exact file assertions run before execution.
- Can silence proof leak intercepted console methods into another test? Capture is scoped and always
  restored.
- Is a proposed package-local command already proved by Journey B? Do not pay twice without a
  distinct claim.
- Are later one-second BDD steps being misrepresented as independent cold costs or savings? Final
  package totals, not arithmetic over order-warmed child timings, decide improvement.
- Can the work stop after any predecessor removal with the package green and all claims mapped?
- If two journeys do not materially improve runtime, will the operator record the result and stop
  rather than introduce caching, concurrency, or Process changes?

### Review verdict

The non-commit baseline gate established the facts, and landed Commit 1 `14b91f39` established the
replacement invariant witnesses. Commit 2 has consolidated the five independently expensive module
boundaries while preserving all 12 claims and safe stopping. Two package runs remain below four
minutes, and the outer Workspace run improves materially. TMIND finds no earned third commit.

## File boundary

Expected primary paths:

- `code/-tmpl/src/-tests/-repo.integration.test.ts`
- `code/-tmpl/src/-tests/-repo.test.ts`
- `code/-tmpl/src/-tests/-pkg.help.test.ts`
- `code/-tmpl/src/-tests/u.repo.local.ts` (remove if superseded)
- `code/-tmpl/src/m.testing/-test/-m.LocalRepoAuthorities.test.ts`
- `code/-tmpl/src/m.testing/-test/-m.LocalRepoFixture.test.ts`
- `code/-tmpl/src/m.testing/-test/-m.LocalRepoFixture.pkg.test.ts`
- `code/-tmpl/src/m.testing/-test/u.fixture.ts`

No production `m.testing` file is expected to change. A new test helper is not earned unless two
changed test modules need the same coherent operation.

Out of scope unless separately earned:

- `code/sys/workspace/**`
- `code/sys/process/**`
- root `-scripts/task.test.ts`
- generated template presentation policy
- template output changes unrelated to test proof
- repository-wide test-runner defaults

## Commit arc

The baseline is a completed non-commit gate. Only source-changing work appears in this arc.

### Commit 1 — `14b91f39 test(tmpl): strengthen generated repository integration invariants`

- strengthen Journey B inside its existing generated repository and root-CI traversal;
- add direct silent-output and exact fixture/authority/package/help assertions;
- demonstrate focused red behavior for silence, authority recovery, help execution, and
  cross-package execution;
- remove no predecessor, add no generated repository or full-CI traversal, and finish green.

### Commit 2 — `refactor(tmpl): consolidate generated repository integration proofs`

- retain Journey A and the strengthened Journey B;
- remove redundant executable/materialization predecessors one at a time;
- keep every signal-inventory row green;
- compare the same before/after evidence and finish at a safe checkpoint.

### Post-refactor review gate

This is a review step, not a predeclared third commit. Cross-compare semantic coverage, failure
signal, full-CI count, and first/warm/contended runtime against the baseline gate. Create a
follow-up `test(tmpl)` commit only if the review discovers a concrete missing assertion; otherwise
do not manufacture an empty review commit.

## Verification

Use the declared package tasks for package-local proof; do not repeatedly invoke the full repository
merely to tune this suite. Pass focused module paths and leak tracing through `deno task test`
rather than invoking raw `deno test`.

1. Treat the recorded first-post-checkpoint and immediate-repetition package runs as the completed
   baseline gate; do not rerun them for ceremony.
2. Commit 1 verification is complete: changed modules, full leak-traced package, check, formatting,
   and the unchanged six-call count were green before commit `14b91f39`.
3. Commit 2 focused checkpoints are complete: Journey B replacement routing was green before
   deletion, its direct package check demonstrated focused red, and every predecessor removal ended
   with its narrow affected module green.
4. Final package measurement is complete: first and immediate-repeat leak-traced runs are green at
   two full root-CI traversals and below four minutes.
5. The declared `code/-tmpl` check task and canonical targeted Deno formatting are green.
6. `git diff --check` remains pending human authorization under the active no-autonomous-git policy.
7. The single outer Workspace validation is complete: 53 packages and 10,683 tests green in 6m
   reporter time / 385.57s real.

## Completion criteria

The plan is complete when:

- all signal-inventory claims have explicit equal-or-stronger witnesses;
- default full generated root-CI traversals are reduced from six to at most two;
- baseline empty-repository CI remains real and canonical;
- poisoned authority and cross-package resolution remain executable proofs;
- silent and fixture-helper contracts are tested at their actual boundaries;
- no mutable fixture state crosses scenario boundaries;
- before/after evidence uses the same scenarios and fields;
- measured warm runtime is materially below 7m46.25s, with ≤4 minutes as the first target or
  concrete evidence for a different honest budget;
- first, warm, and outer-contended runtime remain visible without fabricated duration assertions;
- complete useful failure evidence remains available;
- no Workspace, Process, production `@sys/tmpl`, or generated-template behavior drift is smuggled
  into the optimization;
- the post-refactor review gate records signal equivalence and runtime change;
- focused tests, full `@sys/tmpl`, check, formatting, and authorized diff verification pass;
- work ends at a green safe checkpoint within the three-hour cap.
