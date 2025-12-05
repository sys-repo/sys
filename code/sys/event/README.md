# Events
Primitives for composition and filtering of event streams.

<p>&nbsp;</p>

## EventBus
An **event-bus** is a multicasting, shared `Observable` stream that multiple producers **publish** to and multiple consumers **subscribe** to.

Message-based event streams are strongly typed, ensuring compile-time safety, precise narrowing, and self-documenting contracts between publishers and subscribers.

```ts
// Example event union:
type BaseEvent = { readonly kind: 'debug';     msg?: string };
type AEvent    = { readonly kind: 'debug:a';   count: number };
type ABEvent   = { readonly kind: 'debug:a.b'; total: number };

type MyEvents = BaseEvent | AEvent | ABEvent;
```

<p>&nbsp;</p>

### Firing
An **event-bus** is a plain observable stream. Events are dispatched on a standardized `@sys/std:Schedule` (`micro`, `raf`, `macro`).

```ts
import { emitFor } from '@sys/event/bus';

type T = MyEvents
const bus$ = Rx.subject<T>(); // ← your event bus.
const emit = emitFor<T>();

// Stronly-typed, scheduled, publishing of an event:
emitFor<T>(bus$, 'micro', { kind: 'debug:a.b', total: 42 });
```

<p>&nbsp;</p>

### Filtering
Strongly-typed predicates and operators for narrowing on event streams by `kind` or a *starts-with* `prefix` matcher.

```ts
import { Rx } from '@sys/std/rx';
import { filterFor } from '@sys/event/bus';

type T = MyEvents
const Filter = filterFor<T>();

// Kind/prefix predicates:
const isDebug = Filter.isKind('debug');
const isBase = Filter.isKind('debug');
const isPrefixed = Filter.hasPrefix('debug:a');

// RxJS operators:
const bus$ = Rx.subject<T>();
bus$
  .pipe(
    Filter.ofPrefix('debug:a'), // narrow to "debug:a.*"
    Filter.ofKind('debug:a.b'), // then exact "debug:a.b"
  )
  .subscribe((e) => {
    console.log(e.total); // NB: `e` is narrowed to ABEvent.
  });

```

<p>&nbsp;</p>

## Cmd (Command)
Small, transport-agnostic command bus providing **typed request/response and streaming** over
any `MessagePort`-like endpoint ([Web Worker](https://html.spec.whatwg.org/multipage/workers.html),
`MessageChannel`, `window.postMessage`, etc).

You define a command set once as **name → payload / result / event-maps**, then
get a strongly-typed `host` and `client`.

```ts
import { Cmd } from '@sys/event/cmd';

/**
 * Command set:
 *   - Name:      union of command names.
 *   - Payload:   per-name request payloads.
 *   - Result:    per-name result payloads.
 *   - Events:    per-name streaming event payloads (optional).
 */
type Name = 'ping' | 'sum';

type Payload = {
  ping: { msg: string };
  sum: { values: number[] };
};

type Result = {
  ping: { reply: string };
  sum: { total: number };
};

type Events = {
  ping: { tick: number }; // streaming events for "ping"
  sum: never;             // unary-only
};

/**
 * Create a typed command set.
 */
const cmd = Cmd.make<Name, Payload, Result, Events>();

// Wire it to any MessagePort-like endpoint.
const { port1, port2 } = new MessageChannel();

// Host: runs on the "service" side.
const host = cmd.host(port1, {
  ping: async ({ msg }) => ({ reply: `pong: ${msg}` }),
  sum: ({ values }) => ({ total: values.reduce((n, v) => n + v, 0) }),
});

// Client: runs on the "caller" side.
const client = cmd.client(port2, { timeout: 5_000 });
```

<p>&nbsp;</p>

### Unary: request / response
```ts
// Typed send:
const res = await client.send('sum', { values: [1, 2, 3] });
//    res: { total: number }

res.total; // 6
```

<p>&nbsp;</p>

### Streaming: events + terminal result
`stream` gives you:

 - `id` – request id (shared with mid-stream events)
 - `onEvent` – subscribe to typed events
 - `done` – promise for the final result
 - `dispose` – cancel the stream and detach listeners

```ts
/**
 * Start a streaming command:
 */
const stream = client.stream('ping', { msg: 'hello' });

const events: Events['ping'][] = [];
const sub = stream.onEvent((event) => {
  // event: { tick: number }
  events.push(event);
});

const final = await stream.done;
// final: { reply: string }

// cleanup:
sub.dispose();
client.dispose();
host.dispose();

```
