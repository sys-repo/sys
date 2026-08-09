import { afterAll, beforeAll, describe, DomMock, expect, it, Rx, type t } from '../../-test.ts';
import { Keyboard } from '../mod.ts';

describe('Keyboard.until', () => {
  DomMock.init({ beforeAll, afterAll });

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

  it('supports native using', () => {
    const until = Keyboard.until();
    let disposed = 0;
    until.dispose$.subscribe(() => disposed++);

    {
      using _until = until;
      expect(until.disposed).to.eql(false);
    }

    until.dispose();
    expect(until.disposed).to.eql(true);
    expect(disposed).to.eql(1);
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
