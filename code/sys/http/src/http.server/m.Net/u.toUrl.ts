import { type t } from './common.ts';

export const toUrl: t.NetLib['toUrl'] = (addr, kind = 'http') => {
  const { hostname: rawHost, port } = addr;

  // 1) Normalize host used in the URL:
  const isWildcard = rawHost === '0.0.0.0' || rawHost === '::';
  const hostForUrl = isWildcard ? '127.0.0.1' : rawHost;

  // 2) Loopback test MUST use the normalized host:
  const isLoopback =
    hostForUrl === '127.0.0.1' || hostForUrl === 'localhost' || hostForUrl === '::1';

  // 3) IPv6 needs brackets:
  const needsBrackets = hostForUrl.includes(':') && !hostForUrl.startsWith('[');
  const host = needsBrackets ? `[${hostForUrl}]` : hostForUrl;

  // 4) Choose scheme (non-loopback ⇒ secure):
  const secure = !isLoopback;
  const scheme = kind === 'ws' ? (secure ? 'wss' : 'ws') : secure ? 'https' : 'http';

  // 5) Elide default ports:
  const defaultPort = scheme === 'http' || scheme === 'ws' ? 80 : 443;
  const portPart = port === defaultPort ? '' : `:${port}`;

  return `${scheme}://${host}${portPart}`;
};
