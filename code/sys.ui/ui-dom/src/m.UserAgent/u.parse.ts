import Bowser from 'bowser';
import type { t } from './common.ts';

/**
 * Bowser-backed user-agent adapter that keeps the public `@sys/ui-dom/user-agent`
 * contract intentionally smaller than the underlying parser surface.
 *
 * Why this exists:
 * - the repo only consumes a narrow subset of UA data
 * - Bowser provides the maintained parsing logic
 * - this wrapper preserves the repo's reduced semantic contract
 *
 * Scope:
 * - preserve the current reduced `@sys/ui-dom/user-agent` contract used by the repo
 * - support the tested Apple / Android / Windows / posix examples
 * - retain the lightweight browser flags the UI actually depends on
 *
 * Refs:
 * - MDN User-Agent header:
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent
 * - Bowser:
 *   https://github.com/lancedikson/bowser
 *   https://www.npmjs.com/package/bowser
 */
export function parseUserAgent(input: string): t.UserAgent {
  const parsed = wrangle.parse((input || '').trim());
  const is = wrangle.flags(parsed);

  return {
    is,
    os: {
      name: parsed.os.name,
    },
  };
}

const wrangle = {
  string(input?: string): string {
    return (input || '').trim();
  },

  parse(input: string) {
    const text = wrangle.string(input);
    const parser = Bowser.getParser(text);
    const result = parser.getResult();
    const osName = wrangle.osName(text, result.os.name);
    const browserName = wrangle.browserName(result.browser.name);
    const model = wrangle.deviceModel(text, result.platform.model);
    const type = wrangle.deviceType(text, result.platform.type, model, osName);

    return {
      os: { name: osName },
      browser: { name: browserName },
      device: { model, type },
    };
  },

  osName(text: string, input?: string) {
    if (/Ubuntu/i.test(text)) return 'Ubuntu';

    const name = wrangle.string(input);
    if (name === 'MacOS') return 'macOS';
    if (name === 'macOS') return 'macOS';
    if (name === 'Windows') return 'Windows';
    if (name === 'Android') return 'Android';
    if (name === 'iOS') return 'iOS';
    if (name === 'Ubuntu') return 'Ubuntu';
    if (name === 'Linux') return 'Linux';
    return name;
  },

  browserName(input?: string) {
    const name = wrangle.string(input);
    if (name === 'Microsoft Edge') return 'Edge';
    return name;
  },

  deviceModel(input: string, model?: string) {
    const iPad = /iPad/i.test(input);
    const iPhone = /iPhone/i.test(input);
    if (iPad) return 'iPad';
    if (iPhone) return 'iPhone';
    return wrangle.string(model);
  },

  deviceType(input: string, platformType?: string, model?: string, osName?: string) {
    if (/iPad/i.test(input)) return 'tablet';
    if (/iPhone/i.test(input)) return 'mobile';

    const type = wrangle.string(platformType).toLowerCase();
    if (type === 'tablet' || type === 'mobile' || type === 'desktop') return type;

    if (osName === 'Android') {
      if (/Tablet/i.test(input) || /^SM-X/i.test(model ?? '')) return 'tablet';
      if (/Mobile/i.test(input)) return 'mobile';
    }

    return '';
  },

  flags(parsed: {
    os: { name: string };
    browser: { name: string };
    device: { model: string; type: string };
  }): t.UserAgentFlags {
    const { os, device, browser } = parsed;
    const name = wrangle.string(os.name);

    let macOS = name === 'macOS';
    let iOS = name === 'iOS';
    const iPad = device.model === 'iPad';
    const iPhone = device.model === 'iPhone';

    if (iPad || iPhone) iOS = true;
    if (iOS) macOS = false;

    const apple = macOS || iOS || iPad || iPhone;
    const chromium = ['Chrome', 'Chromium', 'Edge'].includes(browser.name) &&
      name !== 'Android' &&
      name !== 'iOS';
    const firefox = browser.name === 'Firefox';

    return {
      apple,
      macOS,
      iOS,
      iPad,
      iPhone,
      chromium,
      firefox,
    };
  },
} as const;
