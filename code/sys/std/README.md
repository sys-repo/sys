# Standard Lib

Standard system libraries. Common low(ish)-level utility functions and helpers.

```ts
import type { t } from 'jsr:@sys/std/t';
import { Num } from 'jsr:@sys/std/num';
import { Pkg } from 'jsr:@sys/std/pkg';
import { Str } from 'jsr:@sys/std/str';
import { Obj } from 'jsr:@sys/std/obj';
```

### Runtimes

- [jsr:`@sys/std`](https://jsr.io/@sys/std) ← Browser + [WinterTC](https://wintertc.org/)

#### see also (primitives):

- [jsr:`@sys/types`](https://jsr.io/@sys/types)

---
- [jsr:`@sys/fs`](https://jsr.io/@sys/fs)
- [jsr:`@sys/cli`](https://jsr.io/@sys/cli)
- [jsr:`@sys/http`](https://jsr.io/@sys/http)
- [jsr:`@sys/process`](https://jsr.io/@sys/process)
---

- [jsr:`@sys/crdt`](https://jsr.io/@sys/crdt)
- [jsr:`@sys/schema`](https://jsr.io/@sys/schema)

<p>&nbsp;<p>

## Usage

```ts
// Types:
import type * as t from 'jsr:@sys/std/t';
import type { t } from 'jsr:@sys/std';

// Common:
export { Arr } from 'jsr:@sys/std/arr';
export { Err } from 'jsr:@sys/std/error';
export { Is } from 'jsr:@sys/std/is';
export { Num } from 'jsr:@sys/std/num';
export { Pkg } from 'jsr:@sys/std/pkg';
export { Str } from 'jsr:@sys/std/str';
export { Time } from 'jsr:@sys/std/time';
export { Obj } from 'jsr:@sys/std/obj';

import { Args } from 'jsr:@sys/std/args';
import { Schedule } from 'jsr:@sys/std/async';
import { Dispose } from 'jsr:@sys/std/dispose';
import { Path } from 'jsr:@sys/std/path';
import { Signal } from 'jsr:@sys/std/signal';
import { Time } from 'jsr:@sys/std/time';
import { Rx } from 'jsr:@sys/std/rx';

// Unit-testing:
import { Testing } from 'jsr:@sys/std/testing';
import { Testing } from 'jsr:@sys/std/testing/server';
```

## Disposal capabilities

The disposal contracts separate the authority to stop a resource from observing that resource's
lifecycle:

| Contract                         | Disposal authority | `dispose$` observation | `disposed` state |
| -------------------------------- | ------------------ | ---------------------- | ---------------- |
| `Disposable` / `DisposableAsync` | Yes                | No                     | No               |
| `Lifecycle` / `LifecycleAsync`   | Yes                | Yes                    | Yes              |
| `LifecycleView`                  | Not promised       | Yes                    | Yes              |

`Dispose.lifecycle()` and `Dispose.lifecycleAsync()` create lifecycle owners. `Rx.lifecycle()` and
`Rx.lifecycleAsync()` are aliases of those functions.

`LifecycleView` describes `dispose$` and `disposed`; it does not change the object itself.
`Dispose.omitDispose()` returns a separate object that keeps those properties but withholds
`dispose`, `Symbol.dispose`, and `Symbol.asyncDispose`. This narrows the API surface; it is not a
security boundary.

```ts
import type { t } from 'jsr:@sys/std/t';
import { Dispose } from 'jsr:@sys/std/dispose';

const owner = Dispose.lifecycle();
const view: t.LifecycleView = Dispose.omitDispose(owner);
const dependent = Dispose.lifecycle(view);

owner.dispose('shutdown'); // The dependent observes the stop signal; ownership never transfers.
```

An `UntilInput` may be an observable, a `LifecycleView`, an abort signal, or any nested combination
of them. `undefined` is ignored. The first trigger stops the new owner; ownership of the inputs does
not transfer. An already-disposed view triggers that stop on the next microtask; `dispose$` remains
non-replaying.
