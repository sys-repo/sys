finite-chrome-process-authority.plan.md
- [x] 8caa9bd21 fix(std): bound timer-backed scheduling durations
- [x] 423f37fd8 tidy(std): house delay behavior under Time.Delay
- [x] 255e92c97 refactor(std): organize Time module boundaries
- [x] d3e926627 fix(process): terminate owned child handles without ambient run authority
- [x] a37eb9229 fix(process): preserve bounded capture cleanup failures
- [x] 491392dd1 refactor(driver-vite): model external fixture work as runs
- [x] 07c8a764b refactor(testing): confine Chrome lifecycle to finite process authority
- [x] e127b46cf refactor(driver-pi): adopt finite Chrome proof authority
- [x] 73d944372 refactor(process): name capture durations by lifecycle role

## Purpose

Remove the ambient subprocess authority that the canonical Testing Chrome lifecycle required.
Preserve one shared browser mechanism while making its executable authority finite, its owned-child
termination capability-based, and its consumer proof honest at the process boundary.

The real correction chain is wider than the original three-item sketch but remains causally narrow:
Std owns the timer domain used by bounded cleanup, Process owns child capability and capture truth,
Driver Vite is the first substantial consumer of the richer capture result, Testing owns Chrome, and
Driver Pi owns only the frozen consumer proof. The opening arc records those semantic landing
boundaries rather than compressing implemented work into one oversized Process commit.

This is ordinary cross-package maintenance, not release-provider work or a human gate. It was
exposed by the frozen Driver Pi browser proof and is a pre-GATE dependency of
[`start-ui-release-evidence.plan.md`](../@sys.driver-pi/start-ui-release-evidence.plan.md), but its
semantic subject is finite process and browser mechanics rather than package-UI publication.

Planning, review, and readiness do not authorize implementation, Git mutation, dependency
installation, browser replacement, or publication.

## Finished reality

- The complete nine-commit arc is landed and reachable through `73d944372`.
- Std owns the bounded timer domain used by Process lifecycle deadlines. Process terminates through
  owned child handles, observes one shared status operation, settles streams and cleanup within
  aggregate bounds, preserves causal failure truth, and releases terminal capabilities.
- Driver Vite models command and in-process fixture work as distinct runs while preserving bounded
  Process diagnostics.
- Testing owns Chrome admission, launch, isolated profiles, CDP, diagnostics, termination, and
  cleanup. Its real-browser proof separates no-run admission, Deno-only preparation, Chrome-only
  execution, and process-list-only postflight so no proof process receives both a generic launcher
  and Chrome authority.
- Driver Pi consumes Testing's frozen executable-admission seam and grants its frozen proof direct
  run authority only for the exact admitted Chrome pathname. It retains package policy and evidence
  comparison without duplicating browser or process mechanics.
- `73d944372 refactor(process): name capture durations by lifecycle role` completes the public
  contract as `executionTimeout` and `terminationGrace`, with no compatibility aliases or unrelated
  timeout renames.
- The demonstrated boundary is pathname-scoped direct-process authority plus bounded owned-process
  lifecycle truth. It does not attest Chrome binary identity, confine descendants or
  operating-system access, prevent executable replacement, or prove Windows or cross-version
  behavior. Runtime evidence is Deno 2.9.5 / V8 15.0 on Darwin 25.5 arm64; Linux CI structure is
  validated separately.

## Baseline ownership seam

Driver Pi already uses the canonical `Browser.ServiceWorker.scenario` entry from `@sys/testing`.
Driver Pi supplies package-specific pages, bytes, policy, and expected Service Worker transitions;
it does not own Chrome discovery, temporary profiles, launch arguments, CDP, process lifecycle, or
cleanup.

The baseline shared path was:

```text
@sys/driver-pi Browser.ServiceWorker.scenario
  → @sys/testing openChromeSession/startChrome
  → @sys/process Process.spawn
  → ambient Deno.kill(pid) during owned-child cleanup
```

Before this correction, a finite Chrome-only run probe could start the real browser and complete its
assertions, but cleanup could not settle under that grant because Process terminated by ambient PID
authority. The frozen Driver Pi proof therefore retained `run: true`; its candidate-preservation
checks were real behavioral evidence, but unrestricted run remained a subprocess escape from the
parent Deno write boundary. The completed path now terminates through owned child capability and
limits the frozen proof's direct run authority to the admitted Chrome pathname.

Do not repair this by copying Chrome mechanics into Driver Pi, granting a shell to the proof child
or using one as an executable broker, denying a hand-picked list of launchers while generic
execution remains, weakening trace-leak checks, or hard-coding one developer machine as a
portability claim.

## Invariants

- Process termination uses authority carried by the owned child handle, not ambient authority over
  an arbitrary PID.
- TERM→KILL escalation, status settlement, stdout/stderr settlement, and cleanup failure remain
  bounded and observable.
- A permission or termination failure is never swallowed while a child or status operation remains
  live.
- Testing remains the sole owner of Chrome discovery, isolated profiles, fixed launch arguments, CDP
  lifecycle, diagnostics, and cleanup.
- The Testing proof process has direct authority for exactly the selected Chrome pathname, not Deno,
  Node, a shell, a package manager, or unrelated commands.
- Finite proof `CHROME_BIN` binding and ordinary convenience discovery remain distinct; fixed quoted
  task projection does not leave a generic runtime or shell broker callable by the proof child.
- Testing supplies Chrome only a finite environment and one explicit temporary-profile location;
  this does not claim Deno mediates Chrome's operating-system filesystem authority.
- Driver Pi retains only package policy, disposable fixture ownership, protected-path denial, and
  exact before/after candidate proof.
- No correction weakens browser sandbox arguments, fixed-origin guards, Service Worker evidence,
  frozen/cached import policy, or trace-leak enforcement.

## `fix(process): terminate owned child handles without ambient run authority`

### Target surface

Own the lifecycle correction at:

- `code/sys/process/src/m.process/u/u.child.owned.ts`;
- `code/sys/process/src/m.process/u/u.operation.ts`;
- `code/sys/process/src/m.process/u/u.stream.ts`;
- `code/sys/process/src/m.process/u/u.failure.ts`;
- `code/sys/process/src/m.process/u.proc/u.spawn.ts`;
- the owned-lifecycle portions of `code/sys/process/src/m.process/t.proc.ts`;
- focused unit, finite-authority, and exposed-GC retention proofs under
  `code/sys/process/src/m.process/`.

Use the narrowest owned-handle operation supplied by `Deno.ChildProcess`. The landed Std timer
foundation is input to this correction, not permission to broaden Time again. Keep shared kernels
package-private; do not preserve a global PID operation merely for convenience or create a public
process supervisor.

### Required behavior

- Request graceful termination through the owned child handle.
- Observe and await one previously obtained child status operation exactly once.
- Escalate to forceful termination only after the bounded graceful deadline.
- Settle or cancel owned stdout/stderr pumps in deterministic order within one aggregate budget.
- Preserve the primary operation failure when cleanup also fails; coalesce repeated observations of
  one underlying error while retaining causal phase labels.
- Complete the spawned handle's output observable after final stream settlement, including for late
  subscribers and cleanup rejection.
- Treat deadline-forced stream cancellation as incomplete output even when cancellation lets the
  stream pump fulfill.
- After child acquisition, expose setup and rollback failure through a terminalizing handle; reserve
  synchronous throwing for failures before a child capability exists.
- Return cleanup truth to the caller; logging is never a substitute for rejection.
- Keep repeated disposal idempotent through the existing lifecycle owner.
- Release child, status, stream, reader, pump, handler, waiter, and subscription references after
  terminal observable completion.

### Proof

Run a real child under a finite command grant and prove:

- owned termination succeeds while arbitrary ambient run authority is unavailable;
- unrelated commands, `Process.isRunning`, and ambient `Deno.kill` remain denied;
- graceful exit and forced escalation both settle status and streams;
- early child exit, signal failure, status failure, stream failure, readiness failure, setup
  failure, and timeout remain bounded and observable;
- post-acquisition stream setup failure returns a handle whose readiness and repeated disposal
  expose ordered rollback truth;
- the canonical timer maximum is accepted and maximum-plus-one is rejected before child acquisition;
- no process, status operation, stream reader, timer, output subscriber, or lifecycle subscription
  leaks;
- a retained terminal handle does not retain owned capabilities after fulfilled or rejected cleanup;
- an unowned PID cannot be targeted by mutating the public handle's informational `pid` field.

## `fix(process): preserve bounded capture cleanup failures`

### Target surface

Keep the capture contract separate at:

- `code/sys/process/src/m.process/u.proc/u.capture.ts`;
- the capture-only portions of `code/sys/process/src/m.process/t.proc.ts`;
- `code/sys/process/src/m.process/u.proc/-test/-u.capture.test.ts`;
- the package-private owned-status, deadline, stream-settlement, and failure-ledger kernels already
  introduced by the lifecycle correction.

Do not duplicate lifecycle machinery, expose the package-private dependency seam, normalize raw
thrown identity through `Try.run`, or collapse post-spawn failure into `failed-to-start`.

### Required behavior

- Preserve `Process.capture` as a result adapter with a distinct `CaptureFailedOutput` variant for
  post-spawn execution or cleanup failure.
- Preserve bounded partial stdout/stderr, truncation flags, terminal status when known, signal
  actions, force-timeout truth, and the initiating timeout/cancellation/failure reason.
- Preserve causal occurrence order across signal, status, stream, settlement, cancellation, and
  release failures while coalescing repeated observations of one error identity into phase labels.
- Keep raw thrown or rejected identity available through the returned failure record and aggregate
  `cause`.
- Share one cleanup deadline across termination and stream settlement.
- Retry stream settlement after reader-lock release when release is required to unblock the pump.
- Reject unsupported public timeout values before child acquisition.

### Proof

- status, signal, read, cancel, settle, and release failures remain bounded and attributable;
- real-time failure order is retained across concurrent termination and stream events;
- clean status plus deadline-forced stream cancellation remains failure with partial output;
- post-spawn stream setup failure terminates the acquired child and returns ordered rollback truth;
- release-unblocking allows the pending stream operation to settle without erasing release failure;
- failed start remains distinct from post-spawn failure;
- repeated observations of one raw error coalesce without changing its identity;
- no child, status operation, stream reader, timer, or abort listener is stranded.

## `refactor(driver-vite): model external fixture work as runs`

### Target surface

Propagate the richer Process capture result only through Driver Vite's shared external-fixture seam:

- `code/sys.driver/driver-vite/src/m.vite/-test.external/u.fixture.run.ts`;
- attributable build, probe, template, workspace, and published-runtime fixture callers;
- `code/sys.driver/driver-vite/src/m.vite/-test/-u.fixture.run.test.ts`.

### Required behavior

- Model a completed fixture run as either an external command or a named in-process operation.
- Preserve cwd, invocation identity, exit/status truth, bounded stdout/stderr, truncation markers,
  timeout/cancellation state, failed-start detail, and post-spawn capture failure detail.
- Keep Process as the subprocess owner; do not add another timeout, signal, or stream lifecycle.
- Preserve existing fixture behavior and diagnostic wording except where the richer result requires
  truthful new failure status.

### Proof

- deterministic unit cases cover command failure, timeout, truncation, failed start, post-spawn
  failure, in-process operation failure, and build-command context;
- Driver Vite check, default tests, and entry-process tests remain green;
- the broader external lane remains separate integration/release evidence and cannot be represented
  as green without a successful current run.

## `refactor(testing): confine Chrome lifecycle to finite process authority`

### Target surface

Reconcile the Process correction through the canonical browser implementation at:

- `code/sys/testing/src/m.server/m.Browser/u.chrome.executable.ts`;
- `code/sys/testing/src/m.server/m.Browser/u.chrome.find.ts`;
- `code/sys/testing/src/m.server/m.Browser/u.chrome.launch.ts`;
- `code/sys/testing/src/m.server/m.Browser/u.chrome.session.ts`;
- `code/sys/testing/src/m.server/m.Browser/u.service-worker.ts`;
- `code/sys/testing/src/m.server/m.Browser/-test/`;
- `code/sys/testing/scripts/task.browser.*.ts` and `code/sys/testing/deno.json`;
- attributable Testing documentation and workspace Linux CI binding/structural proof.

Do not add a parallel Chrome launcher or expose raw CDP/process authority to consumers. Preserve
`Browser.ServiceWorker.scenario` as the consumer entry.

### Executable selection

Keep ordinary API discovery convenient without assigning it confinement meaning. The finite proof
requires trusted human/CI orchestration to supply one concrete path through `CHROME_BIN` before the
proof process starts. A no-run preflight rejects missing, relative, non-normalized, nonexistent,
non-regular, non-executable, symlinked, child-writable, comma-delimited, NUL, CR, or LF input. The
canonical task records one exclusive invocation binding, projects the admitted value into exactly
one attached `--allow-run` value and one independently quoted script argument after Deno's `--`
delimiter, then removes `CHROME_BIN` from the proof child's environment. Every later phase verifies
the retained binding, and prepared artifacts name its identity. The child rejects unknown arguments
and verifies inclusion; exclusivity belongs to the pinned task and permission profile because Deno
cannot enumerate run grants.

Deno's grant binds a mutable pathname rather than an immutable binary. Trust external filesystem
stability and the selected Chrome binary after admission; do not claim inode pinning, hard-link
exclusion, or elimination of an external replacement race. State unsupported platform behavior
honestly and do not infer support floors before the release owner selects them.

### Authority-separated task

Keep one canonical `test:browser` task while separating:

1. internal lifecycle and executable-admission units with no run authority;
2. fresh Deno-only browser-bundle preparation with one-use integrity evidence;
3. a Chrome-only real integration process consuming the prepared bytes;
4. a trusted postflight observer limited to host process listing, which removes only an empty owned
   root and preserves failure residue; subsequent preflight refuses to overwrite nonempty evidence.

No test process receives both Deno and Chrome execution authority. Narrow proof-child writes to one
owned temporary root outside the executable path. Launch Chrome with inherited environment cleared
and only a finite, non-secret Process-owned default. Trusted task/CI orchestration and postflight
observation are outside the confinement claim and must never launch Chrome itself.

### Proof

With only the selected Chrome pathname granted directly to the proof Deno process:

- start both supported headless launch modes as applicable;
- create and remove each isolated profile under the explicitly owned temporary root;
- connect, exercise, and close CDP;
- complete the fixed-origin Service Worker scenario;
- preserve operation and cleanup failures together;
- prove direct attempts to launch Deno, shells, Node, package managers, and unrelated executables
  throw `NotCapable`;
- prove `CHROME_BIN` is unavailable to proof code and ambient environment does not reach Chrome;
- prove preparation is fresh, integrity-bound, one-use, and unavailable to the Chrome-only process;
- leave no attributable browser profile, bundle, status operation, CDP waiter, stream, timer, or
  server leak.

Scope the confinement claim to direct commands issued by the Deno proof process. Proof code and
Chrome are trusted: Deno constrains the executable pathname, not Chrome arguments, and does not
mediate Chrome's process tree, filesystem, or network behavior. Browser sandboxing and fixed-origin
policy remain separate evidence. A real-browser process proof is required; dependency-injected spawn
tests alone cannot establish the permission boundary.

## `refactor(driver-pi): adopt finite Chrome proof authority`

### Target surface

Promote only the existing Testing executable-admission policy as a read-only Browser API, then keep
the consumer change within the frozen Driver Pi proof and attributable configuration:

- `code/sys/testing/src/m.server/m.Browser/mod.ts`;
- `code/sys/testing/src/m.server/m.Browser/t.ts`;
- `code/sys/testing/src/m.server/m.Browser/t.internal.ts`;
- `code/sys/testing/src/m.server/m.Browser/-test/-u.chrome.executable.test.ts`;
- `code/sys/testing/src/-test/-namespace.freeze.test.ts`;
- `code/sys/testing/README.md`;
- `code/sys.driver/driver-pi/deno.json`;
- `code/sys.driver/driver-pi/-scripts/-test.browser.admit.ts`;
- `code/sys.driver/driver-pi/-scripts/-test.browser.ts`;
- `code/sys.driver/driver-pi/-scripts/-test/-task.start.gui.release.local.test.ts`.

### Shared admission seam

Expose `Browser.Executable.admit(input, { writableRoots })` as a narrow wrapper over Testing's
existing canonical executable validator. Require the caller to state the complete proof-child
writable-root list explicitly; an empty list is valid only when that child has no write authority.
The method returns the admitted absolute pathname and exposes no launcher, process handle,
permission broker, Chrome arguments, CDP client, or profile authority. Keep comma/control rejection,
normalized absolute-path enforcement, `lstat` regular/non-symlink checks, realpath equality,
executable mode, child-writable-root exclusion, and the external replacement non-claim in Testing.
Do not add a generic `Fs.isExecutable` predicate or reproduce this policy in Driver Pi.

Use one Driver Pi admission process before Deno constructs the Chrome grant. It receives no
run/write/net authority; its only environment grant is `CHROME_BIN`, while dynamic read authority is
used solely to inspect the selected path and package `.tmp` root through `Browser.Executable.admit`.
The trusted task shell then projects the unchanged parent value into one attached
`--allow-run="$CHROME_BIN"` grant and one quoted `--chrome-executable="$CHROME_BIN"` argument after
`--`, while removing `CHROME_BIN` from the proof child. The admission child cannot mutate its
parent's environment; external replacement after admission remains outside the claim.

### Required behavior

- Replace only the frozen-browser profile's `run: true` with the exact attached Chrome grant; keep
  current-build browser testing separate and explicitly build-owning.
- Require exactly one executable argument in the frozen proof, admit it again through Testing, prove
  its run permission is granted, prove representative unrelated commands are denied, and pass the
  identical pathname into every `Browser.ServiceWorker.scenario` call.
- Prove `CHROME_BIN` is unavailable to the frozen proof child. Do not infer the executable path from
  environment, discovery, or permission state.
- Keep the frozen lane build-free, frozen, cached-only, noninteractive, and bound to the saved local
  evidence tuple.
- Preserve package `.tmp` confinement, finite environment reads, protected-write denial,
  wildcard-bind denial, and `127.0.0.1:8080` denial.
- Preserve the exact candidate manifest/tree/asset comparison before and after browser execution.
- Continue using `Browser.ServiceWorker.scenario`; no Driver Pi browser launcher or process helper
  is admissible.

### Closing proof

Run the frozen task through its canonical Deno task and prove executable permission states for the
selected Chrome path and representative denied commands. Then prove the complete browser scenario,
Service Worker migration, candidate identity, protected paths, wildcard-bind and fixed-port denial,
cleanup, and trace-leak settlement in one real process. Re-run Testing's focused Browser admission
contract, check, and publish dry-run because this item promotes that existing policy as a public
consumer seam.

## `refactor(process): name capture durations by lifecycle role`

### Review decision

The original public options are mechanically clear about units but weak about lifecycle role:

```ts
timeoutMs?: t.Msecs;
killGraceMs?: t.Msecs;
```

`killGraceMs` is especially misleading because grace precedes SIGKILL rather than describing the
kill itself. A unit-only repair such as `terminationGraceMs` would retain the redundant suffix;
`graceTimeout` would remain ambiguous about which operation owns the grace; and a nested termination
policy object is not earned by one option. The coherent final surface is:

```ts
executionTimeout?: t.Msecs;
terminationGrace?: t.Msecs;
```

Removing the suffix gives up an inline unit cue, and `t.Msecs` is an alias rather than a branded
runtime value. That cost is acceptable here because the TypeScript contract and field documentation
state milliseconds explicitly, JavaScript timeout APIs already conventionally use milliseconds, and
lifecycle-role ambiguity is the more consequential misuse risk. Preserve the existing field
mutability; this item changes names only.

This is a public breaking rename. Reachable history shows both options originated with the bounded
capture API, and the repository has a finite set of attributable consumers, but external consumer
usage is unknowable. Because `@sys/process` remains pre-1 and this arc explicitly chooses the clean
contract, update every repository consumer atomically and do not retain dual-name precedence or
compatibility aliases. Do not represent this as backward compatible.

### Target surface

Rename only the `Process.capture` duration policy across:

- `code/sys/process/src/m.process/t.proc.ts`;
- `code/sys/process/src/m.process/u.proc/u.capture.ts`;
- `code/sys/process/src/m.process/u.proc/-test/-u.capture.test.ts`;
- `code/sys.driver/driver-vite/src/m.vite/-test.external/u.fixture.run.ts`;
- `code/sys.driver/driver-vite/src/m.vite/-test/-u.fixture.run.test.ts`;
- `code/sys/testing/scripts/task.browser.prepare.ts`;
- `code/sys/testing/scripts/task.browser.postflight.ts`;
- `code/sys.driver/driver-pi/-scripts/m.start.gui.preview.build/u.deno.ts`;
- `code/sys.driver/driver-pi/-scripts/m.start.gui.preview.build/-test/-.test.ts`;
- `code/sys.driver/driver-pi/src/m.core/m.cli.profiles/-test.external/-u.start.gui.exit.process-proof.ts`;
- any later repository call site demonstrably passing either replaced option into
  `t.Process.CaptureArgs`;
- plan and documentation text that names either replaced option.

Do not rename unrelated persisted configuration such as Driver Pi OCR `timeoutMs`, generic local
watchdog variables, byte caps, internal dependency-seam timeouts, or APIs outside
`t.Process.CaptureArgs`.

### Required behavior

- Rename `timeoutMs` to `executionTimeout` and `killGraceMs` to `terminationGrace`.
- Rename implementation constants, validated fields, parameters, diagnostics, and focused test
  labels to the same lifecycle vocabulary.
- Preserve defaults, accepted range `0..Time.Delay.MAX`, validation-before-spawn ordering,
  execution-timeout timing, TERM→KILL timing, aggregate cleanup budgeting, and all output variants.
- Keep `maxStdoutBytes` and `maxStderrBytes`: those plain numeric fields require explicit byte
  units.
- Reject the removed names at the TypeScript contract boundary; do not support old and new keys
  concurrently or invent precedence.
- Keep this refactor out of every earlier semantic commit. It is the final residue pass after all
  Process.capture consumers in this arc have stabilized.

### Proof

- Add compile-time contract proof for the new keys and rejection of both removed keys.
- Prove `Time.Delay.MAX` remains accepted and maximum-plus-one remains rejected before spawn for
  both new options.
- Re-run Process check, complete tests, finite-authority and retention process proofs, and publish
  dry-run.
- Re-run checks and complete attributable test lanes for every changed consumer package, including
  Testing, Driver Vite, and Driver Pi.
- Search the repository for `killGraceMs` and for `timeoutMs` specifically in `Process.capture`
  inputs; only explicitly excluded non-capture configuration may remain.
- Run formatting, targeted lint, `git diff --check`, and a final public-contract residue review.

## Validation and landing

All nine opening-arc items landed as separate semantic commits, and every recorded hash is reachable
with its exact subject.

Final validation evidence:

- Process check and publish dry-run passed; complete tests passed 19 tests / 127 steps;
  finite-authority proof passed 1 test / 3 steps; exposed-GC retention proof passed 1 test / 2
  steps.
- Driver Vite check passed; default tests passed 64 tests / 399 steps; entry-process proof passed 2
  tests / 9 steps. The broader external lane remains separate non-green evidence with no
  demonstrated causal edge to this arc.
- Testing check and publish dry-run passed; default tests passed 29 tests / 266 steps; no-run
  browser units passed 2 tests / 25 steps; the Chrome-only integration process passed 3 tests / 15
  steps. Both supported real headless modes, direct launcher denial, fresh one-use bundle behavior,
  Service Worker scenarios, forced cleanup, empty-root postflight, and process-marker absence passed
  on the recorded Darwin/Deno boundary.
- Driver Pi check and publish dry-run passed; unit tests passed 65 tests / 514 steps;
  current-browser proof passed 1 test / 3 steps; frozen-browser proof passed 1 test / 5 steps. The
  frozen proof re-admitted one explicit executable argument, denied representative unrelated
  commands, preserved candidate identity, and left no attributable Chrome process or profile
  residue.
- The final duration rename passed all affected package checks and test lanes, workspace check
  across 53 packages, targeted lint, formatting, publish dry-runs, `git diff --check`, and
  repository residue searches. Removed public keys remain only in compile-time rejection proof and
  migration history; unrelated OCR, watchdog, and internal timeout fields remain unchanged.
- A blind independent review of the final ten-file rename approved it unchanged with no material
  findings and found no information gain in another item-level pass.

This plan is complete: no opening-arc item, prerequisite, or gate remains unresolved. Reconcile its
completed prerequisite reference in `start-ui-release-evidence.plan.md` separately. The final plan
snapshot should land alone before this live plan is retired.

## Non-goals

- package-UI runtime extraction;
- release provider or public HTTPS selection;
- browser/filesystem support-floor decisions;
- Driver Pi product-entry redesign;
- a generic process supervisor;
- a second browser backend;
- wider Time behavior or API redesign after the landed timer foundation;
- unrelated Driver Vite external-lane remediation;
- renaming persisted or non-capture `timeoutMs` configuration merely for visual consistency;
- bypassing Chrome sandbox, provenance, signing, permissions, or trace-leak checks.
