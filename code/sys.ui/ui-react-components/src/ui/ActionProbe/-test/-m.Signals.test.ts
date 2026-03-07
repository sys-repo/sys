import { describe, expect, it } from '../../../-test.ts';
import { Immutable } from '@sys/immutable/rfc6902';
import { type t } from '../common.ts';
import { Signals } from '../m.Signals.ts';

describe('ActionProbe.Signals', () => {
  describe('create', () => {
    it('initializes defaults', () => {
      const api = Signals.create();
      const p = api.props;
      expect(p.probe.active.value).to.eql(undefined);
      expect(p.probe.focused.value).to.eql(undefined);
      expect(p.result.title.value).to.eql(undefined);
      expect(p.result.visible.value).to.eql(true);
      expect(p.result.items.value).to.eql([]);
      expect(p.result.response.value).to.eql(undefined);
      expect(p.result.obj.value).to.eql(undefined);
      expect(p.result.byProbe.value).to.eql({});
      expect(p.spinning.value).to.eql(false);
    });
  });

  describe('resultVisible', () => {
    describe('state', () => {
      it('mutates visibility state from value or updater', () => {
        const api = Signals.create();
        const p = api.props;
        expect(p.result.visible.value).to.eql(true);
        api.resultVisible(false);
        expect(p.result.visible.value).to.eql(false);
        api.resultVisible((prev) => !prev);
        expect(p.result.visible.value).to.eql(true);
      });
    });

    describe('persistence', () => {
      it('hydrates from persisted store', () => {
        const persist = Immutable.clonerRef<t.JsonMapU>({ ':action-card': { resultVisible: false } });
        const api = Signals.create({ persist });
        expect(api.props.result.visible.value).to.eql(false);
      });

      it('writes persisted state to default key', () => {
        const persist = Immutable.clonerRef<t.JsonMapU>({});
        const api = Signals.create({ persist });
        api.resultVisible(false);
        expect(persist.current[':action-card']).to.eql({ resultVisible: false });
      });

      it('writes persisted state to scoped key', () => {
        const persist = Immutable.clonerRef<t.JsonMapU>({});
        const api = Signals.create({ persist, persistKey: 'foo' });
        api.resultVisible(false);
        expect(persist.current[':action-card:foo']).to.eql({ resultVisible: false });
      });
    });
  });

  describe('focus', () => {
    describe('selection state', () => {
      it('tracks focused probe independently of active state', () => {
        const api = Signals.create();
        api.focus('p:1');

        expect(api.props.probe.focused.value).to.eql('p:1');

        api.blur('p:2');
        expect(api.props.probe.focused.value).to.eql('p:1');

        api.blur('p:1');
        expect(api.props.probe.focused.value).to.eql(undefined);
      });
    });

    describe('result projection', () => {
      it('clears stale payload when selected probe has no snapshot', () => {
        const api = Signals.create();
        const p1 = api.handlers('p:1', 'One');
        api.handlers('p:2', 'Two');

        p1.onRunStart();
        p1.onRunItem({ k: 'a', v: 1 });
        p1.onRunResult({ ok: 1 }, { expand: 1 });
        p1.onRunEnd();

        api.focus('p:2');
        expect(api.props.result.title.value).to.eql('Two');
        expect(api.props.result.items.value).to.eql([]);
        expect(api.props.result.response.value).to.eql(undefined);
        expect(api.props.result.obj.value).to.eql(undefined);
      });

      it('projects last snapshot for the selected probe', () => {
        const api = Signals.create();
        const p1 = api.handlers('p:1', 'One');
        const p2 = api.handlers('p:2', 'Two');

        p1.onRunStart();
        p1.onRunItem({ k: 'a', v: 1 });
        p1.onRunResult({ ok: 1 }, { expand: 1 });
        p1.onRunEnd();

        p2.onRunStart();
        p2.onRunItem({ k: 'b', v: 2 });
        p2.onRunResult({ ok: 2 }, { expand: 2 });
        p2.onRunEnd();

        api.focus('p:1');
        expect(api.props.result.title.value).to.eql('One');
        expect(api.props.result.items.value).to.eql([{ k: 'a', v: 1 }]);
        expect(api.props.result.response.value).to.eql({ ok: 1 });
        expect(api.props.result.obj.value).to.eql({ expand: 1 });
      });
    });
  });

  describe('execution lifecycle', () => {
    describe('start', () => {
      it('sets active probe and clears output state', () => {
        const api = Signals.create();
        api.result({ ok: true });
        api.item({ k: 'foo', v: 'bar' });

        api.start('p:1');

        const p = api.props;
        expect(p.probe.active.value).to.eql('p:1');
        expect(p.probe.focused.value).to.eql('p:1');
        expect(p.result.title.value).to.eql(undefined);
        expect(p.result.items.value).to.eql([]);
        expect(p.result.response.value).to.eql(undefined);
        expect(p.result.obj.value).to.eql(undefined);
        const snapshot = p.result.byProbe.value['p:1'];
        expect(snapshot?.title).to.eql(undefined);
        expect(snapshot?.items).to.eql([]);
        expect(snapshot?.response).to.eql(undefined);
        expect(snapshot?.obj).to.eql(undefined);
        expect(p.spinning.value).to.eql(true);
      });
    });

    describe('channel', () => {
      it('item/result/end mutates execution channel', () => {
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
        const snapshot = p.result.byProbe.value['p:1'];
        expect(snapshot?.title).to.eql(undefined);
        expect(snapshot?.items).to.eql([
          { k: 'a', v: 1 },
          { k: 'b', v: 2 },
        ]);
        expect(snapshot?.response).to.eql({ ok: true });
        expect(snapshot?.obj).to.eql({ expand: 2 });
        expect(p.spinning.value).to.eql(false);
      });
    });

    describe('reset', () => {
      it('returns to canonical defaults', () => {
        const api = Signals.create();
        api.start('p:1').item({ k: 'x', v: 1 }).result({ ok: true }).end();

        api.reset();

        const p = api.props;
        expect(p.probe.active.value).to.eql(undefined);
        expect(p.probe.focused.value).to.eql(undefined);
        expect(p.result.title.value).to.eql(undefined);
        expect(p.result.visible.value).to.eql(true);
        expect(p.result.items.value).to.eql([]);
        expect(p.result.response.value).to.eql(undefined);
        expect(p.result.obj.value).to.eql(undefined);
        expect(p.result.byProbe.value).to.eql({});
        expect(p.spinning.value).to.eql(false);
      });
    });
  });

  describe('handlers', () => {
    describe('callbacks', () => {
      it('maps run callbacks to canonical signal transitions', () => {
        const api = Signals.create();
        const run = api.handlers('p:2');

        run.onRunStart();
        run.onRunItem({ k: 'foo', v: 123 });
        run.onRunResult({ ok: true }, { expand: { level: 1 } });
        run.onRunEnd();

        const p = api.props;
        expect(p.probe.active.value).to.eql('p:2');
        expect(p.probe.focused.value).to.eql('p:2');
        expect(p.result.title.value).to.eql(undefined);
        expect(p.result.items.value).to.eql([{ k: 'foo', v: 123 }]);
        expect(p.result.response.value).to.eql({ ok: true });
        expect(p.result.obj.value).to.eql({ expand: { level: 1 } });
        const snapshot = p.result.byProbe.value['p:2'];
        expect(snapshot?.title).to.eql(undefined);
        expect(snapshot?.items).to.eql([{ k: 'foo', v: 123 }]);
        expect(snapshot?.response).to.eql({ ok: true });
        expect(snapshot?.obj).to.eql({ expand: { level: 1 } });
        expect(p.spinning.value).to.eql(false);
      });
    });

    describe('titles', () => {
      it('sets result title from probe title on run start', () => {
        const api = Signals.create();
        const run = api.handlers('p:3', 'My Probe');

        run.onRunStart();
        run.onRunItem({ k: 'foo', v: 123 });
        run.onRunEnd();

        const p = api.props;
        expect(p.result.title.value).to.eql('My Probe');
        expect(p.result.items.value).to.eql([{ k: 'foo', v: 123 }]);
        expect(p.result.byProbe.value['p:3']).to.eql({
          title: 'My Probe',
          items: [{ k: 'foo', v: 123 }],
          response: undefined,
          obj: undefined,
        });
      });

      it('updates result title from run callback', () => {
        const api = Signals.create();
        const run = api.handlers('p:5', 'My Probe');

        run.onRunStart();
        run.onRunTitle('Hello from Run');
        run.onRunEnd();

        expect(api.props.result.title.value).to.eql('Hello from Run');
        expect(api.props.result.byProbe.value['p:5']?.title).to.eql('Hello from Run');
      });

      it('does not duplicate title when run emits explicit title item', () => {
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
  });
});
