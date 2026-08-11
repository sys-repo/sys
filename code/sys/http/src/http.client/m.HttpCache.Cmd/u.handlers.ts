import { PkgCache } from '../m.HttpCache/u.pkg.names.ts';
import { Is, type t } from './common.ts';

/**
 * Built-in command handlers.
 */
export const Handlers: t.HttpCacheCmd.Handlers.Lib = {
  clear(args) {
    return createClear(PkgCache.names(args.pkg));
  },

  info(args) {
    return createInfo(PkgCache.names(args.pkg));
  },

  all(args) {
    const pkg = PkgCache.names(args.pkg);
    return {
      clear: createClear(pkg),
      info: createInfo(pkg),
    };
  },
};

function createClear(pkg: t.HttpCache.Pkg.Names): t.HttpCacheCmd.Clear.Handler {
  return async (payload) => {
    const scope = payload.scope ?? 'pkg';
    const names = scope === 'all' ? await caches.keys() : pkg.current;
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
}

function createInfo(pkg: t.HttpCache.Pkg.Names): t.HttpCacheCmd.Info.Handler {
  return async (payload) => {
    const scope = payload.scope ?? 'pkg';
    const allNames = await caches.keys();
    const names = scope === 'all' ? allNames : allNames.filter(pkg.isCurrent);

    const cachesInfo = await Promise.all(
      names.map(async (name) => {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        const kind = name === pkg.asset
          ? 'asset'
          : name === pkg.media
          ? 'media'
          : name === pkg.mediaRange
          ? 'media-range'
          : 'other';

        const meta = kind === 'media-range' ? await wrangle.mediaRangeMeta(cache) : undefined;
        const entries = kind === 'media-range'
          ? wrangle.dataEntryCount(keys.length, meta)
          : keys.length;
        const info: t.HttpCacheCmd.Info.Cache = {
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
    const diagnostics: t.HttpCacheCmd.Info.Result['diagnostics'] | undefined =
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
}

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
