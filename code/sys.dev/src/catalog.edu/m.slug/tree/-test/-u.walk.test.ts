import { type t, describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { Tree } from '../mod.ts';

describe('Slug.Tree.walk', () => {
  it('API surface', () => {
    expect(Tree.walk).to.be.a('function');
  });

  it('visits depth-first over a top-level array', () => {
    const root: t.SlugTreeProps = [
      { slug: 'A', slugs: [{ slug: 'A1', ref: 'crdt:create' }, { slug: 'A2' }] },
      { slug: 'B', ref: 'crdt:create' },
    ];

    const seen: string[] = [];
    Tree.walk(root, (e) => {
      // type shape of event
      expectTypeOf(e.path).toEqualTypeOf<t.ObjectPath>();
      expectTypeOf(e.key).toEqualTypeOf<number>();
      expectTypeOf(e.value).toEqualTypeOf<t.SlugTreeItem>();
      expectTypeOf(e.surface).toEqualTypeOf<t.SlugSurface>();

      seen.push(e.value.slug);
    });

    // depth-first, index order
    expect(seen).to.eql(['A', 'A1', 'A2', 'B']);
  });

  it('emits proper parent context (root vs array)', () => {
    const root: t.SlugTreeProps = [
      { slug: 'A', slugs: [{ slug: 'A1', ref: 'crdt:create' }] },
      { slug: 'B' },
    ];

    const parents: Record<string, t.SlugTreeWalkParent['kind']> = {};
    const owners: Record<string, string | undefined> = {}; // child -> parentNode.slug when kind==='array'

    Tree.walk(root, (e) => {
      parents[e.value.slug] = e.parent.kind;
      if (e.parent.kind === 'array') owners[e.value.slug] = e.parent.parentNode.slug;
    });

    expect(parents).to.eql({ A: 'root', A1: 'array', B: 'root' });
    expect(owners).to.eql({ A1: 'A' });
  });

  it('key and path reflect position', () => {
    const root: t.SlugTreeProps = [
      { slug: 'X' },
      { slug: 'Y', slugs: [{ slug: 'Y1' }, { slug: 'Y2', slugs: [{ slug: 'Y2a' }] }] },
    ];

    const record: Array<{ slug: string; key: number; path: t.ObjectPath }> = [];
    Tree.walk(root, (e) => {
      record.push({ slug: e.value.slug, key: e.key, path: e.path });
    });

    // keys for top-level items are their indices; child keys are child indices
    const bySlug = Object.fromEntries(record.map((r) => [r.slug, r]));
    expect(bySlug['X'].key).to.eql(0);
    expect(bySlug['X'].path).to.eql([0]);

    expect(bySlug['Y'].key).to.eql(1);
    expect(bySlug['Y'].path).to.eql([1]);

    expect(bySlug['Y1'].key).to.eql(0);
    expect(bySlug['Y1'].path).to.eql([1, 'slugs', 0]);

    expect(bySlug['Y2'].key).to.eql(1);
    expect(bySlug['Y2'].path).to.eql([1, 'slugs', 1]);

    expect(bySlug['Y2a'].key).to.eql(0);
    expect(bySlug['Y2a'].path).to.eql([1, 'slugs', 1, 'slugs', 0]);
  });

  it('surface projection matches fromNode (ref-only vs inline)', () => {
    const root: t.SlugTreeProps = [
      { slug: 'R', ref: 'crdt:create' },
      {
        slug: 'I',
        description: 'desc',
        traits: [{ of: 'video-player', as: 'vid' }],
        data: { vid: { src: 'ok' } },
      },
    ];

    const got: Record<string, t.SlugSurface> = {};
    Tree.walk(root, (e) => (got[e.value.slug] = e.surface));

    expect(got.R).to.eql({ ref: 'crdt:create' });
    expect(got.I).to.eql({
      description: 'desc',
      traits: [{ of: 'video-player', as: 'vid' }],
      data: { vid: { src: 'ok' } },
    });
  });

  it('stop(): halts traversal immediately (no further visits)', () => {
    const root: t.SlugTreeProps = [{ slug: 'A', slugs: [{ slug: 'A1' }] }, { slug: 'B' }];

    const seen: string[] = [];
    Tree.walk(root, (e) => {
      seen.push(e.value.slug);
      e.stop(); // stop on first node
    });

    expect(seen).to.eql(['A']); // only the first node visited
  });

  it('ignores non-item shapes encountered during Obj.walk', () => {
    // Intentionally insert junk under inline node; walker should not emit for these.
    const root: unknown = [
      {
        slug: 'A',
        slugs: [
          // valid
          { slug: 'A1', ref: 'crdt:create' },
          // invalid shapes
          { ref: 'crdt:create' },
          { slug: '' },
          123,
          null,
          { slug: 'A2', slugs: [{ foo: 1 } as any] },
        ],
      },
    ];

    const seen: string[] = [];
    Tree.walk(root, (e) => seen.push(e.value.slug));

    expect(seen).to.eql(['A', 'A1', 'A2']);
  });

  it('accepts a single-node root object (not only arrays)', () => {
    const singleRoot: t.SlugTreeItem = { slug: 'Solo', slugs: [{ slug: 'Child' }] };

    const seen: string[] = [];
    Tree.walk(singleRoot, (e) => seen.push(e.value.slug));

    expect(seen).to.eql(['Solo', 'Child']);
  });
});
