import { afterAll, beforeEach, describe, expect, it } from '../../-test.ts';
import { DomMock } from '../mod.ts';

describe(
  'DomMock.Keyboard',

  /** NOTE: leaked timers left around by the "happy-dom" module. */
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    DomMock.init(beforeEach, afterAll);

    it('fires event', () => {
      const fired: KeyboardEvent[] = [];
      (globalThis as any).document.addEventListener('keydown', (e: KeyboardEvent) => fired.push(e));
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
  },
);
