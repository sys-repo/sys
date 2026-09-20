# @sys/std

Shared value helpers, reactive primitives, and lifecycle contracts. The root exports package
metadata and a type namespace; import runtime helpers from their leaf entry points.

## Choose a surface

- **Values:** `/arr`, `/obj`, `/str`, `/num`, `/is`, `/error`, and `/json`.
- **Time and coordination:** `/time`, `/async`, `/signal`, `/effect`, `/rx`, and `/dispose`.
- **Names and structure:** `/path`, `/pkg`, `/semver`, and `/url`.
- **Testing:** `/testing`, `/testing/server`, and `/testing/server/dom`.
- **Types:** `/t` exports the contracts directly; the root also exposes them as `type t`.

Runtime requirements vary by leaf. Pure value helpers do not imply that IndexedDB, DOM mocks, server
helpers, or all other exports work in every browser or server runtime. See the
[API documentation](https://jsr.io/@sys/std/doc) for individual contracts and the full entry map.

## Disposal capabilities

The shared contracts in `@sys/types` separate the authority to stop a resource from observing that
resource's lifecycle:

| Contract                         | Disposal authority | `dispose$` observation | `disposed` state |
| -------------------------------- | ------------------ | ---------------------- | ---------------- |
| `Disposable` / `DisposableAsync` | Yes                | No                     | No               |
| `Lifecycle` / `LifecycleAsync`   | Yes                | Yes                    | Yes              |
| `LifecycleView`                  | Not promised       | Yes                    | Yes              |

`Dispose.lifecycle()` and `Dispose.lifecycleAsync()` create lifecycle owners. `Rx.lifecycle()` and
`Rx.lifecycleAsync()` are aliases of those functions.

`LifecycleView` describes `dispose$` and `disposed`; it does not change the object itself.
`Dispose.omitDispose()` returns a separate view that follows the owner's state and events without
exposing callable `dispose`, `Symbol.dispose`, or `Symbol.asyncDispose` methods. Creating the view
does not dispose the resource. This narrows the API; it is not a security boundary.

```ts
import type * as t from 'jsr:@sys/types/t';
import { Dispose } from 'jsr:@sys/std/dispose';

const owner = Dispose.lifecycle();
const view: t.LifecycleView = Dispose.omitDispose(owner);
const dependent = Dispose.lifecycle(view);

owner.dispose('shutdown'); // The dependent observes the stop signal; ownership never transfers.
console.info(view.disposed, dependent.disposed); // true, true
```

Synchronous lifecycle owners mark `disposed` on the first disposal emission. Async owners mark it
only when disposal reaches `complete` or `error`, not when it begins. Await async disposal to
observe settlement; a disposed flag alone does not establish successful cleanup.

For an async owner, `Dispose.omitDispose()` keeps `Symbol.asyncDispose` as an `undefined` property.
Runtime guards can still recognize the view as async, but there is no method to call through that
symbol.

An `UntilInput` may be an observable, a `LifecycleView`, an abort signal, or any nested combination
of them. `undefined` is ignored. The first trigger stops the new owner; ownership of the inputs does
not transfer. An already-disposed view triggers that stop on the next microtask; `dispose$` remains
non-replaying. Direct async lifecycle objects are not `UntilInput` values; pass a compatible
observable instead.
