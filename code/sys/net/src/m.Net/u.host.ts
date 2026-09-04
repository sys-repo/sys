import { Is } from './common.ts';

/** Internal host helpers for network address formatting and probing. */
export const Host = Object.freeze({
  ipv4: Object.freeze({
    wildcard: '0.0.0.0',
    loopback: '127.0.0.1',
  }),

  ipv6: Object.freeze({
    wildcard: '::',
    loopback: '::1',
  }),

  /** Determine whether a host is a bind wildcard rather than a routable client target. */
  isWildcard(hostname: string) {
    return hostname === Host.ipv4.wildcard || hostname === Host.ipv6.wildcard;
  },

  /** Determine whether a host is loopback using the canonical system predicate. */
  isLoopback(hostname: string) {
    return Is.localhost(`http://${Host.urlHost(hostname)}`);
  },

  /** Convert bind wildcards to a client-routable loopback host. */
  toClient(hostname: string) {
    return Host.isWildcard(hostname) ? Host.ipv4.loopback : hostname;
  },

  /** Format a hostname for use in the host segment of a URL. */
  urlHost(hostname: string) {
    return hostname.includes(':') && !hostname.startsWith('[') ? `[${hostname}]` : hostname;
  },
});
