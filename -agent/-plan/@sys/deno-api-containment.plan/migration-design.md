# Capability-sized Deno containment migrations

Governing plan: [deno-api-containment.plan.md](../deno-api-containment.plan.md). Evidence:
[owners.md](./owners.md), [inventory.md](./inventory.md),
[candidate manifest](./inventory.candidates.md), [operation ledger](./inventory.sites.md). Source
baseline: `a5af8f47e2690ba5b2523024a2b8a4ae8a7525b5`, with the inventory's explicit
worktree/source-drift limits.

## Decision and boundary

Prefer the existing capability owners. Begin with three behavior-preserving consumer batches and one
type-containment batch. Do not introduce a universal Runtime object, rewrite legitimate adapters,
port the repository, or optimize for zero Deno tokens. This is a proposal, not source
implementation, Git authority, or evidence of executed regression tests.

The audit's completion claim is withdrawn after source-confirmed production/type coverage defects.
Its corrected ledger currently has 92 U compatibility questions, not an allowlist; six G records
identify unmet contracts, not six admitted APIs. This design remains a draft and cannot establish
coverage closure. The numbered batches below select only the named operations; new audit records are
not automatically added to them. The later W19/Y47 signal-projection findings resolve consumer type
questions but are not automatically added to batch 4. Other operations in their files retain their
inventory dispositions. Reopen source and actual dependency resolution before implementation: a
workspace package existing locally does not prove every consumer resolves that local version.

No external reviewer was run for this design. The same-thread challenge pass retained native
throwing/removal semantics, authority capture and independent test controls instead of accepting
mechanical substitutions. Human review of this proposal has not yet occurred; no material human
finding is invented or marked resolved. The governing opening arc remains the landing ledger.

## 1. Process cwd defaults

Proposed subject: `refactor(sys): route process cwd defaults through Fs`

- Capability/owner: `@sys/fs` `Fs.cwd()`, whose default is process cwd, not INIT_CWD.
- Initial consumers: S01/S05/S07/S10–S13 root scripts; W02–W07/W11/W14 Workspace defaults; T04–T07
  authored repository-template scripts; C31 Tools `terminalCwd`.
- Stable locations: root
  `-scripts/{main.ts,task.check.graph.ts,task.info.ts,task.prep.deps.ts,task.prep.graph.ts,task.prep.ts}`;
  Workspace `m.ci/m.Build/{u.sync.ts,u.text.ts,u.write.ts}`,
  `m.ci/m.Jsr/u/{u.sync.ts,u.text.ts,u.write.ts}`, `m.pkg/u.sync.ts`, `m.info/u.stats.ts`; the four
  T04–T07 template scripts; Tools `src/u.root/u.cwd.ts::terminalCwd`.
- Preserve explicit argument precedence, lazy default evaluation, normalization already performed by
  callers, and the point at which relative paths acquire process cwd. Never substitute
  `Fs.cwd('terminal')`. Do not change argv, exit/status, IO, or Workspace runtime reports.
- Import constraint: use the local common barrel where appropriate; inspect added runtime edges in
  graph-check scripts. If a new import introduces eager host effects or a cycle, omit that consumer
  and record the exact import limitation rather than silently broadening the batch.
- Generation: change `code/-tmpl/-templates/tmpl.repo/` inputs, then regenerate only their embedded
  template bundle through the owning `prep:bundle` task. Inspect generated deltas. Do not run broad
  prep/clean or edit generated downstream repositories.

Acceptance: an owned temporary cwd different from INIT_CWD yields the process cwd; explicit cwd
wins; changed cwd is observed at the original evaluation point; poisoned INIT_CWD is ignored. Prove
no new work at import for narrow graph entrypoints. Use child fixtures rather than invoking prep,
build or publish bodies just to observe their defaults. Add focused tests through the owning task
surfaces below; extend root `test:root` explicitly if its fixed test-file list does not discover a
new root regression file.

Tools `test` fixes `./-scripts ./src` in its command; appending paths does not narrow it. As part of
the first touched Tools batch, propose declaring `test:containment` as
`deno test -P=test --trace-leaks`, without fixed discovery paths, then pass exact paths below. This
task does not exist yet and reuses the existing test preset without expanding it. Its declaration is
future implementation/config work, not an action taken here.

Proposed verification, not executed; Tools commands require that task declaration:

```sh
# Repository root: existing runner regressions, then owning checks.
deno task test:root
deno task check:graph
# From code/sys.tools:
deno task test:containment ./src/u.root
deno task check
# From code/sys/workspace:
deno task test --trace-leaks ./src/m.ci ./src/m.info ./src/m.pkg
deno task check
# From code/-tmpl, after inspecting generator writes:
deno task prep:bundle
deno task test --trace-leaks ./src/m.tmpl/-test/-u.makeBundle.test.ts
deno task check
```

The graph check is read-only repository analysis, not proof that each cwd case was exercised.
Existing tasks and new regression discovery must both be checked before calling the batch verified.

## 2. Optional hook metadata admission

Proposed subject: `refactor(tools): use Fs stat for optional hook admission`

- Capability/owner: `@sys/fs` `Fs.stat`.
- Consumers: C32 `code/sys.tools/src/cli.crdt/cmd.doc.graph/u.hook.ts::loadDocumentHook` and C33
  `code/sys.tools/src/cli.crdt/cmd.hook/u.hook.ts::loadRootHook`.
- Native stat throws on absence; Fs.stat returns undefined for NotFound. Preserve an explicit
  absent/non-file check and the existing catch for other stat failures. Do not introduce
  `Fs.Is.file`'s extra existence preflight without separate race proof.
- Keep dynamic import outside that catch. A syntactically invalid or throwing admitted hook must
  reject; an unreadable, missing, or directory candidate must yield no hook. No sandbox/trust
  change, hook-path rewrite, or generic loader is included.
- Dependency: independent of batch 1; inspect the exact local common/import edge. No new facade or
  synchronous API is needed.

Acceptance: missing path, directory, denied stat and injected non-NotFound stat failure produce no
hook; valid hook exports load; module evaluation/import failure propagates. Include disappearance
between metadata and import: it is an import failure, not an optional-hook absence. Use owned local
fixtures and existing dependency seams without weakening runtime permissions.

Proposed commands from `code/sys.tools`, not executed:

```sh
deno task test:containment ./src/cli.crdt/cmd.doc.graph ./src/cli.crdt/cmd.hook
deno task check
```

## 3. Async process-only environment readers

Proposed subject: `refactor(tools): use process-only Env readers in shell inspection`

- Capability/owner: `@sys/fs/env` `Env.load({ search: 'none' })`.
- Consumers: C34–C37 `code/sys.tools/src/cli.shell/{u.inspect.ts,u.doctor.ts,u.apply.ts,u.path.ts}`
  at `inspectShell`, `doctor`, `apply` and `inspectContext`.
- These enclosing operations are already async. Construct at an existing async composition boundary,
  only when no caller-supplied reader is present. Preserve callback precedence, original public
  signatures and per-key HOME/SHELL/DENO_INSTALL/PATH normalization.
- Missing native get returns undefined; Env.Reader.get returns an empty string. These eligible paths
  normalize absent/empty as unavailable; prove that fact at every changed use. Keep live reads
  rather than snapshotting or calling toObject. Construction with search none must not inspect
  dotenv or cwd.
- Exclude sync advisory/perf/help/PATH readers, env mutation, credential transfers and Pi authority
  scripts. Do not make a sync API async to fit this batch. No new env/set/delete abstraction.
- Dependency: independent of batches 1/2. Confirm the resolved Env implementation includes the
  process-only mode; dependency changes/publication, if required, need their owning authority.

Acceptance: present, absent, empty, whitespace, injected callback, repeated/live changes and
denied-env cases; no ambient access when injection suffices; no dotenv/cwd acquisition; no changed
shell/profile writes. Test with owned HOME and preview/apply stubs, never the user's shell files.

Proposed commands from `code/sys.tools`, not executed:

```sh
deno task test:containment ./src/cli.shell
deno task check
```

## 4. Consumer metadata type containment

Proposed subject: `refactor(sys): contain consumer metadata annotations through Fs types`

- Capability/owner: the existing `@sys/fs/t` `Fs.FileInfo` alias, not a new portable metadata
  schema.
- Eligible records: W17, C27–C29, Z21, Q23. L02 separately admits the existing `HttpServer.Started`
  server projection only after exact generic/readonly compatibility proof.
- Consumer boundaries: Workspace `m.info/u.stats.ts`; Tools metadata annotations identified by
  C27–C29; Pi ZIP `u.guard.ts::fileIdentity`, `u.policy.ts::rootEvidence`; Browser
  `u.chrome.executable.ts::ChromeExecutableValidationDeps`; Pi reset path-segment checks. The ledger
  is the exact symbol selector; exclude all runtime effects in the same files.
- Use type-only imports through the existing t lane. Preserve function variance, sync/async shape,
  optional fields, device/inode/mode checks and emitted import graph. Do not replace native owner
  declarations or Q29 unresolved fixture projections merely to remove spelling.
- Public FileInfo, NetAddr, signal/status, native server and testing-policy contracts remain a
  separate portability decision. A renamed alias changes no runtime-library requirement.

Acceptance: type equality/assignability at the exact consumer boundary; negative compile-time cases
for missing required metadata; no emitted runtime import or behavioral delta. Reuse owning type-test
conventions. Proposed owning `deno task check` runs from `code/sys/workspace`, `code/sys.tools`,
`code/sys.driver/driver-pi`, `code/sys/testing` and `code/sys/server` only when that package is
actually touched. Proposed focused unit tasks are Workspace `test`, Tools proposed
`test:containment`, Pi `test:unit` and Server `test:unit`, with exact test paths. Browser validation
uses Testing `test:browser:unit`, whose fixed pair includes the executable-validation spec without
launching Chrome. Testing `test:unit` excludes Browser and `test` also runs process controls;
neither is a substitute for that unit lane. Reopen task definitions before execution. Broad
real-host tests are not required merely for erased aliases.

## Explicitly unselected work

Other B records (E11, N07/N14/N26, L07/L13, Z25 and Y34) remain identified adoption candidates, not
forgotten exemptions. Fold them into a later same-capability implementation only after their owning
imports, credential/authority semantics and task surfaces are reopened. Do not enlarge the initial
batches across deployments, launchers or guards merely because the operation name matches.

| Question                                     | Evidence                                                          | Smallest next design decision; acceptance before migration                                                                                                                                 |
| -------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Throwing reads/stat and removal              | S06, W08/W15, C40/C41, M16/M23, Z28/Z29, ordinary setup Y/Q       | Preserve missing/denied/race distinctions and catch boundaries; no blanket structured-result or retry/recursive substitution. Prove the consumer's observable failures.                    |
| All-entry enumeration and higher composition | E01–E04/E09, T02, V05, D01, N23–N25, K04                          | Prove walk depth, links/special entries, ordering and deletion fences. Prefer composition at the existing owner; file-only ls is not readDir.                                              |
| Sync env and live authority transfer         | C26/C38/C39, V06/V08/V10, K08, L05/L06/L11, N27/N28, Z17, Q04/Q21 | Decide async composition without changing sync callers or missing-value authority. Mutation/transfer is not Reader.get.                                                                    |
| Process, HTTP, TCP and terminal lifecycle    | E05–E08, F23, V11/V12, N13/N18/N22, Y20/Y28/Y33, Q06/Q08/Q27/Q28  | Compare FORCE_COLOR, stdio, retries, deadlines, listener defaults, dependency direction, captured providers and owned settlement. Native control operations retain only their proven role. |
| Standalone/template imports                  | W09, N01–N05, Q10                                                 | Prove the emitted child's admitted import closure, bootstrap order and guard availability before adopting a facade. Regenerate from authority; never patch installed output.               |
| Public/private native types                  | P01–P13, K07/K08, Y47, Q13/Q29/Q31                                | Prefer exact existing projections; portability requires a separate contract decision, not alias replacement.                                                                               |

Six concrete gaps remain S03 synchronous read, C41 abortable read/publication, W20 timer unref, N08
mixed stdio/group ownership, N19 piped clipboard input and Q20 exclusive authority receipt. Preserve
the existing behavior until the lowest truthful owner admits a narrower primitive with independent
owner tests and immediate consumer adoption. One input primitive may serve two gaps only if their
contracts actually converge. No API name/signature or implementation commit is invented here.

## Regression-enforcement design

### Home and integration

Keep repository policy in root `-scripts`, beside existing graph/namespace checks. Do not add a
runtime package or burden a portable Std leaf with repository scanning. Proposed subject,
conditional on analyzer admission: `test(sys): enforce capability-owned Deno access`.

Proposed new entry: `-scripts/task.check.deno-boundary.ts`, backed by a focused pure analysis helper
and `-scripts/-test/-deno-boundary.test.ts`. Proposed root task `check:deno-boundary` uses a new
read-only named preset with repository read and no write/env/net/run grants. Neither task nor preset
exists yet. Integrate the task into root `ci` before the existing package check/test sequence; keep
`-scripts/task.check.ts::main` as its current Workspace.Run.check owner rather than hiding a second
policy scan inside that package runner. All task/configuration changes remain future source work.

### Detection contract

- Analyze TS/TSX syntax and lexical bindings, not regex totals: direct/optional/bracket/global
  access, namespace destructuring, captured methods/receivers and local aliases. Respect shadowed
  bindings.
- Associate operations with exact path, stable symbol, content plane and capability owner. Inspect
  transitive imports/cross-module alias exports when supported; flag unresolved escape instead of
  silently passing it. Unknown computed property acquisition is a review diagnostic.
- Analyze known executable literal/template child programs in a separate context. Attribute them to
  authored generator input, not every generated repetition. Do not execute generators to discover
  code; do not treat all strings, Markdown fences, comments, mock Deno keys or assertions as calls.
- Report native type exposure separately from runtime effects. A type-only alias is not a new native
  call; removing a Deno token does not remove the native-library type requirement.

No suitable general TS semantic parser was established in the inspected dependency authority.
`m.Esm/u.parse.ts` is not a general syntax parser, and an OXC runtime dependency does not establish
one. Parser selection/dependency admission is a concrete prerequisite of implementing this checker,
not of delivering the audit/design. Do not grow a home-made TS parser or claim regex enforcement has
these semantics. A first implementation must publish its supported syntax and deterministic
unsupported-case diagnostics; full dynamic-program analysis is not promised.

### Exceptions and proof

Store only exact operation exceptions with owner, rationale, content plane and stable selector in a
root check-owned data file. No package/test/template globs. O/R are candidates for reviewed
exceptions, not automatic grants; U/G cannot silently become allowed. A finite transitional baseline
for existing unmigrated consumers is debt, distinguishable from legitimate exceptions and prohibited
from growing without explicit review. Remove each debt entry with its migration. Exact
missing/renamed selectors and zero-match exceptions fail as stale; duplicated selectors fail rather
than extending scope.

Positive fixtures must detect direct Deno.readFile, optional global access, literal bracket access,
destructured/captured methods, alias forwarding and literal child programs. Negative fixtures must
exclude comments, mock keys, teaching strings, erased annotations from runtime counts, shadowed
local Deno and unrelated Reflect.apply. Add adversarial escaped/computed names, alias export/escape,
concatenated child source and generator-authority cases: either supported detection or an explicit
unsupported diagnostic, never a false certification. Prove stale/deleted/renamed exceptions and a
new bypass rejected by the check. Test the checker against independent fixtures, not its own regex.

Proposed future verification is the new root focused test task (to be declared explicitly),
`deno task check:deno-boundary`, and exact root CI wiring checks. Existing root `test:root`
currently names a fixed pair of files and will not automatically discover the proposed new fixture.
Do not claim these commands exist or ran. No runtime/source test, task edit, exception file or guard
was created in this documentation pass.

## Review conclusions and stop conditions

The strongest case against a broad migration is that it adds imports/authority and changes behavior
while merely reducing a lexical count. The inventory supports only the selected capability batches;
retain the legitimate low-level owners and independent controls. Stop an implementation batch on an
unproven import edge, changed failure/lifecycle/permission behavior, unresolved authority, or a need
for a new shared API. Record that concrete consequence rather than broadening grants or inventing a
Runtime layer. Source drift requires reopening the affected contract, not restarting the whole
audit.

This document delivers the ordered proposal and enforcement design. Human review remains to assess
its selected scope and any material findings; it is not represented as an approval, completed
review, landed commit, or permission to implement.
