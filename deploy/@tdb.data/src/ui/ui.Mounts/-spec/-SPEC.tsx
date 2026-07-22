import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { D, type t } from './common.ts';
import { Mounts } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;
  const origin = 'http://localhost:1234/data/' as t.StringUrl;

  function Root() {
    const v = Signal.toObject(p);
    return <Mounts.UI origin={origin} debug={v.debug} theme={v.theme} />;
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

    ctx.subject
      .size([360, null])
      .display('grid')
      .render(() => <Root />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
