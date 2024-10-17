import UAParser from 'ua-parser-js';
import type { t } from '../common.ts';

type P = UAParser.IResult;

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
export const UserAgent: t.UserAgentLib = {
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
    const parser = UAParser((input || '').trim());
    const { browser, engine, os, device } = parser;

    const str = wrangle.string;
    const is = wrangle.flags(parser);

    return {
      is,
      browser: {
        name: str(browser.name),
        version: str(browser.version),
        major: str(browser.major),
      },
      engine: {
        name: str(engine.name),
        version: str(engine.version),
      },
      os: {
        kind: wrangle.os(parser),
        name: str(os.name),
        version: str(os.version),
      },
      device: {
        vendor: str(device.vendor),
        model: str(device.model),
        type: str(device.type),
      },
    };
  },
};

/**
 * Helpers
 */
const wrangle = {
  string(input?: string): string {
    return (input || '').trim();
  },

  os(parser: P, flags?: t.UserAgentFlags): t.UserAgentOSKind {
    const is = flags ?? wrangle.flags(parser);
    if (is.iOS || is.iPad || is.iPhone) return 'iOS';
    if (is.macOS) return 'macOS';
    if (is.windows) return 'windows';
    if (is.posix) return 'posix';
    if (is.android) return 'android';
    return 'UNKNOWN';
  },

  flags(parser: P): t.UserAgentFlags {
    const { os, device } = parser;
    const name = wrangle.string(os.name);

    let macOS = name === 'Mac OS';
    let iOS = name === 'iOS';
    let iPad = device.model === 'iPad';
    let iPhone = device.model === 'iPhone';
    const mobile = device.type === 'mobile';
    const tablet = device.type === 'tablet';

    if (macOS) {
      if (iPad || iPhone) iOS = true;
      if (iOS) macOS = false;
    }

    return {
      posix: ['Linux', 'Ubuntu'].includes(name),
      windows: name === 'Windows',
      android: name === 'Android',
      macOS,
      iOS,
      iPad,
      iPhone,
      mobile,
      tablet,
    };
  },
} as const;
