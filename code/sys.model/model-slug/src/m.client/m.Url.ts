import type { t } from './common.ts';

export const SlugUrl: t.SlugClientUrlLib = {
  clean(docid) {
    return String(docid)
      .trim()
      .replace(/^crdt\:/, '');
  },

  assetsFilename(docid) {
    return `slug.${SlugUrl.clean(docid)}.assets.json`;
  },

  treeAssetsFilename(docid) {
    return `slug-tree.${SlugUrl.clean(docid)}.assets.json`;
  },

  playbackFilename(docid) {
    return `slug.${SlugUrl.clean(docid)}.playback.json`;
  },

  treeFilename(docid) {
    return `slug-tree.${SlugUrl.clean(docid)}.json`;
  },

  fileContentFilename(hash) {
    return `${hash}.json`;
  },

  isAbsoluteHref(href = '') {
    return href.startsWith('http://') || href.startsWith('https://');
  },
};
