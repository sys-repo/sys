import { describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { Slug } from '../../mod.ts';

import { type t, Value } from '../common.ts';
import { VideoRecorderPropsSchema } from '../mod.ts';

describe('trait: video-recorder', () => {
  describe('schema', () => {
    it('validates minimal object', () => {
      expect(Value.Check(VideoRecorderPropsSchema, { name: 'foo' })).to.eql(true);
    });

    it('rejects empty name', () => {
      expect(Value.Check(VideoRecorderPropsSchema, { name: '' })).to.eql(false);
    });

    it('accepts file = "crdt:create"', () => {
      expect(Value.Check(VideoRecorderPropsSchema, { file: 'crdt:create' })).to.eql(true);
    });

    it('accepts urn:crdt and crdt:<uuid/base62-28> with optional path', () => {
      const ok1 = 'urn:crdt:123e4567-e89b-12d3-a456-426614174000/foo/bar';
      const ok2 = 'crdt:abcdefghijklmnopqrstuvwxyzAB/foo';
      expect(Value.Check(VideoRecorderPropsSchema, { file: ok1 })).to.eql(true);
      expect(Value.Check(VideoRecorderPropsSchema, { file: ok2 })).to.eql(true);
    });

    it('rejects bad file', () => {
      expect(Value.Check(VideoRecorderPropsSchema, { file: 'crdt:' })).to.eql(false);
      expect(Value.Check(VideoRecorderPropsSchema, { file: 'urn:crdt:' })).to.eql(false);
      expect(Value.Check(VideoRecorderPropsSchema, { file: 42 as unknown as string })).to.eql(
        false,
      );
    });

    it('has id/title metadata', () => {
      expect(typeof VideoRecorderPropsSchema.$id).to.eql('string');
      expect(typeof VideoRecorderPropsSchema.title).to.eql('string');
    });
  });

  describe('types & guard', () => {
    it('SlugTraitBindingOf<"video-recorder"> is assignable to SlugTraitBinding', () => {
      type Narrow = t.SlugTraitBindingOf<'video-recorder'>;

      // One-way assignability (compile-time only):
      type Assignable = Narrow extends t.SlugTraitBinding ? true : never;
      const assertAssignable: Assignable = true;

      // Satisfy expectTypeOf:
      let sample!: Narrow;
      expectTypeOf(sample).toEqualTypeOf<Narrow>();

      // "id" literal stays locked to "video-recorder":
      let id!: Narrow['id'];
      expectTypeOf(id).toEqualTypeOf<'video-recorder'>();
    });

    it('Slug.Is.videoRecorderBinding signature stays correct', () => {
      type Expect = (m: unknown) => m is t.SlugTraitBindingOf<'video-recorder'>;
      const fn = Slug.Is.videoRecorderBinding;
      expectTypeOf(fn).toEqualTypeOf<Expect>();

      // Minimal runtime sanity:
      expect(fn({ id: 'video-recorder', as: 'rec1' })).to.eql(true);
      expect(fn({ id: 'video-player', as: 'rec1' })).to.eql(false);
      expect(fn({ id: 'video-recorder' })).to.eql(false);
      expect(fn(null)).to.eql(false);
    });
  });
});
