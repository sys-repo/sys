import { describe, expect, it } from '../../-test.ts';
import { Random } from '../../m.Random/mod.ts';
import { Num } from '../mod.ts';

const MAX_UNIT = 1 - Number.EPSILON / 2;

const withCryptoWords = <T>(
  words: readonly (readonly [number, number])[],
  run: () => T,
): { readonly calls: number; readonly value: T } => {
  const descriptor = Object.getOwnPropertyDescriptor(crypto, 'getRandomValues');
  const values = [...words];
  let calls = 0;

  Object.defineProperty(crypto, 'getRandomValues', {
    configurable: true,
    value(target: Uint32Array): Uint32Array {
      calls += 1;
      const word = values.shift();
      if (!word) throw new Error('unexpected crypto request');
      target[0] = word[0];
      if (target.length > 1) target[1] = word[1];
      return target;
    },
  });

  try {
    const value = run();
    return { calls, value };
  } finally {
    if (descriptor) Object.defineProperty(crypto, 'getRandomValues', descriptor);
    else Reflect.deleteProperty(crypto, 'getRandomValues');
  }
};

describe('Value.Num.random', () => {
  it('preserves Random.number alias identity', () => {
    expect(Random.number).to.equal(Num.random);
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

  it('maps unit-source edges across positive, negative, and cross-zero integer ranges', () => {
    expect(Num.random.int(300, 500, { source: () => 0 })).to.equal(300);
    expect(Num.random.int(300, 500, { source: () => MAX_UNIT })).to.equal(500);
    expect(Num.random.int(-500, -300, { source: () => 0 })).to.equal(-500);
    expect(Num.random.int(-500, -300, { source: () => MAX_UNIT })).to.equal(-300);
    expect(Num.random.int(-3, 3, { source: () => 0 })).to.equal(-3);
    expect(Num.random.int(-3, 3, { source: () => MAX_UNIT })).to.equal(3);
  });

  it('returns fixed integer endpoints without reading options.source', () => {
    let sourceReads = 0;
    const options = {
      get source() {
        sourceReads += 1;
        return () => Number.NaN;
      },
    };

    expect(Num.random(7, 7)).to.equal(7);
    expect(Num.random.int(7, 7, options)).to.equal(7);
    expect(sourceReads).to.equal(0);
  });

  it('throws on unordered bounds', () => {
    expect(() => Num.random(2, 1)).to.throw('min must be less than or equal to max');
    expect(() => Num.random.int(2, 1)).to.throw('min must be less than or equal to max');
  });

  it('throws on non-finite bounds', () => {
    expect(() => Num.random(Number.NaN, 1)).to.throw('min must be a finite number');
    expect(() => Num.random(0, Number.POSITIVE_INFINITY)).to.throw('max must be a finite number');
    expect(() => Num.random.int(Number.NaN, 1)).to.throw('min must be a finite number');
    expect(() => Num.random.int(0, Number.POSITIVE_INFINITY)).to.throw(
      'max must be a finite number',
    );
  });

  it('throws when int bounds are not safe integers', () => {
    expect(() => Num.random.int(1.2, 3)).to.throw(TypeError, 'min must be an integer');
    expect(() => Num.random.int(1, 3.1)).to.throw(TypeError, 'max must be an integer');
    expect(() => Num.random.int(Num.MIN_INT - 1, Num.MIN_INT)).to.throw(
      RangeError,
      'min must be a safe integer',
    );
    expect(() => Num.random.int(Num.MAX_INT - 1, Num.MAX_INT + 1)).to.throw(
      RangeError,
      'max must be a safe integer',
    );
  });

  it('accepts maximum safe cardinality', () => {
    const max = Num.MAX_INT - 1;
    expect(Num.random.int(0, max, { source: () => 0 })).to.equal(0);
    expect(Num.random.int(0, max, { source: () => MAX_UNIT })).to.equal(max);
  });

  it('rejects cross-zero cardinality one beyond the safe maximum', () => {
    expect(() => Num.random.int(Num.MIN_INT, 0, { source: () => 0 })).to.throw(
      RangeError,
      'integer range size must not exceed Number.MAX_SAFE_INTEGER',
    );
  });

  it('rejects a cross-zero range whose Number subtraction rounds', () => {
    const min = Num.MIN_INT;
    const max = 2;
    const exactDifference = BigInt(max) - BigInt(min);
    expect(BigInt(max - min)).not.to.equal(exactDifference);
    expect(() => Num.random.int(min, max, { source: () => 0 })).to.throw(
      RangeError,
      'integer range size must not exceed Number.MAX_SAFE_INTEGER',
    );
  });

  it('validates custom source output', () => {
    expect(() => Num.random.int(0, 1, { source: () => -0.1 })).to.throw(
      'random source result must be in [0, 1)',
    );
    expect(() => Num.random.int(0, 1, { source: () => 1 })).to.throw(
      'random source result must be in [0, 1)',
    );
    expect(() => Num.random.int(0, 1, { source: () => Number.NaN })).to.throw(
      'random source result must be a finite number',
    );
    expect(() => Num.random.int(0, 1, { source: () => Number.POSITIVE_INFINITY })).to.throw(
      'random source result must be a finite number',
    );
  });

  it('uses 53-bit rejection sampling for crypto integer ranges', () => {
    const result = withCryptoWords(
      [
        [0xffff_ffff, 0xffff_ffff],
        [0, 0],
      ],
      () => Num.random.int(0, 2, { source: 'crypto' }),
    );
    expect(result.calls).to.equal(2);
    expect(result.value).to.equal(0);
  });

  it('keeps crypto integer outputs safe and within inclusive bounds', () => {
    for (const _ of Array.from({ length: 100 })) {
      const value = Num.random.int(Num.MIN_INT, -1, { source: 'crypto' });
      expect(Number.isSafeInteger(value)).to.equal(true);
      expect(value).to.be.greaterThanOrEqual(Num.MIN_INT);
      expect(value).to.be.lessThanOrEqual(-1);
    }
  });
});
