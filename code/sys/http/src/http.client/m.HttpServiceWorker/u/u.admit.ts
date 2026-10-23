import type { t } from '../../common.ts';
import { snapshotHref } from './u.input.ts';

const UNKNOWN = Object.freeze({ kind: 'unsupported', reason: 'unknown-context' } as const);
const UNSUPPORTED = Object.freeze({ kind: 'unsupported', reason: 'unsupported-protocol' } as const);
const INVALID = Object.freeze({ kind: 'failed', reason: 'invalid-url' } as const);
const ABSOLUTE_HTTP = /^https?:\/\//i;
const IPV4_LOOPBACK = /^127(?:\.\d{1,3}){3}$/;
const IPV6_EMBEDDED_IPV4_LOOPBACK = /^\[::(?:ffff:)?7f[0-9a-f]{2}:[0-9a-f]{1,4}\]$/;

/** Classify one deployment context under the canonical fail-closed worker policy. */
export const admit: t.HttpServiceWorker.Admission.Method = (input) => {
  try {
    const snapshot = snapshotHref(input);
    if (snapshot.kind === 'unknown') return UNKNOWN;
    if (snapshot.kind === 'invalid') return INVALID;

    const url = new URL(snapshot.href);
    if (!(url.protocol === 'http:' || url.protocol === 'https:')) return UNSUPPORTED;
    if (!ABSOLUTE_HTTP.test(snapshot.href)) return INVALID;

    const origin = url.origin as t.StringUrl;
    if (isLoopbackHostname(url.hostname)) {
      return Object.freeze({ kind: 'denied', reason: 'loopback', origin });
    }
    if (url.protocol !== 'https:') {
      return Object.freeze({ kind: 'denied', reason: 'non-https', origin });
    }

    return Object.freeze({ kind: 'admitted', deployment: 'https-non-loopback', origin });
  } catch {
    return INVALID;
  }
};

/**
 * Test the URL parser's canonical hostname once.
 *
 * The parser normalizes alternate IPv4 spellings and IPv6 compression before this runs.
 * Embedded IPv4 loopback covers canonical IPv4-mapped and deprecated compatible IPv6 forms.
 */
function isLoopbackHostname(input: string): boolean {
  const hostname = input.toLowerCase().replace(/\.+$/, '');
  return (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    IPV4_LOOPBACK.test(hostname) ||
    hostname === '[::1]' ||
    IPV6_EMBEDDED_IPV4_LOOPBACK.test(hostname)
  );
}
