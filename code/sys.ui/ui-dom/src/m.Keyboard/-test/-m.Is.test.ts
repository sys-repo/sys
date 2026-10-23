import { describe, expect, it, type t } from '../../-test.ts';
import { Keyboard } from '../mod.ts';

describe('Keyboard.Is', () => {
  const Is = Keyboard.Is;
  const mac: t.UserAgent.Info = {
    os: { name: 'macOS' },
    is: {
      apple: true,
      macOS: true,
      iOS: false,
      iPad: false,
      iPhone: false,
      chromium: true,
      firefox: false,
    },
  };
  const windows: t.UserAgent.Info = {
    os: { name: 'Windows' },
    is: {
      apple: false,
      macOS: false,
      iOS: false,
      iPad: false,
      iPhone: false,
      chromium: true,
      firefox: false,
    },
  };
  const linux: t.UserAgent.Info = {
    os: { name: 'Linux' },
    is: {
      apple: false,
      macOS: false,
      iOS: false,
      iPad: false,
      iPhone: false,
      chromium: true,
      firefox: false,
    },
  };

  it('Is.command', () => {
    const a = Keyboard.Is.command();
    expect(a).to.be.false;

    const b = Keyboard.Is.command({ meta: true }, { ua: mac });
    const c = Keyboard.Is.command({ ctrl: true }, { ua: windows });
    const d = Keyboard.Is.command({ ctrl: true }, { ua: linux });
    expect(b).to.be.true;
    expect(c).to.be.true;
    expect(d).to.be.true;

    const e = Keyboard.Is.command({ ctrl: true }, { ua: mac });
    const f = Keyboard.Is.command({ meta: true }, { ua: windows });
    const g = Keyboard.Is.command({ meta: true }, { ua: linux });
    expect(e).to.be.false;
    expect(f).to.be.false;
    expect(g).to.be.false;

    // T:Keyboard.EventLike
    const h = Keyboard.Is.command({ key: 'c', modifiers: { meta: true } }, { ua: mac });
    const i = Keyboard.Is.command({ key: 'c', modifiers: { meta: true } }, { ua: windows });
    expect(h).to.be.true;
    expect(i).to.be.false;

    // T:Keyboard.NativeEventLike
    const j = Keyboard.Is.command({ metaKey: true }, { ua: mac });
    const k = Keyboard.Is.command({ metaKey: true }, { ua: windows });
    const l = Keyboard.Is.command({ ctrlKey: true }, { ua: windows });
    expect(j).to.be.true;
    expect(k).to.be.false;
    expect(l).to.be.true;
  });

  describe('Is.modified', () => {
    it('returns false when no modifiers or all are false', () => {
      expect(Is.modified()).to.be.false;
      expect(Is.modified({})).to.be.false;
      expect(Is.modified({ meta: false, ctrl: false, alt: false, shift: false })).to.be.false;
    });

    it('detects any single modifier key', () => {
      expect(Is.modified({ meta: true })).to.be.true;
      expect(Is.modified({ ctrl: true })).to.be.true;
      expect(Is.modified({ alt: true })).to.be.true;
      expect(Is.modified({ shift: true })).to.be.true;
    });

    it('detects multiple modifier keys pressed together', () => {
      expect(Is.modified({ meta: true, shift: true })).to.be.true;
      expect(Is.modified({ ctrl: true, alt: true })).to.be.true;
      expect(Is.modified({ meta: true, ctrl: true, alt: true, shift: true })).to.be.true;
    });

    it('takes keyboard event as input', () => {
      expect(Is.modified({ key: 'c', modifiers: { meta: true } })).to.be.true;
      expect(Is.modified({ key: 'c', modifiers: { meta: false } })).to.be.false;
    });
  });

  it('Is.copy (platform-independent)', () => {
    // No event → never a copy.
    expect(Keyboard.Is.copy()).to.be.false;

    // Correct "copy" shortcuts
    const b = Keyboard.Is.copy(
      { key: 'c', modifiers: { meta: true, ctrl: false, alt: false, shift: false } },
      { ua: mac },
    );
    const c = Keyboard.Is.copy(
      { key: 'c', modifiers: { ctrl: true, meta: false, alt: false, shift: false } },
      { ua: windows },
    );
    const d = Keyboard.Is.copy(
      { key: 'c', modifiers: { ctrl: true, meta: false, alt: false, shift: false } },
      { ua: linux },
    );

    expect(b).to.be.true;
    expect(c).to.be.true;
    expect(d).to.be.true;

    // Mismatched modifiers or wrong key
    const e = Keyboard.Is.copy(
      { key: 'c', modifiers: { ctrl: true, meta: false, alt: false, shift: false } },
      { ua: mac },
    );
    const f = Keyboard.Is.copy(
      { key: 'c', modifiers: { meta: true, ctrl: false, alt: false, shift: false } },
      { ua: windows },
    );
    const g = Keyboard.Is.copy(
      { key: 'c', modifiers: { meta: true, ctrl: false, alt: false, shift: false } },
      { ua: linux },
    );
    const h = Keyboard.Is.copy(
      { key: 'v', modifiers: { meta: true, ctrl: false, alt: false, shift: false } },
      { ua: mac },
    );

    expect(e).to.be.false;
    expect(f).to.be.false;
    expect(g).to.be.false;
    expect(h).to.be.false;
  });
});
