import { type t } from './common.ts';
import { Host } from './u.host.ts';

export const toUrl: t.NetLib['toUrl'] = (addr, kind = 'http') => {
  const { hostname: rawHost, port } = addr;
  const hostname = Host.toClient(rawHost);
  const scheme = schemeFor(kind, Host.isLoopback(hostname));
  const portPart = port === defaultPort(scheme) ? '' : `:${port}`;

  return `${scheme}://${Host.urlHost(hostname)}${portPart}`;
};

function schemeFor(kind: 'http' | 'ws', isLoopback: boolean) {
  const secure = !isLoopback;
  return kind === 'ws' ? (secure ? 'wss' : 'ws') : secure ? 'https' : 'http';
}

function defaultPort(scheme: 'http' | 'https' | 'ws' | 'wss') {
  return scheme === 'http' || scheme === 'ws' ? 80 : 443;
}
