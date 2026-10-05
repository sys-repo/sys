@sys.driver-vite
ci-proof-lane-repair.plan.md
- [x] 02f3ae9b5 fix(ci): preserve explicit proof lanes through workflow generation


## Outcome

Make `deno task --cwd ./code/sys.driver/driver-vite test` pass without removing coverage, and make
Linux workflow regeneration preserve Vite's runtime proof lane. One bounded repair: generator,
generated workflow, and regression tests together. Do not reopen Vite runtime design or turn this
into a CI framework project.

## Diagnostic baseline

Observed at HEAD `c08a1b1b1` during planning:

- The human's latest run reports 60 passed, 502 passing steps, and one failing test/step. No new
  test execution was performed in this planning pass.
- The failure is `src/-test/-test.lanes.test.ts:23` in driver-vite: the checked-in workflow lacks
  the expected Vite-only proof step. This is a configuration contract failure, not evidence of a
  build or child-permission failure.
- `c9c17f093` added that step directly to `.github/workflows/test.linux.yaml`. `b8bb8389a` removed
  exactly that step during a workspace refresh.
- `code/sys/workspace/src/m.ci/m.Test/u.tmpl.ts` has ordinary and browser test steps but no proof
  step. `u.ts` carries browser metadata but no proof metadata.
- `WorkspaceCi.Test.Linux.sync` renders through `write` and `text`; it replaces differing file
  content. An output-only patch is therefore not durable.
- Vite's `test` delegates to `test:unit`. Its separate `test:proofs` aggregate and module `ci` still
  exist. Linux CI invokes `test`, not module `ci`.
- Candidate discovery found only Vite declaring `test:proofs` among code/deploy packages; recheck
  that inventory before implementation.

These are diagnostic observations, not proof of passing runtime lanes or hosted CI. The opening arc
alone records landing state. Planning grants no implementation, Git mutation, publication, or
remote-execution authority.

## Design: one declaration, one generator

The package owns the contents of `tasks['test:proofs']`. For Linux test-matrix members, declaring
that non-empty string task selects the additional proof lane. The generator owns its scheduling and
serialization. The YAML is an output.

- Extend `loadLinuxModule` with a derived `proofs` boolean using the existing task-presence
  predicate; carry it through `toMatrixItemYaml`.
- Emit `proofs: true` only for selected modules. Do not infer it from package names, individual
  `test:*` tasks, or the module `ci` string.
- Add exactly one shared step after ordinary `test` and before browser tests: condition
  `${{ matrix.proofs == true }}`, command `deno task test:proofs`, executed after
  `cd ${{ matrix.path }}`.
- Keep default failure propagation: no `continue-on-error`, fallback, retry, `always()`, or
  swallowed proof failure.
- Preserve independent browser selection, graph dependency, runner, permissions, triggers,
  environment, and matrix order. Do not affect Windows generation.
- Do not introduce a second opt-in flag, package-name special case, arbitrary task-list API, or
  redundant metadata in Vite's deno.json. Document the task discovery contract adjacent to its
  owning implementation.

The convention is intentionally bounded: adding `test:proofs` in the future means selecting Linux CI
proofs, not merely defining an unrelated local task.

## Exact implementation surfaces

1. `code/sys/workspace/src/m.ci/m.Test/u.ts`: derive and render the proof marker.
2. `code/sys/workspace/src/m.ci/m.Test/u.tmpl.ts`: emit the conditional proof step.
3. `code/sys/workspace/src/m.ci/m.Test/-.test.ts`: own generator/regeneration proof.
4. `.github/workflows/test.linux.yaml`: Vite marker and generated proof step.
5. `code/sys.driver/driver-vite/src/-test/-test.lanes.test.ts`: preserve semantic task coverage, not
   exact aggregate spelling or a fixed file count; replace the package-name condition assertion with
   parsed YAML checks binding Vite's matrix entry to the actual proof step.

Use existing `@sys/yaml` and local common/test helpers. Do not introduce a new runtime dependency
edge from driver-vite to workspace just to test generation. Read current bytes and diffs before
editing; preserve concurrent work, including new matrix members. Unrelated plans and source changes
are outside this repair.

## Proof before confidence

### Generator regression: red first

Add tests at the existing WorkspaceCi.Test.Linux boundary, parsing emitted YAML:

- A module with `test` and `test:proofs` receives the proof marker.
- An ordinary module does not; missing, empty, or non-string proof tasks do not accidentally select
  the lane under the existing task predicate.
- A module with both browser and proof selection keeps both markers and steps.
- Exactly one proof step has the expected condition, cwd, command, and relative order. Assert
  condition and command on the same parsed step, not unrelated text or absolute step positions.
- No proof step disables normal failure propagation.
- Extend the existing sync-idempotence test: stale output → repaired output → unchanged second sync.
  Parse repaired bytes to prove marker and step are restored and then preserved. Do not add a
  duplicate lifecycle test.
- Run the existing scoped CI suite once for graph, browser, safe-value, and Windows behavior; do not
  duplicate those assertions in Vite.

Run the new focused regression against the old generator and record the intended failure before
implementing. The human's transcript already supplies the original Vite red case; distinguish that
supplied evidence from agent-executed tests.

### Checked-in consumer contract

Preserve earned coverage signal, not incidental representation:

- Compare required proof-task membership within the supported fail-fast `&&` command form. Tolerate
  harmless whitespace and unnecessary task ordering; reject weakened failure propagation. Do not
  build a general shell parser.
- Remove the independent fixed excluded-file count. Retain exclusion/selection equality and
  selected-file existence so coverage-preserving file splits do not require a count update.
- Retain required proof lanes, module `ci` inclusion, invocation flags, and Dist separation.
- Use cheap positive/negative controls: harmless whitespace and coverage-preserving file partition
  changes pass; a missing required lane, an excluded-but-unselected file, or weakened failure
  propagation fails with a named diagnostic. Do not rerun runtime builds for these cases.

Parse the checked-in workflow. Locate Vite by `code/sys.driver/driver-vite`, not matrix position;
require exactly one matching row with `proofs: true` and one correctly routed proof step. A marker
alone or command text elsewhere must not pass. Tolerate package/runtime version bumps, additional or
reordered matrix rows, and equivalent YAML formatting. No whole-workflow snapshots. Use clear
assertion messages naming missing CI wiring.

### Bounded workflow update

Update only the two required regions of the checked-in workflow via surgical editing, in the same
repair as the owning generator. This is not an output-only fix: generator tests must independently
produce and preserve that wiring.

Do not run root `prep`, `prep:ci`, or an upgrade as a repair shortcut. `-scripts/task.prep.ci.ts`
invokes aggregate `Workspace.Ci.sync`, which can update JSR, build, Linux, Windows, and graph state.
No new regeneration CLI is needed. Test actual regeneration on temporary targets through the
existing Linux API.

## Execution order and exit criteria

From the repository root, after implementation is authorized, use focused runs for red/green
iteration:

```sh
deno task --cwd ./code/sys/workspace test --trace-leaks ./src/m.ci/m.Test/-.test.ts
deno task --cwd ./code/sys.driver/driver-vite test --trace-leaks ./src/-test/-test.lanes.test.ts
```

Use the first command for the new generator red case, then rerun after implementation. Focused runs
are iteration tools, not additional completion gates after their containing suites pass.

Final verification consists of three runs:

```sh
deno task --cwd ./code/sys/workspace test --trace-leaks ./src/m.ci
deno task --cwd ./code/sys.driver/driver-vite test
deno task --cwd ./code/sys.driver/driver-vite test:proofs
```

The scoped CI suite protects shared generation behavior; the exact Vite base command establishes
routine green; one proof-aggregate run establishes actual runtime-proof execution. The aggregate is
the expensive capstone, not an iteration loop. Advance only after the preceding run passes. Separate
check tasks are warranted only for a named changed surface not already type-checked by these suites.
Run exact-file formatter checks; no broad formatting, cleanup, or extra external, Dist, or browser
lanes.

Completion requires all of the following:

- Generator regression demonstrates repair and repeat-sync stability.
- The human's exact base-test command passes with semantic coverage preserved. Replacing brittle
  representation assertions is required; removing runtime coverage is not permitted.
- The proof aggregate passes; base green alone is not proof green.
- The scoped CI suite passes. Any additional check must name the distinct signal it contributes.
- Final diff contains only the bounded repair, with no permission, dependency, unrelated workflow,
  or runtime-test weakening.
- Report each command's actual outcome and distinguish local proof from hosted Linux CI. A hosted
  run is not claimed or triggered by this plan.

On a new failure, report the exact command, first failing test, and error. Classify it as wiring,
runtime proof, or environment before proposing the smallest next step. Do not silently expand scope,
disable checks, or call the repair complete. Permission, signing, trust, or cache-resolution
barriers remain hard stops; do not broaden grants or refresh dependencies to push through them.

## Local verification receipt

Agent-executed evidence for the bounded repair:

- Generator red: after correcting a fixture type-check error, the focused regression failed on
  missing proof markers and `unchanged` instead of `written`. With the generator repair, it passed
  with 1 test and 11 steps, including repeat-sync byte preservation.
- Focused Vite lane contract: passed with 1 test and 5 steps. Positive/negative controls cover
  whitespace/order tolerance, required-lane removal, non-fail-fast separators, file partitioning,
  and Dist separation without executing additional builds.
- Final scoped CI command above: passed with 6 tests and 62 steps, including Windows coverage.
- Exact Vite base command above: passed with 61 tests and 505 steps, zero failures.
- Proof aggregate above: all nine lanes passed, totaling 25 tests and 138 steps. No runtime proof
  membership, exclusions, or invocation grants were changed.
- Exact-file TypeScript format checks passed. The YAML check requested only existing generated quote
  changes; generator-owned layout was retained rather than rewriting unrelated rows.
- `git diff --check` passed. The inspected implementation diff contains the five named files; this
  receipt is separate plan evidence. No broad prep, dependency refresh, or Git mutation ran.

The final in-thread TMIND review examined discovery, scheduling, regeneration, coverage contracts,
and test-type containment across the five implementation paths; no blocking findings remained. It
was not a blind independent pass. The human also reported a passing local test run.

These results establish local execution, not a hosted Linux CI run or published-package proof.

## Non-goals

No changes to Vite builds, loaders, child permissions, proof membership, routine test exclusions,
dependency versions, native Windows work, browser setup, Dist-pipeline policy, publishing, or
existing sibling implementation plans. No full workspace test loop is required to diagnose this
local failure. Broader workspace or hosted CI results, if later requested, are separate evidence.
