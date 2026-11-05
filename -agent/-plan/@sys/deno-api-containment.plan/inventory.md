# Direct Deno usage inventory

- Governing plan: [deno-api-containment.plan.md](../deno-api-containment.plan.md).
- Owner evidence: [owners.md](./owners.md).
- Candidate backlog: [inventory.candidates.md](./inventory.candidates.md).

## Delivery boundary

**Discovery snapshot and source-backed initial triage; semantic audit closure is not established.**
The root search covers the declared textual scope, but not every candidate has been opened and
classified by operation. The companion manifest preserves the full namespace-oriented candidate file
list with an explicit Unresolved disposition for residual sites. It is not a claim that all
remaining calls are legitimate, nor that a file-level match is one runtime call.

The current plan item needs continued source review and final site-level reconciliation before it
can be called complete. Migration design must not treat the unresolved remainder as an allowlist. No
implementation, tests, builds, services, permission probes, or Git mutations were performed. Only
these inventory documents were added by this pass; unrelated open work was preserved.

## Baseline and scope

- Repository: `/Users/phil/code/org.sys/sys`.
- Starting HEAD: `57fa435812640da660d8cd238ffc3a97419897fa`.
- Owner-map landing: `5d789e4325c4be3dee2fe61fad8b7e3c98fbef18`.
- Process-only Env mode is now landed at starting HEAD. The owner map's earlier uncommitted-source
  warning is historical evidence; current `Env.load({ search: 'none' })` was revalidated from
  source.
- At launch, concurrent tracked driver-vite README, task configuration, and lane-test edits were
  present, together with untracked Vite task/test files and agent plans. Those are not audit edits.
- Includes root scripts, `code/`, `deploy/`, `-tmp/` authored archives/WIP, templates, source tests,
  fixtures, Markdown, hidden CI/editor configuration, and untracked authored files. `--no-ignore`
  deliberately includes ignored source templates. No blanket exclusion for `-test` or drivers.
- Excludes Git/Pi state, installed dependencies, temporary/cache/build/vendor output, pulled
  bundles, local launcher config, dotenv/secret key files, lockfiles, and generated extension
  artifact JSON. No actual `.env` contents were read. Binary data is not interpreted as source by
  ripgrep.

Root `.gitignore`, template `.gitignore`, and Vite/Pi ignore files were opened to distinguish local
runtime state from authored content. An exploratory `dist*` directory exclusion was rejected because
it also hid authored `dist-content-identity.plan` records. The recorded namespace scan below uses
exact `dist`, `dist.public`, and `dist.private` names instead. Other build-output spellings and
binary or unusual encodings remain a coverage limitation, not an inferred exemption.

### Reproducible namespace candidate search

From repository root, the following scan was executed before creating the inventory files. For
subsequent scans exclude the two inventory documents themselves as shown, to avoid counting their
quoted findings recursively. That exclusion has no effect on the pre-creation snapshot.

```sh
rg --stats -l --sort path --hidden --no-ignore \
  -g '!**/.git/**' -g '!**/.pi/**' -g '!**/node_modules/**' \
  -g '!**/.tmp*/**' -g '!**/.deno/**' \
  -g '!**/dist/**' -g '!**/dist.public/**' -g '!**/dist.private/**' \
  -g '!**/.build/**' -g '!**/.cache/**' \
  -g '!**/vendor/**' -g '!**/-vendor/**' -g '!**/.pulled/**' \
  -g '!**/.bin/**' -g '!**/.swc/**' -g '!**/.data/**' -g '!**/.log/**' \
  -g '!**/.codex/**' -g '!**/.claude/**' -g '!/-config/**' \
  -g '!**/.env*' -g '!**/*.pem' -g '!**/*.key' -g '!**/*.lock' \
  -g '!**/-bundle/artifact*.json' \
  -g '!/-agent/-plan/@sys/deno-api-containment.plan/inventory.md' \
  -g '!/-agent/-plan/@sys/deno-api-containment.plan/inventory.candidates.md' \
  '\bDeno[[:space:]]*(\.|\?\.|\[|[,;)}])|["\x27]Deno["\x27]|\btypeof[[:space:]]+Deno\b|[={][[:space:]]*Deno[[:space:]]*$' .
```

Observed snapshot: **10,461 files searched; 625 candidate files; 2,507 matching lines; 2,651 lexical
matches.** These mix runtime expressions, types, string programs, examples, and prose. They are not
normalized usage totals. Source-backed classification totals are deliberately not inferred from
these numbers or by subtracting reviewed file counts from 625: files contain mixed dispositions.

### Re-entry scan and concurrent landing

A repeated namespace scan, excluding these two inventory documents, observed HEAD
`fc9c91f93d7c9f0a626be70e208810ad010f5861`: **10,457 searched files, 623 candidate files, 2,500
matching lines, and 2,644 lexical matches**. The original manifest is retained as discovery
evidence. The two candidate paths absent from the re-entry list are:

- `-agent/-plan/@sys.driver-vite/linux-wsl-probe.plan.md`
- `-agent/-plan/@sys.driver-vite/linux-wsl-probe.plan/phase-e-proof.md`

Read-only history confirms their removal in `fc9c91f93 plan(archived): linux-wsl-probe.plan.md`. Do
not restore them or mistake archival for consumer migration. Concurrent Vite task work landed at
`1700ff83f chore(driver-vite): move test lane orchestration into scripts`; those source/task deltas
are not audit edits. The re-entry scan confirms discovery drift, not semantic closure of the 623
current candidate files. Alias/site reconciliation and remaining source review are still pending.

A broader `\bDeno\b` root screen was also used to locate bare namespace captures and non-API text;
its exploratory totals are not the namespace baseline. Package-local discovery searches included:

```sh
rg -n --sort path '\bDeno\b' ./code/sys.tools/src -g '!**/-test*/**' -g '!**/*.test.ts'
rg -n --sort path '\bDeno\b' ./code/sys/workspace/src -g '!**/-test*/**' -g '!**/*.test.ts' -g '!**/m.help/**'
rg -n --sort path '\bDeno\b' ./-scripts -g '!**/-test/**'
rg -n --sort path '\bDeno\b' ./code/sys.driver/driver-vite/src -g '!**/-test*/**' -g '!**/*.test.ts'
```

Search output establishes candidate locations only. All findings below were checked through file
reads, including owning contracts where equivalence mattered. This is not a compiler-resolved audit:
multiline namespace expressions, escaped/computed property names, shadowed identifiers, alias escape
across modules, and programs assembled from multiple strings require further checking. The broader
word screen also needs residual reconciliation; a narrow regex is not proof that all aliases were
found. Replace `-l` with `-n` to recover candidate locations, then open source before deciding.

## Classification rules

- **B — Consumer bypass:** an existing facade represents the observed operation; later migration
  still needs the listed proof and import-direction check. Not permission for search/replace.
- **O — Owner implementation:** a specific operation is native adapter substrate, not a whole-file
  or whole-package exemption.
- **R — Runtime-specific integration:** a native entrypoint, exact runtime behavior, or test
  contract supplies the concrete reason for retention.
- **G — Facade gap:** an inspected consumer needs semantics not established in the current facade.
  This is evidence for discussion, not automatic admission of a new API.
- **U — Unresolved:** source, semantics, import containment, or proof is insufficient. No retention
  or migration decision is implied.

Type-only references and teaching text are recorded separately from executable calls. Where an
opened row covers one symbol, every other matching site in that file retains its own disposition.

## Source-backed consumer findings

### Process cwd: B, low semantic risk

`Fs.cwd()` defaults to `Deno.cwd()` without the `INIT_CWD` override. The following opened consumers
need process cwd, not terminal cwd. Public target: `@sys/fs` → `Fs.cwd()`.

- `code/sys.tools/src/u.root/u.cwd.ts::terminalCwd`: deliberately distrusts ambient `INIT_CWD`. Do
  not substitute `Fs.cwd('terminal')` despite the helper's name.
- `-scripts/task.check.graph.ts::main` and `-scripts/task.prep.graph.ts::main`: default cwd for
  workspace graph verification/preparation.
- `-scripts/task.prep.deps.ts`: root dependency projection input.
- `-scripts/task.prep.ts::syncPackageMetadata` and `main`: metadata/prep roots; Fs already imported.
- `code/sys/workspace/src/m.info/u.stats.ts::packageStats` and `normalizeGlobArgs`: caller default
  cwd, with filesystem helpers already in use.
- `code/-tmpl/-templates/tmpl.repo/-scripts/task.check.graph.ts::main`, `task.prep.graph.ts::main`,
  `task.info.ts::main`, and `task.prep.ts::main/updatePackages/updateCi` under that same authored
  template script directory repeat the process-cwd defaults. Change source templates and regenerate
  their bundle; do not fix only existing generated repositories.

Proof: preserve process cwd after `cd`, optional explicit cwd precedence, and poisoned `INIT_CWD`
behavior. Check the import graph before adding Fs to a previously narrow graph-check script. Other
cwd sites from the candidate manifest remain U until individually opened; lexical similarity is not
their verification.

### Optional hook metadata: B, bounded stat translation

- `code/sys.tools/src/cli.crdt/cmd.doc.graph/u.hook.ts::loadDocumentHook`
- `code/sys.tools/src/cli.crdt/cmd.hook/u.hook.ts::loadRootHook`

Both return no hook for any stat failure or non-file. `Fs.stat` plus an explicit absent/non-file
check can preserve that admission decision. Target: `@sys/fs` → `Fs.stat`; retain the existing
failure boundary. Risk: medium, because the subsequent dynamic import must remain outside the stat
catch. Verify missing, directory, denied-stat, valid-hook, and module-evaluation failure cases. No
change to hook trust/sandbox behavior is proposed by this inventory.

### Environment reading: B or U depending on synchrony

`code/sys/fs/src/m.Env/{t.ts,u.load.ts,mod.ts}` establishes the existing asynchronous process-only
reader. Targets below are `@sys/fs/env` → `Env.load({ search: 'none' })`, not default dotenv lookup.

- **B, medium:** `code/sys.tools/src/cli.shell/u.inspect.ts::inspectShell`, `u.doctor.ts::doctor`,
  `u.apply.ts::apply`, and `u.path.ts::inspectContext` in that same directory are asynchronous
  functions with injected environment callbacks. Their inspected environment normalization treats
  absent and empty values as unavailable. Preserve injection and all current public return types; do
  not introduce dotenv, a cached snapshot, or process mutation.
- **U, medium:** `code/sys.tools/src/cli.upgrade/u.advisory.path.ts::resolveUpgradeAdvisoryPath`
  takes `env: EnvLike = Deno.env` synchronously. It reads that alias's `get` method for cache/home
  lookup. The asynchronous reader cannot simply replace this default expression. Investigate
  composition at an existing async caller before proposing a public API change.
- **U, medium:** `code/sys.tools/src/cli.upgrade/u.advisory.ts::wrangle.debugRecord` and
  `code/sys.driver/driver-vite/src/m.vite.transport/u.resolve/u.trace.ts::trace.enabled` read native
  environment synchronously. `Env.load` is not a drop-in synchronous getter; import and
  initialization boundaries need design.
- **U, medium:** `code/sys.driver/driver-vite/src/common/u.perf.ts::perf.state` lazily reads two
  environment variables and caches derived state. It also reports `Deno.pid`. Do not introduce async
  initialization or claim the PID has an existing generic facade.

Proof for eligible readers: present, absent, present-empty, live update, denied-env, and supplied
injection cases. Preserve permission refusal. No actual user environment values were collected.

### IO that looks mechanical but is not verified equivalent

- **U, medium:** `code/sys.tools/src/cli.clipboard/u.copy.header.ts::makeHeader` directly stats a
  required file before formatting metadata. Target candidate `Fs.stat` changes NotFound into
  undefined; caller failure semantics must be traced before migration. Other hashing behavior is
  outside this Deno-specific item.
- **U, high:** `-scripts/task.clean.ts::main/deletePattern` removes selected files nonrecursively
  and currently rejects native absence. `Fs.remove` defaults to recursive and returns false for
  absence. Do not replace it without explicit nonrecursive/missing-file policy and regression tests.
- **G, medium:** `-scripts/task.bump.policy.ts::wrangle.readJson` uses synchronous native text reads
  of URL paths. `Fs.readText` is asynchronous and structured; no equivalent sync contract was
  established. Do not silently make bump policy asynchronous.
- **G, high:** `code/sys.tools/src/cli.pull/u.bundle/u.pull/u.pull.dist.ts::populateProjectionStage`
  uses `Deno.readFile(path, { signal })` while publishing into an admitted Rooted stage. `Fs.read`
  has no AbortSignal option; Snapshot adds bounds/identity/timeout semantics rather than being a
  transparent abortable read. Preserve cancellation and Rooted publication. Discuss the lowest owner
  with this concrete consumer before adding any shared API.

### Directory iteration: U, medium to high

Inspected native enumeration sites:

- `code/sys/yaml/src/m.cli/m.YamlConfig/u.fs/u.ts::listConfigs`
- `code/sys/yaml/src/m.cli/m.YamlConfig/u.fs/u.file.ts::migrateDir` and `countDirEntries`
- `code/sys.model/model-slug/src/m.fs/m.SlugTree/u.fromDir.ts::readDir`
- `code/sys.driver/driver-monaco/src/m.Vite/m.MonacoVite/u.tree.ts::inspectTree/visit`
- `code/sys.driver/driver-vite/src/m.vite/u/u.depAudit.react.ts::wrangle.reactWrappers`

`code/sys/fs/src/m.Fs/t/t.Dir.ts` and `u/u.toDir.ts` show that `Fs.toDir(...).ls()` returns filtered
file paths and explicitly excludes directories. It cannot preserve these callers by default.
`Fs.walk` is a possible composition, not an inspected raw `readDir` alias. Decide depth, root entry,
symlink/special-entry treatment, ordering, error propagation, and race observations first. In
particular Monaco's tree walk deliberately rejects symlinks and special entries via `Fs.lstat`. Do
not collapse that into a convenience listing that hides unsafe entries. Other enumeration sites in
deployment/compiler sources remain U until opened.

### Process and terminal composition

- **U, medium:** `deploy/@draft.shell/-scripts/task.kill.ts` spawns Deno task children with
  inherited stdio. Candidate target: `Process.inherit`. Its command adapter injects `FORCE_COLOR`,
  unlike the current native call. Verify environment, sequential status aggregation, and final host
  exit before calling this a behavior-preserving substitution.
- **U, medium:**
  `code/sys.driver/driver-vite/src/m.vite.config/u/u.app.specifierRewrite.ts::wrangle.warmNpm` runs
  `deno info --json`, discards stdout, and reports stderr. Candidate Process APIs add color policy
  and may capture different streams. Preserve command/environment/output semantics.
- **U, high:** `code/sys.driver/driver-vite/src/m.vite/u.dev/u.screen.ts::wrangle.isInteractive`
  directly checks native stdin/stdout and catches failures as false. `Cli.Is.interactive` owns the
  same ordinary decision but captures/validates provider authority; a fresh call is not identical
  under provider replacement. This is a likely facade adoption requiring explicit trust-boundary
  assessment, not a universal exemption for drivers.
- **R, medium:** `-scripts/task.test.info.ts::main` already uses `Process.inherit`; native argv,
  `Deno.execPath`, and host `exitCode` are entrypoint effects. Do not replace the current executable
  with an arbitrary PATH-selected `deno` command.
- **R, high:**
  `code/sys.tools/src/u.root/u.upgradeAdvisory.ts::startDetachedRootUpgradeAdvisoryProbe` queries
  permission for the current executable before an existing detached Process invocation. Keep that
  native authority gate intact. This audit does not authorize invoking the probe or changing its
  child permissions.
- **R, medium:** `code/sys.driver/driver-vite/src/m.vite.transport/u.resolve/u.npmPath.ts` selects a
  platform executable and executes a string program using native `Deno.args` inside the child.
  Parent Process invocation is already facaded; the string is a separate executable context, not an
  ordinary parent-side Deno call.

### HTTP hosting: U, medium lifecycle risk

- `deploy/@tdb.slc/-scripts/-serve.ts`
- `deploy/@tdb.slc.fs/-scripts/-serve.ts`
- `deploy/sample.proxy/src/entry.ts::import.meta.main`

These opened consumers use `Deno.serve` around an existing HttpServer/HttpProxy application.
Candidate owner: `@sys/http/server/host` → `start`. Compare address defaults, listener reporting,
port selection, keyboard ownership, and shutdown. The two static launchers separately install
HttpServer keyboard handling. Migrating without removing duplicate ownership or preserving native
options is unsafe. No generic rule converts every `Deno.serve` into this managed lifecycle.

## Native adapter and type evidence

Specific adapter operations documented and opened in this session's owner-map work remain O:

- `code/sys/fs/src/m.Fs/u/{u.read.ts,u.write.ts,u.stat.ts,u.lstat.ts,u.realPath.ts,u.rename.ts,u.remove.ts,u.makeTmpDir.ts,u.copy.file.ts,u.cwd.ts}`:
  native IO/error translation beneath Fs. Reopened read/lstat/cwd contracts support current triage.
- `code/sys/fs/src/m.Fs.capability/m.Rooted/u/u.io.ts`, `code/sys/fs/src/m.Snapshot/u/u.io.ts`, and
  `m.Pkg.Dist/u.verify/u.io.ts` under the same fs source root: low-level handle/identity IO for
  their distinct public protocols. Not blanket exemptions for other helpers in those directories.
- `code/sys/process/src/m.process/u/u.ts::asCommand`, `u/u.stdout.ts`, `u/u.child.owned.ts`, and
  `u.proc/u.capture.ts`/`u.spawn.ts` under that process source root: command, stdout, and
  owned-child substrate. Preserve native child authority and bounded cleanup.
- `code/sys/cli/src/m.core/m.Is/u.terminal.ts`: traced `runtime.Deno` → `deno` → captured stream
  providers. `m.Screen/u.platform.ts` under the same core root also uses optional `runtime.Deno` and
  captures measurement providers. Alias uses are runtime effects even without literal `Deno.`.
- `code/sys/std/src/m.Is/u.browser.ts::browser`: `globalThis` → `g` → `g.Deno?.version?.deno` is the
  owner predicate's runtime detector, not an environment read or a plain comment.

`code/sys/std/src/m.Ansi/u.stdlib.ts` destructures `{ Deno }` from globalThis and reads optional
`Deno.noColor` during module evaluation. This is a real runtime candidate despite the inlined
upstream copyright/prose. **U:** verify its public/live import path and upstream-vendor ownership
before treating it as an active adapter or changing its captured color policy.

`code/sys/std/src/m.Testing/u.randomPort.ts::randomPort` deliberately acquires and closes a native
port-zero listener. **U:** `Net.Port.random` expresses similar behavior, but importing Net into the
foundational testing substrate may create an upward dependency. Do not equate API similarity with
valid ownership. Use a lower-owner decision if this duplication is to be removed.

`code/sys/workspace/src/m.run/u/u.completion.hang.ts::wrangle.defaultDeps` uses `Deno.unrefTimer`.
**G:** the inspected `code/sys/std/src/m.Time/m.Delay/t.ts` exposes cancellation/abort, not timer
unref. Preserving parent-process liveness is a real semantic requirement; ordinary `Time.delay`
would not establish it.

Type-only rows, separate from native runtime migration:

- `code/sys/fs/src/m.Fs/t.ts::Fs.FileInfo` is `Deno.FileInfo`; native realPath type projection
  remains.
- `code/sys/std/src/m.Is/{t.ts,m.Is.ts}::Is.netaddr` exposes a structural `Deno.NetAddr` predicate.
- `code/sys/http/src/http.server/m.HttpServer/u/u.computeEtag.ts::computeEtag` and
  `u.serveFile/u.serveFileWithEtag.ts` under that server source root use `Deno.FileInfo`
  annotations; their inspected read/stat operations already use Fs. Do not report those annotations
  as bypasses.
- Process signal/status and HTTP/Net native server/address/socket types remain coupled as recorded
  in owners.md. Aliasing a type at an owner is containment, not proof of non-Deno type
  compatibility.

## Generated sources, tests, and prose

- `code/-tmpl/-templates/tmpl.repo/-scripts/` is authored template input and was included despite
  ignore rules. Generated template imports/artifacts must be regenerated from their actual
  authority, not edited to improve counts.
  `code/-tmpl/-scripts/-prep.u.ts::collectTemplateBareImports` itself uses native text reads; **U**
  until parse/error semantics and the generator call chain are traced.
- `code/sys.driver/driver-pi/src/m.core/m.extension/m.sandbox/tmpl/u.path.ts` exports a local Fs bag
  with native rename/copyFile/lstat/remove and cwd-based path logic. The OCR `tmpl/u.path.ts` also
  duplicates cwd/path resolution. **U, high:** generated extension bootstrap and guard semantics
  must be inspected before importing a remote facade. These are not automatically legitimate merely
  because they are templates.
- Source authorities for those extensions were opened at
  `code/sys.driver/driver-pi/src/m.core/m.extension/m.sandbox/u/u.write.ts::writeExtension` and
  `m.ocr/u/u.write.ts::write` under the same extension root. They materialize `makeTmpl` output. The
  adjacent `u/u.make.ts::makeTmpl` files import embedded bundle JSON and filter its `tmpl/` inputs
  before writing; source-template changes therefore also need bundle regeneration. Template inputs,
  not generated installed extensions, are the future change surface. The complete bundle/dependency
  closure remains unverified; no Pi configuration or extension was changed.
- The native network-refusal test in `code/sys/net/src/m.Net/-test/-m.Port.selection.test.ts` and
  native process/runner behavior fixtures cited in owners.md have concrete R cases. This does not
  resolve ordinary setup calls elsewhere in those files or other test files.
- `code/sys/std/src/m.Rx/u.polyfill.ts` and `m.Time/m.Delay/u.timerMsecs.ts` under the same std
  source root mention Deno in comments but the opened code uses Web/ECMAScript globals, not native
  Deno IO. They are broad-word-screen false positives, not migration sites.
- The companion manifest includes plans, READMEs, CI, samples, archives, and test programs. Their
  unreviewed sites stay U; a documentation path does not prove a match is inert prose. Executable
  strings and teaching examples need independent classification.

## Candidate migration groups for later design

These are proposals, not new live arc items or permission to implement:

1. **Process cwd defaults:** `refactor(sys): route process cwd defaults through Fs`. Start with the
   named B sites; prove poisoned INIT_CWD and explicit cwd precedence.
2. **Optional hook metadata:** `refactor(tools): use Fs stat for optional hook admission`. Preserve
   the catch boundary and import-failure propagation.
3. **Async process-only readers:**
   `refactor(tools): use process-only Env readers in shell inspection`. Preserve DI, empty/missing
   handling, live reads, and native refusal.
4. **Directory enumeration:** no implementation subject admitted yet. Decide whether existing walk
   composition preserves the named contracts or a concrete lower-owner gap exists.
5. **Child/HTTP/terminal adoption:** no omnibus replacement subject. Resolve the listed environment,
   authority, address, and lifecycle differences first, then name capability-sized commits.
6. **Abortable read, synchronous read, and timer-unref gaps:** separate owner-design decisions if
   retained as current needs; do not prebuild a universal Runtime object.

## Remaining work before audit closure

1. Open and classify residual sites in the candidate manifest by exact symbol/operation, beginning
   with production code, generated inputs, and security-sensitive driver/hosting code not yet read.
2. Reconcile broad-word-screen leftovers and alias propagation; document computed-name limitations.
3. Classify test setup separately from native-behavior assertions, and executable strings separately
   from inert prose. Record stable symbols or exact locations and semantic risk per site.
4. Normalize per-category/site totals from the source-backed ledger; raw rg counts are not enough.
5. Continue reconciling the historical manifest with current source and Git/worktree state. The
   re-entry scan above accounts for two archived candidate paths; any later additions or source
   changes need their own evidence. Do not silently drop candidates.
6. Review the resulting inventory. Only then use it as the basis for migration-design.md.

No source tests are required merely to write this inventory. None were run. Exact-file formatting
and source reads verify the documentation boundary, not the correctness of a future migration.
