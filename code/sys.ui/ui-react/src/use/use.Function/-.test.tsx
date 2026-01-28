import { act } from 'react';
import {
  afterAll,
  beforeEach,
  describe,
  DomMock,
  expect,
  expectTypeOf,
  it,
  renderHook,
} from '../../-test.ts';
import { useFunction } from './mod.ts';

describe('useFunction', { sanitizeResources: false, sanitizeOps: false }, () => {
  DomMock.init(beforeEach, afterAll);

  it('returns a stable function identity across renders', () => {
    const fnA = (n: number) => n + 1;
    const fnB = (n: number) => n + 2;

    const { result, rerender, unmount } = renderHook(
      ({ fn }: { fn?: (n: number) => number }) => useFunction(fn),
      { initialProps: { fn: fnA } },
    );

    const first = result.current;
    expect(first(41)).to.eql(42);

    act(() => {
      rerender({ fn: fnB });
    });

    const second = result.current;
    expect(second).to.equal(first); // identity stays stable
    expect(second(41)).to.eql(43); // logic updates to latest
    unmount();
  });

  it('is safe when passed undefined (no-op)', () => {
    const { result, unmount } = renderHook(() =>
      useFunction<(...args: unknown[]) => unknown>(undefined),
    );

    expect(() => result.current()).to.not.throw();
    expect(result.current()).to.eql(undefined);
    unmount();
  });

  it('type inference: preserves parameter/return types (via host)', () => {
    const { result, unmount } = renderHook(() => useFunction((n: number) => n * 2));

    // compile-time assertion
    expectTypeOf(result.current).toEqualTypeOf<(n: number) => number>();

    // runtime sanity
    expect(result.current(3)).to.eql(6);
    unmount();
  });
});
