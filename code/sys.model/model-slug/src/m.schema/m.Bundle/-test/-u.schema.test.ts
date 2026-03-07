import { describe, expect, it, Schema } from '../../../-test.ts';
import { SlugSchema } from '../../mod.ts';
import { BundleDescriptorRootSchema, BundleDescriptorItemSchema } from '../u.schema.ts';

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
  const BundleDescriptor = SlugSchema.BundleDescriptor;

  it('API', () => {
    expect(BundleDescriptor).to.equal(SlugSchema.BundleDescriptor);
    expect(BundleDescriptor.Schema).to.equal(BundleDescriptorRootSchema);
    expect(BundleDescriptor.ItemSchema).to.equal(BundleDescriptorItemSchema);
  });

  it('accepts valid bundle descriptors', () => {
    expect(Schema.Value.Check(SlugSchema.BundleDescriptor.ItemSchema, fsBundle)).to.eql(true);
    expect(Schema.Value.Check(SlugSchema.BundleDescriptor.ItemSchema, mediaBundle)).to.eql(true);
  });

  it('rejects unknown kinds', () => {
    expect(
      Schema.Value.Check(SlugSchema.BundleDescriptor.ItemSchema, {
        ...fsBundle,
        kind: 'slug-tree:unknown',
      }),
    ).to.eql(false);
  });
});

describe('BundleDescriptor.Schema (Root Schema)', () => {
  it('accepts a bundles list', () => {
    const doc = { bundles: [fsBundle, mediaBundle] };
    expect(Schema.Value.Check(BundleDescriptorRootSchema, doc)).to.eql(true);
  });

  it('rejects missing bundles', () => {
    expect(Schema.Value.Check(SlugSchema.BundleDescriptor.Schema, {})).to.eql(false);
  });

  it('rejects additional properties', () => {
    expect(
      Schema.Value.Check(SlugSchema.BundleDescriptor.Schema, {
        bundles: [fsBundle],
        extra: true,
      }),
    ).to.eql(false);
  });
});
