import { describe, expect, it, Schema } from '../../../-test.ts';
import { BundleDescriptorDocSchema, BundleDescriptorSchema } from '../u.schema.ts';

const fsBundle = {
  kind: 'slug-tree:fs',
  version: 1,
  docid: 'slug:doc-fs',
  basePath: '/slug-doc',
  layout: {
    manifestsDir: 'manifests',
    contentDir: 'content',
  },
  files: {
    tree: 'tree.json',
    index: 'index.json',
  },
} as const;

const mediaBundle = {
  kind: 'slug-tree:media:seq',
  version: 1,
  docid: 'slug:doc-media',
  layout: {
    manifestsDir: 'manifests',
    mediaDirs: {
      video: 'video',
      image: 'image',
    },
  },
  files: {
    assets: 'assets.json',
    playback: 'playback.json',
    tree: 'tree.json',
  },
} as const;

describe('BundleDescriptorSchema', () => {
  it('accepts valid bundle descriptors', () => {
    expect(Schema.Value.Check(BundleDescriptorSchema, fsBundle)).to.eql(true);
    expect(Schema.Value.Check(BundleDescriptorSchema, mediaBundle)).to.eql(true);
  });

  it('rejects unknown kinds', () => {
    expect(
      Schema.Value.Check(BundleDescriptorSchema, {
        ...fsBundle,
        kind: 'slug-tree:unknown',
      }),
    ).to.eql(false);
  });
});

describe('BundleDescriptorDocSchema', () => {
  it('accepts a bundles list', () => {
    const doc = { bundles: [fsBundle, mediaBundle] };
    expect(Schema.Value.Check(BundleDescriptorDocSchema, doc)).to.eql(true);
  });

  it('rejects missing bundles', () => {
    expect(Schema.Value.Check(BundleDescriptorDocSchema, {})).to.eql(false);
  });

  it('rejects additional properties', () => {
    expect(
      Schema.Value.Check(BundleDescriptorDocSchema, {
        bundles: [fsBundle],
        extra: true,
      }),
    ).to.eql(false);
  });
});
