import { type t, describe, expect, it } from '../../../-test.ts';
import { ManifestSchema } from '../mod.ts';

describe('ManifestSchema.Validate', () => {
  const validAssets: t.SlugAssetsManifest = {
    docid: 'slug-doc-1',
    assets: [
      {
        kind: 'video',
        logicalPath: '/slug/doc/video.mp4',
        hash: 'hash-video',
        filename: 'video.mp4',
        href: '/assets/video.mp4',
        stats: { bytes: 1024, duration: 3000 },
      },
    ],
  };

  const invalidAssets = {
    docid: 'slug-doc-1',
    assets: [
      {
        kind: 'audio',
        logicalPath: '/slug/doc/video.mp4',
        hash: 'hash-video',
        filename: 'video.mp4',
        href: '/assets/video.mp4',
      },
    ],
  } as const;

  const validPlayback: t.SlugPlaybackManifest = {
    docid: 'slug-doc-1',
    composition: [{ src: '/slug/doc/video.mp4' }],
    beats: [
      {
        src: { kind: 'video', logicalPath: '/slug/doc/video.mp4', time: 0 },
        payload: {},
      },
    ],
  };

  const invalidPlayback = {
    docid: 'slug-doc-1',
    composition: [{ src: '/slug/doc/video.mp4' }],
  } as const;

  describe('ManifestSchema.Validate.assets', () => {
    it('accepts a minimal assets manifest', () => {
      const result = ManifestSchema.Validate.assets(validAssets);
      expect(result.ok).to.eql(true);
      if (!result.ok) throw result.error;
      expect(result.sequence).to.eql(validAssets);
    });

    it('rejects manifests with an invalid asset kind', () => {
      const result = ManifestSchema.Validate.assets(invalidAssets);
      expect(result.ok).to.eql(false);
      if (!result.ok) {
        expect(result.error).to.be.instanceOf(Error);
        expect(result.error.message.length > 0).to.eql(true);
        expect(result.error.message.includes(':')).to.eql(true);
      }
    });
  });

  describe('ManifestSchema.Validate', () => {
    it('accepts the minimal playback manifest shape', () => {
      const result = ManifestSchema.Validate.playback(validPlayback);
      expect(result.ok).to.eql(true);
      if (!result.ok) throw result.error;
      expect(result.sequence).to.eql(validPlayback);
    });

    it('rejects manifests missing required fields', () => {
      const result = ManifestSchema.Validate.playback(invalidPlayback);
      expect(result.ok).to.eql(false);
      if (!result.ok) {
        expect(result.error).to.be.instanceOf(Error);
        expect(result.error.message.length > 0).to.eql(true);
        expect(result.error.message.includes(':')).to.eql(true);
      }
    });
  });
});
