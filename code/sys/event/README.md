# Events

Typed event-stream composition and transport-independent command messaging.

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

`filterFor<T>()` also provides `isKind`, `hasPrefix`, and `ofPrefix` for predicates
and prefix-based stream filtering.

## Cmd

`Cmd` provides typed unary requests and streaming events over MessagePort-like
endpoints. It owns its listeners and pending requests; the caller owns the transport
unless endpoint closing is explicitly requested.

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

Independent `send` calls can run concurrently. Responses are correlated by request
id, not arrival order.

Streaming events are live, not replayed: attach `onEvent` or an async-iterator
consumer immediately after `stream(...)`. `done` resolves to the terminal result.
Disposing an active stream cancels it and rejects `done`; breaking out of async
iteration also cancels the stream. Host disposal terminal-settles active requests
with remote errors before aborting their cooperative `AbortSignal`.

## Entry points

- [`/bus`](https://jsr.io/@sys/event/doc/bus/): scheduled emission and typed filtering.
- [`/cmd`](https://jsr.io/@sys/event/doc/cmd/): command clients, hosts, and streams.
- [`/cmd/testing`](https://jsr.io/@sys/event/doc/cmd/testing/): command testing helpers.
- [`/t`](https://jsr.io/@sys/event/doc/t/): type contracts.
