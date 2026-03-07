import { Dev, Signal, Spec } from '../../ui/-test.ui.ts';
import { D } from './common.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { Root } from './-SPEC.ui.Root.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    function update() {
      debug.listen();
      ctx.redraw();
    }

    Signal.effect(update);
    Dev.Theme.signalEffect(ctx, p.theme, 1);

    ctx.subject
      .size([640, null])
      .display('grid')
      .render(() => <Root debug={debug} />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
