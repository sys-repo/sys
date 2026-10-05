import { type t } from './common.ts';
import { parseUserAgent } from './u.parse.ts';

let _current: t.UserAgent.Info | undefined; // NB: singleton reference.

/**
 * Ref:
 *    https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent
 *
 *    Summary:
 *    "The User-Agent request header is a characteristic string that lets
 *     servers and network peers identify the application, operating system,
 *     vendor, and/or version of the requesting user agent."
 */
export const UserAgent: t.UserAgent.Lib = {
  /**
   * Lazily parse and cache the current browser user-agent string.
   */
  get current() {
    if (_current) return _current;
    const text = typeof navigator === 'object' ? navigator.userAgent : '';
    _current = parseUserAgent(text);
    return _current;
  },
};
