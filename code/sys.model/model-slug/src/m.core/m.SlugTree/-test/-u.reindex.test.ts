import { type t, describe, expect, it } from '../../../-test.ts';
import { reindex } from '../u.reindex.ts';

describe('SlugTree.reindex', () => {
  it('orders siblings using the previous tree', () => {
    const prev: t.SlugTreeItems = [
      { slug: 'b', ref: 'crdt:b' },
      { slug: 'a', ref: 'crdt:a' },
    ];
    const next: t.SlugTreeItems = [
      { slug: 'a', ref: 'crdt:a' },
      { slug: 'b', ref: 'crdt:b' },
    ];

    const result = reindex({ prev, next });

    expect(result.map((n) => n.slug)).to.eql(['b', 'a']);
  });

  it('keeps moved refs in the new parent (renamed dir)', () => {
    const prev: t.SlugTreeItems = [
      {
        slug: 'dir-one',
        slugs: [{ slug: 'alpha', ref: 'crdt:alpha' }],
      },
      {
        slug: 'dir-two',
        slugs: [{ slug: 'beta', ref: 'crdt:beta' }],
      },
    ];

    const next: t.SlugTreeItems = [
      {
        slug: 'dir-renamed',
        slugs: [
          { slug: 'alpha', ref: 'crdt:alpha' },
          { slug: 'beta', ref: 'crdt:beta' },
        ],
      },
    ];

    const result = reindex({ prev, next });
    const dir = result[0];
    const slugs = dir.slugs ?? [];

    expect(dir.slug).to.eql('dir-renamed');
    expect(slugs.map((n) => n.slug)).to.eql(['alpha', 'beta']);
  });
});
