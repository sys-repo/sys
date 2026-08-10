/**
 * @module
 * Observable lifecycle helpers adapted to native ECMAScript Explicit Resource Management.
 *
 * ## Capability boundaries
 *
 * The canonical contracts separate disposal authority from lifecycle telemetry:
 *
 * - `Disposable` and `DisposableAsync` grant matching direct and native disposal authority without
 *   promising observation or state;
 * - `Lifecycle` and `LifecycleAsync` add `dispose$` observation and `disposed` state to that
 *   authority; and
 * - `LifecycleView` promises synchronous lifecycle observation and state without promising disposal
 *   authority.
 *
 * Public construction starts at the full lifecycle tier through `Dispose.lifecycle()` and
 * `Dispose.lifecycleAsync()`. The corresponding `Rx` methods are aliases to the same factories, not
 * a parallel disposal model.
 *
 * Type narrowing to `LifecycleView` or `OmitDisposable<T>` does not remove authority from an
 * existing runtime value. `Dispose.omitDispose()` returns a separate projection that removes
 * callable own authority and shadows inherited authority while preserving observation and state.
 * Retained property reads and methods delegate to the source so private fields and built-in internal
 * slots remain callable through the projection. Callable projections retain their original call and
 * construction categories, with stable identity within one projection. An asynchronous projection
 * retains an undefined `Symbol.asyncDispose` category marker so its telemetry is not mistaken for a
 * synchronous `LifecycleView`; it is not a direct `UntilInput`. The projection shapes a shallow API
 * boundary; it is not a tamper-resistant security boundary.
 *
 * Lifecycle owners created by this module expose explicit control, lexical cleanup, and observable
 * state from one disposal operation:
 *
 * - `.dispose(reason)` requests disposal explicitly and may carry an application reason;
 * - `[Symbol.dispose]()` or `[Symbol.asyncDispose]()` lets `using` or `await using` request disposal
 *   at scope exit without a reason; and
 * - `dispose$` reports the same owned operation to observers.
 *
 * The native symbol is a zero-argument adapter, not a second cleanup engine. The first entrypoint to
 * request disposal wins, and repeated direct or symbolic calls do not run cleanup again. Canonical
 * synchronous and asynchronous resources expose only their matching native protocol. `await using`
 * can also consume a synchronous resource through the language's standard fallback.
 *
 * Synchronous lifecycle factories and `toLifecycle` require `Symbol.dispose`; asynchronous
 * lifecycle factories require `Symbol.asyncDispose`; and `omitDispose` requires both because it
 * removes both forms of native authority. Missing symbols fail clearly. This module does not install
 * a shim or mutate globals.
 *
 * ## Explicit and lexical cleanup
 *
 * ```ts
 * import { Dispose } from 'jsr:@sys/std/dispose';
 *
 * const early = Dispose.lifecycle();
 * early.dispose$.subscribe(({ reason }) => console.log(reason));
 * early.dispose('navigation'); // The observable receives "navigation".
 *
 * {
 *   using scoped = Dispose.lifecycle();
 *   scoped.dispose$.subscribe(({ reason }) => console.log(reason));
 * } // Lexical cleanup records `undefined` because native protocols carry no reason.
 * ```
 *
 * A synchronous owner created here emits one event with an own `reason` property and completes the
 * stream; the property is `undefined` when no reason was supplied. An asynchronous owner emits
 * `start`, then `complete` or `error`, as ordinary values; optional `reason` and `error` fields are
 * omitted when undefined. Its stream neither uses the observable error channel nor completes.
 * `LifecycleAsync.disposed` remains false during `start` and becomes true at either terminal stage.
 *
 * For asynchronous owners, every disposal entrypoint returns the same stored completion. That
 * promise fulfills after cleanup or rejects with raw completion truth. The terminal `dispose$` event
 * is telemetry: failures contain a normalized `DisposeError`, while the promise rejects with the
 * original thrown or rejected value. If a scope body and cleanup both fail, the JavaScript runtime
 * constructs a `SuppressedError` whose `error` is the cleanup failure and whose `suppressed` value is
 * the body failure.
 *
 * ```ts
 * import { Dispose } from 'jsr:@sys/std/dispose';
 *
 * const resource = Dispose.lifecycleAsync(async ({ reason }) => {
 *   console.log(reason);
 *   await Promise.resolve();
 * });
 * resource.dispose$.subscribe(({ payload }) => console.log(payload.stage, payload.error));
 * await resource.dispose('shutdown');
 * ```
 *
 * ## Lifetime inputs and ownership
 *
 * An `UntilInput` asks the new resource to observe an existing signal. It does not transfer
 * ownership of that input or dispose it. An observable emission, synchronous `LifecycleView`
 * terminal truth, or an `AbortSignal` abort requests disposal of the new owner. An already-disposed
 * lifecycle view and a pre-aborted signal each synthesize one stop emission across the construction
 * microtask without making the underlying stream replay. Other emissions made while subscriptions
 * are being attached cross the same boundary; later emissions request disposal in their source turn.
 *
 * Stateless disposable owners and direct asynchronous lifecycle objects are not `UntilInput`
 * values; callers may pass an explicit compatible `dispose$` stream. External structural
 * implementers of the canonical `@sys/types` disposal contracts must provide the matching native
 * symbol, expose no callable opposite-protocol authority, and forward direct and symbolic
 * entrypoints to one cleanup operation.
 */
export { Dispose } from './m.Dispose.ts';
