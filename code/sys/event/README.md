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

## Entry points

- [`/bus`](https://jsr.io/@sys/event/doc/bus/): scheduled emission and typed filtering.
- [`/cmd`](https://jsr.io/@sys/event/doc/cmd/): command clients, hosts, and streams.
- [`/cmd/testing`](https://jsr.io/@sys/event/doc/cmd/testing/): command testing helpers.
- [`/t`](https://jsr.io/@sys/event/doc/t/): type contracts.
