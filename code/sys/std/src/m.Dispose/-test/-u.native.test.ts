import { describe, expect, it } from './common.ts';
import { requireSymbolAsyncDispose, requireSymbolDispose } from '../u.native.ts';

describe('Dispose native protocol floor', () => {
  it('native runtime → resolves each well-known disposal symbol independently', () => {
    expect(requireSymbolDispose()).to.equal(Symbol.dispose);
    expect(requireSymbolAsyncDispose()).to.equal(Symbol.asyncDispose);
  });

  it('unsupported runtime → fails at the matching capability boundary without fallback', () => {
    const dispose: typeof Symbol.dispose = Symbol.dispose;
    const asyncDispose: typeof Symbol.asyncDispose = Symbol.asyncDispose;

    expect(requireSymbolDispose({ dispose })).to.equal(dispose);
    expect(requireSymbolAsyncDispose({ asyncDispose })).to.equal(asyncDispose);
    expect(() => requireSymbolDispose({ asyncDispose })).to.throw(
      TypeError,
      'Native ECMAScript Explicit Resource Management requires Symbol.dispose',
    );
    expect(() => requireSymbolAsyncDispose({ dispose })).to.throw(
      TypeError,
      'Native ECMAScript Explicit Resource Management requires Symbol.asyncDispose',
    );

    expect(Symbol.dispose).to.equal(dispose);
    expect(Symbol.asyncDispose).to.equal(asyncDispose);
  });
});
