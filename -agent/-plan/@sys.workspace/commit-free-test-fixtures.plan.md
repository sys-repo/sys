@sys.workspace
commit-free-test-fixtures.plan.md
- [x] d3f17c6ba fix(workspace): remove commit creation from test fixtures

## Purpose

Test our package-bump decisions, argument forwarding, and presentation without starting Git.
Routine tests must not create repositories, commits, or tags, read personal Git configuration, or
request signing credentials. Production `bump --since` still reads Git through its existing adapter.

Phil explicitly re-scoped this repair to minimal boundary-based tests. This replaces the prebuilt
history/P1 design and removes its now-obsolete fixture-acquisition gate. Do not prepare or import
Git objects. No signing setup, exporter, process-isolation harness, or machine-specific permissions.
Planning/review does not authorize source implementation, tests, or Git mutation.

Repository: `/Users/phil/code/org.sys/sys`. Initial diagnosis: `cedb7a852`; re-scope inspection:
`13ef5bfbe`. The opening arc records landing only. The repair is one cohesive source/test change;
plan preservation is separate.

## What the tests must prove

| Claim | Smallest useful substrate |
| --- | --- |
| Changed A has the same version and needs a bump; changed B is already bumped; C is new | Real adapter parsing/classification with scripted command responses and current workspace files. |
| Bump roots and graph closure are selected correctly | The same real adapter/graph functions; no duplicate classifier in the fake. |
| Explicit/default refs reach delta planning and select the expected packages | Real CLI flow, injected delta-read boundary, existing prompt seam. |
| Dry run preserves package versions | Retain the unchanged-version assertion through the real dry-run path. |
| Root wrapper forwards arguments, cwd, and bump policy | One injected CLI-call boundary; no duplicate history builder. |
| Delta explanation formats the supplied facts | Typed literal data; no filesystem or adapter execution. |
| Missing graph snapshot fails before Git reads | Empty owned directory and zero command invocations. |

Coverage is for our contracts, not interoperability with an installed Git executable. Do not claim
otherwise. Native-Git integration is not required by this repair; do not add an optional integration
lane, artifact campaign, or new gate to preserve that broader claim by default.

## Exact repair boundary

### 1. Discard the preparation detour

Remove only these target-attributed draft additions:

- `code/sys/workspace/-scripts/task.fixture.git-baseline.ts`.
- The `fixture:git` task and `fixture-git` permission preset in `code/sys/workspace/deno.json`.

Use the registered remove tool for the stale script and surgical edits for configuration. Preserve
unrelated work. Do not replace the personal paths with environment-variable paths, wider permissions,
a portable exporter, or another preparation mechanism.

### 2. Inject command execution at the existing adapter boundary

Files: `code/sys/workspace/src/m.delta/m.Git/u.fromRef.ts` and `u.classify.ts`.

Keep public `fromRef(args)` and its default behavior unchanged. Add a small module-internal
`fromRefWith` entry that accepts the invocation dependency, and thread that same dependency through
both `diff` and baseline-manifest `show` calls. The public entry supplies `Process.invoke`.
Do not expose a new package API, modify shared `Process`, monkeypatch global methods, or introduce
an adapter framework. Use the existing invocation/output types rather than a parallel wire model.

Tests script raw NUL-delimited diff output and baseline JSON responses. Their executor must record
and assert exact command, argv, cwd, and call count, reject unexpected calls, and never delegate to a
real process. Assertions must exercise the real parser, classifier, collection, roots, and closure.
The fake must not return the final expected classification as a substitute for those functions.

### 3. Keep CLI and root-wrapper seams small

In `code/sys/workspace/src/m.cli/m.run.ts`, add one delta-read dependency to the existing
`WorkspaceCliDependencies`/`runWith` mechanism. Default it to `WorkspaceDelta.Git.fromRef`; use it
for both explicit `--since` and default `jsr-publish` paths. Tests assert the requested ref and
forwarded inputs. Retain the existing real bump runner/prompt seam and dry-run assertions.
Where the existing capstone needs the adapter, connect this dependency to `fromRefWith` with the
scripted executor rather than replacing the bump logic.

In `-scripts/task.bump.ts`, add only a module-internal runner seam needed to test `main` without a
native process. Keep public `main(input)` and its default `WorkspaceCli.run` delegation unchanged.
The root capstone can inject the real CLI's `runWith` bound to the fake command boundary. Assert
forwarding of `bump`, user arguments, cwd, and policy; do not create a second fixture implementation.

### 4. Replace all attributable fixture consumers

- `code/sys/workspace/src/m.delta/-test/u.fixture.ts`: retain pure helpers; replace history setup
  with only necessary current workspace files, typed data, and a small scripted invocation helper.
  Use `Testing.withTmpDir()` for filesystem lifetime. No `.git` directory or Git command helper.
- `code/sys/workspace/src/m.delta/-test/-m.Git.test.ts`: real adapter with scripted responses;
  filesystem-only missing-snapshot case. Keep existing name-status parser cases.
- `code/sys/workspace/src/m.delta/m.Fmt/-test/-.test.ts`: literal delta data only.
- `code/sys/workspace/src/m.cli/-test/-m.run.test.ts`: migrate both explicit-ref and default-ref
  cases. Remove runtime `jsr-publish` tag creation. Preserve output and preselection assertions.
- `-scripts/-test/-task.bump.test.ts`: remove its separate history builder; retain root forwarding
  and dry-run coverage through the bounded seams above.

There are five identified package consumers and one separate root-script consumer. Search for other
calls to these builders before deleting them. Share only the small fixture data/invocation helpers
that these actual cases require; no generic mocking framework or child-process entrypoints.

## Non-goals and proof limits

- No production changes to Git command semantics, signing, environment handling, or trust policy.
- No version-selection-policy change or dependency/CI work.
- `u.classify.ts::baselineVersion` currently maps any unsuccessful `git show` to an absent baseline.
  This is a known separate semantic weakness, not fixed by injecting execution. Do not quietly change
  that policy, claim it is fixed, or encode arbitrary Git failures as correctly proven absence.
  Use the scripted missing-manifest case only for the existing new-package assertion. Failure tests
  in this repair can cover existing diff-error propagation and malformed-manifest rejection.
- The historical nine failed tests are not individually attributable from the reported aggregate.
  Preserve any available diagnostics; do not claim this repair explains all nine.

## Verification

After authorized implementation, and only after removing all identified mutation paths:

1. Source-inspect the defaults and the exact delta: public production entrypoints must retain their
   existing behavior; injection is internal and per-call, not mutable global state.
2. Run the affected cases under supported top-level test permissions with `run: false`. Do not strip
   subprocess permissions from unrelated suites. A leaked native invocation must fail, not launch Git;
   assert fake calls and expected results so caught permission errors cannot hide missing wiring.
3. Preserve classification/root/closure, ref/argv/cwd forwarding, formatting, preselection, and
   dry-run non-mutation assertions. Check diff failure and malformed baseline JSON through the real
   adapter. Keep filesystem fixtures lifetime-owned; no process-lifetime machinery is needed.
4. Confirm both history builders, their commit/tag/config calls, preparation script, task/preset,
   and machine-specific configuration additions are gone. No tests are skipped or weakened merely
   to obtain a green run.
5. Run targeted workspace delta/CLI and root bump tests, type checks, then the workspace regression
   suite. Inspect owning task definitions before execution; retain failure diagnostics and require
   successful aggregates plus expected coverage, not process exit alone.

Existing execution surfaces, to be used only under separate test authority:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/workspace
deno task test --trace-leaks ./src/m.delta
deno task test --trace-leaks ./src/m.cli/-test/-m.run.test.ts
deno task check

cd /Users/phil/code/org.sys/sys
deno task test:root --trace-leaks ./-scripts/-test/-task.bump.test.ts
deno check ./-scripts/task.bump.ts ./-scripts/-test/-task.bump.test.ts

cd /Users/phil/code/org.sys/sys/code/sys/workspace
deno task test
```

The root task additionally names two runner-test files; this is not a bump-only invocation. Root
script type coverage must be checked explicitly if the configured workspace check excludes it.
Do not run the old commit-producing tests as a red-baseline exercise.

## Verification evidence

Local verification against base `13ef5bfbe`, on Darwin arm64 with Deno 2.9.7:

- Delta target: `4 passed (21 steps)`, zero failures.
- CLI run target: `2 passed (14 steps)`, zero failures.
- Root bump target plus the two declared runner-test files: `3 passed (23 steps)`, zero failures.
- Full `@sys/workspace` regression: `71 passed (593 steps)`, zero failures.
- Package `deno task check` and explicit root-script/test `deno check`: passed.
- `deno fmt --check` and `deno lint` on the nine changed source/test files: passed.
- `git diff --check`: passed.

The migrated suites enforce `run: false`. The classification and CLI/root capstones verify one diff
and three manifest reads through the scripted executor; the default-prelude call assertions run
outside its catch/fallback. Filesystem setup writes only current manifests and the graph snapshot,
with `Testing.withTmpDir` owning cleanup. The discarded preparation script was removed, and its task
and permission additions were reverted without changing the existing package configuration.

These receipts are local package/root-target evidence, not repository-wide or hosted CI results,
and do not establish installed-Git interoperability or explain the historical nine failures.

## Completion boundary

All six identified consumers retain their useful claims without native Git execution; the production
Git reads remain unchanged; preparation tooling and personal-path configuration are removed; targeted
and regression evidence pass. This does not attest to installed-Git interoperability or resolve
unclassified historical CI failures. Landing requires its own explicit Git instruction.
