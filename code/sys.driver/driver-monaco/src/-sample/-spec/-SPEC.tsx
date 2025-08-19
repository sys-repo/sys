import { Dev, Signal, Spec } from '../../ui/-test.ui.ts';
import { Crdt, D, Obj, STORAGE_KEY } from '../common.ts';
import { Sample } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const signals = debug.signals;
  const repo = debug.repo;
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    const updateLayout = () => {
      const P = Obj.Path.curry<boolean>(['foo.parsed', '.', 'dev']);
      const doc = signals.doc.value;
      const isDev = P.get(doc?.current, true) === true;
      ctx.debug.width(isDev ? 390 : 0);
    };

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      updateLayout();
      ctx.redraw();
    });

    ctx.subject
      .size('fill', 0)
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        return (
          <Sample
            debug={v.debug}
            theme={v.theme}
            repo={repo}
            factory={v.factory}
            signals={signals}
            onRequestRedraw={updateLayout}
          />
        );
      });

    ctx.debug.footer
      .border(-0.1)
      .padding(0)
      .render(() => {
        return (
          <Crdt.UI.Repo.SyncEnabledSwitch
            repo={repo}
            localstorage={STORAGE_KEY.DEV}
            style={{ Padding: [14, 10] }}
          />
        );
      });

    // Initialize:
    updateLayout();
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
