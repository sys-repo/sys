import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { D, type t } from './common.ts';
import { HttpOrigin } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    return (
      <HttpOrigin.UI.Controlled
        env={p.env}
        origin={p.origin}
        verify={v.integrity ? true : undefined}
        debug={v.debug}
        theme={v.theme}
      />
    );
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

    ctx.debug.width(450);
    ctx.subject
      .size([420, null])
      .display('grid')
      .render(() => <Root />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
