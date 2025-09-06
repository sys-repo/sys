import { type t, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { CurriedPath } from '../m.CurriedPath.ts';
import { Path } from '../mod.ts';

describe('Obj.Path.Curried', () => {
  it('API', () => {
    expect(Path.curry).to.equal(CurriedPath.create);
  });

  describe('create: path.curry(...)', () => {
    it('path: foo/bar', () => {
      const path = ['foo', 'bar'];
      const a = CurriedPath.create(path);
      const b = Path.curry(path);
      expect(a.path).to.eql(path);
      expect(a.path).to.eql(b.path);
    });

    it('path: <empty>', () => {
      const test = (input: any) => {
        const res = Path.curry(input);
        expect(res.path).to.eql([]);
      };
      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((v: any) => test(v));
    });
  });

  describe('path.curry(...).get', () => {
    it('type overloads', () => {
      const subject = { foo: 123 };
      const p = Path.curry<number>(['foo']);
      const a = p.get(subject);
      const b = p.get(subject, 0);
      expectTypeOf(a).toEqualTypeOf<number | undefined>();
      expectTypeOf(b).toEqualTypeOf<number>();
    });

    it('retrieves a top-level value', () => {
      const p = Path.curry<number>(['foo']);
      const subject = { foo: 123 };
      expect(p.get(subject)).to.eql(123);
    });

    it('retrieves a nested value', () => {
      const p = Path.curry<string>(['a', 'b', 'c']);
      const subject = { a: { b: { c: 'hello' } } };
      expect(p.get(subject)).to.eql('hello');
    });

    it('returns <undefined> when the path is missing', () => {
      const p = Path.curry<number>(['missing']);
      const subject = { other: 42 };
      expect(p.get(subject)).to.be.undefined;
    });

    it('returns <undefined> when an intermediate key is absent', () => {
      const p = Path.curry(['a', 'b']);
      const subject = { a: {} };
      expect(p.get(subject)).to.be.undefined;
    });

    it('returns the subject itself for an empty path', () => {
      const p = Path.curry([]);
      const subject = { anything: true };
      expect(p.get(subject)).to.eql(subject);
    });

    it('returns the default value when provided and path is missing', () => {
      const p = Path.curry(['doesNotExist']);
      const subject = { foo: 'bar' };
      const defaultValue = 'fallback';
      expect(p.get(subject, defaultValue)).to.eql(defaultValue);
    });

    it('returns the default value when subject is <null> or <undefined>', () => {
      const p = Path.curry(['any']);
      const defaultValue = 0;
      expect(p.get(null as any, defaultValue)).to.eql(defaultValue);
      expect(p.get(undefined as any, defaultValue)).to.eql(defaultValue);
    });

    it('subject is <undefined>', () => {
      const p = Path.curry(['a', 'b']);
      expect(p.get(undefined)).to.eql(undefined);
      expect(p.get(undefined, 'foo')).to.eql('foo');
    });
  });

  describe('Path.curry(...).exists', () => {
    const p = Path.curry(['foo']);

    it('returns true when the property is present (any value)', () => {
      const subject1 = { foo: 123 };
      const subject2 = { foo: undefined };

      expect(p.exists(subject1)).to.be.true; // ← value present.
      expect(p.exists(subject2)).to.be.true; // ← present but undefined.
    });

    it('returns false when the property is absent', () => {
      const subject = { bar: 1 };
      expect(p.exists(subject)).to.be.false;
    });

    it('returns false when the subject itself is undefined', () => {
      expect(p.exists(undefined)).to.be.false;
    });
  });

  describe('path.curry(...).set', () => {
    const p = Path.curry<number | undefined>(['foo']);

    it('sets a new value at the curried key', () => {
      const subject: Record<string, unknown> = {};
      const op = p.set(subject, 123);

      expect(subject.foo).to.eql(123);
      expect(op).to.eql<t.ObjDiffOp>({
        type: 'add',
        path: ['foo'],
        value: 123,
      });
    });

    it('overwrites an existing value', () => {
      const subject = { foo: 1 };
      const op = p.set(subject, 2);

      expect(subject.foo).to.eql(2);
      expect(op).to.eql<t.ObjDiffOp>({
        type: 'update',
        path: ['foo'],
        prev: 1,
        next: 2,
      });
    });

    it('returns <undefined> when value is unchanged', () => {
      const subject = { foo: 42 };
      const op = p.set(subject, 42);
      expect(op).to.be.undefined;
    });

    it('removes the property when value is <undefined>', () => {
      const subject = { foo: 99 };
      const op = p.set(subject, undefined);

      expect('foo' in subject).to.be.false;
      expect(op).to.eql<t.ObjDiffOp>({
        type: 'remove',
        path: ['foo'],
        prev: 99,
      });
    });
  });

  describe('path.curry(...).ensure', () => {
    const p = Path.curry<number>(['foo']);

    it('leaves an existing value untouched', () => {
      const subject = { foo: 10 };
      const result = p.ensure(subject, 999);

      expect(result).to.eql(10); //      ← returns existing.
      expect(subject.foo).to.eql(10); // ← no mutation.
    });

    it('sets and returns the default when value is missing', () => {
      const subject: Record<string, unknown> = {};
      const result = p.ensure(subject, 42);

      expect(result).to.eql(42); //      ← returns default.
      expect(subject.foo).to.eql(42); // ← property now exists.
    });
  });

  describe('path.curry(...).delete', () => {
    const p = Path.curry<number>(['foo']);

    it('removes an existing property and returns the remove-op', () => {
      const subject = { foo: 7 };

      const op = p.delete(subject);

      expect('foo' in subject).to.be.false;
      expect(op).to.eql<t.ObjDiffOp>({
        type: 'remove',
        path: ['foo'],
        prev: 7,
      });
    });

    it('returns <undefined> when the property is already absent', () => {
      const subject: Record<string, unknown> = {};

      const op = p.delete(subject);

      expect(op).to.be.undefined;
      expect(subject).to.eql({}); // no mutation
    });
  });

  describe('path.curry(...).join(...)', () => {
    it('joins a sub-path', () => {
      const a = Path.curry<number>(['foo']);
      expect(a.path).to.eql(['foo']);

      const b = a.join(['bar', 'zoo']);
      expect(b.path).to.eql(['foo', 'bar', 'zoo']);
    });

    it('empty sub-path', () => {
      const a = Path.curry<number>(['foo']);
      const b = a.join([]);
      expect(a.path).to.eql(b.path);
      expect(a).to.not.equal(b); // NB: different instance.
    });
  });
});
