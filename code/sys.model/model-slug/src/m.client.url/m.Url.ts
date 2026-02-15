import type { t } from './common.ts';
import { Composition } from './m.Composition.ts';
import { Util } from './m.Util.ts';

export const SlugUrl: t.SlugUrlLib = {
  Composition,
  Util,

  assetsFilename(docid) {
    return `slug.${Util.cleanDocid(docid)}.assets.json`;
  },

  treeAssetsFilename(docid) {
    return `slug-tree.${Util.cleanDocid(docid)}.assets.json`;
  },

  playbackFilename(docid) {
    return `slug.${Util.cleanDocid(docid)}.playback.json`;
  },

  treeFilename(docid) {
    return `slug-tree.${Util.cleanDocid(docid)}.json`;
  },

  fileContentFilename(hash) {
    return `${hash}.json`;
  },
};
