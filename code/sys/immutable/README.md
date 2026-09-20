# Immutable

Immutable state contracts and utilities, with an RFC-6902 JSON Patch implementation.
`Immutable<T>` exposes `current` and `change(fn)`; `ImmutableRef<T>` adds identity and
`events()` for observing changes.

## Immutable<T>: read → change → next value

```ts
import { Immutable } from 'jsr:@sys/immutable/rfc6902';

type T = { count: number };
const foo = Immutable.cloner<T>({ count: 0 });

foo.current;                       //  === { count: 0 }    ↓
foo.change((d) => d.count = 123);  //   Σ  |               ← safe mutation
foo.current;                       //  === { count: 123 }  ↓              ..(next instance)
```

Mutate the draft inside `change`, not `current`. This cloning implementation is simple,
but not intended for large objects: each change clones the current value and computes
JSON patches.

## Observe changes

Use `clonerRef` when you also need identity and change events.

```ts
import { Immutable } from 'jsr:@sys/immutable/rfc6902';

const ref = Immutable.clonerRef({ count: 0 });
const events = ref.events();
const subscription = events.$.subscribe(({ before, after, patches }) => {
  console.log(before.count, after.count, patches);
});

try {
  ref.change((draft) => {
    draft.count = 123;
  });
  console.log(ref.current.count); // 123
} finally {
  subscription.unsubscribe();
  events.dispose();
}
```

Changes without patches do not emit. Dispose the event handle when observation ends;
this ref does not expose a `dispose()` method.

## Entry points

- [`/core`](https://jsr.io/@sys/immutable/doc/core/): engine-independent lens,
  path-ref, and object helpers; not a concrete state constructor.
- [`/rfc6902`](https://jsr.io/@sys/immutable/doc/rfc6902/): `Immutable.cloner`,
  `Immutable.clonerRef`, and JSON Patch helpers.
- [`/t`](https://jsr.io/@sys/immutable/doc/t/): type contracts.

The shared contracts can describe different state engines; the `/rfc6902`
implementation specifically uses JSON Patch. See the
[API reference](https://jsr.io/@sys/immutable/doc/) for graph and URL utilities.
