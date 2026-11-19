# Scoped compile-cache preload proofs

This record follows the arc from synthetic containment and official Pi 1.4.0 startup on Deno 2.9.8
through production integration, the dependency upgrade to 1.5.2, graph-assertion retirement, and
[human acceptance](#human-acceptance-and-closeout). The first two experiments ran while dependency
selection remained 0.85.1; neither proved production integration. Later sections record that proof
and its limits. RPC request/response and isolated EOF behavior were not established.

## Synthetic containment (item 1)

**Supported synthetic candidate: closed startup graph on Deno 2.9.8.** This is an environment-side
preload, not a Pi modification. Official Pi startup was outside this experiment. Its implementation
is recoverable from the first landing recorded in the governing plan.

Run from `code/sys.driver/driver-pi`:

```sh
deno task test:compat:preload
deno task test:compat:unit
deno fmt --check ./-scripts/-test.external/-host.preload.ts ./-scripts/-test.external/u.host.preload.ts
deno lint ./-scripts/-test.external/-host.preload.ts ./-scripts/-test.external/u.host.preload.ts
```

Observed before landing, at workspace HEAD `4d692a86e`:

- Preload proof: **1 passed (1 step), 0 failed**, type checked with leak tracing.
- **45 naturally settled children**, expected codes 0, 1, and 7; no signals, termination actions, or
  truncated streams. Two additional write collisions stopped before any capture attempt.
- Compatibility-input regressions: **1 passed (3 steps), 0 failed**. TS formatting/lint passed.
- Runtime: Deno **2.9.8**, V8 **15.0.245.2-rusty**, TypeScript **6.0.3**, **aarch64-apple-darwin**.
- No package/workspace-wide suite, real Pi, RPC/EOF, provider, TUI, or production integration proof.

Adapter hashes (unchanged during the conclusion correction):

- Preload: `sha256-08fdb9ec5f43e242e20e87e931ccf0c57480c3d76b2df2a394240ad7244795f7`.
- Facade: `sha256-75923f55d9ee00cba10025894311ce8dfa10c4dcc17917ca964b62e428b9b7f0`.

## What the proof establishes

- Baseline named import fails before main execution. The facade supplies `{ status: 3 }` and
  preserves real `createRequire` identity and ESM → CJS interop without mutating the builtin.
- The accepted active graph has exactly three edges: main → facade, facade → already-loaded
  `node:module`, facade → already-evaluated preload. The first cache call synchronously deregisters
  before runtime loading. No other static imports, attributes, extra preloads, or asynchronous
  application work may enter that window. Exact edge assertions supplement source inspection.
- Registration and URL setup happen outside the callback. The matching branch returns a precomputed
  URL; its only delegated active edges are the known builtin and preload. Ordinary host contexts and
  intact runtime globals are assumptions, not adversarial-host guarantees.
- Missing/invalid/throwing registration, deregistration failure, malformed/missing facade
  dependencies, facade evaluation failure, and unsupported cache arguments fail visibly. After
  deregistration, baseline/candidate missing-module, ESM, and CJS failures retain their error
  families and sentinels; explicit exit 7 is preserved. No catch-and-repair or resolver replacement
  was introduced.
- Exact-parent matching excludes another same-named launcher. Repeated resolution preserves facade
  identity; repeated calls deregister once. Mapped imports delegate. Controlled present callable,
  throwing, undefined, null, and numeric APIs retain their original behavior without installing a
  hook.
- Baseline/candidate preserve cwd, main-module identities, full `process.argv`, and `Deno.args`,
  including empty, spaced, quoted, and flag-like arguments.
- Permission queries match before/after the cache call: owned read granted, parent read ungranted
  (`prompt` with `--no-prompt`), write/env/net/run/FFI/import/sys denied. No denied operation was
  attempted. This is permission neutrality, not an OS-sandbox claim.
- Concurrent children overlap, return distinct fixture tokens, and use separate
  source/HOME/cache/temp roots without changing parent environment values. Both run promises settle
  before propagating failure. Sources are checked/read back before spawn and unchanged afterward.
  Preload/facade directory-file collisions both report `IsADirectory`, with zero capture attempts
  for those cases.

## Adverse evidence retained

**Persistent hooks are disqualified.** They execute neighboring files for unmapped bare imports and
accept unsupported import attributes. Startup deregistration restores baseline rejection afterward;
injecting unrelated work before the cache call still exhibits the unsafe behavior.

**Deno suppresses arbitrary ESM hook exceptions.** The injected always-throwing callback prints
`HOOK attempted`; the existing-export launcher then prints `MAIN continued`, exits 0, and has empty
stderr. The missing-export launcher instead exits 1 with its original missing-export `SyntaxError`.
The injected module replaced the actual callback: this is a host limitation, not a demonstrated
reachable failure of the closed candidate. The original no-go inference was corrected with Phil's
explicit authorization; the adverse diagnostic remains in the test. General hook-error propagation
is neither claimed nor repaired. Any additional real-launcher active edges require reassessment.

## Raw evidence and next boundary

Duplicate plan-folder JSON receipts were consolidated into this note. Raw diagnostics remain under
Driver-Pi's local `.tmp` (ephemeral, not durable source-controlled evidence):

- Final proof: `.tmp/preload-proof.558729d3487511ae` — `verdict.json`, `runtime.json`,
  `materialization.json`, and per-child `receipt.json` plus emitted files, argv/env, and hashes.
- Original diagnostic: `.tmp/preload-proof.3fdd38c07a7a3b51`; its red assertion was reproduced in
  `.tmp/preload-proof.14ef03bcf091f2da` before correcting the acceptance interpretation.

Children use frozen/cached-only execution, cleared environments, owned read scopes, null stdin, a
120-second timeout, and 64 KiB/256 KiB output bounds. Permission denial, missing cache, incomplete
capture, or uncertain settlement fails the proof without widening authority.

## Official startup (item 2)

Phil explicitly authorized this experiment after item 1 landed. Source baseline: `ec1bc7468`.
Runtime/platform match item 1. Admission succeeded without executing Pi or lifecycle scripts.

Run from `code/sys.driver/driver-pi`:

```sh
deno task test:compat:admit --pi-version=1.4.0
deno task test:compat:startup
deno task test:compat:host
deno task test:compat:preload
deno task test:compat:unit
```

Final targeted verification:

- `test:compat:startup`: **1 passed (2 steps), 0 failed**, type checked with leak tracing.
  No-preload child exits **1** at the missing export with empty stdout; preload child exits **0**,
  empty stderr, one assembly observation, and one `session_shutdown` observation with null stdin.
  The observer requests shutdown; its causal role is not isolated from EOF.
- `test:compat:host`: unmodified dependency-selected **0.85.1**, **1 passed (2 steps), 0 failed**.
- Synthetic regression: **1 passed (1 step), 0 failed**; input/argv units: **1 passed (3 steps), 0
  failed**. Changed TS/README formatting and TS lint pass.
- Every final host capture settles naturally, without signals, termination actions, or truncation.
  No package/workspace-wide suite was run.

Admission identity:

- Package: `npm:@earendil-works/pi-coding-agent@1.4.0`; bin: `dist/bundle/cli.js`.
- Registry: `https://registry.npmjs.org/`.
- Archive:
  `sha512-Z41LpZ3yYHSC/UUps6Mr39UMFPwH8elhJBG9DY1P7kuzsE5qSK/6eMj2EHzO5evJRQWLbKSqUMw+4nCNtIyiQg==`.
- Frozen lock: `sha256-3111d07d9d8bb6ebdc6797f53d2144e82819522312dce0abf0db35ed774aa03a`.
- CLI entry: `sha256-e79626f2dd6f94aa45d30f3fa63cd84319a6eefcd150b353cfaf274366926774`.
- Runtime entry: `sha256-754132d2cbb31c33fac5672366f948a7b90ba07b542dbddd20b13adcc62719bd`.
- Adapter hashes are identical to item 1. Manifest, entry/runtime entry, adapter, and lock hashes
  remain unchanged after settlement; this supplements npm admission, not a new archive verifier.

The complete five-line bootstrap is checked before execution. The real preload's `Deno.mainModule`
and actual importing parent equal the manifest-selected bin. Exactly the same three active edges as
item 1 occur; deregistration precedes CLI runtime loading. The test seam adds only one owned preload
flag before the unchanged npm specifier. Paired launch arguments and environments otherwise match.
No SDK bootstrap, private runtime import, builtin mutation, package patch, or new permission grant.

The live observer verifies full native argv and cwd, `createRequire` identity across facade/builtin,
npm CJS/ESM identity, normal ESM/JSON imports, and CLI markers (`pi`, `PI_CODING_AGENT=true`,
`AI_AGENT=pi`). Unmapped bare imports and unsupported attributes fail with the same TypeError
families on candidate and recovery hosts; the neighboring execution sentinel stays absent. Context
order, fresh remove/move/copy registration and activation, denied net/run/FFI/import, and
non-granted sibling/admission read/write observations pass through the original reporting-host
assertions.

Two observer assumptions were corrected, not the adapter: `new Function` dynamic imports fail in
jiti's VM on both hosts, so the probe now enters native ESM through real `createRequire`. An
exploratory `instanceof` comparison with separately imported Undici constructors was false on both
hosts; it was not a valid cross-bundle identity requirement. The durable assertion compares the same
npm module through native CJS/ESM. The inspected untouched runtime entry still invokes `setupCli`
(including `configureHttpDispatcher`) then `main`; HTTP transport behavior is not proved. Observer
errors explicitly fail even when Pi reports exit 0.

Initial startup evidence remains in `.tmp/report-host.c5147a0255725b5a`: `baseline.json`,
`startup.json`, `artifact.json`, `sources.json`, `verified.json`, and emitted fixtures. Observer
diagnostics remain in `.tmp/report-host.6ea97f70bef18629` and `.tmp/report-host.1fe80f358f045aed`.
Synthetic rerun: `.tmp/preload-proof.b24b9caa5f2f2538`. All are local ephemeral evidence, not
additional plan files.

**Review correction:** the admitted Pi 1.4.0 RPC implementation sets a flag for `ctx.shutdown()`;
commands or `agent_settled` check it, while stdin EOF independently calls shutdown. The observed
exit and `session_shutdown` event do not isolate the observer's causal role. No observer-disabled
counterfactual was executed. Accept the bounded startup result, not observer-caused shutdown. The
fixture/receipt wording and plan now reflect this limit; permanent fixture output uses
`console.info`, and the startup helper imports `Path` through the scripts common barrel.

The lifecycle correction passed startup/recovery checks in `.tmp/report-host.5b2ff56296ae3b2c`. The
final inline residue pass covered all five source/config/documentation files, including the common
barrel. Both fixtures now use that `Path` lane; baseline environment evidence is a value snapshot,
manifest/adapter metadata is readonly, and config formatting is clean. No additional correctness
issue was found within the startup-proof boundary. This was not another blind review.

Final verification after cleanup on Deno 2.9.8: startup and 0.85.1 recovery each pass **1 test (2
steps)**; synthetic proof passes **1 test (1 step)**; input/argv units pass **1 test (3 steps)**;
**0 failures**. All five commit files pass formatting; all three TS files pass lint. Existing
negative controls were rerun; no new fault injection was added for this residue cleanup. Final
startup evidence: `.tmp/report-host.54363e27b2429642`; synthetic evidence:
`.tmp/preload-proof.e65433ff1770295f`. Adapter hashes and production/process code remain unchanged.

**Boundary:** null stdin and observer `ctx.shutdown()` establish neither RPC request/response nor
independently isolated EOF behavior. No provider call, HTTP behavioral test, TUI, production
integration, process-library change, dependency adoption, or Git mutation is part of this proof.
Later work needs separate human authorization; startup success is not full Pi compatibility.

## Draft handoff inspection

Read-only source/Git inspection at workspace HEAD `961cbc8be`, after Phil supplied the
stopped-thread handoff. This is draft assessment, not runtime acceptance or a full correctness
review. At inspection the draft was unstaged; this receiving pass changed only the plan and this
evidence note. No source rollback, implementation continuation, dependency task, runtime test, or
Git mutation was performed. The handoff's reported formatting checks were not independently rerun.

- `src/m.cli/u/u.preload.ts` under Driver-Pi contains the promoted generator and `writePreload`.
  Materialization selects only the exact official 1.4.0 specifier, uses a fresh owned temp
  directory, checks both writes, and selects startup lifetime with tracing disabled. Diagnostic
  lifetime/module seams remain. Source correspondence is not execution proof for the quiet
  production variant.
- `src/m.cli/m.run.ts` resolves the package and writes the adapter before launch; `u/u.args.ts` adds
  the preload before the npm specifier. `u/u.inherit.ts` still delegates to `Process.inherit`, whose
  implementation inherits all terminal streams and awaits child status. Cleanup follows returned
  status, retains artifacts on rejected launch/status, and warns without replacing the exit result
  if removal throws. Selection, partial-write, concurrent-launch, and cleanup behavior need targeted
  verification; the existing `-m.run.test.ts` has no preload-specific assertions.
- `deps.yaml`, `imports.json`, and generated `u/u.resolve.pkg.ts` select 1.4.0. The root lock lists
  that workspace dependency but lacks the corresponding resolved specifier/package entry. Its diff
  removes the old Pi graph without adding the new one (10 added, 958 removed lines at inspection).
  This is incomplete dependency evidence, not a finalized upgrade. Do not hand-patch the lock or
  bypass frozen/integrity checks.
- In `-scripts/-test.external/-host.reporting.ts`, the startup diagnostic filters every `--preload=`
  argument and drops the previous unexpected-preload assertion. It still substitutes a diagnostic
  preload, so its old green result cannot verify current production wiring. The narrow correction to
  assess in an authorized continuation is to assert the single expected owned preload before
  removing it for the paired diagnostic, preserving rejection of unexpected extra flags.
- Root `deno.json` also has layout-only changes in the inspected diff. Their authorship is not
  established here; they and unrelated UI/planning work were preserved. Do not treat all root-file
  changes as belonging to this draft or restore them wholesale from HEAD.

Disposition: preserve the draft for an explicitly authorized continuation; do not accept, discard,
commit, or run it merely because it exists. Phil's terminal-first direction removes automated
stdin/RPC infrastructure from the prerequisite scope, not permission/provenance constraints or
truthful reporting. The plan's mistaken immediate-implementation authority claim was withdrawn.
Dependency finalization and Phil's terminal acceptance still require actual evidence.

## Blind-review adjudication

Phil supplied an independent review of the production draft. Adjudication at workspace HEAD
`97fc01381` reopened the live generator, launch owner, reporting fixture, dependency selection/lock
seams, executable-test import map, and ZIP guard. No runtime test or implementation correction was
performed. Reviewer configuration is not independently established by the returned report.

- **Accept finding 1 (P1): dependency inconsistency.** The selected 1.4.0 dependency has no resolved
  root-lock entry. The separate admitted-host lock cannot close this gap. Use owning dependency
  tasks in an authorized continuation, then verify frozen resolution and unchanged projections.
  Inspect task effects before execution; the review's command list is not execution authority.
- **Accept finding 2 (P2): artifact failure ownership.** `writePreload` has no cleanup after
  directory acquisition if generation/writing throws; `run` can reject during argument construction
  before launch. Clean these known pre-spawn failures while preserving the original error and
  reporting cleanup failure. An `inherit` rejection cannot distinguish failed spawn from uncertain
  status: retain and report its artifact directory. Do not introduce unconditional finally-removal.
- **Accept finding 3 (P1 verification gap): production-path coverage.** Startup mode filters all
  preload-shaped arguments before inserting its own adapter. Assert the exact owned production flag
  and its position before substitution; alter only the Deno prefix, not Pi arguments. Add
  materialization/lifecycle assertions to the existing raw-run suite and exercise the non-startup
  host path. The profile executable-test map substitutes `m.run.ts`; that suite is not proof of this
  artifact lifecycle. Missing verification is not an observed production runtime failure.
- **Retain remaining acceptance obligations.** Exact selection/non-selection, unchanged argv/cwd and
  scopes, quiet emitted-code behavior, failure/concurrency cleanup, recovery, and canonical ZIP
  behavior need scoped evidence. Phil supplies terminal acceptance. No new stdin/RPC infrastructure
  or broader compatibility mechanism is justified by these findings.

Disposition: all three material findings accepted with the defect/verification distinction above;
none implies permission to implement. Preserve the draft. No further blind pass is proposed merely
for agreement; first address these findings and obtain their proof under explicit authorization.

## Authorized production correction and verification

Phil subsequently issued GO for the combined implementation and explicitly approved network-backed
root lock resolution after the cached-only attempt reported missing `@earendil-works/pi-codemode`
metadata. The opening arc remains the landing ledger; no Git mutation was performed.

### Corrections

- Root `deno task lock:sync --lockfile-only --no-prompt` restored the selected 1.4.0 npm graph. Its
  Pi archive integrity matches the admitted release above. Root `prep:deps` regenerated the
  import/package projections; package `prep:deps` reported the fallback current. Inspected diffs
  preserve all other direct selections and the pre-existing root `deno.json` formatting delta;
  `package.json` remains unchanged. Pi's transitive closure changes are resolver-produced, not
  hand-authored integrity entries or a copy of the separate admitted-host lock.
- `writePreload` cleans its directory after a generation/write rejection. `run` cleans after
  argument-construction rejection, retains and reports on uncertain launch/status rejection, and
  cleans after fulfilled inherited-process status. Cleanup failures use `console.info` and preserve
  the original error/status. No unconditional finally removal or new process supervisor was added.
- Raw-run tests assert exact selection/non-selection, checked partial writes, argument rejection,
  deferred settlement, success/nonzero/signal status identity, rejection retention/reporting,
  cleanup failure, and concurrent ownership before enclosing fixture disposal. Argv tests compare
  vectors with and without the single preload, including passthrough preload-shaped arguments and
  scoped/allow-all modes.
- The paired startup fixture asserts the exact owned production flag, position and materialized
  sources before replacing only that Deno-prefix entry. The separate production host lane runs the
  quiet adapter unchanged; both assert its cleanup after confirmed child exit.
- Pi 1.4.0's tool API requires `ExtensionToolContext`. The ZIP test fixture now supplies refusing
  `tools`/`executeTool` capabilities, rather than bypassing type checking. The ZIP host proof reuses
  the existing admitted cache/config/lock and frozen/offline restrictions; it does not download
  artifacts into an empty child cache. Production ZIP guards and bindings remain unchanged.

### Execution evidence

Runtime remains Deno 2.9.8 on aarch64-apple-darwin. All final checks below passed:

| Check                                                              | Result                                                         |
| ------------------------------------------------------------------ | -------------------------------------------------------------- |
| Root frozen/cached-only lockfile-only install                      | passed; graph retained                                         |
| Package `check:deps` / `test:deps`                                 | current / 1 test, 14 steps                                     |
| Raw `m.run` unit filter                                            | 1 test, 15 steps                                               |
| `u.args` unit filter                                               | 1 test, 8 steps                                                |
| `test:compat:preload`                                              | 1 test, 1 step; synthetic controls retained                    |
| `test:compat:startup`                                              | 1 test, 2 steps; baseline exit 1, diagnostic candidate exit 0  |
| `test:compat:host`                                                 | 1 test, 2 steps; unchanged quiet production adapter, exit 0    |
| `test:compat:host --pi-version=0.85.1`                             | 1 test, 2 steps; no adapter, exit 0                            |
| `test:profiles:process`                                            | 2 tests, 17 steps                                              |
| `test:host`                                                        | 3 tests, 3 steps; ZIP baseline, installed alias and extraction |
| `test:zip:permissions`                                             | 1 test, 1 step                                                 |
| `test:compat:unit`                                                 | 1 test, 3 steps                                                |
| ZIP/default-policy unit filter                                     | 8 tests, 66 steps                                              |
| Package `deno check --frozen --cached-only -- ./src/ ./-scripts/*` | passed                                                         |

Final targeted formatting (13 files), lint (10 TypeScript files), and target-only `git diff --check`
also passed. The unrelated root `deno.json` EOF-formatting warning was preserved, not repaired.

Retained evidence under `code/sys.driver/driver-pi/.tmp/`:

- `preload-proof.3bdf87ef4fd7904e/`: synthetic controls and verdict.
- `report-host.66f885abc6742b8d/`: paired startup captures, hashes and `verified.json`.

The non-startup production (`report-host.51897d6c3d94cb54`) and recovery
(`report-host.1515b1b49e6855aa`) fixtures were disposed after passing; their results were observed
in tool output, not retained as new raw-capture artifacts. The inherited-process lifecycle tests use
mocks; executable-boundary tests substitute the raw run module. Neither proves real terminal
restoration. ZIP provider behavior is scripted and local, not external-provider acceptance.

### Execution deviations and limits

The first root `deno task install --lockfile-only --cached-only --no-prompt` invocation downloaded
and initialized npm packages **in task-runner bootstrap before the nested task's cached-only flags
applied**. This exceeded the metadata-only behavior described to Phil and was disclosed immediately.
Npm lifecycle scripts were ignored; no script approval or integrity bypass was used. That command
must not be cited as an end-to-end offline check. Final root verification invoked the configured
install command directly with frozen/cached-only/lockfile-only flags, successfully and without
further download output. Owning projection tasks also completed without projection drift.

The first unit check found the new fixture disposer returning `Promise<boolean>` and the ZIP context
type mismatch; both were corrected before passing. An initial package-check command used unsupported
`--no-prompt` syntax; the supported frozen/cached-only command then passed. Lint found
async-without-await mocks in the extended raw-run suite; those mocks now explicitly return promises.
No type-check or lint rule was disabled.

At that verification checkpoint, independent review and human terminal evidence had not yet been
supplied. No RPC guarantee, provider-wide compatibility, or interactive acceptance was claimed.

## Final review and residue pass

The subsequently supplied blind report found no material source defects. Live-source adjudication
supports retaining the bounded design, not broadening it. Its qualifications remain valid: the root
and admitted-host dependency graphs differ; diagnostic captures do not prove every production test;
outer task initialization is distinct from child restrictions; null-stdin startup is not terminal
acceptance. The public compatibility note now states the graph and task-initialization boundaries
explicitly. No duplicate blind pass is warranted merely for agreement.

Phil's screenshots show the actual terminal reporting Pi 1.4.0 with scoped Deno permissions and an
open model picker. These establish startup and model-menu evidence, not a completed model request,
generated-tool execution, normal quit, interruption or terminal restoration. Those acceptance items
remain unconfirmed.

The requested TMIND/S-tier residue pass inspected the attributable source/dependency delta and
retained the distinct pre-spawn and uncertain-settlement catches. Final changes are bounded:

- Named template snippets remove multiline interpolation indentation without altering the emitted
  startup modules. Native JSON remains confined to the dependency-free diagnostic wire format.
- `m.run` separates options, argv construction and the mutable copy required by `Process.inherit`;
  its status annotation names the owner's `t.Process.InheritOutput` contract. No functional wrapper,
  extra recovery layer or unconditional cleanup was introduced.
- Raw-run tests use canonical `expectError` and `Fs.glob` instead of duplicate error capture and
  direct directory traversal. Native write-failure injection stays below `Fs.write` to prove its
  checked-write propagation.
- Root `deno.json` contains unrelated formatting only and remains excluded from the source unit. No
  dependency regeneration, admission or Git mutation occurred in this pass.

Fresh tests used the owning tasks' configured Deno commands and permission presets directly, with
top-level `--frozen --cached-only --no-prompt`, avoiding preceding `deno task` initialization:

- Raw lifecycle, argv and dependency tests: 3 tests, 37 steps passed.
- Synthetic preload investigation: 1 test, 1 step passed (45 children and two pre-spawn failures).
- Paired official startup, quiet production host and 0.85.1 recovery: 3 tests, 6 steps passed.
- ZIP baseline, installed alias and generated extraction: 3 tests, 3 steps passed.
- Package `deno check --frozen --cached-only -- ./src/ ./-scripts/*` passed.
- Exact-file formatting (13 files), lint (11 TypeScript files) and target-only diff checks passed.

Fresh retained evidence is under `code/sys.driver/driver-pi/.tmp/`:

- `preload-proof.2de18cce4704afb9/`
- `report-host.383a7c2f0ac1334f/`

The new startup source-hash receipt matches `report-host.66f885abc6742b8d/sources.json` for both
emitted modules: preload `sha256-5f666696e37cc540e91918792565805c1dd57ea834e52827a20d1e5da3ac22a7`
and facade `sha256-75923f55d9ee00cba10025894311ce8dfa10c4dcc17917ca964b62e428b9b7f0`. The quiet
production and recovery fixtures were disposed after successful verification; their fresh results
are observed command output, not retained captures. Historical executable-boundary and ZIP-policy
results above were not rerun in this residue pass. Code-quality review is favorable; remaining human
terminal acceptance is not inferred from it.

## Automatic upgrades without a release gate

Phil explicitly superseded the single-release restriction and approved a native entry read inside
only the dependency-free generated preload. Production now selects the official package without a
version allowlist. Before any hook exists, absent native `enableCompileCache` triggers one read of
`Deno.mainModule`; complete bootstrap equality permits adaptation. CRLF and surrounding whitespace
are normalized. Present exports skip the read; unmatched entries run natively; read errors
propagate. No resolver, new permissions, package patch, public option or process supervisor was
introduced. The original bootstrap-window and artifact-lifetime invariants remain intact.

The upgrade/prep owners required no implementation changes. After inspecting their wiring and the
upgrade task's help, actual root execution proved the path:

```sh
deno task upgrade --non-interactive --include=@earendil-works/pi-coding-agent --dry-run
deno task upgrade --non-interactive --include=@earendil-works/pi-coding-agent
deno task install --lockfile-only --cached-only --no-prompt
```

Normal `minor` policy and two-day standdown remained enabled. The apply updated only Pi's direct
selection from 1.4.0 to 1.5.2, regenerated imports and fallback, and installed the resolved graph.
Installation downloaded 14 npm packages; lifecycle scripts remained ignored. The frozen cached-only
follow-up passed. The lock's Pi archive integrity matches the existing admission; root and isolated
host transitive graphs remain separate. `package.json` and root `deno.json` did not change.

Verification on Deno 2.9.8 / aarch64-apple-darwin:

- Manifest-to-launch regression first failed on the missing preload for a non-1.4.0 selection, then
  passed for 0.85.1, 1.4.0, 1.5.2, 99.0.0 and 100.0.0-rc.1 with identical adapter bytes. The initial
  test draft also exposed a version-specific test helper; the test was corrected before the red run.
- Raw/argv/prep/compatibility input suites: 4 tests, 41 steps passed. Existing prep tests
  independently prove successive fallback regeneration and drift rejection. Root `test:upgrade`: 1
  test, 6 steps.
- Synthetic proof: 57 settled children and two checked-write failures. Twelve new controls use the
  production bootstrap guard: LF/CRLF acceptance, changed arguments/order/imports, native entry,
  baseline-equivalent bare/attribute rejection, fatal entry-read failure and native-export read
  skip. Diagnostic overrides retain the earlier adverse loader-window evidence, not production
  eligibility.
- Explicit 1.5.2 paired startup and quiet production, 1.4.0 quiet production, and 0.85.1 recovery
  passed. After upgrade, default `test:compat:startup` and `test:compat:host` both selected 1.5.2
  and passed.
- Default `test:host`: 3 ZIP host tests/steps passed on 1.5.2, including generated extraction.
- Package `prep:deps`, `check:deps` and `check` passed. Preparation reported 1.5.2 current.
- Exact-file format checks (7 files), lint (6 TypeScript files) and scoped diff checks passed.

Retained evidence under `code/sys.driver/driver-pi/.tmp/`:

- `preload-proof.3fa251da7d0be9c7/`
- `report-host.1c84bfb7e6ed4d5c/` (explicit 1.5.2 startup)
- `report-host.85a3a9c058bc760e/` (dependency-selected startup after upgrade)

The final residue pass checked every attributable source, task, generated-selection, dependency and
compatibility-document delta. It retained one package-identity check and one bootstrap contract, not
another version list or preparation framework. The package README, including Conceptual Primitives,
was untouched. Full root preparation was not run: unrelated package generators are outside scope.
Inspected root prep reaches the tested `syncPiAgentImport` through package prep. Automated startup
and scripted ZIP execution do not establish provider requests or human terminal restoration.

## Reopened: graph assertion failure and test residue

Phil supplied a local/CI failure that the previous scoped verification missed. Reproduced through
`deno task test:unit --filter='@sys/driver-pi profile runtime graph'`: the shared graph scanner
treats an import inside generated preload text as a real dependency of the generator. No driver
production change or graph exclusion was made to hide this failure.

Owner-level regression `code/sys/esm/src/m.testing/m.EsmAssert/-test/-runtimeGraph.source.test.ts`
reproduced three independent defects: template text creates phantom edges, raw-source substring
checks reject comments/strings, and multiline imports lose genuine transitive dependencies. All
three steps were red. A maintained parser was proposed rather than another regex patch, but Phil
subsequently approved withdrawing that proposal: trustworthy source-graph reconstruction is not a Pi
launch requirement. Keep these diagnostic findings here, not a shared-library repair prerequisite.
The separate `test(driver-pi): retire incidental import-graph assertions` item owns retiring Pi's
structural assertions and removing the agent-added shared regression file; it must retain mode,
permission and lifecycle behavior tests. No parser dependency or shared-checker change is
authorized.

Removed release-history inputs from launcher unit tests, used independent fixture selections for
manifest propagation, and removed generator-against-itself and source-text logging assertions from
lifecycle tests. Retained package isolation, argv preservation, artifact lifetime, failure/cleanup
and concurrency contracts. Scoped raw/argv verification passed: 2 tests, 24 steps. Format checks
passed for the three changed test files. Those scoped results did not establish a green module.

## Upgrade continuation: full verification and remaining graph assertion

The named upgrade-item GO continued verification without executing the later graph-retirement item.
Production already uses package identity, native capability and complete bootstrap checks; no
further production workaround, dependency admission or permission change was needed. Removed the
remaining generator-against-itself byte comparison from the reporting-host fixture and aligned its
compatibility note. Actual quiet production startup, cleanup, loader behavior and child authority
remain asserted.

Fresh commands from `code/sys.driver/driver-pi`, on Deno 2.9.8 / aarch64-apple-darwin:

- `deno task test:unit --filter='/raw.m.run|u.args|scripts.-prep|isolated host proof inputs/'`: 5
  tests / 44 steps passed, including independent manifest fixture releases and fallback drift
  checks.
- `deno task test:compat:preload`: 1 test / 1 step passed; 57 settled children and two checked-write
  failures. Evidence: `.tmp/preload-proof.4fc9c5d166928857/`.
- `deno task test:compat:startup`: 1 test / 2 steps passed on dependency-selected 1.5.2. The
  no-preload child failed at the missing export; the diagnostic candidate initialized and exited
  zero with synchronous deregistration and preserved bindings. Evidence:
  `.tmp/report-host.e107d3a8137b94e1/`.
- `deno task test:compat:host`, then explicit `--pi-version=0.85.1` and `--pi-version=1.4.0` runs:
  each passed 1 test / 2 steps. Quiet production 1.5.2, recovery and previous-release behavior
  passed.
- `deno task test:host`: 3 tests / 3 steps passed on the canonical selection.
- `deno task test:zip:permissions`: 1 test / 1 step passed.
- `deno task test:profiles:process`: 2 tests / 17 steps passed.
- `deno task test:reset:process`: 1 test / 1 step passed.
- `deno task test:evidence:authority`: 1 test / 5 steps passed.
- `deno task test:preview:real`: 1 test / 5 steps passed, including two real Vite builds with
  retained generation verification and unchanged shared Dist state.
- `deno task check`: dependency metadata current at 1.5.2 and package source/scripts check passed.
- Full `deno task test:unit`: 76 passed / 546 steps, 1 failed / 1 step. The sole failure remains
  `@sys/driver-pi profile runtime graph`, resolving generated `./preload.mjs` text as a generator
  dependency. No test filter, exclusion, source distortion or parser was added to hide it.

The members of the package `test` chain were run individually so the unit failure did not suppress
its process/authority/preview checks. The aggregate task was not claimed green. Root
`deno task test:upgrade` passed 1 test / 6 steps, and
`deno task install --lockfile-only --cached-only --no-prompt` passed with the task's frozen lock. No
new upgrade/admission or root preparation was performed. The existing selection, generated fallback
and projections remain aligned; no Git mutation occurred. Exact-file format checks (10 files), lint
(7 TypeScript files) and the target-only diff check passed. Human request/tool execution, normal
quit, interruption and terminal restoration remain unconfirmed. At this checkpoint, module
acceptance still needed the separately scoped graph-assertion retirement and a green unit run.

## Import-graph assertion retirement

The cleanup GO retired three structural test cases (four graph-checker calls), without changing
production code, permissions, dependency selection, lazy GUI loading or preview-build isolation. The
pre-change filtered profile-graph run reproduced the generated `./preload.mjs` resolution failure.
This is retirement of an incidental policy, not a claim that the scanner was repaired.

Retirement accounting, relative to `code/sys.driver/driver-pi/`:

- Removed `src/m.cli/m.profiles/-test/-m.main.runtimeGraph.test.ts`: the TUI source-path/import
  exclusion. Existing profile run/menu/help tests retain profile resolution, launch-report ordering,
  scoped launch inputs, GUI dispatch/outcomes and help without Pi launch. Inspected `m.main.ts`
  still loads GUI only through its selected-mode callback; the TUI path reaches `run(resolved)`.
- Removed the task-wrapper graph boundary and unused entry/import from
  `-scripts/-test/-task.cli.test.ts`. Kept GUI outcome projection; the executable-boundary process
  suite still proves task/alias status and unexpected-rejection behavior.
- Removed preview-worker ownership and boundary assertions plus unused entry/import from
  `-scripts/m.start.gui.preview.build/-test/-.test.ts`. Kept permission/environment checks, owned
  generation admission/lifetime, actual local hosting and failure/cleanup behavior. Real preview
  isolation still executes separate Vite build children and verifies retained generations.
- Removed the now-unused `EsmAssert` re-export from `src/-test/mod.ts`.

Removed the untracked agent-added
`code/sys/esm/src/m.testing/m.EsmAssert/-test/-runtimeGraph.source.test.ts`; this produces no
tracked Git deletion. Its three scanner findings remain in the preceding reopened-failure section.
No shared checker or other consumer changed; no parser, replacement scanner or source-scan test was
added. Existing behavior coverage was sufficient, so no replacement test was introduced.

Verification from `code/sys.driver/driver-pi`, Deno 2.9.8 / aarch64-apple-darwin:

- Before retirement,
  `deno task test:unit --frozen --cached-only --no-prompt --filter='@sys/driver-pi profile runtime graph'`
  reproduced the failure.
- Scoped `test:unit --frozen --cached-only --no-prompt` with filter
  `/Profiles\/m.main|scripts\/task.cli outcome projection|scripts\/task.start.gui.preview/`: 7 tests
  / 48 steps passed.
- Full `deno task test` passed its entire declared chain: unit 76 tests / 544 steps; reset process 1
  test / 1 step; profiles process 2 tests / 17 steps; evidence authority 1 test / 5 steps; real
  preview isolation 1 test / 5 steps. No filtering or exclusion was used in the aggregate run.
- `deno task check` passed, including dependency drift checking at Pi 1.5.2.
- Exact-file formatting and lint passed for all three surviving changed TypeScript files; scoped
  `git diff --check` passed.

The three retired cases explain the unit-step reduction from 546 passing plus one failing step to
544 passing steps. This establishes the declared package test/check surface, not full workspace,
release-browser or human terminal acceptance. At this checkpoint, provider/tool requests, normal
human quit, interruption and terminal restoration were unconfirmed. No Git mutation occurred.

## Human acceptance and closeout

Phil subsequently confirmed: “this has worked - pi is back and working”, reported CI passed, and
chose a release bump followed by manual plan retirement. This supplies human acceptance of the
terminal-first unblock; it is not inferred from the earlier null-stdin startup fixtures.

Inspected the two supplied screenshots:

- `pi-clipboard-c3576bca-5d09-4717-bbd4-b652a3693a36.png`: Driver Pi 0.0.149 profile menu with
  `canon` and `default`, scoped Deno permissions and explicit process-sandbox limitations.
- `pi-clipboard-bdcff6eb-8a96-4b71-b6e0-ad7872e67072.png`: launch settings/report followed by the Pi
  input surface, workspace footer and selected model. The terminal has reached the Pi TUI.

Both were supplied from `/var/folders/7n/9zpvp0kn44b4stg0zt55j8jr0000gp/T/`; these are temporary
source locations, not durable repository attachments. The descriptions above preserve the inspected
observations. Neither image shows a CI run; CI success is Phil's report. No run URL, run identity or
CI logs were supplied or independently verified in this closeout.

The human acceptance supersedes earlier awaiting-acceptance notes for this unblock. It does not
establish separate observations of provider/tool requests, normal quit, interruption or terminal
restoration. Those remain explicit evidence limits rather than new implementation work. The
capability/bootstrap contract, native fallback and limits on future compatibility remain unchanged.

The opening arc records all five implementation landings. Reachable commit `b48f6cd76` changes
Driver Pi's `deno.json` version from 0.0.148 to 0.0.149; no publication was verified. The later
`bc40f9610` version display change is separate and does not establish runtime identity.

The final reconciliation updated only the plan and this proof. No tests were rerun for this
documentation pass, and no Git mutation or file removal was performed. Phil owns the completion
snapshot and subsequent manual archival.
