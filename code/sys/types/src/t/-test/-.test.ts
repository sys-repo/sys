import { describe, expectTypeOf, it } from '../../-test.ts';
import type { t } from '../common.ts';

describe('Types', () => {
  it('PkgName: scoped package name → "@scope/<name>"', () => {
    // @ts-expect-error: an unscoped name must not satisfy StringScopedPkgName.
    const a: t.StringScopedPkgName = 'foo'; // NB: Invalid.
    const b: t.StringScopedPkgName = '@sys/std';
    console.info();
    console.info('a (invalid):', a);
    console.info('b (valid):', b);
    console.info();
  });

  it('AbortSignal is an UntilInput and concrete Until', () => {
    const signal = new AbortController().signal;
    const input: t.UntilInput = signal;
    const until: t.Until = signal;

    expectTypeOf(input).toMatchTypeOf<t.UntilInput>();
    expectTypeOf(until).toMatchTypeOf<t.Until>();
  });

  it('UntilInput accepts lifecycle truth rather than disposal authority', () => {
    type ViewAccepted = t.LifecycleView extends t.UntilInput ? true : false;
    type LifecycleAccepted = t.Lifecycle extends t.UntilInput ? true : false;
    type AsyncSignalAccepted = t.LifecycleAsync['dispose$'] extends t.UntilInput ? true : false;
    type DisposableRejected = t.Disposable extends t.UntilInput ? false : true;
    type AsyncLifecycleRejected = t.LifecycleAsync extends t.UntilInput ? false : true;
    type AsyncProjectionRejected = t.OmitDisposable<t.LifecycleAsync> extends t.UntilInput ? false
      : true;

    const viewAccepted: ViewAccepted = true;
    const lifecycleAccepted: LifecycleAccepted = true;
    const asyncSignalAccepted: AsyncSignalAccepted = true;
    const disposableRejected: DisposableRejected = true;
    const asyncLifecycleRejected: AsyncLifecycleRejected = true;
    const asyncProjectionRejected: AsyncProjectionRejected = true;

    expectTypeOf(viewAccepted).toEqualTypeOf<true>();
    expectTypeOf(lifecycleAccepted).toEqualTypeOf<true>();
    expectTypeOf(asyncSignalAccepted).toEqualTypeOf<true>();
    expectTypeOf(disposableRejected).toEqualTypeOf<true>();
    expectTypeOf(asyncLifecycleRejected).toEqualTypeOf<true>();
    expectTypeOf(asyncProjectionRejected).toEqualTypeOf<true>();
  });

  it('WaitableHandle exposes observed lifecycle completion', () => {
    const handle: t.WaitableHandle = { finished: Promise.resolve() };

    expectTypeOf(handle).toMatchTypeOf<t.WaitableHandle>();
  });

  it('canonical disposable types carry authority without lifecycle observation', () => {
    const sync: t.Disposable = {
      dispose() {},
      [Symbol.dispose]() {},
    };
    const async: t.DisposableAsync = {
      async dispose() {},
      async [Symbol.asyncDispose]() {},
    };

    type ObservationKey = 'dispose$' | 'disposed';
    type SyncObservation = Extract<keyof t.Disposable, ObservationKey>;
    type AsyncObservation = Extract<keyof t.DisposableAsync, ObservationKey>;
    const syncHasNoObservation: SyncObservation extends never ? true : false = true;
    const asyncHasNoObservation: AsyncObservation extends never ? true : false = true;

    expectTypeOf(sync).toMatchTypeOf<globalThis.Disposable>();
    expectTypeOf(async).toMatchTypeOf<globalThis.AsyncDisposable>();
    expectTypeOf(syncHasNoObservation).toEqualTypeOf<true>();
    expectTypeOf(asyncHasNoObservation).toEqualTypeOf<true>();
  });

  it('canonical lifecycles add observation and state to disposal authority', () => {
    type SyncAuthority = t.Lifecycle extends t.Disposable ? true : false;
    type AsyncAuthority = t.LifecycleAsync extends t.DisposableAsync ? true : false;
    type SyncObservation = t.Lifecycle extends t.LifecycleView ? true : false;
    type StatelessSyncRejected = t.Disposable extends t.Lifecycle ? false : true;
    type StatelessAsyncRejected = t.DisposableAsync extends t.LifecycleAsync ? false : true;

    const syncAuthority: SyncAuthority = true;
    const asyncAuthority: AsyncAuthority = true;
    const syncObservation: SyncObservation = true;
    const statelessSyncRejected: StatelessSyncRejected = true;
    const statelessAsyncRejected: StatelessAsyncRejected = true;

    expectTypeOf(syncAuthority).toEqualTypeOf<true>();
    expectTypeOf(asyncAuthority).toEqualTypeOf<true>();
    expectTypeOf(syncObservation).toEqualTypeOf<true>();
    expectTypeOf(statelessSyncRejected).toEqualTypeOf<true>();
    expectTypeOf(statelessAsyncRejected).toEqualTypeOf<true>();
  });

  it('LifecycleView promises observation and state without disposal authority', () => {
    type AuthorityKey = 'dispose' | typeof Symbol.dispose | typeof Symbol.asyncDispose;
    type ViewAuthority = Extract<keyof t.LifecycleView, AuthorityKey>;
    type ViewShape = t.LifecycleView extends {
      readonly dispose$: t.DisposeObservable;
      readonly disposed: boolean;
    } ? true
      : false;

    const authorityFree: ViewAuthority extends never ? true : false = true;
    const observableState: ViewShape = true;

    expectTypeOf(authorityFree).toEqualTypeOf<true>();
    expectTypeOf(observableState).toEqualTypeOf<true>();
  });

  it('canonical sync and async disposal categories are disjoint', () => {
    type HybridSyncShape = {
      dispose(reason?: unknown): void;
      [Symbol.dispose](): void;
      [Symbol.asyncDispose](): Promise<void>;
    };
    type HybridAsyncShape = {
      dispose(reason?: unknown): Promise<void>;
      [Symbol.dispose](): void;
      [Symbol.asyncDispose](): Promise<void>;
    };
    type SyncFromAsyncRejected = t.DisposableAsync extends t.Disposable ? false : true;
    type AsyncFromSyncRejected = t.Disposable extends t.DisposableAsync ? false : true;
    type HybridSyncRejected = HybridSyncShape extends t.Disposable ? false : true;
    type HybridAsyncRejected = HybridAsyncShape extends t.DisposableAsync ? false : true;

    const syncFromAsyncRejected: SyncFromAsyncRejected = true;
    const asyncFromSyncRejected: AsyncFromSyncRejected = true;
    const hybridSyncRejected: HybridSyncRejected = true;
    const hybridAsyncRejected: HybridAsyncRejected = true;

    expectTypeOf(syncFromAsyncRejected).toEqualTypeOf<true>();
    expectTypeOf(asyncFromSyncRejected).toEqualTypeOf<true>();
    expectTypeOf(hybridSyncRejected).toEqualTypeOf<true>();
    expectTypeOf(hybridAsyncRejected).toEqualTypeOf<true>();
  });

  it('direct-method concepts stay broad while Until requires lifecycle truth', () => {
    type DirectOnly = { dispose(reason?: unknown): void };
    type DisposableLikeAccepted = DirectOnly extends t.DisposableLike ? true : false;
    type CanDisposeAccepted = DirectOnly extends t.CanDispose ? true : false;
    type DirectUntilRejected = DirectOnly extends t.Until ? false : true;
    type NativeUntilRejected = globalThis.Disposable extends t.Until ? false : true;
    type AsyncUntilRejected = t.DisposableAsync extends t.Until ? false : true;

    const disposableLikeAccepted: DisposableLikeAccepted = true;
    const canDisposeAccepted: CanDisposeAccepted = true;
    const directUntilRejected: DirectUntilRejected = true;
    const nativeUntilRejected: NativeUntilRejected = true;
    const asyncUntilRejected: AsyncUntilRejected = true;

    expectTypeOf(disposableLikeAccepted).toEqualTypeOf<true>();
    expectTypeOf(canDisposeAccepted).toEqualTypeOf<true>();
    expectTypeOf(directUntilRejected).toEqualTypeOf<true>();
    expectTypeOf(nativeUntilRejected).toEqualTypeOf<true>();
    expectTypeOf(asyncUntilRejected).toEqualTypeOf<true>();
  });

  it('OmitDisposable removes authority and preserves lifecycle observation', () => {
    type SyncSource = t.Lifecycle & { readonly id: string };
    type AsyncSource = t.LifecycleAsync & { readonly id: string };
    type SyncExpected = t.LifecycleView & { readonly id: string };
    type AsyncExpected = {
      readonly id: string;
      readonly dispose$: t.Observable<t.DisposeAsyncEvent>;
      readonly disposed: boolean;
    };

    const syncOutputFits: t.Type.Extends<t.OmitDisposable<SyncSource>, SyncExpected> = true;
    const syncInputFits: t.Type.Extends<SyncExpected, t.OmitDisposable<SyncSource>> = true;
    const asyncOutputFits: t.Type.Extends<t.OmitDisposable<AsyncSource>, AsyncExpected> = true;
    const asyncInputFits: t.Type.Extends<AsyncExpected, t.OmitDisposable<AsyncSource>> = true;

    expectTypeOf(syncOutputFits).toEqualTypeOf<true>();
    expectTypeOf(syncInputFits).toEqualTypeOf<true>();
    expectTypeOf(asyncOutputFits).toEqualTypeOf<true>();
    expectTypeOf(asyncInputFits).toEqualTypeOf<true>();
  });

  it('OmitLifecycle removes authority, observation, and state', () => {
    type SyncSource = t.Lifecycle & { readonly id: string };
    type AsyncSource = t.LifecycleAsync & { readonly id: string };
    type Expected = { readonly id: string };

    const syncOutputFits: t.Type.Extends<t.OmitLifecycle<SyncSource>, Expected> = true;
    const syncInputFits: t.Type.Extends<Expected, t.OmitLifecycle<SyncSource>> = true;
    const asyncOutputFits: t.Type.Extends<t.OmitLifecycle<AsyncSource>, Expected> = true;
    const asyncInputFits: t.Type.Extends<Expected, t.OmitLifecycle<AsyncSource>> = true;

    expectTypeOf(syncOutputFits).toEqualTypeOf<true>();
    expectTypeOf(syncInputFits).toEqualTypeOf<true>();
    expectTypeOf(asyncOutputFits).toEqualTypeOf<true>();
    expectTypeOf(asyncInputFits).toEqualTypeOf<true>();
  });
});
