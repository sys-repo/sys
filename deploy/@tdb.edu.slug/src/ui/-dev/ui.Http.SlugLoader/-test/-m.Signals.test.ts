import { describe, expect, it } from '../../../../-test.ts';
import { Signals } from '../m.Signals.ts';

describe('ActionProbe.Signals', () => {
  it('create: initializes defaults', () => {
    const api = Signals.create();
    const p = api.props;
    expect(p.activeProbe.value).to.eql(undefined);
    expect(p.resultItems.value).to.eql([]);
    expect(p.response.value).to.eql(undefined);
    expect(p.spinning.value).to.eql(false);
  });

  it('start: sets active probe and clears output state', () => {
    const api = Signals.create();
    api.result({ ok: true });
    api.item({ k: 'foo', v: 'bar' });

    api.start('p:1');

    const p = api.props;
    expect(p.activeProbe.value).to.eql('p:1');
    expect(p.resultItems.value).to.eql([]);
    expect(p.response.value).to.eql(undefined);
    expect(p.spinning.value).to.eql(true);
  });

  it('item/result/end: mutates execution channel', () => {
    const api = Signals.create();
    api.start('p:1').item({ k: 'a', v: 1 }).item({ k: 'b', v: 2 }).result({ ok: true }).end();

    const p = api.props;
    expect(p.resultItems.value).to.eql([
      { k: 'a', v: 1 },
      { k: 'b', v: 2 },
    ]);
    expect(p.response.value).to.eql({ ok: true });
    expect(p.spinning.value).to.eql(false);
  });

  it('reset: returns to canonical defaults', () => {
    const api = Signals.create();
    api.start('p:1').item({ k: 'x', v: 1 }).result({ ok: true }).end();

    api.reset();

    const p = api.props;
    expect(p.activeProbe.value).to.eql(undefined);
    expect(p.resultItems.value).to.eql([]);
    expect(p.response.value).to.eql(undefined);
    expect(p.spinning.value).to.eql(false);
  });
});
