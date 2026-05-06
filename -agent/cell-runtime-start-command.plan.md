# Cell runtime start command: completion record

## Status

Completed and superseded by implemented `@sys/cell` public surfaces.

This file records the final design state before retirement. The durable guidance now lives in:

- `code/sys/cell/src/m.help/yaml/root.yaml`
- `code/sys/cell/src/m.help/yaml/start.yaml`
- `code/sys/cell/src/m.help/yaml/dsl.start-runtime.yaml`
- `code/sys/cell/README.md`

## Completed outcome

`@sys/cell` now provides a published operator affordance for running a composed Cell runtime:

```sh
deno run -A jsr:@sys/cell start [dir]
```

The command is intentionally small and operator-focused:

1. Load the Cell from `[dir]` or `.`.
2. Start runtime services through `Cell.Runtime.start(cell)`.
3. Wait through `Cell.Runtime.wait(runtime)`.
4. Close the runtime when wait completes or fails.

Core shape:

```ts
const cell = await Cell.load(args.dir ?? '.');
const runtime = await Cell.Runtime.start(cell);

try {
  await Cell.Runtime.wait(runtime);
} finally {
  await runtime.close('cell.start.finished');
}
```

If `Cell.Runtime.start` fails, already-started services are closed by the runtime implementation.

## Public CLI surface

Root help includes:

```text
start  start the Cell runtime services
```

Start help includes:

```sh
deno run -A jsr:@sys/cell start [dir]
deno run -A jsr:@sys/cell start [dir] --help
```

A user project may add a convenience task, but the public Cell CLI is the stable primitive:

```json
{
  "tasks": {
    "start": "deno run -A jsr:@sys/cell start ."
  }
}
```

## Runtime ownership doctrine

Cell remains an orchestrator. Service owners keep:

- serving behavior
- runtime display/output
- config schema and validation
- lifecycle mechanics
- ports, URLs, and package-specific examples

`@sys/cell start` does not:

- recreate each service owner's status display
- mutate service owner config
- hand-author owner YAML
- replace owner `--help` surfaces
- become a process supervisor/control plane
- require a repo-local sample script for normal published-package usage

## Waitability contract

`Cell.Runtime.wait` waits for started service handles that expose `finished`.

Services that should keep `@sys/cell start` alive should return a started handle with `finished`.
Service handles may also expose `close(reason)` or `dispose(reason)` for shutdown.

This is now documented in both command help and `dsl start-runtime`.

## Signal handling posture

The first version intentionally does not center signal handling.

If operator polish is later needed, add a focused signal bridge:

- listen for `SIGINT` / `SIGTERM`
- call `runtime.close(signal)`
- resolve the command with an appropriate result
- prove no listener leaks

This remains future polish, not part of the completed first slice.

## DSL chapter completed

The DSL chapter exists:

```sh
deno run jsr:@sys/cell dsl start-runtime
```

Speech act:

```text
Start the Cell runtime.
```

The chapter teaches:

- Use `@sys/cell start [dir]`.
- Start is an operator action, not a config mutation.
- Do not write a custom launcher script unless explicitly asked.
- Add a project `deno.json` task only when the user asks for persistent convenience.
- If startup fails, inspect the named service's owner config and owner `--help`.
- Cell orchestrates runtime services; owner packages own service mechanics and display.
- Services that should keep `@sys/cell start` alive should return `finished`.

## Implemented files

Primary implementation files:

```text
code/sys/cell/src/m.cli/u.start.ts
code/sys/cell/src/m.cli/u.help.start.ts
code/sys/cell/src/m.help/yaml/start.yaml
code/sys/cell/src/m.help/yaml/dsl.start-runtime.yaml
```

Integration and resource wiring:

```text
code/sys/cell/src/m.cli/m.CellCli.ts
code/sys/cell/src/m.cli/t.ts
code/sys/cell/src/m.cli/u.help.ts
code/sys/cell/src/m.help/t.ts
code/sys/cell/src/m.help/mod.ts
code/sys/cell/src/m.help/u/u.load.ts
code/sys/cell/src/m.help/u/u.paths.ts
code/sys/cell/src/m.help/yaml/root.yaml
code/sys/cell/src/m.help/yaml/dsl.yaml
code/sys/cell/src/m.help/-bundle/-bundle.json
code/sys/cell/README.md
```

Proof files:

```text
code/sys/cell/src/m.cli/-test/-.test.ts
code/sys/cell/src/m.cli/-test/-dsl.test.ts
code/sys/cell/src/m.cli/-test/-u.help.test.ts
code/sys/cell/src/m.help/-test/-.test.ts
```

## Commit sequence completed

Implemented as the intended split:

```text
docs(cell): document runtime start DSL
feat(cell): add runtime start command
```

## Retirement

This plan is complete. Retire after committing this completion record.
