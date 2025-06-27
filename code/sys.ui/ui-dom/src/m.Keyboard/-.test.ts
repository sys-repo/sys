import { Time, describe, expect, it, rx, type t, DomMock } from '../-test.ts';
import { KeyListener } from './m.KeyListener.ts';
import { Keyboard } from './mod.ts';
import { UserAgent } from './common.ts';

describe(
  'Keyboard',
  /** NB: leaked timers left around by the "happy-dom" module. */
  { sanitizeOps: false, sanitizeResources: false },
  () => {
    it('(polyfill)', () => DomMock.polyfill());

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
         *       are in play) is done correctly in the borser, however [happy-dom] does not behave
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

    describe('Keyboard.until', () => {
      it('until.on: stops after disposal', () => {
        const life = rx.disposable();
        const until = Keyboard.until(life.dispose$);
        const fired: t.KeyboardKeypress[] = [];
        until.on('KeyZ', (e) => fired.push(e.event));

        DomMock.Keyboard.fire();
        expect(fired.length).to.eql(1);

        life.dispose();
        expect(until.disposed).to.eql(true);

        DomMock.Keyboard.fire();
        expect(fired.length).to.eql(1);
      });

      it('until.dbl: stops after disposal', () => {
        const life = rx.disposable();
        const until = Keyboard.until(life.dispose$);
        const dbl = until.dbl();

        const fired: t.KeyboardKeypress[] = [];
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
    });

    describe('Keyboard.dbl', () => {
      it('no match', async () => {
        const dbl = Keyboard.dbl(10);
        const fired: t.KeyboardKeypress[] = [];
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
        const fired: t.KeyboardKeypress[] = [];
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
      });

      it('does not fire (outside time threshold)', async () => {
        const dbl = Keyboard.dbl(10);
        const fired: t.KeyboardKeypress[] = [];
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
      });

      it('disposes', () => {
        const life = rx.disposable();
        const { dispose$ } = life;
        const res1 = Keyboard.dbl(2);
        const res2 = Keyboard.dbl(2, { dispose$ });

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
        const fired: t.KeyboardKeypress[] = [];
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
      const UA = {
        mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X)',
        windows: 'Mozilla/5.0 (X11; Linux x86_64)',
        linux: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      } as const;

      const mac = UserAgent.parse(UA.mac);
      const windows = UserAgent.parse(UA.windows);
      const linux = UserAgent.parse(UA.linux);

      it('Is.commandConcept', () => {
        const a = Keyboard.Is.commandConcept();
        const b = Keyboard.Is.commandConcept({ meta: true }, { ua: mac });
        const c = Keyboard.Is.commandConcept({ ctrl: true }, { ua: windows });
        const d = Keyboard.Is.commandConcept({ ctrl: true }, { ua: linux });

        const e = Keyboard.Is.commandConcept({ ctrl: true }, { ua: mac });
        const f = Keyboard.Is.commandConcept({ meta: true }, { ua: windows });
        const g = Keyboard.Is.commandConcept({ meta: true }, { ua: linux });

        expect(a).to.be.false;

        expect(b).to.be.true;
        expect(c).to.be.true;
        expect(d).to.be.true;

        expect(e).to.be.false;
        expect(f).to.be.false;
        expect(g).to.be.false;
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
  },
);
