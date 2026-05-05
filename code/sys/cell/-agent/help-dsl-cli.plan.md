# Cell CLI help and DSL plan

## Goal

Refine `@sys/cell` CLI help into a clean Unix-shaped information hierarchy with standard `--help` semantics and a durable DSL surface.

The DSL is the formal command/vocabulary surface for valid Cell edits: the bridge from human/agent language to future typed command algebra and owner-aware edits.

```text
natural utterance
  → speech act
  → typed command / Cmd<T>
  → owner-aware edit
  → verifiable resulting Cell state
```

## Target CLI hierarchy

```text
cell --help
  orientation and real commands

cell init --help
  command contract for humans

cell init --help --agent
  command-specific agent expansion

cell dsl
  formal Cell edit language
```

## Design decisions

- Do not add or preserve a `help` command in greenfield CLI grammar.
- Use standard help semantics:
  - `cell --help`
  - `cell init --help`
  - `cell init --help --agent`
- Use `dsl` as the top-level noun.
- Keep `speech acts` as a DSL section, not the top-level command.
- Root help should show only real commands.
- Root options should show only global options.
- Command-specific flags such as `--dry-run` belong under `init --help`, not root help.

## Help output target

### Root help

```text
@sys/cell/cli

A Cell is a folder-shaped metamedium whose DSL stores
meaning and whose meaning can be interpreted, viewed, and
validly rewritten within the folder that bounds it.

Usage
  deno run jsr:@sys/cell/cli --help
  deno run -RW jsr:@sys/cell/cli init [dir]
  deno run jsr:@sys/cell/cli dsl

Commands
  init   create the minimal Cell folder contract
  dsl    show the Cell edit language: acts, owners, and mappings

Options
  -h, --help   show help
```

### Init help

```text
@sys/cell/cli init

Create the minimal Cell folder contract in the target directory.
Init creates the descriptor, stored-meaning lane, view lane, and
local ignore for .env.

Usage
  deno run -RW jsr:@sys/cell/cli init [dir]
  deno run -RW jsr:@sys/cell/cli init [dir] --dry-run
  deno run -RW jsr:@sys/cell/cli init [dir] --help --agent

Options
  -h, --help   show init help
  --agent      include command-specific agent guidance with help
  --dry-run    preview writes without changing files

Safety
  additive; validates existing Cell descriptors before writing
  use --dry-run to preview exact file operations
  .gitignore may add .env once
  leaves .pi/ and other tool-owned -config/* namespaces untouched
```

### Init agent expansion

`cell init --help --agent` should include the normal init help plus command-specific implementation facts:

```text
Agent
  Run init when the folder is missing the Cell descriptor.
  Init is additive and writes the embedded default resources.

Writes
  -config/@sys.cell/cell.yaml
  data/README.md
  view/README.md
  .gitignore

Owns
  -config/@sys.cell/cell.yaml
  data/
  view/

Descriptor
  ```yaml
  kind: cell
  version: 1
  ```
```

### DSL help

```text
@sys/cell/cli dsl

Cell DSL: the formal command/vocabulary surface for valid Cell edits.
Use these acts, owner rules, and mappings when changing a Cell folder.

Rule
  Cell owns topology; service config owns service details.
  Pull config owns materialization. Do not turn cell.yaml
  into a mega-config.

Speech acts
  initialize this folder as a Cell
  add a local view named <name> at <path>
  add a pulled view named <name> from <dist-url> into <path>
  add a static view service named <name>
  add a runtime service named <name> using <module/export>
  add a proxy service named <name>
  mount <route> to <view/service/upstream>
  verify/load this Cell
  start the Cell runtime

Owners
  Cell config references owned configs.
  Use each owning tool/API to create or validate its own config.
  Do not hand-write tool-owned YAML when an owner CLI/API exists.
  If no owner affordance exists, stop and ask before hand-authoring.

Mappings
  add local view → create files under view/, then register views.<name>.source.local
  add pulled view → use @sys/tools/pull, then register views.<name>.source.pull
  add service → use service owner flow, then register runtime.services[]
  add proxy → use proxy owner flow, then register runtime service and mounts
  mount route → update proxy owner config; cell.yaml only names the proxy service
  verify/load → run Cell.load against the folder
  start runtime → load Cell, start Cell.Runtime, wait/close lifecycle
```

## Future breakout shape

Start with one `cell dsl` command. Later, if the surface grows, split into subcommands:

```text
cell dsl acts
cell dsl commands
cell dsl owners
cell dsl mapping
cell dsl descriptor
```

Possible future mapping:

```text
acts       natural-language affordances / LLM-facing phrases
commands   typed command algebra / Cmd<T> forms
owners     ownership boundaries
mapping    speech act → command → owner flow
verify     checks that resulting state satisfies the act
```

## Implementation notes

- Rename current `help agent` resource/formatter concept to DSL-oriented naming.
- Update YAML resources so authored prose uses `dsl`, `speechActs`, `owners`, and `mappings` vocabulary.
- Update parser to accept `--agent` as a boolean flag.
- Remove `help init` and `help agent` routing.
- Add `dsl` command routing.
- Ensure tests assert standard help grammar and root command hierarchy.

## Suggested commit

```text
refactor(cell): reshape cli help around init and dsl

- use standard --help semantics for root and init
- add dsl as the top-level Cell edit language command
- move agent-oriented init facts behind init --help --agent
- remove greenfield help topic commands
- update help resources and CLI help tests
```
