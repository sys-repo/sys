import { describe, expect, it } from '../../../-test.ts';
import { Signals } from '../m.Signals.ts';

describe('ActionProbe.Signals', () => {
  it('create: initializes defaults', () => {
    const api = Signals.create();
    const p = api.props;
    expect(p.probe.active.value).to.eql(undefined);
    expect(p.result.items.value).to.eql([]);
    expect(p.result.response.value).to.eql(undefined);
    expect(p.result.obj.value).to.eql(undefined);
    expect(p.spinning.value).to.eql(false);
  });

  it('start: sets active probe and clears output state', () => {
    const api = Signals.create();
    api.result({ ok: true });
    api.item({ k: 'foo', v: 'bar' });

    api.start('p:1');

    const p = api.props;
    expect(p.probe.active.value).to.eql('p:1');
    expect(p.result.items.value).to.eql([]);
    expect(p.result.response.value).to.eql(undefined);
    expect(p.result.obj.value).to.eql(undefined);
    expect(p.spinning.value).to.eql(true);
  });

  it('item/result/end: mutates execution channel', () => {
    const api = Signals.create();
    api
      .start('p:1')
      .item({ k: 'a', v: 1 })
      .item({ k: 'b', v: 2 })
      .result({ ok: true }, { expand: 2 })
      .end();

    const p = api.props;
    expect(p.result.items.value).to.eql([
      { k: 'a', v: 1 },
      { k: 'b', v: 2 },
    ]);
    expect(p.result.response.value).to.eql({ ok: true });
    expect(p.result.obj.value).to.eql({ expand: 2 });
    expect(p.spinning.value).to.eql(false);
  });

  it('reset: returns to canonical defaults', () => {
    const api = Signals.create();
    api.start('p:1').item({ k: 'x', v: 1 }).result({ ok: true }).end();

    api.reset();

    const p = api.props;
    expect(p.probe.active.value).to.eql(undefined);
    expect(p.result.items.value).to.eql([]);
    expect(p.result.response.value).to.eql(undefined);
    expect(p.result.obj.value).to.eql(undefined);
    expect(p.spinning.value).to.eql(false);
  });

  it('handlers: maps run callbacks to canonical signal transitions', () => {
    const api = Signals.create();
    const run = api.handlers('p:2');

    run.onRunStart();
    run.onRunItem({ k: 'foo', v: 123 });
    run.onRunResult({ ok: true }, { expand: { level: 1 } });
    run.onRunEnd();

    const p = api.props;
    expect(p.probe.active.value).to.eql('p:2');
    expect(p.result.items.value).to.eql([{ k: 'foo', v: 123 }]);
    expect(p.result.response.value).to.eql({ ok: true });
    expect(p.result.obj.value).to.eql({ expand: { level: 1 } });
    expect(p.spinning.value).to.eql(false);
  });

  it('handlers: auto-inserts title item from probe title on run end', () => {
    const api = Signals.create();
    const run = api.handlers('p:3', 'My Probe');

    run.onRunStart();
    run.onRunItem({ k: 'foo', v: 123 });
    run.onRunEnd();

    const p = api.props;
    expect(p.result.items.value).to.eql([
      { kind: 'title', v: 'My Probe' },
      { k: 'foo', v: 123 },
    ]);
  });

  it('handlers: does not duplicate title when run emits explicit title item', () => {
    const api = Signals.create();
    const run = api.handlers('p:4', 'My Probe');

    run.onRunStart();
    run.onRunItem({ kind: 'title', v: 'Explicit Title' });
    run.onRunItem({ k: 'foo', v: 123 });
    run.onRunEnd();

    const p = api.props;
    expect(p.result.items.value).to.eql([
      { kind: 'title', v: 'Explicit Title' },
      { k: 'foo', v: 123 },
    ]);
  });
});
