import { describe, expect, it } from '../../-test.ts';
import { Obj } from '../mod.ts';

describe('Obj.asGetter', () => {
  it('wraps all own keys as getters by default', () => {
    const obj = { a: 1, b: 'two' };
    Obj.asGetter(obj);

    const descA = Object.getOwnPropertyDescriptor(obj, 'a');
    const descB = Object.getOwnPropertyDescriptor(obj, 'b');

    expect(descA && typeof descA.get).to.eql('function');
    expect(descA && descA.enumerable).to.eql(true);
    expect(descA && descA.configurable).to.eql(true);
    expect(obj.a).to.eql(1);

    expect(descB && typeof descB.get).to.eql('function');
    expect(descB && descB.enumerable).to.eql(true);
    expect(descB && descB.configurable).to.eql(true);
    expect(obj.b).to.eql('two');
  });

  it('wraps only the specified key when a single key is provided', () => {
    const obj = { a: 1, b: 2 };
    Obj.asGetter(obj, 'a');

    const descA = Object.getOwnPropertyDescriptor(obj, 'a');
    const descB = Object.getOwnPropertyDescriptor(obj, 'b');

    expect(descA && typeof descA.get).to.eql('function');
    expect(obj.a).to.eql(1);
    expect(descB && descB.get).to.eql(undefined);
    expect(obj.b).to.eql(2);
  });

  it('wraps only the specified keys when an array of keys is provided', () => {
    const obj = { a: 1, b: 2, c: 3 };
    Obj.asGetter(obj, ['a', 'c'] as const);

    const descA = Object.getOwnPropertyDescriptor(obj, 'a');
    const descB = Object.getOwnPropertyDescriptor(obj, 'b');
    const descC = Object.getOwnPropertyDescriptor(obj, 'c');

    expect(descA && typeof descA.get).to.eql('function');
    expect(obj.a).to.eql(1);

    expect(descC && typeof descC.get).to.eql('function');
    expect(obj.c).to.eql(3);

    expect(descB && descB.get).to.eql(undefined);
    expect(obj.b).to.eql(2);
  });

  it('accepts options as second argument when wrapping all keys', () => {
    const obj = { a: 1 };
    Obj.asGetter(obj, { configurable: false });

    const descA = Object.getOwnPropertyDescriptor(obj, 'a');

    expect(descA && typeof descA.get).to.eql('function');
    expect(descA && descA.enumerable).to.eql(true);
    expect(descA && descA.configurable).to.eql(false);
    expect(obj.a).to.eql(1);
  });

  it('accepts options as third argument when explicit keys are provided', () => {
    const obj = { a: 1, b: 2 };
    Obj.asGetter(obj, ['a'], { enumerable: false, configurable: false });

    const descA = Object.getOwnPropertyDescriptor(obj, 'a');
    const descB = Object.getOwnPropertyDescriptor(obj, 'b');

    expect(descA && typeof descA.get).to.eql('function');
    expect(descA && descA.enumerable).to.eql(false);
    expect(descA && descA.configurable).to.eql(false);
    expect(obj.a).to.eql(1);

    expect(descB && descB.get).to.eql(undefined);
    expect(obj.b).to.eql(2);
  });

  it('treats null keys as "all fields" when options are provided', () => {
    const obj = { a: 1, b: 2 };
    Obj.asGetter(obj, null, { configurable: false });

    const descA = Object.getOwnPropertyDescriptor(obj, 'a');
    const descB = Object.getOwnPropertyDescriptor(obj, 'b');

    expect(descA && typeof descA.get).to.eql('function');
    expect(descA && descA.configurable).to.eql(false);
    expect(obj.a).to.eql(1);

    expect(descB && typeof descB.get).to.eql('function');
    expect(descB && descB.configurable).to.eql(false);
    expect(obj.b).to.eql(2);
  });

  it('preserves reference identity of wrapped values', () => {
    const heavy = { deep: true };
    const obj = { heavy };
    Obj.asGetter(obj, 'heavy');

    expect(obj.heavy).to.equal(heavy);
  });

  it('is a no-op on objects without own keys', () => {
    const obj = Object.create(null) as { [key: string]: unknown };
    Obj.asGetter(obj);
    expect(Object.keys(obj)).to.eql([]);
  });

  it('bails out and returns the input for non-record values', () => {
    const values: readonly unknown[] = [
      undefined,
      null,
      0,
      1,
      NaN,
      '',
      'foo',
      true,
      false,
      Symbol('x'),
      10n,
      () => 123,
      [],
      new Date(),
    ];

    for (const value of values) {
      const input = value as unknown as Record<string, unknown>;
      const result = Obj.asGetter(input);

      if (typeof value === 'number' && Number.isNaN(value)) {
        expect(Number.isNaN(result as unknown as number)).to.eql(true);
      } else {
        expect(result).to.equal(input);
      }
    }
  });
});
