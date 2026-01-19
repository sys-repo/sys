import { describe, expect, it } from '../../-test.ts';
import { Schema } from '../common.ts';
import { AssetsSchema } from '../mod.ts';
import { schema } from '../u.manifest.schema.ts';

const validManifest = {
  docid: 'slug-doc-id-1' as const,
  assets: [
    {
      kind: 'video' as const,
      logicalPath: '/slug-doc/video.mp4' as const,
      hash: 'hash-video',
      filename: 'video.mp4',
      href: '/assets/video.mp4',
      stats: { bytes: 1024, duration: 3000 },
    },
    {
      kind: 'image' as const,
      logicalPath: '/slug-doc/thumb.jpg' as const,
      hash: 'hash-thumb',
      filename: 'thumb.jpg',
      href: '/assets/thumb.jpg',
    },
  ],
} as const;

describe('SlugAssets.Manifest', () => {
  describe('schema', () => {
    it('api surface matches helper schema', () => {
      expect(AssetsSchema.Manifest.schema).to.equal(schema);
    });

    it('accepts a valid assets manifest', () => {
      const s = schema();
      expect(Schema.Value.Check(s, validManifest)).to.eql(true);
    });

    it('rejects additional properties and invalid kinds', () => {
      const s = schema();
      expect(Schema.Value.Check(s, { ...validManifest, extra: 'nope' })).to.eql(false);
      expect(Schema.Value.Check(s, { assets: validManifest.assets })).to.eql(false);
      expect(
        Schema.Value.Check(s, {
          ...validManifest,
          assets: [{ ...validManifest.assets[0], kind: 'audio' as const }],
        }),
      ).to.eql(false);
    });
  });

  describe('standard', () => {
    it('validates a good manifest', () => {
      const std = AssetsSchema.Manifest.standard();
      const res = std['~standard'].validate(validManifest);
      expect(res.ok).to.eql(true);
      if (res.ok) {
        expect(res.value).to.eql(validManifest);
      }
    });

    it('reports issues for invalid manifests', () => {
      const std = AssetsSchema.Manifest.standard();
      const res = std['~standard'].validate({
        ...validManifest,
        assets: [{ ...validManifest.assets[0], kind: 'audio' as const }],
      });

      expect(res.ok).to.eql(false);
      if (!res.ok) {
        expect(Array.isArray(res.issues)).to.eql(true);
        expect(res.issues.length > 0).to.eql(true);
      }
    });
  });

  describe('parse', () => {
    it('returns ok for valid input', () => {
      const res = AssetsSchema.Manifest.parse(validManifest);
      expect(res.ok).to.eql(true);
      if (res.ok) {
        expect(res.value).to.eql(validManifest);
      }
    });

    it('returns errors for invalid input', () => {
      const res = AssetsSchema.Manifest.parse({
        ...validManifest,
        assets: [{ ...validManifest.assets[0], kind: 'audio' as const }],
      });

      expect(res.ok).to.eql(false);
      if (!res.ok) {
        expect(Array.isArray(res.errors)).to.eql(true);
        expect(res.errors.length > 0).to.eql(true);
      }
    });
  });
});
