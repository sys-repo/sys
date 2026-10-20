@sys.driver-pi
upstream-runtime-compatibility.plan.md
- [x] fb8b5dfdf test(driver-pi): verify upstream CLI compatibility in isolation
- [x] 691bb36c9 fix(driver-pi): preserve Pi child exit status
- [ ] [pi-compile-cache-pr.plan.md](./pi-compile-cache-pr.plan.md)
- [ ] fix(driver-pi): adopt current Pi with verified Deno compatibility

## Pi-only and cross-repository boundary

The goal is to make current Pi run under scoped Deno. The compatibility proof and child exit-status
repair are supporting work, not delivery of that goal. The launcher fix belongs upstream in Pi; the
linked prerequisite plans that contribution, section 4 retains its technical contract, and section 3
governs adopting its released result here.

This file remains the initiating call-site and later released-adoption plan. The current thread is
solely the upstream PR contribution governed by [pi-compile-cache-pr.plan.md](./pi-compile-cache-pr.plan.md).
Drive that work from this `/sys` session, but make the actual code and regression changes in
`/Users/phil/code/-oss/pi` on `fix/optional-compile-cache`, created from updated `main`. Its first arc
item, `fix(coding-agent): make compile cache initialization optional`, is the OSS contribution commit;
it is not a Driver-Pi commit and must not be duplicated in this arc.

Do not change `code/sys.driver/driver-pi`, dependency pins, launcher policy, or npm caches as part of
this PR. This file's `fix(driver-pi): adopt current Pi with verified Deno compatibility` is separate
later work after an official release, not the current thread's implementation target. Keep both
existing plans here; create no new plan in the OSS checkout. Record upstream issue/PR/release links
here as evidence, never as locally landed commits.
The prerequisite owns checkout preparation, the upstream commit, validation, submission wording, and
external approval decisions. Its completion is not upstream merge or release; section 3 still
requires a verified official artifact before adoption. Do not duplicate its commit arc here.

The already-landed exit-status work below was confined to `code/sys.driver/driver-pi`. Its scope is
historical context, not permission to reopen Driver-Pi work in this PR thread. The upstream fix must
not depend on private system samples or test fixtures.

## Outcome and ownership

Run a verified current stable Pi release through the existing npm CLI subprocess under scoped Deno.
The existing boundary is the design to preserve, not a defect to redesign:

- Pi owns complete CLI initialization, modes, extension hosting, and lifecycle.
- Deno owns Node API compatibility and Deno API permissions.
- Driver-Pi owns launch inputs, profiles, context, wrapper tools, and child-result reporting.

Prefer zero launch-vector or bootstrap changes. Success removes the temporary rollback without
adding another production abstraction, compatibility branch, dependency-selection policy, or
ownership role. A small test extension and truthful exit reporting are not themselves the
compatibility fix.

Planning and review authorize neither implementation nor Git or remote mutations.

## Evidence and limits

Except for the explicitly upstream paths in section 4, paths are relative to this workspace root.
`driver` denotes `code/sys.driver/driver-pi`; `host` denotes the cached package directory
`.pi/@sys/tmp/deno/npm/registry.npmjs.org/@earendil-works/pi-coding-agent/0.86.1`.

- Reachable recovery commit `6bb70f817` selects Pi 0.85.1 in dependency authority and generated/lock
  surfaces. This is temporary containment, not a supported-version ceiling.
- `host/package.json` selects `dist/bundle/cli.js`. That file statically imports
  `enableCompileCache` from `node:module` before loading Pi's CLI runtime. The initial built-in
  import probe on Deno 2.9.7 reproduced the missing-export error without executing Pi's full
  startup. The later isolated npm-bin reproduction is recorded in section 1.
- `host/dist/index.js` exports `main`, but `host/dist/cli/setup.js` separately establishes process
  markers and HTTP dispatcher setup. An exported callable is not proof of complete CLI equivalence.
- The diagnosed exit-status defect was that `driver/src/m.cli/mod.ts#exitCode` handled only GUI
  failure and `driver/src/m.cli/m.raw/mod.ts` discarded its returned run result. The process owner
  already returns child code/success/signal. Section 2 defines the boundary repair and its proof.
- `driver/-scripts/-test.external/-host.reporting.ts` supplied the existing real npm-CLI fixture,
  cleared child environment, bounded capture, and session-start observations. Section 1 extends that
  same fixture with exact candidate selection, admitted artifacts, and offline confinement.
- Existing ZIP host and permission tests prove narrower contracts. None alone establishes a current
  release's complete launch compatibility.

No current upstream resolution is established here. Reports about later Pi releases or Deno changes
are research leads, not admitted runtime proof. Verify official sources and exact released artifacts
at adoption; do not silently treat 0.86.1 as the eventual target or a moving `latest` as tested
identity.

## 1. Isolated real-CLI proof

Extend the existing host-test approach, not a new compatibility framework. Expected edit scope:
`driver/-scripts/-test.external/`, its existing test helpers, and `driver/deno.json` task wiring.
Keep production package selection, `PiArgs.toArgs`, `Raw.run`, and profile semantics unchanged.
Extract a local fixture helper only if concrete shared code earns it.

The proof must:

- Accept one exact official Pi release through the existing `pkg` input, with a dependency-selected
  default. Reject arbitrary custom package/code targets for this test surface. Add no production
  version matrix, automatic fallback, or permanent old-version test dependency.
- Invoke the owner-produced npm-bin launch path through `resolveRun` and `Raw.run`; use
  `withInherit` only to capture the actual child and apply fixture isolation. Do not substitute SDK
  startup.
- Clear ambient credentials, proxies, sessions, and Pi markers. Own HOME, agent state, temporary
  files, and the child cache explicitly. Bound execution and output; require observed settlement
  before cleanup. Unsettled children retain their fixture and fail the proof.
- Separate explicit artifact/cache admission from verification. Verification must use admitted
  dependencies without automatic downloads, real credentials, provider calls, or prompts. Inspect
  the candidate's offline contract; 0.85.1 and 0.86.1 document `--offline` and `PI_OFFLINE`. Neither
  Pi offline mode nor parent Deno permissions alone proves child network confinement. Make child
  module-resolution and network restrictions explicit in the test task; only test-side tightening is
  permitted. Stop on missing authority or artifacts rather than broadening permissions.
- Observe the exact Pi and Deno identities, direct child outcome/code, complete diagnostics, and the
  existing profile/context assembly assertions. Observe real generated filesystem-extension loading
  and a provider-free RPC startup/shutdown. Metadata/help success alone is insufficient.
- Keep the candidate fixture's cooperative ZIP extraction disabled: `resolveRun` deliberately
  refuses that feature with explicit package overrides. Do not weaken this guard for a probe. Its
  canonical host proof runs after dependency adoption.

First obtain a bounded negative reproduction for Pi 0.86.1 on Deno 2.9.7, if that runtime/artifact
pair is still lawfully available. Record the exact missing-export diagnostic and absence of startup
observations. Missing caches, permission failures, timeouts, or another exception are not that
proof. Do not encode an assertion that this Pi release must fail on future Deno versions.

Use the recovery release as a positive control. This item proves that the check works, not that
current Pi works. Candidate success is required for item 3, not for completing this test-only item.
An expected-failure reproduction must never turn candidate acceptance green. Permanent success tests
follow dependency authority rather than cementing the recovery pin.

No PTY framework, provider simulator, broad runtime matrix, or duplicate tool-policy suite is
required for this item. Reuse existing owner tests; add a regression only for a demonstrated
uncovered failure. A human-owned isolated TUI check remains part of final adoption, distinct from
RPC proof.

### Recorded isolated proof — 2026-09-24 UTC

The extended reporting-host test is shared by `test:compat:host` and `test:reporting:host`.
`test:compat:admit` separately downloads official npm artifacts without executing Pi. Usage and
isolation limits are documented in `driver/-scripts/-test.external/README.compat.md`.

Observed on Deno 2.9.7, V8 15.0.245.2-rusty, TypeScript 6.0.3, `aarch64-apple-darwin`:

- Pi 0.86.1, selected with `--pi-version=0.86.1`: actual npm-bin child exited 1, signal null,
  neither stream truncated, empty stdout, and no startup/shutdown observation. The diagnostic was
  `The requested module 'node:module' does not provide an export named 'enableCompileCache'`, at the
  official `dist/bundle/cli.js:2:25`. The acceptance test correctly failed.
- Dependency-selected Pi 0.85.1: actual npm-bin child exited 0, signal null, neither stream
  truncated. Fresh session-start evidence confirmed ordered context/profile assembly and active
  `remove`, `move`, and `copy` tools whose upstream source metadata named the generated
  `sandbox.fs/mod.ts`. One cooperative session-shutdown observation followed. Child observations
  confirmed `net`, `run`, `ffi`, and `import` permissions were all denied.
- Both admissions used `https://registry.npmjs.org/`, cleared environments, and owned caches. Their
  local receipts and frozen locks are under `driver/.tmp/pi-compat/0.86.1/` and
  `driver/.tmp/pi-compat/0.85.1/`. Lock digests respectively:
  `sha256-ec3559b7dda3e76d8bbe0dd832868e0f1a905c0c5ef18836ed00afbd8c5a619f` and
  `sha256-5531c5abe0a81efbf02557d31697a2fd4bbc8886c9b68a5467ad9dfb97c7d7b3`.
- `test:compat:unit`, `check` (including `check:deps`), and every constituent task of the package's
  `test` task passed: `test:unit` (75 suites / 513 steps), `test:reset:process`,
  `test:profiles:process`, and `test:preview:real`. Workspace-wide tests were not run.

A subsequent filesystem-isolation regression reproduced a gap in the initial positive proof: child
permission queries granted read/write access to a sibling canary path and the persistent admission
directory/receipt. The parent task's shared `.tmp` environment was entering both profile and
raw-launch permission resolution despite a fixture-owned child temp environment. The fixture now
scopes and restores the parent temp environment for its lifetime. Assertions cover both resolution
stages and the actual child; all three outside paths report neither read nor write grants. Parent
restoration passes on success and failure. Re-running both releases preserves the positive
startup/shutdown proof and the exact negative missing-export reproduction. The regression uses
permission queries, not reads or writes against the admissions.

These observations prove the isolated check and historical mismatch, not a current-release
resolution, interactive TUI behavior, or repaired production executable exit propagation. The
negative reproduction is an observation about this exact pair, not a permanent failing-version
assertion. No production launch, dependency, or permission surface changes are required for this
proof.

## 2. Child exit status

A separate correctness repair, not an import fix or a new process supervisor. The production change
belongs in `driver/src/m.cli/mod.ts#exitCode` and `driver/src/m.cli/m.raw/mod.ts`: project
`result.output.code`, without a new mapper layer or changes to the process owner. Keep regressions
in the existing Pi-local process-test fixture family.

Project the existing returned child status through the profile and raw executable entrypoints. Cover
package-root and local-task aliases that delegate to them. Preserve success/help/user-exit behavior,
existing GUI failure handling, and uncaught unexpected failures. Do not rewrite process ownership,
add retries, alter signal forwarding, or translate child signals through a new platform abstraction.

Reuse the existing process-fixture pattern in
`driver/src/m.cli/m.profiles/-test.external/-u.start.gui.exit.process-proof.ts`. Prove normal
success, a distinctive nonzero child code, signal-derived non-success using the process owner's
actual status contract, and failed-to-start behavior. Verify real outer process status, not only a
mapper return. The compatibility fixture independently inspects the captured child's result, so it
cannot falsely pass while this executable defect exists.

### Exit-status verification evidence

- The regression observed outer exit 0 for child codes 37 and 143 at the profile boundary, then
  independently at the raw boundary after correcting the profile mapper. Both boundaries
  subsequently preserved those codes. The existing package-root and task aliases exercised the
  production mapper.
- Normal codes came from `Process.inherit`; the signal-derived code came from a settled
  `Process.capture` termination using the same native status contract. The boundary fixtures inject
  those results into real executable entrypoints. Spawn rejection was checked at the process owner
  and as an injected `NotFound` rejection at the executable boundaries. This is not a full Pi launch
  or signal-forwarding proof; the real Pi compatibility proof remains separate.
- The package `test` task passed: unit tests (75 suites / 513 steps), reset process proof,
  profile/raw process proof (2 suites / 17 steps), and real preview proof. Success, help, user exit,
  GUI outcomes, and uncaught rejection behavior remained covered.
- After correcting fixture type imports and export ordering, all nine source/test files passed
  formatting, package `check` (including `check:deps`) passed, and `test:profiles:process` passed
  again (2 suites / 17 steps). The scoped diff passed `git diff --check`.
- Final diff inspection confined production changes to the two executable-boundary files. The
  remaining changes are Pi-local process fixtures; dependencies, permission presets, task wiring,
  and process ownership are unchanged.

Do not expand this repair into another module's cleanup, a new test framework, or upstream
dependency adoption. Landing remains recorded only in the opening arc; these observations are
verification evidence, not a commit claim.

## 3. Upstream resolution and adoption

Before changing dependency authority, check official Pi and Deno releases/source for a released pair
that runs the unchanged CLI boundary. Record source URLs, observation date, exact package/runtime
versions, artifact provenance, and the relevant upstream change. A source commit, open issue, export
stub, or successful version probe is insufficient.

If none is available, pursue the focused upstream Pi contribution in section 4 rather than treating
the blocker report as the delivered fix. Posting an issue or PR requires separate human
authorization. Do not silently wait indefinitely, declare compatibility complete, or manufacture
local adapter work. Recheck upstream state when this item is resumed; if an independent released fix
makes our proposed PR unnecessary, explicitly revise the contribution dependency rather than submit
redundant work. No automatic polling or upgrade hold is introduced.

Candidate acceptance requires the isolated real-CLI proof and unchanged scoped behavior. If an
upstream runtime change affects permissions, verify that affected surface directly; passing startup
cannot waive a permission regression. If resolution instead requires a different public entrypoint,
a runtime switch, or copied initialization, stop and request an explicit scope decision. This plan
does not contain a contingent adapter implementation.

Once a candidate passes:

1. Update `deps.yaml` to the exact verified current stable Pi release and regenerate derived
   imports, fallback metadata, and lock data through declared tasks. If newer Deno is needed, record
   the tested version and human-owned installation required. Do not infer a minimum from one passing
   version or silently upgrade Deno.
2. Reconcile the dependency graph before any frozen bundle build. Keep frozen/integrity checks
   intact; do not hand-edit generated dependency files or redesign the workspace prep workflow here.
3. Re-run proof with the canonical dependency-selected host, including existing reporting and ZIP
   host/permission coverage and the affected unit/process tests. Check metadata with the package's
   `check:deps` and finish with its `check` and `test` tasks. Do not mistake a narrow task for the
   package suite or a passing parent process for child success.
4. Record an isolated human TUI launch, generated-tool availability, normal quit/interruption, and
   terminal restoration on the adopted pair. This does not require a model prompt or provider call.
   Missing TUI evidence remains missing; do not claim RPC proves it.

Existing task anchors, run from `code/sys.driver/driver-pi`: `test:reporting:host`, `test:host`,
`test:zip:permissions`, `test:profiles:process`, `check:deps`, `check`, and `test`. Inspect their
current permissions and network behavior before execution. The isolated candidate tasks are
`test:compat:admit` and `test:compat:host`; the former intentionally downloads, the latter does not.

Completion requires a proven current release replacing the recovery pin, truthful failure reporting,
and preserved ownership/permissions. Preserve ordinary exact dependency pinning for reproducibility,
not a special ceiling or automatic downgrade. Proof records name the tested pair and do not promise
compatibility with untested future releases.

### Current-release investigation — 2026-09-24 UTC

Official release evidence, observed around 03:07 UTC:

- [npm latest metadata](https://registry.npmjs.org/@earendil-works%2fpi-coding-agent/latest)
  selected Pi 0.87.1, npm bin `dist/bundle/cli.js`, and source revision
  `f07218c4d4bbc12bef056a7058c3dd49dfe41abe`.
- [Deno latest release metadata](https://api.github.com/repos/denoland/deno/releases/latest)
  selected stable, non-prerelease [v2.9.7](https://github.com/denoland/deno/releases/tag/v2.9.7),
  matching the installed runtime.
- Pi's
  [release build source](https://github.com/earendil-works/pi/blob/f07218c4d4bbc12bef056a7058c3dd49dfe41abe/scripts/build-coding-agent-bundle.mjs)
  still emits the unconditional named import of `enableCompileCache` from `node:module`. The
  admitted npm artifact's five-line CLI launcher matches that source.

Executed from `code/sys.driver/driver-pi` on Deno 2.9.7, V8 15.0.245.2-rusty, TypeScript 6.0.3,
`aarch64-apple-darwin`:

1. `deno task test:compat:admit --pi-version=0.87.1` succeeded against the official npm registry.
   Receipt: `driver/.tmp/pi-compat/0.87.1/admitted.json`, dated `2026-09-24T03:08:15.735Z`. Its
   archive integrity matches npm metadata:
   `sha512-m8ArJUtVcQMSe1lLE/Ei7vX/JV7O39sWmWBsXV2NOU70F0qCp8GubA24pT3LnwTmM6LL2xV80/h6sQg85n69ew==`.
   Frozen lock digest: `sha256-41a531098ced673b8e8d543a889a145dedc603c82d36711123d10b46ff0ccb9f`.
2. `deno task test:compat:host --pi-version=0.87.1` failed. The actual isolated npm-bin child exited
   1, signal null, with empty stdout and neither stream truncated. At `dist/bundle/cli.js:2:25`:
   `The requested module 'node:module' does not provide an export named 'enableCompileCache'`. No
   startup or shutdown observation was emitted. This is candidate rejection, not a green test.
3. `deno task test:compat:host` passed for dependency-selected Pi 0.85.1: child exit 0, observed
   startup and cooperative shutdown, active generated filesystem tools, denied
   network/run/FFI/import permissions, and no read/write grants to sibling or admission paths.

The current stable pair is therefore blocked at upstream CLI import. A released upstream resolution
is required before adoption; no such resolution was established by this investigation. A Deno
Node-module compatibility fix or a change to Pi's published launcher must be tested through the same
CLI boundary. Fixing this first import alone would not prove the rest of startup. No dependency pin,
production code, permission preset, or runtime installation was changed.

Initial API reduction, originally prepared for Deno's Node-compatibility maintainers (not posted or
separately executed here): save this observed import as `repro-enable-compile-cache.mjs`. Section 4
now targets Pi's optional optimization at its owner rather than asking Deno to recreate the cache:

```js
import { enableCompileCache } from 'node:module';
enableCompileCache();
```

Run `deno run --no-config ./repro-enable-compile-cache.mjs` on Deno 2.9.7. The expected failure is
the missing named export above. This reduction isolates the API mismatch; the executed Pi
reproduction and recovery control are the task results recorded above. Posting an upstream issue
remains a separate human-authorized action.

## 4. Upstream contribution contract and evidence

Execution and submission planning live in
[pi-compile-cache-pr.plan.md](./pi-compile-cache-pr.plan.md). This section retains the initiating
call site's evidence and technical acceptance contract; it is not another workflow or commit ledger.

### Intent and evidence

Make an optional startup optimization optional at import time. Preserve Node's cache behavior where
the API exists and let Pi continue its normal initialization where it is absent. This is a narrow
launcher compatibility fix, not a promise of general Deno support or older-Node support.

Official repository evidence inspected on 2026-09-24 UTC:

- [Pi #9938](https://github.com/earendil-works/pi/issues/9938) reports the identical Pi 0.87.1
  startup error on Node 20.19.4. The reporter resolved it by upgrading Node. Its automatic closure
  and `no-action` label are not a Deno fix or contributor approval. Pi 0.87.1 declares Node
  `>=22.19.0`; do not lower that requirement or claim this PR closes the Node 20 support question.
- [Deno #34190](https://github.com/denoland/deno/pull/34190) added the compile-cache APIs on May 17;
  [#34348](https://github.com/denoland/deno/pull/34348) reverted them on May 25. The revert says
  Deno already enables V8 code caching and the polyfill introduced unwanted environment-permission
  requests ([#34326](https://github.com/denoland/deno/issues/34326)). This is not simply a runtime
  waiting to acquire caching. Do not restore those permission costs in Driver-Pi.
- Pi previously
  [accepted a Deno import fix](https://github.com/earendil-works/pi/issues/2885#issuecomment-4202897172).
  This is precedent for asking, not assurance that this proposal will be accepted.

The historical source baseline was Pi 0.87.1's revision
`f07218c4d4bbc12bef056a7058c3dd49dfe41abe`. The active contribution now uses the separate Pi `1.1.0`
checkout; its exact base, toolchain, and build provenance are recorded only in
[pi-compile-cache-pr.plan.md](./pi-compile-cache-pr.plan.md). This does not replace the historical
released-artifact proof above or establish acceptance of Pi `1.1.0` under Deno.

At the active base, `scripts/build-coding-agent-bundle.mjs` still owns `cliLauncher`, emits
`packages/coding-agent/dist/bundle/cli.js`, and bundles `dist/cli.js` as `cli-runtime.js`. The package
manifest still selects that generated launcher as `bin.pi`, with Node `>=22.19.0`. The new codemode
worker and OAuth bundle changes leave the unconditional cache import/call untouched. Change only
the generator's launcher, not downloaded or hand-edited `dist` output; preserve the new surrounding
build behavior. Follow the reopened upstream agent and contribution rules.

### Proposed change and invariants

Candidate emitted launcher body, to be checked against upstream's current formatting and API
surface:

```js
// A property lookup avoids requiring the optional export during ESM linking.
import * as nodeModule from 'node:module';

nodeModule.enableCompileCache?.();
nodeModule.createRequire(import.meta.url)('./cli-runtime.js');
```

The namespace lookup serves a concrete interoperability boundary: a named import of the optional API
fails before a guard can execute. A dynamic import is unnecessary; it would add async startup
without fixing anything the namespace/property lookup cannot address. Use capability detection, not
`process.versions`, runtime-name checks, or a version table. Confirm the chosen import form against
both real runtimes; follow upstream's conventions without introducing `@sys` dependencies.

- Preserve the shebang, executable mode, bin metadata, arguments, and complete existing CLI path.
- Where present, call the real cache API once, before requiring the real runtime, as today.
- Where absent, skip only that optimization. Do not install a polyfill or fake a success result.
- Add no blanket `try/catch`: import failures, permission denials, callable failures, and CLI errors
  remain visible. Preserve the current handling of return statuses when the real API is present.
- Change neither `setupCli` nor SDK startup, HTTP dispatch, extension loading, or lifecycle
  ownership.
- Keep scope to the generator and a focused regression using upstream test conventions. No new
  dependencies, engine changes, runtime selector, cache framework, broad CI matrix, lockfile churn,
  version bump, or changelog edit. If broader work proves necessary, return for a scope decision.

### Proof before a PR

Prove the change against the generated launcher early, before investing in surrounding machinery:

1. Record the unchanged base revision and exact installed Node/Deno versions. Reproduce the known
   ESM missing-export failure under Deno 2.9.7 from the unchanged generated bin. After the generator
   edit and an authorized rebuild, run the same path again. Do not edit the generated launcher to
   manufacture green evidence or substitute the SDK/unbundled CLI.
2. Under a supported Node version (`>=22.19.0`, exact version recorded), verify the actual generated
   bin still starts, cache initialization precedes runtime loading, and Node's documented disabled
   cache setting still permits startup. Under Deno, require actual provider-free RPC startup, a
   successful request/response, and cooperative shutdown; `--version` alone is only a smoke test. A
   later failure is another finding, not evidence that this small fix made all of Pi compatible.
3. Use fresh owned HOME, agent state, temp, and cache; clear credentials and ambient Pi settings.
   Bound time/output, record direct child status and complete diagnostics, and settle children
   before cleanup. Admit build/test dependencies separately from offline startup execution. Retain
   Deno's network/import/run/FFI denials during the startup proof, with explicit file/env scopes;
   prepare exact arguments in the separate checkout before execution. No `-A`, real provider calls,
   or permission expansion to turn a failure green. Missing authority or artifacts stop that run.
4. Add the narrowest meaningful regression tied to the generator's emitted code, following the
   existing `scripts/*.test.mjs` runner. Cover absent API, single cache initialization before CLI
   runtime loading when present, and visible cache-call/CLI-load errors. Do not merely test a copied
   optional-call snippet or search for its spelling. At the active `1.1.0` base,
   `scripts/coding-agent-smoke.test.mjs` replaces the old consumer test and still uses stub packages;
   its success alone cannot prove this real launcher fix. `scripts/coding-agent-smoke.mjs` checks
   `--version`, not RPC, and its runtime argument does not supply Deno's `run` or permission flags.
   Do not pretend it is already a Deno harness or build a general runtime-selector layer to make it
   one. Name unavailable runtime/CI coverage rather than reporting skipped tests as passes.
5. Run the focused regression, existing Node package-consumer smoke on the built artifact, and
   upstream's required `npm run check` and `./test.sh` from its root after inspecting their effects
   and obtaining required execution authority. The current consumer task is
   `npm run check:package-install`, backed by `scripts/check-package-install.mjs`; it packages and
   installs all public package consumers and invokes the coding-agent policy smoke. Agree that
   artifact/install execution separately; the retired `coding-agent-consumer.mjs` is not runnable.
   `npm run check` still invokes Biome with `--write`; use the separate checkout and inspect resulting
   changes. `./test.sh` still clears credentials and isolates HOME; do not replace it with an ambient
   full test run. Agree rebuild execution under the live `AGENTS.md`. Node remains the upstream
   development/test toolchain, not a change to Driver-Pi's production runtime.

Retain base/head source identities, generated artifact provenance, exact commands/permissions, red
and green diagnostics, Node results, and any next blocker. Local PR validation is not proof of an
official npm release, Driver-Pi's generated tools, ZIP behavior, or interactive TUI restoration.

### Released adoption and stop conditions

`test:compat:admit` and `test:compat:host` accept exact official stable releases only. Do not weaken
that boundary to feed them a draft checkout, forged receipt, modified cache, or locally repackaged
0.87.1. Pre-merge proof belongs in the separate Pi checkout. No new test adapter is planned here.

A merged PR is not an installable release. Once Pi maintainers publish a stable release containing
the fix, record its PR/merge/release links and exact npm identity, then admit and verify it through
section 3's unchanged tasks before changing `deps.yaml`. If the guard exposes another
incompatibility, report it separately and seek a bounded next decision; do not widen this PR
silently. If maintainers decline or a release is unavailable, report that concrete condition and
return control to the human. Do not equate waiting, PR acceptance, or the two supporting local
commits with a working current Pi.

The upstream PR and downstream adoption remain separate deliveries. The recovery pin remains until
the released replacement has actually passed the required proof. Planning authorizes no upstream
checkout, patch, dependency/runtime change, issue, or PR publication.

## Exclusions and reduction test

No production Pi patch pipeline or fork dependency in this workspace. The narrow upstream source
contribution in section 4 is the explicit planned exception to the earlier blanket no-Pi-patches
wording; it does not authorize local cache patching or installing a private build. No fake Node
exports, Driver-Pi imports of private bundle paths, copied `setupCli`, SDK bootstrap, runtime
selector, Node migration, new RPC UI, production preflight framework, or permission expansion. Keep
workspace prep repair, unrelated dependencies, and publishing outside the local implementation unit.
Preserve the documented limit: Deno API scopes do not constrain Bash/native subprocesses.

Before accepting each change, ask whether the same proof or behavior follows by updating the
upstream dependency and reusing existing code. Prefer that smaller result. New test machinery needs
a concrete uncovered behavior; the dependency fix must not become a justification for owning more of
Pi.
