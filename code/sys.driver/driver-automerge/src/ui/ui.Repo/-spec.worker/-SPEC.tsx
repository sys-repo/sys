import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { Sample } from './-ui.tsx';

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
      .size([360, null])
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        return <Sample theme={v.theme} debug={v.debug} repo={debug.repo} />;
      });

    update();
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
