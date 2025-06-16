import { type t, describe, expect, it } from '../../-test.ts';
import { Global } from '../../-tmpl/.sys/mod.ts';

import { type t as tt } from '../../-tmpl/.sys/common.ts';

describe('Global (State)', () => {
  type G = tt.GlobalState;

  it('default (singleton)', () => {
    const a = Global.state();
    const b = Global.state();
    expect(a).to.equal(b); // NB: same instance
  });

  it('custom: instance-id', () => {
    const id = 'foo';
    const a = Global.state(id);
    const b = Global.state(id);
    const c = Global.state();
    const d = Global.state('something else');
    expect(a).to.equal(b); // NB: same instance
    expect(a).to.not.equal(c);
    expect(a).to.not.equal(d);
  });

  it('change', () => {
    const a = Global.state();
    const b = Global.state();
    expect(a.current.tmp).to.eql(0);
    a.change((d) => d.tmp++);
    expect(b.current.tmp).to.eql(1);
  });

  it('shared events', () => {
    const a = Global.state();
    const b = Global.state();
    const bEvents = a.events();
    const bFired: tt.GlobalStateEvent[] = [];
    bEvents.changed$.pipe().subscribe((e) => bFired.push(e));

    a.change((d) => d.tmp++);
    expect(bFired[0].after).to.eql(a.current);
  });
});
