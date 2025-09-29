# EventBus
Lightweight primitives for publishing, subscribing, and filtering streams of events.  

<p>&nbsp;</p>

## Events
Message-based event streams are strongly typed: 

```ts
// Example event union (or import your own types)
type BaseEvent = { readonly kind: 'debug';     msg?: string };
type AEvent    = { readonly kind: 'debug:a';   count: number };
type ABEvent   = { readonly kind: 'debug:a.b'; total: number };

type MyEvents = BaseEvent | AEvent | ABEvent;
```

<p>&nbsp;</p>

### Firing
An event-bus is a plain `Observable` stream. Events are dispatched on a standardized `@sys/std:Schedule`:

```ts
import { emit } from '@sys/bus/event';
emit(bus$, { kind: 'debug:a.b', total: 42 }); // ← type-checked against <MyEvents>
```

<p>&nbsp;</p>

### Narrowing (Filter Events)
Event filters provide strongly-typed predicates and RxJS operators
for working with event streams by `kind` or `prefix`.

```ts
import { Rx } from '@sys/std/rx';
import { Filter, FilterFor } from '@sys/bus/event';

// Runtime baseline (no compile-time narrowing):
const isDebug = Filter.isKind('debug');

// Strongly-typed factory, bound to your event union:
const F = FilterFor<MyEvents>();

// Kind/prefix predicates:
const isBase = F.isKind('debug');
const isPrefixed = F.hasPrefix('debug:a');

// RxJS operators:
const bus$ = Rx.subject<MyEvents>();
bus$
  .pipe(
    F.ofPrefix('debug:a'),   // narrow to "debug:a.*"
    F.ofKind('debug:a.b'),   // then exact "debug:a.b"
  )
  .subscribe((e) => {
    // e is narrowed to DebugABEvent here
    console.log(e.total);
  });

```

