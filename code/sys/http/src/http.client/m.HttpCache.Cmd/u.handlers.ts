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
};
