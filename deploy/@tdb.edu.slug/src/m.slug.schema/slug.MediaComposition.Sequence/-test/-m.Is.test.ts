import { describe, expect, it } from '../../../-test.ts';
import { SequenceSchema } from '../mod.ts';

describe('SequenceSchema.Is', () => {
  const Is = SequenceSchema.Is;

  describe('Is.itemLike', () => {
    it('accepts known authoring shapes (video/slug/pause/image)', () => {
      expect(Is.itemLike({ video: 'a.mp4' })).to.equal(true);
      expect(Is.itemLike({ slug: 'slug.123' })).to.equal(true);
      expect(Is.itemLike({ pause: '2s' })).to.equal(true);
      expect(Is.itemLike({ image: 'img.png' })).to.equal(true);
    });

    it('rejects non-records and unknown shapes', () => {
      expect(Is.itemLike(null)).to.equal(false);
      expect(Is.itemLike(undefined)).to.equal(false);
      expect(Is.itemLike('nope')).to.equal(false);
      expect(Is.itemLike(123)).to.equal(false);
      expect(Is.itemLike([])).to.equal(false);

      expect(Is.itemLike({})).to.equal(false);
      expect(Is.itemLike({ video: 123 })).to.equal(false);
      expect(Is.itemLike({ pause: 1 })).to.equal(false);
      expect(Is.itemLike({ image: { src: 'x' } })).to.equal(false);
      expect(Is.itemLike({ somethingElse: 'x' })).to.equal(false);
    });
  });
});
