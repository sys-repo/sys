import { describe, expect, it, type t } from '../-test.ts';
import { UserAgent } from './mod.ts';

describe('UserAgent', () => {
  /**
   * https://useragents.io
   */
  const EXAMPLE = {
    apple: {
      macos: `'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36'`,
      iphone: `Mozilla/5.0 (iPhone; CPU iPhone OS 11_1_8; like Mac OS X) AppleWebKit/536.12 (KHTML, like Gecko) Chrome/48.0.1407.194 Mobile Safari/535.5`,
      ipadFirefox: `Mozilla/5.0 (iPad; CPU OS 14_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/126.0 Mobile/15E148 Safari/605.1.15`,
      ipadSafari: `Mozilla/5.0 (iPad; CPU OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1`,
      firefox: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:126.0) Gecko/20100101 Firefox/126.0`,
    },
    posix: {
      linux: `Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.2530.106 Safari/537.36`,
      ubuntu: `Mozilla/5.0 (X11; U; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/102.0.5051.149 Chrome/102.0.5051.149 Safari/537.36`,
      firefox: `Mozilla/5.0 (X11; Linux x86_64; rv:126.0) Gecko/20100101 Firefox/126.0`,
    },
    windows: {
      windows10: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0`,
      firefox: `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0`,
    },
    android: {
      chrome: `Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.165 Mobile Safari/537.36`,
      firefox: `Mozilla/5.0 (Android 14; Mobile; LG-M255; rv:126.0) Gecko/126.0 Firefox/126.0`,
      tablet: `Mozilla/5.0 (Linux; Android 12; SM-X906C Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/80.0.3987.119 Mobile Safari/537.36`,
    },
  } as const;

  it('parses string', () => {
    const res = UserAgent.parse(EXAMPLE.apple.macos);
    expect(res.os.name).to.eql('macOS');
    expect(res.browser.name).to.eql('Chrome');
    expect(res.device.vendor).to.eql('Apple');
  });

  it('navigator.userAgent ← "Deno"', () => {
    const ua = `Deno/${Deno.version.deno}`;
    expect(navigator.userAgent).to.eql(ua);
  });

  describe('current (cache)', () => {
    it('UserAgent.current (lazy evaluation → cached)', () => {
      const res = UserAgent.current;
      expect(res).to.not.equal(UserAgent.parse(navigator.userAgent));
      expect(res).to.equal(UserAgent.current); // NB: same instance, lazily parsed.
    });
  });

  describe('flags', () => {
    const assertIs = (res: t.UserAgent, expectedIs: Partial<t.UserAgentFlags>) => {
      UserAgent.flags.forEach((key) => {
        const expected = (expectedIs as any)[key] ?? false;
        const actual = (res.is as any)[key];
        expect(actual).to.eql(expected, `key:"${key}" should be ${expected}`);
      });
    };

    it('is: apple/macos', () => {
      const ua = UserAgent.parse(EXAMPLE.apple.macos);
      expect(ua.os.kind === 'macOS').to.be.true;
      assertIs(ua, { macOS: true });
    });

    it('is: apple/iphone', () => {
      const test = (input: string) => {
        const ua = UserAgent.parse(input);
        expect(ua.os.kind === 'iOS').to.be.true;
        assertIs(ua, { macOS: false, iOS: true, iPhone: true, mobile: true });
      };
      test(EXAMPLE.apple.iphone);
    });

    it('is: apple/ipad', () => {
      const test = (input: string) => {
        const ua = UserAgent.parse(input);
        expect(ua.os.kind === 'iOS').to.be.true;
        assertIs(ua, { macOS: false, iOS: true, iPad: true, tablet: true });
      };
      test(EXAMPLE.apple.ipadFirefox);
      test(EXAMPLE.apple.ipadSafari);
    });

    it('is: posix/linux', () => {
      const ua = UserAgent.parse(EXAMPLE.posix.linux);
      expect(ua.os.kind === 'posix').to.be.true;
      assertIs(ua, { posix: true });
    });

    it('is: posix/ubuntu', () => {
      const ua = UserAgent.parse(EXAMPLE.posix.ubuntu);
      expect(ua.os.kind === 'posix').to.be.true;
      assertIs(ua, { posix: true });
    });

    it('is: android/mobile', () => {
      const test = (input: string) => {
        const ua = UserAgent.parse(input);
        expect(ua.os.kind === 'android').to.be.true;
        assertIs(ua, { android: true, mobile: true });
      };
      test(EXAMPLE.android.chrome);
      test(EXAMPLE.android.firefox);
    });

    it('is: android/tablet', () => {
      const test = (input: string) => {
        const ua = UserAgent.parse(input);
        expect(ua.os.kind === 'android').to.be.true;
        assertIs(ua, { android: true, tablet: true });
      };
      test(EXAMPLE.android.tablet);
    });

    it('is: windows', () => {
      const ua = UserAgent.parse(EXAMPLE.windows.windows10);
      expect(ua.os.kind === 'windows').to.be.true;
      assertIs(ua, { windows: true });
    });

    it('is: chromium (variants)', () => {
      const a = UserAgent.parse(EXAMPLE.windows.windows10);
      const b = UserAgent.parse(EXAMPLE.apple.macos);
      const c = UserAgent.parse(EXAMPLE.posix.ubuntu);
      const d = UserAgent.parse(EXAMPLE.apple.ipadSafari);
      [a, b, c].forEach((ua) => {
        expect(ua.engine.name).to.eql('Blink');
        expect(ua.is.chromium).to.eql(true);
      });
      expect(d.is.chromium).to.eql(false);
    });

    it('is: firefox', () => {
      const a = UserAgent.parse(EXAMPLE.windows.firefox);
      const b = UserAgent.parse(EXAMPLE.apple.firefox);
      const c = UserAgent.parse(EXAMPLE.posix.firefox);
      const d = UserAgent.parse(EXAMPLE.apple.macos);
      [a, b, c].forEach((ua) => expect(ua.is.firefox).to.eql(true));
      expect(d.is.firefox).to.eql(false);
    });
  });
});
