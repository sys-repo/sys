import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

import { setup } from './-setup.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', async (e) => {
    const ctx = Spec.ctx(e);

    const el = await setup();

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size('fill', 100)
      .display('grid')
      .render(() => {
        return el;
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
