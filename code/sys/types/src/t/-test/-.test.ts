import { describe, expectTypeOf, it } from '../../-test.ts';
import type { t } from '../common.ts';

describe('Types', () => {
  it('PkgName: scoped package name → "@scope/<name>"', () => {
    // @ts-ignore
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
});
