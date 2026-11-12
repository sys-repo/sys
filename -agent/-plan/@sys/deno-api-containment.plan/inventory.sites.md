# Source-reviewed Deno sites

Companion to [inventory.md](./inventory.md) and [the candidate manifest](./inventory.candidates.md).

## Accounting boundary

Continuation baseline: `b328700abf97f59e6e75ffa23c9d066b728c107e`. The checkpoint commit adds the
two original inventory documents; it does not complete the governing audit item. At re-entry there
were no tracked or staged changes. Untracked agent plans are not source changes.

This ledger records classified operations at the documented revision, including residual role
selectors in Y/Q. The supplied review found missing ordinary production/type sites and ambiguous
selector scope; the previous inference of complete coverage is withdrawn. A record covers only its
named symbols/operations, expressly listed aliases and embedded programs. Several same-contract
occurrences may share one record; record counts are not native-call counts. Files can have records
in multiple content planes. Earlier exact operation records take precedence over residual selectors.
Z10 is a cross-reference to N14, excluded from classification totals. No residual-file count is
obtained by subtracting records from files.

Each record supplies capability/content, the inventory's B/O/R/G/U classification, a public target
or explicit lack of an established equivalent, risk, and the decision/proof obligation. `Text`
records are non-executable lexical matches: their runtime classification is not applicable, not a
sixth runtime exemption. Type records are kept apart from executable records. Containing a native
type does not mean the namespace is evaluated at runtime.

Shared proof obligations referenced below:

- **cwd:** `Fs.cwd()` in `code/sys/fs/src/m.Fs/u/u.cwd.ts` defaults to process cwd. Prove explicit
  argument precedence, changed process cwd, and poisoned `INIT_CWD`. Check new import edges; never
  substitute terminal cwd. B identifies operation compatibility, not completed import-graph proof.
- **argv/exit:** `Args.parse` parses supplied input; it does not acquire ambient argv. Preserve
  supplied argv and exit/exitCode timing. R applies to these named host-entry effects only, not all
  IO in a CLI file. No generic argv/exit facade was established.
- **stat:** `Fs.stat` returns undefined for NotFound and propagates other errors. Native throwing
  callers need explicit policy; an optional caller must preserve its catch boundary.
- **env:** the inspected `Env.load({ search: 'none' })` is asynchronous, does no dotenv discovery,
  and reads process state live. Missing values are empty strings; `has` distinguishes absence.
  Preserve injected callbacks and permission refusal; do not construct a reader unnecessarily when
  an injected callback is supplied. No synchronous reader was established.
- **metadata types:** `@sys/fs/t` exports `Fs.FileInfo`, an exact `Deno.FileInfo` alias. Consumer
  annotations may be contained through that existing type-only entry without claiming portability or
  changing metadata/identity predicates.
- **fixture controls:** preserve native runner registration, leak ownership, sanitizer dimensions,
  marker/exit diagnostics, and teardown where those are the experiment. Do not replace deliberate
  leaks with managed helpers. Source assertions are evidence, not executed proof.

## Root production scripts

- **S01** `-scripts/main.ts::lib.bump` — process cwd / script; **B** → `@sys/fs` `Fs.cwd()`; low
  operation risk. Applies the cwd proof; the command dispatcher is not a filesystem adapter.
- **S02** `-scripts/main.ts::import.meta.main` — argv and final exit / entry; **R**, no equivalent
  acquisition/exit facade established; medium lifecycle risk. Preserve flag parsing and exit only
  after `run` settles.
- **S03** `-scripts/task.bump.policy.ts::wrangle.readJson` — synchronous text read of URL paths /
  script helper; **G** → filesystem owner, no matching sync facade established; medium risk.
  `Fs.readText` cannot be substituted into synchronous coupling discovery. Revisit only with an
  explicit synchrony/error contract decision.
- **S04** `-scripts/task.bump.ts::mainWith` — default argv / entry composition; **R**, target none;
  low risk. Preserve explicit `input.argv` and the prefixed `bump` command.
- **S05** `-scripts/task.check.graph.ts::main` — default cwd / script; **B** → `Fs.cwd()`; low
  operation risk, subject to cwd/import proof.
- **S06** `-scripts/task.clean.ts::main/deletePattern` — nonrecursive removal / script; **U** →
  `Fs.remove` is a candidate, not equivalent; high risk. Native absence rejects; the facade defaults
  to recursive, preflights, suppresses absence, and retries. Decide race/error behavior before
  scheduling adoption; preserve dry-run and the file-only glob filter.
- **S07** `-scripts/task.info.ts::main/info` — process cwd / script; **B** → `Fs.cwd()`; low
  operation risk, with cwd/import proof.
- **S08** `-scripts/task.jsr.publish.u.ts::pushTriggerTag` — host exit on failed main guard /
  script; **R**, target none; high workflow risk. Exiting prevents subsequent publication mutations.
  Audit reads do not authorize invoking this helper or changing its guard.
- **S09** `-scripts/task.prep.ci.deno.ts::main,text` — running-isolate version / generator; **R**,
  no equivalent established; medium risk. Both reporting and the default generated CI version
  deliberately use the running runtime; `DenoVersion` querying another executable is not equivalent.
- **S10** `-scripts/task.prep.deps.ts::module body` — process cwd / script; **B** → `Fs.cwd()`; low
  operation risk, with cwd/import proof.
- **S11** `-scripts/task.prep.graph.ts::main` — default cwd / script; **B** → `Fs.cwd()`; low
  operation risk, with cwd/import proof.
- **S12** `-scripts/task.prep.ts::syncPackageMetadata` — default cwd / script; **B** → `Fs.cwd()`;
  low risk; Fs is already imported. Preserve caller-supplied roots.
- **S13** `-scripts/task.prep.ts::main` — process cwd / script; **B** → `Fs.cwd()`; low risk;
  preserve one root across the preparation phases, not a fresh cwd at each phase.
- **S14** `-scripts/task.probe.jsr.ts::main,import.meta.main` — default argv and failure exits /
  maintainer entry; **R**, target none; medium risk. Preserve non-OK and caught-error failure codes;
  do not run the publish/probe workflow merely to audit it.
- **S15** `-scripts/task.test.info.ts::main` — argv, current executable, exitCode / entry; **R**,
  target none; medium risk. Process invocation is already facaded. Preserve current executable,
  supplied runner/argv, help behavior, and info only after successful non-help tests.
- **S16** `-scripts/task.test.ts::main` — argv and exitCode / entry; **R**, target none; medium
  risk. Preserve help's early return and exitCode derived from the completed workspace result.
- **S17** `-scripts/task.upgrade.ts::import.meta.main` — argv / entry; **R**, target none; low risk.
  Upgrade execution is outside the audit; acquisition is distinct from the existing CLI parser.

## Root test sites

- **S18**
  `-scripts/-test/-namespace.freeze-closure.test.ts::exported singleton namespace freeze closure` —
  registration / test; **B** → `@sys/testing` `it`; medium risk. This test checks frozen exports,
  not native registration semantics. The inspected BDD adapter registers a top-level `it` through
  `Deno.test`. Prove the same discoverable test name, selection, failure result, and import
  boundary; do not change its dynamically imported participants or exclusions.
- **S19** `-scripts/-test/-task.test.info.test.ts::probe` — exitCode save/read/restore and
  executable assertion / native-effect test; **R**, target none; medium risk. These are assertions
  of the production entry effects, not subprocess setup bypasses; preserve restoration even on
  failure.
- **S20** `-scripts/-test/-task.test.test.ts::interactive parallel run and failure handoff cases` —
  exitCode save/assert/restore / native-effect tests; **R**, target none; medium risk. The supplied
  runner is injected; no native child is launched by these sites. Preserve both success/failure
  codes and restoration. The help-text mention of Deno is not another host operation.

## Workspace production and generated-program sites

Paths below are exact; similarly named CI modules are separate consumers.

- **W01** `code/sys/workspace/src/m.bump/u/u.args.ts::Args.parse` — default argv / host CLI adapter;
  **R**, target none; low risk. Supplied input remains pure parsing; changing the default to `[]`
  would change the public convenience contract rather than contain an existing equivalent facade.
- **W02** `code/sys/workspace/src/m.ci/m.Build/u.sync.ts::sync` — default cwd / production; **B** →
  `Fs.cwd()`; low operation risk, with cwd/import proof.
- **W03** `code/sys/workspace/src/m.ci/m.Build/u.text.ts::text` — default cwd / production; **B** →
  `Fs.cwd()`; low operation risk, with cwd/import proof.
- **W04** `code/sys/workspace/src/m.ci/m.Build/u.write.ts::write` — default cwd / production; **B**
  → `Fs.cwd()`; low operation risk. Preserve when the fallback is evaluated after rendering; do not
  silently merge two independently acquired defaults into a new policy.
- **W05** `code/sys/workspace/src/m.ci/m.Jsr/u/u.sync.ts::sync` — default cwd / production; **B** →
  `Fs.cwd()`; low operation risk, with cwd/import proof.
- **W06** `code/sys/workspace/src/m.ci/m.Jsr/u/u.text.ts::textWith` — default cwd / production;
  **B** → `Fs.cwd()`; low operation risk, with cwd/import proof. This does not reclassify the
  unrelated strings naming the runtime in generated job steps as calls.
- **W07** `code/sys/workspace/src/m.ci/m.Jsr/u/u.write.ts::write` — default cwd / production; **B**
  → `Fs.cwd()`; low operation risk; preserve fallback evaluation timing as for W04.
- **W08** `code/sys/workspace/src/m.ci/m.Build/u.ts::loadJson` — throwing text/JSON read /
  production; **U** → `Fs.readText` or `Fs.readJson` composition; medium risk. Native read/parse
  failures become the cause of `Err.std`. Fs adds structured errors, fatal decoding, and preflight;
  decide which cause/decoding behavior must survive before scheduling replacement.
- **W09** `code/sys/workspace/src/m.ci/m.Jsr/u/u.tmpl.ts::JSR_BODY_TEMPLATE/pkg_name,pkg_version` —
  two native text reads / embedded CI programs; **U** → filesystem owner; medium risk. These are
  child `deno eval` programs, not parent calls. A facade import changes the standalone dependency
  graph and decoding/error policy. Preserve stale-name/version refusal and regenerate workflows from
  the template if a change is later admitted.
- **W10**
  `code/sys/workspace/src/m.ci/m.Jsr/u/u.tmpl.ts::JSR_BODY_TEMPLATE/jsr_package_index_visible` —
  argv and two exit paths / embedded CI program; **R**, target none; medium risk. Preserve the exact
  visibility predicate and failure exit. `JSR_MATRIX_BODY_TEMPLATE` derives from this string; it is
  not an independent source authority. No embedded program or remote request was executed.
- **W11** `code/sys/workspace/src/m.pkg/u.sync.ts::sync` — default cwd / production; **B** →
  `Fs.cwd()`; low operation risk; Fs is already imported.
- **W12** `code/sys/workspace/src/m.cli/mod.ts::import.meta.main` — argv / entry; **R**, target
  none; low risk. Preserve CLI-only acquisition.
- **W13** `code/sys/workspace/src/mod.ts::import.meta.main` — argv / entry; **R**, target none; low
  risk. Preserve deferred CLI import and no argv access on library import.
- **W14** `code/sys/workspace/src/m.info/u.stats.ts::packageStats,normalizeGlobArgs` — default cwd /
  production; **B** → `Fs.cwd()`; low operation risk; preserve caller roots and cwd/import proof.
- **W15** `code/sys/workspace/src/m.info/u.stats.ts::isRegularFile` — throwing stat / production;
  **U** → `Fs.stat` candidate; medium risk. Native NotFound currently rejects a disappearing glob
  match. Returning false for undefined would silently change fail-fast into skipping. Decide and
  prove disappearance/refusal policy at `collectGlobSourcePaths` before replacement.
- **W16** `code/sys/workspace/src/m.info/u.stats.ts::statsBase` — deno/typescript/v8 version reads /
  production reporting; **R**, target none; low risk. The running isolate, not an arbitrarily
  selected executable, supplies these facts.
- **W17**
  `code/sys/workspace/src/m.info/u.stats.ts::canonicalDirectory,assertPackageRootIsNotSymlink,collectPackageSourcePaths`
  — `Deno.FileInfo` annotations / types; **B** → `@sys/fs/t` `Fs.FileInfo`; low type-only risk.
  Native IO already uses Fs. Preserve device/inode and symlink predicates; containment is not type
  portability and requires no runtime import.
- **W18** `code/sys/workspace/src/m.info/u.fmt.ts::RUNTIME_VALUE_COLUMN,fmt` — labels mentioning
  Deno / **Text**, runtime classification and target not applicable; low risk. Width measurement and
  rendered labels do not evaluate the namespace.
- **W19** `code/sys/workspace/src/m.run/t.ts::WorkspaceRun.Package.Ran.signal` — nullable
  `Deno.Signal` / public consumer types; **B** → `@sys/process/t` `Process.InheritOutput['signal']`;
  low type-only risk. The inspected Process contract is exactly `Deno.Signal | null`, exported
  through `src/types.ts → m.process/t.ts → t.proc.ts`; Workspace's common/t.ts already exports
  Process. Preserve readonly/nullability and the child-result meaning. This contains native spelling
  without removing Deno type-library dependence or redesigning signals.
- **W20** `code/sys/workspace/src/m.run/u/u.completion.hang.ts::wrangle.defaultDeps.unrefTimer` —
  timer liveness / production; **G** → time/liveness owner, no matching Time contract established;
  high risk. Replacing unref with ordinary delay can make the diagnostic keep the process alive.
  Preserve cancellation and injected deps; require a concrete owner decision before adding an API.

## Authored repository templates and their generator

- **T01** `code/-tmpl/-scripts/-prep.u.ts::collectTemplateBareImports` — text read / generator;
  **U** → `Fs.readText` composition; medium risk. Read source before import extraction. Native
  errors currently reject; prove explicit result/decoding handling rather than extracting from empty
  data on failure.
- **T02** `code/-tmpl/-scripts/-prep.u.ts::walkFiles` — recursive raw enumeration / generator; **U**
  → Fs traversal composition; medium risk. The observed iterator descends only directories, skips
  `.git`/`node_modules`, yields files, and does not follow symlinks. Preserve those rules, final
  sorting, and read failure behavior; a file-only listing is not its recursive control flow.
- **T03** `code/-tmpl/-scripts/task.prep.ts::parseArgs` — default argv / generator entry; **R**,
  target none; low risk. Preserve explicit input and main-only parsing.
- **T04** `code/-tmpl/-templates/tmpl.repo/-scripts/task.check.graph.ts::main` — default cwd /
  executable teaching template; **B** → `Fs.cwd()`; low operation risk, with cwd/import proof.
- **T05** `code/-tmpl/-templates/tmpl.repo/-scripts/task.info.ts::main` — default cwd / executable
  teaching template; **B** → `Fs.cwd()`; low operation risk, with cwd/import proof.
- **T06** `code/-tmpl/-templates/tmpl.repo/-scripts/task.prep.graph.ts::main` — default cwd /
  executable teaching template; **B** → `Fs.cwd()`; low operation risk, with cwd/import proof.
- **T07** `code/-tmpl/-templates/tmpl.repo/-scripts/task.prep.ts::updatePackages,updateCi,main` —
  three default-cwd sites / executable teaching template; **B** → `Fs.cwd()`; low operation risk.
  Preserve explicit cwd propagation. Edit template input and regenerate its bundle, not just
  generated client repositories; the source `task.prep.ts` imports and calls `makeBundle`.
- **T08** `code/-tmpl/-templates/tmpl.repo/-scripts/task.tmpl.ts::module body` — argv and final exit
  / executable teaching template; **R**, target none; medium lifecycle risk. Process invocation is
  already facaded. Preserve package-target cwd redirection, explicit INIT_CWD, and child exit code.
- **T09** `code/-tmpl/-templates/tmpl.repo/-scripts/task.upgrade.ts::module body` — argv /
  executable teaching template; **R**, target none; low risk. Keep host acquisition separate from
  the existing WorkspaceCli parser.

## Tools production, entrypoints, and type sites

R entries below retain only the named host-entry or CLI termination behavior. They do not exempt
other operations in those files. Unless specified otherwise, their target is none: the inspected
facades parse argv or manage child processes, not arbitrary host acquisition/termination.

- **C01** `code/sys.tools/src/-tmpl.cli/m.cli.ts::cli` — conditional host exit / executable CLI
  template; **R**, medium risk. Preserve signoff, result-to-exit mapping, and the no-exit sentinel.
- **C02** `code/sys.tools/src/-tmpl.cli/mod.ts::import.meta.main` — argv / executable CLI template;
  **R**, low risk. Preserve main-only acquisition and the existing terminal-cwd facade.
- **C03** `code/sys.tools/src/cli.clipboard/mod.ts::import.meta.main` — argv / entry; **R**, low
  risk. Preserve the advisory composition and explicit terminal cwd.
- **C04** `code/sys.tools/src/cli.crdt/m.cli.ts::cli` — conditional exit / CLI; **R**, medium risk.
  Preserve result/signoff ordering; changing exit to return changes the embedding contract.
- **C05** `code/sys.tools/src/cli.crdt/mod.ts::import.meta.main` — argv / entry; **R**, low risk.
  Preserve main guard, advisory composition, and supplied terminal cwd.
- **C06** `code/sys.tools/src/cli.crypto/m.cli.ts::cli` — conditional exit / CLI; **R**, medium
  risk. Preserve exit sentinel and signoff ordering.
- **C07** `code/sys.tools/src/cli.crypto/mod.ts::import.meta.main` — argv / entry; **R**, low risk.
  Preserve main-only acquisition; existing cwd acquisition is already facaded.
- **C08** `code/sys.tools/src/cli.deploy/m.cli.ts::cli` — conditional exit / CLI; **R**, medium
  risk. Interactive and explicit command paths share result-to-exit handling; preserve both.
- **C09** `code/sys.tools/src/cli.deploy/mod.ts::import.meta.main` — argv / entry; **R**, low risk.
  Do not turn advisory wrapping into import-time execution.
- **C10** `code/sys.tools/src/cli.dsl/mod.ts::import.meta.main` — argv / entry; **R**, low risk. DSL
  chapter rendering is distinct from host argv acquisition.
- **C11** `code/sys.tools/src/cli.pi/mod.ts::import.meta.main` — argv / entry; **R**, low risk.
  Preserve its intentional process-cwd selection, not terminal cwd.
- **C12** `code/sys.tools/src/cli.pi/u.run.ts::cliPiWith` — failure exitCode / CLI delegation;
  **R**, medium risk. Existing Process handles the child; preserve child failure propagation and
  DSL-versus-launch permissions. The marked generated specifier has a named prep authority; that
  marker does not establish the whole file as generated or authorize changing launch policy.
- **C13** `code/sys.tools/src/cli.pull/m.cli.ts::cli` — exits for add, unknown command, and normal
  result / CLI; **R**, medium risk. Preserve all three branches and help's early return.
- **C14** `code/sys.tools/src/cli.pull/mod.ts::import.meta.main` — argv / entry; **R**, low risk.
  Preserve import guard and advisory wrapper, not remote materialization execution during audit.
- **C15** `code/sys.tools/src/cli.serve/m.cli.ts::cli` — conditional exit / CLI; **R**, medium risk.
  Exit follows interactive/noninteractive completion; changing server lifetime is not a facade
  spelling change.
- **C16** `code/sys.tools/src/cli.serve/mod.ts::import.meta.main` — argv / entry; **R**, low risk.
  Static-serving library import must not acquire host argv.
- **C17** `code/sys.tools/src/cli.shell/mod.ts::import.meta.main` — argv / entry; **R**, low risk.
  Preserve main-only advisory composition; this does not classify the environment readers below.
- **C18** `code/sys.tools/src/cli.tmpl/mod.ts::import.meta.main` — argv / entry; **R**, low risk.
  Preserve delegated terminal cwd and main guard.
- **C19** `code/sys.tools/src/cli.tmpl/u.run.ts::cliTmplWith` — failure exitCode / delegation;
  **R**, medium risk. Process invocation is already facaded; retain the child failure code and
  declared child permissions. The generated specifier marker is not whole-file generated authority.
- **C20** `code/sys.tools/src/cli.upgrade/mod.ts::import.meta.main` — argv / entry; **R**, low risk.
  Keep acquisition at the executable boundary; no upgrade was invoked.
- **C21** `code/sys.tools/src/cli.video/mod.ts::import.meta.main` — argv / entry; **R**, low risk.
  Preserve the existing facade-based cwd and advisory wrapper.
- **C22** `code/sys.tools/src/common/u.config/u.ensureFile.ts::ensureFile` — refusal exit / CLI
  configuration gate; **R**, high embedding risk. The documented contract exits if creation is
  declined. Returning normally would allow the caller to proceed without configuration. A different
  refusal-return API requires a separate caller/lifecycle decision, not a generic Fs replacement.
- **C23** `code/sys.tools/src/common/u.config/u.prepare.ts::prepare` — refusal exit / CLI
  configuration gate; **R**, high embedding risk. Preserve declined-creation termination after
  normalization; do not fabricate a usable config path or conflate this with filesystem IO.
- **C24** `code/sys.tools/src/mod.ts::import.meta.main` — argv / root entry; **R**, low risk.
  Preserve the explicit `terminalCwd()` helper, whose separate process-cwd site is C31.
- **C25**
  `code/sys.tools/src/u.root/u.upgradeAdvisory.policy.ts::RootUpgradeAdvisoryPolicy.isDisabled` —
  fallback argv / CLI policy; **R**, low risk. Preserve explicit boolean, supplied argv, then
  ambient argv precedence and the opt-out flag.
- **C26**
  `code/sys.tools/src/u.root/u.upgradeAdvisory.policy.ts::RootUpgradeAdvisoryPolicy.isDisabled/env`
  — aliased synchronous env read / production; **U** → process-only Env reader at composition;
  medium risk. The function returns a boolean synchronously and catches native failures as false. An
  async reader or moving reads before the existing short-circuits would change behavior. Trace async
  composition before proposing a new API; preserve injection and refusal handling.
- **C27** `code/sys.tools/src/cli.deploy/u.staging/u.identity.ts::isDirectoryWithIdentity` —
  parameter and predicate `Deno.FileInfo` / types; **B** → `@sys/fs/t` `Fs.FileInfo`; low type-only
  risk. Preserve the dev/ino intersection and fail-closed directory/symlink predicate; runtime IO
  already uses Fs. This does not strengthen the underlying identity evidence.
- **C28** `code/sys.tools/src/cli.serve/m.server/u.serve.json.ts::Args.stat` — metadata annotation /
  types; **B** → `@sys/fs/t` `Fs.FileInfo`; low type-only risk. Reads/listing already use Fs;
  changing the annotation alone is containment, not a change to serving semantics.
- **C29** `code/sys.tools/src/cli.serve/m.server/u.serve.route.ts::Target,resolveDirectoryIndex` —
  metadata annotations in input/output / types; **B** → `@sys/fs/t` `Fs.FileInfo`; low type-only
  risk. Preserve optionality and directory-index behavior; no native stat call is present here.
- **C30** `code/sys.tools/src/cli.serve/t.namespace.ts::ServeTool.StartServingContext.server` —
  `Deno.HttpServer<Deno.NetAddr>` / public types; **U** → existing HttpServer handle type is a
  containment candidate, not a portability proof; medium API risk. Decide whether this public
  low-level context should expose its owning server type before redesigning the type surface.
- **C31** `code/sys.tools/src/u.root/u.cwd.ts::terminalCwd` — process cwd / production; **B** →
  `Fs.cwd()`; low operation risk. Despite the name, the source explicitly rejects ambient INIT_CWD.
  Apply cwd proof; do not use `Fs.cwd('terminal')`.
- **C32** `code/sys.tools/src/cli.crdt/cmd.doc.graph/u.hook.ts::loadDocumentHook` — optional stat /
  production; **B** → `Fs.stat`; medium risk. Missing, directory, or any stat failure means no hook;
  keep dynamic import outside the catch so module-evaluation failures still propagate.
- **C33** `code/sys.tools/src/cli.crdt/cmd.hook/u.hook.ts::loadRootHook` — optional stat /
  production; **B** → `Fs.stat`; medium risk. Prove the same cases and catch boundary as C32.
- **C34** `code/sys.tools/src/cli.shell/u.inspect.ts::inspectShell/env` — injected/live environment
  reader / production; **B** → `@sys/fs/env` `Env.load({ search: 'none' })`; medium risk. The alias
  reads HOME/SHELL through `cleanEnv`; preserve callback precedence and empty/missing handling.
- **C35** `code/sys.tools/src/cli.shell/u.doctor.ts::doctor/env` — injected/live environment /
  production; **B** → process-only Env reader; medium risk. Preserve DENO_INSTALL/PATH normalization
  and nested `inspectShell` injection; no dotenv or extra permission acquisition.
- **C36** `code/sys.tools/src/cli.shell/u.apply.ts::apply/env` — injected/live environment /
  production; **B** → process-only Env reader; medium risk. Keep plan/profile mutation behavior
  outside this change; preserve injection, short-circuit behavior, and live reads.
- **C37** `code/sys.tools/src/cli.shell/u.path.ts::inspectContext/env` — injected/live environment /
  production; **B** → process-only Env reader; medium risk. Preserve supplied profiles/shell and
  missing/empty normalization; do not read or modify actual user shell profiles during this audit.
- **C38** `code/sys.tools/src/cli.upgrade/u.advisory.path.ts::resolveUpgradeAdvisoryPath/env` —
  default `Deno.env` alias then `env.get` / production; **U** → process-only Env at an async
  composition boundary; medium risk. The existing API is synchronous and reads XDG_CACHE_HOME then
  HOME. Preserve explicit reader precedence and path fallback; do not make the API async by stealth.
- **C39** `code/sys.tools/src/cli.upgrade/u.advisory.ts::wrangle.debugRecord` — synchronous env read
  / production; **U** → process-only Env composition; medium risk. Preserve trimming/semver
  rejection and synchronous optional return; an asynchronous constructor is not an expression swap.
- **C40** `code/sys.tools/src/cli.clipboard/u.copy.header.ts::makeHeader` — required stat /
  production; **U** → `Fs.stat` candidate; medium risk. The code reads size/mtime after a throwing
  stat. Decide disappearance/error propagation rather than dereferencing or silently skipping
  undefined; structured text reading later in the function does not establish stat equivalence.
- **C41** `code/sys.tools/src/cli.pull/u.bundle/u.pull/u.pull.dist.ts::populateProjectionStage` —
  abortable binary read / publication consumer; **G** → filesystem owner, no matching Fs signal
  option established; high cancellation/identity risk. Preserve admitted target order, AbortSignal,
  and Rooted publication. Snapshot's bounds/identity protocol is not a transparent replacement.
- **C42** `code/sys.tools/src/u.root/u.upgradeAdvisory.ts::startDetachedRootUpgradeAdvisoryProbe` —
  executable-specific permission query and execPath / authority integration; **R**, high risk. Keep
  query-before-spawn and granted-only admission; Process already owns the detached invocation. Do
  not replace executable identity, request permission, or alter child grants as audit work.

## Native sanitizer and BDD control fixtures

F01–F24 are under `code/sys/testing/src/-test/`; F25 is the separate Vite authority fixture. Each
listed fixture was opened individually. Exact test names identify the owned bodies, not path-based
exemptions. R control records have no public replacement target: a managed replacement changes the
experiment. U harness records name possible targets separately. Risk is medium unless noted. Native
handle types in these files are internal fixture types, not a public type-portability claim.

- **F01**
  `code/sys/testing/src/-test/fixtures/fixture.bdd-top-permission.ts::runs under revoked read permission`
  — native text read and `NotCapable` identity / refusal fixture; **R**, high authority risk. Its
  facade suite has `permissions: 'none'`; both refusal and the native constructor are the assertion.
  Replacing the read with a structured-result facade changes the observation.
- **F02**
  `code/sys/testing/src/-test/fixtures/fixture.clean.ts::sanitizer fixture → clean lifecycle` —
  native registration, open/close, current executable and null-stdio child / positive control;
  **R**. Prove native resources settle; replacing the control with a managed abstraction loses the
  baseline against which facade fixture behavior is compared.
- **F03**
  `code/sys/testing/src/-test/fixtures/fixture.exit-default.ts::sanitizer fixture → default exit interception`
  — registration and exit / interception fixture; **R**. Exit zero must still be intercepted.
- **F04**
  `code/sys/testing/src/-test/fixtures/fixture.exit-opt-out.ts::sanitizer fixture → exit opt-out` —
  registration and exit / opt-out control; **R**. `sanitizeExit: false` and runtime warning are the
  explicit comparison with F03.
- **F05**
  `code/sys/testing/src/-test/fixtures/fixture.explicit-unsanitized.ts::sanitizer fixture → explicit unsanitized timer`
  — registration / native policy control; **R**. Timer construction itself is a Web global, not a
  Deno namespace call. Preserve explicit false sanitizer settings, not a blanket test exemption.
- **F06** `code/sys/testing/src/-test/fixtures/fixture.facade-clean.ts::closes owned lifecycle` —
  raw open/close / facade-run positive control; **R**. Registration already uses `@sys/testing`; the
  native resource supplies the sanitizer observation.
- **F07** `code/sys/testing/src/-test/fixtures/fixture.facade-exit.ts::attempts exit zero` — native
  exit / facade interception fixture; **R**. Do not turn exit into a returned value.
- **F08**
  `code/sys/testing/src/-test/fixtures/fixture.facade-operation-opt-out-resource.ts::module setup and facade per-signal isolation`
  — port-zero listen, native afterAll, pending accept, retained file and its statSync marker;
  internal `Conn`/`FsFile` types / dimension-isolation fixture; **R**. Preserve listener close but
  leak the file deliberately; disabling operation checks must not accidentally disable resource
  checks.
- **F09**
  `code/sys/testing/src/-test/fixtures/fixture.facade-operation.ts::retains an unawaited child status`
  — command/current executable and retained `ChildProcess` / facade leak fixture; **R**. The child
  string `await Deno.stdin.readable.pipeTo(new WritableStream())` is a separate executable stdin
  consumer. Piped stdin is deliberately left pending; owned-child cleanup would invalidate it.
- **F10** `code/sys/testing/src/-test/fixtures/fixture.facade-resource.ts::retains a file` — open
  and retained `FsFile` / facade resource-leak fixture; **R**. Preserve the leaked descriptor and
  statSync marker, not a byte-read convenience API.
- **F11**
  `code/sys/testing/src/-test/fixtures/fixture.operation-only-opt-out.ts::module setup and sanitizer fixture → operation opt-out`
  — native test registration, listener, afterAll, pending accept and internal `Conn` / native
  dimension control; **R**. Preserve operations false/resources true and the independently closed
  listener.
- **F12**
  `code/sys/testing/src/-test/fixtures/fixture.operation-only-strict.ts::module setup and sanitizer fixture → strict operation-only leak`
  — native test registration, listener, afterAll, pending accept and internal `Conn` / native leak
  fixture; **R**. Both sanitizer dimensions stay true; compare with F11, not a managed Net
  operation.
- **F13**
  `code/sys/testing/src/-test/fixtures/fixture.operation-strict.ts::sanitizer fixture → strict child-operation leak`
  — registration, current executable, command, `ChildProcess` and executable stdin program / native
  leak control; **R**. The same child program as F09 must retain the operation intentionally.
- **F14**
  `code/sys/testing/src/-test/fixtures/fixture.operation-with-resource-opt-out.ts::module setup and sanitizer fixture → operation leak with resource opt-out`
  — native test registration, listener, afterAll, pending accept and internal `Conn` / dimension
  control; **R**. Preserve operations true/resources false; it is not permission to weaken the
  suite's sanitizer policy.
- **F15**
  `code/sys/testing/src/-test/fixtures/fixture.resource-only-opt-out.ts::sanitizer fixture → resource-only opt-out`
  — registration, open and retained `FsFile` / native control; **R**. Preserve operations
  true/resources false and the descriptor marker.
- **F16**
  `code/sys/testing/src/-test/fixtures/fixture.resource-strict.ts::sanitizer fixture → strict resource leak`
  — registration, open and retained `FsFile` / native control; **R**. Resources true must expose the
  deliberate leak; do not add cleanup merely to contain Deno.
- **F17**
  `code/sys/testing/src/-test/fixtures/fixture.resource-with-operation-opt-out.ts::sanitizer fixture → resource leak with operation opt-out`
  — registration, open and retained `FsFile` / dimension control; **R**. Operations false must not
  suppress resource failure; compare with F15/F16.
- **F18**
  `code/sys/testing/src/-test/fixtures/fixture.timeout.ts::sanitizer fixture → harness timeout` —
  registration / timing control; **R**. Preserve separate startup delay and body hold; timers
  themselves are Web globals. The outer harness must report execution timeout, not a sanitizer leak.
- **F19**
  `code/sys/testing/src/-test/fixtures/fixture.timer-bare.ts::sanitizer fixture → bare direct timer`
  — registration / inherited-policy control; **R**. No explicit sanitizer override is deliberate;
  compare inherited root policy with explicit controls.
- **F20**
  `code/sys/testing/src/-test/fixtures/fixture.timer-strict.ts::sanitizer fixture → strict timer leak`
  — registration / explicit-policy control; **R**. Preserve explicit true sanitizer settings and
  leaking Web timer; the registration is native but timer creation is not `Deno.*`.
- **F21**
  `code/sys/testing/src/-test/-sanitizer-alarm.test.ts::Deno sanitizer alarm controls,formatReport`
  — native registration and running-version diagnostics / harness; **R**. Opened assertions check
  marker reachability, exit status, leak diagnostics, wrong-reason exclusions, and timeout phase.
  Retain independent native registration rather than using the adapter being compared. Scenario
  definitions are executable harness data, not additional native calls.
- **F22** `code/sys/testing/src/-test/-bdd-contract.test.ts::Deno-native BDD contracts,formatReport`
  — native registration and running-version diagnostics / adapter contract harness; **R**. Opened
  assertions compare public registration symbol identity and subprocess marker/exit results,
  including top-level revoked-read behavior. Do not make the outer control depend on its subject's
  registration semantics.
- **F23**
  `code/sys/testing/src/-test/u.fixture-process.ts::runFixtureProcess,terminateChild,captureStatus,captureOutput`
  — command/current executable, internal `ChildProcess`, child status/kill/streams / harness; **U**
  → Process capture/spawn candidates; high lifecycle risk. The harness separates marker-based
  startup, execution deadlines, and bounded output drain, with owned-handle termination. API
  similarity does not establish that Process reproduces these phases, diagnostics, or byte policy.
  Prove the phases and termination authority before scheduling reuse.
- **F24**
  `code/sys/testing/src/-test/-sanitizer-policy.test.ts::Workspace sanitizer policy,Testing permission lanes`
  — native registration / policy tests; **U** → `@sys/testing` `it` candidate; medium risk. Body IO
  already uses Fs. Unlike the native leak/interception fixtures, these assertions inspect
  configuration; decide whether independent native registration is required by the policy test or
  ordinary facade registration suffices. Do not inherit R from neighboring fixture files.
- **F25**
  `code/sys.driver/driver-vite/src/m.vite.config/-test/u.fixture.import-boundary.ts::module setup` —
  argv and permission queries / import-authority fixture; **R**, high authority risk. Each of
  write/net/run/ffi/sys must not already be granted before imports are tested. Preserve refusal
  inspection and current mode argv; do not request authority or broaden permissions to run it.

## Foundational adapters and non-native matches

- **A01** `code/sys/std/src/m.Ansi/u.stdlib.ts::module initialization,setColorEnabled` —
  destructured global Deno, optional noColor reads / native color adapter; **O** → existing
  `@sys/std/ansi/server` `c`/`colors`; medium initialization risk. Public exports point to
  `m.Ansi/mod.ts`, which imports this inlined implementation. Capture of the namespace and later
  noColor checks are real effects, not upstream copyright prose. Preserve initial enabled state,
  optional-runtime fallback, and refusal to enable color under native noColor. Inlining does not
  make this file an excluded dependency directory.
- **A02** `code/sys/std/src/m.Url/t.ts::Url.Lib.parse` — `Deno.NetAddr` input / public types; **O**
  at the existing URL owner; medium API risk. Structural address input is separate from a native
  network operation; portability needs its own contract decision.
- **A03** `code/sys/std/src/m.Url/u.parse.ts::wrangle.fromAddr` — `Deno.NetAddr` annotation /
  internal types; **O** at the URL owner; low type-only risk. The code builds a URL from fields; no
  native namespace is evaluated by that annotation.
- **A04** `code/sys/std/src/m.Testing.Server/m.Server.ts::TestServer.create,H` — native serve plus
  handler annotations / test-server adapter; **O** → existing `@sys/std/testing/server`
  `Testing.Http.server`; high lifecycle risk. The export chain reaches `m.HttpServer.ts` then
  `TestServer.create`. Preserve loopback/port-zero binding, captured handler errors, native
  shutdown, and handler cleanup. Importing higher-level HTTP into foundational Std is not justified
  by a similar `serve` operation.
- **A05**
  `code/sys/std/src/m.Testing.Server/t.ts::TestHttpServer.server,TestHttpServerInstance.addr` —
  native handler/address / public types; **O**, existing test-server owner; medium API risk. No
  runtime calls occur in these declarations; address/handler portability remains separate.
- **A06** `code/sys/std/src/m.Testing.Server/mod.ts::module documentation` — the parenthesized word
  Deno / **Text**, runtime classification and target not applicable; low risk. The executable module
  wires existing helpers but the lexical match itself names the runtime in prose.
- **A07** `code/sys/std/src/m.Is/t.ts::Is.Lib.netaddr` and
  `code/sys/std/src/m.Is/m.Is.ts::Is.netaddr` — address predicate return/cast / public and internal
  types; **O** at the predicate owner; medium API risk. Opened implementation checks structural
  transport/hostname/port fields; it does not call Deno or authenticate address provenance.
- **A08** `code/sys/std/src/m.Is/u.browser.ts::browser` — `globalThis → g → g.Deno` and optional
  version read / runtime-detection adapter; **O** → existing `Is.browser`; medium risk. Preserve
  browser mock precedence and exclusion of Deno's browser-like globals; an env reader is unrelated.
- **A09** `code/sys/cli/src/m.core/m.Is/u.terminal.ts::module capture,capture,terminal,interactive`
  — global namespace, bracket-selected streams, method capture, later `Reflect.apply` / terminal
  adapter; **O** → `Cli.Is.terminal`/`interactive`; high authority risk. Trace
  `globalThis → runtime.Deno → deno → owner[key] → receiver/prototype method → invoke`. The
  invocation has no Deno token. Preserve descriptor/prototype snapshots, receiver binding,
  replacement refusal, and false-on-provider-failure behavior.
- **A10**
  `code/sys/cli/src/m.core/m.Screen/u.platform.ts::module capture,measureRuntime,createPlatform,createResizeObserver`
  — console-size provider, OS fact, signal methods and aliases / terminal adapter; **O** →
  `Cli.Screen`; high authority/lifecycle risk. Production measurement captures providers and uses
  authority-checked `Reflect.apply`; resize observation obtains a runtime then captures add/remove
  functions for one attachment. The injectable `createPlatform` seam is not identical to production
  measurement. Preserve dimension validation, fallback, Windows unsupported behavior, and paired
  SIGWINCH cleanup; do not describe every provider as having the same capture lifetime.
- **A11** `code/sys/std/src/m.Testing/u.randomPort.ts::randomPort` — native port-zero listener /
  test capability adapter; **O** → existing `@sys/std/testing` `Testing.randomPort`; medium risk.
  `m.Testing.ts → u.ts → u.randomPort.ts` proves the public wiring. Close is in finally. Net's
  common library imports Std; replacing this with a Net import creates an upward edge. Similar
  behavior is not a reason to require a new shared primitive or to remove a legitimate lower owner.
- **A12** `code/sys/std/src/m.Args/t.ts::Args.Parse.Fn documentation` — inline argv example /
  teaching text; native-runtime disposition **n/a**, target n/a; low risk. Retain as an illustration
  of entrypoint acquisition, not an executable operation. The comment explicitly says parsing
  defaults to `[]`. Keep acquisition distinct from parsing; exclude from runtime dispositions.
- **A13** `code/sys/esm/src/m.deps/t.ts::Entry.dev,YamlEntry.dev documentation` — sentence-ending
  Deno / **Text**, runtime classification and target not applicable; low risk. Dependency projection
  prose is not type exposure or a namespace operation.
- **A14** `code/sys/workspace/src/m.info/t.ts::WorkspaceInfo.Runtime documentation` —
  sentence-ending Deno / **Text**, runtime classification and target not applicable; low risk. The
  runtime result's fields are strings; W16 is the actual version acquisition site.
- **A15** `code/sys/cli/src/m.core/m.Screen/-test/-u.platform.test.ts::Cli.Screen platform adapter`
  — injected `Deno:` object keys / mock-only test; native-runtime disposition **n/a**, target n/a;
  medium test-contract risk. Opened cases supply measurements, OS strings, and fake signal methods.
  No native namespace acquisition occurs at these keys. They belong to broader-screen accounting but
  not the namespace candidate set or native-runtime totals. Preserve the injection seam; do not
  replace mocks with real providers to improve lexical matching.

## Native type track: public contracts and consumer annotations

These records are declarations only. O means an evidenced owner declares its native contract, not
that the contract is portable or that a public redesign is admitted. No runtime call is counted.

- **P01** `code/sys/fs/src/m.Fs/t.ts::Fs.FileInfo,DenoMethods.realPath` — native metadata alias and
  `typeof Deno.realPath` / public types; **O** → existing `@sys/fs/t`; medium API risk. The type
  query does not execute realPath. Preserve runtime containment and type portability as separate
  outcomes.
- **P02** `code/sys/net/src/m.Net/t.ts::NetLib.toUrl` — native address input / public types; **O**,
  existing Net owner; medium API risk. Formatting an address does not acquire a listener.
- **P03** `code/sys/net/src/m.Net/t/t.connect.ts::NetConnectResponse.socket` — `Deno.TcpConn` /
  public types; **O**, existing Net owner; high ownership risk. A returned native socket includes
  caller close obligations; an address-only portable shape would lose that contract.
- **P04**
  `code/sys/http/src/http.server/m.HttpServer/t.ts::HttpServer.Lib.options,Started,Print.Options` —
  native ServeOptions/HttpServer/NetAddr / public types; **O**, existing HTTP owner; high API and
  lifecycle risk. Public native `finished` is expressly distinct from joined managed disposal.
  Aliasing these names alone does not remove runtime type-library dependence.
- **P05** `code/sys/server/src/m.server.websocket/t.ts::WebSocketServer.AddressInUseError,Started` —
  native error/server/address / public types; **O**, existing WebSocket owner; high API risk.
  Preserve the original bind-error cause and underlying handle contract. Documentation mentions of
  `Deno.serve` are not calls; actual serving belongs to the implementation audit.
- **P06** `code/sys.driver/driver-automerge/src/m.server/t.ts::SyncServer.Instance.addr` — native
  address / public types; **O**, existing SyncServer contract owner; medium API risk. This says
  nothing about whether its separate server implementation should compose another facade.
- **P07** `code/sys/testing/src/m.server/m.Testing/t.ts::TestingServer.Connect.Result.address` —
  remote/local native addresses / public types; **O**, existing testing capability contract; medium
  API risk. Optional observations are not returned live sockets; retain that distinction.
- **P08** `code/sys.driver/driver-deno/src/m.cloud/m.DenoEntry/t.ts::DenoEntry.EntryFetch` —
  optional `Deno.ServeHandlerInfo` / entry contract types; **O**, Deno entry contract owner; medium
  API risk. The documented result is a fetch-handler object, not an already bound listener. Do not
  replace this contract with managed-host lifecycle merely to hide its type name.
- **P09** `code/sys/fs/src/m.Watch/t.ts::Watch.Event` — `Deno.FsEvent` alias / public types; **O** →
  existing `@sys/fs/t` Watch contract; medium API risk. The export chain is
  `deno.json::./t → src/types.ts → m.Watch/t.ts`. Preserve event kind/path/flag semantics and the
  observable Event type in Watch.Instance; M19's private FsWatcher annotations do not cover this
  public exposure. Containment is not portability and this alias acquires no watcher.
- **P10**
  `code/sys/process/src/m.process/t.proc.ts::Process.Terminate.Action,CaptureExitedOutput,CaptureTimedOutOutput,CaptureCancelledOutput,CaptureFailedOutput,Output,InheritOutput`
  — Signal/CommandStatus declarations / public types; **O** → existing `@sys/process/t` Process
  contracts; high authority/API risk. Export chain:
  `deno.json::./t → src/types.ts → m.process/t.ts → t.proc.ts`. Capture variants expose nullable or
  non-null native status and signal; termination actions and ordinary/inherited outputs expose
  signals. Preserve those differences and owned-child versus ambient-PID authority. K07's private
  annotations and W19's Workspace consumer are separate records, not substitutes for this surface.
- **P11** `code/sys/http/src/http.server/m.HttpServer/u/u.computeEtag.ts::computeEtag` and
  `code/sys/http/src/http.server/m.HttpServer/u.serveFile/u.serveFileWithEtag.ts::serveFileWithEtag`
  — FileInfo parameter annotations / consumer types; **B** → `@sys/fs/t` Fs.FileInfo; medium type
  risk. The file responder is exported from m.HttpServer/mod.ts; computeEtag is its internal helper.
  Native metadata is already acquired through Fs. Preserve optional-stat fallback, isFile admission,
  mtime/size cache decisions and throwing hash-read failure; this record changes no runtime IO or
  response policy. The earlier inventory prose now has an explicit type-plane record.
- **P12** `code/sys.driver/driver-automerge/src/m.server/u.ws.ts::ws/addr` — NetAddr cast / internal
  adapter types; **O**, existing SyncServer address contract; medium type risk. The opened return
  path synthesizes hostname/port after startup probing. This is not address acquisition and does not
  gain extra fields by casting. P06 separately records the public Instance.addr exposure.

- **P13** `code/sys/cell/src/m.cli/-test/u.fixture.kill.ts::cleanup` — ChildProcess parameter /
  private harness type; **U** → existing Process handle contract only if the harness lifecycle also
  changes; medium type risk. The native handle exposes kill/status and output ownership, whereas
  Process.Handle exposes managed disposal/events, not the same shape. No exact public alias was
  established. This annotation is not another child acquisition; Y33 records the parent harness.

## Vite production operations

- **V01** `code/sys.driver/driver-vite/src/-entry/m.Entry.main.ts::mainWith` — fallback argv /
  command entry; **R**, target none; low risk. Preserve supplied parsed input and lazy loading of
  only the requested command graph.
- **V02** `code/sys.driver/driver-vite/src/-entry/u.command/u.serve.ts::DISPATCH_EFFECTS.exitCode` —
  host exitCode / command entry; **R**, target none; medium risk. Preserve injected dispatch effects
  and failure code; do not change the existing DistServer verification path.
- **V03** `code/sys.driver/driver-vite/src/m.vite/u/u.build.ts::build/fail` — opt-in host exit /
  production; **R**, target none; medium lifecycle risk. Preserve `exitOnError` selection and
  diagnostics before exit. Returning an error value is not equivalent to the opt-in host effect.
- **V04**
  `code/sys.driver/driver-vite/src/m.vite/u/u.keyboard.ts::keyboardFactory,wrangle.isUnsupportedKeyboard`
  — exit callback and native BadResource classifier / terminal integration; **R**, target none; high
  cleanup risk. Preserve awaited dispose before quit, supplied effects, and unsupported-input
  classification. `Cli.keepAlive` does not express this existing server lifecycle.
- **V05** `code/sys.driver/driver-vite/src/m.vite.config/u/u.app.ts::wrangle.topLevelPackages` — two
  raw directory iterators / production; **U** → Fs traversal composition; medium risk. It includes
  directory and symlink package entries, excludes dot names, descends exactly one scope level, and
  sorts output. A file-only `FsDir.ls()` loses the candidates; preserve races and failure policy
  before scheduling a walk composition.
- **V06** `code/sys.driver/driver-vite/src/m.vite.config/u/u.app.ts::wrangle.path` — synchronous env
  read / production; **U** → process-only Env composition; medium risk. The caller expects a
  synchronous resolved path or empty string. Preserve empty normalization and permission refusal;
  identify an async composition seam before changing the contract.
- **V07** `code/sys.driver/driver-vite/src/m.vite.config/u/u.oxcPreflight.ts::errorText` — native
  object inspection / diagnostics; **U**, no matching facade established in inspected CLI/Str type
  surfaces; medium risk. Native depth 4/no-color formatting handles non-Error/non-string values.
  JSON serialization changes cyclic/object/function behavior; a missing convenience is not enough
  evidence to admit a new shared API. Preserve the original cause and fail-closed startup preflight.
- **V08** `code/sys.driver/driver-vite/src/common/u.perf.ts::perf.state` — two synchronous env reads
  / diagnostics; **U** → process-only Env composition; medium risk. Lazy state is cached on
  globalThis. Do not introduce import-time permission access, async initialization, or live reads
  where the current derived state is intentionally cached.
- **V09** `code/sys.driver/driver-vite/src/common/u.perf.ts::perf.prefix` — conditional pid read /
  diagnostics; **R**, no generic PID facade established; low risk. Only verbose levels report the
  running host PID; child Process handles do not identify that host.
- **V10** `code/sys.driver/driver-vite/src/m.vite.transport/u.resolve/u.trace.ts::trace.enabled` —
  synchronous env read / diagnostics; **U** → process-only Env composition; medium risk. Preserve
  per-call observation, accepted false spellings, and synchronous return; unlike V08, this site does
  not cache the decision.
- **V11**
  `code/sys.driver/driver-vite/src/m.vite.config/u/u.app.specifierRewrite.ts::wrangle.warmNpm` —
  current executable and captured command / compiler integration; **U** → Process candidate; medium
  risk. Native stdout is null and stderr is piped. Preserve command identity, environment,
  success/error reporting, and no FORCE_COLOR injection unless explicitly admitted.
- **V12** `code/sys.driver/driver-vite/src/m.vite/u.dev/u.screen.ts::wrangle.isInteractive` —
  current stdin/stdout terminal calls / production; **U** → `Cli.Is.interactive`; high authority
  risk. The source observes fresh global providers and catches failures. A09 captures and validates
  provider identity; decide that behavior change explicitly and preserve injected reporter policy.

## Enumeration, hosting, and filesystem compositions

These records normalize the formerly prose-only decisions and extend the filesystem review. They are
counted separately from the historical S/W/T/C/F/A/P/V increment. U records below are inspected
semantic decisions, not unopened candidates. No record exempts other operations in its file.

- **E01** `code/sys/yaml/src/m.cli/m.YamlConfig/u.fs/u.ts::listConfigs` — native immediate directory
  enumeration / production; **U** → Fs traversal composition; medium risk. It selects only files
  with the requested extension and preserves iterator order. Prove depth, failure, and ordering
  before replacing it with a listing or walk.
- **E02** `code/sys/yaml/src/m.cli/m.YamlConfig/u.fs/u.file.ts::migrateDir,countDirEntries` — native
  enumeration / production; **U** → Fs traversal composition; high deletion risk. The migration
  selects files, but the final count includes every remaining entry, including directories and
  symlinks. A file-only listing can incorrectly declare the source empty and delete residual data.
- **E03** `code/sys.model/model-slug/src/m.fs/m.SlugTree/u.fromDir.ts::readDir` — native enumeration
  / production; **U** → Fs traversal composition; medium risk. Preserve file/directory flags, ignore
  rules, optional case-insensitive sorting, and the recursive caller's README-as-index policy.
- **E04** `code/sys.driver/driver-monaco/src/m.Vite/m.MonacoVite/u.tree.ts::inspectTree/visit` —
  native enumeration / production; **U** → Fs traversal composition; high admission risk. Every
  returned entry is separately lstat'ed; disappearance, symlinks, and special entries fail.
  Enumeration that silently filters them changes the safety decision. `readRegularFile` already uses
  Fs.
- **E05** `deploy/@draft.shell/-scripts/task.kill.ts::module body` — native Command/current
  executable/status / script; **U** → `Process.inherit`, medium risk. Preserve sequential task
  execution, first nonzero code, absence of extra environment policy, and inherited streams.
  Process's FORCE_COLOR injection is a difference, not an approved change. Host exit is E13.
- **E06** `deploy/@tdb.slc/-scripts/-serve.ts::module body` — native serve / launcher; **U** →
  `@sys/http/server/host` `start`; high lifecycle risk. Preserve port 8080, existing
  options/reporting, and one keyboard owner. Application creation and keyboard handling are already
  facaded.
- **E07** `deploy/@tdb.slc.fs/-scripts/-serve.ts::module body` — native serve / launcher; **U** →
  managed HTTP host; high lifecycle risk. Preserve static directory/report options and eliminate no
  lifecycle responsibility by implication; compare with E06 without conflating the two launchers.
- **E08** `deploy/sample.proxy/src/entry.ts::import.meta.main` — native serve / launcher; **U** →
  managed HTTP host; medium risk. The exported fetch application is separate from main-only binding.
  Preserve native default binding/listener behavior or explicitly decide the managed loopback and
  shutdown policy before adoption.
- **E09** `code/sys/fs/src/m.Fs/m/m.Size.ts::Size.dir` — native stat after file-only walk /
  higher-level owner composition; **U** → local `stat`; medium risk. The walk can race
  disappearance; the native call currently rejects. Preserve failure versus skip semantics; Fs
  package location alone is not an adapter justification.
- **E10** `code/sys/fs/src/m.Fs/m/m.Tilde.ts::Tilde.expand,collapse` — native HOME reads / path
  adapter; **O** → existing `Fs.Tilde`; medium synchrony risk. Both methods are synchronous, read
  live, and return input unchanged without HOME. An asynchronous Env constructor is not equivalent.
- **E11** `code/sys/fs/src/m.Fs/u/u.toFile.ts::wrangle.base` — default cwd / owner composition;
  **B** → existing local `cwd()` primitive; low risk. Preserve explicit base normalization, absolute
  path precedence, and the point at which relative input acquires process cwd. No new public API.
- **E12** `code/sys/fs/src/m.Fs/u/u.copy.dir.ts::copyDir` — raw enumeration and NotFound identity /
  copy adapter; **O** → existing `Fs.copyDir`; medium error risk. Recurses only directories, copies
  files via local copyFile, skips other entry kinds, and accumulates native errors. Preserve filter
  folder suffixes, force removal, and throw/log behavior; a filtered file-only listing is not the
  recursive adapter contract.

- **E13** `deploy/@draft.shell/-scripts/task.kill.ts::module body/final exit` — host exit / script;
  **R**, target none; medium lifecycle risk. Preserve first-failure aggregation and exit only after
  both task children have settled. It is not part of the invocation substitution in E05.

W/V/C records already normalize the other consumer decisions in the inventory's cwd, env, read/stat,
process/terminal, and repository-template prose. Pi source-template decisions are N01–N05 below.
Specific owner operations are accounted by M/K/Z/Q records; the owner map remains evidence, not an
additional record-count increment.

## Standalone extensions and additional production boundaries

These source-reviewed records concern exact operations only. For grouped paths, each path and
operation is explicitly named; the grouping does not classify unrelated occurrences. R means a
specific runtime contract, not permission to copy this pattern elsewhere.

- **N01**
  `code/sys.driver/driver-pi/src/m.core/m.extension/m.sandbox/tmpl/u.path.ts::Fs,resolvePath,lstat,removePath,isNotFound`
  — native rename/copyFile capture, cwd, lstat, remove, and NotFound identity / executable template;
  **U** → Fs/observe candidates; high guard risk. The local bag is not the public Fs facade. Removal
  is nonrecursive by default and rejects absence; copy does not add facade parent/overwrite policy.
  Preserve lexical Windows/UNC resolution, missing-only translation, native refusal, and bootstrap
  dependency closure. Template packaging is not a retention reason by itself.
- **N02** `code/sys.driver/driver-pi/src/m.core/m.extension/m.ocr/tmpl/u.path.ts::resolvePath` — cwd
  / executable template; **U** → `Fs.cwd()` candidate; high guard/import risk. Preserve the authored
  lexical drive/UNC/path normalization and standalone import graph before adopting a remote helper.
- **N03** `code/sys.driver/driver-pi/src/m.core/m.extension/m.ocr/tmpl/u.guard.ts::lstat,isNotFound`
  — native lstat/NotFound plus internal metadata annotations / executable guard; **U** → narrow
  `@sys/fs/observe` candidate; high authority risk. Preserve final/intermediate symlink refusal,
  regular-PDF restriction, root checks, and blocked diagnostics. Do not replace the guard with
  ordinary path resolution or broaden launcher grants to initialize a dependency.
- **N04**
  `code/sys.driver/driver-pi/src/m.core/m.extension/m.ocr/tmpl/u.run.ts::runOcrPdfWithCommand,cleanupTempDir`
  — recursive mkdir, temp directory, recursive remove / executable template; **U** → Fs candidates;
  high lifecycle risk. Preserve admitted tmpRoot, one temp owner, cancellation, cleanup in finally,
  and cleanup failures as returned details. Fs.remove's missing suppression/retries differ.
- **N05**
  `code/sys.driver/driver-pi/src/m.core/m.extension/m.ocr/tmpl/u.command.ts::runDenoCommand,terminate,kill`
  — Command/owned child, status/streams/kill and internal child/status/signal types / executable
  template; **U** → `Process.capture`; high lifecycle risk. Match byte caps, continued draining,
  failed-start/cancel/timeout flags, current termination waits, and no implicit color environment.
  Similar option names do not prove the same deadline or output contract.
- **N06** `code/sys/cell/-scripts/u.cli.vite.ts::runVite/process facts and signals` — build OS,
  current executable, add/remove signal listener, internal Signal annotations / launcher; **R**,
  target none; high lifecycle risk. The owner coalesces interrupts, signals the owned detached group
  once, and restores captured terminal mode after cleanup. Process.inherit has no owned process
  group handle; Cli.keepAlive terminates the parent and is not an equivalent signal subscription.
- **N07** `code/sys/cell/-scripts/u.cli.vite.ts::runVite/cwd` — process cwd / launcher; **B** →
  `Fs.cwd()`; low operation risk. Preserve acquisition after signal setup and before spawn.
- **N08** `code/sys/cell/-scripts/u.cli.vite.ts::stty` — native Command with inherited stdin and
  captured output / terminal adapter; **G** → process/terminal owner, no matching mixed-stdio
  surface established; high cleanup risk. Preserve exact saved mode, 2-second deadline, child-handle
  kill, and surfaced failure. Do not substitute captured/null stdin or ambient PID signalling.
- **N09** `code/sys/cell/src/m.cli/u.lifecycle/u.shutdown.ts::DEFAULT_DEPS,createShutdownSignal` —
  add/remove signals and exit / lifecycle integration; **R**, target none; high risk. Defaults flow
  through deps.addSignalListener/removeSignalListener/exit; retain first-request-wins and
  second-interrupt exit 130, failed-removal retry, and disposal authority. Internal Signal types
  express the seam, not an additional runtime operation.
- **N10** `code/sys/cell/src/m.cli/u/u.exit.ts::setExitCode` — native exitCode / integration; **R**,
  target none; medium risk. Publish the same result to Deno and Node because terminal exit hooks
  observe Node state. Containment must not silently remove either write.
- **N11** `code/sys/cell/src/m.cli/u/u.session.ts::write` and
  `code/sys/cell/src/m.cli/u.lifecycle/u.start.ts::startCell` — current PID / session integration;
  **R**, no generic host-PID facade established; medium risk. Preserve stored owner PID and temp
  filename use; a child PID or arbitrary process lookup is not equivalent.
- **N12** `code/sys/cell/src/m.cli/u/u.session.ts::runtimeRoot` — synchronous env fallback /
  production; **U** → process-only Env at composition; medium risk. Preserve explicit dir, custom
  root, XDG, TMPDIR/TMP/TEMP, UID/USER order. Nullish fallback distinguishes absent from empty;
  Env.get's empty-string result is not an expression-equivalent replacement.
- **N13** `code/sys/http/src/-serve/u.start.ts::start` — native serve and internal address type /
  launcher; **U** → managed HTTP host; high lifecycle risk. Preserve resolved keyboard policy,
  actual assigned port, reporting options, and single cleanup owner. Being in HTTP does not make
  this higher-level launcher the native host adapter.
- **N14** `code/sys/http/src/http.server/m.HttpServer/u.print/u.print.ts::trimCwd` and
  `code/sys/http/src/http.server/m.HttpProxy/mod.ts::import.meta.main` and
  `code/sys/http/src/http.server/m.HttpStatic/mod.ts::import.meta.main` — process cwd / production
  formatting and entries; **B** → `Fs.cwd()`; low operation risk. Keep trimCwd's existing lexical
  prefix policy and entry fallback timing. Argv/exit are separate from cwd adoption.
- **N15** `code/sys/http/src/http.server/m.HttpServer/u/u.keyboard.ts::DEFAULT_DEPS.exit,bind` —
  captured native exit and internal typeof exit / lifecycle integration; **R**, target none; high
  cleanup risk. Alias flow is DEFAULT_DEPS → deps.exit → onQuit completion. Exit must follow
  successful asynchronous disposal, not replace server ownership with Cli.keepAlive.
- **N16** `code/sys/http/src/http.server/m.HttpServer/u/u.serveStatic.ts::serveStaticWith/catch` —
  native NotFound identity / serving integration; **R**, target none; medium risk. The catch also
  covers downstream file serving after Fs.stat. Removing it because stat maps absence would miss a
  later read race; non-NotFound errors must continue to propagate.
- **N17** `code/sys/net/src/m.Net/m.Port.ts::createPort` and
  `code/sys/net/src/m.Net/u/u.probe.ts::createPortProbe` — native listen, address cast, native error
  identities and internal listener types / adapter; **O** → existing `Net.Port`; high authority
  risk. Preserve port-zero close in finally, unsupported-only IPv6 caching, uncached refusal, and
  cleanup-failure distinction. createPort retains the supplied callback; its default callback looks
  up Deno.listen on each invocation, not at module capture. Preserve that lookup lifetime. Neither
  the callback nor a successful probe is a permission grant.
- **N18** `code/sys/testing/src/m.server/m.Testing/u/u.connect.ts::connect` — one-shot native
  connect, copied address observations, close / test capability; **U** → `Net.connect` with explicit
  attempt policy; medium risk. Default Net retries/delay and normalized result differ; prove
  elapsed, refused/error, immediate close, and import direction before replacing this boundary.
- **N19** `code/sys/cli/src/m.core/u/u.clipboard.ts::copyToClipboard,detectCmd` — native Command,
  piped stdin, NotFound and OS selection / clipboard adapter; **G** → process owner, no matching
  piped-stdin surface established; high lifecycle risk. Preserve sequential utility fallback only
  for NotFound, byte write/close, status, and returned tried/error data. CLI ownership is not proof
  that generic Process invocation can represent this contract.
- **N20** `code/sys/cli/src/m.core/u/u.keepAlive.ts::keepAlive` — SIGINT listener/cleanup and exit /
  CLI lifetime adapter; **O** → existing `Cli.keepAlive`; high lifecycle risk. Retain finally
  cleanup, lifecycle completion, and deliberate parent termination after disposal.
- **N21** `code/sys/cli/src/m.core/m.Keyboard/u.bind.ts::bindWith/listening` — opt-in native exit /
  keyboard lifetime adapter; **O** → existing `Cli.Keyboard.bind`; high risk. Exit follows awaited
  onQuit and occurs only under the explicit option. Replacing it with a return changes host
  behavior.
- **N22** `code/sys.driver/driver-automerge/src/m.worker/u.host.publishCommands.ts::publishCommands`
  — native serve/upgrade / production; **U** → `WebSocketServer` candidate; high lifecycle risk.
  Preserve browser/proxy refusal, 400 non-upgrade response, silent bind, CRDT host attachment and
  socket failure cleanup. The function does not retain its native server handle; establish worker
  teardown and dependency direction before adopting managed hosting.
- **N23** `deploy/@tdb.edu.slug/src/m.slug.compiler/m.bundle/u.menu.ts::ensureProfiles` and
  `deploy/@tdb.edu.slug/src/m.slug.compiler/m.lint/u.lint.menu.ts::ensureProfiles` — native
  immediate enumeration / production; **U** → Fs listing composition; medium risk. Preserve file and
  extension filtering, iterator order selecting the noninteractive first profile, and default
  creation only when no matching file exists.
- **N24** `deploy/@tdb.edu.slug/src/m.slug.compiler/m.bundle/u.migrate.-01.ts::countDirEntries` and
  `deploy/@tdb.edu.slug/src/m.slug.compiler/m.lint/u.migrate.-01.ts::countDirEntries` — native
  all-entry enumeration / production migration; **U** → Fs traversal composition; high deletion
  risk. Count directories, links, and special entries too; stop parent deletion on any survivor and
  preserve the named @tdb boundary. A file-only result is unsafe.
- **N25** `code/sys.driver/driver-deno/src/m.cloud/m.DenoDeploy/m.stage/-tmpl.note/mod.ts::dirBytes`
  — native enumeration/stat / generator; **U** → Fs traversal/stat composition; medium risk.
  Recursion applies exclusions by name at every level, ignores non-file/non-directory entries, and
  currently rejects a disappearing file's stat. Match those semantics, not just total size.
- **N26** `code/sys.driver/driver-cloudflare/-sample/deploy/src/-entry.ts::main` and
  `code/sys.driver/driver-cloudflare/-sample/deploy/src/m.deployment/u.app.ts::appFrom` — default
  Deno.env alias passed to credential lookup / production; **B** → process-only Env reader at the
  existing async boundary; high authority risk. Preserve explicit reader precedence, input snapshot
  before credential reads, no dotenv discovery, no credential output, and native permission refusal.
  No credential value was read for this audit; missing/empty normalization still needs regression
  proof.
- **N27** `code/sys.driver/driver-pi/-scripts/u.test.release.ts::runFrozenBrowser` — env alias
  get/delete / launcher; **R**, no mutation facade established; high authority risk. Admission must
  settle successfully before reading the admitted executable; delete CHROME_BIN from the launcher
  before starting the frozen browser child. Env.get alone cannot represent this authority transfer.
- **N28** `code/sys.driver/driver-pi/src/m.cli/u/u.env.ts::env,PiEnv.toShellPath,toTmpDir` — live
  synchronous env reads via local function / CLI composition; **U** → process-only Env composition;
  medium risk. toShellPath is synchronous, toTmpDir async with a platform-temp probe. Preserve
  short-circuit precedence and no probe when a configured env value exists; do not make both async
  or construct dotenv readers as a namespace cleanup.

## Filesystem adapter accounting

M01–M10 normalize the exact owner-map IO boundaries already cited in inventory.md. The source paths
below use prefix `code/sys/fs/src/`; each row covers only the named operations. O retains native
substrate at the existing public owner, with no replacement target and no portability claim. General
Fs error/default differences are documented in owners.md; they remain migration proof obligations.

- **M01** `m.Fs/u/u.read.ts::handleRead/readFile` — adapter; **O**; medium risk. Bytes feed
  structured read results and fatal decoding.
- **M02** `m.Fs/u/u.write.ts::write/writeTextFile,writeFile` — adapter; **O**; medium risk. Preserve
  parent creation, overwrite, and result/error policy.
- **M03** `m.Fs/u/u.stat.ts::stat/stat,NotFound` — adapter; **O**; medium risk. Only NotFound
  becomes undefined; other failures propagate.
- **M04** `m.Fs/u/u.lstat.ts::lstat/lstat,NotFound` — adapter; **O**; high risk. Observe links
  rather than following the final component.
- **M05** `m.Fs/u/u.realPath.ts::realPath` — adapter; **O**; medium risk. Native function identity
  is captured on import.
- **M06** `m.Fs/u/u.rename.ts::rename` — adapter; **O**; high risk. Preserve native rename; do not
  add copy/delete fallback.
- **M07** `m.Fs/u/u.remove.ts::remove/remove,NotFound` — adapter; **O**; high risk. Recursive
  default, absence handling, and selected retry policy belong here.
- **M08** `m.Fs/u/u.makeTmpDir.ts::makeTempDir` — adapter; **O**; medium risk. The native path is
  projected into an FsDir, not returned unchanged.
- **M09** `m.Fs/u/u.copy.file.ts::copyFile/NotFound` — adapter; **O**; medium risk. Preserve
  filter/force/parent policy and collected errors.
- **M10** `m.Fs/u/u.cwd.ts::cwd` — adapter; **O**; medium risk. Preserve process cwd versus explicit
  terminal INIT_CWD policy.
- **M11** `m.Fs.capability/m.Rooted/u/u.io.ts::DEFAULT_IO` — adapter; **O**; high risk. Captured
  native IO and descriptor-bound mode adaptation support identity and confinement. References flow
  through withIo to protocol operations; ordinary Fs calls cannot replace them.
- **M12** `m.Snapshot/u/u.io.ts::DEFAULT_SNAPSHOT_IO` — adapter; **O**; high risk. Captured
  lstat/open feed owned-handle observation; preserve capture lifetime and read-only open.
- **M13** `m.Pkg.Dist/u.verify/u.io.ts::DEFAULT_IO,ioFailure` — adapter; **O**; high risk. Preserve
  late native method access, exact handle/tree IO, and NotSupported translation. Capture policy
  differs from M11/M12.
- **M14** `m.Fs.capability/u/u.Files.atomic.ts::writeCompleteTemp,removeTemp` — adapter; **O**; high
  risk. Preserve createNew open, complete writes, sync/close, nonrecursive removal, and missing-only
  suppression; ordinary Fs.write/remove differ.
- **M15** `common/u.is.ts::isDir,isFile` — adapter; **O**; medium risk. Preserve existence preflight
  and native stat under false-on-failure predicates, including the catch policy.
- **M16** `common/u.is.ts::isBinary/readFile` — composition; **U** → local read primitive; medium
  risk. Structured values differ from throwing failures; preserve missing preflight and byte
  heuristic before adoption. The current read is whole-file, not bounded to the sampled 8 KiB.
- **M17** `m.Env/u.load.ts::load,fileExists` — adapter; **O**; high risk. Process cwd/stat/get/has
  implement the existing reader. Search none skips dotenv/cwd, missing maps to empty, and live
  permission refusal remains native.
- **M18** `m.Env/m.Is.ts::isVsCode` — adapter; **O**; medium risk. A native env snapshot feeds the
  synchronous vscode predicate; no general snapshot replacement was established.
- **M19** `m.Watch/m.Watch.ts::Watch.start` — adapter; **O**; high risk. Native watchFs and owned
  watcher iteration/close implement recursive filtering and disposal. Internal watcher types are
  accounted here, not as additional runtime operations.
- **M20** `m.Path/m.Path.ts::Path.cwd,trimCwd` — adapter; **O**; medium risk. Preserve captured cwd
  identity, default process cwd, and lexical prefix policy.
- **M21** `m.Pkg.Dist/u/u.compute.ts::createManifest` — runtime reporting; **R**, target none; low
  risk. Version alias v supplies running-isolate deno/v8/typescript metadata, not content identity
  or a queried executable's version.
- **M22** `m.Snapshot/u/u.selection.ts::PATH_SEPARATOR` — runtime integration; **R**, target none;
  high risk. OS separator supports ancestor inspection; preserve Windows segmentation and strict
  descendant checks.
- **M23** `m.Fs/u/u.walk.ts::walkUp` — composition; **U** → local stat primitive; medium risk.
  Native starting-path stat rejects absence; the local candidate returns undefined. Preserve
  starting-file parent selection, errors, callback stop, and cached files. The owner map's adapter
  label does not prove this higher composition must retain native stat.

M22's read includes the complete selection helper. Other Rooted/Snapshot/Dist helpers are separately
classified by Z01–Z06; they are not implicitly covered by M11–M14.

## Additional source-reviewed test boundaries

- **X01** `code/sys/fs/src/m.Fs/-test/-.test.ts::API,Fs.cwd` — native realPath identity, cwd,
  terminal INIT_CWD read / owner contract test; **R**, target none; medium risk. Native values are
  the independent oracle for the facade, not setup to replace with the subject under test.
- **X02** `code/sys/fs/src/m.Fs/-test/-fs.path.ts::resolve` and
  `code/sys/fs/src/m.Fs/-test/-m.Tilde.test.ts::Fs.Tilde` — HOME save/get/set/delete/restore /
  controlled environment fixtures; **R**, no mutation facade established; medium risk. Preserve
  absent versus empty state and existing restoration. This retention is not approval of broader HOME
  access or evidence that the tests were executed.
- **X03** `code/sys/fs/src/m.Fs.capability/m.Rooted/-test/u.fixture.ts::setup` — recursive mkdir /
  ordinary fixture setup; **U** → Fs.ensureDir candidate; medium risk. Confirm existing-root, link,
  and failure behavior independently of the Rooted test substrate before adopting it.
- **X04** `code/sys/fs/src/m.Fs.capability/m.Rooted/-test/u.fixture.ts::removeFixture` — native OS,
  chmod/readDir/nonrecursive remove / fixture disposal; **U** → Fs/owner-specific cleanup; high
  risk. Restore owner access only on directories; files may be hard-linked outside. Preserve no
  symlink following, all-entry visitation, error propagation, and the settled-tree contract. Do not
  replace the protocol with recursive Fs.remove or call it a generic production primitive.
- **X05** `code/sys/fs/src/m.Fs.capability/m.Rooted/-test/u.fixture.lease.process.ts::module body`
  and
  `code/sys/fs/src/m.Fs.capability/m.Rooted/-test/u.fixture.removeTreeBatch.process.ts::module body`
  — argv, async stdout marker, blocking stdin read / executable process fixtures; **R**, target
  none; high ordering risk. Emit acquired only after lease acquisition, hold until parent release,
  then release the lease. Synchronous Process.stdout and managed byte reads are not assumed equal.
- **X06** `code/sys/fs/src/m.Pkg.Dist/-test/u.fixture.local.permission.process.ts::module body` —
  argv and deliberately denied ancestor lstat/NotCapable / authority fixture; **R**, target none;
  high risk. Native refusal precedes the public bounded verify/read. Replacing it with a structured
  read changes the independent observation; do not broaden child grants to make the test pass.
- **X07**
  `code/sys/net/src/m.Net/-test/-m.Port.selection.test.ts::mockListen,actual network refusal` — Deno
  namespace/descriptor replacement, native error constructors, registration and restricted net
  policy / native adapter contract; **R**, target none; high authority risk. Preserve exact
  descriptor restoration, no-IO zero preference, and refusal identity rather than search exhaustion.
  The internal ListenOptions annotation is not another native call.
- **X08**
  `code/sys/net/src/m.Net/-test/-m.Port.probe.test.ts::Net.Port probe evidence,denied IPv6 inspection`
  — native errors, real listeners, address annotations, native registration / adapter contract;
  **R**, target none; high risk. Real listeners independently prove ports reusable after failure;
  managed probing through the subject would be circular. Preserve using/close and restricted IPv4
  permissions, uncached IPv6 refusal, and exact native constructor assertions.
- **X09** `code/sys/cell/src/m.cli/-test/u.fixture.cli.vite.child.ts::module body` — argv, serve,
  signals, PID, native child/execPath and exit / process-tree control; **R**, target none; high
  lifecycle risk. Leader-exit intentionally leaves the leaf alive to falsify group cleanup. A
  managed child helper that closes descendants would erase the experiment.
- **X10** `code/sys/cell/src/m.cli/-test/-u.exit.test.ts::CLI exit status` — exitCode save/assert/
  restore / host-effect test; **R**, target none; medium risk. Independent assertions pin both Deno
  and Node status before exit hooks; retain finally restoration.
- **X11** `code/sys/cli/src/m.core/m.Spinner/-test/-.test.ts::maps semantic creation targets` —
  NODE_ENV save/set/get/delete/restore / library-environment fixture; **R**, no matching mutation
  facade established; medium risk. The controlled value activates Ora's test stream behavior and is
  restored in finally. It is not an ordinary production Env reader.

## Process adapter accounting and internal native types

- **K01** `code/sys/process/src/m.process/u/u.ts::asCommand` — native Command/current executable /
  adapter; **O** → existing Process invocation family; high policy risk. Preserve caller command,
  args, cwd, clearEnv, stdio, and optional forceColor policy. This is the lower native boundary;
  higher callers do not automatically acquire its exemption.
- **K02** `code/sys/process/src/m.process/u/u.stdout.ts::stdout,createStdout,writeAll` — native
  stdout capture and later aliased writer calls / adapter; **O** → existing `Process.stdout`; high
  initialization risk. Trace captured stdout → runtime.stdout → writer.writeSync. Preserve complete
  UTF-8 writes, no-progress error, terminal failure fallback, and capture lifetime.
- **K03** `code/sys/process/src/m.process/u/u.pid.ts::isRunning,signal` — synchronous native kill
  command and Deno.kill / PID adapter; **O** → existing Process PID/Terminate surface; high
  authority risk. This deliberately owns ambient-PID effects. Do not reuse it for owned-child
  cleanup; preserve PID validation, signal action records and bounded escalation.
- **K04**
  `code/sys/process/src/m.process/u/u.port/u.discovery.ts::commandOutput,commandStdout,tcpListeners`
  — native Command/NotFound/OS discovery / owner composition; **U** → local `asCommand` or Process
  capture candidate; medium risk. Preserve no injected FORCE_COLOR, missing-executable-only
  fallback, lsof/ss parsing, exit 1/no-output semantics, and other acquisition failures as causes. A
  public bounded capture changes unbounded output policy; check local import direction before
  adoption.
- **K05** `code/sys/process/src/m.open/u.resolveCommand.ts::resolveCommand` and
  `code/sys/process/src/m.open/u.invokeDetached.ts::commandsFor,invokeDetachedWithOs,invokeDetached`
  — native OS and NotFound identity / Open adapter; **O** → existing `Open`; medium risk. Preserve
  explicit OS override, Linux/WSL utility order, synchronous missing-command fallback and original
  refusal propagation. Child launch itself already composes Process.
- **K06**
  `code/sys/process/src/m.process/u/u.child.owned.ts::observeChildStatus,terminateOwnedChild,sendSignal`
  — owned child status/kill and internal ChildProcess/CommandStatus annotations / adapter; **O** →
  existing owned Process lifecycle; high authority risk. The input handle, not a PID lookup, is
  signalling authority. Preserve per-phase failure ordering, grace/settlement budget, and visibility
  of incomplete termination. Internal native types are accounted here, not as public exposures.
- **K07**
  `code/sys/process/src/m.process/u.proc/u.capture.ts::SpawnChild,captureWith,terminateForCapture,exitedOutput,timedOutOutput,cancelledOutput,failedOutput`,
  `code/sys/process/src/m.process/u.proc/u.spawn.ts::OwnedState,SpawnDependencies,spawnWith/setupStreams,childExitedBeforeReadyError`,
  and `code/sys/process/src/m.process/u/u.ts::toProcOutput` —
  ChildProcess/CommandStatus/CommandOutput annotations / private types; **O**, existing Process
  owner; medium type risk. Acquisition already flows through asCommand; output projection preserves
  status/signal and lazy text. These references are not additional Command calls. Public
  Signal/CommandStatus exposure is separately P10, not implicitly covered by this private record.
- **K08** `code/sys.driver/driver-cloudflare/-sample/deploy/src/m.deployment/t.ts::EnvReader` —
  typeof Deno.env/get projection / types; **U** → `Env.Reader` compatibility candidate; medium API
  risk. Native get returns undefined; the owning reader's get returns string. N26's credential
  consumer rejects both absent/empty, but that does not by itself justify rewriting the shared type.

## Further production and type classifications

- **L01** `code/sys/server/src/m.server.dist/u.server/u.error.ts::NativeAddrInUse,startupReason` —
  native error-constructor capture then instanceof alias / startup adapter; **O** → existing
  DistServer error boundary; high diagnostic risk. Preserve Native.error admission, captured
  constructor identity, and fixed names-only output; never retain or print arbitrary causes.
- **L02**
  `code/sys/server/src/m.server.bootstrap-status/u/u.listener.ts::LowerOwner,snapshotLowerOwner` and
  `code/sys/server/src/m.server.dist/u.server.start/u.lifecycle.ts::ListenerOwner,snapshotListenerOwner`
  — HttpServer/NetAddr annotations and casts / internal types; **B** → existing
  `t.HttpServer.Started` server projection; medium type-only risk. No native namespace acquisition
  occurs in the annotations. Type containment must leave descriptor-only snapshots, proxy/accessor
  refusal, captured receiver binding, and retained rollback ownership unchanged. Native server type
  portability remains separate.
- **L03** `code/sys.driver/driver-automerge/src/m.server/u.print.ts::Log.memory` — memoryUsage /
  runtime diagnostics; **R**, no generic metrics facade established; low risk. Report current
  runtime rss/heap fields with existing byte formatting; do not substitute browser or child metrics.
- **L04** `code/sys.driver/driver-automerge/src/m.server/u.ws.ts::isBrokenPipeError` — native
  BrokenPipe identity / transport integration; **R**, target none; medium risk. Preserve native
  instanceof and independent EPIPE fallback, and leave payload-limit failures on their own branch.
- **L05** `code/sys.driver/driver-pi/src/m.cli/m.profiles/u/u.fmt.help.ts::helpInput` — synchronous
  env read / help composition; **U** → process-only Env composition; medium risk. Preserve empty
  fallback and caller-selected tool spelling without making help formatting async by stealth.
- **L06** `code/sys.driver/driver-pi/src/m.cli/m.profiles/u/u.ocr.preflight.ts::resolveEnvPath` —
  synchronous env PATH fallback / startup composition; **U** → process-only Env at caller boundary;
  high authority risk. Explicit input.envPath and supplied env.PATH win, including present-empty
  values. Do not introduce dotenv, eager environment access, dependency installation, or any grant.
- **L07**
  `code/sys.driver/driver-pi/-scripts/m.start.gui.preview.build/u.deno.ts::DEFAULT_DEPS.getEnv` —
  live env read / async cache-authority query; **B** → process-only Env reader at composition;
  medium risk. Preserve supplied deps, absolute/nonempty/NUL validation, and fallback to current
  executable info only when configured DENO_DIR is unusable. Keep FORCE_COLOR=0 and capture bounds.
- **L08**
  `code/sys.driver/driver-pi/-scripts/m.start.gui.preview.build/u.deno.ts::resolvePreviewDenoDir/execPath`
  — current executable / runtime integration; **R**, target none; high authority risk. The query
  resolves this runtime's effective cache, not a different PATH-selected executable's cache.
- **L09** `code/sys.driver/driver-pi/src/m.core/m.extension/m.zip/-bundle/mod.ts::deno` — native
  Command/current executable/output / generator; **U** → Process capture candidate; high graph risk.
  Preserve null stdin, piped streams, no color injection, frozen bundle/info/doc checks, exit
  failure diagnostics, and exact generated dependency/export admission. Do not execute this
  generator merely to audit it; emitted artifact JSON remains derived output.
- **L10** `code/sys/server/-sample/files.http.cmd/-config.ts::readPort` — synchronous module-level
  env read / sample configuration; **U** → process-only Env composition; medium risk. Preserve
  trimming, 1..65535 integer validation, absent/empty fallback, and import-time failure timing.
- **L11**
  `code/sys.driver/driver-deno/src/m.runtime/m.DenoVersion/u.authority.ts::detect,toAuthorityKind/HOME`
  — native live env reads / runtime tooling composition; **U** → process-only Env composition;
  medium risk. detect is async but toAuthorityKind's default is synchronous. Preserve injected home,
  fallback when it returns undefined, trimming and original catch/canonicalization behavior.
- **L12**
  `code/sys.driver/driver-deno/src/m.runtime/m.DenoVersion/u.authority.ts::resolvePath/execPath` —
  current executable / runtime-authority adapter; **O** → existing DenoVersion authority; high
  provenance risk. Preserve selected-command versus current-executable split and injected resolver;
  no PATH-selected replacement or upgrade is authorized by this record.
- **L13** `code/sys.driver/driver-deno/src/m.cloud/u.cli.deploy/u.create.ts::create/root` — process
  cwd fallback / CLI request composition; **B** → `Fs.cwd()`; low operation risk. Preserve supplied
  valid root resolution and fallback only after app validation. Credentials remain opaque arguments;
  no request was executed and no credential/config values were collected.
- **L14**
  `code/sys.driver/driver-pi/-scripts/m.start.gui.evidence.local/mod.ts::DEFAULT_WRITE_DEPENDENCIES,writeEvidenceWith`
  — captured writeTextFile and internal typeof projection / evidence generator; **U** → Fs.write
  candidate; high provenance risk. The captured writer rejects into a fixed error with cause, never
  reports success after failure, and writes only after content/package verification. Match creation,
  parent, overwrite, rejection and import-time capture semantics before adoption. No evidence was
  bound.

## Protocol error boundaries and remaining host compositions

The Z records use source at `a5af8f47e2690ba5b2523024a2b8a4ae8a7525b5`, checked against current path
state. Git-content observations identify that revision; live reads establish the named enclosing
contracts where retention/adoption is decided. No owner classification below exempts a package.

- **Z01**
  `code/sys/fs/src/m.Fs.capability/m.Rooted/u/{u.error.ts,u.file.ts,u.path.ts,u.stage.ts,u.tree.ts,u.write.operation.ts,u.write.ts}`
  — native error translation / protocol adapter; **O**, target the existing Rooted owner; high risk.
  Covers NotSupported → unsupported, AlreadyExists publication/creation races, NotFound absence or
  ownership loss, and PermissionDenied removal/mode refusal. Preserve committed-state accounting,
  reconciliation after effects, and cleanup causes. These are error-class dispatches after private
  IO, not higher-level file reads that can simply adopt Fs.read. Metadata annotations in these same
  operations remain private native coupling, not extra runtime calls.
- **Z02** `code/sys/fs/src/m.Pkg.Dist/u.verify/u.tree.ts::lstatMaybe,isPathTransition` and
  `code/sys/fs/src/m.Pkg.Dist/u/u.project.ts::projectWithIo` — native error translation /
  verification adapter; **O**, existing Dist owner; high risk. Only NotFound admits absent
  projection destinations; NotADirectory/IsADirectory/FilesystemLoop during verification mean
  transition, not ordinary missing input. Preserve rejection and Rooted settlement rather than
  inserting forgiving Fs preflights.
- **Z03** `code/sys/fs/src/m.Snapshot/u/u.failure.ts::hostFailure` — native error translation /
  adapter; **O**, existing Snapshot owner; high risk. Native error validation precedes class
  dispatch; missing, unsafe-filesystem, permission-denied and generic IO failures are distinct
  public results.
- **Z04** `code/sys/fs/src/m.Fs.capability/m.Rooted/u/u.owner.ts:226` — platform mode policy /
  runtime integration; **R**, target none; high risk. Windows skips POSIX ownership-mode work;
  retaining the OS branch does not authorize replacing descriptor-bound chmod with path chmod.
- **Z05** `code/sys/fs/src/{m.Fs.capability/m.Rooted,m.Pkg.Dist,m.Snapshot}/t.internal.ts` —
  FileInfo/DirEntry/open/mkdir/remove option annotations / private types; **O**, respective existing
  owner, no public replacement target; medium risk. Native handle and IO test seams remain typed to
  the native substrate. They are not public portability claims or executable namespace reads.
- **Z06** `code/sys/fs/src/m.Snapshot/u/u.observation.ts::observe` and
  `code/sys/fs/src/m.Pkg.Dist/u.verify/u.tree.ts::metadataBase,directoryMetadata,fileMetadata,handleStat`
  — native metadata annotations / private types; **O**, respective existing owner; medium risk.
  Observation translates native identity/time/link facts to owner evidence. Keep types separate from
  the error-constructor expressions classified in Z02/Z03.
- **Z07**
  `code/sys/server/src/m.server.websocket/u/u.create.ts::create,createServer,isAddressInUseError` —
  serve/upgrade/error identity / adapter; **O** → existing `@sys/server/websocket` WebSocketServer
  owner; high risk. The exported create primitive owns the native listener, upgrades, address-in-use
  translation, connection tracking, shutdown and finished settlement. Managed HttpServer hosting
  would add another lifecycle owner. Its native server/address/handler annotations describe this
  substrate, not additional calls. Keep the silent primitive and native prototype-validation policy.
- **Z08** `code/sys/server/src/m.server.websocket/u/u.start.ts::bindProcessLifecycle` — native
  signal add/remove / hosted runtime integration; **R**, target none; high risk. Wiring is opt-in
  for lifecycle process, records successful acquisitions, and releases them on disposal/finished.
  Manual creation must remain free of host signal effects; best-effort unsupported-signal behavior
  is part of this local contract.
- **Z09**
  `code/sys/server/src/m.server.websocket/u/u.keyboard.ts::DEFAULT_DEPENDENCIES,bindKeyboardWith` —
  captured exit dependency / hosted runtime integration; **R**, target none; high risk. The Cli
  keyboard facade already owns input. Exit is disabled there and optionally performed here only
  after server close settles successfully; preserve the false default and no exit on close failure.
- **Z10 — mapping only:** `code/sys/http/src/http.server/m.HttpServer/u.print/u.print.ts::trimCwd`
  is already classified by N14. Preserve the lexical slash prefix and explicit relative-path early
  return. This repeated evidence adds no classified record or operation to the totals.
- **Z11** `code/sys/http/src/http.server/m.HttpServer/u/u.options.ts::onListen` — NetAddr annotation
  / owner type; **O**, existing HTTP options contract; medium type risk. The Deno.server comment is
  inert prose. Native callback typing is not an executable hosting bypass.
- **Z12** `code/sys/cell/-scripts/{task.cli.ts,task.sample.ts}` and
  `code/sys/cell/src/{mod.ts,m.cli/mod.ts,m.cli/u/u.exit.ts}` — argv/status / host entry
  integration; **R**, target none; medium risk. Preserve supplied argv seams, status after run
  completion, and dual Deno/Node exitCode publication before terminal hooks. This does not cover
  session env reads.
- **Z13** `code/sys/server/{-scripts/task.sample.ts,src/mod.ts,src/m.cli/mod.ts}` and
  `code/sys/http/src/-serve/mod.ts::import.meta.main` — argv/status/exit / entries; **R**, target
  none; medium risk. Parsing supplied input is already facaded; ambient acquisition and final host
  status are separate. Preserve dynamic CLI imports and the HTTP launcher's exit after start.
- **Z14** `code/sys.dev/-scripts/task.snapshot.ts:96` and
  `code/sys.ui/ui/-scripts/task.cell.ts::import.meta.main` — exit/status/argv / entries; **R**,
  target none; medium risk. Preserve disposal before snapshot exit and Cell's error/kill-only status
  policy.
- **Z15** `code/sys.driver/driver-pi/src/{mod.ts,m.cli/mod.ts,m.cli/m.raw/mod.ts}` — argv/exitCode /
  entries; **R**, target none; medium risk. Keep main guards, deferred entry imports and
  nonzero-only status propagation. Module descriptions are prose, not another Deno operation.
- **Z16**
  `code/sys.driver/driver-pi/-scripts/m.start.gui.preview.build/{-entry.build.ts,-entry.worker.ts}`
  — argv/environment/permission assertions / runtime boundary; **R**, target none; high risk. These
  independently reject an ambient sentinel, absent/nonabsolute DENO_DIR, overbroad writes/net/run,
  and unexpected worker arguments before build/runtime composition. They query existing authority;
  no permission is requested. Do not replace the native oracle with the launcher policy under test.
- **Z17** `code/sys.driver/driver-pi/-scripts/m.start.gui.preview.build/{mod.ts,u.runtime.ts}` —
  build.os/SystemRoot environment composition / consumer; **U** → process-only Env reader candidate;
  high risk. Both enclosing functions are async, but the conditional Windows read, explicit cleared
  child environment, native missing-value behavior and refusal timing must remain unchanged. No
  authority expansion or dotenv lookup is implied.
- **Z18** `code/sys.driver/driver-pi/-scripts/m.start.gui.preview.build/{mod.ts,u.runtime.ts}` —
  execPath/argv/final exit or exitCode / runtime integration; **R**, target none; high risk. The
  process facade is already used. Retain current-executable and restricted PATH selection, argument
  forwarding, dependency-policy flags, worker separation, and status only after cleanup.
- **Z19** `code/sys.driver/driver-deno/src/m.runtime/m.DenoTask/m.Menu/m.main.ts::runSelected,fail`
  — host exitCode / CLI integration; **R**, target none; medium risk. Preserve selected-task failure
  status and explicit menu failure status; no generic status facade was established.
- **Z20**
  `code/sys.driver/driver-deno/src/m.cloud/m.DenoDeploy/m.stage/-tmpl/mod.ts::import.meta.main` —
  argv / generator entry; **R**, target none; low risk. Bundle changes originate in the adjacent
  files authority via makeBundle/TmplEngine.bundle, not edits to generated bundle JSON. The
  DenoDeploy spelling in descriptions and errors names a repository facade, not the native
  namespace.
- **Z21**
  `code/sys.driver/driver-pi/src/m.core/m.extension/m.zip/u/{u.guard.ts::fileIdentity,u.policy.ts::rootEvidence}`
  — FileInfo annotations / consumer types; **B** → `@sys/fs/t` Fs.FileInfo; medium type risk.
  Identity still requires nonnegative safe dev/ino values; an alias would contain spelling, not make
  the guard portable or alter its lstat authority.
- **Z22** `code/sys.driver/driver-automerge/{-scripts/task.tmp.ts,src/-exports/-ws.ts}` and
  `code/sys/workspace/-scripts/task.cli.ts` — argv/exit / script integration; **R**, target none;
  medium risk. Preserve early cancellation exit, supplied parser input, and sandbox construction
  before Workspace CLI use; none is a native filesystem adapter merely by package location.
- **Z23**
  `code/sys.driver/driver-cloudflare/-sample/deploy/-scripts/{task.proof.local.ts,task.push.ts,task.serve.ts}`
  — argv/status/exit/signal add-remove / sample host integration; **R**, target none; high risk.
  Push validates exactly one public/private selector and exits only after reporting/spinner cleanup;
  serve owns SIGINT acquisition and finally release around the managed service. No remote action was
  executed during this review.
- **Z24** `code/sys.driver/driver-deno/-scripts/{task.sample.create-app.ts,task.sample.deploy.ts}`,
  `deploy/sample.proxy/-scripts/task.deploy.ts`, and `deploy/@tdb.slc.fs/-scripts/-build.ts` —
  argv/final exit / scripts; **R**, target none; medium risk. Public deployment and Env facades are
  already used; native argv is not deployment IO. Preserve cleanup before exit. This is source
  review only, not authorization to invoke deployment helpers.
- **Z25** `deploy/@tdb.data/-scripts/{task.cli.ts,task.sample.create.ts,task.sample.stage.ts}` and
  `deploy/@tdb.data/src/fs/m.cli/u.run.ts::run` — process cwd / consumers; **B** → Fs.cwd(); low
  operation risk. Caller-supplied cwd retains precedence; task.cli reuses the same cwd for target
  construction. Apply the poisoned INIT_CWD and import-boundary proof.
- **Z26** the Z25 `task.cli.ts`, `task.sample.stage.ts` and `u.run.ts` — argv / entry composition;
  **R**, target none; low risk. Preserve explicit argv and the copy before parsing in u.run.
- **Z27** `code/sys.driver/driver-vite/-scripts/{task.perf.ts,task.smoke.ts,task.test.ts}` —
  argv/status/exit / script integration; **R**, target none; medium risk. Preserve strict
  performance failure exit, unpublished/error smoke refusal and test-runner status timing; source
  review does not run any of these tasks.
- **Z28** `code/sys.driver/driver-vite/-scripts/task.perf.ts::writeResult` and
  `task.prep.u.ts::rewriteImport` — writeTextFile/readTextFile / consumers; **U** →
  Fs.write/Fs.readText candidates; medium risk. Performance output must retain throwing write
  failures and exact bytes; import rewriting must fail on missing/read-denied input, avoid writes
  when unchanged, and retain source authority. Structured read results are not native throwing
  reads.
- **Z29** `code/sys.tools/-scripts/-tmp.pdf.ts::mdFileToPdf` — text read/byte write / authored
  temporary script; **U** → Fs.readText/Fs.write candidates; medium risk. Preserve rejected IO,
  filename/extension calculation and PDF bytes. The filename does not make this cache output or
  justify excluding it from authored source.
- **Z30** the Z29 script's main guard — argv/usage exit / entry integration; **R**, target none; low
  risk. Preserve missing-input failure before conversion; the generated PDF is not source.

## Residual tests, independent observations, and ordinary setup

These grouped records classify only the stated operation roles. A read used as an independent
expected-value oracle is not the same role as a read used to build a fixture. Private annotations
listed with an executable operation are not extra runtime calls. The prefix abbreviations in this
section are exact: **FS** = `code/sys/fs/src/`, **HTTP** =
`code/sys/http/src/http.server/m.HttpServer/`, **PROC** = `code/sys/process/src/m.process/`,
**CELL** = `code/sys/cell/src/`. Earlier records win for their already named operations; these rows
normalize the remaining named sites rather than counting those operations twice.

- **Y01** FS
  `m.Fs.capability/m.Rooted/-test/{-admit.test.ts,-failure.settlement.test.ts,-lease.test.ts,-owned-tree.test.ts,-publishFile.test.ts,-stage.test.ts}`
  — native error construction/identity / fault controls; **R**, target none; high risk. Actual
  NotSupported/AlreadyExists/NotFound classes drive the adapter's refusal/race translation;
  replacing them with generic errors would stop exercising that translation. Includes constructor
  faults in wrapped file/mode callbacks, not unrelated setup IO.
- **Y02** FS
  `m.Fs.capability/m.Rooted/-test/{-.test.ts,-admit.test.ts,-failure.settlement.test.ts,-fixture.test.ts,-lease.test.ts,-owned-tree.test.ts,-publishFile.test.ts,-removeTreeBatch.test.ts,-stage.test.ts,-writeTree.failure.test.ts,-writeTree.input.test.ts,-writeTree.producer.test.ts,-writeTree.test.ts,u.fixture.tree.ts}`
  — readFile/readTextFile/lstat/stat/realPath/readDir used for expected bytes, identity, modes,
  occupancy and residue / independent oracles; **R**, target none; high risk. Keep direct
  observations independent of the protocol being tested, especially committed output after cleanup
  failure and unchanged siblings/outside hardlinks. This does not retain preparatory writes.
- **Y03** the Y02 Rooted tests, plus `-stage.activity.test.ts` under the same test directory —
  mkdir/write/link/symlink/rename/remove/chmod / fixture construction and race mutation; **U** → Fs
  primitives where compatible, otherwise retain a bounded fault-control seam; high risk. Ordinary
  initialization must not inherit an exemption from races. Mutations inside injected sync/open/
  chmod/rename callbacks require exact effect timing and link/inode semantics. Resolve those two
  roles per migration batch; recursive defaults, existence preflights and retries are not
  equivalent.
- **Y04** FS `m.Fs.capability/m.Rooted/-test/{-lease.process.ts,-removeTreeBatch.process.ts}` —
  native child/execPath/pipe protocol/status / process controls; **R**, target none; high risk.
  Parent writes a release byte or kills an acquired holder to prove OS lease ownership. Preserve
  piped stdin/readiness/status, held-before-contention ordering and bounded finally settlement.
  Process.spawn's null stdin is not this bidirectional contract. X05 separately covers child entry
  IO.
- **Y05** FS Rooted `-test/{-stage.test.ts,-lease.process.ts,-removeTreeBatch.process.ts}` native
  DirEntry/ChildProcess/CommandStatus annotations — private test types; **O**, existing protocol IO
  owner; medium type risk. These name the independent native seam, not extra resource acquisitions.
- **Y06** FS
  `m.Fs.capability/-test/{-m.Files.toLive.test.ts,-m.Files.toReadonly.test.ts,-m.Files.toWritable.test.ts}`
  — symlink and active-live write controls / capability experiments; **R**, target none; high risk.
  Native links deliberately point outside the admitted root; the live write independently triggers
  the watcher. Do not create them through the capability whose refusal is under test.
- **Y07** FS `m.Fs.capability/-test/u.fixture.ts::setupFixture` and Rooted
  `-test/u.fixture.tree.ts::writeDistTree` — ordinary text writes/mkdir / setup; **U** → Fs.write
  and Fs.ensureDir candidates; medium risk. Preserve throwing failure and supplied fixture bytes.
  Tree mode observation is Y02, not part of this possible setup migration.
- **Y08** FS
  `m.Pkg.Dist/-test/{-input.admission.test.ts,-local.verify.test.ts,-pinned.admitManifest.test.ts,-pinned.readPart.io.test.ts,-pinned.verify.io.test.ts,-pinned.verify.manifest.test.ts,-pinned.verify.tree.test.ts,-project.test.ts,-content.production.test.ts}`
  — cwd changes, injected native errors, symlink/identity substitution, malformed/tampered bytes and
  on-observation mutations / verification controls; **R**, target none; high risk. Covers
  deliberately changing evidence or host state at the assertion's boundary, not general allocation.
  Native permission-none registration in admitManifest tests the absence of IO and must remain
  native.
- **Y09** FS
  `m.Pkg.Dist/-test/{-Pkg.Dist.test.ts,-local.readPart.io.test.ts,-local.verify.test.ts,-pinned.readPart.io.test.ts,-pinned.readPart.test.ts,-pinned.verify.tree.test.ts,-project.test.ts}`
  — read/realPath/lstat/readDir as expected-value or identity/residue oracles; **R**, target none;
  high risk. Preserve exact byte observations independent of Dist verification/projection and
  source/destination aliases. Do not replace a native error oracle with the result under test.
- **Y10** FS
  `m.Pkg.Dist/-test/{-u.pinned.fixture.ts,-content.production.test.ts,-input.admission.test.ts,-pinned.readPart.io.test.ts,-pinned.readPart.test.ts,-pinned.verify.io.test.ts,-pinned.verify.tree.test.ts}`
  — temp allocation, initial mkdir/read/write, cleanup / ordinary fixture IO; **U** → existing Fs
  primitives; medium risk. RealPath has an established native-equivalent owner but temp allocation
  projects an FsDir, reads return structured results, and remove changes absence/retry policy. Reads
  or mutation phases explicitly covered by Y08/Y09 retain those roles, not this setup role.
- **Y11** FS
  `m.Pkg.Dist/-test/{-pinned.readPart.io.test.ts,-pinned.verify.io.test.ts,-project.test.ts}` —
  FileInfo/MkdirOptions annotations / private IO test types; **O**, existing Dist/Rooted test seam;
  medium type risk. Synthetic unsupported identity is still a native metadata-shaped fixture.
- **Y12** FS `m.Snapshot/-test/{-stability.test.ts,-work-bounds.test.ts}` — actual native failure
  constructors in host-failure and cleanup matrices / controls; **R**, target none; high risk.
  Preserve missing/unsafe/permission translation and precedence over later close failures.
- **Y13** the two Y12 files' FileInfo annotations — private native IO test types; **O**, existing
  Snapshot owner; medium type risk. Synthetic path/handle observations are not host IO calls.
- **Y14** FS `m.Snapshot/-test/-work-bounds.test.ts::separator` — build.os / runtime expectation;
  **R**, target none; medium risk. The independent expected separator must reflect the test host.
- **Y15** FS `m.Fs/-test/-fs.write.test.ts` — stat/write/remove capture, replacement, forwarding and
  restoration, native PermissionDenied and independent output reads / adapter controls; **R**,
  target none; high risk. Retain faults beneath Fs.write/remove so parent-preparation failure,
  original errors, retries and no-write JSON serialization are actually tested. Initial testSetup
  write is separate in Y16; native option/type annotations describe these control seams.
- **Y16** FS `m.Fs/-test/{-fs.write.copy.test.ts,-fs.write.test.ts}` — preparatory text writes /
  setup; **U** → Fs.write candidate; medium risk. Reusing a writer for copy tests is plausible, but
  using the subject writer to prepare its own failure test is not automatic. Preserve bytes,
  overwrite expectations, and native throwing failures until separately proved.
- **Y17** FS `m.Path/-.test.ts` — cwd / independent formatting oracle; **R**, target none; low risk.
  Compares public Path.cwd and trimCwd to host cwd. X01/X02 already cover Fs and HOME controls.
- **Y18** FS `m.Watch/-.test.ts::change events` — writes after watcher acquisition / native
  stimulus; **R**, target none; medium risk. Independently trigger monitored/unmonitored and
  recursive/nonrecursive paths; preserve subscription-before-effect ordering and observed events.
- **Y19** the Y18 recursive test's initial writeChild call before watcher acquisition — text write /
  ordinary setup; **U** → Fs.write candidate; medium risk. It deliberately settles setup before
  observation. Sharing its function with the active stimulus does not make this initial call an
  automatic native-retention requirement.
- **Y20** `code/sys/http/src/http.client/m.HttpClient/-test/-wait.test.ts`,
  `code/sys/http/src/http.server/m.HttpProxy/-test/u.fixture.usingServer.ts`, and HTTP
  `-test/{-.test.ts,u.fixture.usingServer.ts}` — serve / fixture hosting; **U** → existing HTTP or
  Testing host candidate; medium lifecycle risk. Preserve port zero, actual address, early shutdown
  for unreachable tests, handler counters and bounded disposal. The two usingServer helpers use
  graceful shutdown first and abort only on timeout/failure; managed-host adoption must not change
  that policy or add keyboard ownership.
- **Y21** HTTP `-test/{-u.start.presentation.test.ts,-u.start.test.ts}`, and
  `code/sys/http/src/http.server/m.HttpProxy/-test/-m.Resolver.test.ts` — native listener occupancy,
  released-address allocation and direct invalid-port serve comparison / independent controls;
  **R**, target none; high risk. Preserve real AddrInUse identity and exact native failure
  comparison; querying the managed subject instead would be circular.
- **Y22** HTTP `-test/{-u.print.test.ts,-u.start.settlement.test.ts,-u.start.test.ts}` and the
  HttpClient wait test in Y20 — native address/server/handler annotations / private test types;
  **O**, existing HTTP native seam; medium type risk. A fake HttpServer cast acquires no listener.
- **Y23** HTTP `-test/-u.print.test.ts` — cwd / presentation oracle; **R**, target none; low risk.
  Expected shortening is explicitly relative to the host cwd, independent of the printer.
- **Y24** HTTP `-test/-u.serveFileBytes.test.ts` — forbidden-source tokens Deno.open/lstat/readFile
  / inert assertion data; **n/a**; low risk. These strings reject runtime imports in the byte
  responder; they neither open a file nor generate a child program. The OS test skip in
  -u.serveStatic.test.ts is native runtime integration **R** in Q34, not part of this text record.
- **Y25** `code/sys/net/src/m.Net/-test/-m.Port.test.ts` and
  `code/sys/testing/src/m.server/m.Testing/-test/-.test.ts` — listen / native occupancy controls;
  **R**, target none; high risk. Native listeners provide independent IPv4/IPv6 and privileged-port
  evidence and make connect wait against a known host. Includes the associated native listener
  annotations in these control bodies. Preserve close/finally and port-zero restricted registration.
  X07/X08 cover selection/probe controls; Q35 separately selects Net's connection-test listener.
- **Y26** `code/sys/net/src/m.Net/-test/-.test.ts` — NetAddr structural fixture annotations / owner
  types; **O**, existing Net contract; low type risk. The function constructs data, not a listener.
- **Y27** PROC `-test/{-m.Port.test.ts,-u.pid.test.ts,-u.port.test.ts}` and
  `u.proc/-test/{-u.capture.test.ts,-u.inherit.test.ts,-u.spawn.authority.process.ts,-u.spawn.test.ts}`
  — child signal/exit/serve/stdout/stderr/env and current runtime/PID observations / native process
  controls; **R**, target none; high risk. Embedded programs really execute in children. Preserve
  ignored SIGTERM, exact bytes/status, FORCE_COLOR/clearEnv observations and actual permission
  denial; the subject Process facade cannot replace its own independent native child oracle.
- **Y28** PROC `-test/{-m.Port.test.ts,-u.pid.test.ts,-u.port.test.ts}::spawn,cleanup` — parent
  Command and kill / fixture harness; **U** → Process capture/spawn or local owned-child seam; high
  risk. Inspect stream ownership, readiness, capture limits, color injection, and cleanup under
  failure of the Process subject. Existing cleanup probes a PID before kill; replacing that with
  handle authority would be an intentional authority/behavior change, not mechanical spelling.
- **Y29** PROC `u.proc/-test/{-u.inherit.test.ts,-u.run.test.ts}` — temporary directory allocation
  and cleanup / setup; **U** → Fs.makeTempDir/Fs.remove; medium risk. Adapt the returned FsDir and
  preserve supplied cwd and the existing catch-on-cleanup behavior. No owner-package exemption.
- **Y30** PROC `u.proc/-test/{-u.capture.test.ts,-u.inherit.test.ts}` — parent env save/set/restore
  / clearEnv controls; **R**, target none; medium risk. Preserve missing versus empty and finally
  restoration. This controls native state, not an ordinary production reader.
- **Y31** PROC
  `u.proc/-test/{-u.capture.test.ts,-u.child.owned.test.ts,-u.spawn.retention.process.ts,-u.spawn.test.ts}`
  — CommandStatus/Signal/ChildProcess annotations in synthetic child seams / private types; **O**,
  existing Process substrate; medium type risk. Fake promises/handles do not launch processes.
- **Y32** CELL
  `m.cli/-test/{-fmt.services.capture.test.ts,-u.start.lifecycle.test.ts,-u.start.presentation.test.ts,-task.cli.test.ts,-task.cli.vite.process.ts,u.fixture.cli.terminal.pty.ts,u.fixture.cli.vite.pty.ts,u.fixture.cli.vite.ts,u.fixture.kill.ts}`
  — chdir/status control, synchronous path replacement, permission checks, independent listener
  occupancy/rebind, PID/argv/execPath/build.os and mixed-stdio stty / native experiment; **R**,
  target none; high risk. Includes the replacement server in -task.cli.vite.process.ts: it is an
  unrelated live owner that fallback cleanup must leave reachable, not the subject's managed server.
  Retain exact fault timing, actual released ports, before/after terminal mode, current-executable
  selection and native child permission evidence. Ordinary cwd defaults are Y34; embedded service
  construction and env mutation in u.fixture.kill.ts are D20–D22. Do not use Cell's managed
  lifecycle to implement the independent teardown oracle.
- **Y33** CELL
  `m.cli/-test/{u.fixture.cli.terminal.pty.ts,u.fixture.cli.vite.pty.ts,u.fixture.cli.vite.ts,u.fixture.kill.ts}`
  — parent environment snapshot/read and child Command/Node spawn composition / harness; **U** →
  Process composition where compatible; high risk. Preserve detached owned groups, sanitized CI/
  terminal settings, retained stdin, and real PTY semantics. Existing Env does not implement
  toObject; Process.inherit alone exposes neither group authority nor captured mixed stdio. In
  u.fixture.kill.ts this selects spawnCellStart, spawnHoldProcess, spawnReadyServer, runDenoCellCli
  and their handle cleanup, not withRuntimeDir's independent state mutation (D22), embedded programs
  (D20/D21), or the cleanup parameter type (P13). Y32's independent stty measurement wins over this
  ordinary-harness selector.
- **Y34** CELL
  `m.cli/-test/{-task.cli.test.ts,-task.cli.vite.process.ts,u.fixture.cli.vite.ts,u.fixture.kill.ts}`
  parent cwd defaults/path construction — consumers; **B** → Fs.cwd(); low operation risk. Keep
  caller cwd precedence and process (not INIT_CWD) semantics; this does not migrate the other
  control effects.
- **Y35** CELL `m.cell/-test/{-u.dist.fixture.ts,-u.services.dist-host.test.ts}` — realPath/readFile
  for fixture materialization / setup; **U** → Fs.realPath/Fs.read candidates; medium risk. Preserve
  canonical source/store paths, owned byte maps, missing/read-denied failures, and cleanup ordering.
- **Y36** CELL `m.cli/-test/-u.shutdown.test.ts` — Signal annotations / private control types;
  **O**, existing local signal contract; low type risk. Fake add/remove callbacks do not acquire
  host signal listeners; native status/assertion operations remain separately classified.
- **Y37** `code/sys/cli/src/m.core/m.Fmt.Text/-test/-u.authority.test.ts` and
  `m.Keyboard/-test/{-m.Is.test.ts,-u.bind.test.ts,-u.input.test.ts}` /
  `m.Keyboard/-test.external/{-keyboard.pty.proof.ts,u.fixture.keyboard.pty.ts}` under the same core
  root — descriptor/error/PTY controls; **R**, target none; high risk. Preserve restoration,
  captured provider identity under global replacement, BadResource failure precedence, real native
  runner sanitizers, natural exit and independent stty input-mode observations.
- **Y38** `code/sys/event/src/m.cmd/-test/-sample.websocket.test.ts` — serve/upgrade / independent
  transport baseline; **R**, target none; medium risk. The first test is a vanilla socket control;
  the second adapts native sockets to Cmd. Higher WebSocketServer composes Cmd, so importing it back
  here would also reverse ownership. Preserve abort and socket closure ordering.
- **Y39** `code/sys/html/src/-test.browser/-browser.ts` — version and embedded typeof Deno /
  cross-runtime proof; **R**, target none; medium risk. The string becomes browser code asserting
  Deno/process absence, not inert prose. Parent version labels report the actual toolchain only.
- **Y40** `code/sys.ui/ui-dom/src/m.UserAgent/-.test.ts` — version.deno / runtime oracle; **R**,
  target none; low risk. It independently predicts navigator.userAgent in this runtime.
- **Y41** `code/sys.ui/ui-components/src/ui.react/ui/Image.Svg/-.test.ts` — comment about SVG
  imports / text; **n/a**; low risk. No native namespace evaluation occurs at that comment.
- **Y42** `code/sys/archive/src/m.Zip/-test/-extract.boundary.test.ts::pending` — inspect / native
  scheduling oracle; **R**, target none; high risk. Inspecting promise state avoids adding another
  continuation window; an awaiting helper would change the settlement experiment.
- **Y43** `code/sys/archive/src/m.Zip/-test/-path.integration.test.ts` — temp allocation/writeFile/
  recursive cleanup / setup; **U** → Fs temp/write/remove candidates; medium risk. Keep owned ZIP
  bytes, nonempty snapshot input, and failure cleanup. Allocation is not a path-admission
  experiment.
- **Y44**
  `code/sys.model/model/src/m.files.fs/-test/u.fixture.live.ts::liveFsFixture,realPath,stat,readText,collect,startWatcher,pump,writeText,removePath`
  — native filesystem test adapter / unresolved composition; **U** → Fs and Watch candidates; high
  risk. The injected capability maps errors to undefined, orders all entries, maps rename to other,
  suppresses watcher pump failures, tracks disposal and writes live stimuli. Prove those contracts
  before reuse; its location does not establish a public native capability owner.
- **Y45** `code/sys.model/model/src/m.files.static/-test/-dist-seam.test.ts::collect,test body` —
  readTextFile/readDir / source guard; **U** → Fs.readText/walk composition; medium risk. Keep
  recursive all-file traversal, -test exclusion and throwing read failures. Do not exempt native IO
  merely because the consumer itself checks an import boundary.
- **Y46**
  `code/sys/workspace/src/{-test/-u.workspace.members.test.ts,m.bump/-test/-u.collect.test.ts,m.ci/m.Test/-windows.test.ts,m.info/-test/-u.stats.test.ts,m.prep/-test/-m.Graph.test.ts,m.run/-test/-u.testStats.test.ts,m.run/-test/u.fixture.ts}`
  — symlink authority controls, version/stat oracles and embedded native runner/synchronous log
  markers / runtime tests; **R**, target none; high risk. Preserve manifest/ancestor escape cases,
  unchanged graph timestamps, per-child test/check/dry ordering and native failure status. These
  embedded task sources are executable programs, not parent-side writes or teaching text.
- **Y47** `code/sys/workspace/src/m.run/-test/{-u.failure.test.ts,-u.handoff.test.ts}::ran` —
  nullable Signal annotations / consumer test types; **B** → `WorkspaceRun.Package.Ran['signal']`,
  already reachable through each test's t barrel; low type-only risk. W19 separately contains that
  public result through Process.InheritOutput['signal']. Keep the helper option optional and its
  `?? null` result normalization; no new type API, runtime import or portable signal claim is
  needed.
- **Y48** `code/sys/yaml/src/m.cli/m.YamlConfig/-test/-m.Env.test.ts::withProcessEnv` — parent env
  save/set/delete/restore / fixture control; **R**, target none; medium risk. Preserve absent, empty
  and present values independently of the reader being tested.
- **Y49** `code/sys/workspace/src/{m.info/-test/-u.fmt.test.ts,m.ci/m.Test/-windows.test.ts}` —
  Deno.version/CI step labels / inert assertion data; **n/a**; low risk. These expected strings are
  not namespace access; the same Windows file's symlink effects are independently Y46.

## Residual cross-family classifications

Q01–Q35 normalize the remaining test/script/prose occurrences located in the historical manifest and
broader word screen. Their selectors apply only to source inspected at the recorded revision, not
future files. For overlap, the earlier exact operation record wins; these rows cover the residual
role only. A U row is a reviewed decision to withhold adoption/retention pending its concrete
question, not a native allowlist. Matching source was inspected through read-only Git context and
selected live contract reads; this is not a claim to have read every line of every large test or
Markdown file.

The default scope of Q01–Q13 is only test/fixture content in the following exact manifest source
sets. A -scripts directory does not make its production task entry a test; Q05 does not cover those
entries. Q14–Q35 have their own explicit source selectors, not this default scope:

- `code/-tmpl/src/{m.testing,m.tmpl}/-test/`;
- `code/sys.tools/src/{cli.deploy,cli.pull,cli.upgrade,u.root}/` test subdirectories, plus
  `cli.pi/-.test.ts` and `cli.tmpl/-.test.ts`;
- `code/sys.driver/driver-cloudflare/{-sample/deploy/-scripts/-test,-sample/deploy/src/-test,src/m.r2/-test}/`;
- `code/sys.driver/driver-deno/src/{-test,m.cloud,m.runtime/m.DenoTask}/` test/fixture candidates;
- `code/sys.driver/driver-crdt/src/-test/`;
- `code/sys.driver/driver-pi/{-scripts,src/m.cli,src/m.core}/` test/fixture candidates;
- `code/sys.driver/driver-vite/{-scripts,src}/` test/fixture candidates; and
- the three `deploy/@tdb.edu.slug/src/m.slug.compiler/m.bundle/` test/comparator candidates.

Two explicit default-scope extensions are narrow: Q02 also covers Process Open's
`code/sys/process/src/m.open/-test/-u.invokeDetached.test.ts`; Q12 also covers Server
`code/sys/server/src/m.cli/-test/-dsl.test.ts` and
`code/sys.driver/driver-stripe/src/ui/ui.PaymentElement/-test/-spec.bundle.test.ts` source-token
assertion data. Stripe's different dist-browser env gate is D11. They do not extend any other Q row.
Production entries use their exact Z/D records, Fs Env state controls use D05, and Std runner/Path
tests use D06/D08. Do not infer a fallback classification from this index. Generated child code is
executable even when surrounded by assertion text.

- **Q01** native test registrations not already covered by F/X/Y or Q24/Q30 — test runner / **U** →
  existing Testing BDD adapter where compatible; medium risk. Ordinary native registration must
  preserve options, sanitizers and top-level/step behavior before adoption. Permission/sanitizer
  controls already in F/X retain their exact classifications; there is no blanket registration
  exception. The separately named bootstrap controls and adapter substrate are not mixed into this U
  record.
- **Q02** residual genuine native error constructors/assertions — refusal controls / **R**, target
  none; high risk. Explicit examples: Cloudflare `-u.build.test.ts`, `-u.task.test.ts`,
  `-push.test.ts`, `-m.Error.test.ts`; Tools `-u.error.test.ts`, `-u.push.document.test.ts`,
  provider R2 `-u.push.failure.test.ts`, staging `-manifest.failure.test.ts`; Pi ZIP extract
  cleanup/failure fixtures; Process Open `-u.invokeDetached.test.ts`. Actual
  NotCapable/PermissionDenied/NotFound/ NotSupported identity exercises refusal attribution,
  missing-command fallback or cleanup taxonomy. Error-looking strings remain text; ordinary setup IO
  is Q07.
- **Q03** residual parent env save/set/delete/restore — controlled test state / **R**, target none;
  medium risk. Includes Tools HOME/INIT_CWD/debug-advisory tests and Pi TMPDIR/TMP/TEMP/help-tool/
  HOME/sentinel tests, and Vite perf/build mutation instrumentation. Preserve absent/empty/present,
  captured receiver forwarding and finally restoration. Env.Reader cannot mutate the process.
- **Q04** residual ordinary fixture env reads, including Tmpl HTML-integrity HOME/PATH, Vite
  `u.fixture.run.ts::minimalTaskEnv`, graph/cached-serve DENO_DIR and Pi evidence-process
  DENO_DIR/SystemRoot — environment composition / **U** → process-only Env at async composition;
  medium risk. Preserve per-key allowlists, cleared child environments, synchronous helper
  contracts, permission timing and empty-value normalization. Q03/Q19 native state controls are not
  these reads.
- **Q05** residual execPath, argv, exit/exitCode, PID, build and version observations — host/child
  integration / **R**, target none; medium risk. Includes Tmpl entry/status capture, DenoTask menu/
  run fixtures, CRDT fresh-process PID reports, Vite build-child/bridge/runtime labels and Pi test/
  proof status producers. They identify actual isolate/executable or deliberately produce host
  status. Preserve main guards and cleanup-before-status. Repository facade names DenoFile/DenoDeps
  and fields named realDeno are not extra native acquisitions.
- **Q06** remaining parent native Command constructors in those source sets — subprocess harness /
  **U** → Process.capture/spawn/inherit candidates; high risk. Examples include Tools
  concurrentStageCommand, build-lease/package-dry-run tests; Vite
  graph/fixture-process/OptimizeImports proofs; Pi evidence/serve/reset process harnesses. Compare
  stdio, limits, FORCE_COLOR, environment, owned status/kill and process authority. Proven
  bidirectional lease seams in Y04 remain R; this record does not declare all external/process
  proofs irreducibly native.
- **Q07** remaining temp/mkdir/read/write/remove/realPath/stat/readDir fixture construction and
  teardown in those source sets — ordinary filesystem consumers / **U** → Fs primitives or bounded
  walk composition; medium risk. Examples: Pi Settings temporary directories, reset writeText and
  cleanup helpers; Cloudflare local sample fixtures; Tools Github temp roots and Dist byte server;
  Vite graph source reads; Tmpl fixture generation; slug compiler fixture enumeration/readback.
  Preserve structured-versus-throwing errors, exclusive creation, all-entry listings, canonical
  paths, symlink visibility and cleanup failures. No test-directory exemption or broad retention.
- **Q08** native listener/connect/serve setup in the residual sets — network fixture composition /
  **U** → existing HTTP/Testing/Net owner; medium lifecycle risk. Examples: Tools Dist
  `u.dist.fixture.ts` and Pi `u.fixture.start.gui.release.local.ts`. Preserve exact loopback
  address, request accounting, port-zero acquisition, signals and finally shutdown. Native
  blockers/rebind oracles that independently prove occupancy/release retain R as described by
  Y21/Y25/Y32 and Q09.
- **Q09** native property replacement, sync race mutation, descriptor instrumentation, listener
  blockers/rebind and deliberate permission refusal in residual tests — independent host controls /
  **R**, target none; high risk. Examples: Cloudflare remove capture/restore; Tools staging
  synchronous remove/mkdir/rename/symlink hooks and released child locks; Vite cached-serve
  Reflect.apply(original, Deno, args), build env forwarding and HtmlIntegrity fault/cleanup gates;
  Pi reset symlink/chmod/no-change observations. Native effects are the controlled fault or
  independent oracle, not ordinary initialization. Keep exact timing and restoration; shared managed
  setup may still migrate separately under Q07.
- **Q10** ordinary read/write/mkdir/remove/watch setup inside generated test programs — executable
  fixture source / **U** → owner composition only with proven standalone dependency closure; high
  risk. Includes Tools staging build programs, Deno deploy fake CLI recording/state programs, stage
  target-entry/workspace builders, and Pi host ZIP publication checks. Do not classify them as inert
  parent strings or exempt them merely for being standalone. Preserve sync log/lock/watch timing and
  admitted child authority; adding imports can change the experiment's graph.
- **Q11** child-native argv, exit, stdio, permissions and synchronous ordering markers in those
  generated programs — executable native control / **R**, target none; high risk. Examples:
  DenoTask's exit(7), deploy fake CLI status simulation and invocation cwd, Workspace run markers,
  Pi host-reporting denied-capability observations, and Vite resolver's exact child argument probe.
  This retains the native observation/status protocol, not unrelated child filesystem setup in Q10.
- **Q12** source-token expectations, sample-name literals and comment-only matches in the residual
  sets — inert assertion/comment data / **n/a**; low risk. Includes Deno.sample-name strings,
  Tmpl/Server DSL tests, OCR/sandbox generated-source expectations, Vite transport log labels,
  Stripe's forbidden `/Deno\\.stdin/` regex and CRDT's no-Deno.exit comment. These do not acquire
  the namespace or execute a child program; the generated source they describe is separately
  audited.
- **Q13** remaining native PermissionDescriptor/PermissionState/HttpServer/CommandOutput/test
  definition/context annotations in residual test harnesses — runtime-specific private test types /
  **R**, target none; medium type risk. Includes Tools staging authority reports, Pi proof status
  DTOs and Vite lint plugin diagnostics. Annotation erasure means no runtime operation at the type
  site; native-library type coupling still exists and must not be presented as portable.
- **Q14** Markdown plans/reviews/READMEs under `-agent/`, `-tmp/`, `code/` and `deploy/` that match
  the declared scan — prose/teaching text / **n/a**; low risk. This covers the exact manifest
  document paths and broader-word README findings, including the WIP Automerge served-code sketch,
  not executable TS templates. Review passages describe historical/proposed operations; they do not
  execute them. The two archived Vite documents remain historical exclusions, not migrated
  consumers.
- **Q15** `code/sys/server/src/m.help/yaml/{dsl.yaml,dsl.websocket.yaml}`, dependency type-spine
  prose in `code/sys/esm/src/m.deps/t.ts` and driver-deno `m.DenoDeps/t.ts`, and generated staging
  note descriptions — documentation text / **n/a**; low risk. Explicit broader-word additions:
  `code/-tmpl/src/m.help/yaml/dsl.pkg.yaml`,
  `code/-tmpl/-templates/tmpl.repo/.vscode/settings.json`, and
  `code/sys/cell/src/m.help/yaml/{dsl.yaml,dsl.start-services.yaml,dsl.service.static-serve.yaml}`.
  These are help text/editor comments, not embedded native programs. Server help describes the
  native adapter seam, not another listener. DenoDeps is a repository facade name; staging dirBytes
  remains executable N25 and is not covered by this text classification.
- **Q16**
  `-tmp/-archive/{-deploy/@tdb.fs.01/-scripts,-drivers/driver-quilibrium/scripts,-sys/main/src/m.Cmd,-sys.ui/ui-factory/src/m.tmpl}/`
  exact manifest entries — argv/exit / archived authored entries; **R**, target none; medium risk.
  Preserve explicit build failure exits and supplied parser inputs if this source is revived.
  Archival location does not remove the code from authored-content discovery.
- **Q17** archived build NotFound handling, archived native serve and Quilibrium release writeFile —
  filesystem/server consumers / **U** → Fs and HTTP candidates; medium risk. Preserve existing
  missing-only catches, directory preparation, byte writes, listener options and separately
  installed keyboard ownership. The existing archive build uses DenoFile and Process facades
  already; those names are not direct runtime calls.
- **Q18** archived Obsidian `u.dir.listen.ts::eventColor` — FsEvent kind annotation / type consumer;
  **U** → existing Watch.Event kind projection candidate; low type risk. Prove the owning event
  contract rather than introduce a generic host event type. Quilibrium OS/arch release selection and
  its native expected OS are separately D09, not Q05 or filesystem adapters.
- **Q19** `code/sys/testing/scripts/task.browser.{admit,preflight,prepare,postflight}.ts`, Browser
  `-test/{-chrome.authority.process.test.ts,-u.chrome.executable.test.ts,u.browser.proof.ts}`, Pi
  `-scripts/{-test.browser.admit.ts,-test.browser.ts}` and manifest authority child fixtures —
  native permission/exec/argv/refusal controls and host-platform executable selection / **R**,
  target none; high authority risk. Preserve finite executable versus observer-only grants, absent
  CHROME_BIN in the admitted proof, exact denied paths/commands and natural child settlement. These
  are query/assertion sites, including -chrome.authority.process.test.ts::expectNotCapable's
  deliberately forbidden native Command and env.get with exact NotCapable assertions. No probe or
  browser/service was run during the audit. Ordinary Browser residue enumeration and executable
  fixture construction are D18/D19, not Q04/Q07: Testing Browser is outside their default scope.
  Browser CHROME_BIN composition is Q21; Q04/Q07 still apply only to their declared source sets.
- **Q20** `code/sys/testing/scripts/task.browser.preflight.ts::authority write` — exclusive
  writeTextFile(createNew) / **G** → filesystem owner; high risk. Fs.write's
  preflight/parent/overwrite policy does not establish exclusive createNew receipt publication.
  Preserve refusal of an existing authority file and the output-only grant; do not add a convenience
  API without a separate decision.
- **Q21** Browser/Pi browser admission scripts' CHROME_BIN and release-mode env acquisition —
  environment composition / **U** → process-only Env candidate; high risk. Preserve absent versus
  empty validation, validated executable authority, and no ambient forwarding. Env construction must
  not broaden preflight permissions or run after the child authority boundary.
- **Q22** `code/sys/testing/src/m.server/m.Browser/u.chrome.executable.ts::validateChromeExecutable`
  — build.os / native executable admission; **R**, target none; high risk. POSIX requires executable
  mode bits, Windows does not use that test. Existing metadata/realPath acquisition is through Fs.
  Keep pathname-versus-inode trust limits and child-writable-root rejection.
- **Q23** the Q22 file's ChromeExecutableValidationDeps FileInfo annotation, and Pi
  `-scripts/task.start.gui.reset.ts::inspectStoreRootSegment,assertDirectorySegment` — consumer
  types; **B** → Fs.FileInfo; medium type risk. Preserve symlink/regular-directory checks and the
  synchronous/async signatures. Type aliasing is not portability or a change in path authority.

- **Q24** `code/sys/types/src/-test/{-Bdd.global-hooks.test.ts,-Bdd.test.ts}` native confirmation
  registrations — independent bootstrap controls; **R**, target none; high test risk. They assert
  that the BDD suite actually ran. Registering this confirmation through the adapter under test
  would make a broken registration path silently skip its own oracle.
- **Q25** exact manifest tests under
  `code/sys/server/src/{m.server.dist,m.server.files.service,m.server.websocket}/` — deliberate
  native tampering, chmod, rename, error identity, cwd-provider replacement, listener
  occupancy/rebind and output/metadata observations / independent controls; **R**, target none; high
  risk. Examples: `m.server.dist/-test/-content.identity.test.ts::replaceDocument`,
  `-materialize.authority.test.ts` lost-store rename, `-materialize.test.ts` applied mode/retained
  byte assertions, `-server.start.test.ts` AddrInUse blocker, and both service occupied-port tests.
  Preserve adversarial mutation timing and observations independent of Dist/Rooted publication.
  Ordinary fixture construction remains Q26, not an extension of this retention decision.
- **Q26** `code/sys/server/src/-test/u.fixture.dist.ts::setup,dispose` and the manifest's Dist graph
  process tests `canonicalIdentity,addUrlComparison,sameExistingFile` — preparatory temp/realPath/
  mkdir/read/write/remove/stat / filesystem composition; **U** → Fs candidates; medium risk.
  Preserve canonical source/store identities, owned byte snapshots, missing-only suppression and
  aggregated cleanup failures. The sealed store is already removed through Rooted ownership;
  replacing that with ambient recursive cleanup is expressly excluded. Graph canonicalization must
  retain symlink/inode/case comparisons and NotFound policy, not mere lexical normalization.
- **Q27**
  `code/sys/server/src/m.server.dist/-test.external/{-generation.lease.process.ts,-local.permission.process.ts}`
  native Command/execPath and their `u.fixture.*.process.ts` entry/stdio/permission controls —
  bidirectional runtime experiment; **R**, target none; high risk. The parent retains piped stdin
  until contention/HTTP assertions finish; native child instrumentation rejects unintended serve or
  ancestor reads. Process.spawn currently supplies null stdin. Preserve readiness, bounded
  status/drain, owned kill and released-port assertions; no permission experiment was executed here.
- **Q28** `code/sys/server/src/m.server.dist/-test/-server.start.test.ts::rawStatus` — native TCP
  connect / fixture composition; **U** → Net.connect candidate; medium risk. Hand-authored Host
  bytes test HTTP admission, but that does not itself require native connection acquisition.
  Preserve no hidden retries, failure timing, complete status-line bounds and finally close.
  WebSocket `-test/u.fixture.ts::connect` already uses Net.connect; its native annotations are Q29.
- **Q29** manifest Server tests' native HttpServer/NetAddr/TcpConn/Conn/ChildProcess/CommandStatus
  annotations, including bootstrap lifecycle rawFailure and WebSocket `u.fixture.ts` — private
  fixture types; **U** → projections from existing HTTP/Net/Process owner contracts where exact;
  medium type risk. No extra acquisitions occur at casts/annotations. Prove the exact native handle
  shape and public projection before changing these types; do not invent a portable socket or infer
  that a fake server cast opens a listener.
- **Q30**
  `code/sys/types/src/-test/m.Bdd.ts::registerTopLevelSuite,registerFocusedTopLevelSuite,registerTopLevelTest,runStep`
  — native registration/context.step / existing foundational adapter; **O** at the `@sys/types` test
  entry exported by `src/-test/mod.ts`; high policy risk. Preserve focused-proxy registration,
  registration rollback, hook/step ordering, top-level sanitizer/permission/timeout forwarding and
  nested unsupported-policy refusal. Importing the higher Testing facade back into its foundational
  adapter would reverse ownership; this is not ordinary Q01 registration.
- **Q31** `code/sys/types/src/-test/{m.Bdd.ts,t.Bdd.ts,-Bdd.types.test.ts}` native definition,
  context and permission annotations — adapter contract/types; **O**, existing foundational test
  owner; medium type risk. The adapter deliberately owns this native policy surface. Keep it out of
  unrelated production type pools; aliases would not make the runner policy portable.
- **Q32** `code/sys/std/src/m.Is/-test/-.test.ts::Is.netaddr: true` — serve/address/shutdown /
  independent native predicate example; **R**, target none; medium lifecycle risk. The assertion
  takes a real native address, then shuts its server down. Importing higher HTTP/Net into Std would
  reverse dependency direction. Retention is confined to this oracle, not all Std test setup.
- **Q33** non-executable comments, diagnostic/assertion strings and type descriptions in the
  declared root-script/code source scope, whether namespace-shaped or broader-word-only — text;
  **n/a**; low risk. Includes DenoVersion parser labels, Pi permission/help/prompt prose, Vite
  transport/bootstrap diagnostics, shell PATH display labels, Std timer/Rx comments, Types JSX notes
  and Workspace resolver/CI descriptions. These names do not acquire the namespace. A15 separately
  records injected mock keys; executable interpolation and embedded programs retain their earlier
  operation records. This text selector is not a general exemption for a TS file or a claim that its
  other code was tested.

- **Q34**
  `code/sys/http/src/http.server/m.HttpServer/-test/-u.serveStatic.test.ts::POSIX backslash names` —
  build.os in the test ignore option / runtime integration; **R**, target none; low risk. The
  pathname case is POSIX-only. Preserve actual host selection, not a mocked portability claim.
- **Q35** `code/sys/net/src/m.Net/-test/-u.connect.test.ts::connect` — native listen / independent
  connection-test endpoint; **R**, target none; medium risk. It supplies the listener to the Net
  connection subject and closes it after use; do not implement that independent endpoint through the
  connection operation being tested.

## Additional source-to-record corrections

These records follow live enclosing-contract reads at `a5af8f47e`. D01–D05 and P09–P11 address
supplied review counterexamples; the neighboring-family check also found the D06–D12/P12 omissions.
They are additions to the existing audit, not another checkpoint item or proof of all-candidate
closure. No source operation or test was executed.

- **D01** `code/sys.driver/driver-vite/src/m.vite/u/u.depAudit.react.ts::wrangle.reactWrappers` —
  readDir / production enumeration; **U** → Fs traversal/listing composition; medium risk. Retain
  regular files only, exact isReactWrapper exclusions and sorted names. Unlike V05's package walk,
  this filters wrapper files at one level. Prove native enumeration failure/race behavior and
  relative-name/depth semantics before adopting FsDir.ls; file-only output alone is not equivalence.
- **D02** `code/sys/http/src/http.server/m.HttpServer/u/u.start.ts::start,startWith,closeRuntime` —
  native serve acquisition, alias invocation and owned shutdown/completion / adapter; **O** →
  existing `@sys/http/server/host` start and HttpServer.start; high lifecycle risk. The export
  chains reach the same start function through -http.server.host.ts and m.Server.ts. Trace
  `deps.serve ?? Deno.serve → serve → server → finished/shutdown`. Preserve per-invocation fallback,
  supplied factory precedence, loopback default, origin validation, copied options, keyboard policy,
  rollback and ordered shutdown/completion/keyboard failures. Internal native server/address/handler
  types belong to this seam; P04 separately records its public contract. N13 is a different
  launcher.
- **D03** `code/sys/net/src/m.Net/u/u.connect.ts::connect,done` — native TCP connection / adapter;
  **O** → existing `@sys/net` Net.connect via m.Net.ts; high socket-ownership risk. Preserve
  defaults 127.0.0.1/10 attempts/100ms/1.5 backoff: the first attempt is immediate; waits occur only
  between failures, starting at delay and then rounding each backoff. Preserve last-error
  normalization and caller ownership of a successful socket. A failed/zero-attempt result does not
  fabricate a socket. The private done parameter's TcpConn annotation belongs to this seam; P03
  separately accounts for the public returned type. N18 is the Testing consumer, not this owner.
- **D04**
  `code/sys.driver/driver-pi/-scripts/{task.cli.ts,task.prep.deps.ts,task.start.gui.reset.ts,task.test.release.browser.ts,task.test.release.runtime.ts,task.vite.ts,task.vite.u.ts,u.test.release.ts}`
  native argv/exitCode/current-executable roles — production task entries/integration; **R**, target
  none; high status/authority risk. Preserve main guards where present, exact no-argument refusal,
  status after awaited work and nonzero-only publication where implemented. The reset main returns 1
  for a busy store and publishes it only after reporting; exceptions remain exceptions. Current
  executable selection in release launchers must not switch to another PATH binary. Q05's test
  selector does not cover these tasks; Q23 types and N27 env transfer remain separate.
- **D05** `code/sys/fs/src/m.Env/-.test.ts::withProcessEnv,search:none test` — native get/set/delete
  and restoration / independent reader control; **R**, target none; medium state risk. Save and
  restore absent/present state in finally; change present to empty then absent while observing the
  same live Env reader. Env.Reader cannot implement its own independent process-state oracle or
  mutations. Fixture file IO already uses Fs; Q03's different source set is not relied on here.
- **D06** `code/sys/std/src/m.Testing/-.test.ts::Deno.test sample` — native registration/context
  step / test composition; **U** → foundational BDD adapter candidate; medium test-policy risk. The
  body asserts a scalar through one native step; the title alone does not prove native runner
  retention is required. Decide whether this is deliberately teaching the raw step contract or
  ordinary registration before adoption. It is outside Q01's default source set.
- **D07** `code/sys/http/src/http.server/{m.HttpProxy,m.HttpStatic}/mod.ts::import.meta.main` — argv
  and exit / production entry integration; **R**, target none; medium status risk. Dynamic CLI
  loading stays main-only and exit follows the awaited result. N14 already covers cwd in the same
  expressions; neither N14 nor Q05 implicitly covered these host-entry effects.
- **D08** `code/sys/std/src/m.Path/-test/-.test.ts::isWindows,Path.Is.within` — build.os/cwd /
  independent path expectations; **R**, target none; low risk. The host fact chooses POSIX/Windows
  expected joins and ignore cases; native cwd constructs the relative-input refusal oracle. The Fs
  Path test in Y17 is a different file. Preserve observation and no path resolution for relative
  rejected inputs.
- **D09** `-tmp/-archive/-drivers/driver-quilibrium/src/m.Node/m.Release.ts::Release.env` and
  `-tmp/-archive/-drivers/driver-quilibrium/src/m.Node/-.test.ts::Release.env` — build.os/arch /
  archived runtime integration and independent expected OS; **R**, target none; medium risk.
  Preserve current host selection and x86_64→amd64/aarch64→arm64 label mapping. Native release
  writeFile remains Q17, not an exception derived from this record. No archive task was run.
- **D10** `code/sys/process/src/m.process/u.proc/u.spawn.ts::spawnWith/processOutput` — native
  stdout.writeSync / child-stream adapter; **O** → existing Process.spawn; high byte/lifecycle risk.
  Each non-silent stdout or stderr chunk is written once to host stdout before stream publication
  and handlers. Preserve raw bytes, ordering, fresh provider access and failure propagation. This
  code does not establish complete writes. Process.stdout accepts UTF-8 text and captures provider
  identity, so it is not an evidenced replacement for this binary forwarding seam. Private status
  annotations are K07, not another runtime acquisition.

- **D11**
  `code/sys.driver/driver-stripe/src/ui/ui.PaymentElement/-test/-dist.browser.test.ts::loads local dist`
  — native env.get / ordinary opt-in test gate; **U** → process-only Env at this async test
  boundary; medium risk. Preserve early return unless SYS_DRIVER_STRIPE_BROWSER_DIST is exactly '1',
  no dotenv/cwd acquisition and denied-env behavior. Native environment acquisition is not inert
  data merely because another Stripe file contains a forbidden-source regex (Q12).
- **D12** `code/sys/cli/src/m.core/m.Keyboard/-test.external/-keyboard.pty.proof.ts::test fn/env` —
  native env.toObject / PTY harness composition; **U**, no matching Env.Reader snapshot/mutation
  contract established; high forwarding risk. Preserve copied ambient values and explicit
  KEYBOARD_DENO/TERM overrides, detached group ownership and retained stdin. Y37 retains the
  independent native PTY/sanitizer/host observations, not this ordinary environment forwarding.

### Candidate reconciliation at 93114e47f

D13–D22/P13 follow the explicit path-and-role reconciliation in inventory.candidates.md. These are
existing source omissions, not newly added source paths. Tmpl, Cell and the Browser slice were
opened candidate by candidate, including mixed-role helpers; the remaining families still need that
map.

- **D13** `code/-tmpl/src/m.tmpl/-entry.ts::entry` — default argv and failure exitCode / production
  entry; **R**, target none; medium status risk. Supplied argv wins; caught parse, scaffold, bundle
  or help failures report before publishing 1. Successful calls do not reset a pre-existing status.
  Q05's test scope covers the independent status assertions, not this entry.
- **D14**
  `code/-tmpl/src/m.tmpl/-test/-u.makeBundle.test.ts::writes the bundle to the module path even when invoked from another cwd`
  — cwd save/chdir/finally restoration / independent generator-location control; **R**, target none;
  medium state risk. The cwd mutation falsifies accidental relative output; ordinary Fs.cwd adoption
  cannot replace changing process state. T04–T07 concern template defaults, not this test.
- **D15** `code/sys/cell/src/m.cell/-test/-u.sample.deploy.authority.ts::state,permissions` — native
  query and PermissionDescriptor parameter / independent authority control; **R**, target none; high
  risk. All six checks, including broad env and HOME-specific env, must report denied before
  DeploySampleProof.run. Queries do not request grants; preserve top-level await and fail-closed
  ordering. The parameter type describes this native seam, not a public exposure.
- **D16** `code/sys/cell/src/m.cli/-test/u.fixture.cli.vite.launch.ts::module body` — argv and
  exitCode / executable launcher fixture; **R**, target none; medium status risk. Forward exact argv
  to runVite with the fixed child entry, await its complete cleanup, then publish the returned code.
  A thrown launch failure must not be converted into a successful assignment.
- **D17**
  `code/sys/fs/src/m.Pkg.Dist/-test/-local.permission.process.ts::verifies and reads with permission for only the selected Dist root`
  — Command/current executable/output / parent harness; **U** → Process.capture/invoke candidate;
  high authority risk. Keep null stdin, piped outputs, exactly one selected-root read grant, frozen
  cached-only/no-prompt child policy, current executable and finally teardown. Native output is
  unbounded and startup errors reject; Process adds color policy and capture failure/bound
  semantics. X06 is the separate child's denied-ancestor oracle and does not classify this parent
  acquisition.
- **D18**
  `code/sys/testing/src/m.server/m.Browser/-test/u.browser.proof.ts::inspectBrowserProofResidue` —
  readDir / admission and postflight residue inspection; **U** → Fs traversal composition; high
  evidence-preservation risk. Inspect all entry kinds, retain at most 20 iterator-order names, mark
  truncation only upon observing a 21st entry, then sort the retained names. A file-only listing can
  hide retained directories; eager full traversal changes work/error bounds. Preserve native
  enumeration failures and refusal to clean unexamined evidence. Q19's permission oracle is
  separate.
- **D19**
  `code/sys/testing/src/m.server/m.Browser/-test/-u.chrome.executable.test.ts::filesystem identity,target replacement fixture`
  — writeTextFile and POSIX chmod / executable fixture construction; **U** → Fs.write candidate for
  bytes; no general chmod replacement established; medium risk. These writes prepare shell files
  before admission and are not native refusal observations. Preserve exact bytes, 0700 on
  non-Windows hosts, throwing preparation failures and finally removal. Fs.write adds parent/stat
  work; adoption must preserve the finite fixture-root grant. Q19 retains OS selection, permission
  queries and current-executable observations, not these ordinary writes.
- **D20** `code/sys/cell/src/m.cli/-test/u.fixture.kill.ts::RESOURCE_SERVICE_SOURCE/resources` —
  readTextFile / embedded executable fixture; **U** → Fs.readText/readJson composition only after
  standalone dependency/error proof; medium risk. The generated service reads its config when
  resources are queried; it is not a parent read or inert string. Preserve rejected read/parse
  failures, decoding, config path and optional host semantics. Parent writes already use Fs.
- **D21** `code/sys/cell/src/m.cli/-test/u.fixture.kill.ts::readyServerSource` — serve / embedded
  executable fixture; **U** → HTTP/Testing host candidate; high lifecycle/import risk. Preserve the
  supplied host/port, native startup reporting, explicit ready marker, persistent timer and parent's
  exact readiness-byte check before HTTP probing. Adding a managed host/import must not silently
  change startup bytes or cleanup ownership. Y33 is the parent Command/reader/kill lifecycle, not
  this child program; X09's deliberate orphan experiment is a different fixture.
- **D22** `code/sys/cell/src/m.cli/-test/u.fixture.kill.ts::withRuntimeDir` — env save/set/delete/
  restore / independent session-root control; **R**, target none; medium state risk. Preserve absent
  versus present-empty and finally restoration around the awaited callback. The synchronous native
  setter intentionally controls the production session reader; Y33's ordinary env-forwarding
  candidate cannot represent this mutation.

### Candidate reconciliation at 1e48de614

- **D23** `code/sys/types/src/-test/-Bdd.test.ts::BDD step policy boundary → emits exact owned keys`
  — native registration, capture/replacement/restoration of Deno.test and invocation of the captured
  suite with a synthetic step context / independent adapter-policy control; **R**, target none; high
  global-state/test risk. Trace `Deno.test → original`,
  `capture → Reflect.set(Deno, 'test', capture)` and finally restoration before running the captured
  definition. The query-suffixed adapter import isolates registration state. Preserve own-key checks
  distinguishing omitted policy from explicit false, exclusion of nested only/permissions/timeout,
  and restoration on import failure. Internal
  TestDefinition/TestStepDefinition/TestContext/typeof-test annotations describe this native seam,
  not extra calls. Q24 selects only bootstrap confirmations; it did not cover this interception. Its
  assertion-message spellings remain Q33 text. No registration or test was executed in the audit.

W19 and Y47 now have exact existing type projections (B); the absence of a portable signal contract
is not a reason to leave consumer spelling uncontained. This resolves one U record, adds one R
record, and does not enlarge the proposed migration batches automatically.

## Coverage reconciliation

The former excerpt queue and subsequent correction families map as follows; this is navigation, not
an additional count or occurrence-coverage proof:

| Former excerpt family                                              | Classified records                                 |
| ------------------------------------------------------------------ | -------------------------------------------------- |
| Rooted/Dist/Snapshot protocol errors and private metadata          | Z01–Z06, M11–M14                                   |
| Filesystem fixture setup, fault controls, observations and types   | X01–X06, Y01–Y19, D05                              |
| Cell/CLI/HTTP/Net/Event fixture roles                              | X07–X11, Y20–Y38, Q34/Q35, D12                     |
| Production entries and WebSocket lifecycle                         | Z07–Z20, Z22–Z27, D04/D07/D09                      |
| Pi preview/browser/ZIP authority, types and ordinary composition   | L05–L09/L14, N01–N05/N27/N28, Z15–Z18/Z21, Q19–Q23 |
| Server fixtures and foundational BDD adapter                       | Q24–Q32                                            |
| Remaining driver/Tools/Tmpl/deploy test and embedded-program roles | Q01–Q13, Y39–Y49                                   |
| Prose, assertion data and archive source                           | Q12–Q18/Q33, A06/A12–A15                           |
| Earlier normalized production/type excerpts                        | L01–L14, K08 and their named predecessor records   |
| Native production acquisitions/forwarding and wrapper listing      | D01–D03/D10                                        |
| Public/consumer/private native type corrections                    | P09–P12                                            |
| Std test roles and Stripe opt-in env                               | D06/D08/D11                                        |

The manifest preserves exact paths; residual selectors intersect that revision's candidates, not
future directory contents. The ledger has **389 classified records plus one mapping-only ID (Z10)**.
The old excerpt queue was normalized, but that did not establish complete occurrence coverage. The
supplied review's production/type counterexamples now have explicit records. A wider
source-to-record reconciliation remains outstanding; the candidate manifest now explicitly maps 205
paths, not the whole set. U compatibility questions are separate from coverage defects.

U records remain migration-design inputs: throwing versus structured IO; raw/all-entry traversal;
synchronous/absent environment semantics; mixed/piped stdio; standalone dependency closure; captured
provider authority; owned publication/cleanup; and native/public type projections. They authorize
neither retention nor migration. The inventory records syntax-analysis limits and generation
provenance separately; arbitrary computed runtime programs are not proven absent by this audit.
