import { type t, Crdt, Url } from './common.ts';

export type DevRepo = ReturnType<typeof createDevRepo>;

/**
 * Create a browser CRDT repo using the same local/dev network defaults as the
 * wider system dev harnesses.
 */
export function createDevRepo() {
  const { qs, isDev } = browserEnvironment();
  const network: t.CrdtWebNetworkArg[] = [];
  if (qs) network.push({ ws: qs });
  if (!qs && isDev) network.push({ ws: 'localhost:3030' });
  if (!qs && !isDev) network.push({ ws: 'waiheke.sync.db.team' });

  return Crdt.repo({
    storage: { database: 'dev.crdt' },
    network,
  });
}

function browserEnvironment() {
  const qs = Url.parse(location.href).toURL().searchParams.get('ws');
  const isLocalhost = location.hostname === 'localhost';
  const isDev = isLocalhost && location.port !== '8080';
  return { isDev, isLocalhost, qs } as const;
}
