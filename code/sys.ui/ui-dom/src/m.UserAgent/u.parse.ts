import type { t } from '../common.ts';

/**
 * Minimal local user-agent parser used to keep `@sys/ui-dom/user-agent`
 * self-contained and free of `ua-parser-js`.
 *
 * Why this exists:
 * - the repo only consumes a narrow subset of UA data
 * - the previous `ua-parser-js` dependency was creating avoidable friction in
 *   published-consumer builds
 * - this keeps the wrapper stable while removing a high-friction dependency
 *
 * What this intentionally is not:
 * - not a full browser/device taxonomy
 * - not a general-purpose UA parsing library
 * - not guaranteed to classify every UA string seen in the wild
 *
 * Scope:
 * - preserve the current `@sys/ui-dom/user-agent` contract used by the repo
 * - support the tested Apple / Android / Windows / posix examples
 * - retain the lightweight browser flags the UI actually depends on
 *
 * If broader or more standards-driven UA coverage is needed later, the likely
 * follow-up is to replace this with a smaller maintained library such as
 * `bowser`, after first tightening the wrapper contract to the fields the app
 * truly needs.
 *
 * Refs:
 * - MDN User-Agent header:
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent
 * - Bowser:
 *   https://github.com/lancedikson/bowser
 *   https://www.npmjs.com/package/bowser
 */
export function parseUserAgent(input: t.UserAgentString): t.UserAgent {
  const parsed = wrangle.parse((input || '').trim());
  const is = wrangle.flags(parsed);

  return {
    is,
    browser: {
      name: parsed.browser.name,
      version: parsed.browser.version,
      major: parsed.browser.major,
    },
    engine: {
      name: parsed.engine.name,
      version: parsed.engine.version,
    },
    os: {
      kind: wrangle.os(is),
      name: parsed.os.name,
      version: parsed.os.version,
    },
    device: {
      vendor: parsed.device.vendor,
      model: parsed.device.model,
      type: parsed.device.type,
    },
  };
}

const wrangle = {
  string(input?: string): string {
    return (input || '').trim();
  },

  major(version: string): string {
    return version.split('.').filter(Boolean)[0] ?? '';
  },

  version(input: string, pattern: RegExp): string {
    const match = input.match(pattern);
    return wrangle.string(match?.[1]).replaceAll('_', '.');
  },

  parse(input: string) {
    const text = wrangle.string(input);
    const os = wrangle.parseOs(text);
    const browser = wrangle.parseBrowser(text);
    const engine = wrangle.parseEngine(browser.name, text);
    const device = wrangle.parseDevice(text, os.name);
    return { os, browser, engine, device };
  },

  parseOs(input: string) {
    if (/(iPhone|iPad|CPU (?:iPhone )?OS)/i.test(input)) {
      return {
        name: 'iOS',
        version: wrangle.version(input, /(?:CPU (?:iPhone )?OS|OS)\s+([0-9_]+)/i),
      };
    }
    if (/Android/i.test(input)) {
      return {
        name: 'Android',
        version: wrangle.version(input, /Android\s+([0-9._]+)/i),
      };
    }
    if (/Windows NT/i.test(input)) {
      return {
        name: 'Windows',
        version: wrangle.version(input, /Windows NT\s+([0-9.]+)/i),
      };
    }
    if (/Mac OS X/i.test(input)) {
      return {
        name: 'macOS',
        version: wrangle.version(input, /Mac OS X\s+([0-9_]+)/i),
      };
    }
    if (/Ubuntu/i.test(input)) return { name: 'Ubuntu', version: '' };
    if (/Linux/i.test(input)) return { name: 'Linux', version: '' };
    return { name: '', version: '' };
  },

  parseBrowser(input: string) {
    const fxios = wrangle.version(input, /FxiOS\/([0-9.]+)/i);
    if (fxios) return { name: 'FxiOS', version: fxios, major: wrangle.major(fxios) };

    const firefox = wrangle.version(input, /Firefox\/([0-9.]+)/i);
    if (firefox) return { name: 'Firefox', version: firefox, major: wrangle.major(firefox) };

    const edge = wrangle.version(input, /Edg\/([0-9.]+)/i);
    if (edge) return { name: 'Edge', version: edge, major: wrangle.major(edge) };

    const chrome = wrangle.version(input, /Chrome\/([0-9.]+)/i);
    if (chrome) return { name: 'Chrome', version: chrome, major: wrangle.major(chrome) };

    const safari = wrangle.version(input, /Version\/([0-9.]+)/i);
    if (safari && /Safari\//i.test(input)) {
      return { name: 'Safari', version: safari, major: wrangle.major(safari) };
    }

    return { name: '', version: '', major: '' };
  },

  parseEngine(browserName: string, input: string) {
    const firefox = browserName === 'Firefox';
    const chromium = ['Chrome', 'Edge'].includes(browserName);
    if (firefox) {
      const version = wrangle.version(input, /rv:([0-9.]+)/i) || wrangle.version(input, /Gecko\/([0-9.]+)/i);
      return { name: 'Gecko', version };
    }
    if (chromium) return { name: 'Blink', version: '' };
    if (browserName === 'Safari') return { name: 'WebKit', version: wrangle.version(input, /AppleWebKit\/([0-9.]+)/i) };
    return { name: '', version: '' };
  },

  parseDevice(input: string, osName: string) {
    const iPad = /iPad/i.test(input);
    const iPhone = /iPhone/i.test(input);
    const mac = /Macintosh/i.test(input);
    const samsung = input.match(/\b(SM-[A-Z0-9]+)\b/i)?.[1] ?? '';
    const lg = input.match(/\b(LG-[A-Z0-9]+)\b/i)?.[1] ?? '';
    const vendor =
      iPad || iPhone || mac ? 'Apple'
      : samsung ? 'Samsung'
      : lg ? 'LG'
      : '';
    const model =
      iPad ? 'iPad'
      : iPhone ? 'iPhone'
      : mac ? 'Mac'
      : samsung || lg;

    let type = '';
    if (iPad) type = 'tablet';
    else if (iPhone) type = 'mobile';
    else if (osName === 'Android') {
      if (/Tablet/i.test(input) || /^SM-X/i.test(model)) type = 'tablet';
      else if (/Mobile/i.test(input)) type = 'mobile';
    }

    return { vendor, model, type };
  },

  os(is: t.UserAgentFlags): t.UserAgentOSKind {
    if (is.iOS || is.iPad || is.iPhone) return 'iOS';
    if (is.macOS) return 'macOS';
    if (is.windows) return 'windows';
    if (is.posix) return 'posix';
    if (is.android) return 'android';
    return 'UNKNOWN';
  },

  flags(parsed: {
    os: { name: string };
    browser: { name: string };
    engine: { name: string };
    device: { model: string; type: string };
  }): t.UserAgentFlags {
    const { os, device, engine, browser } = parsed;
    const name = wrangle.string(os.name);

    let macOS = name === 'macOS';
    let iOS = name === 'iOS';
    const iPad = device.model === 'iPad';
    const iPhone = device.model === 'iPhone';
    const mobile = device.type === 'mobile';
    const tablet = device.type === 'tablet';

    if (iPad || iPhone) iOS = true;
    if (iOS) macOS = false;

    const chromium = engine.name === 'Blink' && name !== 'Android' && name !== 'iOS';
    const firefox = browser.name === 'Firefox';

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
      chromium,
      firefox,
    };
  },
} as const;
