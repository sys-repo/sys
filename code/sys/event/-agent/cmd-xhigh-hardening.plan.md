# Plan: @sys/event/cmd XHIGH contract hardening

## Status

Implemented. This was a green-field tightening pass for `@sys/event/cmd` while the port was not yet heavily used.

This plan intentionally allowed breaking semantic corrections before downstream callers depended on loose behavior.

Implemented commits so far:

```text
fix(event): close cmd lifecycle hardening gaps
```

Working-tree follow-up ready to commit:

```text
fix(event): settle cmd host disposal lifecycle
```

Proof after the final follow-up:

```sh
cd /Users/phil/code/org.sys/sys/code/sys/event && deno task check
cd /Users/phil/code/org.sys/sys/code/sys/event && deno task test --trace-leaks ./src/m.cmd
cd /Users/phil/code/org.sys/sys/code/sys/event && deno task test
```

## Scope

Package:

```text
/Users/phil/code/org.sys/sys/code/sys/event
```

Command module:

```text
src/m.cmd/
src/-exports/-cmd.ts
```

Public package export:

```ts
import { Cmd } from '@sys/event/cmd';
```

## Landed reality

The command surface is now a typed request lifecycle:

```text
request → zero-or-more live events → terminal result/error/cancel
```

The original risk was overclaiming: the port had typed unary RPC plus client-side event routing, but no truthful host streaming or complete lifecycle settlement.

That is now corrected.

## Final contract

### Real host streaming

Host handlers receive a typed request context:

```ts
(payload, ctx) => result | Promise<result>
```

Context:

```ts
type CmdHandlerContext<N extends string, E extends t.CmdPayloadEventMap<N>, K extends N> = {
  readonly id: t.CmdReqId;
  readonly name: K;
  readonly ns?: t.CmdNamespace;
  readonly signal: AbortSignal;
  readonly emit: (event: E[K]) => void;
};
```

`ctx.emit(event)` sends a `cmd:event` envelope for the active request. Tests prove this through public `cmd.host(...)` and `client.stream(...)`, not by hand-posting event envelopes.

### Wire lifecycle

Wire kinds:

```ts
type CmdKind = 'cmd' | 'cmd:event' | 'cmd:result' | 'cmd:cancel';
```

Cancellation is cooperative:

- client sends `cmd:cancel` on stream disposal, timeout, and client disposal
- host aborts the active request's `AbortSignal`
- host suppresses terminal result after cancellation
- host disposal sends a terminal remote error for active requests, then aborts their signals

### Client lifecycle settlement

No client-owned pending lifecycle should hang silently.

Settled paths:

- result → resolve
- remote error → reject `CmdErrorRemote`
- timeout → reject `CmdErrorTimeout` and send cancel
- stream dispose / iterator return → reject `CmdErrorCancelled` and send cancel
- client dispose → reject `CmdErrorClientDisposed` and send cancel
- send/stream after client dispose → reject/closed stream with `CmdErrorClientDisposed`

### Transport ownership

Cmd owns listeners and pending request state, not the endpoint by default.

Default:

```text
client.dispose() → remove listener, settle pending state, do not close endpoint
host.dispose()   → remove listener, settle active requests, do not close endpoint
```

Opt-in endpoint closing:

```ts
{ closeEndpoint: true }
```

### Namespace semantics

Namespace matching is exact:

```ts
msg.ns === local.ns
```

The policy is centralized in:

```text
src/m.cmd/u.namespace.ts
```

No implicit wildcard listener remains.

### Stream surface

`CmdStream` implements `AsyncIterable<E[K]>`.

Semantics:

- stream events are live
- no replay for late consumers
- `onEvent` after terminal state returns an already-disposed lifecycle
- async iteration completes after terminal result
- async iteration rejects on terminal error/cancel/timeout/dispose
- breaking async iteration cancels the stream

### Wire guards

`Cmd.Is` now validates:

- exact kind
- `req-` id prefix with non-empty suffix
- non-empty command name
- optional namespace is string when present
- cancel reason is string/undefined
- result error is string/undefined
- errors are instances of `Error` with a known `CmdErrorKind`

Payload validation remains command-set-specific and intentionally out of scope.

### WebSocket adapter

`Cmd.Transport.fromWebSocket` uses the canonical `Json` surface:

- `Json.safeParse` inbound when possible
- `Json.stringify` outbound
- non-JSON inbound data passes through unchanged

### Common lane cleanup

`createId()` lives in:

```text
src/m.cmd/u.id.ts
```

`src/m.cmd/common.ts` remains the import lane only.

### Naming/doc residue

Cleaned or verified:

- `Stronly` → `Strongly`
- `baselin` → `baseline`
- `WinterTC` spelling verified and used uniformly

## Files of interest

Core contract:

```text
src/m.cmd/t.core.ts
src/m.cmd/t.error.ts
src/m.cmd/t.factory.ts
src/m.cmd/t.is.ts
src/m.cmd/t.wire.ts
src/m.cmd/t.lib.ts
```

Runtime:

```text
src/m.cmd/u.client.ts
src/m.cmd/u.host.ts
src/m.cmd/u.id.ts
src/m.cmd/u.namespace.ts
src/m.cmd/m.Is.ts
src/m.cmd/m.Cmd.ts
src/m.cmd/u.make.ts
```

Transport:

```text
src/m.cmd/transport/u.from.WebSocket.ts
```

Tests/docs:

```text
src/m.cmd/-test/-m.Cmd.test.ts
src/m.cmd/-test/-m.Is.test.ts
src/m.cmd/-test/-sample.stream.test.ts
src/m.cmd/-test/-sample.unary.test.ts
src/m.cmd/-test/-sample.websocket.test.ts
README.md
```

## Acceptance bar met

- Streaming is produced by the public host/client API, not hand-posted test envelopes.
- Every client-owned pending command/stream settles on every lifecycle path.
- Host disposal terminal-settles active requests with remote errors.
- Disposing Cmd handles does not close shared transports unless explicit.
- Namespace matching is exact by default and centralized.
- `CmdStream` implements async iteration with explicit cancellation/no-replay semantics.
- README examples match actual runtime behavior.
- Guard behavior matches the public wire contract.
- Focused tests, package check, and full package tests pass.

## Non-goals preserved

- no backpressure system
- no retries
- no replay buffer
- no multiplexed stream protocol beyond request id + namespace
- no schema/runtime payload validation
- no external broker abstraction
- no transport-specific reconnection semantics
- no broad event-bus redesign

## Commit message for current plan update

```text
plan(update): event cmd xhigh hardening reality
```

## Commit message for current code follow-up

```text
fix(event): settle cmd host disposal lifecycle

- settle active host requests with terminal remote errors on host dispose
- centralize exact namespace matching policy
- lock live-stream no-replay behavior with tests and docs
```
