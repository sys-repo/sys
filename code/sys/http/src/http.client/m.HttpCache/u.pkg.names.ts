import type { t } from './common.ts';

/**
 * Canonical package-cache namespace helper.
 */
export const PkgCache: t.HttpCache.Pkg.Lib = Object.freeze({
  names(pkg) {
    const name = pkg.name;
    const prefix = `${name}:`;
    const asset = `${prefix}asset-files`;
    const media = `${prefix}media-files`;
    const mediaRange = `${prefix}media-range-files`;
    const current = Object.freeze([asset, media, mediaRange]);

    return Object.freeze({
      prefix,
      asset,
      media,
      mediaRange,
      current,
      isOwned: (name) => name.startsWith(prefix),
      isCurrent: (name) => current.includes(name),
    });
  },
});
