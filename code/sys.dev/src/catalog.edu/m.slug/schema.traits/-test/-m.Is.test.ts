import { describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { type t } from '../common.ts';
import { Is, Traits } from '../mod.ts';

describe('Slug.Is', () => {
  it('API', () => {
    expect(Traits.Is).to.equal(Is);
  });

  describe('videoRecorderBinding', () => {
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
        expectTypeOf(input.id).toEqualTypeOf<'video-recorder'>();
        expectTypeOf(input.as).toEqualTypeOf<string>();
        expect(input.as.length > 0).to.eql(true);
      } else {
        expect(true).to.eql(false);
      }
    });
  });

  describe('videoRecorderProps', () => {
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
        file: 'urn:crdt:123e4567-e89b-12d3-a456-426614174000/clip',
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
        // fully narrowed to public generated type
        expectTypeOf(input.name).toEqualTypeOf<string | undefined>();
        expectTypeOf(input.file).toEqualTypeOf<string | undefined>();
      } else {
        expect(true).to.eql(false);
      }
    });
  });

  describe('videoPlayerProps', () => {
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
