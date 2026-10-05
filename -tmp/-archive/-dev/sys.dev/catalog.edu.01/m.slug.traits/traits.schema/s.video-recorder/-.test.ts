import { describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { type t, Value } from '../common.ts';
import { Is, Traits, VideoRecorderPropsSchema } from '../mod.ts';

describe('trait: video-recorder', () => {
  it('API', () => {
    expect(Traits.Schema.VideoRecorder.Props).to.equal(VideoRecorderPropsSchema);
  });

  describe('Is', () => {
    describe('Is.videoRecorderBinding', () => {
      it('signature', () => {
        type Expect = (m: unknown) => m is t.VideoRecorderBinding;
        expectTypeOf(Is.videoRecorderBinding).toEqualTypeOf<Expect>();
      });

      it('runtime truth table', () => {
        const ok = { id: 'video-recorder', as: 'rec1' };
        const badId = { id: 'video-player', as: 'rec1' };
        const missingAs = { id: 'video-recorder' };
        const emptyAs = { id: 'video-recorder', as: '' };

        expect(Is.videoRecorderBinding(ok)).to.eql(true);
        expect(Is.videoRecorderBinding(badId)).to.eql(false);
        expect(Is.videoRecorderBinding(missingAs as unknown)).to.eql(false);
        expect(Is.videoRecorderBinding(emptyAs)).to.eql(false);
        expect(Is.videoRecorderBinding(null)).to.eql(false);
        expect(Is.videoRecorderBinding(42)).to.eql(false);
      });

      it('narrows', () => {
        const input: unknown = { id: 'video-recorder', as: 'cam' };
        if (Is.videoRecorderBinding(input)) {
          expectTypeOf(input.of).toEqualTypeOf<'video-recorder'>();
          expectTypeOf(input.as).toEqualTypeOf<string>();
          expect(input.as.length > 0).to.eql(true);
        } else {
          expect(true).to.eql(false);
        }
      });
    });

    describe('Is.videoRecorderProps', () => {
      it('signature', () => {
        type Expect = (u: unknown) => u is t.VideoRecorderProps;
        expectTypeOf(Is.videoRecorderProps).toEqualTypeOf<Expect>();
      });

      it('runtime truth table', () => {
        const ok1 = {}; // all optional
        const ok2 = { name: 'Record Intro', file: 'crdt:create' };
        const ok3 = {
          description: 'Say hello',
          script: 'Read this...',
          file: 'urn:crdt:2JgVjx9KAMcB3D6EZEyBB18jBX6P/clip',
        };
        const badName = { name: '' }; // violates minLength: 1
        const badFile = { file: 'not-a-crdt-ref' };
        const noise = { extra: true }; // disallowed by additionalProperties: false

        expect(Is.videoRecorderProps(ok1)).to.eql(true);
        expect(Is.videoRecorderProps(ok2)).to.eql(true);
        expect(Is.videoRecorderProps(ok3)).to.eql(true);

        expect(Is.videoRecorderProps(badName)).to.eql(false);
        expect(Is.videoRecorderProps(badFile)).to.eql(false);
        expect(Is.videoRecorderProps(noise as unknown)).to.eql(false);

        expect(Is.videoRecorderProps(null)).to.eql(false);
        expect(Is.videoRecorderProps(123)).to.eql(false);
      });

      it('narrows', () => {
        const input: unknown = { name: 'Intro', file: 'crdt:create' };
        if (Is.videoRecorderProps(input)) {
          expectTypeOf(input.name).toEqualTypeOf<string | undefined>();
          expectTypeOf(input.file).toEqualTypeOf<string | undefined>();
        } else {
          expect(true).to.eql(false);
        }
      });
    });
  });

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
      const ok1 = 'urn:crdt:abcdefghijklmnopqrstuvwxyzAA/foo/bar';
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

      // `id` (trait "of") literal stays locked to "video-recorder":
      let id!: Narrow['of'];
      expectTypeOf(id).toEqualTypeOf<'video-recorder'>();
    });

    it('Slug.Is.videoRecorderBinding signature stays correct', () => {
      type Expect = (m: unknown) => m is t.SlugTraitBindingOf<'video-recorder'>;
      const fn = Traits.Is.videoRecorderBinding;
      expectTypeOf(fn).toEqualTypeOf<Expect>();

      // Minimal runtime sanity:
      expect(fn({ id: 'video-recorder', as: 'rec1' })).to.eql(true);
      expect(fn({ id: 'video-player', as: 'rec1' })).to.eql(false);
      expect(fn({ id: 'video-recorder' })).to.eql(false);
      expect(fn(null)).to.eql(false);
    });
  });
});
