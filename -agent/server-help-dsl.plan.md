# Plan: @sys/server help DSL

## Status

Complete — landed.

## Landed refs

- `a4ecbcc34 chore(help): remove no-op path helpers`
  - Removed no-value `path(value): t.StringPath { return value; }` helpers from package-help resource paths.
  - Updated the `pkg.help` template so future generated help spines do not recreate the helper.
  - Cleaned the matching `@sys/cell` help resource path shape.
- `a9c0a82f1 docs(server): add package help DSL`
  - Added the `@sys/server` package help DSL implementation.
  - Added bundled YAML help resources, internal help runner, DSL chapter rendering, and contract tests.
- `974d51c5c Update README.md`
  - Finalized the README usage reference for the help DSL and `@sys/server/websocket` import.
- `9fba0b6cd chore(workspace): refreshed 9 workspace packages (24 jsr:publish modules)`
  - Applied the follow-on workspace/package refresh after the server/help changes.

## Goal

Add a package-local, bundled YAML help/DSL surface for `@sys/server` that lets humans and agents
start from zero, discover the package contract, and drill into precise chapters before using,
changing, or composing server primitives.

The surface is help-only. It is not an operational server CLI.

## Final command surface

```sh
deno run -ER jsr:@sys/server --help
deno run -ER jsr:@sys/server dsl
deno run -ER jsr:@sys/server dsl websocket
deno run -ER jsr:@sys/server dsl websocket.cmd --format skill
```

## Final design facts

- Root `@sys/server` remains library-first.
- `src/mod.ts` lazy-loads the internal help runner only under `import.meta.main`.
- Root `--help` advertises `dsl` as the canonical preflight command.
- `dsl` mirrors the `@sys/tmpl` and `@sys/cell` pattern:
  - bundled YAML chapter resources,
  - human output by default,
  - `--format skill` Markdown projection,
  - root DSL help on DSL errors.
- Help source lives under `src/m.help/yaml/` and is embedded into `src/m.help/-bundle/-bundle.json`.
- `WebSocketServer` is a DSL chapter, not a separate CLI product.
- No public `./cli` export was added.
- No operational `start`, `serve`, or `listen` command was added.

## Final chapter spine

```text
src/m.help/yaml/root.yaml
src/m.help/yaml/dsl.yaml
src/m.help/yaml/dsl.websocket.yaml
src/m.help/yaml/dsl.websocket.cmd.yaml
src/m.help/yaml/dsl.websocket.lifecycle.yaml
src/m.help/yaml/dsl.websocket.service.yaml
```

## Final implementation shape

```text
code/sys/server/src/
├─ mod.ts
├─ types.ts
├─ m.help/
│  ├─ mod.ts
│  ├─ t.ts
│  ├─ common.ts
│  ├─ yaml/
│  ├─ u/
│  │  ├─ u.load.ts
│  │  ├─ u.paths.ts
│  │  └─ u.yaml.ts
│  ├─ -bundle/
│  └─ -test/
└─ m.cli/
   ├─ mod.ts
   ├─ m.ServerCli.ts
   ├─ t.ts
   ├─ common.ts
   ├─ u.args.ts
   ├─ u.help.ts
   ├─ u.help.root.ts
   ├─ u.help.dsl.ts
   └─ -test/
```

`src/m.cli/` is internal implementation shape only.

## Speech acts locked into the root DSL

```text
inspect server package affordances
use a server primitive from @sys/server
add a WebSocket command server to <package>
serve typed commands over WebSocket
bind Cmd<T> handlers to a WebSocket transport
admit or reject WebSocket upgrade requests
attach a raw WebSocket hook without owning the command protocol
close or dispose a long-running server primitive safely
bind server lifetime to an external until signal
expose server status as a t.Service.Handle
adapt a server primitive as a Cell service endpoint
add a new server primitive under @sys/server/<subpath>
```

## Chapter intent

- `dsl` — package-level speech acts, decision protocol, mappings, command grammar, verification.
- `dsl websocket` — `WebSocketServer` public value, construction, admission, public import proof.
- `dsl websocket.cmd` — nested `t.Cmd.*` grammar over WebSocket transport.
- `dsl websocket.lifecycle` — close/dispose/finished/signal/until/socket-host cleanup.
- `dsl websocket.service` — `t.Service.Handle` status posture and Cell adapter boundary.

## Verification completed

```sh
cd code/sys/server && deno task help:bundle
cd code/sys/server && deno task check
cd code/sys/server && deno task test
cd code/sys/server && deno task dry
cd code/sys/server && deno run -ER ./src/mod.ts --help
cd code/sys/server && deno run -ER ./src/mod.ts dsl websocket.cmd --format skill
```

Also verified the help YAML line-width pass:

```sh
rg -n ".{100,}" code/sys/server/src/m.help/yaml
```

Result: no matches.

## Release / bump BMIND

Since the last `jsr-publish`, the full logical root set was:

```text
@sys/event
@sys/server
@sys/tmpl
@sys/cell
```

After the prior workspace refresh commit, the final incremental root set was:

```text
@sys/server
@sys/tmpl
@sys/cell
```

That refresh landed as:

```text
9fba0b6cd chore(workspace): refreshed 9 workspace packages (24 jsr:publish modules)
```

## What remains

Nothing remains for this plan.

Future work should be new plans. Candidate future plans may cover additional server primitives or
concrete Cell service adapters, but those are outside this completed help DSL.
