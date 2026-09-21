bash-authority.plan.md
- [x] fe865e7a2 fix(driver-pi): distinguish Deno scoping from process confinement

## Closeout

The bounded reporting correction and required proof are complete. The opening item reconciles to
reachable history. The later README correction in `f4d9b8143`
(`docs(jsr): reduce package README reference sprawl`) resolves the documentation acceptance finding
as detailed below; that separately owned documentation work is not a new implementation item here.

No reporting, documentation, or required verification work remains in this plan. Incident diagnosis
and process-containment design remain explicitly excluded follow-ups, not unfinished acceptance.
The retained test results are historical implementation evidence, not fresh host execution or proof
of confinement. Preserve this completion snapshot in history before archiving the plan.

## Purpose and scope

Correct Pi-Driver's reporting of the protection it actually establishes. The one implementation item
covers existing operator-facing presentation, minimal safe launcher-input identity, related contract
documentation, and proof. It changes no execution authority.

The broader goal remains useful, composable shell execution with explicit safety boundaries.
Containment is retained below as design-only context, not a promised implementation, prerequisite,
or second completion obligation. Selecting its owner/backend and adding future work requires an
explicitly scoped instruction. This plan creates no new approval gate.

The public-web allowance already exists. Do not add an unconditional prompt-repair commit without
incident evidence. Reporting truth does not itself fix a model refusal or establish confinement.
Missing incident details and unresolved backend choices do not block this reporting correction.

Completion means the bounded reporting outcome and its required verification are delivered. It does
not mean the original refusal is reproduced, Bash is confined, credentials are isolated, or the
broader containment design is settled. Planning grants no implementation or Git-mutation authority.

## Invariants

- Distinguish human authorization, model instructions, callable tools, runtime permissions, and
  observed execution. None is evidence of all the others.
- Keep read/edit/write ownership, protected tools, Git mutation consent, signing, credential, trust,
  and denial-stop rules intact during this work. Planning grants no additional execution authority.
- Preserve shell composition for authorized tasks. A command-name blacklist or shell-text parser is
  not an adequate general filesystem-confinement mechanism.
- A claimed confined execution must preserve its boundary through descendants. Failure to establish
  that boundary must never fall back silently to unrestricted execution.
- Filesystem write confinement is not read confidentiality, network confinement, remote-mutation
  authorization, protection of an entire hostile host, or control of other host processes.
- Report unknown or unsupported protection honestly. Do not relabel existing Deno permission scoping
  as whole-process containment.
- Do not log secrets, environment values, full prompts, or project context bodies merely to improve
  diagnosis. Provenance summaries must identify exactly what they measure.
- Profile changes affect future launches. Do not claim a source edit, generated file, or YAML edit
  changed the currently running session.

## Reporting correction

### Protection claim

`PiSandboxFmt.title/header/table` and `PiSandboxReport.text` must distinguish these facts:

- Deno API permissions are scoped or allow-all according to the actual launch inputs.
- This launcher does not supply shell/process confinement.
- Any enclosing protection is unknown unless independently established; do not add detection or
  attestation machinery in this item.

An allow-all Deno launch is not proof that no enclosing sandbox exists. A scoped launch is not proof
that native subprocesses obey the listed read/write roots. Make the distinction visible in existing
preview/startup presentation and persisted reports, not only in a README caveat. Preserve readable
path/grant details, terminal-width behavior, and ANSI-independent meaning.

### Operator-facing shape

Keep the application identity `sys:pi`; report permission mode in an aligned row rather than an
identity suffix. The launch sheet uses this readable body, beneath the existing version/tool header:

```text
Deno permissions   scoped
Process sandbox    not provided by Pi-Driver
Outer sandbox      <unknown>
Report snapshot    launch settings
Report             1.fixture.sandbox.log.md

Deno path limits do not constrain Bash or its subprocesses.
```

- Render `<unknown>` in dim gray: not established, never absent, failed, or verified.
- Render the process-boundary caution and allow-all Deno mode in yellow; retain their full meaning
  without ANSI. Keep the launcher qualifier on the process value.
- Use `preview settings` and `launch settings` for the respective report snapshots; absent snapshot
  metadata remains `<unknown>`. Keep internal stage tokens and detailed evidence limits in reports.
- Standalone profile-menu headers retain the three safety rows and the consequence sentence, but
  invent no report or snapshot. Report-backed sheets keep grant/context detail in the linked report;
  detailed fallback sheets retain their existing path rows.
- Wrap status values without clipping qualifications. Stack labels and values when two columns no
  longer fit. Preserve complete hyperlink targets even when their visible labels are clipped.
- Pin readable specimens, gray unknown styling, scoped/allow-all facts, and preview/launch labels in
  formatter tests. Exercise narrow widths and actual menu/startup presentation without changing
  execution permissions.

The design separates identity, protection facts, and evidence stage. It replaces repeated caveats
with comparable rows plus one consequence, not with a new security claim or detection mechanism.

### Minimal launcher-input identity

Extend existing report/metadata contracts only as needed to identify the resolved launch inputs:
launcher package/version, safely representable upstream selection, selected profile, default/custom
prompt selection, and ordered instruction-contribution identities. Reuse facts from the existing
resolution; do not introduce a general tracer or raw argument/environment dump. Redact
credential-bearing or otherwise unsafe custom specifiers rather than echoing them.

Label the observation stage and freshness: a profile preview is not a launched session, and neither
is the provider's effective prompt. Preserve unknown package/tool/runtime facts instead of inferring
an implementation from a tool name, profile setting, source file, or model explanation.

`m.profiles/m.main.ts` must write a fresh report for final launch resolution rather than treating an
equal preview summary as fresh evidence. Equal read/write scopes do not prove equal profile, package,
prompt selection, or observation stage. Report only the snapshot actually represented; do not imply
content identity from equal contribution paths.

`resolveRun()` performs migration, context-bundle writes, preflight, and extension materialization.
Do not call it a read-only inspector or add an extra invocation just to populate diagnostics. Keep
normal launch resolution and report rendering separate. Do not create a new inspection command.

### Unchanged behavior

Preserve permission flags, grants, environment inheritance, tool execution, profile selection,
custom-prompt ownership, context assembly, and final provenance safety. The existing public-web
allowance remains unchanged. No profile/canon edits, credential isolation, backend integration,
provider-payload fingerprint, or automatic refusal classifier belong to this item.

Update documentation only where needed to describe the corrected reporting contract. Avoid unrelated
renames or a broad sandbox type/API migration.

## Reporting proof and completion

Write narrow red → green tests through the owning module's declared tasks. Each test must establish
its named contract, not merely the existence of a field or a word in a prompt.

- Render scoped and allow-all Deno modes with explicit unknown enclosure. Cover existing header,
  table, and persisted-report paths, including narrow terminals and ANSI-stripped output.
- Exercise default/custom prompt selection, ordered SYSTEM/AGENTS/context contributions, selected
  and unknown/custom package identity, and unresolved tool/runtime facts using synthetic inputs.
- Prove preview/launch freshness, including equal grants with different reported launch identities.
  Do not present cached preview evidence as newly observed session/provider state.
- Use secret sentinels in synthetic prompts, context bodies, environment, and custom specifiers.
  Ordinary reports must expose only the approved identity facts, never the sentinels or full inputs.
- Preserve existing prompt-policy and assembly assertions, including public-web authorization,
  custom-prompt semantics, final safety text, and unchanged execution permissions.
- Include one fixture-owned selected-host assembly check for the launcher-input contract. It must
  not claim provider-payload identity, model judgment, or production credential isolation. Keep
  fixture environment isolation explicit; do not copy its guarantees onto the production launcher.

Use existing formatter/report/profile tests and the narrowest suitable configured host-proof task.
If a new proof task is needed, declare its bounded permissions before execution. Broader package
verification follows narrow proof. No real provider replay, remote retrieval, containment escape
probe, or signing operation is required to complete this reporting item.

Completion requires the reporting behavior, documentation, and stated proof. It does not require
resolving the original incident or delivering any of the design-only work below.

### Verification evidence

The final implementation review exercised these tasks from `code/sys.driver/driver-pi`:

- `deno task test:reporting`: 4 tests, 55 steps, zero failures. The import-only collector
  `-scripts/-test.reporting.ts` selects formatter, persisted-report, profile-identity, and menu suites.
- `deno task test:reporting:host`: 1 test, 1 step, zero failures against the selected Pi CLI.
- `deno task check`: type checking and dependency agreement with
  `npm:@earendil-works/pi-coding-agent@0.85.1` passed.
- `deno task test`: all four chained lanes passed: unit (74 tests, 510 steps), reset-process
  (1 test, 1 step), profile-process (1 test, 8 steps), and real-preview (1 test, 4 steps).
- Explicit formatting checks passed across all 21 implementation files; package diff whitespace
  checks passed.

These results supersede the earlier failing formatter/report runs. At that implementation review,
inspection found no package diff between the reviewed commit and the then-live worktree. The later
README correction is recorded below. The results establish the named contracts, not package-wide
S-tier quality, confinement, network silence, or provider-prompt identity.

The real-host proof observes seven ordered assembly contributions at `session_start`, plus selected
profile and public-web policy presence. It submits no user prompt or generation request. Its
`clearEnv: true` and fixture-owned paths do not describe production environment inheritance; upstream
startup may refresh public model catalogs.

### Documentation acceptance — resolved

The implementation-commit README used `full authority` for the Pi child's Deno permission mode and
`safe upstream selection` for reportable identity. Final review correctly retained that wording as
an acceptance finding; the implementation checkbox and passing tests did not waive it.

The later `f4d9b8143` README change resolves the finding. Inspection of that diff and the current
`code/sys.driver/driver-pi/README.md` confirms:

- Usage distinguishes launcher authority from the child's `full Deno permissions` and immediately
  disclaims any inference about an enclosing process sandbox.
- Runtime policy explicitly states that Pi-Driver supplies no shell/process confinement and native
  subprocesses do not inherit Deno read/write path bounds.
- Reports describe upstream selection and exact display/redaction rules without the ambiguous
  `safe upstream selection` endorsement.

This satisfies the bounded documentation correction without changing execution authority. No
further README or containment implementation is required to close this reporting plan.

## Incident follow-up: evidence-driven, not an implementation item

The public-web allowance landed in `27d1120c5` and is present in the maintained prompt and canon.
Obtain an operator-supplied, bounded incident record before proposing another repair: actual launch
and upstream versions, profile/prompt/context identity, callable tools, and command/result or the
explicit absence of a call. Do not inspect another workspace or session by inference.

Distinguish no attempted call, an unavailable tool, a trusted runtime denial, and ordinary command
failure. A model explanation or arbitrary stderr is not sufficient to classify a permission denial.
A human research request already declares the public-web task; do not require extra curl consent.

Repair an evidenced source defect at its owner. A stale launch or custom-prompt issue does not
justify another default-prompt exception. Any required repair needs its own explicit scope; it is
not a hidden obligation of the reporting item.

## Containment design only

### Preferred boundary and retained constraints

Prefer a maintained enclosing execution boundary when the promise includes arbitrary tools,
extensions, and native dependencies. Keep Pi-Driver integration thin. A Bash adapter remains an
option only for an explicitly narrower trusted-host contract; `BashOperations` is an integration
seam, not evidence of complete confinement. No backend or platform is selected here.

Source-inspected constraints from the selected upstream package:

- **Handler failure is not fail-closed.** `ExtensionRunner.emitUserBash()` catches exceptions; TUI
  and RPC pass optional operations to `AgentSession.executeBash()`, which defaults to local
  execution. Returning operations whose `exec` rejects addresses that failure only. It does not
  establish required-extension continuity across reload or cover every execution entrypoint.
- **Startup and reload differ.** CLI startup terminates on extension-load errors; reuse that
  behavior. Reload rebuilds the registry from built-ins plus available extensions. Matching the name
  `bash` does not establish that its confined implementation survived. The supplied sandbox example
  also selects local execution after initialization failure; do not copy that fallback.
- **Mutable project data is not trusted control state.** Generated extensions live beneath
  `.pi/@sys/extensions`, inside the Deno-writable root. Specialized remove/move/copy guards do not
  constrain the ordinary write tool. A more-privileged host must not reload task-modified control
  code; separate the authority boundary or enclose that host too.
- **HOME and VM routing do not isolate credentials.** Production inherits environment through
  `m.cli.run` and the `asCommand()` helper in `@sys/process`. Upstream `getShellEnv()` copies it.
  Gondolin's `sanitizeEnv()` filters value types, not secrets. Environment, credential files,
  handles, sockets, and network access require separate decisions and proof when confidentiality is
  in scope.
- **Launcher identity is not provider attestation.** Upstream assembles and rebuilds prompts and
  permits extension replacement of per-turn prompts/provider payloads. Do not promote a launch
  snapshot or fingerprint into proof of what the provider received.

These are source-based design constraints, not claims that attacks were executed. Backend guarantees
and platform suitability require independent evidence. Upstream examples establish integration
possibilities, not production suitability.

### Decisions before any later containment delivery

Choose with the operator: trusted-host shell isolation versus whole-Pi confinement; first supported
platform/backend and blocked behavior elsewhere; writable roots, private scratch, caches, protected
control state, and read boundaries; credential/network/IPC protection; background-process lifetime;
and legitimate signing/development workflows. The incident's macOS environment does not silently
select a backend or exclude other supported hosts.

Do not conflate invoked cwd, runtime/Git root, extra grants, or the host temp directory. Do not
grant all host temp storage by default. Never broaden file/network authority merely because a
backend capability test succeeds. Any semantic `sys.canon` change needs separate ownership and
scope; a lower-priority prompt cannot supersede it. Consult Pi-Driver DSL before later profile/tool
changes.

A future delivery must include its capability wording, lifecycle behavior, and isolated proof in the
same bounded work, not defer those to a later hardening or guidance commit. Test failure before
execution, reload/replacement, all covered entrypoints and descendants, control-state mutation,
path/handle aliases, synthetic credentials, output spill, cancellation, timeout, and background
children. Negative cases stay entirely within a parent-owned disposable fixture, never the
operator's real outside-workspace or runtime files.

Do not build a shell parser, command blacklist, new shell implementation, generic tracing system, or
shared `@sys/process` policy framework for this single consumer. No copied fallback/default grants,
permission escalation, ignored denial, unsigned recovery, or unrestricted retry is admissible.

## Source map

Repository-relative paths unless prefixed with `../sys.canon`. Inspect live source and reachable
history; this map is orientation, not proof of implementation or of the failing session's version.

- Prompt owner: `code/sys.driver/driver-pi/src/m.cli/m.profiles/u/u.prompt.ts`.
- Prompt tests: `code/sys.driver/driver-pi/src/m.cli/m.profiles/-test/-u.prompt.test.ts`.
- Assembly/context: `code/sys.driver/driver-pi/src/m.cli/m.profiles/u/u.resolve.run.ts` and
  `code/sys.driver/driver-pi/src/m.cli/m.profiles/u/u.context.ts`.
- Reporting: `code/sys.driver/driver-pi/src/m.cli/u/u.authority.ts`,
  `code/sys.driver/driver-pi/src/m.cli/u/u.fmt.sandbox.ts`,
  `code/sys.driver/driver-pi/src/m.cli/u/u.report.sandbox.ts`, and
  `code/sys.driver/driver-pi/src/m.cli/m.profiles/u/u.runtime.metadata.ts`.
- Reporting contracts/tests: `code/sys.driver/driver-pi/src/m.cli/t.ts`,
  `code/sys.driver/driver-pi/src/m.cli/-test/-u.fmt.sandbox.test.ts`, and
  `code/sys.driver/driver-pi/src/m.cli/-test/-u.report.sandbox.test.ts`.
- Preview/reuse: `code/sys.driver/driver-pi/src/m.cli/m.profiles/u/u.menu.ts` and
  `code/sys.driver/driver-pi/src/m.cli/m.profiles/m.main.ts`.
- Launch/process: `code/sys.driver/driver-pi/src/m.cli/m.run.ts`,
  `code/sys.driver/driver-pi/src/m.cli/u/u.args.ts`, and `code/sys/process/src/m.process/u/u.ts`.
- Roots/grants: `code/sys.driver/driver-pi/src/m.cli/u/u.runtime.ts`,
  `code/sys.driver/driver-pi/src/m.cli/u/u.resolve.read.ts`,
  `code/sys.driver/driver-pi/src/m.cli/u/u.resolve.write.ts`, and
  `code/sys.driver/driver-pi/src/m.core/m.extension/m.sandbox/u/u.policy.ts`.
- Settings/extensions/tools: `code/sys.driver/driver-pi/src/m.core/m.settings/m.fs.ts`,
  `code/sys.driver/driver-pi/src/m.cli/m.profiles/u/u.resolve.extensions.ts`, and
  `code/sys.driver/driver-pi/src/m.cli/m.profiles/u/u.resolve.tools.ts`.
- Dependency authority: `deps.yaml`, `code/sys.driver/driver-pi/deno.json`, and
  `code/sys.driver/driver-pi/src/m.cli/u/u.resolve.pkg.ts`.
- Canon: `../sys.canon/-canon/-sys.md`, `../sys.canon/-canon/protocol.git.md`, and
  `../sys.canon/-canon/gotchas.md`.

Selected upstream source inspected during preparation is local
`@earendil-works/pi-coding-agent@0.85.1`. Resolve it from the manifest before relying on that
identity. Within that package inspect `dist/core/tools/bash.js`, `dist/core/tools/bash.d.ts`,
`dist/core/tools/write.js`, `dist/utils/shell.js`, `dist/core/agent-session.js`,
`dist/core/extensions/runner.js`, `dist/core/extensions/types.d.ts`, `dist/main.js`,
`dist/modes/interactive/interactive-mode.js`, and `dist/modes/rpc/rpc-mode.js`. The sandbox and
Gondolin examples are under `examples/extensions/sandbox/index.ts` and
`examples/extensions/gondolin/index.ts`. Installed package content is evidence, not a place to patch
behavior.

The reporting proof entry points are `code/sys.driver/driver-pi/-scripts/-test.reporting.ts` and
`code/sys.driver/driver-pi/-scripts/-test.external/-host.reporting.ts`. The resolved-input redaction
suite is `code/sys.driver/driver-pi/src/m.cli/m.profiles/-test/-u.reporting.test.ts`.
The selected-host capstone owns reporting assembly evidence; the separate
`code/sys.driver/driver-pi/-scripts/-test.external/-host.zip.ts` owns ZIP behavior. Neither fixture's
explicit `clearEnv: true` establishes a production guarantee.
