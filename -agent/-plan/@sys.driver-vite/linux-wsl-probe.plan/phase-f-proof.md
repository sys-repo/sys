# Phase F: test lane orchestration

Governing plan: [linux-wsl-probe.plan.md](../linux-wsl-probe.plan.md).
The original local proof used baseline `e3b89d7d87d4ba0b2e8300459ede301c0a77aaba` plus a ten-path
candidate. The human subsequently split it into the three-file Env owner commit
`57fa435812640da660d8cd238ffc3a97419897fa` and seven-file Vite consumer commit
`1700ff83f69e5ee4462ccce11505ba7f2c1966f5`. Read-only Git inspection verified their contents and
reachability. The source worktree was clean at reconciliation.

Local verification: Darwin arm64, Deno 2.9.8, V8 15.0.245.2-rusty, TypeScript 6.0.3.
This receipt records local proof and inspected landing identities, not an independent code review
or a new Linux result.

## Boundary and design

- `-scripts/task.test.ts` owns the lane table, ordered proof aggregate, argv construction and awaited
  fail-fast execution through `Process.inherit`. No shell interpreter, scheduler or discovery engine.
- `test:run` retains its original direct command and policy. All existing named task surfaces remain.
  Runtime wrappers use the existing `test` permission preset; no preset or dependency changes.
- Unit exclusions and non-discovered cache entries derive only from the routine proof selection.
  Default unit discovery includes script tests. Cache preparation also checks the script graph.
- A real Deno task-shell characterization confirms that appended arguments reach only the final
  command of the old `&&` aggregate. The dispatcher preserves that behavior and literal argv
  boundaries, including spaces, dollar signs, semicolons and `--`.
- No new `node:process` imports remain. The task's Deno-specific plumbing is limited to its executable
  argv/status boundary. Native runtime fixtures explicitly test Deno task argv and self-SIGINT.
- Environment reads use `@sys/fs/env`. The additive `search: 'none'` option belongs to that existing
  owner: no dotenv lookup, no cwd lookup, live process values, and preserved empty/missing distinction.
  Existing `cwd`/`upward` behavior is unchanged. This avoids using Node process access or allowing
  dotenv files to override the parent's terminal settings.
- `Process.inherit` supplies color `1` by default. The dispatcher preserves explicitly supplied color
  values, including `0` and empty, while retaining other inherited environment through `clearEnv: false`.
- External/browser and distribution lanes remain outside routine proofs. Deferred E.2/E.3 work was
  not executed or changed. CI YAML, root workflow generation, lockfile and permission presets remain
  unchanged; task-routing tests inspect the generated Linux workflow directly.

## Verification

Process-owning suites ran sequentially. No assertion, timeout or cleanup policy was weakened.

| Surface | Command / result |
| --- | --- |
| Env regression | `deno task test:unit ./src/m.Env/-.test.ts` from `code/sys/fs`: red before implementation (`dotenv` instead of process value), then **1 test / 13 steps passed** |
| Focused dispatcher/lane proofs | `deno task test:unit --trace-leaks ./src/-test/-test.lanes.test.ts ./-scripts/-test/-task.test.test.ts`: **4 tests / 14 steps passed** |
| Cache preparation | `deno task test:cache`: passed, type-checked/no-run, including script tests and non-discovered proof entries |
| Vite unit suite | `deno task test:unit --trace-leaks --reporter=dot`: **70 tests / 543 steps passed** |
| Vite proof aggregate | `deno task test:proofs`: all **9 lanes**, **29 tests / 157 steps passed** |
| Vite check | `deno task check`: passed |
| FS unit suite | `deno task test:unit --trace-leaks --reporter=dot`: **81 tests / 756 steps passed** |
| FS check | `deno task check`: passed |
| Formatting / whitespace | Exact ten-file `deno fmt --check` and scoped `git diff --check`: passed |

The focused suite proves serial awaiting, first failure codes 7/130/137, original spawn-error identity,
module cwd, inherited-environment configuration, optional-lane isolation, missing/duplicate/reordered
lane rejection, missing cache entry rejection and excluded-but-unselected rejection. Expected routine
file selection is independently authored rather than derived from the production table.

A real nested task invocation runs a native self-SIGINT fixture through the actual dispatcher and
`test:run`; the outer process exits naturally with **130**, with inherited stdout/stderr visible.
Only the fixture's own PID is signalled. This POSIX proof explicitly skips Windows.

The initial argv characterization mistakenly read an undeclared environment variable in an
unprivileged child. Work stopped on that denial. Following the human's instruction, the fixture was
redesigned to read argv only; its permissions were not expanded. Environment forwarding is verified
separately at the process boundary. The temporary Node imports were removed before the full proof run.

### Final documentation review and verification

A source-backed documentation review removed dispatcher/environment implementation narration from
README, narrowed the cache/prompt claims, corrected the default-suite description and retained the
final-lane-only filtering warning. Only README changed in that correction.

The focused dispatcher/lane task was rerun: **4 tests / 14 steps passed**, including native
interruption. Exact seven-file formatting and scoped whitespace checks passed. The earlier full
unit, proof, cache and check results cover unchanged runtime code. No new independent code review or
full-suite rerun was claimed for the documentation-only correction.

Limits: cache preparation ran against the existing local cache, not an isolated empty DENO_DIR.
The cache launcher's non-cached-only bootstrap policy is asserted, but final build/Linux results for
`1700ff83f69e5ee4462ccce11505ba7f2c1966f5` remain unrecorded. The earlier `e3b89d7d8` CI result does
not certify this task-surface change. External/browser reruns and Windows runtime acceptance remain
outside this evidence. No Git mutation or remote CI action was performed by the assistant.

## Source commit boundaries

`1700ff83f chore(driver-vite): move test lane orchestration into scripts`

1. `code/sys.driver/driver-vite/-scripts/task.test.ts`
2. `code/sys.driver/driver-vite/-scripts/-test/-task.test.test.ts`
3. `code/sys.driver/driver-vite/-scripts/-test/u.fixture.task.argv.ts`
4. `code/sys.driver/driver-vite/-scripts/-test/u.fixture.task.interrupt.ts`
5. `code/sys.driver/driver-vite/deno.json`
6. `code/sys.driver/driver-vite/src/-test/-test.lanes.test.ts`
7. `code/sys.driver/driver-vite/README.md`

`57fa43581 feat(fs): add process-only Env.load search mode`

1. `code/sys/fs/src/m.Env/t.ts`
2. `code/sys/fs/src/m.Env/u.load.ts`
3. `code/sys/fs/src/m.Env/-.test.ts`

The owner landed before its consumer, superseding the original combined-commit recommendation.
Neither source commit includes plan artifacts, a published dependency change or an import-map change.
