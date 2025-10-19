import { describe, DomMock, expect, expectTypeOf, it } from '../../../-test.ts';
import { DevUrl } from '../mod.ts';
import { changeDevUrl, makeDevUrl, readDevUrl } from '../u.dev.url.ts';

describe('dev: url', () => {
  DomMock.polyfill();

  it('API', () => {
    expect(DevUrl.read).to.equal(readDevUrl);
    expect(DevUrl.change).to.equal(changeDevUrl);
    expect(DevUrl.make).to.equal(makeDevUrl);
  });

  describe('readDevUrl', () => {
    it('no ?debug → showDebug:null', () => {
      const res = readDevUrl('https://example.com/');
      expect(res).eql({ showDebug: null });
      expectTypeOf(res).toEqualTypeOf<{ readonly showDebug: boolean | null }>();
    });

    it('plain ?debug (implicit true)', () => {
      const res = readDevUrl('https://example.com/?debug');
      expect(res.showDebug).to.eql(true);
    });

    it('truthy values', () => {
      const truthy = ['1', 'true', 'yes', 'on', ''];
      for (const val of truthy) {
        const url = `https://example.com/?debug=${val}`;
        const res = readDevUrl(url);
        expect(res.showDebug).to.eql(true);
      }
    });

    it('falsy values', () => {
      const falsy = ['0', 'false', 'no', 'off'];
      for (const val of falsy) {
        const url = `https://example.com/?debug=${val}`;
        const res = readDevUrl(url);
        expect(res.showDebug).to.eql(false);
      }
    });

    it('unknown value falls back to presence (→ true)', () => {
      const res = readDevUrl('https://example.com/?debug=maybe');
      expect(res.showDebug).to.eql(true);
    });

    it('accepts URL instance', () => {
      const url = new URL('https://example.com/?debug=true');
      const res = readDevUrl(url);
      expect(res.showDebug).to.eql(true);
    });
  });

  describe('changeDevUrl', () => {
    it('adds ?debug=true', () => {
      const res = changeDevUrl('https://example.com/', { showDebug: true });
      expect(res).to.be.instanceOf(URL);
      expect(res.href).to.eql('https://example.com/?debug=true');
      expectTypeOf(res).toEqualTypeOf<URL>();
    });

    it('adds ?debug=false', () => {
      const res = changeDevUrl('https://example.com/', { showDebug: false });
      expect(res.href).to.eql('https://example.com/?debug=false');
    });

    it('removes ?debug when showDebug:null', () => {
      const res = changeDevUrl('https://example.com/?debug=true', { showDebug: null });
      expect(res.href).to.eql('https://example.com/');
    });

    it('updates existing ?debug', () => {
      const res = changeDevUrl('https://example.com/?debug=false', { showDebug: true });
      expect(res.href).to.eql('https://example.com/?debug=true');
    });

    it('leaves other params intact', () => {
      const res = changeDevUrl('https://example.com/?x=1&debug=false', { showDebug: true });
      const url = new URL(res);
      expect(url.searchParams.get('x')).to.eql('1');
      expect(url.searchParams.get('debug')).to.eql('true');
    });

    it('works with URL instance input', () => {
      const url = new URL('https://example.com/?debug=false');
      const res = changeDevUrl(url, { showDebug: true });
      expect(res).to.be.instanceOf(URL);
      expect(res.href).to.eql('https://example.com/?debug=true');
    });

    it('round-trip symmetry with readDevUrl', () => {
      const base = 'https://example.com/';
      const next = changeDevUrl(base, { showDebug: true });
      const parsed = readDevUrl(next);
      expect(parsed.showDebug).to.eql(true);
    });
  });

  describe('dev: url (mutable window instance)', () => {
    /**
     * Minimal spy for history.replaceState that records called URLs.
     * Returns a restore function and a getter for recorded hrefs.
     */
    function spyReplaceState() {
      const original = window.history.replaceState.bind(window.history);
      const calls: string[] = [];
      window.history.replaceState = (data: unknown, title: string, url?: string | URL | null) => {
        if (typeof url === 'string') calls.push(url);
        if (url instanceof URL) calls.push(url.href);
        return original(data, title, url as any);
      };
      return {
        restore: () => (window.history.replaceState = original),
        hrefs: () => calls.slice(),
        count: () => calls.length,
      };
    }

    it('reads debug: null when absent', () => {
      window.location.href = 'https://example.com/';
      const devUrl = DevUrl.make(window);
      const v = devUrl.debug;
      expect(v).to.eql(null);
      expectTypeOf(v).toEqualTypeOf<boolean | null>();
    });

    it('sets debug = true (adds ?debug=true) via replaceState', () => {
      window.location.href = 'https://example.com/';
      const spy = spyReplaceState();

      const devUrl = DevUrl.make(window);
      devUrl.debug = true;

      expect(spy.count()).to.eql(1);
      expect(window.location.href).to.eql('https://example.com/?debug=true');
      expect(devUrl.debug).to.eql(true);

      spy.restore();
    });

    it('sets debug = false (switches ?debug=true → ?debug=false)', () => {
      window.location.href = 'https://example.com/?debug=true';
      const spy = spyReplaceState();

      const devUrl = DevUrl.make(window);
      devUrl.debug = false;

      expect(window.location.href).to.eql('https://example.com/?debug=false');
      expect(devUrl.debug).to.eql(false);
      expect(spy.count()).to.eql(1);

      spy.restore();
    });

    it('sets debug = null (removes ?debug), preserving other params', () => {
      window.location.href = 'https://example.com/?debug=true&x=1';
      const spy = spyReplaceState();

      const devUrl = DevUrl.make(window);
      devUrl.debug = null;

      expect(window.location.href).to.eql('https://example.com/?x=1');
      expect(devUrl.debug).to.eql(null);
      expect(spy.count()).to.eql(1);

      spy.restore();
    });

    it('preserves unrelated query params when adding debug', () => {
      window.location.href = 'https://example.com/?x=1&y=2';
      const spy = spyReplaceState();

      const devUrl = DevUrl.make(window);
      devUrl.debug = true;

      const url = new URL(window.location.href);
      expect(url.searchParams.get('x')).to.eql('1');
      expect(url.searchParams.get('y')).to.eql('2');
      expect(url.searchParams.get('debug')).to.eql('true');

      spy.restore();
    });

    it('unknown property → throws on get and set', () => {
      window.location.href = 'https://example.com/';
      const devUrl = DevUrl.make(window) as any;

      expect(() => devUrl.foo).to.throw(/Unknown devUrl property/i);
      expect(() => {
        devUrl.foo = true;
      }).to.throw(/Unknown devUrl property/i);
    });
  });
});
