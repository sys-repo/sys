import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { css, D, STORAGE_KEY } from '../common.ts';
import { Repo } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    function update() {
      ctx.redraw();
    }

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      update();
    });

    ctx.subject
      .size([340, null])
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        return <Repo.Info theme={v.theme} debug={v.debug} repo={debug.repo} />;
      });

    ctx.host.tracelineColor(0.04);

    ctx.debug.footer
      .border(-0.1)
      .padding(10)
      .render(() => {
        return <Repo.SyncSwitch repo={debug.repo} storageKey={STORAGE_KEY.DEV.SUBJECT} />;
      });

    update();
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
