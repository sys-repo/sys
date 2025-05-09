import { describe, expect, it, type t } from '../-test.ts';
import { Err } from './mod.ts';

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

  describe('Err.stdError (convert)', () => {
    const name = Err.Name.error;

    it('name', () => {
      const err1 = Err.std('durp');
      const err2 = Err.std('durp', { name: 'MyError' });
      const err3 = Err.std('durp', Err.Name.reference);
      expect(err1.name).to.eql(name);
      expect(err2.name).to.eql('MyError');
      expect(err3.name).to.eql('ReferenceError');
    });

    describe('simple value types (string, number etc)', () => {
      it('undefined', () => {
        const res = Err.std(undefined);
        expect(res).to.eql({ name, message: 'Unknown error (undefined)' });
      });

      it('null', () => {
        const res = Err.std(null);
        expect(res).to.eql({ name, message: 'Unknown error (null)' });
      });

      it('string', () => {
        const res = Err.std('foo');
        expect(res).to.eql({ name, message: 'foo' });
      });

      it('boolean', () => {
        const a = Err.std(false);
        const b = Err.std(true);
        expect(a).to.eql({ name, message: 'Unknown error (false)' });
        expect(b).to.eql({ name, message: 'Unknown error (true)' });
      });

      it('number', () => {
        const a = Err.std(0);
        const b = Err.std(123);
        expect(a).to.eql({ name, message: 'Unknown error (0)' });
        expect(b).to.eql({ name, message: 'Unknown error (123)' });
      });

      it('symbol', () => {
        const input = Symbol('foo');
        const res = Err.std(input);
        expect(res).to.eql({ name, message: 'Unknown error (Symbol(foo))' });
      });

      it('bigint', () => {
        const input = BigInt(123);
        const res = Err.std(input);
        expect(res).to.eql({ name, message: 'Unknown error (BigInt(123))' });
      });

      it('function', () => {
        const input = () => 'yo';
        const res = Err.std(input);
        expect(res).to.eql({ name, message: 'Unknown error (Function)' });
      });

      it('[array]', () => {
        const input = [1, 2, 3];
        const res = Err.std(input);
        expect(res).to.eql({ name, message: 'Unknown error (Array)' });
      });

      it('{object}', () => {
        const input = { foo: 123 };
        const res = Err.std(input);
        expect(res).to.eql({ name, message: 'Unknown error (Object)' });
      });
    });

    it('ErrorLike', () => {
      const err1 = { message: '' };
      const err2 = { message: 'fail' };

      const res1 = Err.std(err1);
      const res2 = Err.std(err2);
      expect(res1).to.eql({ name, message: 'Unknown error (ErrorLike)' });
      expect(res2).to.eql({ name, message: 'fail' });
    });

    it('StdError → StdError (pass through)', () => {
      const input = Err.std('MyError');
      expect(Err.std(input)).to.equal(input);
    });

    describe('HTTP Response', () => {
      it('404', () => {
        const res = new Response(null, { status: 404, statusText: 'Not Found' });
        const err = Err.std(res);
        expect(err.name).to.eql('HttpError');
        expect(err.message).to.eql('404 Not Found');
      });
    });

    describe('cause', () => {
      it('applies cause to simple input values', () => {
        const INPUT = ['str', 123, true, null, undefined, BigInt(123), Symbol('foo'), [], {}];
        INPUT.forEach((input) => {
          const cause: t.StdError = { name: 'MyThing', message: 'Fail' };
          const err = Err.std(input, { cause });
          expect(err.cause).to.eql(cause);
        });
      });

      it('deep cause', () => {
        const cause = Err.std('root', { cause: 'deep' });
        const err = Err.std('fail', { cause });
        expect(err.cause?.message).to.eql('root');
        expect(err.cause?.cause?.message).to.eql('deep');
      });
    });

    describe('aggregate', () => {
      it('simple', () => {
        const child = Err.std('child');
        const err = Err.std('root', { errors: ['foo', child] });
        expect(child.errors).to.eql(undefined);

        expect(err.message).to.eql('root');
        expect(err.name).to.eql(Err.Name.aggregate);
        expect(err.errors?.length).to.eql(2);
      });

      it('aggregate of aggregates', () => {
        const a = Err.std('a', { errors: ['foo', 'bar'] });
        const b = Err.std('b', { errors: [a] });

        expect(Err.Is.aggregate(a)).to.eql(true);
        expect(Err.Is.aggregate(b)).to.eql(true);
        expect(b.errors?.[0].errors?.[1].message).to.eql('bar');
      });
    });

    describe('Error (standard JS)', () => {
      it('simple', () => {
        const native = new Error('Fail');
        const err = Err.std(native);
        expect(err).to.eql({ name, message: 'Fail' });
      });

      it('cause (deep)', () => {
        const cause = new Error('root', { cause: 'deep' });
        const error = new Error('fail', { cause });
        const err = Err.std(error);
        expect(err.cause?.message).to.eql('root');
        expect(err.cause?.cause?.message).to.eql('deep');
      });

      it('StdError from StdError (variants)', () => {
        const cause = Err.std('boo');
        const errors = [Err.std('a'), Err.std('b')];
        const name = 'MyName';
        const a = Err.std('foo', { cause, errors });
        const b = Err.std(Err.std('foo'), { cause, name });
        const c = Err.std(Err.std('foo', { cause: 'a', name }), { cause }); // NB: replace cause.
        const d = Err.std(Err.std('foo', { errors: ['x', 'y'], name }), { errors }); // NB: replace inner errors.
        const e = Err.std(Err.std('foo', { name }), { name: 'MyFoo' }); // NB: replace cause.

        expect(a.message).to.eql('foo');
        expect(a.cause?.message).to.eql('boo');
        expect(a.errors).to.eql(errors);

        expect(b.message).to.eql('foo');
        expect(b.name).to.eql('MyName');
        expect(b.errors).to.eql(undefined);
        expect(b.cause?.message).to.eql('boo');

        expect(c.message).to.eql('foo');
        expect(c.name).to.eql('MyName');
        expect(c.errors).to.eql(undefined);
        expect(c.cause?.message).to.eql('boo'); // NB: not "a"

        expect(d.message).to.eql('foo');
        expect(d.name).to.eql('MyName');
        expect(d.cause).to.eql(undefined);
        expect(d.errors?.[0].message).to.eql('a');
        expect(d.errors?.[1].message).to.eql('b');

        expect(e.message).to.eql('foo');
        expect(e.name).to.eql('MyFoo');
      });
    });
  });

  describe('Err.errors (ErrorsBuilder)', () => {
    it(`generates distinct instances`, () => {
      const a = Err.errors();
      const b = Err.errors();
      expect(a).to.not.equal(b);
    });

    it('empty by default', () => {
      const err = Err.errors();
      expect(err.ok).to.eql(true);
      expect(err.length).to.eql(0);
      expect(err.items.length).to.eql(0);
      expect(err.is.empty).to.eql(true);
    });

    it('add errors', () => {
      const err = Err.std('std-foo');
      const errors = Err.errors();
      errors.push(err);
      errors.push(err); // NB: does not add the same instance twice
      errors.push('foo').push('foo'); // NB: this will resovle to a new {StdError} and hence increment.
      expect(errors.ok).to.eql(false); // NB: greater-than no errors.
      expect(errors.length).to.eql(3);
      expect(errors.items.length).to.eql(3);
    });

    it('add an array of errors', () => {
      const err = Err.std('my-std-err');
      const errors = Err.errors();
      errors.push([err, 'foo', err, err, 'bar']);
      expect(errors.length).to.eql(3);
      expect(errors.items[0].message).to.eql('my-std-err');
      expect(errors.items[1].message).to.eql('foo');
      expect(errors.items[2].message).to.eql('bar');
    });

    it('add with two params (error and cause)', () => {
      const errors = Err.errors();

      errors.push('foo', 'bar');
      errors.push(Err.std('hello'), Err.std('fail'));
      const list = errors.items;

      expect(list[0].message).to.eql('foo');
      expect(list[0].cause?.message).to.eql('bar');

      expect(list[1].message).to.eql('hello');
      expect(list[1].cause?.message).to.eql('fail');
    });

    it('toError: nothing', () => {
      const errors = Err.errors();
      expect(errors.toError()).to.eql(undefined);
    });

    it('toError: single error', () => {
      const errors = Err.errors().push('foo');
      expect(errors.toError()?.message).to.eql('foo');
    });

    it('toError: multiple errors (Aggregate)', () => {
      const errors = Err.errors().push('foo').push('bar').push('zoo');
      const a = errors.toError();
      const b = errors.toError('my message');
      expect(a?.name).to.eql(Err.Name.aggregate);
      expect(a?.message).to.eql('Several errors occured.');
      expect(b?.message).to.eql('my message');
      expect(a?.errors).to.eql(b?.errors);
      expect(a?.errors?.length).to.eql(3);
      expect(a?.errors?.[2].message).to.eql('zoo');
    });
  });
});
