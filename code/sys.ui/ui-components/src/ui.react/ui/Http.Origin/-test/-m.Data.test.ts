import { describe, expect, it } from '../../../-test.ts';
import { Data } from '../m.Data.ts';
import { HttpOrigin } from '../mod.ts';

import { Sample } from '../-spec/-samples.ts';

describe('HttpOrigin.Data', () => {
  it('API', () => {
    expect(HttpOrigin.Data).to.equal(Data);
  });

  describe('Data.flatten', () => {
    it('walks nested tree depth-first', () => {
      const tree = Sample.media.production;
      expect(tree).to.not.equal(undefined);
      const rows = Data.flatten(tree!);
      expect(rows).to.eql([
        { key: 'api', url: 'https://api.example.com' },
        { key: 'assets.images', url: 'https://img.example.com' },
        { key: 'assets.video', url: 'https://media.example.com/video' },
        { key: 'stream.hls', url: 'https://hls.example.com' },
        { key: 'stream.dash', url: 'https://dash.example.com' },
      ]);
    });

    it('honors a prefix', () => {
      const tree = Sample.cdn.production;
      expect(tree).to.not.equal(undefined);
      const rows = Data.flatten(tree!, 'origin');
      expect(rows).to.eql([
        { key: 'origin.app', url: 'https://app.example.com' },
        { key: 'origin.cdn.default', url: 'https://cdn.example.com' },
        { key: 'origin.cdn.video', url: 'https://video.cdn.example.com' },
      ]);
    });
  });
});
