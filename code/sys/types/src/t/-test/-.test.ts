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

  it('OmitDisposable → authority-free but state-bearing construction target', () => {
    type Source = t.Lifecycle & globalThis.Disposable & globalThis.AsyncDisposable & {
      readonly id: string;
    };
    const projection: t.OmitDisposable<Source> = { id: 'resource', disposed: false };

    expectTypeOf(projection).toEqualTypeOf<{
      readonly id: string;
      readonly disposed: boolean;
    }>();
  });

  it('OmitLifecycle → authority-free and state-free construction target', () => {
    type Source = t.Lifecycle & globalThis.Disposable & globalThis.AsyncDisposable & {
      readonly id: string;
    };
    const projection: t.OmitLifecycle<Source> = { id: 'resource' };

    expectTypeOf(projection).toEqualTypeOf<{ readonly id: string }>();
  });
});
