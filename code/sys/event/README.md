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
