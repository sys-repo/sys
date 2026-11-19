# Direct Deno usage inventory

- Governing plan: [deno-api-containment.plan.md](../deno-api-containment.plan.md).
- Owner evidence: [owners.md](./owners.md).
- Discovery manifest and coverage index: [inventory.candidates.md](./inventory.candidates.md).
- Operation ledger: [inventory.sites.md](./inventory.sites.md).

## Delivery boundary

**The previous audit-completion claim is withdrawn.** Source verification of the supplied review
confirmed omitted production operations and public/native type records, plus ambiguous residual
selector scope and incorrect owner-index references. Reproduced discovery and record arithmetic do
not establish occurrence coverage. The correction remains within the existing audit item.

The corrected ledger now contains 389 classified records, including 92 U compatibility questions.
These counts do not establish closed repository coverage. The supplied omissions were coverage
defects, not previously recorded U decisions or dynamic-analysis limitations. A completion claim
requires reconciliation against the remaining declared candidates, beyond fixing the sampled
counterexamples. Record counts are neither candidate-file counts nor native-call totals.

No source implementation, runtime tests, builds, services, permission probes, generation or Git
mutations were performed. Work remained documentation-only; unrelated UI/source and plan work was
preserved. The governing arc's unchecked audit row records landing, not implementation completion.

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

From repository root, the following namespace pattern and source exclusions were used for the
original discovery scan and subsequent re-entry scans. Self-evidence exclusions name all three
inventory documents and the migration design. They do not alter the pre-creation source snapshot.
The continuation scan used the equivalent `inventory*.md` glob while only the two original inventory
documents existed. Owner-map and plan prose remain in the historical discovery set.

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
  -g '!/-agent/-plan/@sys/deno-api-containment.plan/inventory.sites.md' \
  -g '!/-agent/-plan/@sys/deno-api-containment.plan/migration-design.md' \
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

### Continuation at the checkpoint landing

The next authorized continuation began at
`b328700abf97f59e6e75ffa23c9d066b728c107e docs(sys): checkpoint direct Deno usage audit`. Read-only
history and live documents agree that this is a partial checkpoint, not the landing of the complete
planned audit. No tracked or staged deltas were present at re-entry; untracked agent plans were
preserved. The concurrent Vite import-boundary fix landed separately at `d6d67eb1e`.

The reproduced scan observed **10,461 searched files, 624 candidate files, 2,502 matching lines, and
2,646 lexical matches**. Candidate-set reconciliation is **625 original − 2 archived + 1 added**:

- Added: `code/sys.driver/driver-vite/src/m.vite.config/-test/u.fixture.import-boundary.ts`.
- Its `Deno.args` and permission-query sites are opened and classified in ledger F25. This fixture
  asserts that write/net/run/ffi/sys authority is not already granted; the query is not a request.
- The historical manifest stays intact. The new path is an explicit current addition, not a
  retroactive change to the original snapshot. Counts remain lexical, not normalized operation
  totals.

The broader syntax challenge also includes
`code/sys/cli/src/m.core/m.Screen/-test/-u.platform.test.ts`, absent from the namespace manifest.
Opened source supplies injected `Deno:` mock objects, not ambient native access; ledger A15 records
that distinction. It is not an additional native-runtime file and does not change the 624 count.

### Completion-directed continuation

The human explicitly authorized taking the audit to completion at HEAD
`d84704d24a8197d74606df1eccaa5ecfdb86302e`. The scan still found **624 candidates across 10,461
searched files**, with **2,504 matching lines and 2,648 lexical matches**. Its candidate paths are
unchanged from the reconciled checkpoint set. Aggregate differences of two lines/matches do not
establish per-file attribution; the untracked governing plan has also changed. No source-migration
claim follows from those counts. Historical discovery is preserved above.

The initial status also showed an unrelated change to `code/sys.ui/ui/src/-test/-specs.ts`, in
addition to the existing inventory edits/untracked plans. No source file was edited by this audit.
Source-excerpt triage used read-only Git content at that HEAD; numbered additions additionally use
the named live file/contract reads. Excerpts are not promoted into completed classifications.

At an earlier formatting checkpoint, concurrent commit `a5af8f47e2690ba5b2523024a2b8a4ae8a7525b5`
landed only that UI spec-index reorder. Its inspected diff contains no Deno-site or audited-contract
change; this is not an audit commit. The index remained empty. The three inventory documents passed
exact-file formatting at that checkpoint; semantic coverage was still incomplete then. Subsequent
Z/Y/Q records expanded the evidence, but the supplied coverage review found ordinary production and
type omissions. Their addition alone did not close the audit.

The pre-review scan at that same HEAD observed **624 candidate paths, 2,504 matching lines, 2,648
lexical matches and 10,468 searched files**. Candidate paths remain the reconciled historical set.
The additional searched files do not add namespace candidates. Concurrent passkey source/config and
untracked fixture edits are unrelated; a live namespace screen of that subtree found no Deno sites.
The scan is a worktree observation, not a claim that all source bytes equal HEAD. Self-evidence
excludes the inventory documents and migration design; the historically included owner map and
governing plan remain included for reproducibility.

### Candidate-by-candidate continuation at 93114e47f

The next authorized pass began at `93114e47f987a74fe68074756cf2fe544a07ca59`. Repeating the exact
namespace command above found **624 candidates, 2,504 matching lines, 2,648 lexical matches and
10,475 searched files**. The candidate paths remain the reconciled historical set. Read-only history
from a5af8f47e contains three passkey/KeyValue UI commits, not audit source migrations. Tracked
audit-source paths in the Tmpl/Cell/Browser/Dist slice had no worktree diff; concurrent plan-buffer
and unrelated untracked plans remain outside this work. No index mutation occurred.

That continuation established an explicit **48-path content-role map**: all 14 Tmpl candidates, all
25 Cell candidates, eight Testing Browser/script candidates and the Dist permission parent. Each was
opened with its enclosing source. Seven additional broader-word-only text paths were opened and
assigned Q14/Q15/Q33; they do not increase the namespace count. This map separates runtime
operations, private types, authored templates, executable child strings and inert text. The other
**576 namespace candidates then still needed this explicit reconciliation**; that number is not an
unopened-source count and does not discard earlier source-backed records.

This pass found ten more missing executable records (D13–D22) and one private type record (P13):
Tmpl entry and cwd control; Cell deploy authority, launch status, embedded config read/server, and
env mutation; Dist's parent command; Browser bounded residue enumeration and executable setup;
Cell's native child parameter. It also corrected N11's actual startCell symbol, Y32/Y33 role
precedence, Y34's additional cwd consumer and Q19's invalid Q04/Q07 fallback for Testing Browser.
The supplied review examples were therefore not the complete defect set. These additions classify
existing candidates, not new source paths. No completion claim is restored.

### Candidate-by-candidate continuation at 1e48de614

The authorized GO continuation began at `1e48de614231ac413c322b6f4f7938cec5fd3e33`. The namespace
scan reproduced **624 paths, 2,504 matching lines and 2,648 lexical matches**, across **10,484
searched files**. Paths remain unchanged. History since 3283af4ac changes only two passkey UI files;
unrelated live UI/test/plan edits were preserved, and the index remained empty. This is a live
worktree observation, not a whole-tree byte-equivalence assertion.

The explicit map now covers **205/624 candidates**, adding 157: root scripts (18), generated
workflow (1), Workspace (28), Std (14), Types (5), remaining Testing (28), Net (10), ESM (1), YAML
(3), Automerge (7), and Tools production/templates/script (42). Source was opened with enclosing
contracts and public export evidence where used. The **419 remaining paths** still need explicit
operation/type/text/embedded-program reconciliation; this is not an unopened-file count.

The pass adds D23 for Types' native registration capture/restoration policy experiment, distinct
from Q24's bootstrap confirmations. It explicitly names F11/F12/F14 registration and F08's file
marker, clarifies N17's per-call native lookup and D03's immediate first connection attempt, and
resolves W19/Y47 through existing result-type projections: W19 R → B; Y47 U → B. Public Process
InheritOutput.signal is exactly nullable Deno.Signal; helper optionality/null normalization remains
unchanged. Containment does not imply portability. No migration batch is automatically expanded.

These are documentation corrections, not executed native controls or an independent completion
review. Audit completion remains withdrawn; the existing arc row 3 is still incomplete.

### Normalized record accounting

The ledger has **389 classified records**, plus mapping-only Z10, which repeats N14 and is excluded
from totals. The original 151-record increment remains S/W/T/C/F/A/P/V; continuations add
E/N/M/X/K/L/Z/Y/Q/D and P09–P13. A12 teaching text and A15 injected keys have native-runtime
disposition n/a; neither was included in executable counts. Earlier exact records take precedence
over residual selectors, so a later cross-family row does not reclassify its predecessor's
operations.

| Plane                                                              |  B |  O |   R |  G |  U | n/a | Records |
| ------------------------------------------------------------------ | -: | -: | --: | -: | -: | --: | ------: |
| Executable operations, including templates/child programs/fixtures | 35 | 45 | 160 |  6 | 87 |   0 |     333 |
| Type-only records                                                  | 10 | 27 |   1 |  0 |  5 |   0 |      43 |
| Non-executable teaching, mock, assertion or prose records          |  0 |  0 |   0 |  0 |  0 |  13 |      13 |
| Total                                                              | 45 | 72 | 161 |  6 | 92 |  13 |     389 |

ID ranges: S01–S20, W01–W20, T01–T09, C01–C42, F01–F25, A01–A15, P01–P13, V01–V12, E01–E13, N01–N28,
M01–M23, X01–X11, K01–K08, L01–L14, Z01–Z30, Y01–Y49, Q01–Q35 and D01–D23. There are 390 IDs; Z10 is
the one non-counted mapping. These are **record counts**, not unique occurrences, public exports,
candidate files or compiler-resolved calls. Multiple same-contract sites share a record; A07 spans
predicate-contract and implementation annotations. Private types listed with executable
adapter/control records do not become extra runtime operations or public exposures. Separate
annotation-only records remain on the type plane.

All 92 U records identify compatibility/ownership questions. The ledger's final coverage table maps
the former excerpt triage into classified records. This normalization does not establish that every
matching source operation has a record; the coverage review found counterexamples. Do not subtract
389 from 624 to invent a residual-file total.

A broader `\bDeno\b` root screen was also used to locate bare namespace captures and non-API text;
its exploratory totals are not the namespace baseline. Package-local discovery searches included:

```sh
rg -n --sort path '\bDeno\b' ./code/sys.tools/src -g '!**/-test*/**' -g '!**/*.test.ts'
rg -n --sort path '\bDeno\b' ./code/sys/workspace/src -g '!**/-test*/**' -g '!**/*.test.ts' -g '!**/m.help/**'
rg -n --sort path '\bDeno\b' ./-scripts -g '!**/-test/**'
rg -n --sort path '\bDeno\b' ./code/sys.driver/driver-vite/src -g '!**/-test*/**' -g '!**/*.test.ts'
```

Search output establishes candidate locations only. Classifications use opened live source and
read-only Git content/context, including enclosing contracts where retention/adoption is decided.
This is not a compiler-resolved audit or a claim to have read every line of every large file.
Replace `-l` with `-n` to recover locations, then reopen the exact contract before migration.

#### Alias and syntax reconciliation

- A01 traces `globalThis → { Deno } → noColor`; A08 traces `globalThis → g → Deno.version`.
- A09/A10 trace terminal/screen namespace acquisition, bracket-selected providers, descriptor and
  receiver capture, and later token-free Reflect.apply calls. Keyboard and text-format authority
  imports depend on those owners; their other captured ECMAScript intrinsics are not Deno calls.
- M05/M11/M12 trace native function capture into existing filesystem IO/exports, including later
  calls through injected bags. M13 deliberately differs by performing late native lookup.
- C26/C34–C38, N26–N28 and K08 trace environment bags/defaults across caller and reader boundaries.
  L01 follows captured AddrInUse; M21 follows the version object alias. Native handles/streams stay
  attached to the acquisition owner's operation record, not invisible token-free consumers.
- Y15/Y37 and Q03/Q09/Q25/Q27 cover capture, replacement, forwarding and restoration in tests,
  including Vite's `Reflect.apply(original, Deno, args)` and Server child serve instrumentation.
- The broader bare-word/global/bracket/capture screens were reconciled to these records, A15 mocks
  and Q12/Q14/Q15/Q33 text. Additional globalThis bracket/Reflect.get hits selected fixture data,
  eval or gc, not a newly established Deno namespace acquisition.

Limits: no sound whole-program proof is claimed for arbitrary computed/escaped namespace names,
shadowing, reflection, cross-module alias escape, eval or programs assembled dynamically from
unbounded inputs. Known literal child programs/templates are classified as executable. A future
checker must report unsupported dynamic cases for review, not silently certify them or count every
string as execution. These are analysis limits, not native-retention exceptions.

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
behavior. Check the import graph before adding Fs to a previously narrow graph-check script. The
ledger's later E/N/L/Z/Y records classify the additional named cwd roles; native cwd observations in
control tests remain distinct from consumer defaults.

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
deployment/compiler sources have their own N23–N25 decisions; they are not covered by these rows.

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
`Deno.noColor` during module evaluation and later color enablement. **O:** continuation source
tracing resolves its export through `@sys/std/ansi/server` → `m.Ansi/mod.ts` → `u.stdlib.ts`. This
is the server color adapter, not inert upstream prose or an excluded dependency directory. Preserve
capture and noColor policy; ledger A01 records the bounded decision.

`code/sys/std/src/m.Testing/u.randomPort.ts::randomPort` deliberately acquires and closes a native
port-zero listener. **O:** continuation tracing establishes the existing `Testing.randomPort` owner
through `m.Testing.ts` and `u.ts`; close is in finally. Net imports Std, so similarity with
`Net.Port.random` does not justify importing Net upward into Std. Ledger A11 retains this lower
adapter. A future deduplication proposal needs its own ownership evidence, not a zero-match goal.

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
  annotations; their inspected read/stat operations already use Fs. P11 records type-only consumer
  containment through Fs.FileInfo; these are not runtime IO bypasses.
- Process signal/status and HTTP/Net native server/address/socket types remain coupled as recorded
  in owners.md. Aliasing a type at an owner is containment, not proof of non-Deno type
  compatibility.

## Generated sources, tests, and prose

- `code/-tmpl/-templates/tmpl.repo/-scripts/` is authored template input and was included despite
  ignore rules. Generated template imports/artifacts must be regenerated from their actual
  authority, not edited to improve counts.
  `code/-tmpl/-scripts/-prep.u.ts::collectTemplateBareImports` uses native text reads; T01/T02
  record the throwing-read and traversal compatibility questions separately from source authority.
- `code/sys.driver/driver-pi/src/m.core/m.extension/m.sandbox/tmpl/u.path.ts` exports a local Fs bag
  with native rename/copyFile/lstat/remove and cwd-based path logic. The OCR `tmpl/u.path.ts` also
  duplicates cwd/path resolution. **U, high:** N01–N05 now record opened path/guard/command/run
  contracts, including nonrecursive removal, symlink refusal, cleanup and bounded subprocess IO.
  Standalone dependency closure and facade equivalence remain unresolved. Templates are not an
  automatic exemption, and importing a facade must not broaden launcher authority.
- Source authorities for those extensions were opened at
  `code/sys.driver/driver-pi/src/m.core/m.extension/m.sandbox/u/u.write.ts::writeExtension` and
  `m.ocr/u/u.write.ts::write` under the same extension root. They materialize `makeTmpl` output. The
  adjacent `u/u.make.ts::makeTmpl` files import embedded bundle JSON and filter its `tmpl/` inputs
  before writing; source-template changes therefore also need bundle regeneration. Template inputs,
  not generated installed extensions, are the future change surface. The complete bundle/dependency
  closure for future facade adoption remains a U question, not missing discovery accounting; no Pi
  configuration or extension was changed.
- The native network-refusal test in `code/sys/net/src/m.Net/-test/-m.Port.selection.test.ts` and
  native process/runner behavior fixtures cited in owners.md have concrete R cases. This does not
  resolve ordinary setup calls elsewhere in those files or other test files.
- `code/sys/std/src/m.Rx/u.polyfill.ts` and `m.Time/m.Delay/u.timerMsecs.ts` under the same std
  source root mention Deno in comments but the opened code uses Web/ECMAScript globals, not native
  Deno IO. They are broad-word-screen false positives, not migration sites.
- The manifest's plans, READMEs, CI, samples, archives and test programs now map to Q12–Q18/Q33 and
  their earlier exact records. W09/W10 classify generated CI programs; Y39 and Q10/Q11 keep
  executable child/browser strings apart from inert examples. File extension alone is not the basis
  for retention.

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

## Review adjudication and migration limits

The earlier checkpoint blind review is accepted only as a checkpoint assessment, not
audit-completion authority. It reported no new material classification defect in its bounded sample.
Its drift and mock-key observations were independently reopened in this continuation and are
recorded above/F25/A15. No review runtime results or reviewer model identity were supplied; none are
invented here. The recorded historical scan is not silently rewritten to the review's later source
state.

Continuation also resolved the earlier Ansi import-path and foundational random-port ownership
questions through source (A01/A11). Native-control fixtures are now distinguished from possible
ordinary registration/setup reuse; F23/F24 remain concrete U decisions, not blanket test exemptions.

The accepted later accounting findings are addressed without adopting the reviewers' approximate
file totals: previously prose-only enumeration/hosting decisions now map to E01–E08; exact
filesystem adapter evidence maps to M01–M23, process evidence to K01–K07, and Pi template evidence
to N01–N05. A12/A15 are n/a, not runtime-specific retention. The former uncounted excerpt triage is
mapped into Z/Y/Q records, but that accounting did not establish complete occurrence coverage. The
supplied later review disproved the completion claim through ordinary source counterexamples. The
external Claude pilot was not resumed; no actual reviewer model/effort is inferred from the
recommended configuration.

Source checks also narrowed the historical owner map: Size.dir (E09), walkUp (M23), isBinary (M16)
and process-port command discovery (K04) are higher compositions with unresolved adoption questions,
not automatically legitimate native adapters. This does not reopen or edit the landed owner-map
artifact; the inventory supplies the finer-grained current decisions.

The pre-coverage-review same-thread consistency pass separated Q24 native bootstrap controls from
Q01 ordinary registrations, added the foundational BDD owner/type records, and converted duplicate
Z10 into an explicit N14 mapping excluded from totals. It also rejected a blanket native exemption
for raw TCP fixture acquisition (Q28). This is source-backed adjudication, not independent reviewer
provenance.

### Supplied coverage review: source adjudication

Both completion-blocking findings are accepted after opening the named source and export chains. The
named corrections are applied; the broader coverage objection is not closed by these examples.

- **P1, production/selector omissions — accepted; named corrections applied, closure open:** Vite
  reactWrappers is D01 U; managed HTTP start's serve alias and Net.connect acquisitions are D02/D03
  O. Pi production task host effects are D04 R; Fs Env native state controls are D05 R. Q01–Q13 now
  explicitly apply only to their stated test and fixture sets plus named per-record exceptions; Q05
  is not a production-task fallback.
- **P2, separate type track — accepted; named type/index corrections applied:** P09 records public
  Watch.Event; P10 records public Process signal/status contracts through their actual type export
  chains; P11 records HTTP metadata consumer annotations. M19 and K07 remain private implementation
  evidence. Candidate-index P references were corrected against the actual P records, not the
  capability names guessed from their IDs.

A neighboring-family recheck also found and classified Std runner/Path tests, HTTP proxy/static
entry effects, archived Quilibrium host facts, Process.spawn binary echo, Stripe's ordinary env
gate, CLI PTY environment forwarding and Automerge's private address cast (D06–D12/P12). K07
explicitly names private status/output annotations; Q33 separates inert text with namespace-shaped
or bare-word spelling. These corrections add 16 records: 12 executable and four type-only. The old
361-record arithmetic was sound; that correction brought the total to 377. No additional raw matches
or candidate files are inferred from the record increment.

The supplied review's supported semantic dispositions are retained. Its counterexamples are present
at the preparation HEAD and have no target-source diff; they are not subsequent drift. The report is
bounded evidence, not exhaustive coverage proof. The wider remaining-candidate reconciliation is
still required before restoring completion; checking only these examples would repeat the error. No
new checkpoint, source migration or API decision is required to continue that existing audit.

Outstanding closure evidence: reconcile each current candidate's executable/type/text/embedded roles
to exact record selectors; verify residual Y/Q intersections and earlier-record precedence against
mixed-role source, including ordinary setup distinct from controls; then validate the final record
partition against that reconciled map. The family navigation table and corrected examples do not
satisfy those obligations. Arbitrary dynamic-program proof remains outside the declared boundary.

### Generated-source authority and repetition

| Content              | Authored authority and generation path                                                                                                    | Audit consequence                                                                                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository templates | `code/-tmpl/-templates/tmpl.repo/` → `src/m.tmpl/u.makeBundle.ts::makeBundle` → embedded template JSON → materialized repositories        | T01–T09 classify the source; ignored authored templates are included. `deno task prep:bundle` from `code/-tmpl` invokes `-scripts/task.bundle.ts` without clean/prep.                         |
| Pi sandbox/OCR       | each `src/m.core/m.extension/m.{sandbox,ocr}/tmpl/` → adjacent `-bundle/mod.ts` → `-bundle/-bundle.json` → `u/u.make.ts` → `u/u.write.ts` | N01–N05 classify executable templates. Driver-Pi `deno task prep` regenerates both plus ZIP/help/dependency outputs; it is not a narrow or read-only audit command.                           |
| Pi ZIP artifacts     | `src/m.core/m.extension/m.zip/-bundle/mod.ts` and its admitted source/dependency graph                                                    | L09/Z21 classify generator operations/types. `deno task prep:zip` owns generated artifacts; emitted `artifact*.json` is excluded, not independently editable source.                          |
| JSR workflows        | Workspace `m.ci/m.Jsr/u/{u.tmpl.ts,u.text.ts,u.sync.ts,u.write.ts}` → target YAML, including `.github/workflows/jsr.yaml`                 | W09 read programs and W10 argv/exit are executable children. Matrix construction derives from the same JSR_BODY_TEMPLATE; generated repetitions add occurrences, not independent authorities. |
| Deno staging         | driver-deno `m.cloud/m.DenoDeploy/m.stage/-tmpl/` and `-tmpl.note/mod.ts`                                                                 | Z20 argv and N25 dirBytes remain executable generator code; Q15 note prose is inert. Regenerate through that owner, not an installed staging artifact.                                        |

No generator was run. Authority reconciliation establishes where a later change belongs; it does not
prove that a new import will work inside a standalone template. Bootstrap/guard dependency closure
remains an explicit U adoption question.

### Concrete gaps carried into design

| ID  | Existing owner                     | Need not established by current facade                                                    |
| --- | ---------------------------------- | ----------------------------------------------------------------------------------------- |
| S03 | Fs                                 | Synchronous throwing JSON/text input for bump policy.                                     |
| C41 | Fs/Rooted composition              | AbortSignal-aware read before admitted stage publication.                                 |
| W20 | Time/process liveness              | Unref a warning timer without retaining the process. Injection does not decide ownership. |
| N08 | Process/terminal                   | Owned mixed stdin/stdio and group lifecycle for the Cell Vite launcher.                   |
| N19 | Process, consumed by Cli clipboard | Piped finite input, EOF and sequential NotFound-only utility fallback.                    |
| Q20 | Filesystem publication             | Exclusive createNew authority receipt, not overwrite/parent-creating convenience writes.  |

The remaining U questions are fully named in the ledger and grouped in the
[migration design](./migration-design.md). They include enumeration, throwing/structured errors,
removal/cleanup, synchronous env, process/host lifecycle, import/capture authority, standalone
graphs and native type projections. These require targeted source implementation proof or separate
API admission, not another discovery checkpoint. No public API or native exception is admitted here.

No source tests were required or run for this documentation audit. Formatting and diff checks prove
only the documentation boundary; proposed migration tests remain unexecuted.

### Documentation verification before the coverage correction

At pre-review HEAD `a5af8f47e2690ba5b2523024a2b8a4ae8a7525b5`:

- Exact-file `deno fmt --check` passed for inventory.md, inventory.candidates.md, inventory.sites.md
  and migration-design.md. Recoverable pre-format copies remain in `.tmp/`; formatter changes were
  compared against those copies and were layout-only.
- Target-attributed `git diff --check` was clean for the two tracked inventory documents. Separate
  no-index checks against `/dev/null` emitted no whitespace diagnostics for the untracked ledger and
  design; their difference exit status is not a zero-exit test result.
- Final discovery reproduced 624 paths / 2,504 lines / 2,648 lexical matches / 10,468 searched
  files. Original discovery paths were preserved; the Vite addition and two archives remain
  explicit.
- Cross-references, selected record IDs, generator wiring and proposed task forwarding were checked.
  Tools' fixed-path test task and Testing's Browser exclusion are reflected in the design rather
  than misrepresented as narrow test commands.
- The index remained empty. Changes attributed to this delivery are the three inventory documents
  and migration design; unrelated passkey/config and plan changes were not edited.
