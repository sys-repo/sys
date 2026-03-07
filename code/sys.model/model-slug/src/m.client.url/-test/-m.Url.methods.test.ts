import { describe, expect, it } from '../../-test.ts';

import type { t } from '../common.ts';
import { SlugUrl } from '../mod.ts';

describe('SlugUrl (root)', () => {
  describe('filenames', () => {
    const docid = 'crdt:hello-world' as t.StringId;

    it('assetsFilename', () => {
      expect(SlugUrl.assetsFilename(docid)).to.eql('slug.hello-world.assets.json');
    });

    it('treeAssetsFilename', () => {
      expect(SlugUrl.treeAssetsFilename(docid)).to.eql('slug-tree.hello-world.assets.json');
    });

    it('playbackFilename', () => {
      expect(SlugUrl.playbackFilename(docid)).to.eql('slug.hello-world.playback.json');
    });

    it('treeFilename', () => {
      expect(SlugUrl.treeFilename(docid)).to.eql('slug-tree.hello-world.json');
    });

    it('fileContentFilename', () => {
      expect(SlugUrl.fileContentFilename('sha256-abc123')).to.eql('sha256-abc123.json');
    });
  });
});
