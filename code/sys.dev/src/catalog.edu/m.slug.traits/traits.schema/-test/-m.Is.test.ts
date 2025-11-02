import { describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { type t, Slug } from '../common.ts';
import { Is, Traits } from '../mod.ts';

describe('Slug.Is', () => {
  it('API', () => {
    expect(Traits.Is).to.equal(Is);
    expect(Traits.Is.slugTreeProps).to.equal(Slug.Tree.Is.props);
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

  describe('Is.conceptLayoutProps', () => {
    it('signature', () => {
      type Expect = (u: unknown) => u is t.ConceptLayoutProps;
      expectTypeOf(Is.conceptLayoutProps).toEqualTypeOf<Expect>();
    });

    it('runtime truth table', () => {
      const ok = { slug: 'crdt:create' };
      const bad = { slug: 'nope' };
      const noise = { slug: 'crdt:create', extra: true } as unknown;

      expect(Is.conceptLayoutProps(ok)).to.eql(true);
      expect(Is.conceptLayoutProps(bad)).to.eql(false);
      expect(Is.conceptLayoutProps(noise)).to.eql(false);
      expect(Is.conceptLayoutProps(undefined)).to.eql(false);
    });

    it('narrows', () => {
      const input: unknown = { slug: 'crdt:create' };
      if (Is.conceptLayoutProps(input)) {
        expectTypeOf(input.slug).toEqualTypeOf<string>();
      } else {
        expect(true).to.eql(false);
      }
    });
  });

  describe('Is.fileListProps', () => {
    it('signature', () => {
      type Expect = (u: unknown) => u is t.FileListProps;
      expectTypeOf(Is.fileListProps).toEqualTypeOf<Expect>();
    });

    it('runtime truth table', () => {
      const ok1 = {}; // minimal: all optional
      const ok2 = { name: 'Docs' }; // valid without files
      const ok3 = { files: [] as string[] };
      const ok4 = { files: ['a.txt'] };
      const ok5 = { name: 'Docs', files: ['a.txt', 'b/c.md'] };
      const ok6 = { name: '', files: [''] }; // empty strings allowed by schema

      const bads: unknown[] = [
        { files: 'not-an-array' },
        { files: [123] },
        { files: [null] },
        { files: [{}] },
        { name: 123, files: [] },
        { name: { label: 'nope' }, files: ['a'] },
        { description: 123, files: ['a'] },
        { description: { text: 'nope' }, files: ['a'] },
        { description: null, files: ['a'] },
        { description: true, files: ['a'] },
        { id: 42, files: ['a'] },
        { id: { key: 'nope' }, files: ['a'] },
        { files: ['ok'], extra: true }, // additionalProperties: false
      ];

      expect(Is.fileListProps(ok1)).to.eql(true);
      expect(Is.fileListProps(ok2)).to.eql(true);
      expect(Is.fileListProps(ok3)).to.eql(true);
      expect(Is.fileListProps(ok4)).to.eql(true);
      expect(Is.fileListProps(ok5)).to.eql(true);
      expect(Is.fileListProps(ok6)).to.eql(true);

      for (const v of bads) expect(Is.fileListProps(v)).to.eql(false);
    });

    it('narrows', () => {
      const input: unknown = { name: 'Docs' };
      if (Is.fileListProps(input)) {
        // Optional field shape (object-level):
        expectTypeOf(input).toMatchTypeOf<{ files?: readonly string[] }>();

        // Scalar fields:
        expectTypeOf(input.name).toEqualTypeOf<string | undefined>();

        // If present, it's a readonly string array:
        if (input.files) {
          expectTypeOf(input.files).toEqualTypeOf<readonly string[]>();
        }
      } else {
        expect(true).to.eql(false);
      }
    });
  });

  describe('Is.timeMapProps', () => {
    it('signature', () => {
      type Expect = (u: unknown) => u is t.TimeMapProps;
      expectTypeOf(Is.timeMapProps).toEqualTypeOf<Expect>();
    });

    it('runtime truth table', () => {
      const ok1 = {}; // all optional
      const ok2 = { id: 'tm-001' };
      const ok3 = { name: 'Release Markers', description: 'Named instants for milestones' };

      const bads: unknown[] = [
        { extra: true }, // additionalProperties: false
        { id: 123 }, // wrong type
        { name: 1 }, // wrong type
        { description: null }, // wrong type
        null,
        undefined,
        42,
        'str',
        true,
      ];

      expect(Is.timeMapProps(ok1)).to.eql(true);
      expect(Is.timeMapProps(ok2)).to.eql(true);
      expect(Is.timeMapProps(ok3)).to.eql(true);

      for (const v of bads) expect(Is.timeMapProps(v)).to.eql(false);
    });

    it('narrows', () => {
      const input: unknown = { name: 'Timeline' };
      if (Is.timeMapProps(input)) {
        expectTypeOf(input.id).toEqualTypeOf<string | undefined>();
        expectTypeOf(input.name).toEqualTypeOf<string | undefined>();
        expectTypeOf(input.description).toEqualTypeOf<string | undefined>();
      } else {
        expect(true).to.eql(false);
      }
    });
  });
});
