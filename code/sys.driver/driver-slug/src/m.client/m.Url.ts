import type { t } from './common.ts';

export const SlugUrl: t.SlugClientUrlLib = {
  clean(docid) {
    return String(docid)
      .trim()
      .replace(/^crdt\:/, '');
  },

  assetsFilename(cleanDocid) {
    return `slug.${cleanDocid}.assets.json`;
  },

  playbackFilename(cleanDocid) {
    return `slug.${cleanDocid}.playback.json`;
  },
};
