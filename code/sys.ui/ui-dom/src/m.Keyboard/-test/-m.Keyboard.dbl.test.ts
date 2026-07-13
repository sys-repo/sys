import {
  afterAll,
  beforeAll,
  describe,
  DomMock,
  expect,
  it,
  Rx,
  type t,
  Time,
} from '../../-test.ts';
import { Keyboard } from '../mod.ts';

describe('Keyboard.dbl', () => {
  DomMock.init({ beforeAll, afterAll });

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
