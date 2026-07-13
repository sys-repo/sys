import { afterAll, beforeAll, describe, DomMock, expect, it, Rx, type t, Time } from '../-test.ts';
import { keydown, releaseKey } from './-test/u.fixture.ts';
import { KeyListener } from './m.KeyListener.ts';
import { Kbd, Keyboard } from './mod.ts';

type KeyboardControlArgs = t.Keyboard.Match.SubscriberHandlerArgs & {
  readonly preventDefault: () => void;
  readonly stopKeyboardPropagation: () => void;
  readonly consume: () => void;
};

type KeyboardControlMethod = 'preventDefault' | 'stopKeyboardPropagation' | 'consume';

describe('Keyboard', () => {
  DomMock.init({ beforeAll, afterAll });

  it('API', async () => {
    const m = await import('@sys/ui-dom/keyboard');
    expect(m.Keyboard).to.equal(Keyboard);
    expect(Keyboard).to.equal(Kbd);
  });

  describe('KeyListener', () => {
    it('fires (keydown | keyup)', async () => {
      const fired: KeyboardEvent[] = [];
      KeyListener.keydown((e) => fired.push(e));
      KeyListener.keyup((e) => fired.push(e));

      const downEvent = DomMock.Keyboard.keydownEvent();
      const upEvent = DomMock.Keyboard.keyupEvent();

      document.dispatchEvent(downEvent);
      document.dispatchEvent(upEvent);
      await Time.wait(0);

      expect(fired.length).to.eql(2);
      expect(fired[0]).to.equal(downEvent);
      expect(fired[1]).to.equal(upEvent);
    });

    it('dispose: removes event listener', async () => {
      /**
       * NOTE: The removing of the event handlers (in particular when multiple handlers
       *       are in play) is done correctly in the browser, however [happy-dom] does not behave
       *       accurately and removes all handlers.
       *
       *       This test only asserts the removal of the event, but does not attempt to
       *       simulate within [happy-dom] any further than this.
       */
      const fired: KeyboardEvent[] = [];
      const keydown = KeyListener.keydown((e) => fired.push(e));
      const keyup = KeyListener.keyup((e) => fired.push(e));

      keydown.dispose();
      keyup.dispose(); // NB: Keyup-2 not disposed.

      const downEvent = DomMock.Keyboard.keydownEvent();
      const upEvent = DomMock.Keyboard.keyupEvent();

      DomMock.Keyboard.fire(downEvent);
      DomMock.Keyboard.fire(upEvent);

      await Time.wait(0);
      expect(fired.length).to.eql(0);
    });
  });

  describe('Keyboard event ownership', () => {
    it('observe only → does not prevent default or stop DOM propagation', () => {
      const key = 'o';
      const target = document.createElement('button');
      document.body.appendChild(target);

      const calls: string[] = [];
      target.addEventListener('keydown', () => calls.push('target'));

      const keyboard = Keyboard.until();
      keyboard.on('KeyO', () => calls.push('subscriber'));

      try {
        const ev = keydown(key);
        target.dispatchEvent(ev);

        expect(ev.defaultPrevented).to.eql(false);
        expect(calls).to.eql(['subscriber', 'target']);
      } finally {
        releaseKey(key);
        keyboard.dispose();
        target.remove();
      }
    });

    it('pattern subscribers ignore native defaultPrevented as ownership', () => {
      const key = 'f';
      const target = document.createElement('button');
      document.body.appendChild(target);

      const calls: string[] = [];
      const keyboard = Keyboard.until();
      keyboard.on('KeyF', () => calls.push('subscriber'));

      try {
        const ev = keydown(key);
        ev.preventDefault();
        target.dispatchEvent(ev);

        expect(ev.defaultPrevented).to.eql(true);
        expect(calls).to.eql(['subscriber']);
      } finally {
        releaseKey(key);
        keyboard.dispose();
        target.remove();
      }
    });

    it('preventDefault() → prevents browser default without stopping keyboard or DOM propagation', () => {
      const key = 'a';
      const target = document.createElement('button');
      document.body.appendChild(target);

      const calls: string[] = [];
      target.addEventListener('keydown', () => calls.push('target'));

      const keyboard = Keyboard.until();
      keyboard.on('KeyA', (e) => {
        calls.push('first');
        callControl(e, 'preventDefault', calls);
      });
      keyboard.on('KeyA', () => calls.push('second'));

      try {
        const ev = keydown(key);
        target.dispatchEvent(ev);

        expect(ev.defaultPrevented).to.eql(true);
        expect(calls).to.eql(['first', 'second', 'target']);
      } finally {
        releaseKey(key);
        keyboard.dispose();
        target.remove();
      }
    });

    it('stopKeyboardPropagation() → suppresses later pattern subscribers without preventing default or stopping DOM propagation', () => {
      const key = 'b';
      const target = document.createElement('button');
      document.body.appendChild(target);

      const calls: string[] = [];
      target.addEventListener('keydown', () => calls.push('target'));

      const keyboard = Keyboard.until();
      keyboard.on('KeyB', (e) => {
        calls.push('first');
        callControl(e, 'stopKeyboardPropagation', calls);
      });
      keyboard.on('KeyB', () => calls.push('second'));

      try {
        const ev = keydown(key);
        target.dispatchEvent(ev);

        expect(ev.defaultPrevented).to.eql(false);
        expect(calls).to.eql(['first', 'target']);
      } finally {
        releaseKey(key);
        keyboard.dispose();
        target.remove();
      }
    });

    it('preventDefault() + stopKeyboardPropagation() → combines browser default prevention and keyboard-route ownership without stopping DOM propagation', () => {
      const key = 'c';
      const target = document.createElement('button');
      document.body.appendChild(target);

      const calls: string[] = [];
      target.addEventListener('keydown', () => calls.push('target'));

      const keyboard = Keyboard.until();
      keyboard.on('KeyC', (e) => {
        calls.push('first');
        callControl(e, 'preventDefault', calls);
        callControl(e, 'stopKeyboardPropagation', calls);
      });
      keyboard.on('KeyC', () => calls.push('second'));

      try {
        const ev = keydown(key);
        target.dispatchEvent(ev);

        expect(ev.defaultPrevented).to.eql(true);
        expect(calls).to.eql(['first', 'target']);
      } finally {
        releaseKey(key);
        keyboard.dispose();
        target.remove();
      }
    });

    it('consume() → prevents default, stops keyboard propagation, and stops DOM propagation', () => {
      const key = 'd';
      const target = document.createElement('button');
      document.body.appendChild(target);

      const calls: string[] = [];
      target.addEventListener('keydown', () => calls.push('target'));

      const keyboard = Keyboard.until();
      keyboard.on('KeyD', (e) => {
        calls.push('first');
        callControl(e, 'consume', calls);
      });
      keyboard.on('KeyD', () => calls.push('second'));

      try {
        const ev = keydown(key);
        target.dispatchEvent(ev);

        expect(ev.defaultPrevented).to.eql(true);
        expect(calls).to.eql(['first']);
      } finally {
        releaseKey(key);
        keyboard.dispose();
        target.remove();
      }
    });

    it('handled() → remains destructive consume alias', () => {
      const key = 'e';
      const target = document.createElement('button');
      document.body.appendChild(target);

      const calls: string[] = [];
      target.addEventListener('keydown', () => calls.push('target'));

      const keyboard = Keyboard.until();
      keyboard.on('KeyE', (e) => {
        calls.push('first');
        e.handled();
      });
      keyboard.on('KeyE', () => calls.push('second'));

      try {
        const ev = keydown(key);
        target.dispatchEvent(ev);

        expect(ev.defaultPrevented).to.eql(true);
        expect(calls).to.eql(['first']);
      } finally {
        releaseKey(key);
        keyboard.dispose();
        target.remove();
      }
    });

    it('stopKeyboardPropagation() → leaves event.is.handled as native default-prevented state', () => {
      const key = 'h';
      const target = document.createElement('button');
      document.body.appendChild(target);

      const calls: string[] = [];
      const handled: boolean[] = [];

      const keyboard = Keyboard.until();
      keyboard.on('KeyH', (e) => {
        calls.push('first');
        callControl(e, 'stopKeyboardPropagation', calls);
        handled.push(e.event.is.handled);
      });
      keyboard.on('KeyH', () => calls.push('second'));

      try {
        const ev = keydown(key);
        target.dispatchEvent(ev);

        expect(ev.defaultPrevented).to.eql(false);
        expect(calls).to.eql(['first']);
        expect(handled).to.eql([false]);
      } finally {
        releaseKey(key);
        keyboard.dispose();
        target.remove();
      }
    });

    it('stopKeyboardPropagation() → state observers still receive keyboard events', () => {
      const key = 'g';
      const target = document.createElement('button');
      document.body.appendChild(target);

      const calls: string[] = [];
      const observed: string[] = [];

      const keyboard = Keyboard.until();
      keyboard.$.pipe(Rx.filter((e) => e.last?.code === 'KeyG')).subscribe((e) => {
        if (e.last) observed.push(e.last.code);
      });
      keyboard.on('KeyG', (e) => {
        calls.push('first');
        callControl(e, 'stopKeyboardPropagation', calls);
      });
      keyboard.on('KeyG', () => calls.push('second'));

      try {
        const ev = keydown(key);
        target.dispatchEvent(ev);

        expect(calls).to.eql(['first']);
        expect(observed).to.eql(['KeyG']);
      } finally {
        releaseKey(key);
        keyboard.dispose();
        target.remove();
      }
    });

    it('control calls are idempotent and monotonic', () => {
      const key = 'i';
      const target = document.createElement('button');
      document.body.appendChild(target);

      const calls: string[] = [];
      target.addEventListener('keydown', () => calls.push('target'));

      const keyboard = Keyboard.until();
      keyboard.on('KeyI', (e) => {
        calls.push('first');
        callControl(e, 'preventDefault', calls);
        callControl(e, 'preventDefault', calls);
        callControl(e, 'stopKeyboardPropagation', calls);
        callControl(e, 'stopKeyboardPropagation', calls);
      });
      keyboard.on('KeyI', () => calls.push('second'));

      try {
        const ev = keydown(key);
        target.dispatchEvent(ev);

        expect(ev.defaultPrevented).to.eql(true);
        expect(calls).to.eql(['first', 'target']);
      } finally {
        releaseKey(key);
        keyboard.dispose();
        target.remove();
      }
    });
  });

  describe('Keyboard.until', () => {
    it('until.on: stops after disposal', () => {
      const life = Rx.disposable();
      const until = Keyboard.until(life.dispose$);
      const fired: t.Keyboard.Keypress.Event[] = [];
      until.on('KeyZ', (e) => fired.push(e.event));

      DomMock.Keyboard.fire();
      expect(fired.length).to.eql(1);

      life.dispose();
      expect(until.disposed).to.eql(true);

      DomMock.Keyboard.fire();
      expect(fired.length).to.eql(1);
    });

    it('until.dbl: stops after disposal', () => {
      const life = Rx.disposable();
      const until = Keyboard.until(life.dispose$);
      const dbl = until.dbl();

      const fired: t.Keyboard.Keypress.Event[] = [];
      dbl.on('KeyB', (e) => fired.push(e.event));

      const ev = DomMock.Keyboard.keydownEvent('b');
      DomMock.Keyboard.fire(ev);
      DomMock.Keyboard.fire(ev);
      expect(fired.length).to.eql(1);

      until.dispose();
      DomMock.Keyboard.fire(ev);
      DomMock.Keyboard.fire(ev);
      expect(fired.length).to.eql(1); // No more events after dispose of [until]
    });

    it('until.on: matches command shortcuts from current event modifiers', () => {
      const until = Keyboard.until();
      const fired: t.Keyboard.Keypress.Event[] = [];
      until.on('CMD + Escape', (e) => fired.push(e.event));

      const ev = DomMock.Keyboard.keydownEvent('Escape', { metaKey: true });
      DomMock.Keyboard.fire(ev);

      expect(fired.length).to.eql(1);
      expect(fired[0].code).to.eql('Escape');
      expect(fired[0].keypress.metaKey).to.eql(true);
      until.dispose();
    });

    it('until.on: captures events before a child stops propagation', () => {
      const until = Keyboard.until();
      const fired: t.Keyboard.Keypress.Event[] = [];
      until.on('Escape', (e) => fired.push(e.event));

      const el = document.createElement('button');
      document.body.appendChild(el);
      el.addEventListener('keydown', (e) => e.stopPropagation());

      const ev = DomMock.Keyboard.keydownEvent('Escape', { bubbles: true });
      el.dispatchEvent(ev);

      expect(fired.length).to.eql(1);
      until.dispose();
      el.remove();
    });
  });

  describe('Keyboard.dbl', () => {
    it('no match', async () => {
      const dbl = Keyboard.dbl(10);
      const fired: t.Keyboard.Keypress.Event[] = [];
      dbl.on('KeyM', (e) => fired.push(e.event));

      const ev = DomMock.Keyboard.keydownEvent('z');
      DomMock.Keyboard.fire(ev);
      await Time.wait(10);
      DomMock.Keyboard.fire(ev);

      await Time.wait(50);
      expect(fired.length).to.eql(0);

      dbl.dispose();
    });

    it('fires (x2)', async () => {
      const dbl = Keyboard.dbl();
      const fired: t.Keyboard.Keypress.Event[] = [];
      dbl.on('KeyM', (e) => fired.push(e.event));

      const ev = DomMock.Keyboard.keydownEvent('m');
      DomMock.Keyboard.fire(ev); // First keypress.
      await Time.wait(10);
      expect(fired.length).to.eql(0);
      DomMock.Keyboard.fire(ev); // Second keypress.

      await Time.wait(20);
      expect(fired.length).to.eql(1);
      expect(fired[0].code).to.eql('KeyM');

      DomMock.Keyboard.fire(ev);
      expect(fired.length).to.eql(1); // NB: not increment yet.
      DomMock.Keyboard.fire(ev);
      expect(fired.length).to.eql(2);

      dbl.dispose();
    });

    it('does not fire (outside time threshold)', async () => {
      const dbl = Keyboard.dbl(10);
      const fired: t.Keyboard.Keypress.Event[] = [];
      dbl.on('KeyA', (e) => fired.push(e.event));

      const ev = DomMock.Keyboard.keydownEvent('a');
      DomMock.Keyboard.fire(ev);
      DomMock.Keyboard.fire(ev);
      expect(fired.length).to.eql(1);

      DomMock.Keyboard.fire(ev);
      expect(fired.length).to.eql(1);
      await Time.wait(30);
      DomMock.Keyboard.fire(ev); // NB: second event comes in after timeout.
      expect(fired.length).to.eql(1); // No change.

      dbl.dispose();
    });

    it('disposes', () => {
      const life = Rx.disposable();
      const { dispose$ } = life;
      const res1 = Keyboard.dbl(2);
      const res2 = Keyboard.dbl(2, { until: dispose$ });

      expect(res1.disposed).to.eql(false);
      expect(res2.disposed).to.eql(false);
      life.dispose();
      expect(res1.disposed).to.eql(false);
      expect(res2.disposed).to.eql(true);
      res1.dispose();
      expect(res1.disposed).to.eql(true);
      expect(res2.disposed).to.eql(true);
    });

    it('does not fire when disposed', () => {
      const dbl = Keyboard.dbl(30);
      const fired: t.Keyboard.Keypress.Event[] = [];
      dbl.on('KeyM', (e) => fired.push(e.event));

      const ev = DomMock.Keyboard.keydownEvent('m');
      DomMock.Keyboard.fire(ev);
      DomMock.Keyboard.fire(ev);
      expect(fired.length).to.eql(1);

      dbl.dispose();
      DomMock.Keyboard.fire(ev);
      DomMock.Keyboard.fire(ev);
      expect(fired.length).to.eql(1);
    });
  });

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

  describe('Keyboard.modifiers', () => {
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

/**
 * Helpers:
 */
function callControl(
  e: t.Keyboard.Match.SubscriberHandlerArgs,
  method: KeyboardControlMethod,
  calls: string[],
) {
  const fn = control(e)[method];
  if (typeof fn === 'function') return fn();
  calls.push(`missing:${method}`);
}

function control(e: t.Keyboard.Match.SubscriberHandlerArgs): Partial<KeyboardControlArgs> {
  return e as Partial<KeyboardControlArgs>;
}
