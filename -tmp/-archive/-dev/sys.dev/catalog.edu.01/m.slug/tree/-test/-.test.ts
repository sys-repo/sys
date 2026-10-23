import { type t, describe, expect, it } from '../../../-test.ts';
import { Slug } from '../../mod.ts';
import { Tree } from '../mod.ts';

describe('Slug.Tree', () => {
  it('API', () => {
    expect(Slug.Tree).to.equal(Tree);
  });

  describe('fromNode', () => {
    const base: t.SlugTreeItem = {
      slug: 'My Node',
      ref: 'crdt:create',
      description: 'Desc',
      traits: [{ of: 'video-player', as: 'vid' }],
      data: { vid: { src: 'ok' } },
      slugs: [],
    };

    it('returns a new object (not same ref)', () => {
      const res = Slug.Tree.fromNode(base);
      expect(res).to.not.equal(base);
    });

    it('returns empty when passing no param', () => {
      expect(Slug.Tree.fromNode()).to.eql({});
      expect(Slug.Tree.fromNode(null as any)).to.eql({});
    });

    it('contains only allowed fields (id, description, ref, traits, data)', () => {
      const res = Slug.Tree.fromNode(base);
      expect(Object.keys(res)).to.eql(['description', 'ref', 'traits', 'data']);
    });

    it('copies existing values', () => {
      const res = Slug.Tree.fromNode(base);
      expect(res.description).to.eql('Desc');
      expect(res.ref).to.eql('crdt:create');
      expect(res.traits?.[0]?.of).to.eql('video-player');
      expect(res.data?.vid).to.eql({ src: 'ok' });
    });

    it('omits undefined fields', () => {
      const minimal: t.SlugTreeItem = { slug: 'Bare' };
      const res = Slug.Tree.fromNode(minimal);
      expect(Object.keys(res)).to.eql([]);
    });
  });
});
