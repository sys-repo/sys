import { describe, expect, it } from '../../-test.ts';
import { Obj } from '../mod.ts';

describe('Obj.hash', () => {
  const test = (input: any, expected?: number) => {
    const res = Obj.hash(input);
    if (expected != null) expect(res).to.eql(expected);
    if (expected == null) console.info(`Num.hash( ${input} ):`, res);
  };

  it('simple', () => {
    test('hello', 6927037667158);
    test('', 729279156);
    test(123, 8546431076729);
    test(true, 24057694676);
  });

  it('complex', () => {
    test({}, 15861867977416);
    test([], 8556010191289);
    test([123, true, 'foo', {}, []], 5391105062672);
    test(BigInt(0), 24057588158);
  });

  it('(nothing)', () => {
    test(null, 711079339769);
    test(undefined, 4721361581144);
  });
});
