import type { t } from './common.ts';
import { cleanDocid } from './u.ts';
import { Composition } from './m.Composition.ts';

export const SlugUrl: t.SlugUrlLib = {
  Composition,
  Util: { cleanDocid },

  assetsFilename(docid) {
    return `slug.${cleanDocid(docid)}.assets.json`;
  },

  treeAssetsFilename(docid) {
    return `slug-tree.${cleanDocid(docid)}.assets.json`;
  },

  playbackFilename(docid) {
    return `slug.${cleanDocid(docid)}.playback.json`;
  },

  treeFilename(docid) {
    return `slug-tree.${cleanDocid(docid)}.json`;
  },

  fileContentFilename(hash) {
    return `${hash}.json`;
  },
};
