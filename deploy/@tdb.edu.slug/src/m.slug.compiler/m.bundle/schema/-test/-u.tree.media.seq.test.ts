import { describe, expect, it } from '../../../-test.ts';
import { Schema } from '../../common.ts';
import { SchemaSlugTreeMediaSeqBundle } from '../mod.ts';

describe('SchemaSlugTreeMediaSeqBundle', () => {
  it('accepts slug-tree media sequence bundle config', () => {
    const doc = {
      crdt: { docid: 'slug:test', path: '/slug' },
      target: {
        manifests: {
          base: './out',
          hrefBase: '/assets',
          dir: 'manifests',
          assets: 'slug.<docid>.assets.json',
          playback: 'slug.<docid>.playback.json',
          tree: 'slug-tree.<docid>.json',
        },
        media: {
          shard: { strategy: 'prefix-range', total: 64 },
          video: { base: './out', hrefBase: '/assets', dir: 'video' },
          image: { base: './out', hrefBase: '/assets', dir: 'image' },
        },
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
