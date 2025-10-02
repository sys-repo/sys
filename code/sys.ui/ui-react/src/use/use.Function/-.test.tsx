import React from 'react';
import { TestRenderer, act, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { useFunction } from './mod.ts';

describe('useFunction', () => {
  it('returns a stable function identity across renders', () => {
    let currentStable: ((n: number) => number) | undefined;

    const Test: React.FC<{ fn?: (n: number) => number }> = ({ fn }) => {
      const stable = useFunction(fn);
      currentStable = stable;
      return null;
    };

    const fnA = (n: number) => n + 1;
    const fnB = (n: number) => n + 2;

    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<Test fn={fnA} />);
    });

    const first = currentStable!;
    expect(first(41)).to.eql(42);

    act(() => {
      renderer.update(<Test fn={fnB} />);
    });

    const second = currentStable!;
    expect(second).to.equal(first); // identity stays stable
    expect(second(41)).to.eql(43); // logic updates to latest
  });

  it('is safe when passed undefined (no-op)', () => {
    let currentStable: ((...args: unknown[]) => unknown) | undefined;

    const Test: React.FC = () => {
      const stable = useFunction<(...args: unknown[]) => unknown>(undefined);
      currentStable = stable;
      return null;
    };

    act(() => {
      TestRenderer.create(<Test />);
    });

    expect(() => currentStable!()).to.not.throw();
    expect(currentStable!()).to.eql(undefined);
  });

  it('type inference: preserves parameter/return types (via host)', () => {
    // capture variable so we can assert types at compile time and call at runtime
    let captured!: (n: number) => number;

    const Test: React.FC = () => {
      const stable = useFunction((n: number) => n * 2);
      captured = stable;
      return null;
    };

    act(() => {
      TestRenderer.create(<Test />);
    });

    // compile-time type assertion (will fail the build if wrong)
    expectTypeOf(captured).toEqualTypeOf<(n: number) => number>();

    // quick runtime sanity
    expect(captured(3)).to.eql(6);
  });
});
