import { describe, expect, it } from '../-test.ts';
import { ObjectPath } from './mod.ts';

describe('ObjectPath', () => {
  describe('ObjectPath.resolve', () => {
    type R = typeof root;
    const root = {
      msg: 'hello',
      child: { foo: { count: 123 }, bar: null },
      list: [1, { msg: 'two' }, ['a', 'b', null]],
    };

    it('resolver (<T> curried function)', () => {
      const string = ObjectPath.resolver<string>();
      const res = string(root, ['msg']);
      expect(res).to.eql('hello');
    });

    it('returns {root} ← param []', () => {
      const res = ObjectPath.resolve<R>(root, []);
      expect(res).to.eql(root);
    });

    it('returns match', () => {
      const res1 = ObjectPath.resolve<R>(root, ['msg']);
      const res2 = ObjectPath.resolve<R>(root, ['child']);
      const res3 = ObjectPath.resolve<R>(root, ['child', 'foo']);
      const res4 = ObjectPath.resolve<R>(root, ['child', 'foo', 'count']);
      const res5 = ObjectPath.resolve<R>(root, ['child', 'bar']);

      expect(res1).to.eql('hello');
      expect(res2).to.equal(root.child);
      expect(res3).to.equal(root.child.foo);
      expect(res4).to.eql(123);
      expect(res5).to.eql(null);
    });

    it('matches when root is an [array]', () => {
      expect(ObjectPath.resolve<R>([], [0])).to.equal(undefined);
      expect(ObjectPath.resolve<R>([root], [0, 'msg'])).to.equal('hello');
      expect(ObjectPath.resolve<R>([root, root], [1, 'list', 2, '0'])).to.equal('a');
    });

    it('interprets numbers as indexes', () => {
      expect(ObjectPath.resolve<R>(root, ['list', 0])).to.eql(1);
      expect(ObjectPath.resolve<R>(root, ['list', '0'])).to.eql(1);
      expect(ObjectPath.resolve<R>(root, ['list', '0 '])).to.eql(undefined); // NB: space in path
      expect(ObjectPath.resolve<R>(root, ['list', 1])).to.equal(root.list[1]);
      expect(ObjectPath.resolve<R>(root, ['list', 2, 1])).to.eql('b');
      expect(ObjectPath.resolve<R>(root, ['list', 2, 999])).to.eql(undefined);
      expect(ObjectPath.resolve<R>(root, ['list', 2, 2])).to.eql(null);
    });

    it('throws if root not an object', () => {
      [null, undefined, 123, true, ''].forEach((value) => {
        const fn = () => ObjectPath.resolve(value as any, []);
        expect(fn).to.throw(/root is not an object/);
      });
    });
  });

  describe('ObjectPath.prepend', () => {
    it('no change', () => {
      expect(ObjectPath.prepend([], [])).to.eql([]);
      expect(ObjectPath.prepend(['foo'], [])).to.eql(['foo']);
    });

    it('inserts prefix', () => {
      const res = ObjectPath.prepend(['foo', 'bar'], ['root']);
      expect(res).to.eql(['root', 'foo', 'bar']);
    });
  });

  describe('ObjectPath.exists', () => {
    type R = { msg?: string; child?: { foo?: { count?: number } }; list?: number[] };

    it('does not exist', () => {
      expect(ObjectPath.exists({}, ['msg'])).to.eql(false);
      expect(ObjectPath.exists({}, ['child', 'foo'])).to.eql(false);
      expect(ObjectPath.exists({}, ['child', 'foo', 'count'])).to.eql(false);
      expect(ObjectPath.exists({}, ['list'])).to.eql(false);
      expect(ObjectPath.exists({}, ['list', 5])).to.eql(false);
    });

    it('does exist', () => {
      const root1: R = { msg: 'hello' };
      const root2: R = { child: {} };
      const root3: R = { child: { foo: {} } };
      const root4: R = { list: [] };

      expect(ObjectPath.exists(root1, ['msg'])).to.eql(true);
      expect(ObjectPath.exists(root2, ['child'])).to.eql(true);
      expect(ObjectPath.exists(root3, ['child', 'foo'])).to.eql(true);
      expect(ObjectPath.exists(root4, ['list'])).to.eql(true);
      expect(ObjectPath.exists(root4, ['list', 5])).to.eql(true);
    });

    it('throws if path is empty', () => {
      [[], undefined, null].forEach((path: any) => {
        const root: R = {};
        const fn = () => ObjectPath.exists(root, path);
        expect(fn).to.throw(/path cannot be empty/);
      });
    });

    it('throws if root not an object', () => {
      [null, undefined, 123, true, ''].forEach((root) => {
        const fn = () => ObjectPath.exists(root, ['msg']);
        expect(fn).to.throw(/root is not an object/);
      });
    });
  });

  describe('ObjectPath.from', () => {
    const from = ObjectPath.from;

    it('from: [ObjectPath] ← no change', () => {
      const path = ['foo', 'bar'];
      expect(from(path)).to.equal(path);
      expect(from(['foo', 1, 'bar'])).to.eql(['foo', 1, 'bar']);
    });

    it('from: string', () => {
      expect(from('')).to.eql([]);
      expect(from('//')).to.eql([]);
      expect(from(' /foo/bar ')).to.eql(['foo', 'bar']);
    });

    it('from: { path:"string" }', () => {
      expect(from({ path: '//foo/bar ' })).to.eql(['foo', 'bar']);
    });

    it('from: { path:["foo", "bar"] }', () => {
      expect(from({ path: '//foo/bar ' })).to.eql(['foo', 'bar']);
    });

    it('invalid input → []', () => {
      const NON = [null, undefined, 123, {}, [], Symbol('foo'), BigInt(0)];
      NON.forEach((v: any) => expect(from(v)).to.eql([]));
    });

    it('array, but not a path → []', () => {
      expect(from(['foo', {}, 'bar'])).to.eql([]);
      expect(from({ path: ['foo', {}, 'bar'] })).to.eql([]);
    });
  });

  describe('ObjectPath.fromString', () => {
    const fromString = ObjectPath.fromString;

    it('empty string', () => {
      expect(fromString('')).to.eql([]);
      expect(fromString('  ')).to.eql([]);
    });

    it('root ("/")', () => {
      expect(fromString('/')).to.eql([]);
      expect(fromString('///')).to.eql([]);
      expect(fromString('  /  ')).to.eql([]);
      expect(fromString('  //  ')).to.eql([]);
    });

    it('no leading "/"', () => {
      expect(fromString('foo')).to.eql(['foo']);
      expect(fromString('foo/bar')).to.eql(['foo', 'bar']);
      expect(fromString('  foo/bar  ')).to.eql(['foo', 'bar']);
    });

    it('non-string input → []', () => {
      const NON = [null, undefined, 123, {}, [], Symbol('foo'), BigInt(0)];
      NON.forEach((v: any) => expect(fromString(v)).to.eql([]));
    });

    describe('escaping (~0, ~1)', () => {
      it('handles paths with ~1 and ~0 ', () => {
        const path = '/foo/~1bar/~0baz';
        expect(fromString(path)).to.eql(['foo', '/bar', '~baz']);
      });

      it('handles paths with multiple escaped characters ~1 and ~0', () => {
        const path = '/~0foo/~1bar/~0~1';
        expect(fromString(path)).to.eql(['~foo', '/bar', '~/']);
      });

      it('handles paths with only escaped characters', () => {
        const path = '/~1~0';
        expect(fromString(path)).to.eql(['/~']);
      });
    });
  });

  describe('ObjectPath.Mutate.value', () => {
    type R = { msg?: string; child?: { foo?: { count: number } } };

    it('set value shallow', () => {
      const root: R = {};
      ObjectPath.Mutate.value(root, ['msg'], 'hello');
      expect(root.msg).to.eql('hello');
    });

    it('set value deep', () => {
      const root: R = {};
      ObjectPath.Mutate.value(root, ['child', 'foo', 'count'], 123);
      expect(root.child?.foo?.count).to.eql(123);
    });

    it('does not replace existing objects', () => {
      const root: R = { child: { foo: { count: 0 } } };
      const refChild = root.child;
      const refFoo = root.child?.foo;

      ObjectPath.Mutate.value(root, ['child', 'foo', 'count'], 123);
      expect(root.child?.foo?.count).to.eql(123);
      expect(root.child).to.equal(refChild); // NB: same instance.
      expect(root.child?.foo).to.eql(refFoo);
    });

    it('deletes field when [undefined] passed', () => {
      /**
       * See also: ObjectPath.Mutate.delete(...)
       */
      const assertKey = (obj: R, key: string, exists: boolean) => {
        expect(Object.keys(obj).includes(key)).to.eql(exists, key);
      };

      const root: R = {};
      assertKey(root, 'msg', false);

      ObjectPath.Mutate.value(root, ['msg'], 'hello');
      assertKey(root, 'msg', true);

      ObjectPath.Mutate.value(root, ['msg'], undefined);
      assertKey(root, 'msg', false);

      ObjectPath.Mutate.value(root, ['msg'], null);
      assertKey(root, 'msg', true);
    });

    it('throws if path is empty', () => {
      [[], undefined, null].forEach((path: any) => {
        const root: R = {};
        const fn = () => ObjectPath.Mutate.value(root, path, 'foo');
        expect(fn).to.throw(/path cannot be empty/);
      });
    });

    it('throws if root not an object', () => {
      [null, undefined, 123, true, ''].forEach((root) => {
        const fn = () => ObjectPath.Mutate.value(root, ['msg'], 'foo');
        expect(fn).to.throw(/root is not an object/);
      });
    });
  });

  describe('ObjectPath.Mutate.ensure', () => {
    type R = { child?: { foo?: { count: number } } };

    it('already exists', () => {
      const obj: R = { child: { foo: { count: 123 } } };
      const res1 = ObjectPath.Mutate.ensure(obj, ['child', 'foo'], { count: 0 });
      const res2 = ObjectPath.Mutate.ensure(['hello', obj], [1, 'child', 'foo'], { count: 0 });
      expect(res1).to.equal(obj.child?.foo);
      expect(res2).to.equal(obj.child?.foo);
    });

    it('adds to object', () => {
      const obj: R = {};
      const res = ObjectPath.Mutate.ensure(obj, ['child', 'foo'], { count: 0 });
      expect(res).to.eql({ count: 0 });
      expect(obj.child?.foo).to.equal(res);
    });

    it('adds to array', () => {
      const obj: R = {};
      const res = ObjectPath.Mutate.ensure(['acc', obj], [1, 'child', 'foo'], { count: 0 });
      expect(res).to.eql({ count: 0 });
      expect(obj.child?.foo).to.equal(res);
    });
  });

  describe('ObjectPath.Mutate.delete', () => {
    type R = { msg?: string; child?: { foo?: { count: number } } };

    it('set value shallow', () => {
      const root: R = { msg: 'hello' };
      expect(root.msg).to.eql('hello');
      ObjectPath.Mutate.delete(root, ['msg']);
      expect(root.msg).to.eql(undefined);
      expect(Object.keys(root)).to.not.include('msg');
    });

    it('set value deep', () => {
      const root: R = { child: { foo: { count: 123 } } };
      expect(root.child?.foo?.count).to.eql(123);
      ObjectPath.Mutate.delete(root, ['child', 'foo', 'count']);
      expect(root.child?.foo?.count).to.eql(undefined);
      expect(Object.keys(root)).to.not.include('count');
    });

    it('throws if path is empty', () => {
      [[], undefined, null].forEach((path: any) => {
        const root: R = {};
        const fn = () => ObjectPath.Mutate.delete(root, path);
        expect(fn).to.throw(/path cannot be empty/);
      });
    });

    it('throws if root not an object', () => {
      [null, undefined, 123, true, ''].forEach((root) => {
        const fn = () => ObjectPath.Mutate.delete(root, ['msg']);
        expect(fn).to.throw(/root is not an object/);
      });
    });
  });

  describe('ObjectPath.Is', () => {
    const Is = ObjectPath.Is;
    it('is not an [ObjectPath]', () => {
      const NON = [123, {}, false, '', Symbol('foo'), BigInt(0), undefined, null, [[]], [{}]];
      NON.forEach((v) => expect(Is.path(v)).to.eql(false));
    });

    it('is an [ObjectPath]', () => {
      expect(Is.path([])).to.eql(true);
      expect(Is.path([''])).to.eql(true);
      expect(Is.path(['foo', 1, 'bar'])).to.eql(true);
    });
  });
});
