import { describe, expect, it } from '../../-test.ts';
import { JsrUrl } from '../../m.Url.Jsr/mod.ts';
import { Url, isHttpUrl } from '../mod.ts';

describe('Url', () => {
  it('API', async () => {
    const m = await import('@sys/std/url');
    expect(m.Url).to.equal(Url);
    expect(m.JsrUrl).to.equal(JsrUrl);
  });

  describe('isHttpUrl', () => {
    it('true for HttpUrl from Url.parse', () => {
      const value = Url.parse('https://example.com/foo');
      expect(isHttpUrl(value)).to.eql(true);

      // Type narrowing: within this branch, value is HttpUrl.
      if (isHttpUrl(value)) {
        const url = value.toURL();
        expect(url).to.be.instanceOf(URL);
        expect(url.href).to.eql('https://example.com/foo');
      }
    });

    it('false for plain strings', () => {
      expect(isHttpUrl('https://example.com/foo')).to.eql(false);
      expect(isHttpUrl('/relative/path')).to.eql(false);
      expect(isHttpUrl('not-a-url')).to.eql(false);
    });

    it('false for URL instances', () => {
      const url = new URL('https://example.com/foo');
      expect(isHttpUrl(url)).to.eql(false);
    });

    it('false for non-object primitives', () => {
      expect(isHttpUrl(undefined)).to.eql(false);
      expect(isHttpUrl(null)).to.eql(false);
      expect(isHttpUrl(123)).to.eql(false);
      expect(isHttpUrl(true)).to.eql(false);
    });

    it('false for non-HttpUrl objects and arrays', () => {
      expect(isHttpUrl({})).to.eql(false);
      expect(isHttpUrl({ href: 'https://example.com' })).to.eql(false);
      expect(isHttpUrl([])).to.eql(false);
      expect(
        isHttpUrl({
          ok: true,
          raw: 'https://example.com',
          // missing methods: join, toString, toURL
        }),
      ).to.eql(false);
    });
  });
});
