import { describe, it, expect, type t } from '../-test.ts';
import { Err } from './mod.ts';

describe('Err (Error)', () => {
  it('isErrorLike', () => {
    const test = (input: any, expected: boolean) => {
      expect(Err.isErrorLike(input)).to.eql(expected);
    };

    const NON = [true, 123, 'foo', {}, [], null, undefined, BigInt(0), Symbol('err')];
    NON.forEach((value) => test(value, false));

    test(new Error('foo'), true);
    test({ message: 'fail' }, true);

    try {
      throw new Error('try-fail');
    } catch (error) {
      test(error, true);
    }
  });
});
