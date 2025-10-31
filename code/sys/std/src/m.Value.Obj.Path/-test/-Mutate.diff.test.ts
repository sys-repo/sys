import { type t, describe, expect, it } from '../../-test.ts';
import { Obj } from '../../m.Value.Obj/mod.ts';
import { del } from '../m.Mutate.delete.ts';

type O = Record<string, unknown>;

describe('Obj.Mutate.diff', () => {
  const Mutate = Obj.Path.Mutate;

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

  it('no-ops for empty plain objects', () => {
    const target: O = {};
    const source: O = {};
    const report = Mutate.diff(source, target);
    expect(report.stats.total).to.eql(0);
    expect(report.ops).to.eql([]);
    expect(target).to.eql(source);
  });

  it('no-ops for empty arrays (both empty)', () => {
    const target: O = { a: [] };
    const source: O = { a: [] };
    const report = Mutate.diff(source, target);
    expect(report.stats.total).to.eql(0);
    expect(report.ops).to.eql([]);
    expect(target).to.eql(source);
  });

  it('identical arrays in non-diff mode produce no ops', () => {
    const target: O = { xs: [1, 2, 3] };
    const source: O = { xs: [1, 2, 3] };
    const report = Mutate.diff(source, target);
    expect(report.stats.total).to.eql(0);
    expect(report.ops).to.eql([]);
    expect(target).to.eql(source);
  });

  it('treats +0 vs -0 as different (update), and NaN vs NaN as equal (no-op)', () => {
    // +0 vs -0 → update
    {
      const target: O = { v: +0 };
      const source: O = { v: -0 };
      const r = Mutate.diff(source, target);
      expect(r.stats).to.eql({ adds: 0, removes: 0, updates: 1, arrays: 0, total: 1 });
      expect((r.ops[0] as t.ObjDiffOp & { next: number }).next).to.equal(-0);
      expect(Object.is(target.v, -0)).to.eql(true);
    }
    // NaN vs NaN → Object.is true → no-op
    {
      const target: O = { v: Number.NaN };
      const source: O = { v: Number.NaN };
      const r = Mutate.diff(source, target);
      expect(r.stats.total).to.eql(0);
      expect(Object.is(target.v as number, Number.NaN)).to.eql(true);
    }
  });

  it('object-to-primitive leaf becomes a single update', () => {
    const target: O = { node: { x: 1 } };
    const source: O = { node: 42 };
    const report = Mutate.diff(source, target);
    expect(report.stats).to.eql({ adds: 0, removes: 0, updates: 1, arrays: 0, total: 1 });
    expect(report.ops[0]).to.eql({
      type: 'update',
      path: ['node'],
      prev: { x: 1 },
      next: 42,
    });
    expect(target).to.eql(source);
  });

  it('deep add and remove under same parent in one pass', () => {
    const target: O = { cfg: { keep: 1, drop: true } };
    const source: O = { cfg: { keep: 1, add: 'x' } };
    const report = Mutate.diff(source, target);
    expect(target).to.eql(source);

    // Two ops: remove cfg.drop, add cfg.add
    const kinds = report.ops.map((o) => o.type).sort();
    expect(kinds).to.eql(['add', 'remove']);
    const paths = report.ops.map((o) => o.path.join('.')).sort();
    expect(paths).to.eql(['cfg.add', 'cfg.drop']);
  });

  it('handles cross-referential cycles', () => {
    const ta: any = { name: 'A' };
    const tb: any = { name: 'B' };
    ta.peer = tb;
    tb.peer = ta; // cycle across objects in target

    const sa: any = { name: 'A*' };
    const sb: any = { name: 'B*' };
    sa.peer = sb;
    sb.peer = sa; // cycle across objects in source

    const target: any = { a: ta, b: tb };
    const source: any = { a: sa, b: sb };

    const report = Mutate.diff(source, target);
    expect(report.stats.updates).to.be.greaterThan(0);
    expect(target.a.peer).to.equal(target.b);
    expect(target.b.peer).to.equal(target.a);
    expect(target.a.name).to.eql('A*');
    expect(target.b.name).to.eql('B*');
  });
});
