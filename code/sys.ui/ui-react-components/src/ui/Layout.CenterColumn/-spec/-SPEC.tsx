import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Color } from '../common.ts';
import { LayoutCenterColumn } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe('LayoutCenterColumn', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    function update() {
      const theme = Color.theme(p.theme.value);
      ctx.host.tracelineColor(Color.alpha(theme.fg, 0.12));
      ctx.redraw();
    }

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      update();
    });

    ctx.subject
      .size('fill')
      .display('grid')
      .render((e) => {
        const v = Signal.toObject(p);
        return (
          <LayoutCenterColumn
            theme={v.theme}
            debug={v.debug}
            left={v.left}
            center={v.center}
            right={v.right}
            gap={v.gap}
            centerWidth={v.centerWidth}
            align={v.align}
          />
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
