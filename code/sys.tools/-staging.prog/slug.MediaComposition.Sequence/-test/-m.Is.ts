import { type t, describe, it, expect, expectTypeOf } from '../../-test.ts';
import { Sequence } from '../mod.ts';

describe('SequenceIs', () => {
  describe('itemLike (type)', () => {
    it('narrows to SequenceItem on true branch', () => {
      const value: unknown = { video: '/video.mp4' };
      if (Sequence.Is.itemLike(value)) {
        // Inside the true branch, the guard promises SequenceItem.
        expectTypeOf(value).toEqualTypeOf<t.SlugSequenceItem>();
      }
    });
  });

  describe('itemLike (runtime)', () => {
    it('accepts video items', () => {
      const value: unknown = { video: '/video.mp4' };
      expect(Sequence.Is.itemLike(value)).to.eql(true);
    });

    it('accepts slug items', () => {
      const value: unknown = { slug: 'slug:example' };
      expect(Sequence.Is.itemLike(value)).to.eql(true);
    });

    it('accepts pause items', () => {
      const value: unknown = { pause: '2s' };
      expect(Sequence.Is.itemLike(value)).to.eql(true);
    });

    it('accepts image items', () => {
      const value: unknown = { image: '/image.png' };
      expect(Sequence.Is.itemLike(value)).to.eql(true);
    });

    it('allows extra properties (cheap structural guard only)', () => {
      const value: unknown = {
        video: '/video.mp4',
        foo: 'bar',
        timestamps: { '00:00:00.000': { text: { body: 'hello' } } },
      };
      expect(Sequence.Is.itemLike(value)).to.eql(true);
    });

    it('rejects non-objects', () => {
      expect(Sequence.Is.itemLike(null)).to.eql(false);
      expect(Sequence.Is.itemLike(undefined)).to.eql(false);
      expect(Sequence.Is.itemLike('video.mp4')).to.eql(false);
      expect(Sequence.Is.itemLike(123)).to.eql(false);
      expect(Sequence.Is.itemLike([])).to.eql(false);
    });

    it('rejects objects without a discriminating key', () => {
      const value: unknown = { script: 'no discriminator here' };
      expect(Sequence.Is.itemLike(value)).to.eql(false);
    });

    it('rejects objects with non-string discriminators', () => {
      const value1: unknown = { video: 123 };
      const value2: unknown = { slug: 42 };
      const value3: unknown = { pause: {} };
      const value4: unknown = { image: true };

      expect(Sequence.Is.itemLike(value1)).to.eql(false);
      expect(Sequence.Is.itemLike(value2)).to.eql(false);
      expect(Sequence.Is.itemLike(value3)).to.eql(false);
      expect(Sequence.Is.itemLike(value4)).to.eql(false);
    });
  });
});
