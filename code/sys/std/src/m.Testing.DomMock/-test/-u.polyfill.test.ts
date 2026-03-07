import { Document, Window } from 'happy-dom';
import { afterEach, describe, expect, it } from '../../-test.ts';
import { Is } from '../../m.Is/mod.ts';
import { DomMock } from '../mod.ts';

describe(
  'DomMock.polyfill',

  /** NOTE: leaked timers left around by the "happy-dom" module. */
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    afterEach(DomMock.unpolyfill);

    it('polyfill', () => {
      expect((globalThis as any).window).to.eql(undefined);
      expect((globalThis as any).document).to.eql(undefined);

      DomMock.polyfill();

      expect((globalThis as any).window).to.be.instanceof(Window);
      expect((globalThis as any).document).to.be.instanceof(Document);
      expect((globalThis as any).window).to.equal((globalThis as any).window);
      expect((globalThis as any).window.location.host).to.eql('localhost:1234');

      const before = (globalThis as any).window;
      DomMock.polyfill();
      DomMock.polyfill();
      expect((globalThis as any).window).to.equal(before); // NB: instance re-used.
    });

    it('polyfill: custom URL', () => {
      const url = 'https://foo.com/bar?a=123';
      DomMock.polyfill({ url });
      expect((globalThis as any).window.location.href).to.eql(url);
    });

    it('unpolyfill', () => {
      DomMock.polyfill();
      const before = (globalThis as any).window;
      expect(before).to.be.instanceof(Window);

      DomMock.unpolyfill();
      expect((globalThis as any).window).to.eql(undefined);
      expect((globalThis as any).document).to.eql(undefined);

      DomMock.polyfill();
      expect((globalThis as any).window).to.not.equal(before); // NB: instance reset.
    });

    it('env flags (is)', () => {
      expect((globalThis as any).__SYS_BROWSER_MOCK__).to.not.eql(true);
      expect(DomMock.isPolyfilled).to.eql(false);
      expect(Is.browser()).to.eql(false);

      DomMock.polyfill();

      expect((globalThis as any).__SYS_BROWSER_MOCK__).to.eql(true);
      expect(DomMock.isPolyfilled).to.eql(true);
      expect(Is.browser()).to.eql(true);
    });
  },
);
