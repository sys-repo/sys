import { Document, Window } from 'happy-dom';
import { afterEach, describe, expect, it } from '../-test.ts';
import { Is } from '../m.Is/mod.ts';
import { DomMock } from './mod.ts';

describe(
  'Mock (DOM)',

  /** NOTE: leaked timers left around by the "happy-dom" module. */
  { sanitizeOps: false, sanitizeResources: false },

  () => {
    it('API', async () => {
      const m = await import('@sys/std/testing/server');
      expect(m.DomMock).to.equal(DomMock);
    });

    describe('polyfill', () => {
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
    });

    describe('DomMock.Keyboard', () => {
      it('fires event', () => {
        DomMock.polyfill();

        const fired: KeyboardEvent[] = [];
        (globalThis as any).document.addEventListener('keydown', (e: KeyboardEvent) =>
          fired.push(e),
        );
        (globalThis as any).document.addEventListener('keydown', (_e: KeyboardEvent) => {
          /* handle keyboard event */
        });

        const event = DomMock.Keyboard.keydownEvent();
        DomMock.Keyboard.fire(event);

        expect(fired.length).to.eql(1);
        expect(fired[0]).to.equal(event);
      });

      it('throw: mock not poly-filled', () => {
        DomMock.unpolyfill();
        const fn = () => DomMock.Keyboard.fire();
        expect(fn).to.throw(/Cannot read properties of undefined/);
      });
    });
  },
);
