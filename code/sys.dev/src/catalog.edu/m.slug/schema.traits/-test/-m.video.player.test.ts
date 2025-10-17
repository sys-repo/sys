import { describe, expect, expectTypeOf, it } from '../../../-test.ts';

import { type t, Value } from '../common.ts';
import { VideoPlayerPropsSchema } from '../mod.ts';

describe('trait: video-player', () => {
  describe('schema', () => {
    it('validates minimal object', () => {
      expect(Value.Check(VideoPlayerPropsSchema, { name: 'foo' })).to.eql(true);
    });

    it('rejects empty name', () => {
      expect(Value.Check(VideoPlayerPropsSchema, { name: '' })).to.eql(false);
    });

    it('accepts non-empty src; rejects empty src', () => {
      expect(Value.Check(VideoPlayerPropsSchema, { src: 'foo.mp4' })).to.eql(true);
      expect(Value.Check(VideoPlayerPropsSchema, { src: '' })).to.eql(false);
    });

    it('has id/title metadata', () => {
      expect(typeof VideoPlayerPropsSchema.$id).to.eql('string');
      expect(typeof VideoPlayerPropsSchema.title).to.eql('string');
    });
  });

  describe('types', () => {
    it('SlugTraitBindingOf<"video-player"> is assignable to SlugTraitBinding', () => {
      type Narrow = t.SlugTraitBindingOf<'video-player'>;

      // One-way assignability (compile-time only):
      type Assignable = Narrow extends t.SlugTraitBinding ? true : never;
      const assertAssignable: Assignable = true;

      // Satisfy expectTypeOf:
      let sample!: Narrow;
      expectTypeOf(sample).toEqualTypeOf<Narrow>();

      // "id" literal stays locked to "video-player":
      let id!: Narrow['id'];
      expectTypeOf(id).toEqualTypeOf<'video-player'>();
    });
  });
});
