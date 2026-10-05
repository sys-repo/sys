native-windows-ci-baseline.plan.md
- [ ] refactor(workspace): name Linux test workflow explicitly
- [ ] feat(workspace): generate native Windows test workflows
- [ ] test(ci): establish native Windows proof with @sys/std

## Purpose

Turn the system's cross-platform hypothesis into one real, durable host proof without coupling
Windows to Linux tests, builds, browser testing, JSR publication, or release policy.

Deno, TypeScript, and ESM make portability plausible. They do not prove filesystem, process, shell,
path, permission, or runner behavior. This plan establishes the smallest honest Windows feedback loop
from which broader package compatibility can be earned.

## Design position

The subject is not a second spelling of the current test workflow. The subject is native host proof.

Use two explicit generated workflow identities:

```text
.github/workflows/test.linux.yaml
.github/workflows/test.windows.yaml
```

Use matching workflow names:

```yaml
name: test:linux
name: test:windows
```

`linux` is accurate because the existing runner is Linux. `posix` would overclaim macOS and BSD.
`windows` is the canonical platform name; do not abbreviate it to `win`.

The Windows workflow targets this versioned GitHub-hosted runner label:

```yaml
runs-on: windows-2025
```

A versioned label is not an immutable image pin. Before implementation item 2, verify current GitHub
provider documentation for label availability, image lifecycle, and supported shell names. Record the
canonical documentation URLs used as evidence; if the repository cannot access the label, stop rather
than silently substituting another host.

It must exercise native Windows behavior under an explicit Windows-only `shell: pwsh` contract. Do
not select Bash, Git Bash, WSL, MSYS, Cygwin, or another POSIX compatibility layer to make existing
shell text pass.

## Current generation chain

The root task surface owns workflow refresh:

```text
deno task prep:ci
→ -scripts/main.ts
→ Workspace.Ci.sync(...)
→ WorkspaceCi.Jsr/Build/Test.sync(...)
→ .github/workflows/*.yaml
```

Observed ownership:

- `-scripts/main.ts` supplies ordered root workspace paths to `Workspace.Ci.sync`.
- `-scripts/common.ts` owns repository trigger configuration and allowed JSR scopes.
- `code/sys/workspace/src/m.ci/u/u.sync.ts` owns default workflow targets and aggregate sync.
- `code/sys/workspace/src/m.ci/m.Test/` owns test workflow discovery, rendering, writing, and tests.
- `code/sys/workspace/src/m.ci/u/u.workflow.ts` currently embeds Ubuntu and Bash assumptions shared by
  Linux test/build generation.
- `code/sys/workspace/src/m.ci/u.deno.ts` carries the generated CI Deno version.
- package `deno.json` task surfaces determine generated test/build membership.
- `x-sys.ci.test.browser` marks the separate browser-test extension of the current Linux test lane.

Generated workflow files are outputs. Change generation authority first, then regenerate; do not
hand-edit generated YAML as the source of behavior.

## Invariants

### Platform identity

- Linux and Windows test workflows are separate files and separate GitHub workflow identities.
- Do not put an operating-system dimension into one shared matrix.
- Do not add cross-platform `if: runner.os ...` condition chains to the Linux workflow.
- Renaming `test.yaml` to `test.linux.yaml` must leave Linux behavior unchanged except where the new
  identity mechanically requires a path or name update.
- Repository references to `.github/workflows/test.yaml` must be found and either updated when they
  describe the live target or left unchanged only when proven to be historical evidence.

### Native Windows execution

- Use the documented `windows-2025` versioned runner label, not `windows-latest`; do not describe the
  label as an immutable pin.
- Verify current GitHub-hosted runner and shell documentation before rendering the host contract.
- Use GitHub's native Windows run substrate with explicit Windows-only `shell: pwsh`; do not force a
  POSIX shell.
- Root checkout, dependency installation, workspace information, graph verification, and Deno
  information remain repository-root operations and carry no package `working-directory`.
- Apply `working-directory: ${{ matrix.path }}` to exactly the package `test:windows` step rather than
  using shell-level `cd` or a job-level working-directory default.
- Prefer direct commands such as `deno task install`, `deno info`, and the package test task.
- Do not copy the Bash retry loop into PowerShell. Add a cross-platform retry primitive only after a
  concrete failure demonstrates that direct installation is insufficient.
- Keep module paths repository-relative and slash-stable in generated YAML; prove GitHub and Deno
  consume them correctly on Windows.
- Keep permissions at `contents: read`. The Windows test lane needs no OIDC permission, publication
  authority, protected release environment, secret, or deployment credential.

### Release isolation

The following surfaces remain Linux-only and outside this plan:

- `.github/workflows/jsr.yaml` generation and JSR strata;
- JSR tags, OIDC, provenance, registry visibility, and publication commands;
- `.github/workflows/build.yaml` generation;
- browser runtime discovery and `test:browser` execution;
- release, bump, version, dependency-age, and environment policy.

Shared low-level YAML rendering may be reused only when it is genuinely host-neutral. Do not reshape
JSR or build APIs merely to make the Windows test renderer look symmetrical.

## Windows package admission

A package earns Windows CI admission through an explicit `test:windows` task in its `deno.json`.
The generated Windows matrix discovers that exact task from the same ordered workspace source used by
other CI generation.

Contract:

- task present → the package claims a native Windows proof surface;
- task absent → the package makes no Windows compatibility claim;
- the workflow invokes `deno task test:windows` in the package directory;
- the task must prove all public behavior applicable to Windows;
- the task may omit only behavior whose public contract truthfully identifies a different host
  substrate or an explicit unsupported result;
- a narrow task must not be used to make a broadly broken package appear Windows-compatible;
- package-specific exclusions require executable proof of the unsupported boundary, not a blanket
  operating-system skip.

The first admitted package is `@sys/std`. Its initial task value is exact:

```json
"test:windows": "deno task test"
```

The generator proves task presence, ordering, and safe rendering; it cannot prove suite completeness.
Source inspection, local invocation, and hosted logs must prove that `test:windows` reaches the
ordinary `@sys/std` suite without narrowing its discovery surface. Future package admissions remain
package-owner reviews rather than a central semantic inference.

This is progressive compatibility, not universal compatibility theater. A green first workflow proves
its admitted matrix only. It must not be reported as proof that every `@sys` package works on Windows.

## Generator shape

Keep platform-specific ownership visible beneath named `WorkspaceCi.Test.Linux` and
`WorkspaceCi.Test.Windows` capabilities.

Required design properties:

- Linux and Windows renderers may share module loading, safe matrix-scalar validation, ordered source
  discovery, trigger rendering, action versions, and write/sync result shapes.
- Linux owns its Bash dependency retry and browser setup.
- Windows owns its runner and native command shape.
- Host-specific text must not enter the JSR generator.
- `SyncArgs.targets.test` must expose named `linux` and `windows` targets.
- `SyncSummary.test` must expose named `linux` and `windows` results; do not use positional arrays or
  retain singular `test` as an implicit Linux alias.
- Aggregate runtime logging and return values must preserve independent result kinds, including one
  host being `unchanged` while the other is `removed` or `skipped`.
- Update root prep delegation tests, including `-scripts/-test/-task.prep.ci.test.ts`, to return and
  assert the named host shape.
- Do not preserve the existing `Test` API shape merely for backward compatibility if a smaller,
  clearer shape follows from the two real workflows.
- Do not introduce a generic runner framework, arbitrary shell dialect registry, or speculative
  macOS surface.

The implementation should choose the smallest semantic factoring after tests expose the stable shared
kernel. Duplication between two small host renderers is preferable to a parameterized template that
hides platform behavior.

## Implementation item 1 — explicit Linux identity

Target outcome: the existing Linux test lane is named for what it proves.

Work:

1. Add or update generator tests so the Linux target and workflow identity are exact.
2. Change the generated target from `.github/workflows/test.yaml` to
   `.github/workflows/test.linux.yaml`.
3. Change the rendered workflow name from `test` to `test:linux`.
4. Update the live root README badge and link from `actions/workflows/test.yaml` to
   `actions/workflows/test.linux.yaml`.
5. Regenerate through the authoritative root task.
6. Remove the stale generated `test.yaml` output through the normal refactor move/removal boundary.
7. Inspect all other live references to the old target and update only current operational
   references.

Acceptance:

- the generated Linux matrix, triggers, permissions, Deno version, dependency retry, graph check,
  package test commands, and browser behavior are otherwise byte-equivalent;
- root prep no longer recreates `.github/workflows/test.yaml`;
- repeated prep reports the Linux workflow unchanged;
- no JSR or build output changes.

## Implementation item 2 — native Windows generation

Target outcome: `@sys/workspace` can generate, write, sync, and remove a native Windows test workflow
from packages that expose `test:windows`.

Work:

1. Verify and record current GitHub documentation for the `windows-2025` runner label, hosted image
   lifecycle, and `pwsh` shell contract.
2. Shape named `WorkspaceCi.Test.Linux` and `WorkspaceCi.Test.Windows` contracts in the type plane.
3. Replace singular aggregate test target/result identity with named `test.linux` and `test.windows`
   members in both types and runtime results.
4. Add red generator tests for exact runner, workflow name, task discovery, root/package working
   directories, permissions, explicit `pwsh`, and forbidden POSIX-shell residue.
5. Implement Windows module discovery from the ordered source paths using `test:windows` presence.
6. Render a Windows job with checkout, the generated Deno pin, frozen dependency installation,
   workspace information, graph verification, Deno information, and the package-owned Windows task.
7. Keep every orchestration step at repository root; apply matrix `working-directory` only to the
   package test step.
8. Integrate `.github/workflows/test.windows.yaml` into aggregate `Workspace.Ci.sync` targets and
   results without changing JSR/build semantics.
9. Update root prep tests for the named dual-host result shape.
10. Preserve remove/skip behavior when no Windows-admitted modules exist.

Required negative assertions:

- no `ubuntu` runner;
- no Bash shell override and exactly the intended Windows `pwsh` contract;
- no `seq`, shell arithmetic, `test -z`, `command -v`, `$GITHUB_ENV`, or shell-level `cd`;
- no package working directory on root orchestration steps and exactly one matrix package working
  directory on the `test:windows` step;
- no Chrome setup or `test:browser` step;
- no publish command, OIDC permission, JSR trigger, or deployment environment.

Acceptance:

- generated YAML parses successfully;
- provider documentation supports the chosen runner label and explicit shell contract;
- unsafe package names and paths still fail closed before rendering;
- ordered module input produces an ordered Windows matrix;
- a package with only `test` is absent;
- a package with `test:windows` is present;
- named aggregate results independently represent Linux `unchanged` and Windows `removed` or
  `skipped` in the same sync;
- parsed YAML proves root orchestration has no package working directory and exactly the package test
  step uses `${{ matrix.path }}`;
- a stale Windows workflow is removed when no admitted package remains;
- Linux, build, and JSR fixture outputs remain unchanged outside their deliberate Linux rename.

## Implementation item 3 — first real host proof

Target outcome: GitHub executes a native Windows Server 2025 test of `@sys/std` through the generated
workflow.

Work:

1. Add the exact task `"test:windows": "deno task test"` to `code/sys/std/deno.json`.
2. Add source-level proof that the admission delegates to the unchanged ordinary suite.
3. Regenerate `.github/workflows/test.windows.yaml` through root prep.
4. Verify the generated matrix contains `@sys/std` and no package without `test:windows`.
5. Run focused local generator and both ordinary and delegated `@sys/std` tasks.
6. After the implementation commit is explicitly landed and pushed by an authorized operator, observe
   one GitHub-hosted Windows run and record its URL, runner label, image version, shell, Deno version,
   matrix package, ordinary-suite discovery/result surface, and final result in this plan's durable
   proof section.
7. If the first run fails, classify the failure as workflow substrate, `@sys/std`, dependency install,
   root workspace orchestration, or external runner service before changing scope.

Acceptance:

- GitHub runs on the documented `windows-2025` label under explicit `pwsh` without a POSIX
  compatibility shell;
- checkout, Deno setup, frozen dependency installation, workspace information, graph verification,
  and the unchanged ordinary `@sys/std` suite complete;
- hosted logs expose enough ordinary-suite discovery/result evidence to reject a narrowed green run;
- the observed run is green;
- no failure is hidden with `continue-on-error`, blanket skips, or shell emulation;
- the reported claim is limited to the admitted package and exercised root workflow substrate.

## Blast-radius map for follow-on work

The first green lane creates a trustworthy expansion mechanism. It does not absorb these packages
into this implementation arc.

### `@sys/fs`

Highest-priority follow-on compatibility review:

- `Fs.Path.trimCwd` contains slash-specific prefix logic;
- `Fs.Tilde` models `HOME` and POSIX separators;
- `Fs.Capability.Rooted` requires device/inode identity evidence;
- Rooted sealing and removal use Unix mode bits and descriptor `chmod`;
- tests exercise symlinks, hard links, permissions, case aliases, Unicode aliases, and child-process
  termination;
- Windows may require explicit unsupported results for capabilities whose safety invariant cannot be
  reproduced, rather than emulation or silent weakening.

### `@sys/process`

Second-priority follow-on compatibility review:

- `Process.sh` explicitly invokes `sh`;
- process termination uses `SIGTERM` and `SIGKILL` semantics;
- tests invoke shell and signal behavior directly;
- portable invocation and POSIX shell convenience must remain separate truthful contracts.

### `@sys/workspace`

Admit only after substrate findings are understood:

- workflow generation itself must pass on Windows;
- tests contain symlink fixtures and POSIX-shaped sample paths;
- package behavior depends on `@sys/fs` and `@sys/process` seams;
- root workspace info and graph verification exercised by the first workflow provide partial runtime
  evidence but do not equal the package's complete test suite.

Each follow-on package should receive a bounded plan or implementation item grounded in actual Windows
output. Do not pre-author broad portability fixes from static suspicion alone.

## Blind-review adjudication

The independent orthogonal review accepted the three-item direction and ordering with four material
corrections. All are accepted into this plan as durable constraints:

- verify provider truth, call `windows-2025` a versioned label, and use explicit `pwsh`;
- expose named Linux/Windows capabilities, targets, and aggregate results;
- keep root orchestration at repository root and scope matrix working-directory to the package test;
- require exact `@sys/std` suite delegation and hosted suite-parity evidence.

The review also identified the root README workflow badge as a live operational reference owned by
item 1. No review finding widens the opening arc into build, browser, JSR, release, `@sys/fs`,
`@sys/process`, or complete `@sys/workspace` compatibility work.

Review does not authorize implementation, Git mutation, remote mutation, publication, or workflow
dispatch.

## Verification

Use red → green → refactor for generator behavior.

Focused proof from `code/sys/workspace`:

```sh
deno task test --trace-leaks ./src/m.ci
deno task check
deno task dry
```

First package proof from `code/sys/std`:

```sh
deno task test
deno task check
deno task dry
```

Generated-output proof from the repository root:

```sh
deno task prep:ci
deno task check:graph
git diff --check
```

After all local items, run the full root verification tasks appropriate to the final changed surface.
Remote GitHub evidence is observed only after explicit human-authorized landing and push. A local
non-Windows host cannot substitute for the Windows runner result.

## Durable proof

Record only completed evidence here:

- canonical GitHub provider documentation URLs used to verify the runner label and shell contract;
- exact GitHub Actions run URL;
- observed runner label and image version;
- observed shell and Deno version;
- generated workflow path and workflow name;
- admitted package matrix;
- final result;
- any bounded unsupported behavior discovered and its owner.

Do not record transient implementation, staging, or landing state in this section.

## Completion criteria

This plan is complete when:

- the existing generated test lane is `.github/workflows/test.linux.yaml` with name `test:linux`;
- the root README badge targets the Linux workflow's live path;
- the generated native Windows lane is `.github/workflows/test.windows.yaml` with name
  `test:windows`;
- current provider documentation supports the recorded `windows-2025` and explicit `pwsh` contract;
- `WorkspaceCi.Test`, aggregate targets, and aggregate results identify Linux and Windows by name;
- root prep owns both outputs and repeated generation is stable;
- parsed YAML proves root orchestration and package working-directory ownership are distinct;
- JSR, build, browser, release, and publication behavior remain outside the Windows design;
- `@sys/std` owns the exact `"test:windows": "deno task test"` delegation;
- a GitHub-hosted `windows-2025` run proves the unchanged ordinary `@sys/std` suite and complete first
  matrix green;
- the evidence claim remains bounded to what ran;
- every material blind-review finding has a supported disposition; and
- follow-on `@sys/fs`, `@sys/process`, and `@sys/workspace` work is driven by observed evidence rather
  than folded speculatively into this arc.

## Non-goals

- no claim that all `@sys` packages work on Windows;
- no macOS, BSD, generic POSIX, WSL, or container matrix;
- no Windows build or browser lane;
- no JSR, OIDC, publication, version, bump, or release-policy change;
- no Bash-on-Windows compatibility strategy;
- no generic CI framework or shell abstraction;
- no speculative `@sys/fs` or `@sys/process` repair;
- no weakening of tests to obtain a green badge;
- no staging, commit, push, workflow dispatch, or other Git/remote mutation inferred from this plan.
