import { type t, D, Is, Log, Rx } from './common.ts';
import { make } from './u.make.ts';

/**
 * Host command connections from handshake messages on a message target.
 */
export const listen: t.HttpCacheCmdLib['listen'] = (args) => {
  const { target, clear } = args;
  const kind = args.kind ?? D.CONNECT;
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
    if (!silent) log('connect', { kind, ns: ns ?? D.NS });
    const cmd = make({ ns });
    const host = cmd.host(endpoint, {
      [D.CLEAR]: async (payload) => {
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
};
