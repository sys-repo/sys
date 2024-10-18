import { Document, Window } from 'happy-dom';
import { describe, expect, it } from '../-test.ts';
import { Mock } from './mod.ts';

describe(
  'Mock (DOM)',

  /**
   * NOTE: leaked timers left around by the "happy-dom" module.
   */
  { sanitizeOps: false, sanitizeResources: false },

  () => {
    describe('polyfill', () => {
      it('polyfill', () => {
        expect(globalThis.window).to.eql(undefined);
        expect(globalThis.document).to.eql(undefined);
        Mock.polyfill();
        expect(window).to.be.instanceof(Window);
        expect(document).to.be.instanceof(Document);
        expect(globalThis.window).to.equal(window);
      });

      it('unpolyfill', () => {
        Mock.polyfill();
        const before = globalThis.window;
        expect(before).to.be.instanceof(Window);

        Mock.unpolyfill();
        expect(window).to.eql(undefined);
        expect(document).to.eql(undefined);

        Mock.polyfill();
        expect(window).to.equal(before); // NB: same instance is used.
      });
    });

    describe('Mock.Keyboard', () => {
      it('fires event', () => {
        Mock.polyfill();

        const ev = Mock.Keyboard.keydownEvent();
        const fired: KeyboardEvent[] = [];
        document.addEventListener('keydown', (e) => fired.push(e));

        Mock.Keyboard.fire(ev);
        expect(fired.length).to.eql(1);
        expect(fired[0]).to.equal(ev);
      });

      it('throw: mock not poly-filled', () => {
        Mock.unpolyfill();
        const fn = () => Mock.Keyboard.fire();
        expect(fn).to.throw(/Cannot read properties of undefined/);
      });
    });
  },
);
