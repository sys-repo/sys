import { describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { type t, Value } from '../common.ts';
import { Is, Traits, VideoPlayerPropsSchema } from '../mod.ts';

describe('trait: video-player', () => {
  it('API', () => {
    expect(Traits.Schema.VideoPlayer.Props).to.equal(VideoPlayerPropsSchema);
  });

  describe('Is', () => {
    describe('Is.videoPlayerBinding', () => {
      it('signature', () => {
        type Expect = (m: unknown) => m is t.VideoPlayerBinding;
        expectTypeOf(Is.videoPlayerBinding).toEqualTypeOf<Expect>();
      });

      it('runtime truth table', () => {
        const ok = { id: 'video-player', as: 'viewer1' };
        const badId = { id: 'video-recorder', as: 'viewer1' };
        const missingAs = { id: 'video-player' };
        const emptyAs = { id: 'video-player', as: '' };

        expect(Is.videoPlayerBinding(ok)).to.eql(true);
        expect(Is.videoPlayerBinding(badId)).to.eql(false);
        expect(Is.videoPlayerBinding(missingAs as unknown)).to.eql(false);
        expect(Is.videoPlayerBinding(emptyAs)).to.eql(false);
        expect(Is.videoPlayerBinding(undefined)).to.eql(false);
        expect(Is.videoPlayerBinding(0)).to.eql(false);
      });

      it('narrows', () => {
        const input: unknown = { id: 'video-player', as: 'vp' };
        if (Is.videoPlayerBinding(input)) {
          expectTypeOf(input.of).toEqualTypeOf<'video-player'>();
          expectTypeOf(input.as).toEqualTypeOf<string>();
          expect(input.as.length > 0).to.eql(true);
        } else {
          expect(true).to.eql(false);
        }
      });
    });

    describe('Is.videoPlayerProps', () => {
      it('signature', () => {
        type Expect = (u: unknown) => u is t.VideoPlayerProps;
        expectTypeOf(Is.videoPlayerProps).toEqualTypeOf<Expect>();
      });

      it('runtime truth table', () => {
        const ok1 = {};
        const ok2 = { name: 'Welcome', src: 'welcome.mp4' };
        const badName = { name: '' }; // minLength: 1
        const noise = { src: 'video.mp4', extra: true }; // additionalProperties: false

        expect(Is.videoPlayerProps(ok1)).to.eql(true);
        expect(Is.videoPlayerProps(ok2)).to.eql(true);

        expect(Is.videoPlayerProps(badName)).to.eql(false);
        expect(Is.videoPlayerProps(noise as unknown)).to.eql(false);

        expect(Is.videoPlayerProps(undefined)).to.eql(false);
        expect(Is.videoPlayerProps('foo')).to.eql(false);
      });

      it('narrows', () => {
        const input: unknown = { src: 'clip.mp4' };
        if (Is.videoPlayerProps(input)) {
          expectTypeOf(input.src).toEqualTypeOf<string | undefined>();
        } else {
          expect(true).to.eql(false);
        }
      });
    });
  });

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

      // `id` (trait "of") literal stays locked to "video-player":
      let id!: Narrow['of'];
      expectTypeOf(id).toEqualTypeOf<'video-player'>();
    });
  });
});
