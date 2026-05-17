# WebSocket Command Server Primitive

## Status

Complete — landed.

## Landed refs

- `2b47352e3 refactor(event): nest command type surface`
  - Required prerequisite for the nested `t.Cmd.*` command grammar used by this primitive.
  - Removed old flat command type aliases and updated known consumers.
- `1b861c1a5 feat(server): add websocket command server type surface`
  - Added the `@sys/server` WebSocket type surface and package exports needed for implementation.
- `277523e69 feat(server): add websocket command server primitive`
  - Added runtime implementation, service-compatible lifecycle/status handle, and real WebSocket contract tests.

## Intent

Land the smallest complete WebSocket server primitive that is useful to the system without importing
a larger "app server" concept.

The first unit is not files, UI, CRDT, or a framework layer. It is a WebSocket server substrate with
lifecycle ownership and a primary bridge into the existing `@sys/event/cmd` command algebra.

## Namespace

Done:

- `@sys/server/websocket`
- public value: `WebSocketServer`
- primary constructor: `WebSocketServer.create(...)`

No `AppServer` namespace. No `ws` public noun. The public path and value spell `websocket` /
`WebSocket` in full.

## File Shape

Implemented shape:

```text
src/websocket/
├─ mod.ts
├─ t.ts
├─ common.ts
├─ m.WebSocketServer.ts
├─ u.accept.ts
├─ u.create.ts
├─ u.lifecycle.ts
├─ u.origin.ts
├─ u.socket.ts
├─ u.status.ts
└─ -test/
   ├─ -.test.ts
   ├─ -examples.cmd.test.ts
   ├─ -u.accept.test.ts
   ├─ -u.cmd.test.ts
   ├─ -u.lifecycle.test.ts
   ├─ -u.origin.test.ts
   ├─ -u.service.test.ts
   └─ u.fixture.ts
```

`mod.ts` is export-only. The public value lives in `m.WebSocketServer.ts`, not
`mod.WebSocketServer.ts`.

The originally planned single test file was intentionally split after implementation into focused
contract files matching the utility seams.

## Type Surface

Done:

- `WebSocketServer.Lib`
- `WebSocketServer.CreateOptions<N, P, R, E>`
- `WebSocketServer.Started`
- `WebSocketServer.StatusOptions`
- `WebSocketServer.Accept`
- `WebSocketServer.SocketContext<N, P, R, E>`
- `WebSocketServer.CommandOptions<N, P, R, E>`

Command grammar flows directly through `@sys/event/cmd`:

```ts
N extends string
P extends t.Cmd.Payload.Map<N>
R extends t.Cmd.Result.Map<N>
E extends t.Cmd.Event.Map<N> = t.Cmd.Event.Map<N>
```

Nested `t.Cmd.*` is used throughout. No second command grammar, wire protocol, or compatibility
aliases were introduced.

## Runtime Shape

Done:

- wraps the truthful Deno mechanics: `Deno.serve` and `Deno.upgradeWebSocket`
- admits/rejects before upgrade without disturbing the request body
- wires the WebSocket to `Cmd.Transport.fromWebSocket(...)`
- creates a typed command host per accepted socket
- owns lifecycle: `close`, `dispose`, `finished`, `signal`
- closes active sockets and disposes command hosts deterministically
- bridges underlying `server.finished` back into wrapper lifecycle
- exposes address and local URL facts
- exposes raw socket access through `onSocket` as a low-level escape hatch
- exposes a renderer-neutral `t.Service.Status` snapshot for `@sys/cell` compatibility

## Utility Split

Done:

- `u.create.ts` — orchestration and visible Deno seam
- `u.accept.ts` — path matching, non-upgrade rejection, custom accept decisions
- `u.origin.ts` — path normalization, local origin, WebSocket URL facts
- `u.lifecycle.ts` — socket/host tracking and teardown
- `u.socket.ts` — guarded best-effort socket close
- `u.status.ts` — service handle status/error shaping

No router. No session layer. No client SDK.

## Primary Consumer Posture

Done.

Consumers define a typed command grammar, attach handlers, and receive a WebSocket-backed command
server handle. The WebSocket is the transport. `@sys/event/cmd` is the conceptual API surface.

Cell consumption remains adapter-owned: concrete service endpoints provide config loading and typed
handlers, while this primitive returns a standard service-compatible handle.

## Non-Goals For First Land

Maintained:

- no file command grammar
- no filesystem security model
- no UI or debug panel
- no Vite integration
- no Automerge or CRDT coupling
- no runtime-neutral abstraction layer
- no app-server naming or orchestration layer

## Test Contracts

Done with real Deno/WebSocket behavior:

- public runtime import assertion for `@sys/server/websocket`
- real typed Cmd unary roundtrip over WebSocket
- real typed Cmd streamed `ctx.emit(...)` events over WebSocket
- disposed Cmd client rejects safely without hitting the server
- path mismatch rejects
- non-upgrade request rejects
- custom `accept` false rejects
- custom `accept` `Response` returns directly before upgrade
- `close` / `dispose` shuts down server, sockets, and command hosts
- client socket close disposes command host and removes connection
- `until` signal closes server and active sockets
- underlying Deno `server.shutdown()` bridges into wrapper lifecycle
- sync and async `onSocket` failures close only that socket/host
- origin/path utility behavior, including IPv6 URL bracketing
- service-compatible `status()` surface

## Acceptance Bar

Met:

- this is a server primitive exposed from `@sys/server/websocket`
- the public server noun is `WebSocketServer`
- raw WebSocket mechanics are available but not the main consumer handle
- the main handle is command-capable via `@sys/event/cmd`
- later grammars such as files can attach without changing the kernel
- the handle is also compatible with the system service contract used by `@sys/cell`

## What remains

Nothing remains for the first-land plan.

Follow-up work, if/when needed, should be new plans rather than reopening this one. Candidate future
plans could cover concrete Cell adapters, file-specific command grammars, or higher-level application
composition, but those are explicitly outside this completed primitive.
