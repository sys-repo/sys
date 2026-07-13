import { describe, expect, it, type t } from '../../-test.ts';
import { Kbd, Keyboard } from '../mod.ts';

describe('Keyboard', () => {
  it('API', async () => {
    const m = await import('@sys/ui-dom/keyboard');
    expect(m.Keyboard).to.equal(Keyboard);
    expect(Keyboard).to.equal(Kbd);
  });

  describe('modifiers', () => {
    it('empty', () => {
      type Input = Parameters<typeof Kbd.modifiers>[0];
      const test = (input?: unknown) => {
        // Negative runtime inputs intentionally bypass the public type contract.
        const res = Kbd.modifiers(input as Input);
        expect(res).to.eql({ ctrl: false, meta: false, alt: false, shift: false });
      };
      const NON: unknown[] = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((v) => test(v));
    });

    it('modifiers → no change', () => {
      const modifiers = Kbd.modifiers({ metaKey: true });
      expect(Kbd.modifiers(modifiers)).to.eql(modifiers);
    });

    it('converts: Keyboard.NativeEventLike', () => {
      const a = Kbd.modifiers({ metaKey: true });
      const b = Kbd.modifiers({ metaKey: true, ctrlKey: true });
      const c = Kbd.modifiers({ shiftKey: true });
      expect(a).to.eql({ ctrl: false, meta: true, alt: false, shift: false });
      expect(b).to.eql({ ctrl: true, meta: true, alt: false, shift: false });
      expect(c).to.eql({ ctrl: false, meta: false, alt: false, shift: true });
    });

    it('converts: Keyboard.EventLike', () => {
      type K = t.Keyboard.EventLike;
      const ev: K = { key: 'c', modifiers: Kbd.modifiers({ metaKey: true }) };
      expect(Kbd.modifiers(ev)).to.eql(ev.modifiers);
    });
  });
});
