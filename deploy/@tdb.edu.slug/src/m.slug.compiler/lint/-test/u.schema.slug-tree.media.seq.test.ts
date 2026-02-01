import { describe, expect, it } from '../../-test.ts';
import { LintProfileSchema } from '../u.schema.ts';

describe('LintProfileSchema (slug-tree media seq)', () => {
  it('accepts slug-tree media sequence bundle config', () => {
    const doc = {
      'bundle:slug-tree:media:seq': {
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
      },
    };
    const res = LintProfileSchema.validate(doc);
    expect(res.ok).to.eql(true);
    expect(res.errors.length).to.eql(0);
  });
});
