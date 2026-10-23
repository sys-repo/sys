# Events

Typed event streams and transport-independent command messaging.

## Event bus

A bus is a shared observable subject. `emitFor<T>()` returns an emitter taking
`(bus, schedule, event)`; the direct `emit` helper instead takes `(bus, event, schedule?)`.
Schedules include `micro`, `macro`, and `raf`.

```ts
import { Rx } from 'jsr:@sys/std/rx';
import { emitFor, filterFor } from 'jsr:@sys/event/bus';

type Event =
  | { kind: 'debug'; msg: string }
  | { kind: 'debug:count'; count: number };

const bus = Rx.subject<Event>();
const emit = emitFor<Event>();
const Filter = filterFor<Event>();
const subscription = bus.pipe(Filter.ofKind('debug:count')).subscribe((event) => {
  console.log(event.count); // narrowed to the count event
});

try {
  emit(bus, 'micro', { kind: 'debug:count', count: 42 });
  await Promise.resolve(); // Allow the scheduled microtask to deliver before cleanup.
} finally {
  subscription.unsubscribe();
  bus.complete();
}
```

`filterFor<T>()` also provides `isKind`, `hasPrefix`, and `ofPrefix` for predicates and prefix-based
stream filtering.

## Cmd

`Cmd` sends typed requests and streams events over `MessagePort`-like endpoints. It manages its
listeners and pending requests. You remain responsible for closing the endpoints unless you
explicitly ask `Cmd` to close them on disposal.

```ts
import { Cmd } from 'jsr:@sys/event/cmd';

type Name = 'ping';
type Payload = { ping: { msg: string } };
type Result = { ping: { reply: string } };
type Events = { ping: { tick: number } };

const cmd = Cmd.make<Name, Payload, Result, Events>();
const { port1, port2 } = new MessageChannel();
const host = cmd.host(port1, {
  ping({ msg }, ctx) {
    ctx.emit({ tick: 1 });
    return { reply: `pong: ${msg}` };
  },
});
const client = cmd.client(port2, { timeout: 5_000 });

try {
  const result = await client.send('ping', { msg: 'hello' });
  console.log(result.reply);

  const stream = client.stream('ping', { msg: 'streaming' });
  const subscription = stream.onEvent((event) => console.log(event.tick));
  try {
    console.log((await stream.done).reply);
  } finally {
    subscription.dispose();
    stream.dispose();
  }
} finally {
  client.dispose();
  host.dispose();
  port1.close();
  port2.close();
}
```

Independent `send` calls can run concurrently. Responses are matched by request ID, not arrival
order.

Streaming events are live, not replayed. Attach `onEvent` or start async iteration immediately after
`stream(...)`. `done` resolves to the final result. Disposing an active stream cancels it and
rejects `done`; breaking out of async iteration also cancels the stream.

On disposal, the host tries to send an error response for each active request before aborting that
request's signal. Handlers must observe their `AbortSignal` to stop their own work.

### Error transport

Native errors and error-like objects send their readable message; other thrown values are
stringified. Unreadable messages or failed string conversion produce a generic failure, not a
successful result. Causes and extra fields are not serialized automatically. A handler can
explicitly approve a structured public diagnostic:

```ts
throw Cmd.Error.expose({
  name: 'StorageFailure',
  message: 'Storage write refused.',
  data: { operation: 'write', status: 403 },
});
```

`expose` captures the supplied name, message, and optional flat string/finite-number/boolean data.
The client still rejects with `CmdError.Remote`; its `cause` contains that projection. Old clients
retain the error string. Invalid or unreadable optional wire detail is ignored without losing the
rejection.

Exposure belongs to the exact Error returned by this module instance. Rethrowing it preserves the
projection; wrapping, cloning, or converting it to a standard error object does not. Received detail
is not automatically approved for another outbound boundary.

This is an exposure API, **not a redactor**. Approve every field before calling it; never pass raw
provider errors, secrets, URLs, or response bodies. Received diagnostics are untrusted information,
not authority to retry or widen permissions.

## Entry points

- [`/bus`](https://jsr.io/@sys/event/doc/bus/): scheduled emission and typed filtering.
- [`/cmd`](https://jsr.io/@sys/event/doc/cmd/): command clients, hosts, and streams.
- [`/cmd/testing`](https://jsr.io/@sys/event/doc/cmd/testing/): command testing helpers.
- [`/t`](https://jsr.io/@sys/event/doc/t/): type contracts.
