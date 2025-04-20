import { describe, expect, it } from '../-test.ts';
import { Value } from '../m.Value/mod.ts';
import { Obj } from './mod.ts';

describe('Value.Obj', () => {
  it('API', () => {
    expect(Value.Obj).to.equal(Obj);
  });

  describe('Obj.walk', () => {
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

  describe('Obj.build', () => {
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

  describe('Obj.pluck', () => {
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

  describe('Obj.remove', () => {
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

  describe('Obj.prune', () => {
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

  describe('Obj.toArray', () => {
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

  describe('Obj.trimStringsDeep', () => {
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

  describe('Obj.pick', () => {
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

  describe('Obj.sortKeys', () => {
    it('empty', () => {
      const obj = {};
      const res = Value.Obj.sortKeys(obj);
      expect(res).to.not.equal(obj); // NB: new instance (immutable).
    });

    it('sorts keys', () => {
      const obj = { foo: 456, zoo: 'hello', apple: 123 };
      const res = Value.Obj.sortKeys(obj);
      expect(Object.keys(res)).to.not.eql(Object.keys(obj));
      expect(Object.keys(res).sort()).to.eql(Object.keys(obj).sort());
    });
  });

  describe('Obj.clone', () => {
    it('return different instance', () => {
      const obj = { foo: 123, bar: { msg: 'hello' } };
      const res = Obj.clone(obj);
      expect(res).to.eql(obj);
      expect(res).to.not.equal(obj); // NB: different instance.
      expect(res.bar).to.not.equal(obj.bar);
    });

    it('circular-reference safe', () => {
      type Cycle = { self?: Cycle; msg: string; list: (number | Cycle)[] };

      const obj: Cycle = { msg: '👋', list: [1] };
      obj.self = obj;
      obj.list.push(obj);
      obj.list.push(2);
      obj.list.push(obj.list[1]);

      const res = Obj.clone(obj);
      expect(res).to.eql(obj);
      expect(res).to.not.equal(obj);
      expect(res.list).to.not.equal(obj.list);
      expect(res.list[1]).to.not.equal(obj.list[1]);
    });

    it('should return the same value for primitives', () => {
      expect(Obj.clone(null)).to.equal(null);
      expect(Obj.clone(undefined)).to.equal(undefined);
      expect(Obj.clone(42)).to.equal(42);
      expect(Obj.clone('hello')).to.equal('hello');
      expect(Obj.clone(true)).to.equal(true);
    });

    it('should clone arrays properly', () => {
      const arr = [1, 2, { a: 3 }];
      const clonedArr = Obj.clone(arr);
      expect(clonedArr).to.eql(arr);
      expect(clonedArr).to.not.equal(arr);
      expect(clonedArr[2]).to.not.equal(arr[2]);
    });

    it('should clone plain objects deeply', () => {
      const obj = { a: 1, b: { c: 2 } };
      const clonedObj = Obj.clone(obj);
      expect(clonedObj).to.eql(obj);
      expect(clonedObj).to.not.equal(obj);
      expect(clonedObj.b).to.not.equal(obj.b);
    });

    it('should clone objects with symbol keys', () => {
      const sym = Symbol('key');
      const obj = { foo: 'bar', [sym]: 'baz' };
      const clonedObj = Obj.clone(obj);
      expect(clonedObj).to.eql(obj);
      expect(clonedObj).to.not.equal(obj);
    });

    it('should clone objects with non-enumerable properties', () => {
      const obj: any = { visible: 'yes' };
      Object.defineProperty(obj, 'hidden', {
        value: 'secret',
        enumerable: false,
        configurable: true,
        writable: true,
      });
      const clonedObj = Obj.clone(obj);
      expect(clonedObj.visible).to.equal('yes');
      const desc = Object.getOwnPropertyDescriptor(clonedObj, 'hidden');
      expect(desc).to.exist;
      expect(desc!.value).to.equal('secret');
    });

    it('should preserve custom prototypes', () => {
      class Custom {
        prop: number;
        constructor(prop: number) {
          this.prop = prop;
        }
      }
      const obj = new Custom(10);
      (obj as any).extra = 'test';
      const clonedObj = Obj.clone(obj);
      expect(clonedObj).to.eql(obj);
      expect(clonedObj).to.not.equal(obj);
      expect(Object.getPrototypeOf(clonedObj)).to.equal(Custom.prototype);
    });

    it('should not clone functions, but preserve the same function reference', () => {
      const fn = function () {
        return 'test';
      };
      const obj = { fn };
      const clonedObj = Obj.clone(obj);
      expect(clonedObj.fn).to.equal(fn);
    });

    it('should handle circular references in objects', () => {
      type Cycle = { self?: Cycle; msg: string; list: (number | Cycle)[] };
      const obj: Cycle = { msg: '👋', list: [1] };
      obj.self = obj;
      obj.list.push(obj);
      obj.list.push(2);
      obj.list.push(obj.list[1]); // Add an additional cycle: list[1] is the same as obj.

      const cloned = Obj.clone(obj);
      expect(cloned).to.eql(obj);
      expect(cloned).to.not.equal(obj);
      expect(cloned.list).to.not.equal(obj.list);

      // NB: The cloned object's self reference should point to the cloned object.
      expect(cloned.self).to.equal(cloned);

      // NB: Verify that cyclic references within the array are maintained.
      expect(cloned.list[1]).to.equal(cloned);
    });

    it('should handle circular references in arrays', () => {
      const arr: any[] = [1, 2];
      arr.push(arr);
      const clonedArr = Obj.clone(arr);
      expect(clonedArr).to.eql(arr);
      expect(clonedArr).to.not.equal(arr);

      // The cloned array's third element should reference the cloned array itself.
      expect(clonedArr[2]).to.equal(clonedArr);
    });

    it('should clone nested objects and arrays', () => {
      const obj = {
        a: { b: [1, { c: 'hello' }] },
        d: 'world',
      };
      const clonedObj = Obj.clone(obj);
      expect(clonedObj).to.eql(obj);
      expect(clonedObj.a).to.not.equal(obj.a);
      expect(clonedObj.a.b).to.not.equal(obj.a.b);
      expect(clonedObj.a.b[1]).to.not.equal(obj.a.b[1]);
    });

    it('should clone Date objects (note: date value may not be preserved)', () => {
      const date = new Date();
      (date as any).extra = 'data';
      const clonedDate = Obj.clone(date);
      expect(clonedDate).to.be.an.instanceof(Date);

      // NB: Extra properties are cloned.
      expect((clonedDate as any).extra).to.equal('data');
      expect(clonedDate.getTime()).to.equal(date.getTime());
    });

    it('should clone RegExp objects (note: pattern and flags may not be preserved)', () => {
      const regex = /abc/gi;
      (regex as any).extra = 'data';
      const clonedRegex = Obj.clone(regex);
      expect(clonedRegex).to.be.an.instanceof(RegExp);

      // NB: The source and flags should match if cloned correctly.
      expect(clonedRegex.source).to.equal(regex.source);
      expect(clonedRegex.flags).to.equal(regex.flags);
      expect((clonedRegex as any).extra).to.equal('data');
    });

    it('should preserve dynamic properties', () => {
      let _value = 0;
      const obj = {
        get count() {
          return _value;
        },
        set count(v) {
          _value = v;
        },
        child: { count: 0 },
      };
      obj.child = obj;

      expect(obj.count).to.eql(0);

      _value = 123;
      expect(obj.count).to.eql(123);
      obj.count = 456;
      expect(obj.count).to.eql(456); // NB: setter (write).

      const res = Obj.clone(obj);
      expect(res.count).to.eql(456); // NB: cloned value
      expect(res).to.not.equal(obj);
      expect(res.child).to.not.equal(obj.child);

      // Ensure setter and getter are preseved.
      _value = 888;
      expect(res.count).to.eql(888);
      res.count = 0;
      expect(_value).to.eql(0);

      // Deep clone.
      expect(res.child.count).to.eql(0);
      _value = 123;
      expect(res.child.count).to.eql(123);
    });
  });

  describe('Obj.extend', () => {
    it('deeply clones and preseves dynamic properties', () => {
      let _count = 0;
      let _msg = 'hello';
      const obj = {
        get count() {
          return _count;
        },
        set count(v) {
          _count = v;
        },
        get msg() {
          return _msg;
        },
        child: { count: 0 },
      };
      obj.child = obj;

      const res = Obj.extend(obj, {
        foo: 'hello',
        get bar() {
          return _msg + _count;
        },
      });

      expect(res).to.not.equal(obj);
      expect(res.child).to.not.equal(obj.child);
      expect(res.child).to.equal(res);

      _count = 123;
      _msg = '👋';
      expect(res.foo).to.eql('hello');
      expect(res.count).to.eql(123);
      expect(res.child.count).to.eql(123);
      expect(res.msg).to.eql('👋');
      expect(res.bar).to.eql('👋123');

      res.count = 42;
      expect(_count).to.eql(42);

      // NB: new extended properties not sneaking back onto source object.
      expect((obj as any).foo).to.be.undefined;

      const foo = Object.getOwnPropertyDescriptor(res, 'foo')!;
      expect(foo.enumerable).to.be.true;
      expect(foo.configurable).to.be.true;
      expect(foo.writable).to.be.true;

      const msg = Object.getOwnPropertyDescriptor(res, 'msg')!;
      expect(msg.enumerable).to.be.true;
      expect(msg.configurable).to.be.true;
      expect(msg.writable).to.be.undefined;
    });
  });
});
