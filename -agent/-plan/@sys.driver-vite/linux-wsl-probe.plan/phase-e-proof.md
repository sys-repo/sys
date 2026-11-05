# Phase E proof receipt — 2026-11-04

Governing plan: [linux-wsl-probe.plan.md](../linux-wsl-probe.plan.md).
Source baseline: `0b879c4c534786572fb7e5e2d6ded6edfb214081`.
Environment: macOS arm64, Deno 2.9.8, Vite 8.3.5, HeadlessChrome 156.0.0.0.
Initial scope: application/probe launcher alignment and full CI restoration, 29 implementation files.
The initial Cell CLI review follow-up below extended the source candidate to 34 implementation files.
The subsequent lifecycle correction adds four process fixtures, bringing that candidate to 38 files.
Phase F's test-lane orchestration remains separate. No Git mutation was performed in those proof passes.

Reading order: the sections below are successive evidence snapshots, not a cumulative green result.
The 38-path launcher/matrix change subsequently landed in `17c693c9b`; the opening arc in the governing
plan owns landing truth. Later sections record the Cell review, red expanded proofs and the separate
CLI cancellation repair's ordinary-outcome capstone. The final continuation records the human-directed
split between bounded Cell CI delivery and the additional animated-signal follow-up. Earlier passes
do not certify a later candidate; local proof does not establish Linux acceptance.

Closeout reading: the final section records supplied build/Linux success for `e3b89d7d8` and the
explicit E.2/E.3 deferrals. Earlier open-work statements apply to their historical snapshots, not
new implementation obligations. Phase F's later candidate and evidence limits are in
[phase-f-proof.md](./phase-f-proof.md). The original PNG attachments are absent from this companion
directory at retirement preparation; screenshot descriptions below preserve prior inspection,
not new image verification.

## Launcher inventory and generation

- Application Vite dev/build/info parents now use `-A` in `sys.dev`, driver-automerge,
  driver-monaco, driver-pi, driver-prosemirror, driver-stripe, ui-components, ui-dev,
  `@tdb.edu.slug`, `@tdb.slc` and `@tdb.slc.std`.
- Cell-backed development in `ui` and `@draft.shell` also evaluates Vite in its parent through
  `ViteService.startDev`; these dev tasks and their Vite info tasks use `-A`. The Cell
  `sample:vite:dev` task and existing task-projection expectations agree.
- `@tdb.data` info and package-template info use `-A`; their dev/build tasks already did.
  Narrow `code/-tmpl` `prep:bundle` regenerated only the package template's deno.json bundle entry.
- Monaco `smoke:browser`, Stripe `test:build`, HTML `test:browser`, Cloudflare sample deployment
  `build` and Vite `perf` evaluate Vite directly and now use `-A`.
- The five accepted probe parents use `-A`: std-try, browser-syntax, both disposal probes, and
  pure-JSR dev. Four redundant `--allow-import=jsr.io,localhost` flags were removed after Deno
  rejected their combination with `-A`. Dependency/materialization flags and assertions remain.
- Pure-JSR BUILD remains a restricted orchestration parent with a trusted evaluation child.
  Pi preview's confined orchestration, explicit-path boundary and sanitized environment remain.
  Restricted static serving, non-Vite tasks and dependency policy remain. A follow-up caller audit
  removed the three newly unused presets: Cloudflare sample deployment `build`, Cell
  `sample-vite-dev`, and HTML `browser`. Every changed configuration's `dev` preset still has
  callers (serving, preparation or fixture tasks) and remains intact.
- Root `task.prep.ci.ts` no longer passes a diagnostic filter; its existing test expects the
  full source list. The optional package filter API and publishing-isolation tests remain.
- Root `deno task prep:ci` regenerated build with 17 modules and Linux with 57. JSR publishing
  remains unchanged with 50 modules. Windows generation was skipped; no Windows workflow was added.
  Existing graph prerequisite, dependency warming, proof/browser lanes, versions and workflow
  permissions remain. No lockfile, dependency, root configuration or graph data changed.
- All 29 implementation diffs were inspected. Parsed comparisons against HEAD for all 19 changed
  deno.json files initially found only the intended task-string changes. The follow-up additionally
  removes the three unused presets above; remaining presets and other configuration are unchanged.
  Exact formatting passed for 26 authored files; generated YAML
  and the template bundle retain their generators' formatting. Scoped `git diff --check` passed.

## Passed local checks

Existing configured tasks were used. Local HTTP/browser tests required host execution because the
agent sandbox denied localhost binds. Existing terminal assertions used `TERM=xterm-256color` and
`FORCE_COLOR=1`. Neither changes the repository's execution policy.

| Check | Result |
| --- | --- |
| driver-vite `check` | Passed |
| driver-vite `test:unit` | 67 tests / 536 steps passed |
| driver-vite `test:proofs` | All nine lanes passed: 29 tests / 157 steps |
| Three changed standalone runtime probe files | 3 tests / 4 steps passed |
| Pure-JSR authority suite within `test:external` | 1 test / 4 steps passed, including restricted BUILD |
| Root CI-prep tests | 3 tests / 18 steps passed |
| Workspace CI aggregate tests | 1 test / 9 steps passed, including optional filter and publishing isolation |
| Cell sample task projection | 1 test / 2 steps passed |
| Template bundle tests | 1 test / 4 steps passed |
| Pi `test:preview:real` | 1 test / 5 steps passed |
| driver-deno DenoDeploy staging template test | 1 test / 3 steps passed |
| HTML `test:browser` | 1 test / 1 step passed |
| Monaco `smoke:browser`, isolated retry | Dev, built root and built subpath passed with 0 browser errors |
| Vite `perf --runs=1 --strict` | Build and dev samples passed; not a benchmark comparison |
| Root `check:graph` | Passed |

All 17 configured build-matrix tasks passed: sys.dev; ui-dev; ui-components; driver-automerge;
driver-monaco; driver-prosemirror; driver-stripe; ui; Cloudflare sample R2 worker; driver-pi;
driver-vite sample; `@draft.shell`; `@tdb.data`; `@tdb.slc`; `@tdb.slc.fs`; `@tdb.slc.std`;
and `@tdb.edu.slug`. These are macOS executions of the matrix's build tasks, not GitHub Linux runs.

## External failures and evidence limits

The complete `test:external` run exited 1: **11 tests / 19 steps passed; 5 tests / 5 steps failed**.
Assertions and task membership were retained. Failure classification:

1. Generated repository and generated sibling-workspace builds both failed resolving
   `jsr:@sys/std@^0.0.385/dispose/compat` from generated `src/-test/-sw.ts`. Their launchers already
   use `-A`; they consume published `@sys/driver-vite@0.0.480`. These are published/generated
   composition failures, not the WSL permission error, and do not establish local-source parity.
2. Published baseline dev returned an entry still containing `@sys/std`, failing the existing
   transformed-entry assertion after its built-in retries. Published baseline build passed.
3. The Chromium dependency-modulepreload integrity proof detected execution of the tampered
   dependency after preload rejection in the preload-settled schedule. The browser emitted an SRI
   error, then fetched the dependency again and ran it. This observable integrity failure remains
   unresolved; it is not a permission-launcher failure or a passing security proof.
4. The declarative-shadow `open → closed` browser case failed starting Chrome DevTools after
   30 seconds, with cleanup reporting an unresolved owned process. Other shadow cases passed.

Monaco browser smoke initially timed out waiting for Chrome navigation while other browser/build
checks were active. One isolated retry passed development and built pages at `/` and `/tools/monaco/`,
with zero browser errors. The initial timeout remains a recorded transient result; no assertion or
timeout was changed.

No Linux execution environment was available locally: Docker's configured daemon was unavailable.
The final full build/Linux matrices and affected Linux external probes still need execution on the
resulting candidate. No WSL browser-opening claim is made. Published composition and browser-integrity
failures are retained as separate findings; this bounded launcher cleanup does not change their
implementations or weaken assertions to produce green output.

## Inspected GitHub baseline

Live GitHub inspection found successful focused runs for exact baseline
`0b879c4c534786572fb7e5e2d6ded6edfb214081`:

- [Build run 41767774329](https://github.com/sys-repo/sys/actions/runs/41767774329):
  [driver-vite build job 126370099172](https://github.com/sys-repo/sys/actions/runs/41767774329/job/126370099172)
  succeeded.
- [Linux run 41767774320](https://github.com/sys-repo/sys/actions/runs/41767774320):
  [graph job 126370099093](https://github.com/sys-repo/sys/actions/runs/41767774320/job/126370099093)
  and [driver-vite job 126370948715](https://github.com/sys-repo/sys/actions/runs/41767774320/job/126370948715)
  succeeded. Dependency warming, unit and proof steps succeeded; the browser step was skipped.

These validate the landed focused cleanup baseline, not phase E's restored matrices or launcher
changes. The governing plan remains open for the actual candidate's Linux/full-CI acceptance and
the separately planned phase F.

## Blind-review adjudication and Cell CLI correction

The returned independent review requested changes for one missed maintained entrypoint:
`code/sys/cell` → `deno task cli start --mode dev`. Source adjudication confirmed that `-P=cli`
reached the Vite service in-process; correcting `sample:vite:dev` did not correct this route.

The correction keeps `cli` and its preset restricted. `-scripts/task.cli.ts` uses the existing CLI
parser and delegates only valid dev starts for the module-anchored `-sample/cell.vite` directory.
Help, invalid arguments, other commands and custom Cell directories retain the in-process restricted
runner. Existing sample defaults and argument boundaries have regression coverage, including
`--mode=dev`, the leading task delimiter, explicit directories and non-zero status propagation.

`-scripts/u.cli.vite.ts` launches the existing Cell CLI entry with `-A`, inherited cwd/environment
and terminal stdio. Node's built-in child-process primitive supplies an owned signal target and a
separate POSIX process group; `Process.inherit` does not expose those capabilities. This adds no
external dependency or generic process framework. The helper is imported only by the Vite branch.
Cell remains the service-lifecycle owner; no service, discovery, native-resolution or configuration
implementation changed.

The exact `deno task cli` process proof exposed two SIGINT deliveries for one group interrupt
(direct group delivery plus task forwarding). Forwarding both made Cell exit before session cleanup.
The wrapper now forwards one shutdown request and awaits its child's status. Repeated wrapper signals
are coalesced rather than interpreted as a second forced exit. The child retains its own terminal
and lifecycle handling. Temporary signal logging was removed. The proof observes session removal and
port release independently of the outer task's exit; it does not count fallback cleanup as success.

The process proof covers the exact task route with group SIGINT, direct restricted-wrapper SIGTERM,
HTTP 200 readiness, exit 130, session removal and port release, plus startup-conflict exit 1.
A separate custom-service process proof queries permission state and confirms the CLI preset remains
restricted. No maintained Cell descriptor or sample port was changed.

Both the original route-selection regression and the task-level duplicate-interrupt regression
were observed red before their corresponding corrections passed. Fixture type/schema mistakes were
corrected without relaxing validation. This is macOS evidence, not a Linux WSL reproduction.

Cell now exposes `test:cli:vite` through `test:proofs`. Root `deno task prep:ci` generated the Cell
`proofs: true` entry; no workflow YAML was hand-edited. The matrix remains 17 build / 57 Linux,
publishing stays unchanged at 50, and Windows remains skipped. The earlier review's exact match to
pre-diagnostic workflows predates this deliberate additional Cell proof route.

Final direct verification on macOS arm64 / Deno 2.9.8:

| Check | Result |
| --- | --- |
| Cell `check` | Passed |
| Cell `test --trace-leaks` | 42 tests / 350 steps passed |
| Cell `test:proofs` → `test:cli:vite` | 1 test / 3 steps passed |
| Vite `test:entry:process` | 2 tests / 10 steps passed, including restricted cached serving |
| Root CI-prep filtered test | 1 test / 1 step passed |
| Root `check:graph` | Passed |
| Exact seven Cell authored files: formatting | Passed |
| Scoped implementation whitespace | Passed |

The full Cell run used `TERM=xterm-256color FORCE_COLOR=1` for existing terminal assertions.
A final graph-check invocation exceeded its 60-second tool budget; the unchanged configured command
completed when rerun with a 180-second tool budget. No assertion or repository timeout was relaxed.
Help and the Cell DSL root/start-services chapter were also exercised through the restricted CLI.
No full application-build rerun, browser/external aggregate rerun, interactive TTY/keyboard proof,
Windows execution or Linux execution was performed in this correction pass. The corrected launcher
has not received a new independent review; the original review cannot certify this subsequent delta.

The review also reported independent reproduction of published-baseline dev failure and dependency
modulepreload integrity failure (both ordinary and preload-settled schedules). Those are separate
unresolved findings, not permission-launcher successes. Generated-repository/sibling composition
causes remain only partially independently verified. Shadow-browser cases passed for the reviewer
in isolation; that supports a transient classification, not proof of resource contention. Monaco's
isolated retry remains receipt evidence rather than a new correction-pass run. No assertions were
weakened to conceal any of these results.

Required candidate acceptance remains: full Linux/build workflows with exact SHA/job evidence,
affected Linux external probes, and explicit outstanding-failure dispositions. The new Cell route
will run in the generated Linux proof lane. Phase F remains separate. No Git mutation was performed.

## Focused lifecycle review correction and forced-PTY diagnosis

This follow-up supersedes the earlier correction pass's signal and PTY evidence limits, not its
external/Linux acceptance limits. The focused review identified three accepted issues: detached-child
hangup/resize delivery, permanently suppressed shutdown escalation, and resource-wide proof fallback
that could kill an unrelated replacement listener. The routing/parser and argument order remain
unchanged; the correction stays in the Cell launcher and its process proofs.

- The launcher translates SIGHUP into graceful SIGTERM and forwards SIGWINCH independently.
  Duplicate shutdown requests coalesce during a fixed five-second grace. Expiry targets only the
  spawned process group with SIGKILL, followed by a bounded five-second child-settlement wait.
- Leader exit still terminates surviving descendants when no forced group termination has occurred.
  A group-termination attempt retires that authority before the syscall. Non-ESRCH failures remain
  visible; they are neither suppressed nor retried against a stale group ID.
- Proof fallback targets groups acquired by its own invocation, never Cell's resource-wide `kill`
  command. An executed leftover-session/replacement-listener case confirms the replacement still
  serves HTTP after repeated fallback teardown. General Cell break-glass behavior is unchanged.
- Real OS `script` PTYs exercise the automatic screen reporter, kernel resize from 100×30 to 47×12,
  actual Ctrl+C input, and exact `stty -g` input-mode restoration. A second PTY case stops the owned
  group while input is raw, requests wrapper shutdown, and requires exit 137, restored input and a
  released Vite port. Forced exit leaves session metadata; the fixture removes only its recorded
  session after asserting the launcher outcome, never treating fixture cleanup as launcher success.
- Direct Cell entry characterization and the wrapper both returned 0 for keyboard shutdown on this
  sample. The initial PTY proof pinned that observation. The subsequent Linux-reported failure
  investigation below establishes that 0 was an exit-hook defect, not a valid keyboard contract;
  its correction supersedes this initial assertion.

The forced-PTY proof initially failed with `kill EPERM`. Temporary instrumentation established this
exact sequence for owned leader PID 49401 under unchanged permissions:

```text
grace.expired
kill.begin pid=49401 exited=false
kill.accepted pid=49401
child.exit code=null signal=SIGKILL
kill.begin pid=49401 exited=true
kill.error pid=49401 code=EPERM
child.close code=null signal=SIGKILL
```

The failure was on a redundant post-exit group kill, after the first group kill had succeeded.
One-shot ownership retirement removed that second operation; EPERM handling was not relaxed and no
permission, profile, dependency, argument-order or assertion change was needed for this fix. The
underlying kernel's choice of EPERM for the second operation was not independently characterized.
Temporary tracing was removed. The forced-PTY regression was observed red → green; the additional
leader-exit/surviving-descendant case was added green and passed in the complete proof lane.

Latest local verification, macOS arm64 / Deno 2.9.8:

| Check | Result |
| --- | --- |
| Cell `test:cli:vite --filter=PTY` | 1 test / 2 steps passed after the one-shot fix |
| Cell `test:proofs` | 3 tests / 10 steps passed |
| Cell `check` | Passed |
| Cell `test --trace-leaks` | 42 tests / 350 steps passed |
| Exact ten Cell source/configuration files: formatting | Passed; surgical formatting edits only |
| Vite `test:entry:process` | 2 tests / 10 steps passed, including restricted cached serving |
| Root `check:graph` | Passed |

The full Cell suite again used `TERM=xterm-256color FORCE_COLOR=1` for its existing terminal
assertions. The lifecycle proof lane used the existing module permission presets and trusted Vite
child policy; no additional permissions were granted. The Linux `script` invocation is implemented
but has not been executed here. No new full build, browser/external aggregate, Linux or Windows run,
or independent review of the corrected lifecycle delta is claimed. Outstanding external/security
findings above remain unresolved; phase E's full-candidate acceptance and phase F remain open.

## Whole-candidate local residue review

A subsequent TMIND pass inspected the candidate's tracked deltas and seven untracked Cell source
files across execution authority, process ownership, generated CI selection and evidence claims.
No further source blocker was identified in that pass; this is self-review, not a new independent
review or Linux acceptance. The obsolete signal trace, temporary direct-entry characterization
switch, removed Cell preset and no-deadline documentation are absent from their implementation
surfaces. Phase F's orchestration refactor has not been mixed into the candidate.

- Exact-file formatting check: all 34 authored source/configuration files passed. The three
  generated artifacts retain generator formatting; the Cell README was inspected without
  reformatting concurrent documentation work.
- Root CI-prep regression rerun through `test:root`, filtered to `scripts/task.prep.ci`:
  1 test / 1 step passed. Full source selection, rather than a diagnostic predicate, is asserted.
- Generated workflow deltas restore 17 build / 57 Linux entries, including the Cell proof lane.
  The workflow steps and `contents: read` controls are unchanged. No diff exists for publishing
  workflow, root deno.json, lockfile, imports.json or deps.yaml.
- Source/workflow whitespace check passed; the Git index remains empty.

That review examined the worktree over `0b879c4c5`, before the source landed in `17c693c9b`.
It did not establish Linux acceptance. External published-composition and browser-integrity failures
still need explicit dispositions; that review did not waive them or declare Phase E complete.

## Linux-reported Cell interrupt failures

Source baseline: `17c693c9b` (`fix(vite): align application launchers and restore full CI`). The human
supplied Linux job output for two distinct assertions, without job URLs or a separately verified run
SHA: routine lifecycle cleanup returned 1 instead of 130, and a later PTY keyboard proof returned
130 instead of its then-hard-coded macOS observation of 0. The latter is not a repeat of the former.

### PTY exit-status interop

Temporary local tracing on macOS arm64 / Deno 2.9.8 established:

```text
Cell terminal reason: keyboard:interrupt
Cell runner and main return: Deno.exitCode=130, process.exitCode=undefined
Node beforeExit: code=0, Deno.exitCode=130, process.exitCode=undefined
Deno unload: Deno.exitCode=130
Node exit: code=0, Deno.exitCode=0, process.exitCode=0
Trusted child exit/close observed by wrapper: code=0, signal=null
```

Inspected installed `restore-cursor@5.1.0` and `signal-exit@4.1.0` source explains the mutation:
cursor restoration installs an exit hook, and the hook writes the emitted Node exit code back to
`process.exitCode`. Deno's exit-code assignment alone does not publish that value to Node's exit
state. The spinner's `is-interactive@2.0.0` dependency disables animation when `CI` is present;
this makes ambient CI presentation relevant, rather than establishing an OS-specific exit policy.
Installed dependencies were inspected only, never patched.

The runner now publishes the admitted interrupt's 130 to both Deno and Node. It still awaits service
and presentation cleanup; no explicit process exit, status normalization in the wrapper, or accepted
status union was added. The PTY expectation is exactly 130 for keyboard interruption and 137 for the
forced case. The corrected expectation failed locally before the runner change and passed after it.
The proof now explicitly exercises keyboard shutdown both with and without `CI`, on every host,
as well as forced termination. Resize, exact terminal-mode restoration, session removal and released
port assertions remain mandatory. All temporary tracing was removed.

### Ready-publication rejection ownership

Source tracing identified a gap between `Cell.start` returning and attachment of the service-finished
observer: `await session.ready()` performs filesystem I/O first. An observing parent can interrupt
in that interval, rejecting the service's finished promise without a rejection owner. A deterministic
regression delays completion of that publication boundary across one event-loop turn and requests
interruption while the service also fails cleanup. It observed an unhandled `service-aborted`
rejection before the fix, and none afterward. The test's rejection-event recorder asserts an empty
collection; production does not install a rejection-suppression handler.

Service outcomes are now observed immediately after startup, before readiness publication. Terminal
arbitration remains after ready-body construction, preserving the existing ready-boundary
presentation-priority test and first-terminal-reason behavior. The captured outcome retains the
original rejected value by identity rather than normalizing it. A narrow internal session-creation
seam allows the test to hold this boundary without changing production timing. There are no added
production sleeps, retries or timeout increases.

This independently proves and repairs a race consistent with the earlier Linux exit-1 report. That
job discarded the child's stdout/stderr, so its exact original cause cannot be retrospectively
confirmed. The real SIGINT/cleanup-failure proof now drains and reports both streams, still requires
exit 130, and also requires the cleanup failure to remain visible.

### Verification of the six-file Cell correction

Local macOS arm64 / Deno 2.9.8:

- Lifecycle suite: 1 test / 10 steps passed; deterministic rejection-ownership regression red → green.
- Cell `test:proofs`: 3 tests / 11 steps passed, including both CI presentation modes and forced PTY.
- Cell `TERM=xterm-256color FORCE_COLOR=1 deno task test --trace-leaks`: 42 tests / 351 steps passed.
- Cell `check`, formatting of the exact six changed source files, and scoped whitespace check passed.

No launcher permission, workflow, dependency, process-group or force-kill policy changed in that
six-file pass. Its local results do not certify Linux behavior. At that checkpoint no new independent
review, full workspace run or Git mutation was claimed; the later review and proof expansion follow.
Phase F remains separate from this Cell correction and the broader acceptance requirements.

## Cell follow-up review and expanded terminal proofs

Baseline: `17c693c9b2657fef9cb1e9a4d555aee0746674ef`. This is the Cell CI detour within Phase E,
not a restart of Vite execution-policy work. Reconciliation inspected reachable history and current
Cell deltas; it did not rerun tests or execute Git mutations. No exact-candidate Linux acceptance
is recorded here. The governing arc names `fix(cell): preserve terminal outcomes through shutdown`.
That unit includes the accepted coverage gaps, not just the earlier six files whose checks passed.

### Independent review and disposition

The human supplied a fresh review of the six-file correction against `17c693c9b`, on macOS arm64 /
Deno 2.9.8. It reported insufficient evidence, with no confirmed attributable regression. Its focused
lifecycle, PTY, full Cell proof and check runs passed. Four supplemental readiness cases also passed:
already-rejected cause identity, presentation priority, publication failure owning subsequent abort
rejection, and complete failure collection across publication/stopping/service/disposal errors.
These are reviewer-reported results, not a fresh execution by this reconciliation pass.

The reviewer independently confirmed the Deno/Node exit-status mismatch and accepted the paired
interrupt assignment. It identified two missing combinations: animated OS-signal shutdown and animated
ordinary startup/non-interrupt cleanup failure. Both were accepted as proof obligations. Signal hook
redelivery and ordinary-error status overwrite were hypotheses, not demonstrated regressions of the
six-file correction. Its attempted animated launcher probe failed before Cell because its invocation
could not find permission preset `test`; that run supplied no application evidence.

### Added proof surface and construction errors

- Existing Vite PTY modes add graceful `sigint` and `sigterm` alongside `keyboard`, `keyboard-ci` and
  `forced`. Signal modes send a real OS signal to the wrapper after readiness/resize; keyboard modes
  retain literal Ctrl+C input. Expected application statuses remain exactly 130 and 137 respectively.
- Nine ordinary terminal cases cover `cli`, package `root`, and restricted `script` entrypoints,
  each with startup failure, cleanup failure and success. A real HTTP service uses file handshakes
  for startup/completion. The proof requires animated cursor hooks, intended diagnostics, resource
  closure, removed session metadata, restored terminal mode and exact status before fallback.
- The first service fixture used an absolute import and was rejected by Cell policy. It now copies
  the relocatable service into the generated Cell and uses `./-services/terminal.ts`; the policy and
  permissions are unchanged. Later fixture mistakes treated boolean `Fs.exists` as an object; those
  checks were corrected. These failed runs were fixture errors, not production regressions.
- Terminal checks use `Cli.Is.interactive()` in PTYs and `Cli.Is.terminal('stdin')` in the launcher.
  Test `stty` measurement is shared but remains independent from production restoration. Native
  `Deno.Command` is retained for inherited stdin with captured stdout, unsupported by the inspected
  `Process.capture`/`Process.inherit` combination. CI overrides are child-local, not ambient mutation.

### Latest execution evidence and limits

The previous session ran these tasks sequentially from `code/sys/cell`:

| Command | Recorded outcome | Interpretation |
| --- | --- | --- |
| `deno task test:cli:vite --filter='animated terminal outcomes'` | All nine steps failed after the fixture corrections; detailed output was truncated | Prior reporting identified startup exit 0 instead of 1 and ready-state success/cleanup timeouts. Recover complete per-case evidence before assigning production causes. |
| `deno task test:cli:vite --filter='development CLI Vite PTY'` | Keyboard, keyboard-CI and forced passed; SIGINT and SIGTERM failed | Both signal cases reported `AggregateError: Cell Vite launcher failed`, with `kill EPERM` at post-exit `killGroup()` and wrapper status 1 instead of 130. |

The signal-case output contains real spinner/cursor and resize activity before `PTY_SIGNAL_READY`.
The failure is not proof of successful service/session cleanup: the fixture fails its status assertion
before those checks. Execution stopped at the OS permission error; it was not suppressed, retried
with broader grants or repaired in production. The exact signal/group-lifetime cause remains open.
Do not conflate this with the earlier forced-case redundant second kill, whose correction and green
proof remain distinct. A duplicate-signal or pending-keyboard-read explanation is not yet established.

A check run during fixture development had truncated output and is not recorded as a clean final
check. No complete post-expansion Cell proof/check/full-suite or formatting pass is established.
Earlier six-file green counts and the independent review do not certify these added paths.

### Re-entry inventory and landing boundary

At reconciliation, inspection attributed eight tracked Cell deltas and two new fixtures to this
follow-up (the index was empty):

- `code/sys/cell/-scripts/u.cli.vite.ts`
- `code/sys/cell/src/m.cli/m.run/u.start.ts`
- `code/sys/cell/src/m.cli/u.lifecycle/u.start.ts`
- `code/sys/cell/src/m.cli/-test/-u.start.lifecycle.test.ts`
- `code/sys/cell/src/m.cli/-test/-task.cli.vite.process.ts`
- `code/sys/cell/src/m.cli/-test/u.fixture.cli.vite.pty.ts`
- `code/sys/cell/src/m.cli/-test/u.fixture.cli.vite.ts`
- `code/sys/cell/src/m.cli/-test/u.fixture.kill.ts`
- `code/sys/cell/src/m.cli/-test/u.fixture.cli.terminal.pty.ts`
- `code/sys/cell/src/m.cli/-test/u.fixture.cli.terminal.service.ts`

This is an inspected snapshot, not a permanent path allowlist or staging instruction. Reinspect live
deltas before implementation and landing; unrelated work and the human-owned plan buffer stay out.
The governing plan defines the continuation order: complete evidence and fixture validation first,
smallest owner-level corrections with red → green proofs, full Cell verification, focused review of
new behavior, then a separately authorized Cell landing. Exact-SHA Linux/build evidence and explicit
external/security dispositions remain Phase E acceptance requirements. Phase F must not be folded
into this repair, and its later task changes require their own final-candidate verification.

## Continuation: ordinary exit status and keyboard shutdown ownership

This local continuation implements part of E.1; the Cell repair remains incomplete. It does not
establish a green expanded proof suite, independent review, source landing or Linux acceptance.

### Ordinary status correction

Complete earlier failure output confirmed startup failure exited 0 through all three entrypoints,
after the fixture printed the expected startup error and `PTY_CLEAN`. The Cell CLI entry, package
root entry and development script now publish their selected code to both Deno and Node through
one private `setExitCode` helper. The runner's existing admitted-interrupt assignment uses the same
helper, still after awaited cleanup. Ordinary library calls to `CellCli.run` retain their returned
error result rather than acquiring a new ordinary-error exit-code side effect. The root package
keeps its CLI imports behind `import.meta.main` and the existing lazy-import pattern.

The narrow status test passed all four codes: 0, 1, 130 and 137. The actual animated startup-failure
PTYs then passed through `cli`, `root` and restricted `script`, requiring exact exit 1 and the
existing service/session/terminal/port cleanup assertions before fallback.

Additional source paths beyond the preceding ten-path snapshot:

- `code/sys/cell/-scripts/task.cli.ts`
- `code/sys/cell/src/m.cli/mod.ts`
- `code/sys/cell/src/mod.ts`
- `code/sys/cell/src/m.cli/u/u.exit.ts`
- `code/sys/cell/src/m.cli/-test/-u.exit.test.ts`

### Confirmed completion stall and proposed lower-owner scope

The same ordinary-outcome run completed with **3 steps passed / 6 failed**. All six cleanup-failure
and success cases reached the reporter's call to `Cli.Keyboard.shutdown()` but did not return before
the existing 10-second fixture deadline. Temporary before/after markers established that boundary
in every case; the markers were removed and the reporter has no remaining diff. These failures are
not startup/readiness handshake timeouts, nor successful graceful-cleanup proofs.

Source inspection of `code/sys/cli/src/m.core/m.Keyboard/u.bind.ts` and `u.shutdown.ts` traced the
wait to the default Cliffy keypress iterator: `shutdown` awaits `handle.finished`, and the binding
awaits `iterator.next()`. Cached `@cliffy/keypress@1.3.1/mod.ts` awaits its stdin read in `#pullEvent`
before installing the pull-queue resolver. Its `dispose()` marks the owner disposed and resolves an
existing pull-queue item, but does not cancel that pending read. With no new keyboard input, the
binding's autonomous listener cannot finish. The real PTY stall and this source path expose a
shared keyboard-owner cancellation gap; a Cell-only timeout, skipped await or early exit would
conceal it rather than repair it. No installed dependency or shared CLI source was patched.

Under E.1's scope boundary, the proposed next extension is a bounded repair of the existing
`@sys/cli` keyboard owner: cancellation without another keystroke, truthful `finished` settlement,
terminal/input ownership preservation, independent owner-level proof and immediate Cell capstone
validation. Retain the public keyboard contract, command grammar and restricted entry boundary;
do not introduce a generic input/process framework. Explicit scope agreement is still required
before implementing that lower-owner change.

The separate animated SIGINT/SIGTERM post-exit `kill EPERM` failure remains unresolved. That proof
was not rerun in this continuation; no signal policy, process-group cleanup or permissions changed.
The ordinary completion diagnosis does not establish the signal/group-lifetime cause.

### Checks and limits

After removing the temporary trace, the existing Cell tasks passed:

- `deno task test --trace-leaks --filter='@sys/cell/cli start lifecycle'`: 1 test / 10 steps.
- `deno task check`: passed, including the expanded proof fixtures.
- `TERM=xterm-256color FORCE_COLOR=1 deno task test --trace-leaks`: 43 tests / 355 steps.
- Exact 15-file source formatting and scoped tracked whitespace checks passed. Two fixture layout
  adjustments were applied surgically from the formatting preview; no formatter write was run.

The ordinary PTY proof remains red as described above. The routine 43-test suite does not discover
that separately configured process-proof file; its pass cannot substitute for `test:proofs`.
No complete expanded proof pass, new independent review, Git mutation or Linux run occurred.
The Cell follow-up stays unchecked in the governing arc; Phase F remains subsequent.

## Continuation: CLI cancellation repair and Cell capstone

The human explicitly approved the managed/raw ownership separation and direct
`@cliffy/keycode@1.3.1` dependency. Raw Cliffy keypress remains unchanged; managed bindings share a
competing input session, but no longer dispose separately acquired raw owners. Concurrent mixed
readers are unsupported; sequential handoff is required. `deps.yaml` was projected with the narrow
`deno task prep:deps`. Generated changes are the import-map entry and lockfile direct-specifier
metadata; no dependency version or package.json content changed.

The private CLI input owner borrows native stdin, pauses native reads, removes owned listeners and
restores native raw mode without closing/destroying stdin. Completion follows queued native
read-stop work rather than a stop flag or a microtask race. Bindings await that completion and their
admitted callbacks. Deferred release failures retain public-handle retry authority; a deterministic
red regression caught and closed that integration edge. The existing shutdown helper's unrelated
`throw undefined` edge is unchanged.

Local evidence: Deno 2.9.8, Darwin arm64.

- Original idle-disposal PTY reproduced `Keyboard operation did not settle` before production edits,
  then passed after input-owner replacement.
- Keyboard unit lane: **5 tests / 45 steps passed**, including decoder/modifier/repeat behavior,
  malformed/split reads, held completion, partial acquisition, release failures and retries.
- CLI PTYs: **18 passed**. Nine schedules run as natural-exit processes and as child tests with
  operation/resource sanitizers: idle dispose/until, immediate disposal, immediate/already-resolved
  until, two managed bindings, raw-first handoff, already-raw native stdin and burst read-ahead.
- Raw-first initially exposed changed terminal flags after raw Cliffy alone, before any binding
  acquisition. The final proof asserts the original terminal baseline after managed shutdown and
  subsequent raw reuse; it does not assert that unchanged Cliffy restores the intermediate flags.
  Already-raw native stdin has its own exact-mode restoration proof.
- Privileged PTY file renamed to `-keyboard.pty.proof.ts` and explicitly tasked; ordinary discovery
  remains run-denied. The exploratory native-probe branch and temporary marker were removed.
- Full CLI `check` passed; full `test:unit --trace-leaks`: **54 tests / 424 steps passed**.
- The existing all-authority-denied keyboard entry proof passed unchanged.
- Cell `test:cli:vite --filter='animated terminal outcomes'`: **1 test / 9 steps passed**, including
  all six former shutdown stalls. Repeated against the final production CLI changes; no Cell source
  or fixture changes were needed in this continuation.
- Exact nine authored CLI file formatting and scoped tracked whitespace checks passed. Formatting
  corrections used surgical edits, not formatter writes.

These are local implementation proofs, not an independent implementation review or Linux/WSL proof.
Windows remains unverified. The separate graceful SIGINT/SIGTERM `kill EPERM` proof was not rerun or
changed; the full Cell process suite and Phase E acceptance remain open. No Git mutation occurred.

## Continuation: release recovery, input errors and isolated cancellation

A returned blind implementation review against `e84119fa4bbe7693f6b92ec6d76bbc69ecfd84ae` identified
two failure-path defects and a proof gap. Source adjudication accepted all three; the earlier
public-retry test established retry authority, not public awaitable recovery. The earlier
active-idle PTYs established eventual cleanliness after later input, not isolated stop-only
completion.

Both reported defects were reproduced before production changes:

- A public shutdown retry settled before its deferred release barrier.
- An input error during a held callback became `Keyboard disposal failed.` despite successful
  `onError` handling when release completed first.

Release attempts now have distinct completion promises, retaining prior release failure separately.
The public handle keeps its original `finished` promise; a private shutdown join awaits current
release work before reporting that original outcome. Undelivered input errors are claimed through
listener policy after release, rather than permanently rejecting release completion. This preserves
late errors when cancellation prevents another iterator pull and retains unavailable-error policy.
Concurrent shutdown joins also await late error callbacks; a separate red regression caught and
closed that interaction during this correction.

Five stop-only schedules run both as natural-exit processes and sanitized child tests: active-idle
dispose/until, immediate disposal, immediate until and already-settled until. These children end
directly after completion, without later keys, reacquisition or asynchronous terminal measurement.
The parent keeps input open, sends no keys, and checks natural status before fallback cleanup.
Existing handoff and terminal-state cases remain separate.

Final local verification: Deno 2.9.8 / V8 15.0.245.2-rusty / TypeScript 6.0.3, Darwin 25.6.0 arm64.
All six commands ran against the corrected source; process-owning proofs ran sequentially.

From `code/sys/cli`:

| Command                                                           | Result                                  |
| ----------------------------------------------------------------- | --------------------------------------- |
| `deno task test:unit --trace-leaks ./src/m.core/m.Keyboard/-test` | 5 tests / 54 steps passed               |
| `deno task test:keyboard:entry`                                   | Denied-authority process proof passed   |
| `deno task test:keyboard:pty`                                     | 28 passed, including 10 stop-only cases |
| `deno task check`                                                 | Passed                                  |
| `deno task test:unit --trace-leaks --reporter=dot`                | 54 tests / 433 steps passed             |

From `code/sys/cell`:

| Command                                                         | Result                  |
| --------------------------------------------------------------- | ----------------------- |
| `deno task test:cli:vite --filter='animated terminal outcomes'` | 1 test / 9 steps passed |

Exact-file formatting passed for the CLI README, deno.json and eight keyboard source/test files;
scoped tracked whitespace checks passed. Changes used surgical edits, not formatter writes.
Plan/receipt checks still flag historical formatting residue; no broad cleanup was applied.

Public documentation now distinguishes disposal request, per-binding callback completion, failed
cleanup and awaitable recovery. Proof labels and decoder comments no longer imply untested read
boundary equivalence. Live JSR score/docs were inspected for `@sys/cli@0.0.320`; published docs still
describe the pre-repair behavior, not this local candidate.

No dependency or permission changes were needed in this correction. No Cell source/fixture or Git
mutation occurred. The Cell entrypoint-comment suggestion remains with the separate Cell unit. The
unrelated shutdown `throw undefined` edge remains unchanged. This is local verification of the
review-driven correction, not independent re-review or Linux/WSL/Windows acceptance. Differential
Unicode/chunk-boundary coverage, arbitrary terminal-state restoration, the separate Cell graceful
signal failure and wider Phase E obligations remain outside this proof.

## Continuation: bounded Cell CI delivery and explicit signal follow-up

Baseline: `66cf4696a` plus the Cell worktree, after the CLI cancellation prerequisite landed.
The human explicitly requested fixing the reported Linux CI failures without making the additional
animated-signal investigation a prerequisite. The governing plan now separates E.1 and E.2; the
older requirement to resolve every expanded case in one Cell commit is superseded, not silently met.

The supplied CI screenshot, originally named `cell-linux-keyboard-failure.png`, shows a rerun of
`17c693c` and the Cell job failure. Its accompanying log identifies the wrong keyboard expectation:

```text
expected { code: 130, signal: null } to deeply equal { code: +0, signal: null }
expect(exited).to.eql({ code: forced ? 137 : 0, signal: null });
```

The subsequent exit 1 belongs to the failing fixture. This log contains no EPERM and does not
establish an animated OS-signal defect. The candidate expects exactly 130 for keyboard interruption
and 137 for forced termination, and retains the paired runtime exit-status and early rejection-owner
corrections described above. The screenshot's identity does not establish the earlier cleanup-failure
job's SHA. No job URL or fresh Linux result was obtained in this pass.

No production signal handling changed during the split. The same `proveVitePty` assertions now serve
both the retained CI cases and `-task.cli.vite.signals.process.ts`, explicitly tasked as
`test:cli:vite:signals` outside `test:proofs`. Both animated OS-signal cases retain exact exit 130,
resize, terminal, session and port assertions before fallback. They are deferred, not skipped or
reported green. Their last execution still failed at post-exit `killGroup()` with `kill EPERM`.
Those failing cases were not rerun after the stop; permissions and error handling remain unchanged,
and no dependency patch was made.
Signal-exit redelivery remains a source-backed hypothesis, not a demonstrated cause.

Fresh local verification: Deno 2.9.8 / V8 15.0.245.2-rusty / TypeScript 6.0.3,
Darwin 25.6.0 arm64. Commands ran from `code/sys/cell`; process-owning suites ran sequentially:

- `deno task test --trace-leaks --filter='/start lifecycle|exit status|sample task projection/'`:
  **3 tests / 16 steps passed**.
- `deno task test:proofs`: **4 tests / 20 steps passed**. Retains raw SIGINT/SIGTERM/SIGHUP,
  duplicate coalescing, grace/forced termination, surviving-descendant and replacement-listener
  checks, both keyboard presentation modes, forced PTY, nine ordinary animated outcomes and Vite
  startup-failure propagation. Every proof present at `17c693c` remains in the CI lane; only the two
  later-added animated OS-signal cases are deferred.
- `TERM=xterm-256color FORCE_COLOR=1 deno task test --trace-leaks --reporter=dot`:
  **43 tests / 355 steps passed**.
- `deno task check`: passed, including the separate signal entry's type check, not its execution.
- Exact 18-file source/config formatting and scoped tracked whitespace checks passed.

Inspected `.github/workflows/test.linux.yaml` still selects Cell with `proofs: true`, running
`test` and `test:proofs`. No workflow, matrix, dependency, permission or shared CLI change was made.
The original red CI assertion and earlier owner-level red/green evidence are retained; this routing
split is mechanical and did not add a new runtime hypothesis test. No new independent review or Git
mutation occurred. This establishes the bounded local candidate, not GitHub CI success. The next
platform evidence must use the corrected committed candidate rather than rerunning `17c693c`.

### Fixture adapter correction

The human requested removing direct runtime coupling from
`u.fixture.cli.terminal.service.ts`. It now uses `Env.load({ cwd: args.cwd })` from
`@sys/fs/env`, scoped to the isolated Cell rather than repository dotenv files, and
`HttpServer.create/start/close` from `@sys/http/server`. The server still binds an ephemeral
loopback port, remains silent and acquires no keyboard owner. The file contains no direct `Deno.*`
calls. No shared library, dependency or permission change was needed.

After this fixture-only correction, the nine animated terminal outcomes passed again
(`deno task test:cli:vite --filter='animated terminal outcomes'`), as did `deno task check` and
exact-file formatting. The full-suite counts above precede this correction; they were not rerun
by the implementing assistant at that point. The later supplied independent review reports its own
complete verification below.

### Independent review and landed candidate

The human supplied a fresh-session **PASS FOR BOUNDED COMMIT** report against
`66cf4696ab8bf2a305a5b4d7155b19ba4485891e` plus all 18 candidate files, including the five then-untracked
files. It reports no commit-blocking defects or material maintenance findings, retained original CI
coverage against `17c693c9b`, and unchanged assertions in the separate animated-signal task. That task
was not executed. This is supplied review evidence, not an additional review by the implementing
assistant.

The reviewer reports sequential macOS arm64 / Deno 2.9.8 verification:

- Focused lifecycle/status/task tests: **3 tests / 16 steps passed**.
- `deno task test:proofs`: **4 tests / 20 steps passed**.
- `deno task check`: passed.
- Full leak-traced tests with the established terminal environment: **43 tests / 355 steps passed**.
- Exact 18-file formatting and candidate-scoped whitespace checks: passed.

After the human's push, read-only Git inspection confirms HEAD
`e3b89d7d87d4ba0b2e8300459ede301c0a77aaba`,
`fix(cell): preserve terminal outcomes through shutdown`, containing exactly the 18 Cell source/config
paths. The preceding keyboard commit is `66cf4696a`; the Cell worktree is clean. The evidence image
is not included in the source commit. No Git mutation was performed during reconciliation.

The first supplied GitHub screenshot showed `build #687` passed and `test:linux #53` still in
progress for `e3b89d7`. The later completed-run screenshot below supersedes that Linux evidence limit.

### Green Linux candidate and orchestration boundary

The human supplied a screenshot of the completed
[`test:linux #53` run](https://github.com/sys-repo/sys/actions/runs/41943981746), originally named
`cell-linux-ci-green.png`. The inspected screenshot showed:

- Candidate `e3b89d7`, branch `phil-work`.
- Workflow status **Success**, duration **6m 39s**.
- Graph passed and **57 matrix jobs completed**; Cell and driver-vite are visibly green.

Together with the earlier build screenshot, this establishes green build/Linux feedback for the
landed bounded repair. The run URL and result were read from supplied screenshots, not independently
retrieved from GitHub. This is not proof that separate external/browser scenarios passed.

After the human requested preparing orchestration without another detour, the governing plan now
explicitly removes wider Phase E acceptance as a Phase F prerequisite. Animated-signal,
published/generated composition, browser-integrity/process findings and outstanding Linux external
probes remain recorded separate follow-ups with their assertions and executable tasks intact.
This disposition does not claim those failures are fixed or waive failures introduced by Phase F.
No source implementation, tests or Git mutation were performed during this preparation.
