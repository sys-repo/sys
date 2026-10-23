import { describe, expect, it } from '../../-test.ts';
import { Num } from '../../m.Num/mod.ts';
import { Obj } from '../mod.ts';

describe('Obj.hash', () => {
  it('returns a non-negative safe integer', () => {
    const values: unknown[] = [
      'hello',
      '',
      123,
      true,
      {},
      [],
      [123, true, 'foo', {}, []],
      0n,
      null,
      undefined,
    ];

    for (const value of values) {
      const result = Obj.hash(value);
      expect(Num.Is.safeInt(result)).to.eql(true);
      expect(result >= 0).to.eql(true);
    }
  });

  it('hashes equal value-based inputs identically', () => {
    const object = { alpha: 1, nested: [true, { value: 'x' }] };
    const reorderedObject = { nested: [true, { value: 'x' }], alpha: 1 };
    const map = new Map([['a', 1], ['b', 2]]);
    const reorderedMap = new Map([['b', 2], ['a', 1]]);
    const pairs: [unknown, unknown][] = [
      [object, object],
      [object, reorderedObject],
      [new Set(['a', 'b']), new Set(['b', 'a'])],
      [map, reorderedMap],
    ];

    for (const [first, second] of pairs) {
      expect(Obj.hash(first)).to.eql(Obj.hash(second));
    }
  });

  it('distinguishes representative value and type changes', () => {
    const pairs: [unknown, unknown][] = [
      ['hello', 'hello!'],
      [123, 124],
      [true, false],
      [{ value: 1 }, { value: 2 }],
      [[1, 2], [1, 2, 3]],
      [Symbol('foo'), 'Symbol(foo)'],
    ];

    for (const [first, second] of pairs) {
      expect(Obj.hash(first)).to.not.eql(Obj.hash(second));
    }
  });

  it('distinguishes structural boundaries', () => {
    const pairs: [unknown, unknown][] = [
      [['a,sb'], ['a', 'b']],
      [{ a: 'b,c:sd' }, { a: 'b', c: 'd' }],
      [{ 'a:n1,b': 2 }, { a: 1, b: 2 }],
    ];

    for (const [first, second] of pairs) {
      expect(Obj.hash(first)).to.not.eql(Obj.hash(second));
    }
  });

  it('supports equal circular values', () => {
    type Circular = { value: string; self?: Circular };

    const first: Circular = { value: 'same' };
    const second: Circular = { value: 'same' };
    first.self = first;
    second.self = second;

    expect(Obj.hash(first)).to.eql(Obj.hash(second));
    second.value = 'changed';
    expect(Obj.hash(first)).to.not.eql(Obj.hash(second));
  });
});
