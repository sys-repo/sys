import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { D } from './common.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { Samples } from './-ui.Samples.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    return <Samples {...v} />;
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    update();
    function update() {
      debug.listen();
      ctx.redraw();
    }

    Signal.effect(update);
    Harness.Theme.signalEffect(ctx, p.theme, 1);

    ctx.host.tracelineColor(0.03);
    ctx.subject
      .display('grid')
      .render(() => <Root />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
