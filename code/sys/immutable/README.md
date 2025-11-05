# Immutable
Core immutable state primitives. Minimal, engine-agnostic primitives for working with immutable state.


### Entry points
```ts
import { Immutable, Lens } from 'jsr:@sys/immutable/core';
import { Immutable, Lens } from 'jsr:@sys/immutable/rfc6902';
```

This library defines the canonical `Immutable<T>` and `ImmutableRef<T>` shapes - objects exposing `.current`, `.change(fn)`, and `.events()` — along with lifecycle and observable utilities.

This package has **no dependency** on any particular patch algebra (JSON Patch, Automerge, etc.), making it the stable core upon which all CRDT, worker, or diff-based systems can be built.




<p>&nbsp;</p>

# Immutable\<T\>
General immutability pattern.
See full type definitions: [`@sys/types`](code/sys/types/src/types/t.Immutable.ts)

In its basic usage pattern:
```ts
type T = { count: number }

foo.current;                       //  === { count: 0 }    ↓
foo.change((d) => d.count = 123);  //   Σ  |               ← safe mutation
foo.current;                       //  === { count: 123 }  ↓              ..(next instance)
```


...and with a more flavor to the shape and characteristics of the `Immutable<T>` design pattern primitive (which is used extensively across the system for strongly typed manipulation of state).

A broad number of diverse (and divergent) systems can be driven by this one single
"safe" state manipulation pattern.

Below shows how an `Immutable<T>` of `JSON` is declared, listened to, manipulated, and then ultimately disposed of (lifecycle):


```ts
type Immutable<T> = {
  current: T
  change(fn: Mutator<T>): void
  listen(): Events<T>
}

type T = { count: number }

// Generator<T> over some immutability strategy
// (typically an external library's implementation, see namespace: `@sys/driver-*`), eg. "crdt" etc.
const foo = Generator.create<T>({ count: 0 }) // ← Immutable<T>


/**
 * Imutable change pattern.
 * (safely mutate a proxy).
 */
foo.current;                       //  === { count: 0 }    ↓
foo.change((d) => d.count = 123);  //   Σ  |               ← safe mutation
foo.current;                       //  === { count: 123 }  ↓


// Strongly typed Event<T> stream observable: 💦
const events = thing.listen(): Events<T>
events.$.subscribe((e) => { /* handle event stream */ });

/**
 * ↑ 💦
 *
 * Stream of Patch<T> changes optionally available,
 * eg. "RFC-6902 JSON patch standard".
 *
 * The Events<T> library itself enshrines the meaning of the message stream
 * conceptually through domain specific, pre-canned, stongly typed properties
 * and methods of functional filters/helpers.
 */

// Finished.
events.dispose();
```
