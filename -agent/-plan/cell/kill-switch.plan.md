# Cell kill switch plan

- [x] 5207dee69 feat(process): add pid cleanup primitives
- [x] c6c533bd4 feat(process): add port cleanup primitives
- [x] 308582e6b feat(cell): add session-backed kill switch
- [ ] feat(cell): reap declared kill resources

## TMIND / STIER position

`@sys/cell start` failing on configured-port conflict is the feature. A Cell service graph has known
ports and known resource layout; auto-incrementing ports would make the running topology different
from the declared topology.

The missing operator affordance is a break-glass command:

```sh
@sys/cell kill [root]
```

This is not normal lifecycle management. It means:

> Clear away live runtime instances for this Cell so I can restart it somewhere else.

The design center is Unix-principled but Cell-aware: the command is decisive like `kill`, but its
identity boundary is the canonical Cell root and selected service mode, not a random port number.

## 100-year rules

1. **No auto-port mutation.** `start` keeps refusing conflicts.
2. **Cell identity is root + mode, not port.** Ports are resources owned by a Cell session.
3. **Kill is cross-terminal.** A kill command from any cwd can stop a matching Cell started in
   another terminal.
4. **No arbitrary scanning.** The command never kills “whatever is on a port” unless that port is a
   declared resource of the targeted Cell plan.
5. **`@sys/cell` owns Cell intent; `@sys/process` owns OS process mechanics.** No shell `killport`
   wrappers hidden in Cell code.
6. **Break glass should still be auditable.** Output names the root, mode scope, sessions, pids,
   resources, and actions.

## CLI contract

```sh
@sys/cell kill
@sys/cell kill .
@sys/cell kill /path/to/cell
@sys/cell kill --mode dev
@sys/cell kill /path/to/cell --mode dev
@sys/cell kill --dry-run
@sys/cell kill --force
```

Root behavior:

- If `[root]` is omitted, discover the nearest Cell root from the current directory.
- If `[root]` is supplied, resolve it to a canonical absolute Cell root.
- The command can be run from another terminal window; cwd only matters when resolving an omitted or
  relative root.

Mode behavior:

- `--mode <name>` targets only that service graph mode.
- With no `--mode`, `kill` targets all live sessions for the Cell root. This is intentional for a
  kill switch: `@sys/cell kill` in a Cell folder means “clear this Cell away.”

Force behavior:

- Default kill is still decisive: graceful signal first, short grace window, then hard escalation for
  matching Cell supervisors that remain alive.
- `--force` shortens/skips grace and enables the most aggressive cleanup path available.
- `--dry-run` performs no mutation and prints the exact sessions/resources that would be cleared.

## Runtime session model

`@sys/cell start` should register a runtime session in a per-user runtime registry, not in project
source state.

Preferred location:

```text
$XDG_RUNTIME_DIR/@sys/cell/<root-hash>/<session-id>.json
```

Fallback:

```text
$TMPDIR/@sys/cell/$UID/<root-hash>/<session-id>.json
```

Session record shape:

```ts
type CellRuntimeSession = {
  readonly id: string;
  readonly root: string;       // canonical absolute Cell root
  readonly mode: string;       // service graph mode used by start
  readonly pid: number;        // Cell supervisor pid
  readonly startedAt: number;
  readonly updatedAt: number;  // heartbeat timestamp
  readonly state: 'starting' | 'ready' | 'stopping';
  readonly services: readonly {
    readonly name: string;
    readonly use: string;
    readonly from: string;
  }[];
  readonly resources: readonly {
    readonly service: string;
    readonly resource: t.Service.Resource.Any;
  }[];
};
```

The supervisor removes its session record during normal `finally` cleanup. `kill` also removes stale
records after proving the supervisor is gone.

## Process semantics

Initial shutdown path:

1. `kill` finds all live session records matching the canonical root and requested mode scope.
2. For each matching Cell supervisor pid:
   - send `SIGTERM`;
   - wait a short bounded grace period;
   - send `SIGKILL` if still alive or if `--force` was requested.
3. The `start` supervisor already listens for `SIGTERM`; that path should trigger existing
   `until`/`close`/`dispose` service cleanup.

Process mechanics belong in `@sys/process`, for example:

```ts
Process.isRunning(pid)
Process.Terminate.pid(pid, { force })
Process.Port.listeners({ host, port })
Process.Terminate.port({ host, port }, { force })
```

Cell should call those primitives rather than using shell scripts or ad-hoc `killport` behavior.

## Declared resource cleanup

Port cleanup is a fallback cleanup axis, not the identity model.

Service endpoints should be able to declare resources without starting the service:

```ts
type LifecycleEndpoint<Args = unknown, THandle = t.Service.Handle> = {
  start(args: Args): THandle | Promise<THandle>;
  resources?(args: t.Service.Resource.Args):
    | readonly t.Service.Resource.Any[]
    | Promise<readonly t.Service.Resource.Any[]>;
};

type TcpListenerResource = {
  readonly kind: 'tcp-listener';
  readonly host?: string;
  readonly port: t.PortNumber;
};
```

`@sys/cell kill` may reap only resources declared by the targeted Cell plan/mode. This is how the
command can clear an orphaned `127.0.0.1:5050` listener without becoming a generic unsafe port killer.

The first resource implementation is TCP listeners only. Resource reaping should land only with
explicit tests proving it is Cell-plan bounded.

## Output contract

Example:

```text
Cell kill: /Users/phil/code/org.sys/sys/deploy/@draft.shell/src/ui/ui.AppShell
mode: all

session         01HZ...
  mode          dev
  pid           81234
  action        SIGTERM → SIGKILL

resource        tcp 127.0.0.1:5050
  service       draft:files
  listeners     81240 deno
  action        SIGTERM → SIGKILL

done            cleared 1 session, 1 listener
```

No silent success. No ambiguous “killed port.” Always show what Cell identity was targeted.

## Implementation sequence

### Phase 1 — Cell-aware session kill

- Add kill command parsing/help.
- Add canonical Cell root discovery/resolution.
- Add runtime session registry module.
- Register/unregister sessions from `@sys/cell start`.
- Add `@sys/process` pid termination primitives.
- Implement `@sys/cell kill` against matching session records.
- Tests:
  - start registers a session;
  - normal start cleanup unregisters it;
  - `kill` from another cwd clears the matching session;
  - `kill --mode dev` does not clear other modes;
  - no-mode `kill` clears all modes for the root;
  - stale records are reported and removed safely.

### Phase 2 — Declared resources

- Add optional service `resources(...)` hook.
- Add resource planning for selected Cell service graph mode.
- Teach sys-owned Vite, static HTTP, and Files WebSocket services to declare configured listeners.
- Include declared resources in session records where possible.
- Tests prove resource plans are generated from service-owned config parsing, not Cell YAML scraping.

### Phase 3 — Reaping fallback

- Add `@sys/process` listener discovery per supported OS.
- Reap only declared resources for the targeted Cell root/mode scope.
- Ensure `--dry-run` prints exact would-kill pids/resources.
- Tests prove unrelated Cell roots are not targeted.

## Non-goals

- Do not make `start` auto-increment or mutate service ports.
- Do not scrape arbitrary owner config schemas in Cell.
- Do not add a generic `killport` command under the Cell name.
- Do not require the kill command to run from the original terminal.
- Do not commit runtime session state into the Cell folder.

## Operator truth

The happy path remains:

```sh
@sys/cell start . --mode dev
```

If that reports a configured-port conflict because another instance is already running, the recovery
path is:

```sh
@sys/cell kill --mode dev
@sys/cell start . --mode dev
```

If the operator wants the full break-glass clear from inside the Cell root:

```sh
@sys/cell kill
```
