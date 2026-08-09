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

- [jsr:`@sys/std`](https://jsr.io/@sys/std) ← Browser + [WinterTG](https://wintertc.org/)

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

`Dispose.lifecycle()` and `Dispose.lifecycleAsync()` are the public constructor tier. Their
`Rx.lifecycle()` and `Rx.lifecycleAsync()` aliases are the same functions, not a separate disposal
model.

A `LifecycleView` is a structural contract: assigning an owner to that type does not remove
authority from the runtime object. Use `Dispose.omitDispose()` when an API must return a separate
object without callable direct or native disposal authority. That projection preserves observation
and state as API shaping; it is not a tamper-resistant security boundary.

```ts
import type { t } from 'jsr:@sys/std/t';
import { Dispose } from 'jsr:@sys/std/dispose';

const owner = Dispose.lifecycle();
const view: t.LifecycleView = Dispose.omitDispose(owner);
const dependent = Dispose.lifecycle(view);

owner.dispose('shutdown'); // The dependent observes the stop signal; ownership never transfers.
```

An `UntilInput` is observation-only. Observable emissions, `LifecycleView` terminal truth, and abort
signals ask the newly created owner to stop without granting authority over the input. An
already-disposed view schedules one reasonless stop across the construction microtask; `dispose$`
itself does not become replaying. Stateless disposable authority and direct asynchronous lifecycle
objects are not accepted directly as `UntilInput` values, though callers may pass an explicit
compatible `dispose$` stream.
