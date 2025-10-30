import { describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { type t } from '../common.ts';
import { Is, Traits } from '../mod.ts';

describe('Slug.Is', () => {
  it('API', () => {
    expect(Traits.Is).to.equal(Is);
  });

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

  describe('Is.slugTreeProps', () => {
    it('signature', () => {
      type Expect = (u: unknown) => u is t.SlugTreeProps;
      expectTypeOf(Is.slugTreeProps).toEqualTypeOf<Expect>();
    });

    it('runtime truth table: valid cases', () => {
      const ok0: unknown = [];
      const ok1: unknown = [{ slug: 'Root' }];
      const ok2: unknown = [
        {
          slug: 'A',
          slugs: [
            { slug: 'B', ref: 'crdt:create' },
            { slug: 'C', slugs: [{ slug: 'D', ref: 'crdt:create' }] },
          ],
        },
      ];
      const ok3_schemaOnlyPermissive: unknown = [
        {
          slug: 'Hybrid',
          traits: [{ of: 'video-player', as: 'vid' }],
          data: {
            // schema-only: alias mismatch is allowed here; binding is separate
            vid1: { src: 'https://example.com/clip.mp4' },
          },
        },
      ];

      expect(Is.slugTreeProps(ok0)).to.eql(true);
      expect(Is.slugTreeProps(ok1)).to.eql(true);
      expect(Is.slugTreeProps(ok2)).to.eql(true);
      expect(Is.slugTreeProps(ok3_schemaOnlyPermissive)).to.eql(true);
    });

    it('runtime truth table: invalid cases', () => {
      const notArray: unknown = { slug: 'nope' };
      const missingSlug: unknown = [{ ref: 'crdt:create' }];
      const emptySlug: unknown = [{ slug: '' }];
      const badRefDeep: unknown = [{ slug: 'A', slugs: [{ slug: 'B', ref: 'bad-ref' }] }];
      const unknownKeyNested: unknown = [{ slug: 'A', slugs: [{ slug: 'B', foo: 123 }] }];

      expect(Is.slugTreeProps(notArray)).to.eql(false);
      expect(Is.slugTreeProps(missingSlug)).to.eql(false);
      expect(Is.slugTreeProps(emptySlug)).to.eql(false);
      expect(Is.slugTreeProps(badRefDeep)).to.eql(false);
      expect(Is.slugTreeProps(unknownKeyNested)).to.eql(false);
    });

    it('narrows to t.SlugTreeProps', () => {
      const input: unknown = [{ slug: 'Z', slugs: [{ slug: 'Y', ref: 'crdt:create' }] }];
      if (Is.slugTreeProps(input)) {
        // Type narrowing:
        expectTypeOf(input).toEqualTypeOf<t.SlugTreeProps>();
        // A couple of concrete runtime checks:
        expect(Array.isArray(input)).to.eql(true);
        expect(input[0].slug).to.eql('Z');
        expect(Array.isArray(input[0].slugs)).to.eql(true);
      } else {
        expect(true).to.eql(false);
      }
    });
  });
});
