# Events
Lightweight primitives for publishing, subscribing, and filtering streams of events.  

<p>&nbsp;</p>

## EventBus
An **event-bus** is a shared observable stream that multiple producers can **publish** to and multiple consumers can **subscribe** to.

Message-based event streams are strongly typed, ensuring compile-time safety, precise narrowing, and self-documenting contracts between publishers and subscribers.

```ts
// Example event union (or import your own types)
type BaseEvent = { readonly kind: 'debug';     msg?: string };
type AEvent    = { readonly kind: 'debug:a';   count: number };
type ABEvent   = { readonly kind: 'debug:a.b'; total: number };

type MyEvents = BaseEvent | AEvent | ABEvent;
```

<p>&nbsp;</p>

### Firing
An event-bus is a plain observable stream. Events are dispatched on a standardized `@sys/std:Schedule` (`micro`, `raf`, `macro`).

```ts
import { emitFor } from '@sys/event/bus';

const bus$ = Rx.subject<MyEvents>(); // ← your event bus.
const emit = emitFor<MyEvents>();

emit(bus$, { kind: 'debug:a.b', total: 42 }); // type-checked
```

<p>&nbsp;</p>

### Filtering
Filters provide strongly-typed predicates and operators for narrowing on event streams by `kind` or `prefix`.

```ts
import { Rx } from '@sys/std/rx';
import { filterFor } from '@sys/event/bus';

const Filter = filterFor<MyEvents>();

// Kind/prefix predicates:
const isDebug = Filter.isKind('debug');
const isBase = Filter.isKind('debug');
const isPrefixed = Filter.hasPrefix('debug:a');

// RxJS operators:
const bus$ = Rx.subject<MyEvents>();
bus$
  .pipe(
    Filter.ofPrefix('debug:a'), // narrow to "debug:a.*"
    Filter.ofKind('debug:a.b'), // then exact "debug:a.b"
  )
  .subscribe((e) => {
    console.log(e.total); // NB: `e` is narrowed to ABEvent.
  });

```
