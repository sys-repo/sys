import { type t, describe, expect, it } from '../../-test.ts';
import { Obj } from '../../m.Value.Obj/mod.ts';
import { del } from '../m.Mutate.delete.ts';

type O = Record<string, unknown>;

describe('Obj.Path.Mutate', () => {
  const Mutate = Obj.Path.Mutate;

  describe('Mutate.set', () => {
    it('throws an error when path is empty', () => {
      const target = {};
      const fn = () => Mutate.set(target as any, [], 1);
      expect(fn).to.throw(/The path-array must contain at least one segment/);
    });

    it('sets a value at a top-level key', () => {
      const target: Record<string, unknown> = {};
      const op = Mutate.set(target, ['key'], 'value');
      expect(target.key).to.eql('value');
      expect(op).to.eql<t.ObjDiffOp>({ type: 'add', path: ['key'], value: 'value' });
    });

    it('overwrites existing values', () => {
      const target = { a: 1 };
      const op = Mutate.set(target, ['a'], 2);
      expect(target.a).to.eql(2);
      expect(op).to.eql<t.ObjDiffOp>({ type: 'update', path: ['a'], prev: 1, next: 2 });
    });

    it('creates nested objects automatically', () => {
      const target = {};
      const op = Mutate.set(target, ['a', 'b', 'c'], 'deep');
      expect((target as any).a.b.c).to.eql('deep');
      expect(op).to.eql<t.ObjDiffOp>({ type: 'add', path: ['a', 'b', 'c'], value: 'deep' });
    });

    it('creates nested arrays automatically when path segment is number', () => {
      const target: Record<string, unknown> = {};
      const op = Mutate.set(target, ['arr', 0, 'foo'], 'bar');
      expect(target.arr).to.be.an('array').with.lengthOf(1);
      expect((target as any).arr[0].foo).to.eql('bar');
      expect(op).to.eql<t.ObjDiffOp>({
        type: 'add',
        path: ['arr', 0, 'foo'],
        value: 'bar',
      });
    });

    it('<undefined> → property removed via [delete] rather than set <undefined>', () => {
      type T = { a: { b?: number | string } };
      const target: T = { a: {} };
      const path = ['a', 'b'] as const satisfies t.ObjectPath;

      const addOp = Mutate.set(target, path, 123);
      expect(target.a?.b).to.eql(123);
      expect(Object.keys(target.a).length).to.eql(1);
      expect(addOp).to.eql<t.ObjDiffOp>({ type: 'add', path, value: 123 });

      const removeOp = Mutate.set(target, path, undefined);
      expect(Object.keys(target.a).length).to.eql(0); // NB: deleted.
      expect(target.a).to.eql({});
      expect(removeOp).to.eql<t.ObjDiffOp>({ type: 'remove', path, prev: 123 });
    });

    it('returns <undefined> when setting a value equal to the existing value', () => {
      const subject = { foo: 'bar' };
      const result = Mutate.set(subject, ['foo'], 'bar');
      expect(result).to.eql(undefined);
    });

    it('returns <undefined> when setting <undefined> for a key that does not exist', () => {
      const subject = {};
      const result = Mutate.set(subject, ['baz'], undefined);
      expect(result).to.eql(undefined);
    });
  });

  describe('Mutate.ensure', () => {
    it('assigns default at top-level when missing', () => {
      const target: Record<string, unknown> = {};
      const value = 'my-value';
      const result = Mutate.ensure(target, ['key'], value);
      expect(target.key).to.eql(value);
      expect(result).to.eql(value);
    });

    it('does not override existing value', () => {
      const value = 'foo';
      const target = { key: value };
      const path = ['key'];

      Mutate.ensure(target, path, 123);
      expect(target.key).to.eql(value);

      Mutate.ensure(target, path, null);
      expect(target.key).to.eql(value);

      Mutate.ensure(target, path, undefined as any);
      expect(target.key).to.eql(value);
    });

    it('ensures null value', () => {
      const target = { foo: { bar: {} } };
      Mutate.ensure(target, ['foo', 'bar', 'value'], null);
      expect((target.foo.bar as any).value).to.eql(null);
    });

    it('creates nested objects automatically', () => {
      const target = {};
      Mutate.ensure(target, ['a', 'b', 'c'], 123);
      expect((target as any).a.b.c).to.eql(123);
    });

    it('creates nested namespace', () => {
      const target = {};
      const ns = {};
      const result = Mutate.ensure(target, ['a', 'b', 'c'], ns);
      expect((target as any).a.b.c).to.equal(ns);
      expect(result).to.equal(ns);
    });

    it('creates nested arrays automatically when path segment is number', () => {
      const target: Record<string, unknown> = {};
      Mutate.ensure(target, ['arr', 0, 'foo'], 'bar');
      expect(target.arr).to.be.an('array').with.lengthOf(1);
      expect((target as any).arr[0].foo).to.eql('bar');
    });
  });

  describe('Mutate.diff', () => {
    it('adds, updates, and deletes top-level keys', () => {
      const target: O = { a: 1, b: 2, c: 3 };
      const source: O = { b: 2, c: 99, d: 4 };
      const report = Mutate.diff(source, target);

      expect(target).to.eql(source);
      expect(report.stats).to.eql({
        adds: 1,
        removes: 1,
        updates: 1,
        arrays: 0,
        total: 3,
      });

      // Spot-check op kinds.
      expect(report.ops.map((o) => o.type).sort()).to.eql(['add', 'remove', 'update']);
    });

    it('handles nested objects recursively', () => {
      const target: O = { user: { name: 'Ann', age: 21, misc: 'remove-me' } };
      const source: O = { user: { name: 'Ann', age: 22 } };

      const report = Mutate.diff(source, target);

      expect(target).to.eql(source);
      expect(report.stats).to.eql({
        adds: 0,
        removes: 1,
        updates: 1,
        arrays: 0,
        total: 2,
      });

      const paths = report.ops.map((o) => o.path.join('.'));
      expect(paths).to.include('user.age').and.to.include('user.misc');
    });

    it('replaces arrays when they differ', () => {
      const target: O = { list: [1, 2, 3] };
      const source: O = { list: [1, 2, 4] };

      const report = Mutate.diff(source, target);

      expect(target).to.eql(source); // Values equal.
      expect(target.list).to.not.equal(source.list); // Cloned ref.

      expect(report.stats).to.eql({
        adds: 0,
        removes: 0,
        updates: 0,
        arrays: 1,
        total: 1,
      });
      expect(report.ops[0].type).to.eql('array');
      expect(report.ops[0].path).to.eql(['list']);
    });

    it('makes no changes when target already equals source', () => {
      const target: O = { x: { y: 1 } };
      const source: O = { x: { y: 1 } };

      const report = Mutate.diff(source, target);

      expect(report.stats.total).to.eql(0);
      expect(report.ops.length).to.eql(0);
      expect(target).to.eql(source);
    });

    it('handles self-referential cycles without blowing the stack', () => {
      const target: any = { label: 'A' };
      target.self = target; // ← cycle in target.

      const source: any = { label: 'B' };
      source.self = source; // ← cycle in source.

      const report = Mutate.diff(source, target);
      expect(report.stats).to.eql({
        adds: 0,
        removes: 0,
        updates: 1, // ← label.
        arrays: 0,
        total: 1,
      });
      expect(target.label).to.eql('B'); //     ← target mutated.
      expect(target.self).to.equal(target); // ← cycle preserved.
    });

    describe('diffArrays: true', () => {
      it('diffs arrays element-by-element when one value changes', () => {
        const target: O = { list: [1, 2, 3] };
        const source: O = { list: [1, 99, 3] };

        const report = Mutate.diff(source, target, { diffArrays: true });

        expect(target).to.eql(source); // ← target mutated to equal source.
        expect(report.stats).to.eql({
          adds: 0,
          removes: 0,
          updates: 1, // ← index 1 changed.
          arrays: 0, //  ← no wholesale replace.
          total: 1,
        });
        expect(report.ops[0]).to.eql<t.ObjDiffOp>({
          type: 'update',
          path: ['list', 1],
          prev: 2,
          next: 99,
        });
      });

      it('handles length changes (adds & removes) in one pass', () => {
        const target: O = { nums: [10, 20, 30] };
        const source: O = { nums: [10, 40] }; // 20 → 40, remove 30.

        const report = Mutate.diff(source, target, { diffArrays: true });

        expect(target).to.eql(source);
        expect(report.stats).to.eql({
          adds: 0,
          removes: 1, // index 2 deleted.
          updates: 1, // index 1 updated.
          arrays: 0,
          total: 2,
        });

        // Order-agnostic check of the two ops.
        const kinds = report.ops.map((o) => o.type).sort();
        expect(kinds).to.eql(['remove', 'update']);
      });
    });
  });

  describe('Mutate.delete', () => {
    it('delete top-level key and return a remove op', () => {
      const subject: Record<string, unknown> = { foo: 'bar', baz: 42 };
      const op = del(subject, ['foo']);
      expect(op).to.eql({ type: 'remove', path: ['foo'], prev: 'bar' });
      expect((subject as any).foo).to.be.undefined;
      expect(subject.baz).to.eql(42);
    });

    it('delete nested key and return a remove op', () => {
      const subject: Record<string, unknown> = { a: { b: { c: true } } };
      const op = del(subject, ['a', 'b', 'c']);
      expect(op).to.eql({ type: 'remove', path: ['a', 'b', 'c'], prev: true });
      expect((subject.a as Record<string, any>).b).to.not.have.property('c');
    });

    it('return <undefined> when path does not exist', () => {
      const subject: Record<string, unknown> = { a: { b: 1 } };
      const before = Obj.clone(subject);
      const op = del(subject, ['a', 'x']);
      expect(op).to.be.undefined;
      expect(subject).to.eql(before);
    });

    it('return <undefined> when path is empty', () => {
      const subject: Record<string, unknown> = { foo: 'bar' };
      const before = Obj.clone(subject);
      const op = del(subject, [] as t.ObjectPath);
      expect(op).to.be.undefined;
      expect(subject).to.eql(before);
    });

    it('delete array index and return a remove op', () => {
      const subject: Record<string, unknown> = { arr: [10, 20, 30] };
      const op = del(subject, ['arr', 1]);
      expect(op).to.eql({ type: 'remove', path: ['arr', 1], prev: 20 });
      expect(Array.isArray(subject.arr)).to.be.true;

      // NB: Delete leaves a hole in the array rather than shifting.
      expect((subject.arr as any)[1]).to.be.undefined;
      expect((subject.arr as any).length).to.eql(3);
      expect(subject.arr).to.eql([10, undefined, 30]);
    });
  });
});
