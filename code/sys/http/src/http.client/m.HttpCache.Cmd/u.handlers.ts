import { type t } from './common.ts';

/**
 * Built-in command handlers.
 */
export const Handlers: t.HttpCacheCmdHandlersLib = {
  clear(args) {
    const CACHE_ASSETS = `${args.pkg.name}:asset-files`;
    const CACHE_MEDIA = `${args.pkg.name}:media-files`;

    return async (payload) => {
      const scope = payload.scope ?? 'pkg';
      const names = scope === 'all' ? await caches.keys() : [CACHE_ASSETS, CACHE_MEDIA];
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

    return async (payload) => {
      const scope = payload.scope ?? 'pkg';
      const allNames = await caches.keys();
      const names =
        scope === 'all'
          ? allNames
          : allNames.filter((name) => name === CACHE_ASSETS || name === CACHE_MEDIA);

      const cachesInfo = await Promise.all(
        names.map(async (name) => {
          const cache = await caches.open(name);
          const entries = (await cache.keys()).length;
          const kind = name === CACHE_ASSETS ? 'asset' : name === CACHE_MEDIA ? 'media' : 'other';
          const info: t.HttpCacheCmdInfoCache = { name, kind, entries };
          return info;
        }),
      );

      const totalEntries = cachesInfo.reduce((acc, next) => acc + next.entries, 0);
      return {
        ok: true,
        at: Date.now(),
        scope,
        totals: { caches: cachesInfo.length, entries: totalEntries },
        caches: cachesInfo,
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
