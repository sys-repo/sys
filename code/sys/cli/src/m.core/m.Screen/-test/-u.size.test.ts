import { describe, expect, it, Num } from '../../../-test.ts';
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
});
