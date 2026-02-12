import { Cmd } from '@sys/event/cmd';
import { type t, Is, Log, Rx } from './common.ts';

/**
 * HTTP cache command namespace.
 *
 * Exposes stable command identifiers and a typed `Cmd.make` wrapper for the
 * `http.cache.clear` command set. This module is intentionally side-effect
 * free and does not perform cache operations directly.
 */
export const CacheCmd: t.HttpCacheCmdLib = {
  NS: 'http.cache',
  CONNECT: 'http.cache.cmd.connect',
  CLEAR: 'http.cache.clear',
  Handlers: {
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
  },
  make(args = {}) {
    const ns = args.ns ?? CacheCmd.NS;
    return Cmd.make<
      t.HttpCacheCmdName,
      t.HttpCacheCmdPayloadMap,
      t.HttpCacheCmdResultMap,
      t.HttpCacheCmdEventMap
    >({ ns });
  },
  listen(args) {
    const { target, clear } = args;
    const kind = args.kind ?? CacheCmd.CONNECT;
    const silent = args.silent ?? true;
    const log = Log.logger('Http.Cache.Cmd');
    const hosts = new Set<t.Lifecycle>();
    const life = Rx.lifecycle();

    const onMessage = (event: MessageEvent) => {
      const data = event.data as { kind?: unknown; ns?: unknown } | undefined;
      if (data?.kind !== kind) return;

      const endpoint = event.ports?.[0];
      if (!endpoint) return;

      const ns = Is.string(data?.ns) ? data.ns : args.ns;
      if (!silent) log('connect', { kind, ns: ns ?? CacheCmd.NS });
      const cmd = CacheCmd.make({ ns });
      const host = cmd.host(endpoint, {
        [CacheCmd.CLEAR]: async (payload) => {
          if (!silent) log('clear:start', payload);
          const result = await clear(payload);
          if (!silent) log('clear:done', { total: result.total, ok: result.ok });
          return result;
        },
      });
      hosts.add(host);
      host.dispose$.subscribe(() => hosts.delete(host));
    };

    target.addEventListener('message', onMessage);
    target.start?.();
    life.dispose$.subscribe(() => {
      target.removeEventListener('message', onMessage);
      for (const host of hosts) host.dispose();
      hosts.clear();
    });

    return life;
  },
};
