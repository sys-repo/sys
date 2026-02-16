import { describe, expect, it, Schema } from '../../../../-test.ts';
import { BundleDescriptorSlugTreeMediaSeqSchema } from '../u.schema.ts';

const valid = {
  kind: 'slug-tree:media:seq',
  version: 1,
  docid: 'slug:doc-2',
  layout: {
    manifestsDir: 'manifests',
    mediaDirs: {
      video: 'video',
      image: 'image',
    },
    shard: {
      video: { strategy: 'prefix-range', total: 64, host: 'prefix-shard', path: 'root-filename' },
      image: { strategy: 'prefix-range', total: 16, host: 'none', path: 'preserve' },
    },
  },
  files: {
    assets: 'assets.json',
    playback: 'playback.json',
    tree: 'tree.json',
  },
} as const;

describe('BundleDescriptorSlugTreeMediaSeqSchema', () => {
  it('accepts a valid descriptor', () => {
    expect(Schema.Value.Check(BundleDescriptorSlugTreeMediaSeqSchema, valid)).to.eql(true);
  });

  it('rejects additional properties', () => {
    expect(
      Schema.Value.Check(BundleDescriptorSlugTreeMediaSeqSchema, { ...valid, extra: 'nope' }),
    ).to.eql(false);
  });

  it('rejects missing required fields', () => {
    expect(
      Schema.Value.Check(BundleDescriptorSlugTreeMediaSeqSchema, {
        kind: 'slug-tree:media:seq',
        version: 1,
      }),
    ).to.eql(false);
  });
});
