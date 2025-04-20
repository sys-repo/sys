import { Dev, Signal, Spec } from '../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { Color, LayoutGroup } from './common.ts';
import { LayoutHGrid } from './mod.ts';

export default Spec.describe('LayoutHGrid', (e) => {
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
        <LayoutGroup>
          <LayoutHGrid
            theme={p.theme.value}
            debug={p.debug.value}
            left={p.left.value}
            column={p.column.value}
            right={p.right.value}
            gap={p.gap.value}
          />
        </LayoutGroup>
      ));
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
