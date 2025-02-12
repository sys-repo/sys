import { Document, Window } from 'happy-dom';
import { describe, expect, it } from '../-test.ts';
import { DomMock } from './mod.ts';

describe(
  'Mock (DOM)',

  /** NOTE: leaked timers left around by the "happy-dom" module. */
  { sanitizeOps: false, sanitizeResources: false },

  () => {
    describe('polyfill', () => {
      it('polyfill', () => {
        expect(globalThis.window).to.eql(undefined);
        expect(globalThis.document).to.eql(undefined);

        DomMock.polyfill();
        expect(window).to.be.instanceof(Window);
        expect(document).to.be.instanceof(Document);
        expect(globalThis.window).to.equal(window);
      });

      it('unpolyfill', () => {
        DomMock.polyfill();
        const before = globalThis.window;
        expect(before).to.be.instanceof(Window);

        DomMock.unpolyfill();
        expect(window).to.eql(undefined);
        expect(document).to.eql(undefined);

        DomMock.polyfill();
        expect(window).to.equal(before); // NB: same instance is used.
      });
    });

    describe('DomMock.Keyboard', () => {
      it('fires event', () => {
        DomMock.polyfill();

        const fired: KeyboardEvent[] = [];
        document.addEventListener('keydown', (e) => fired.push(e));
        document.addEventListener('keydown', (e) => {
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
