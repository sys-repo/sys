import { Dev, Signal, Spec } from '../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { Color } from './common.ts';
import { LayoutCenterColumn } from './mod.ts';

export default Spec.describe('LayoutCenterColumn', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      ctx.host.tracelineColor(Color.alpha(Color.DARK, 0.12));
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size('fill')
      .display('grid')
      .render((e) => (
        <LayoutCenterColumn
          theme={p.theme.value}
          debug={p.debug.value}
          left={p.left.value}
          center={p.center.value}
          right={p.right.value}
          gap={p.gap.value}
        />
      ));
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
