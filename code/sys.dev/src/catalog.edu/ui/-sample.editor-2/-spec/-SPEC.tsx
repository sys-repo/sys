import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Crdt, D, STORAGE_KEY } from '../common.ts';
import { Sample } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    function update() {
      ctx.debug.width(debug.url.debug !== false ? 400 : 0);
      ctx.redraw();
    }

    update(); // initial
    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      update();
    });

    ctx.subject
      .size('fill')
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        return <Sample debug={debug} />;
      });

    ctx.debug.footer
      .border(-0.1)
      .padding(0)
      .render(() => {
        return (
          <Crdt.UI.Repo.SyncSwitch
            repo={debug.repo}
            localstorage={STORAGE_KEY.DEV}
            style={{ Padding: [14, 10] }}
          />
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
