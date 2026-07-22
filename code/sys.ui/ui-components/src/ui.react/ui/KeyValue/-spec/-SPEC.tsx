import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { D } from './common.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { Root } from './-ui.Root.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;
  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    function update() {
      ctx.subject.size([320, null]);
      ctx.redraw();
    }

    Harness.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      update();
    });

    ctx.host.tracelineColor(0.03);
    ctx.subject.size().display('grid').render(() => <Root debug={debug} />);

    update();
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
