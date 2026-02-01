import { describe, expect, it, Schema } from '../../../../-test.ts';
import { BundleDescriptorSlugTreeFsSchema } from '../u.schema.ts';

const valid = {
  kind: 'slug-tree:fs',
  version: 1,
  docid: 'slug:doc-1',
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

describe('BundleDescriptorSlugTreeFsSchema', () => {
  it('accepts a valid descriptor', () => {
    expect(Schema.Value.Check(BundleDescriptorSlugTreeFsSchema, valid)).to.eql(true);
  });

  it('rejects additional properties', () => {
    expect(
      Schema.Value.Check(BundleDescriptorSlugTreeFsSchema, { ...valid, extra: 'nope' }),
    ).to.eql(false);
  });

  it('rejects missing required fields', () => {
    expect(
      Schema.Value.Check(BundleDescriptorSlugTreeFsSchema, {
        kind: 'slug-tree:fs',
        version: 1,
      }),
    ).to.eql(false);
  });
});
