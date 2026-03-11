import type { UserAgentLib } from './t.ts';
import { parseUserAgent } from './u.parse.ts';

import type { t } from '../common.ts';

let _current: t.UserAgent | undefined; // NB: singleton reference.
const kinds: t.UserAgentOSKind[] = ['macOS', 'iOS', 'windows', 'posix'];
const flags: t.UserAgentFlag[] = [
  'android',
  'iOS',
  'iPad',
  'iPhone',
  'macOS',
  'posix',
  'windows',
  'mobile',
  'tablet',
];

/**
 * Ref:
 *    https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent
 *
 *    Summary:
 *    "The User-Agent request header is a characteristic string that lets
 *     servers and network peers identify the application, operating system,
 *     vendor, and/or version of the requesting user agent.""
 */
export const UserAgent: UserAgentLib = {
  os: { kinds },
  flags,

  /**
   * Parse the browser user-agent string.
   */
  get current() {
    if (_current) return _current;
    const text = typeof navigator === 'object' ? navigator.userAgent : '';
    _current = UserAgent.parse(text);
    return _current;
  },

  /**
   * Convert a browser user-agent string into a structured object.
   * Example:
   *
   *    const ua = UserAgent.parse(navigator.userAgent);
   */
  parse(input: t.UserAgentString): t.UserAgent {
    return parseUserAgent(input);
  },
};
