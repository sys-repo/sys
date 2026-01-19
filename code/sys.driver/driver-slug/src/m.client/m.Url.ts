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

  playbackFilename(docid) {
    return `slug.${SlugUrl.clean(docid)}.playback.json`;
  },
};
