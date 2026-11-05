@sys.driver-vite
linux-wsl-probe.plan.md
- [x] c383f979c fix(driver-vite): isolate startup delivery lifetimes
- [x] bc13dd19e fix(workspace): keep CI source selection caller-owned
- [x] 40b0cb49c refactor(driver-vite): remove obsolete permission construction
- [x] 0b879c4c5 refactor(driver-vite): remove obsolete tooling residue
- [x] 17c693c9b fix(vite): align application launchers and restore full CI
- [x] 66cf4696a fix(cli): cancel idle keyboard bindings on disposal
- [x] e3b89d7d8 fix(cell): preserve terminal outcomes through shutdown
- [x] 57fa43581 feat(fs): add process-only Env.load search mode
- [x] 1700ff83f chore(driver-vite): move test lane orchestration into scripts

## Retirement preparation

Final-candidate acceptance is against `1700ff83f69e5ee4462ccce11505ba7f2c1966f5`.
The local verification and final documentation review are recorded in the Phase F receipt.
Build/Linux success is recorded for `e3b89d7d8`; no exact-candidate build/Linux result for
`1700ff83f` has been supplied or independently inspected. Record those results before the completion
snapshot. This is the existing final-candidate proof requirement, not another implementation item.

E.2/E.3 remain separately deferred findings, not completion prerequisites or claims of success.
Preserve their evidence and executable tests when archiving; do not resume them during closeout.

After final-candidate evidence is recorded, preserve this plan and its three companion receipts in
`plan(done): linux-wsl-probe.plan.md`. Only after that snapshot is committed and recoverable may the
plan and companion directory be removed in `plan(archived): linux-wsl-probe.plan.md`.
Neither commit nor removal is authorized by this preparation request. Preserve all four Markdown
files together before removing their live copies.

## Trusted Vite execution

This plan governs the bounded repair of GitHub CI with current dependencies and trusted Vite
execution, without a configuration-discovery redesign. The contracts below preserve the delivered
scope and decisions; they are not instructions to repeat implementation during closeout.

**Design decision:** Vite configuration and plugins are trusted build code, with ordinary
Node-style process authority. The OS/CI environment, credential controls, and repository permissions
remain the outer security boundary. The selected policy uses unrestricted Deno execution for
Vite-related processes (`-A`); it does not promise a sandbox against malicious configuration or
plugins. This is a deliberate loss of Deno's additional restrictions, not a security-neutral change.
Deno's announced retirement affects the maintenance investment, not whether permissions have value.

This replaces the previous project requirement to preserve granular Deno permissions for Vite and
the proposed private configuration-discovery child. It permits considering the necessary Vite
launcher changes rather than requiring an already-running restricted caller to work transparently.
Keep dependency versions current. Do not propose rollback, consumer WSL exceptions, or another
startup framework as substitutes for this design.

**Authorization boundary:** this plan does not override any receiving client's governing
instructions, sandbox, or security controls. Establish authority before implementing its execution
policy; if prohibited, report the limitation without bypassing controls. Do not change agent
profiles or weaken Git/signing/authentication controls to proceed. Commits and pushes require
explicit human instructions.

## Decision rationale

The observed trigger was Vite **8.3.5** on Linux with Deno **2.9.8**: Vite's bundled optional WSL
probe at `/proc/sys/fs/binfmt_misc/WSLInterop` raised `NotCapable` under granular permissions. This
is version-specific incident evidence, not a claim about every future Vite or Deno release.

Maintaining granular compatibility around this trusted Node-oriented toolchain adds startup and
native-resolution complexity without establishing malicious-code confinement. Existing subprocess
and native-library grants already prevented that confinement; granular restrictions still caught
accidental access. The
[Deno team's October 2026 retirement announcement](https://deno.com/blog/cloudflare) further limits
the value of that maintenance investment. It does not make permission restrictions valueless or
remove them from existing binaries. Trusted execution is a deliberate tradeoff, with OS/CI isolation
and credential controls retained as the outer security boundary.

## Arc reconciliation

The original `fix(driver-vite): restore Linux build and dev startup` item covered more than the
first diagnostic. Its execution-policy, regression-test, documentation, and focused-CI scope maps
to `bc13dd19e`, whose actual subject is `fix(workspace): keep CI source selection caller-owned`.
The narrower commit subject does not describe its entire 17-file delta. Subsequent rows retain the
bounded helper cleanup, the human-requested module-wide simplification, and application/full-matrix
scope. No Linux acceptance is inferred from landing. The opening checkboxes record commits, not
completion of this repair.

Cleanup landing differs slightly from the planned hunk split: `40b0cb49c` contains both the original
71-line permission-helper deletion and F3's private synchronous argument-builder/caller changes
(one file, 2 insertions / 73 deletions). `0b879c4c5` contains F2 and F4, including the new reporting
regression (five files, 48 insertions / 39 deletions). Together they account for both planned cleanup
items; F3 originally belonged to `refactor(driver-vite): remove obsolete tooling residue` but landed
in the preceding commit. No additional cleanup commit or history rewrite is required.

Phase E's 38-path application/probe/Cell launcher and generated-matrix change maps to `17c693c9b`.
Its subject's "restore full CI" means restoring full workflow selection, not a claim that every job
passed. The later Linux-reported Cell assertions require the explicit Cell follow-up in this arc;
they do not reopen the landed commit or justify restarting the Vite execution-policy redesign.
The CI follow-up includes the readiness/interrupt correction and terminal status mapping. The later
animated OS-signal failure has its own follow-up; it is not an established cause of the reported Linux
failure. The bounded Phase E build/Linux result is recorded below; wider external/security findings
remain explicitly deferred, not another pending implementation commit.

The shared keyboard prerequisite landed as `66cf4696a` (13 paths), and the bounded Cell repair landed
as `e3b89d7d8` (18 paths). Read-only history inspection confirms both are reachable from current HEAD;
the Cell source worktree is clean and the evidence screenshot is not part of its commit. The human
supplied an independent **PASS FOR BOUNDED COMMIT** review covering all 18 candidate files, with no
blocking defects or material maintenance findings. This records supplied review provenance, not a
new review performed during reconciliation.

The supplied GitHub screenshots show `build #687` passed for `e3b89d7` and
[`test:linux #53`](https://github.com/sys-repo/sys/actions/runs/41943981746) completed successfully
on that same candidate: graph passed, all 57 matrix jobs completed, total duration 6m 39s. This closes
the bounded CI repair's build/Linux feedback requirement. It does not certify the separate external,
published-composition or browser-security scenarios that this workflow does not execute.

Following the green run, the human requested orchestration without another acceptance detour.
The Env capability landed separately in `57fa43581` (three FS files), followed by the seven-file
Vite consumer in `1700ff83f`. Inspected commit contents account for the original ten-path candidate;
no additional implementation commit is required. The intervening `5d789e432` capability-owner docs
commit is separate work, not an item in this arc.

The animated-signal work under E.2 and the external/security findings under E.3 remain explicit
separate follow-ups, not prerequisites for this plan's bounded completion. This supersedes the
former dependency on wider Phase E acceptance; it does not declare those follow-ups passed.

The CI API changed from the reviewed `checkPaths` list to an optional `filter` predicate over the
single caller-owned `sourcePaths`. Omission retains the default selection; zero matches removes
generated build/test workflows. Publishing still uses the complete source list. Retain this general
API and its publishing-isolation test; root generation must use the full selection.

## Evidence

- [Focused candidate and cleanup history](./linux-wsl-probe.plan/focused-candidate-history.md):
  phases A-D receipts, audit dispositions and evidence limits.
- [Phase E proof receipt](./linux-wsl-probe.plan/phase-e-proof.md): application/probe/Cell launcher
  inventory, restored matrices, local checks, baseline GitHub jobs and external failures.
- [Phase F proof receipt](./linux-wsl-probe.plan/phase-f-proof.md): lane orchestration, environment
  ownership, exact source boundary, local verification and platform limits.

Read each receipt's source baseline and limits before reusing its results. Focused green and local
macOS results do not certify full Linux acceptance. Published-composition and browser-integrity
failures require explicit dispositions, not classification as permission-launcher successes.
Recheck the opening arc, refs and worktree before acting; receipts are not a second live ledger.

## Why both execution layers matter

Ordinary no-path calls currently follow this route:

```text
Vite.build({ cwd }) / Vite.dev({ cwd })
  → Wrangle.pathsFromConfigfile(cwd)
  → Vite.Config.fromFile / native configuration loading
  → import('vite') in the parent
  → later construct and launch the Vite child
```

The parent can fail before a child exists. Independently launched Deno children have their own
permission policy; unrestricted execution in a parent does not change explicitly restricted child
arguments. Consequently:

| Candidate | Expected consequence for the confirmed blocker |
| --- | --- |
| Child only unrestricted | Does not repair the restricted parent's configuration import |
| Parent only unrestricted | Leaves the independently restricted Vite child exposed |
| Parent and Vite child unrestricted | Removes this permission blocker; actual CI still must pass |

Explicit paths can bypass parent configuration discovery. They are useful controls, not a substitute
for exercising ordinary build/dev. Nested proof fixtures can introduce additional launcher processes;
identify those independently rather than assuming two source edits cover every process.

A library cannot retroactively grant its caller permissions. Under the selected contract, external
Deno consumers own their trusted launcher policy. Public `Vite.Config.fromFile`, direct Vite imports,
and CLI `info` remain caller-owned/in-process; do not claim compatibility for arbitrary restricted
callers, or silently move these APIs into a subprocess. No per-consumer WSL knowledge is required.

## Scope boundaries

Keep public build/dev APIs unchanged. Do not reopen configuration-discovery design, repeat the
broad module audit, or introduce escalation retries, a startup framework or consumer WSL exceptions.
Do not make acceptance depend on an unreleased upstream fix. Additional public-contract/security
changes require explicit authorization and evidence.

Retain package/native/Vite selection and native configuration loading for consumer authority;
startup projection/maps for precedence/rebasing and delivery for invocation-owned rollback/cleanup;
OXC preflight for ABI/cache validation; transport resolution, subprocesses and caches for their
loading/identity/lifecycle roles; lazy command imports for non-Vite entry isolation; HTTP
filesystem/integrity guards; and service/dev disposal, cancellation and bounded diagnostics.
Restricted serving and unrelated presets remain live contracts, not obsolete permission residue.
Broader access must not conceal selection of a wrong checkout-local native tree.

Module-sync package-condition shim removal lacks condition-resolution parity proof. Lazy visualizer
error wrapping also has compatibility behavior not proven safe to remove. Neither is in scope.
Ignored dependencies, generated outputs and recovery archives are not cleanup targets.

## Delivery contracts and deferred follow-ups

The following sections retain implementation constraints and historical proof obligations.
Phase E's bounded build/Linux acceptance is recorded at `e3b89d7d8`; Phase F's local evidence is in
its receipt. Final-candidate CI evidence remains the closeout requirement identified above.

### E. Application launchers and full-CI acceptance

This phase covered Vite-evaluating application/probe launchers, removal of the root diagnostic
predicate and bounded full-candidate acceptance. Source landing alone did not establish acceptance.
Use the phase E receipt's inventory, including the five probe parents,
performance task and maintained Cell CLI dev-start route; module launchers do not change their callers.
Do not widen unrelated application tasks or custom Cell routes. The pure-JSR build's restricted
orchestration parent delegates evaluation to a trusted child and remains distinct from those probes.

Retain dependency/import resolution flags and assertions. Deno 2.9.8 rejects permission-only
`--allow-import` flags combined with `-A`; retain `--no-lock` and `--node-modules-dir=auto` where used.
The macOS audit predicted the affected Linux failure from traced code; it did not reproduce it.
The earlier external run's failures and unexecuted affected Linux probes are explicitly deferred
under E.3; they are not closeout work. Retain restricted-serve proof and keep immutable published-package
limitations separate from local-source results. Explicit-path controls do not replace ordinary
no-path coverage.

Root `deno task prep:ci` must generate the full build/Linux selection through the existing
`-scripts/main.ts --prep-ci` and `-scripts/task.prep.ci.ts` path. Do not restore the diagnostic filter
or hand-edit generated YAML. Retain the optional package `filter` API and its publishing-isolation
tests, complete publishing selection/triggers, graph prerequisite, dependency warming and proof lanes.
Keep workflow permissions, credential handling, dependency installation and branch controls intact.
Prefer narrow CI prep over full workspace prep and inspect generated output for unrelated churn.
Do not invent Windows coverage; inspect its generation/trigger outcome separately.

The landed Cell helper includes hangup/resize forwarding, fixed shutdown grace, one-shot owned-group
termination, invocation-owned proof fallback, and PTY input restoration. Its initial forced-PTY
EPERM failure was a redundant second group kill after a successful deadline kill; that specific
regression received red → green proof. It does not explain or close the later graceful-signal EPERM
failure. The receipt separates these observations and supersedes the initial keyboard-exit-0 claim.

#### E.0. Shared keyboard cancellation prerequisite

`fix(cli): cancel idle keyboard bindings on disposal` landed as `66cf4696a`, a separate bug-fix
commit in `@sys/cli` preceding the Cell follow-up. The human authorized this boundary after real Cell
PTYs stalled inside `Cli.Keyboard.shutdown()`: the default Cliffy iterator awaits a stdin read that
its `dispose()` does not cancel. This is not a Cell-specific workaround or a dependency upgrade.
The following records the landed owner's compatibility and proof contracts, not a new review or
implementation campaign.

Keep the repair at the existing keyboard-input owner and preserve its public API. Disposal must
stop owned input work without another keystroke; `finished` must remain truthful about listener and
callback completion. Preserve quit/redraw grammar, error containment, terminal restoration and
sequential input reuse. Do not close process-owned stdin, detach an unobserved read, fabricate early
settlement, change Cell shutdown policy or patch installed dependencies. Native runtime facilities
may implement the owner, but do not build a generic input framework or silently replace key-decoding
semantics. If a required capability cannot be proved under these constraints, stop and report it.

Prove this independently of Cell: a real idle PTY cancellation regression, terminal/input reuse,
callback settlement and failure behavior, plus the existing denied-authority entry proof and
keyboard unit suite. Then run the Cell ordinary-outcome PTYs as an immediate consumer capstone.
Use owner tasks, exact-file formatting and an S-tier residue review. The shared-owner commit must
contain only its source, tests, necessary owning-module task/documentation changes and the approved
decoder dependency projection; retain the Cell work separately. Any newly necessary dependency-authority
change must be made explicit before implementation, not hidden in this repair.

Approved compatibility boundary: retain raw Cliffy `keypress()` unchanged and guarantee sequential
raw/bind handoff, not simultaneous mixed readers. Managed bindings retain one shared, competing
input session; disposing it no longer disposes a separately acquired raw Cliffy owner. Do not add
broadcasting or prohibit a second managed binding. The human explicitly authorized direct
`@cliffy/keycode@1.3.1` in `deps.yaml`, projected with `prep:deps`; this is decoder reuse, not an
upgrade. Lower input completion must account for queued native read-stop work before successful
`finished`, including immediate same-turn disposal. Keep the unrelated `throw undefined` shutdown
edge outside this repair. Privileged PTY proofs must stay outside ordinary unit-test discovery.

Keep input-error delivery separate from release-attempt completion. A public shutdown retry must
join current release work and admitted error callbacks even after the original lifecycle promise
rejected; preserve that original failure separately. Prove both callback/release orderings and
public awaitable recovery, not just a private disposed flag. Stop-only PTY children must end after
shutdown without later input or reacquisition; retain handoff and terminal-state proofs separately.
Documentation must distinguish per-binding callback completion from shared input shutdown.

The Cell candidate was revalidated against this landed prerequisite before its independent review
and landing. This does not discharge the parked animated-signal proofs or wider Phase E acceptance.
Neither landing authorizes further staging, commits or pushes.

#### E.1. Cell CI follow-up: terminal outcomes and awaited shutdown

`fix(cell): preserve terminal outcomes through shutdown` is the bounded CI repair. The human
explicitly requested separating the additional animated-signal investigation from this delivery,
without losing its evidence or tests. This supersedes the earlier requirement to resolve every
expanded terminal case in this one commit. It does not declare the deferred cases passed.

**Delivery status:** landed as `e3b89d7d8` after the supplied independent bounded review. The steps
below retain the delivery contract and verification requirements; they do not describe an uncommitted
candidate. The supplied screenshots establish build and full Linux workflow success on `e3b89d7`;
separate external/security findings remain deferred under E.3.

The human supplied two Linux failures: cleanup returned 1 instead of 130; a later keyboard PTY
returned 130 against an incorrect expected 0. The later screenshot identifies a rerun of `17c693c`;
its log shows the fixture assertion failing, then the fixture exiting 1. It contains no EPERM.
The correction is an exact keyboard expectation of 130, not acceptance of both 0 and 130. The first
failure's exact run identity remains unverified; do not retroactively assign it the screenshot's SHA.

Retain the existing corrections: publish admitted interrupt status to both Deno and Node after
cleanup; observe service rejection before readiness-publication I/O without moving terminal
arbitration; publish ordinary executable-boundary status to both runtimes. Ordinary library errors
remain returned results, not new process-exit side effects. The receipt preserves the prior bounded
review and its limits. Do not reopen the landed shared keyboard owner or Vite execution-policy work.

Required contracts and retained CI coverage:

- Success 0; ordinary startup/cleanup failure 1; admitted interruption 130; forced termination 137.
  No status unions, wrapper normalization or early exit to hide cleanup.
- Preserve first-terminal-reason arbitration, original rejection identity, visible cleanup failures,
  and awaited service, presentation, signal-listener and session disposal.
- Keep all pre-existing process proofs: raw SIGINT/SIGTERM/SIGHUP, duplicate coalescing, bounded
  termination, surviving-descendant cleanup and unrelated-listener preservation.
- Keep keyboard PTYs both animated and CI-style, forced shutdown, and all nine ordinary animated
  outcomes. Require resource/session cleanup and exact terminal restoration before fallback.
- Keep canonical terminal predicates and child-local CI overrides. Shared test `stty` measurement
  remains independent of production restoration; native mixed-stdio use stays locally justified.
- Do not suppress EPERM, widen permissions, retry stale groups, kill preexisting listeners, add
  production sleeps, increase timeouts, patch dependencies or weaken import guards.

Delivery:

1. Preserve the two additional animated OS-signal cases under the explicit
   `test:cli:vite:signals` task, outside the CI `test:proofs` aggregate. Share their existing PTY
   assertions with the retained cases; no skipped tests, relaxed assertions or new diagnostic harness.
   This is an explicit coverage deferral under E.2, not proof that animated signals work.
2. Run the lifecycle and task-projection tests, keyboard/ordinary terminal proofs, complete bounded
   `test:proofs`, `check`, and full leak-traced `test` with the established terminal environment.
   Use sequential process proofs, exact-file formatting and scoped whitespace checks.
3. Inspect the attributable delta and preserve review provenance accurately. The scope separation
   changed test routing, not production signal handling, and did not itself constitute a review.
   The subsequent human-supplied independent review passed the complete 18-file candidate.
4. Hand off the exact Cell source/test paths. Stage/commit/push only on explicit named instruction.
   Obtain fresh Linux evidence for the corrected committed candidate, not another rerun of
   `17c693c`. Local macOS passes do not establish GitHub CI success.

The bounded repair is landed and its build/Linux workflows passed. The additional signal
investigation and external/security findings remain explicit separate follow-ups under E.2/E.3,
not prerequisites to Phase F. That CI result does not certify the later Phase F candidate or passing
external/security proofs.

#### E.2. Parked animated OS-signal shutdown follow-up

**Deferred, outside the opening commit arc.** This work does not gate the bounded Cell delivery,
its Linux feedback, or Phase F orchestration. It is not authorized to resume by this reconciliation.

`fix(cell): preserve animated signal shutdown` owns the additional `sigint` and `sigterm` PTYs.
Their executable entry is `code/sys/cell/src/m.cli/-test/-task.cli.vite.signals.process.ts`, run from
`code/sys/cell` with `deno task test:cli:vite:signals`. Both retain exact exit 130, resize, terminal,
session and port checks before fallback. No test failure or error is converted into success.

The last executed macOS run, against the landed keyboard prerequisite plus the Cell worktree,
passed keyboard, keyboard-CI and forced cases but failed both animated signal cases with `kill EPERM`
at the launcher's post-exit group cleanup. Its cause is not established and is not attributed to the
reported Linux keyboard assertion failure. The source-backed signal-exit redelivery hypothesis is
not runtime proof. Preserve the receipt rather than rerunning a denied operation or widening grants.

Resume only as an explicitly selected follow-up. Attribute signal delivery, terminal winner and
process-group lifetime before changing the smallest demonstrated owner. Preserve all status and
cleanup contracts above. Use a narrow regression and the retained real PTYs; a permission/security
denial is a stop, never authorization to bypass a control. Review any new production signal/cleanup
behavior specifically for premature exit, lost failures and fallback-masked cleanup. Rejoin these
cases to `test:proofs` when the correction is verified. Preserve the unresolved finding and its
explicit disposition in wider acceptance; do not silently insert this work ahead of Phase F.

#### E.3. Deferred external and security acceptance

Preserve the Phase E receipt's unresolved published/generated composition, published-baseline dev,
browser modulepreload integrity and browser-process findings, together with the outstanding Linux
external-probe evidence and WSL/published-parity limits. Their disposition for this plan's closeout is
**separate follow-up**, not a requirement to repair or rerun them before retirement.

Keep their assertions, executable task membership and failure evidence unchanged. This is a scope
disposition, not successful verification or security clearance. Resume these investigations only
when separately requested; do not silently fold them into Phase F or its acceptance criteria.
New failures attributable to the orchestration change remain in scope for that change.

### F. Move test lane orchestration into scripts

This phase moved lane membership and sequential execution from shell strings into the module-local
dispatcher. Its prerequisite was the bounded repair with green build/Linux feedback at `e3b89d7d8`.
Wider Phase E acceptance and E.2/E.3 were not prerequisites. The settled Vite execution policy was
preserved; no startup or permission redesign was introduced.

The former shell strings duplicated lane membership: `test:unit` manually excluded files selected
by named proof tasks, while `test:cache` repeated non-discovered entries. The dispatcher derives
these selections from one table; `deno.json` retains the task entrypoints.

Use the existing local-script/process pattern demonstrated by
`code/sys.driver/driver-pi/-scripts/task.test.release.runtime.ts` and `-scripts/u.test.release.ts`:
explicit argv, `Process.inherit` from `@sys/process/process`, inherited terminal output/environment,
and propagated child status. Root `-scripts/task.test.ts` demonstrates the script entry convention,
but its workspace scheduler is not needed here. Do not restore the archived experimental Vite
`task.test.ts` or copy its discovery/native-resolution machinery. Use existing `@sys` adapters for
process, path and environment access; keep unavoidable runtime-specific task entry plumbing thin
rather than proliferating direct runtime calls through the lane model.

The consumer requires process-only environment lookup: dotenv values must not override inherited
terminal settings. Keep that capability in the existing `@sys/fs/env` owner via the additive
`Env.load({ search: 'none' })` option, retaining existing defaults and proving absent/empty/live
process values. The human landed this owner extension separately before its consumer, superseding
the original combined-commit instruction. Neither commit added `node:process`, permissions or a new
runtime abstraction.

Retained implementation contract:

- Add one module-local `code/sys.driver/driver-vite/-scripts/task.test.ts`, with a plain typed lane
  table and small command dispatcher. Keep paths readable as ordinary arrays, not encoded strings.
  No generic runner framework, discovery engine, scheduler, new test-directory layout, or config DSL.
- Preserve existing public task names and keep `test:run` as the direct arbitrary-test execution
  surface. Short aliases may share one script-launch task. The script must not recurse through its
  own aliases; reuse the existing raw runner where appropriate rather than duplicating its policy.
- Define each lane's file selection once. Keep the proof aggregate's ordered lane selection explicit;
  derive its unit exclusions and extra cache entrypoints from that selection, not from every optional
  lane. Preserve default unit discovery, including `-scripts` tests. Keep external, browser/integrity,
  and dist-pipeline boundaries as they stand after phase E; do not add them to routine tests.
- Preserve one child invocation per proof lane, sequential fail-fast execution, exact failure status,
  module cwd, inherited stdio/color/environment, argument boundaries, and supported filter/path/`--`
  forwarding. Characterize existing forwarding before replacing shell chains; do not silently change
  the public CLI contract or add custom flag parsing beyond choosing the lane.
- Preserve cache warming as frozen, type-checked, no-run preparation without cached-only execution;
  runtime tests retain their current frozen/cache-only/no-prompt and leak-check policies. Account for
  the new launcher's own import graph so cold cache preparation can bootstrap it. No permission
  widening, new grants, dependency changes, or test-policy weakening belong to this chore.
- Adapt `src/-test/-test.lanes.test.ts` from parsing long task strings to checking actual lane/argv
  behavior. Retain independent coverage expectations and negative controls for missing/duplicate
  lanes, lost exclusions/cache entries, fail-fast order, and exit propagation; do not replace them
  with tautological comparisons of a table against itself. Keep README guidance about task choice,
  cache preparation, filtering and evidence boundaries; implementation mechanics belong beside code.

Proof: focused lane/runner tests first, including paths/filters and an injected non-zero child result;
then actual script-backed cache, unit, proof, and affected explicit task entrypoints. Verify launcher
bootstrap, inherited output, and interruption behavior with a bounded process proof. Keep restricted
serving intact. Check exact touched-file formatting and module types. Revalidate generated CI routing
and the final Linux candidate after this task-surface change; phase E's earlier results cannot certify
phase F. No whole-module architecture audit or permission work is reopened.

## Invariants that do not change

- Ordinary build/dev and explicit-path calls; native config loading and existing command/mode.
- Caller cwd and caller-relative paths, without `Deno.chdir`.
- Consumer dependency/import-map authority, lock selection, and correct native-package resolution.
- Frozen/cache-only execution and no-prompt behavior. Cached npm materialization is still possible;
  frozen/cache-only is not a filesystem-read-only guarantee.
- Cancellation, timeout/failure diagnostics, bounded process capture, awaited cleanup, and Pi output
  isolation. Use existing process/lifecycle primitives.
- Item-1 delivery ownership: no shared artifact deletion, lease registry, or refcount redesign.
- No dependency-byte patching, fabricated WSL environment, broad driver import scopes, or revival of
  archived discovery bridges. Do not downgrade Vite or pin an older runtime to make the test pass.

## Verification and completion

Use the existing module tasks and smallest affected tests first. Known task surfaces include
`test:run`, `test:unit`, `test:build`, `test:dev`, `test:config:process`, and `test:proofs`.
The proof task now uses the module-local dispatcher, preserving the ordered lanes and fail-fast
execution. The discarded experimental discovery/native-resolution machinery was not restored.

1. Validate command construction, delivery ownership, ordinary no-path build/dev, and explicit-path
   controls. Preserve existing configuration/error/cancellation coverage. Add only missing cases
   necessary to prove the changed contract, in existing suites rather than a new harness.
2. The Phase E candidate's full build/Linux workflows passed at `e3b89d7d8`, as recorded above.
   Revalidate `.github/workflows/test.linux.yaml` and `.github/workflows/build.yaml` after Phase F
   changes the task surface; earlier runs cannot certify that change. Record the new exact SHA,
   workflow/job URLs and outcomes. Affected Linux external probes remain a separate E.3 follow-up,
   not a prerequisite for the orchestration chore.
3. Preserve Pi preview and driver-deno generated-staging coverage. Record failures by cause,
   including unrelated failures and explicit dispositions for the external/security findings.
   Do not mask them by narrowing selection, weakening assertions or claiming published parity.
4. Finish with a whole-candidate residue check: no diagnostic filter, obsolete permission comments,
   dead helpers, failed bridges, incidental refactors or unexplained dependency/root authority.

Do not close this plan from local macOS results, a filtered run alone, or unexecuted predictions.
The only unrecorded in-scope acceptance evidence is the final candidate's build/Linux result.
WSL browser-opening, published-JSR end-to-end parity and E.2/E.3 remain separate evidence limits and
deferred findings, not additional closeout work.

## Preservation and recovery

- `-agent/-plan.buffer.md` is human-owned: do not read, edit, restore, or use it for notes.
- Preserve unrelated plans, edits, dependencies, lockfiles, generated artifacts, and ignored outputs.
  Workflow/launcher changes described above are the new bounded scope, not general cleanup authority.
- The previous recovery is already complete: 34 experimental source files were copied and reopened,
  then 24 tracked paths restored and ten experimental untracked originals removed with authorization.
  Do not repeat restoration. The old source baseline `f86c26fb0888e8ee54b93b57f84b76b3bf089d0d` was
  not evidence of working Linux startup and must not replace the landed delivery fix.
- Recovery artifacts live at `.tmp/driver-vite-linux-wsl-recovery/`; the inventory is
  `preserved-source/manifest.md` beneath it. They are historical evidence, not implementation authority.
  No independent whole-file equality/checksum verification was recorded for those local copies.
- Ignored `code/sys.driver/driver-vite/node_modules` has uncertain provenance. Do not delete it or use
  its existence to justify consumer-native authority. No blanket cleanup, reset, restore, or stash.
