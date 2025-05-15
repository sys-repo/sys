import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { Filters } from '../mod.ts';

export default Spec.describe('Filters', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size([350, null])
      .display('grid')
      .render(() => <Filters debug={p.debug.value} theme={p.theme.value} />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
