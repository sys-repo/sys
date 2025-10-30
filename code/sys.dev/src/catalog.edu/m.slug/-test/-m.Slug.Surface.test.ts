import { describe, expect, it } from '../../-test.ts';
import { type t } from '../common.ts';
import { SlugSurface } from '../m.Slug.Surface.ts';

describe('Slug.Surface', () => {
  it('API', () => {
    expect(SlugSurface.fromTreeItem).to.be.a('function');
  });

  describe('fromTreeItem', () => {
    const base: t.SlugTreeItem = {
      slug: 'My Node',
      ref: 'crdt:create',
      description: 'Desc',
      traits: [{ of: 'video-player', as: 'vid' }],
      data: { vid: { src: 'ok' } },
      slugs: [],
    };

    it('returns a new object (not same ref)', () => {
      const res = SlugSurface.fromTreeItem(base);
      expect(res).to.not.equal(base);
    });

    it('contains only allowed fields (id, description, ref, traits, data)', () => {
      const res = SlugSurface.fromTreeItem(base);
      expect(Object.keys(res)).to.eql(['description', 'ref', 'traits', 'data']);
    });

    it('copies existing values', () => {
      const res = SlugSurface.fromTreeItem(base);
      expect(res.description).to.eql('Desc');
      expect(res.ref).to.eql('crdt:create');
      expect(res.traits?.[0]?.of).to.eql('video-player');
      expect(res.data?.vid).to.eql({ src: 'ok' });
    });

    it('omits undefined fields', () => {
      const minimal: t.SlugTreeItem = { slug: 'Bare' };
      const res = SlugSurface.fromTreeItem(minimal);
      expect(Object.keys(res)).to.eql([]);
    });
  });
});
