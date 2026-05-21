# Plan: @sys/cli/shell + @sys/tools shell PATH/alias helper

## Status: retired — implemented

This arc is complete and retired as of the final root-menu surfacing commit.

## Lifecycle cleanup

This file is complete and ready to retire from live working context once the cleanup commit below is
present in history.

```text
plan(archive): close sys shell path alias helper
```

Implemented commit sequence:

```text
plan(create): sys shell path alias helper
feat(cli): add shell planning substrate
feat(cli): add shell managed block planner
feat(cli): add shell alias and PATH catalogs
feat(tools): add shell doctor command
feat(tools): add shell alias commands
feat(tools): add shell PATH commands
feat(tools): add shell apply flow
feat(tools): surface shell in root menu
```

Final proof commands passed:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/cli && deno task check && deno task test
cd /Users/phil/code/org.sys/sys/code/sys.tools && deno task check && deno task test
```

Final STIER decisions captured from implementation:

- `@sys/cli/shell` is pure shell config algebra only.
- `@sys/tools shell` owns env/profile inspection, formatting, backups, and writes.
- `sys shell apply --dry-run` previews and never writes.
- `sys shell apply` writes only after adjacent backup creation succeeds.
- Alias/PATH commands are preview-only in this arc; writes are centralized in `apply`.
- No `--apply` flag; the command noun is the action and `--dry-run` is the standard non-action flag.
- No global exact aliases like `cp`, `up`, `info`, or `agent` are installed by default.
- The `common` alias group currently resolves to `sys` only.
- Root surfacing is under the secondary `more...` menu with no root alias.

Known intentional plan drift:

- The final substrate folder is `code/sys/cli/src/m.shell/` rather than the early sketch `m.Shell/`.
- The final common alias catalog is intentionally minimal: `common = [sys]`.
- Full arbitrary PATH inventory/duplicate-directory reporting remains outside this first arc.
- A user-facing remove command remains a future feature; only the pure block remover exists.

## Plan file

```text
/Users/phil/code/org.sys/sys/-agent/sys-tools-path-setup.plan.md
```

This plan supersedes the earlier `setup` framing. The better noun is `shell`:

```text
sys shell = safe managed helper for shell PATH entries and aliases
```

`sys` is one managed alias in the catalog, not the whole feature.

## XHIGH decision

Split the feature into two cohesive layers:

```text
@sys/cli/shell
  pure shell/PATH/alias planning substrate

@sys/tools shell
  user-facing CLI, prompts, fs reads/writes, backups, apply flow
```

This gives high cohesion and clean coupling:

- `@sys/cli/shell` owns shell config algebra.
- `@sys/tools shell` owns the product experience.
- `@sys/tools shell` depends on `@sys/cli/shell`.
- `@sys/cli/shell` never depends on `@sys/tools`.

## Implementation roots

Pure substrate:

```text
/Users/phil/code/org.sys/sys/code/sys/cli/src/m.shell/
```

Public export:

```json
"./shell": "./src/m.shell/mod.ts"
```

User-facing tool:

```text
/Users/phil/code/org.sys/sys/code/sys.tools/src/cli.shell/
```

Root integration:

```text
/Users/phil/code/org.sys/sys/code/sys.tools/src/u.root/registry.ts
/Users/phil/code/org.sys/sys/code/sys.tools/src/t.namespace.ts
/Users/phil/code/org.sys/sys/code/sys.tools/src/types.ts
/Users/phil/code/org.sys/sys/code/sys.tools/deno.json
```

## Why not only @sys/tools?

Putting everything under `@sys/tools` is workable but less S-tier once the noun becomes broader
than `sys` setup.

The pure logic is reusable and non-product-specific:

- managed block text transforms
- alias catalog modeling
- PATH entry modeling
- shell dialect rendering
- conflict/state classification
- plan/result shapes

That substrate belongs near CLI primitives because it is about shell command-line environment
semantics, not one `@sys/tools` product flow.

## Why not mutating @sys/cli?

`@sys/cli` should not read or write shell profiles.

Allowed in `@sys/cli/shell`:

- pure functions
- string transforms
- type contracts
- dialect renderers
- plan generation from explicit inputs

Forbidden in `@sys/cli/shell`:

- `Deno.env`
- `Deno.readTextFile` / `Deno.writeTextFile`
- `@sys/fs` file IO
- backups
- prompts
- command execution
- real HOME/profile detection

Those side effects belong in `@sys/tools shell`.

## BMIND reset

The user does not want a magical profile editor.

The user wants a trustworthy helper that can answer and act on questions like:

```text
What shell/profile am I using?
What PATH entries matter?
Is Deno's bin reachable?
What aliases can @sys manage for me?
What exactly would be written?
Can I remove only what @sys added?
```

So the core flow is:

```text
observe current shell state → model desired aliases/PATH entries → render one managed block → preview → apply only with consent
```

Do not parse arbitrary shell code as if it were data. Shell profiles are executable programs.
Static inspection is heuristic outside the managed block.

## Command shape

Primary commands:

```sh
sys shell doctor
sys shell alias list
sys shell alias enable sys
sys shell alias enable common
sys shell path list
sys shell path add deno
sys shell apply --dry-run
sys shell apply
```

Mutation commands accept:

```sh
--dry-run              compute and print intended changes without writing
--profile <path>       explicit profile path
--shell <zsh|bash>     explicit shell dialect renderer
--help, -h             help
```

No hidden staging across CLI invocations:

- `alias enable ...` computes a complete preview-only plan.
- `path add ...` computes a complete preview-only plan.
- `apply` computes the recommended baseline plan and writes when not run with `--dry-run`.
- `sys shell` with no subcommand may become an interactive in-memory flow later, but first pass can show help or run doctor.

Recommended baseline for `apply`:

```text
PATH:  deno  when a trustworthy Deno bin target is known
Alias: sys
```

## Command semantics

### `sys shell doctor`

No writes. Reports observed state and recommended next action.

Observes:

- shell from `SHELL`
- HOME
- selected profile
- profile existence
- managed block state
- current process PATH entries
- known PATH target status
- managed aliases present/missing/stale
- likely alias conflicts in profile text

Truth caveat:

- Shell aliases are shell-local and usually not visible to child processes.
- Doctor can inspect profile text and managed block state, but it cannot prove every runtime alias in an already-running interactive shell.

### `sys shell alias list`

No writes. Shows alias catalog and current managed/conflict state.

Final catalog groups:

```text
sys       alias sys="deno run -A jsr:@sys/tools"
common    sys
```

States:

```text
enabled       present in the managed block
missing       not present
conflict      likely alias/function/command with same name outside managed block
risky         global name likely to shadow common shell behavior
unsupported   cannot render for selected shell dialect yet
```

### `sys shell alias enable sys`

Adds or repairs the `sys` alias inside the managed block.

Behavior:

- `--dry-run` prints plan and writes nothing
- without `--dry-run`, this command still previews only; use `sys shell apply` for writes

### `sys shell alias enable common`

Adds the conservative common alias set:

```sh
alias sys="deno run -A jsr:@sys/tools"
```

Do not install exact global aliases such as `up`, `info`, `agent`, or `cp` by default.
Those names can collide with user habits and system commands. Exact global aliases can be a later
explicit opt-in set with sharper warnings.

### `sys shell path list`

No writes. Shows:

- current process PATH entries
- duplicate entries
- missing/nonexistent directories
- known target entries and status
- managed block PATH entries

Important distinction:

```text
current PATH != future shell profile PATH
```

The command must label which world it is reporting.

### `sys shell path add deno`

Adds a managed Deno bin PATH entry when a trustworthy target exists.

Target resolution:

1. Prefer `$DENO_INSTALL/bin` when `DENO_INSTALL` is set.
2. Otherwise prefer `$HOME/.deno/bin` when it exists.
3. Otherwise use `Deno.execPath()` only as diagnostic evidence, not as permission to invent a path.
4. If no trustworthy target exists, fail with a recommendation instead of writing a guessed PATH entry.

POSIX render:

```sh
export DENO_INSTALL="${DENO_INSTALL:-$HOME/.deno}"
case ":$PATH:" in
  *":$DENO_INSTALL/bin:"*) ;;
  *) export PATH="$DENO_INSTALL/bin:$PATH" ;;
esac
```

### `sys shell apply`

Applies the recommended baseline plan:

- `sys` alias
- Deno PATH entry if safe/trustworthy

`sys shell apply --dry-run` is the canonical first command to preview the baseline.

## Managed block

The product-managed block marker should be owned by the user-facing product:

```sh
# >>> @sys/tools shell
# Managed by @sys/tools shell. Edit with: sys shell ...
...
# <<< @sys/tools shell
```

`@sys/cli/shell` must not hard-code this owner string. It should accept marker/owner options.

Generated block should be deterministic and parseable. Use stable item comments inside the block:

```sh
# >>> @sys/tools shell
# Managed by @sys/tools shell. Edit with: sys shell ...

# @sys.shell path deno
export DENO_INSTALL="${DENO_INSTALL:-$HOME/.deno}"
case ":$PATH:" in
  *":$DENO_INSTALL/bin:"*) ;;
  *) export PATH="$DENO_INSTALL/bin:$PATH" ;;
esac

# @sys.shell alias sys
alias sys="deno run -A jsr:@sys/tools"

# <<< @sys/tools shell
```

Rules:

- update only the managed block
- preserve all user-authored content byte-for-byte outside the block
- preserve newline style where possible
- keep or add a final newline
- one complete managed block may be replaced
- no managed block may be appended
- partial markers fail safe
- multiple managed blocks fail safe
- stale but parseable generated items may be normalized
- unknown manual edits inside the managed block make the block stale and require explicit confirmation
- removal deletes only one complete managed block

Backup target shape:

```text
<profile>.sys-tools-shell.<YYYYMMDD-HHMMSS>.bak
```

If backup creation fails, do not write the profile.

## Shell/profile support

First pass:

- zsh: write support, default `~/.zshrc`
- bash: write support only when target is unambiguous or explicit
- fish: doctor/list only until a fish renderer lands
- PowerShell/Windows shells: doctor/list only until a renderer lands

Detection belongs to `@sys/tools shell`, not `@sys/cli/shell`.

Detection inputs:

- `SHELL`
- `HOME`
- `DENO_INSTALL`
- `PATH`
- `Deno.execPath()` for diagnostics only
- explicit `--profile`
- explicit `--shell`
- existing profile files

Bash caution:

- `.bashrc`, `.bash_profile`, and `.profile` have different startup semantics.
- If ambiguous, require an explicit `--profile`.

## @sys/cli/shell substrate

Target structure:

```text
code/sys/cli/src/m.shell/
  mod.ts
  common.ts
  m.Shell.ts
  t.ts
  t.alias.ts
  t.path.ts
  t.block.ts
  u.alias.catalog.ts
  u.path.catalog.ts
  u.block.detect.ts
  u.block.render.ts
  u.block.update.ts
  u.plan.ts
  -test/
    -u.block.detect.test.ts
    -u.block.render.test.ts
    -u.block.update.test.ts
    -u.plan.test.ts
```

Public surface sketch:

```ts
export const Shell: t.Shell.Lib = {
  Alias,
  Path,
  Block,
  Plan,
};
```

Type sketch:

```ts
export namespace Shell {
  export type Lib = {
    readonly Alias: AliasLib;
    readonly Path: PathLib;
    readonly Block: BlockLib;
    readonly Plan: PlanLib;
  };

  export type Dialect = 'posix' | 'zsh' | 'bash' | 'fish' | 'powershell';
  export type Support = 'write' | 'doctor-only' | 'unsupported';

  export type Owner = {
    readonly id: string;
    readonly label: string;
    readonly commandHint: string;
  };

  export type AliasId = string;
  export type PathId = string;

  export type AliasEntry = {
    readonly id: AliasId;
    readonly name: string;
    readonly command: string;
    readonly risk: 'safe' | 'shadowing';
    readonly group?: string;
  };

  export type PathEntry = {
    readonly id: PathId;
    readonly expression: string;
    readonly label: string;
  };

  export type ManagedModel = {
    readonly aliases: readonly AliasEntry[];
    readonly paths: readonly PathEntry[];
  };

  export type BlockState =
    | { readonly kind: 'missing' }
    | { readonly kind: 'present'; readonly model: ManagedModel; readonly stale: boolean }
    | { readonly kind: 'invalid'; readonly reason: 'partial-markers' | 'multiple-blocks' };

  export type Plan = {
    readonly kind: 'add' | 'replace' | 'remove' | 'unchanged';
    readonly block: BlockState;
    readonly nextText: string;
    readonly changed: boolean;
    readonly warnings: readonly string[];
  };
}
```

Design constraints:

- inputs permissive, outputs readonly/strict
- no filesystem imports
- no process/env reads
- no prompts
- no command execution
- no hard-coded `@sys/tools` owner marker
- use `@sys/std` helpers through local `common.ts`
- if the `@sys/cli` common barrel lacks a required standard helper, add the missing export in the first substrate commit rather than writing local substitutes

## @sys/tools shell product adapter

Target structure:

```text
code/sys.tools/src/cli.shell/
  mod.ts
  common.ts
  m.cli.ts
  m.ShellTools.ts
  m.Doctor.ts
  m.Apply.ts
  t.namespace.ts
  t.ts
  u.detect.ts
  u.profile.ts
  u.render.ts
  u.help.ts
  -test/
    -m.cli.test.ts
    -m.Doctor.test.ts
    -m.Apply.test.ts
    -u.detect.test.ts
    -u.profile.test.ts
```

Responsibilities:

- parse argv with `Args.parse`
- resolve shell/profile from env/options
- read profile text through `Fs`
- collect current process PATH snapshot
- call `@sys/cli/shell` planner
- render rich doctor/preview/apply output
- prompt only in interactive mode
- create adjacent backup before writes
- write profile through `Fs`
- return clear exit behavior/errors

`@sys/tools` exports:

```json
"./shell": "./src/cli.shell/mod.ts"
```

Root registry:

```text
id: shell
aliases: undefined initially
root menu group: secondary, under more...
```

No `setup`, `env`, or `init` aliases in first pass. The product noun is `shell`.

## Safety semantics

Canonical flags:

- `--dry-run`: compute, validate, and print intended effects without writing

Hard rules:

- `sys shell apply --dry-run` never writes
- `sys shell apply` writes only after creating an adjacent backup
- list/doctor/alias/path commands never write
- permission errors name the exact file or directory that failed
- current shell state and profile state are labeled separately
- no test may read or write the real user home

Write transaction:

```text
read profile → compute plan → create backup → write next profile → print aftercare
```

Aftercare always includes a concrete source command for the selected profile and a verification command.
For the default zsh path this renders as:

```sh
source ~/.zshrc
sys --help
```

Never claim the current shell was updated.

## DX target

Doctor output:

```text
system:shell

shell      zsh
profile    ~/.zshrc                         exists
managed    missing
path       deno                             present in current PATH
aliases    sys                              missing
next       sys shell apply --dry-run
```

Alias list:

```text
system:shell aliases

sys        missing     alias sys="deno run -A jsr:@sys/tools"
```

Path list:

```text
system:shell path

current PATH
  ✓ /Users/phil/.deno/bin
  ✓ /opt/homebrew/bin
  ! /missing/bin              not found

managed
  deno                        missing
```

Dry-run preview:

```text
system:shell

profile    ~/.zshrc
backup     ~/.zshrc.sys-tools-shell.20260506-143012.bak
change     add managed shell block

# >>> @sys/tools shell
...
# <<< @sys/tools shell

No files written.
Apply with: sys shell apply
```

Successful apply:

```text
system:shell

wrote      ~/.zshrc
backup     ~/.zshrc.sys-tools-shell.20260506-143012.bak
next       source ~/.zshrc
verify     sys --help
```

Failure style:

```text
Cannot choose a bash profile safely.
Found both ~/.bashrc and ~/.bash_profile.
Run one of:
  sys shell apply --profile ~/.bashrc --dry-run
  sys shell apply --profile ~/.bash_profile --dry-run
```

## TMIND hard review

### Failure: hidden staging illusion

A sequence like this cannot rely on memory between invocations:

```sh
sys shell alias enable common
sys shell path add deno
sys shell apply --dry-run
```

Mitigation:

- every mutation command computes a complete plan immediately
- `apply` means recommended baseline, not "apply some hidden prior staging"
- future interactive `sys shell` may stage in memory within one process only

### Failure: @sys/cli becomes side-effectful

If `@sys/cli/shell` reads env or writes files, it becomes a second product tool.

Mitigation:

- pure substrate only
- product adapter owns all IO
- tests for `@sys/cli/shell` use strings and explicit snapshots only

### Failure: shell profile treated as data

Shell profiles are executable programs. Static parsing can lie.

Mitigation:

- parse only the managed block format we generate
- outside the block, use conservative text heuristics for conflicts only
- never rewrite user-authored lines outside the block

### Failure: alias collisions

Global aliases can break user workflows, especially `cp`.

Mitigation:

- default/common aliases are namespaced except `sys`
- exact aliases are future explicit opt-in only
- existing external `sys` alias blocks writes

### Failure: PATH duplication or wrong PATH world

Current process PATH and future shell profile PATH differ.

Mitigation:

- label current PATH vs managed profile entries
- use guarded PATH render
- only add Deno PATH when target is trustworthy

### Failure: bash ambiguity

Bash startup files differ across login/non-login shells.

Mitigation:

- zsh default is easy
- bash requires an unambiguous existing target or explicit `--profile`
- bash ambiguity fails without explicit `--profile`

### Failure: fish/PowerShell dialect lie

POSIX snippets are wrong for fish and PowerShell.

Mitigation:

- first pass doctor/list only for unsupported renderers
- add dialect renderers later behind `@sys/cli/shell`

### Failure: user content clobber

Bad markers or generated block drift could destroy user text.

Mitigation:

- partial markers fail
- multiple blocks fail
- backup before write
- replacement only between complete markers

### Failure: false-green tests

Tests that use real HOME can pass while damaging the developer environment.

Mitigation:

- fixture HOME only
- explicit profile paths in tests
- `@sys/cli/shell` pure tests do not touch filesystem

## Tests

### @sys/cli/shell tests

Run from `code/sys/cli`:

```sh
deno task test --trace-leaks ./src/m.shell
```

Cases:

- missing block appends deterministic block
- existing block replaces deterministic block
- removal deletes only the managed block
- unmanaged text preserved byte-for-byte outside the block
- partial marker fails safe
- multiple markers fail safe
- item comments round-trip alias/path model
- POSIX PATH renderer uses guarded insertion
- alias catalog marks safe vs shadowing risk
- newline style and final newline handling are stable

### @sys/tools shell tests

Run from `code/sys.tools`:

```sh
deno task test --trace-leaks ./src/cli.shell
```

Cases:

- zsh profile detection selects `~/.zshrc`
- bash ambiguity fails without explicit `--profile`
- explicit `--profile` wins
- fish reports doctor-only support
- doctor separates current PATH from managed block state
- dry-run writes nothing
- apply writes backup before profile
- backup failure prevents profile write
- external `sys` alias conflict blocks apply
- root help/menu includes `shell` under `more...`

Final package proof:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/cli && deno task check && deno task test
cd /Users/phil/code/org.sys/sys/code/sys.tools && deno task check && deno task test
```

Runtime probes after implementation should use the committed zsh fixture profile.
Create the fixture as part of the `cli.shell` tests before running these probes:

```sh
cd /Users/phil/code/org.sys/sys/code/sys.tools

deno task help
deno run -P=dev ./src/mod.ts shell doctor --profile ./src/cli.shell/-test/-fixtures/zshrc.sample --shell zsh
deno run -P=dev ./src/mod.ts shell alias list --profile ./src/cli.shell/-test/-fixtures/zshrc.sample --shell zsh
deno run -P=dev ./src/mod.ts shell apply --dry-run --profile ./src/cli.shell/-test/-fixtures/zshrc.sample --shell zsh
```

## Non-goals

- no Deno installer
- no arbitrary shell AST/parser
- no global exact aliases like `cp`, `up`, `info`, or `agent` by default
- no fish/PowerShell writes in first pass
- no automatic profile sourcing
- no hidden staging between CLI invocations
- no user-authored PATH line rewriting outside the managed block
- no `@sys/tools` behavior baked into `@sys/cli/shell`

## Scaffold/design gate

Before implementation:

1. confirm `m.shell` is the right `@sys/cli` module landing
2. confirm `cli.shell` is the right `@sys/tools` product landing
3. inspect available templates/scaffolds before creating new module boundaries
4. land `@sys/cli/shell` substrate first
5. write `t.ts` contracts before runtime fulfillment
6. only then land `@sys/tools shell` adapter
7. wire root menu last

## Thinking level

Use `HIGH` for the plan anchor commit:

```text
plan(create): sys shell path alias helper
```

The XHIGH/TMIND/BMIND design review has already happened in this plan. The plan commit should be
a clean historical anchor, not another maximal-reasoning implementation pass.

Use `XHIGH` again only when a commit threatens one of the major boundaries:

- moving side effects into `@sys/cli/shell`
- widening beyond managed-block edits
- adding unsupported shell writers
- adding global exact aliases such as `cp`
- changing hidden staging semantics

## Close-review commit sequence

Keep implementation commits small enough for close review. Target roughly 2-5 changed files per
commit, except tests or root wiring may push slightly higher.

```text
plan(create): sys shell path alias helper
feat(cli): add shell planning substrate
feat(cli): add shell managed block planner
feat(cli): add shell alias and PATH catalogs
feat(tools): add shell doctor command
feat(tools): add shell alias commands
feat(tools): add shell PATH commands
feat(tools): add shell apply flow
feat(tools): surface shell in root menu
```

### 1. `plan(create): sys shell path alias helper`

Scope:

- preserve this plan as the history anchor
- no implementation changes

Thinking level: `HIGH`.

### 2. `feat(cli): add shell planning substrate`

Scope:

- create `code/sys/cli/src/m.shell/` module boundary
- add type spine and public `Shell` surface
- add `./shell` export and root type/runtime wiring
- keep implementation side-effect-free

Acceptance:

- no filesystem/env/process IO in `m.shell`
- `@sys/cli` check passes

### 3. `feat(cli): add shell managed block planner`

Scope:

- detect managed block state
- render deterministic managed blocks
- replace/remove one complete block only
- preserve unmanaged text outside the block
- add focused block tests

Acceptance:

- partial and duplicate markers fail safe
- newline/final-newline behavior is pinned

### 4. `feat(cli): add shell alias and PATH catalogs`

Scope:

- add alias catalog model and default entries
- add PATH entry model and Deno entry renderer
- add risk classification for namespaced vs shadowing aliases
- add focused catalog/planner tests

Acceptance:

- `sys` and `common` alias sets are modeled
- Deno PATH render is guarded and POSIX-only for first pass

### 5. `feat(tools): add shell doctor command`

Scope:

- create `code/sys.tools/src/cli.shell/` module boundary
- add argv parsing/help for `doctor`
- detect shell/profile/PATH snapshot at product edge
- render no-write doctor output
- add doctor tests with isolated HOME/profile fixtures

Acceptance:

- doctor never writes
- current PATH and managed profile state are labeled separately

### 6. `feat(tools): add shell alias commands`

Scope:

- add `alias list`
- add `alias enable sys`
- add `alias enable common`
- support dry-run preview semantics for alias plans
- add alias command tests

Acceptance:

- common aliases are namespaced
- exact global aliases remain non-goals
- external `sys` conflict blocks writes

### 7. `feat(tools): add shell PATH commands`

Scope:

- add `path list`
- add `path add deno`
- resolve Deno bin targets conservatively
- add PATH command tests

Acceptance:

- no guessed Deno PATH entry is written
- missing/nonexistent PATH entries are reported, not silently fixed

### 8. `feat(tools): add shell apply flow`

Scope:

- add `apply --dry-run`
- add `apply`
- create adjacent backup before writes
- write selected profile only after backup succeeds
- print concrete aftercare
- add apply tests

Acceptance:

- dry-run writes nothing
- backup failure prevents profile write
- apply never claims the current shell was sourced

### 9. `feat(tools): surface shell in root menu`

Scope:

- add `shell` to root registry under `more...`
- add `./shell` export
- update root command type surface
- add root help/menu tests

Acceptance:

- root help shows `@sys/tools shell`
- root menu dispatches `shell`
- no unfinished shell command is surfaced before prior commits land
