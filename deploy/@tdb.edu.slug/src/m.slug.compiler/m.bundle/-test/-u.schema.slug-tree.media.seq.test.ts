import { describe, expect, it } from '../../-test.ts';
import { Schema } from '../common.ts';
import { SchemaSlugTreeMediaSeqBundle } from '../u.schema.slug-tree.media.seq.ts';

describe('SchemaSlugTreeMediaSeqBundle', () => {
  it('accepts slug-tree media sequence bundle config', () => {
    const doc = {
      crdt: { docid: 'slug:test', path: '/slug' },
      target: {
        base: './out',
        hrefBase: '/assets',
        manifests: {
          dir: 'manifests',
          assets: 'slug.<docid>.assets.json',
          playback: 'slug.<docid>.playback.json',
          tree: 'slug-tree.<docid>.json',
        },
        media: { video: 'video', image: 'image' },
      },
      requirePlayback: true,
    };
    const ok = Schema.Value.Check(SchemaSlugTreeMediaSeqBundle, doc);
    expect(ok).to.eql(true);
  });

  it('rejects config without crdt.path', () => {
    const doc = {
      crdt: { docid: 'slug:test' },
    };
    const ok = Schema.Value.Check(SchemaSlugTreeMediaSeqBundle, doc);
    expect(ok).to.eql(false);
  });
});
