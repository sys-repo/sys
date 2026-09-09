import { describe, expect, it, Num } from '../../../-test.ts';
import { MAX_TERMINAL_CELLS } from '../../u/u.layout.ts';
import { createSize } from '../u.size.ts';

describe('Cli.Screen.size', () => {
  it('resolves complete measured dimensions', () => {
    const size = createSize(() => ({ width: 132, height: 48 }));

    expect(size()).to.eql({ width: 132, height: 48 });
  });

  it('applies the deterministic fallback independently to unavailable dimensions', () => {
    const widthOnly = createSize(() => ({ width: 132 }));
    const heightOnly = createSize(() => ({ height: 48 }));
    const unavailable = createSize(() => undefined);

    expect(widthOnly()).to.eql({ width: 132, height: 24 });
    expect(heightOnly()).to.eql({ width: 80, height: 48 });
    expect(unavailable()).to.eql({ width: 80, height: 24 });
  });

  it('applies fallback to invalid raw dimensions', () => {
    const size = createSize(() => ({
      width: Num.INFINITY,
      height: 0,
    }));

    expect(size()).to.eql({ width: 80, height: 24 });
  });

  it('bounds physical dimensions before publishing screen size', () => {
    const exact = createSize(() => ({ width: MAX_TERMINAL_CELLS + 0.9, height: 24.9 }));
    const oversized = createSize(() => ({
      width: MAX_TERMINAL_CELLS + 1,
      height: Number.MAX_VALUE,
    }));

    expect(exact()).to.eql({ width: MAX_TERMINAL_CELLS, height: 24 });
    expect(oversized()).to.eql({ width: 80, height: 24 });
  });
});
