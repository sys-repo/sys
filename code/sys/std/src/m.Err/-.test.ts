import { describe, expect, it, type t } from '../-test.ts';
import { DEFAULTS, Err } from './mod.ts';

describe('Err (Error)', () => {
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
      test(Err.stdError('foo'), true);

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

      test(Err.stdError('foo'), false);
      test(Err.stdError('foo', { errors: [] }), false);
      test(Err.stdError('foo', { errors: ['a'] }), true);
      test(Err.stdError('foo', { errors: ['a', 'b'] }), true);
    });
  });

  describe('Err.stdError (convert)', () => {
    const name = DEFAULTS.name.error;

    it('name', () => {
      const err1 = Err.stdError('durp');
      const err2 = Err.stdError('durp', { name: 'MyError' });
      expect(err1.name).to.eql(name);
      expect(err2.name).to.eql('MyError');
    });

    describe('simple value types (string, number etc)', () => {
      it('undefined', () => {
        const res = Err.stdError(undefined);
        expect(res).to.eql({ name, message: 'Unknown error (undefined)' });
      });

      it('null', () => {
        const res = Err.stdError(null);
        expect(res).to.eql({ name, message: 'Unknown error (null)' });
      });

      it('string', () => {
        const res = Err.stdError('foo');
        expect(res).to.eql({ name, message: 'foo' });
      });

      it('boolean', () => {
        const a = Err.stdError(false);
        const b = Err.stdError(true);
        expect(a).to.eql({ name, message: 'Unknown error (false)' });
        expect(b).to.eql({ name, message: 'Unknown error (true)' });
      });

      it('number', () => {
        const a = Err.stdError(0);
        const b = Err.stdError(123);
        expect(a).to.eql({ name, message: 'Unknown error (0)' });
        expect(b).to.eql({ name, message: 'Unknown error (123)' });
      });

      it('symbol', () => {
        const input = Symbol('foo');
        const res = Err.stdError(input);
        expect(res).to.eql({ name, message: 'Unknown error (Symbol(foo))' });
      });

      it('bigint', () => {
        const input = BigInt(123);
        const res = Err.stdError(input);
        expect(res).to.eql({ name, message: 'Unknown error (BigInt(123))' });
      });

      it('function', () => {
        const input = () => 'yo';
        const res = Err.stdError(input);
        expect(res).to.eql({ name, message: 'Unknown error (Function)' });
      });

      it('[array]', () => {
        const input = [1, 2, 3];
        const res = Err.stdError(input);
        expect(res).to.eql({ name, message: 'Unknown error (Array)' });
      });

      it('{object}', () => {
        const input = { foo: 123 };
        const res = Err.stdError(input);
        expect(res).to.eql({ name, message: 'Unknown error (Object)' });
      });
    });

    it('ErrorLike', () => {
      const err1 = { message: '' };
      const err2 = { message: 'fail' };

      const res1 = Err.stdError(err1);
      const res2 = Err.stdError(err2);
      expect(res1).to.eql({ name, message: 'Unknown error (ErrorLike)' });
      expect(res2).to.eql({ name, message: 'fail' });
    });

    it('StdError → StdError (pass through)', () => {
      const input = Err.stdError('MyError');
      expect(Err.stdError(input)).to.equal(input);
    });

    describe('cause', () => {
      it('applies cause to simple input values', () => {
        const INPUT = ['str', 123, true, null, undefined, BigInt(123), Symbol('foo'), [], {}];
        INPUT.forEach((input) => {
          const cause: t.StdError = { name: 'MyCause', message: 'Fail' };
          const err = Err.stdError(input, { cause });
          expect(err.cause).to.eql(cause);
        });
      });

      it('deep cause', () => {
        const cause = Err.stdError('root', { cause: 'deep' });
        const err = Err.stdError('fail', { cause });
        expect(err.cause?.message).to.eql('root');
        expect(err.cause?.cause?.message).to.eql('deep');
      });
    });

    describe('aggregate', () => {
      it('simple', () => {
        const child = Err.stdError('child');
        const err = Err.stdError('root', { errors: ['foo', child] });
        expect(child.errors).to.eql(undefined);

        expect(err.message).to.eql('root');
        expect(err.name).to.eql(DEFAULTS.name.aggregate);
        expect(err.errors?.length).to.eql(2);
      });

      it('aggregate of aggregates', () => {
        const a = Err.stdError('a', { errors: ['foo', 'bar'] });
        const b = Err.stdError('b', { errors: [a] });

        expect(Err.Is.aggregate(a)).to.eql(true);
        expect(Err.Is.aggregate(b)).to.eql(true);
        expect(b.errors?.[0].errors?.[1].message).to.eql('bar');
      });
    });

    describe('Error (standard JS)', () => {
      it('simple', () => {
        const native = new Error('Fail');
        const err = Err.stdError(native);
        expect(err).to.eql({ name, message: 'Fail' });
      });

      it('cause (deep)', () => {
        const cause = new Error('root', { cause: 'deep' });
        const error = new Error('fail', { cause });
        const err = Err.stdError(error);
        expect(err.cause?.message).to.eql('root');
        expect(err.cause?.cause?.message).to.eql('deep');
      });
    });
  });
});
