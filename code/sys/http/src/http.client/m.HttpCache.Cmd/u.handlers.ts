import { type t, Is } from './common.ts';

/**
 * Built-in command handlers.
 */
export const Handlers: t.HttpCacheCmdHandlersLib = {
  clear(args) {
    const CACHE_ASSETS = `${args.pkg.name}:asset-files`;
    const CACHE_MEDIA = `${args.pkg.name}:media-files`;
    const CACHE_MEDIA_RANGE = `${args.pkg.name}:media-range-files`;

    return async (payload) => {
      const scope = payload.scope ?? 'pkg';
      const names =
        scope === 'all' ? await caches.keys() : [CACHE_ASSETS, CACHE_MEDIA, CACHE_MEDIA_RANGE];
      const deleted: t.StringKey[] = [];

      for (const name of names) {
        const ok = await caches.delete(name);
        if (ok) deleted.push(name);
      }

      return {
        ok: true,
        deleted,
        total: deleted.length,
        at: Date.now(),
      };
    };
  },

  info(args) {
    const CACHE_ASSETS = `${args.pkg.name}:asset-files`;
    const CACHE_MEDIA = `${args.pkg.name}:media-files`;
    const CACHE_MEDIA_RANGE = `${args.pkg.name}:media-range-files`;

    return async (payload) => {
      const scope = payload.scope ?? 'pkg';
      const allNames = await caches.keys();
      const names =
        scope === 'all'
          ? allNames
          : allNames.filter(
              (name) => name === CACHE_ASSETS || name === CACHE_MEDIA || name === CACHE_MEDIA_RANGE,
            );

      const cachesInfo = await Promise.all(
        names.map(async (name) => {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          const kind =
            name === CACHE_ASSETS
              ? 'asset'
              : name === CACHE_MEDIA
                ? 'media'
                : name === CACHE_MEDIA_RANGE
                  ? 'media-range'
                  : 'other';

          const meta = kind === 'media-range' ? await wrangle.mediaRangeMeta(cache) : undefined;
          const entries =
            kind === 'media-range' ? wrangle.dataEntryCount(keys.length, meta) : keys.length;
          const info: t.HttpCacheCmdInfoCache = {
            name,
            kind,
            entries,
            ...(Is.number(meta?.bytes) ? { bytes: meta.bytes } : {}),
            ...(Is.number(meta?.metaEntries) ? { metaEntries: meta.metaEntries } : {}),
          };
          return info;
        }),
      );

      const totalEntries = cachesInfo.reduce((acc, next) => acc + next.entries, 0);
      const totalBytes = cachesInfo.reduce((acc, next) => acc + (next.bytes ?? 0), 0);
      const mediaRangeRows = cachesInfo.filter((info) => info.kind === 'media-range');
      const diagnostics: t.HttpCacheCmdInfoResult['diagnostics'] | undefined =
        mediaRangeRows.length > 0
          ? {
              mediaRange: {
                caches: mediaRangeRows.length,
                entries: mediaRangeRows.reduce((acc, next) => acc + next.entries, 0),
                bytes: mediaRangeRows.reduce((acc, next) => acc + (next.bytes ?? 0), 0),
                metaEntries: mediaRangeRows.reduce((acc, next) => acc + (next.metaEntries ?? 0), 0),
              },
            }
          : undefined;

      return {
        ok: true,
        at: Date.now(),
        scope,
        totals: { caches: cachesInfo.length, entries: totalEntries, bytes: totalBytes },
        caches: cachesInfo,
        diagnostics,
      };
    };
  },
  all(args) {
    return {
      clear: Handlers.clear(args),
      info: Handlers.info(args),
    };
  },
};

/**
 * Helpers
 */
const wrangle = {
  META_KEY: '__sys_http_media_range_meta__',

  dataEntryCount(totalKeys: number, meta?: { metaEntries: number }) {
    if (!meta) return totalKeys;
    return Math.max(0, totalKeys - 1); // subtract metadata blob entry.
  },

  async mediaRangeMeta(cache: Cache): Promise<{ bytes: number; metaEntries: number } | undefined> {
    const res = await cache.match(wrangle.META_KEY);
    if (!res) return undefined;

    try {
      const json = (await res.json()) as {
        entries?: Record<string, { bytes?: number }>;
      };
      const rows = Object.values(json.entries ?? {});
      const bytes = rows.reduce((acc, next) => acc + (Number(next.bytes) || 0), 0);
      return { bytes, metaEntries: rows.length };
    } catch {
      return undefined;
    }
  },
} as const;
