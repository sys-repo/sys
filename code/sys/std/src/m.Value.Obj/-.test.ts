import { describe, expect, it } from '../-test.ts';
import { Value } from '../m.Value/mod.ts';
import { Obj } from './mod.ts';

describe('Value.Obj', () => {
  it('API', () => {
    expect(Value.Obj).to.equal(Obj);
  });

  describe('Value.Obj.walk', () => {
    type T = { key: string | number; value: any; path: (string | number)[] };

    it('processes object', () => {
      const walked: T[] = [];
      const input = {
        name: 'foo',
        count: 123,
        child: { enabled: true, list: [1, 2] },
      };

      Value.Obj.walk(input, ({ key, value, path }) => walked.push({ key, value, path }));

      expect(walked).to.eql([
        { key: 'name', value: 'foo', path: ['name'] },
        { key: 'count', value: 123, path: ['count'] },
        { key: 'child', value: { enabled: true, list: [1, 2] }, path: ['child'] },
        { key: 'enabled', value: true, path: ['child', 'enabled'] },
        { key: 'list', value: [1, 2], path: ['child', 'list'] },
        { key: 0, value: 1, path: ['child', 'list', 0] },
        { key: 1, value: 2, path: ['child', 'list', 1] },
      ]);
    });

    it('passes parent in callback', () => {
      const root = { child: { enabled: true, list: [1, 2] } };
      const parents: any[] = [];
      Value.Obj.walk(root, (e) => parents.push(e.parent));
      expect(parents.length).to.eql(5);
      expect(parents[0]).to.eql(root);
      expect(parents[1]).to.eql(root.child);
      expect(parents[2]).to.eql(root.child);
      expect(parents[3]).to.eql(root.child.list);
      expect(parents[4]).to.eql(root.child.list);
    });

    it('processes array', () => {
      const walked: T[] = [];
      const input = ['foo', 123, { enabled: true, list: [1, 2] }];

      Value.Obj.walk(input, ({ key, value, path }) => walked.push({ key, value, path }));

      expect(walked).to.eql([
        { key: 0, value: 'foo', path: [0] },
        { key: 1, value: 123, path: [1] },
        { key: 2, value: { enabled: true, list: [1, 2] }, path: [2] },
        { key: 'enabled', value: true, path: [2, 'enabled'] },
        { key: 'list', value: [1, 2], path: [2, 'list'] },
        { key: 0, value: 1, path: [2, 'list', 0] },
        { key: 1, value: 2, path: [2, 'list', 1] },
      ]);
    });

    it('processes nothing (non-object / array)', () => {
      const test = (input: any) => {
        const walked: any[] = [];
        Value.Obj.walk(input, (e) => walked.push(e));
        expect(walked).to.eql([]); // NB: nothing walked.
      };
      [0, true, '', null, undefined].forEach((input) => test(input));
    });

    it('stops midway', () => {
      const walked: T[] = [];
      const input = {
        name: 'foo',
        child: { enabled: true, list: [1, 2] },
      };

      Value.Obj.walk(input, (e) => {
        const { key, value, path } = e;
        if (value === true) return e.stop();
        walked.push({ key, value, path });
      });

      expect(walked).to.eql([
        { key: 'name', value: 'foo', path: ['name'] },
        { key: 'child', value: { enabled: true, list: [1, 2] }, path: ['child'] },
      ]);
    });

    it('mutates key/value', () => {
      const root = { child: { enabled: true, list: [1, 2] } };
      Value.Obj.walk(root, (e) => {
        if (e.key === 'enabled') e.mutate(false);
        if (e.key === 0) e.mutate('hello');
      });
      expect(root.child.enabled).to.eql(false);
      expect(root.child.list[0]).to.eql('hello');
    });

    describe('circular reference', () => {
      it('walks without error: {object}', () => {
        const a = { b: null as any };
        const b = { a, child: [1, { msg: 'hello' }] };
        a.b = b; // Setup circular reference.

        let count = 0;
        Value.Obj.walk(a, (e) => count++);
        expect(count).to.eql(7); // NB: with no infinite loop.
      });

      it('walks without error: [array]', () => {
        const a: any[] = [0];
        const b: any[] = [a];
        b.push(b);
        a.push(b); // Setup circular references.

        let count = 0;
        Value.Obj.walk(a, (e) => count++);
        expect(count).to.eql(6); // NB: with no infinite loop.
      });

      it('multiple fields with same value (NB: not short-circuited by circular reference check)', () => {
        const test = (obj: any, expectKeys?: string[]) => {
          const keys: string[] = [];
          Value.Obj.walk(obj, (e) => keys.push(String(e.key)));
          if (expectKeys) expect(keys).to.eql(expectKeys);
          return keys;
        };

        const a: any = {};
        const b: any = {};
        a.b = b;
        b.a = a;
        const obj1 = { strings: { foo: 'hello', bar: 'hello' } }; // simple values.
        const obj2 = { foo: a, bar: a }; // NB: does process the {object} but does not recurse on the second one.

        test(obj1, ['strings', 'foo', 'bar']);
        test(obj2, ['foo', 'b', 'a', 'bar']);
      });
    });
  });

  describe('Value.Obj.build', () => {
    it('return default root object (no keyPath)', () => {
      expect(Value.Obj.build('', {})).to.eql({});
      expect(Value.Obj.build('  ', {})).to.eql({});
    });

    it('returns clone of the given root object', () => {
      const obj = {};
      expect(Value.Obj.build('', obj)).to.not.equal(obj);
    });

    it('adds single level', () => {
      expect(Value.Obj.build('foo', {})).to.eql({ foo: {} });
      expect(Value.Obj.build(' foo  ', {})).to.eql({ foo: {} });
    });

    it('adds multi-levels (path)', () => {
      const res = Value.Obj.build('foo.bar', {});
      expect(res).to.eql({ foo: { bar: {} } });
    });

    it('adds multi-levels with custom value', () => {
      const test = (value: any) => {
        const res = Value.Obj.build<any>('foo.bar.baz', {}, value);
        expect(res.foo.bar.baz).to.eql(value);
      };
      test(0);
      test(123);
      test('hello');
      test('');
      test(' ');
      test({});
    });

    it('does not replace existing object/value (cloned, single-level)', () => {
      const obj = { foo: { bar: 123 } };
      const res = Value.Obj.build<any>('foo', obj);
      expect(res).to.eql(obj);
      expect(res).to.not.equal(obj);
      expect(res.foo).to.not.equal(obj.foo);
    });

    it('throws if path overwrites value', () => {
      const test = (keyPath: string, obj: Record<string, unknown>) => {
        const fn = () => Value.Obj.build(keyPath, obj);
        expect(fn).to.throw();
      };
      test('foo.bar', { foo: { bar: 123 } });
      test('foo.bar', { foo: { bar: 0 } });
      test('foo.bar', { foo: { bar: null } });
      test('foo.bar', { foo: { bar: '' } });
    });

    it('throws if starts/ends with period (.)', () => {
      const test = (keyPath: string) => {
        const fn = () => Value.Obj.build(keyPath, {});
        expect(fn).to.throw();
      };
      test('foo.bar.');
      test('foo.bar. ');
      test('.foo.bar');
      test(' .foo.bar  ');
      test('.foo.bar.');
    });

    it('appends existing object', () => {
      const obj = { foo: { bar: 123 } };
      const res = Value.Obj.build('foo.baz', obj);
      expect(res).to.eql({ foo: { bar: 123, baz: {} } });
    });
  });

  describe('Value.Obj.pluck', () => {
    it('returns [undefined] when no match', () => {
      expect(Value.Obj.pluck('foo', {})).to.eql(undefined);
      expect(Value.Obj.pluck('foo.bar', {})).to.eql(undefined);
      expect(Value.Obj.pluck('foo.bar', { baz: 123 })).to.eql(undefined);
    });

    it('gets value', () => {
      const test = (keyPath: string, root: any, value: any) => {
        const res = Value.Obj.pluck(keyPath, root);
        expect(res).to.eql(value, `The key-path "${keyPath}" should be [${value}]`);
      };
      test('foo', { foo: 123 }, 123);
      test('foo.bar', { foo: { bar: 123 } }, 123);
      test(' foo.bar ', { foo: { bar: 123 } }, 123);
      test(' foo. bar ', { foo: { bar: 123 } }, 123);
    });

    it('throws if starts/ends with period (.)', () => {
      const test = (key: string) => {
        const fn = () => Value.Obj.pluck(key, {});
        expect(fn).to.throw();
      };
      test('foo.bar.');
      test('foo.bar. ');
      test('.foo.bar');
      test(' .foo.bar  ');
      test('.foo.bar.');
    });
  });

  describe('Value.Obj.remove', () => {
    const test = (keyPath: string, root: any, expected: any) => {
      const result = Value.Obj.remove(keyPath, root);
      const msg = `keyPath: "${keyPath}"`;
      expect(result).to.eql(expected, msg);
      expect(result).to.not.equal(root, msg);
    };

    it('removes nothing (no match)', () => {
      test('', {}, {});
      test('', { foo: 123 }, { foo: 123 });
      test('foo', {}, {});
      test('foo', { bar: 456 }, { bar: 456 });
      test('foo.bar', {}, {});
      test('foo.bar', { foo: 123 }, { foo: 123 });
      test('foo.bar.baz', { foo: 123 }, { foo: 123 });
    });

    it('removes shallow path', () => {
      test('foo', { foo: 123 }, {});
      test('foo', { foo: 123, bar: 'hi' }, { bar: 'hi' });
    });

    it('removes deep path', () => {
      test('foo.bar', { foo: { bar: 123 } }, { foo: {} });
      test('foo.bar.baz', { foo: { bar: { baz: 456 } } }, { foo: { bar: {} } });
      test('foo.bar', { foo: { bar: 123, baz: 456 } }, { foo: { baz: 456 } });
      test('foo.bar', { foo: { bar: 123 }, baz: 456 }, { baz: 456, foo: {} });
    });

    it('removes wildcard (*)', () => {
      test('foo.*', { foo: { bar: 123 } }, { foo: {} });
      test('foo.*', { foo: { bar: 123 }, baz: 456 }, { baz: 456, foo: {} });
      test('*', { foo: { bar: 123 }, baz: 456 }, {});
    });
  });

  describe('Value.Obj.prune', () => {
    const test = (keyPath: string, root: any, expected: any) => {
      const result = Value.Obj.prune(keyPath, root);
      const msg = `keyPath: "${keyPath}"`;
      expect(result).to.eql(expected, msg);
      expect(result).to.not.equal(root, msg);
    };

    it('prunes nothing (no match)', () => {
      test('', {}, {});
      test('', { foo: 123 }, { foo: 123 });
      test('foo', {}, {});
      test('foo', { bar: 456 }, { bar: 456 });
      test('foo.bar', {}, {});
      test('foo.bar', { foo: 123 }, { foo: 123 });
      test('foo.bar.baz', { foo: 123 }, { foo: 123 });
    });

    it('prunes nothing (child not empty)', () => {
      test('foo', { foo: { bar: {} } }, { foo: { bar: {} } });
    });

    it('throws if wild card not at end of path', () => {
      const fn = () => Value.Obj.prune('*.bar', {});
      expect(fn).to.throw();
    });

    it('prunes wildcard (*)', () => {
      test('foo.*', { foo: { bar: {}, baz: 123 } }, {});
      test('foo.*', { foo: 123 }, {});
      test('foo.*', {}, {});
      test('*', {}, {});
      test('*', { foo: 123, bar: {} }, {});
    });

    it('prunes shallow path', () => {
      test('foo', { foo: 123 }, {});
      test('foo', { foo: 123, bar: 'hi' }, { bar: 'hi' });
    });

    it('prunes deep path', () => {
      test('foo.bar', { foo: { bar: 123 } }, {});
      test('foo.bar.baz', { foo: { bar: { baz: 456 } } }, {});
      test('foo.bar', { foo: { bar: 123, baz: 456 } }, { foo: { baz: 456 } });
      test('foo.bar', { foo: { bar: 123 }, baz: 456 }, { baz: 456 });
    });
  });

  describe('Value.Obj.toArray', () => {
    type IFoo = { count: number };
    type IFoos = {
      one: IFoo;
      two: IFoo;
    };
    const foos: IFoos = { one: { count: 1 }, two: { count: 2 } };

    it('empty', () => {
      expect(Value.Obj.toArray({})).to.eql([]);
    });

    it('converts to array (untyped)', () => {
      const res = Value.Obj.toArray(foos);
      expect(res.length).to.eql(2);
    });

    it('converts to array (typed object)', () => {
      const res = Value.Obj.toArray<IFoos>(foos);
      expect(res.length).to.eql(2);

      expect(res[0].key).to.eql('one');
      expect(res[1].key).to.eql('two');

      expect(res[0].value).to.eql({ count: 1 });
      expect(res[1].value).to.eql({ count: 2 });
    });

    it('converts to array (typed key)', () => {
      type K = 'foo' | 'bar';
      const res = Value.Obj.toArray<IFoos, K>(foos);
      expect(res.length).to.eql(2);
    });
  });

  describe('Value.Obj.trimStringsDeep', () => {
    it('shallow', () => {
      const name = 'foo'.repeat(100);
      const obj = {
        name,
        count: 123,
        obj: {},
        list: [],
        bool: true,
        undef: undefined,
        nil: null,
      };

      const res1 = Value.Obj.trimStringsDeep(obj);
      const res2 = Value.Obj.trimStringsDeep(obj, { immutable: false });

      const expected = {
        ...obj,
        name: `${name.substring(0, 35)}...`, // NB: default max-length
      };

      expect(res1).to.eql(expected);
      expect(res2).to.eql(expected);

      expect(res1).to.not.equal(obj); // NB: default: immutable clone.
      expect(res2).to.equal(obj);
    });

    it('deep', () => {
      const name = 'foo'.repeat(50);
      const obj = {
        name,
        child: {
          child: {
            name,
            count: 123,
            obj: {},
            list: [],
            bool: true,
            undef: undefined,
            nil: null,
          },
        },
      };

      const res = Value.Obj.trimStringsDeep(obj);

      expect(res).to.eql({
        name: `${name.substring(0, 35)}...`,
        child: {
          child: {
            ...obj.child.child,
            name: `${name.substring(0, 35)}...`,
          },
        },
      });
    });

    it('options: no ellipsis, maxLength', () => {
      const name = 'foo'.repeat(100);
      const obj = { name };

      const res1 = Value.Obj.trimStringsDeep(obj, {});
      const res2 = Value.Obj.trimStringsDeep(obj, {
        ellipsis: false,
        maxLength: 10,
      });

      expect(res1.name).to.eql(`${name.substring(0, 35)}...`); // NB: default
      expect(res2.name).to.eql(name.substring(0, 10));
    });
  });

  describe('Value.Obj.pick', () => {
    type T = { a: number; b: number; c: number };
    const Sample = {
      create(): T {
        return { a: 1, b: 2, c: 3 };
      },
    } as const;

    it('no fields', () => {
      const obj = Sample.create();
      const res = Value.Obj.pick(obj);
      expect(res).to.eql({});
    });

    it('subset of fields', () => {
      type P = Pick<T, 'a' | 'c'>;
      const obj = Sample.create();
      const res = Value.Obj.pick<P>(obj, 'a', 'c');
      expect(res).to.eql({ a: 1, c: 3 });
    });

    it('all fields (difference instance)', () => {
      const obj = Sample.create();
      const res = Value.Obj.pick<T>(obj, 'a', 'b', 'c');
      expect(res).to.eql(obj);
      expect(res).to.not.equal(obj);
    });

    it('takes a wider scoped object as input', () => {
      type W = T & { msg: string };
      const obj: W = { a: 1, b: 2, c: 3, msg: 'hello' };

      type P = Pick<T, 'b' | 'c'>;
      const res = Value.Obj.pick<P>(obj, 'b', 'c');
      expect(res).to.eql({ b: 2, c: 3 });
    });
  });
});
