# Cell Pi Cowpaths Plan

Status: plan. Posture: XHIGH design, STIER/BMIND.

## Aim

Make `@sys/cell` configurable from simple Pi agent conversation, starting from an empty or
Pi-prepared folder.

```text
empty folder or Pi-prepared folder
→ start Pi
→ "use @sys/cell"
→ agent reads the Cell contract
→ data/, view/, and -config/@sys.cell/cell.yaml emerge
→ user incrementally asks for views/runtime/pull config
```

## Principle

```text
--help is the source-backed affordance.
A Pi skill is a thin pointer to that affordance.
Scaffold/generation comes only after repeated cow paths prove it is needed.
```

Do not start with a wizard, framework, or large skill.

## First Primitive

Expose `@sys/cell/cli` as the source-backed Cell affordance:

```sh
deno run jsr:@sys/cell/cli --help
```

Slice one landed as help-only:

- expose `./cli` from `@sys/cell`
- support `--help` and `-h`
- write no files
- for non-help invocations, fail plainly and point back to `--help`

Slice two is now earned: add a minimal `init` command that materializes the default Cell contract
from `src/m.tmpl/tmpl.cell.default`.

```sh
deno run -RW jsr:@sys/cell/cli init [dir]
deno run -R jsr:@sys/cell/cli init [dir] --dry-run
```

`init` should automate only the boring baseline; deeper Cell evolution remains agent/human-guided.

## Help Content

Top-level help should stay operator-clean and public-facing. It must not mention local development
helpers such as `deno task cli`.

Top-level help should show:

```text
Usage
  deno run jsr:@sys/cell/cli --help
  deno run -RW jsr:@sys/cell/cli init [dir]
  deno run jsr:@sys/cell/cli help agent

Commands
  init         create the minimal Cell folder contract
  help agent   show expanded guidance for coding agents
```

Move expanded teaching material to topic help:

```sh
deno run jsr:@sys/cell/cli help agent
```

Agent help may include:

### Folder grammar

```text
data/
view/
-config/@sys.cell/cell.yaml
```

### Minimal valid descriptor

```yaml
kind: cell
version: 1

dsl:
  root: ./data

views: {}

runtime:
  services: []
```

### Additive recipes

Short, copyable recipes for:

- adding a local view
- adding a pulled view
- adding a static view service
- adding a proxy service
- running the real path:
  ```text
  Cell.load → Cell.Runtime.start → Cell.Runtime.wait
  ```

### Ownership rules

```text
Cell owns topology.
Service config owns service details.
Pull config owns materialization.
Sample scripts are orchestration only.
```

Agent help must stay progressive-disclosure guidance, not a large duplicated doctrine source.

## Pi Skill Later

Initial skill should be deliberately tiny:

```text
For @sys/cell work, run/read @sys/cell/cli --help and follow it.
```

The skill must not duplicate the Cell doctrine. It should project the same source-backed help into
Pi's skill system.

## Cowpath Loop

After `--help` and `init` exist, test by repeatedly recreating the disposable lab folder:

```text
/Users/phil/code/org.sys/sys/code/sys/cell/-sample/foo
```

Drive Pi from that folder:

```text
sys pi
"use @sys/cell"
"initialize this folder as a Cell"
"add a local data root"
"add a view"
"add a pulled Stripe view"
"add runtime services to serve it"
```

The target exemplar is the real Stripe sample:

```text
/Users/phil/code/org.sys/sys/code/sys/cell/-sample/cell.stripe
```

Test both starting states:

```text
empty folder
folder already initialized by Pi (.pi/ and/or -config/@sys.pi/ present)
```

`init` must be resilient to Pi-owned structure. It owns only the Cell contract:

```text
data/
view/
-config/@sys.cell/cell.yaml
```

It must not remove, rewrite, or interpret `.pi/`, `-config/@sys.pi/`, or other tool-owned config.

When Pi stumbles, improve the help text or recipe shape. Add broader commands only after repeated
friction proves the need.

## Instruction Posture

Use minimum effective instruction / progressive disclosure:

```text
enough guidance to preserve Cell constraints
not enough prescription to suppress model intelligence
```

The help should shape agent behavior without becoming a wizard transcript.

## `init` Guardrails

`init` is not a wizard or framework generator. It is minimal template materialization.

Rules:

- target defaults to `.`
- additive and idempotent
- no prompts
- no Stripe
- no runtime services
- no mega-config
- no overwrite of existing user files
- if `-config/@sys.cell/cell.yaml` already exists:
  - valid Cell → report already initialized / skipped
  - invalid Cell → fail clearly and do not overwrite
- `.gitignore` may be updated only idempotently for baseline safety, such as appending `.env` once

## Non-goals

- no large Pi skill
- no hidden templates
- no Cell-owned service internals
- no duplicate source of truth
- no speculative agent framework

## Quality Bar

A medium-capable coding agent should be able to create and evolve a valid Cell by reading the help
and editing plain files.

The power comes from the lower-level construct being real, typed, runtime-verified YAML — not from
agent cleverness.
