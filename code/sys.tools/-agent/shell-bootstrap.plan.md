# @sys/tools shell bootstrap plan

## Status
Candidate plan.
Not opened for implementation yet.

## Why this matters
The current onboarding pain is real:
- Deno may already be installed
- the operator can already run `deno run -A jsr:@sys/tools`
- but a productive day still gets blocked by shell trivia
  - aliases
  - `PATH`
  - profile-file selection
  - shell startup semantics

This creates a bad early-user loop:
- the person is capable
- the conversation is ready to move into real system work
- but hours get lost to local Unix setup folklore

The real product goal is not “aliases.”
It is:
- safe developer shell bootstrap
- repeatable workstation entry setup
- faster `@sys` onboarding with explicit user consent

## Surface ownership
This should start in `@sys/tools`, not `@sys/workspace`.

Why:
- this is operator-facing bootstrap UX
- this needs interactive review/selection/approval
- this is about shell/profile management on the local machine
- this is not primarily a workspace graph or repo topology concern

If the lower-level shell/profile engine later becomes broadly reusable, it can be extracted.
But the first product surface should live in `@sys/tools`.

## Core doctrine
Truth first, mutation second.

Meaning:
1. detect shell/profile state
2. model the desired bootstrap/profile state
3. preview the exact change
4. require explicit approval
5. write only within a managed owned block

Do **not** auto-mutate profile files on first run.
Do **not** hide writes behind convenience.

## Managed block rule
Profile-file mutation must be deterministic and reversible.

Never spray ad hoc line edits into `~/.zshrc`, `~/.bashrc`, or `~/.profile`.
Use one managed owned block, for example:

```sh
# >>> @sys shell bootstrap >>>
alias sys='deno run --quiet -A jsr:@sys/tools'
# <<< @sys shell bootstrap <<<
```

If path/env setup is needed, it belongs inside the same owned block.
This makes update/remove/reapply operations safe and reviewable.

## First real use-case
Bootstrap a user who already has Deno, so they can quickly get:
- `sys`
- required `PATH` support such as `~/.deno/bin` when needed
- a small baseline shell profile consistent with `@sys` expectations

Canonical sample alias:

```sh
alias sys='deno run --quiet -A jsr:@sys/tools'
```

## Product shape
A future shell/bootstrap surface should likely look like:
- `sys shell doctor`
- `sys shell setup`
- `sys shell print`
- `sys shell remove`

### `sys shell doctor`
Reports facts only:
- active shell
- candidate profile files
- whether Deno is installed
- whether `~/.deno/bin` is on `PATH`
- whether the `sys` alias is already available
- whether a managed `@sys` shell block already exists

### `sys shell setup`
Interactive explicit setup flow:
- choose shell/profile target
- choose a bootstrap/profile preset
- preview the exact managed block or diff
- confirm write
- print next-step activation instructions

### `sys shell print`
Prints the managed block without writing.
Useful for manual review and external setup docs.

### `sys shell remove`
Removes only the managed block owned by `@sys`.

## Desired-state model
This is broader than aliases.
A future profile model may include:
- aliases
- `PATH` entries
- environment variables
- shell-specific bootstrap snippets

Likely conceptual shape:

```yaml
profile: default
aliases:
  sys: deno run --quiet -A jsr:@sys/tools
path:
  prepend:
    - ~/.deno/bin
env:
  SYS_SHELL_PROFILE: default
```

But keep two layers distinct:
- declarative desired shell state
- concrete shell/profile-file application policy

## YAML posture
Do not start with a fully general user-authored shell DSL.

Prefer:
1. built-in presets first
2. local YAML override later if clearly earned

Why:
- built-ins reduce complexity
- built-ins help onboarding immediately
- local override can come later without forcing early abstraction

## Design split
The future feature should split into 3 clean layers.

### 1. Facts / detection
Detect:
- shell kind
- candidate profile files
- current `PATH`
- alias availability
- managed block presence
- whether Deno and other required executables are present

### 2. Desired state
Model:
- aliases
- path edits
- env vars
- managed block contents
- preset/profile selection

### 3. Apply UX
Own:
- target selection
- preview/diff
- approval
- write/update/remove flow
- next-step instructions

## First implementation scope
In scope for a first pass:
- macOS and Linux
- bash and zsh
- alias + `PATH` baseline
- one managed block
- explicit preview + approval
- remove/update support

Out of scope for the first pass:
- fish
- nushell
- powershell
- prompt theming
- fully general shell DSL
- automatic mutation
- hidden background fixes

## Workspace relation
`@sys/workspace` may later help with:
- repo-aware presets
- workspace-derived helper aliases
- team/shared bootstrap profiles

But that is not the first seam.
The first seam is local shell bootstrap under `@sys/tools`.

## Safety posture
Any write flow must:
- detect candidate targets conservatively
- show the exact target file
- show the exact managed block or diff
- require explicit consent
- remain reversible
- avoid touching unmanaged user content

If shell/profile detection is uncertain, fail conservative and ask.

## Naming quality
Treat this as shell/profile/bootstrap management, not just alias management.

Strong candidate root surface:
- `sys shell`

This keeps the feature truthful and extensible.

## Incremental sequence
1. Add a shell/bootstrap design seam under `@sys/tools`.
2. Implement facts-only doctor output.
3. Add managed-block render logic.
4. Add interactive setup preview + confirm.
5. Add remove/update support.
6. Only later consider user-authored YAML overrides.

## Acceptance for a first useful version
A first version is good enough when:
- a user with Deno can safely install a `sys` alias through `@sys/tools`
- `PATH` support like `~/.deno/bin` can be added when needed
- the target profile file is explicitly selected or confirmed
- changes are written only inside a managed owned block
- the user can preview before write
- the user can remove the managed block later
- no hidden profile mutation occurs

## Final read
This is a real onboarding accelerator.
It is not fluff.
It is a product-quality way to short-circuit multi-day “Unix setup churn” before real `@sys` work begins.
