import { describe, expect, it, type t } from '../-test.ts';
import { Err } from './mod.ts';

describe('Err.Is', () => {
  it('Is.errorLike', () => {
    const test = (input: any, expected: boolean) => {
      expect(Err.Is.errorLike(input)).to.eql(expected);
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

  it('Is.stdError', () => {
    const test = (input: any, expected: boolean) => {
      expect(Err.Is.stdError(input)).to.eql(expected);
    };

    const NON = [true, 123, 'foo', {}, [], null, undefined, BigInt(0), Symbol('err')];
    NON.forEach((value) => test(value, false));

    test(new Error('foo'), false);
    test({ name: 'Foo', message: 'Fail' }, true);
    test(Err.std('foo'), true);

    const name = 'Error';
    const deep: t.StdError = {
      name,
      message: 'fail',
      cause: { name, message: 'root-cause', cause: { name, message: 'child-cause' } },
    };
    test(deep, true);

    const deepInvalid: t.StdError = {
      name,
      message: 'fail',
      cause: {
        name,
        message: 'root',
        cause: {
          name,
          message: 'child-1',
          cause: { name, message: 'child-2', cause: 123 as any },
        },
      },
    };

    test({ name: 'Error', message: 'Fail', cause: 555 }, false); // Invalid cause.
    test(deepInvalid, false);
  });

  it('Is.aggregate', () => {
    const test = (input: any, expected: boolean) => {
      expect(Err.Is.aggregate(input)).to.eql(expected);
    };

    const NON = [true, 123, 'foo', {}, [], null, undefined, BigInt(0), Symbol('err')];
    NON.forEach((value) => test(value, false));

    test(Err.std('foo'), false);
    test(Err.std('foo', { errors: [] }), false);
    test(Err.std('foo', { errors: ['a'] }), true);
    test(Err.std('foo', { errors: ['a', 'b'] }), true);
  });
});
