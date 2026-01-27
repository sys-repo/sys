import { Url as UrlBase } from '@sys/immutable/url';
import { Url as UrlBaseBase } from '@sys/std/url';

import {
  type t,
  afterAll,
  beforeEach,
  describe,
  DomMock,
  expect,
  expectTypeOf,
  it,
} from '../-test.ts';
import { Url } from './mod.ts';

describe('Url', { sanitizeResources: false, sanitizeOps: false }, () => {
  DomMock.init(beforeEach, afterAll);

  it('API', async () => {
    const m = await import('@sys/ui-dom/url');
    expect(m.Url).to.equal(Url);

    // Ensure all base Url fields are preserved by reference.
    const keysStd = Object.keys(UrlBaseBase) as (keyof typeof UrlBaseBase)[];
    const keysImmutable = Object.keys(UrlBase) as (keyof typeof UrlBase)[];
    keysStd.forEach((key) => expect(Url[key]).to.equal(UrlBase[key]));
    keysImmutable.forEach((key) => expect(Url[key]).to.equal(UrlBase[key]));
  });

  describe('Url.bindToWindow', () => {
    it('has the expected signature', () => {
      type T = (ref: t.UrlRef, options?: t.DomUrlBindOptions) => t.DomUrlBinding;
      expectTypeOf(Url.bindToWindow).toEqualTypeOf<T>();
    });

    it('mirrors UrlRef changes into window.location (replace mode, same-origin)', () => {
      const href = 'https://example.com/app?foo=1';
      window.location.href = href;

      const ref = Url.ref(href);
      const binding = Url.bindToWindow(ref, { mode: 'replace' });

      expect(binding.ref).to.equal(ref);
      expect(window.location.href).to.eql(href);

      ref.change((u) => {
        u.pathname = '/other';
        u.searchParams.set('bar', '2');
      });

      expect(window.location.origin).to.eql('https://example.com');
      expect(window.location.pathname).to.eql('/other');
      expect(window.location.search).to.eql('?foo=1&bar=2');

      binding.dispose();
    });

    it('performs hard navigation for cross-origin URLs', () => {
      window.location.href = 'https://example.com/app';

      const ref = Url.ref('https://other.test/path');
      const binding = Url.bindToWindow(ref);

      expect(window.location.href).to.eql('https://other.test/path');

      binding.dispose();
    });

    it('stops mirroring after dispose', () => {
      window.location.href = 'https://example.com/app';

      const ref = Url.ref('https://example.com/app');
      const binding = Url.bindToWindow(ref);
      const before = window.location.href;

      binding.dispose();

      ref.change((u) => {
        u.pathname = '/after-dispose';
      });

      expect(window.location.href).to.eql(before);
    });

    it('is a no-op when window is not available (SSR-like)', () => {
      const globalAny = globalThis as any;
      const originalWindow = globalAny.window;

      try {
        delete globalAny.window;

        const ref = Url.ref('https://example.com/app');
        const binding = Url.bindToWindow(ref);

        expect(binding.ref).to.equal(ref);
        binding.dispose();
      } finally {
        globalAny.window = originalWindow;
      }
    });
  });
});
