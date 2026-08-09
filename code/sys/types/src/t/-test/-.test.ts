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

  it('WaitableHandle exposes observed lifecycle completion', () => {
    const handle: t.WaitableHandle = { finished: Promise.resolve() };

    expectTypeOf(handle).toMatchTypeOf<t.WaitableHandle>();
  });

  it('canonical disposal types require their matching native protocols', () => {
    type LegacySyncShape = {
      readonly dispose$: t.DisposeObservable;
      dispose(reason?: unknown): void;
    };
    type LegacyAsyncShape = {
      readonly dispose$: t.Observable<t.DisposeAsyncEvent>;
      dispose(reason?: unknown): Promise<void>;
    };

    const sync = null as unknown as t.Disposable;
    const async = null as unknown as t.DisposableAsync;
    const legacySync = null as unknown as LegacySyncShape;
    const legacyAsync = null as unknown as LegacyAsyncShape;

    expectTypeOf(sync).toMatchTypeOf<globalThis.Disposable>();
    expectTypeOf(async).toMatchTypeOf<globalThis.AsyncDisposable>();

    // @ts-expect-error: canonical sync disposal requires native synchronous authority.
    const invalidSync: t.Disposable = legacySync;
    // @ts-expect-error: canonical async disposal requires native asynchronous authority.
    const invalidAsync: t.DisposableAsync = legacyAsync;
    void invalidSync;
    void invalidAsync;
  });

  it('canonical sync and async disposal categories are disjoint', () => {
    type HybridSyncShape = {
      readonly dispose$: t.DisposeObservable;
      dispose(reason?: unknown): void;
      [Symbol.dispose](): void;
      [Symbol.asyncDispose](): Promise<void>;
    };
    type HybridAsyncShape = {
      readonly dispose$: t.Observable<t.DisposeAsyncEvent>;
      dispose(reason?: unknown): Promise<void>;
      [Symbol.dispose](): void;
      [Symbol.asyncDispose](): Promise<void>;
    };

    const sync = null as unknown as t.Disposable;
    const async = null as unknown as t.DisposableAsync;
    const hybridSync = null as unknown as HybridSyncShape;
    const hybridAsync = null as unknown as HybridAsyncShape;

    // @ts-expect-error: canonical async disposal cannot satisfy the sync category.
    const syncFromAsync: t.Disposable = async;
    // @ts-expect-error: canonical sync disposal cannot satisfy the async category.
    const asyncFromSync: t.DisposableAsync = sync;
    // @ts-expect-error: canonical sync disposal cannot expose async disposal authority.
    const syncFromHybrid: t.Disposable = hybridSync;
    // @ts-expect-error: canonical async disposal cannot expose sync disposal authority.
    const asyncFromHybrid: t.DisposableAsync = hybridAsync;
    void syncFromAsync;
    void asyncFromSync;
    void syncFromHybrid;
    void asyncFromHybrid;
  });

  it('direct-method concepts stay broad while Until requires canonical sync disposal', () => {
    type LegacySyncShape = {
      readonly dispose$: t.DisposeObservable;
      dispose(reason?: unknown): void;
    };

    const legacy = null as unknown as LegacySyncShape;
    const nativeOnly = null as unknown as globalThis.Disposable;
    const async = null as unknown as t.DisposableAsync;
    const disposableLike: t.DisposableLike = legacy;
    const canDispose: t.CanDispose = legacy;

    // @ts-expect-error: legacy observable disposal lacks native synchronous authority.
    const legacyUntil: t.Until = legacy;
    // @ts-expect-error: a native-only resource has no observable Sys lifetime.
    const nativeUntil: t.Until = nativeOnly;
    // @ts-expect-error: asynchronous lifecycle authority is not a direct Until input.
    const asyncUntil: t.Until = async;
    void disposableLike;
    void canDispose;
    void legacyUntil;
    void nativeUntil;
    void asyncUntil;
  });

  it('OmitDisposable → canonical authority-free state-bearing construction targets', () => {
    type SyncSource = t.Lifecycle & { readonly id: string };
    type AsyncSource = t.LifecycleAsync & { readonly id: string };
    type Expected = { readonly id: string; readonly disposed: boolean };

    const sync: t.OmitDisposable<SyncSource> = { id: 'sync', disposed: false };
    const async: t.OmitDisposable<AsyncSource> = { id: 'async', disposed: false };

    expectTypeOf(sync).toEqualTypeOf<Expected>();
    expectTypeOf(async).toEqualTypeOf<Expected>();
  });

  it('OmitLifecycle → canonical authority-free state-free construction targets', () => {
    type SyncSource = t.Lifecycle & { readonly id: string };
    type AsyncSource = t.LifecycleAsync & { readonly id: string };
    type Expected = { readonly id: string };

    const sync: t.OmitLifecycle<SyncSource> = { id: 'sync' };
    const async: t.OmitLifecycle<AsyncSource> = { id: 'async' };

    expectTypeOf(sync).toEqualTypeOf<Expected>();
    expectTypeOf(async).toEqualTypeOf<Expected>();
  });
});
