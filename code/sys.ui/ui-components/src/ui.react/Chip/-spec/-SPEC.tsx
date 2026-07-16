import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D, type t } from './common.ts';
import { Chip } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    return (
      <div style={{ fontSize: v.fontSize }}>
        <Chip.UI debug={v.debug} theme={v.theme} size={v.size} mono={v.mono}>
          {v.text}
        </Chip.UI>
      </div>
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
    Dev.Theme.signalEffect(ctx, p.theme, 1);

    ctx.host.tracelineColor(0.04);
    ctx.subject
      .display('grid')
      .render(() => <Root />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
