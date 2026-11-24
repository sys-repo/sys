import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { Color } from '../common.ts';
import { CenterColumn } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe('CenterColumn (Layout)', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    return (
      <CenterColumn
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
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    debug.attach(ctx, {
      subject: { size: 'fill', display: 'grid', render: () => <Root /> },
      effects: [
        () => {
          const theme = p.theme.value;
          Harness.Theme.background(ctx, theme, 1);
          ctx.host.tracelineColor(Color.alpha(Color.theme(theme).fg, 0.12));
        },
        () => {
          debug.listen();
          ctx.redraw();
        },
      ],
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
