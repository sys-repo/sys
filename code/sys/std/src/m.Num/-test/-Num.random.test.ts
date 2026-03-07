import { describe, expect, it } from '../../-test.ts';
import { Num } from '../mod.ts';

describe('Value.Num.random', () => {
  it('API', () => {
    expect(typeof Num.random).to.equal('function');
    expect(typeof Num.random.int).to.equal('function');
  });

  it('returns a float in [0, 1) by default', () => {
    const value = Num.random();
    expect(value).to.be.greaterThanOrEqual(0);
    expect(value).to.be.lessThan(1);
  });

  it('supports (max) overload as [0, max)', () => {
    const value = Num.random(5, undefined, { source: () => 0.5 });
    expect(value).to.equal(2.5);
  });

  it('supports (min, max) as [min, max)', () => {
    const value = Num.random(300, 500, { source: () => 0.5 });
    expect(value).to.equal(400);
  });

  it('supports inclusive integer ranges', () => {
    const low = Num.random.int(300, 500, { source: () => 0 });
    const high = Num.random.int(300, 500, { source: () => 0.999_999_999 });
    expect(low).to.equal(300);
    expect(high).to.equal(500);
  });

  it('returns min when min === max (float and int)', () => {
    expect(Num.random(7, 7)).to.equal(7);
    expect(Num.random.int(7, 7)).to.equal(7);
  });

  it('throws on unordered bounds', () => {
    expect(() => Num.random(2, 1)).to.throw('min must be less than or equal to max');
    expect(() => Num.random.int(2, 1)).to.throw('min must be less than or equal to max');
  });

  it('throws on non-finite bounds', () => {
    expect(() => Num.random(Number.NaN, 1)).to.throw('min must be a finite number');
    expect(() => Num.random(0, Number.POSITIVE_INFINITY)).to.throw('max must be a finite number');
  });

  it('throws when int bounds are not integers', () => {
    expect(() => Num.random.int(1.2, 3)).to.throw('min must be an integer');
    expect(() => Num.random.int(1, 3.1)).to.throw('max must be an integer');
  });

  it('throws when custom source is outside [0, 1)', () => {
    expect(() => Num.random(0, 1, { source: () => -0.1 })).to.throw(
      'random source result must be in [0, 1)',
    );
    expect(() => Num.random.int(0, 1, { source: () => 1 })).to.throw(
      'random source result must be in [0, 1)',
    );
  });

  it('supports crypto source (smoke)', () => {
    const value = Num.random(10, 20, { source: 'crypto' });
    const int = Num.random.int(10, 20, { source: 'crypto' });
    expect(value).to.be.greaterThanOrEqual(10);
    expect(value).to.be.lessThan(20);
    expect(int).to.be.greaterThanOrEqual(10);
    expect(int).to.be.lessThanOrEqual(20);
  });
});
