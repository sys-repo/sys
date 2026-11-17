import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { D } from './common.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { Root } from './-ui.Root.tsx';
import { StandardLink } from './-ui.StandardLink.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    ctx.debug.width(480);
    debug.attach(ctx, {
      subject: {
        size: undefined,
        display: 'grid',
        render: () => <Root {...Signal.toObject(p)} />,
      },
      effects: [
        () => void Harness.Theme.background(ctx, p.theme.value, 1),
        () => {
          ctx.host.tracelineColor(0.05);
          ctx.host.footer
            .padding([12, 16])
            .render(() => <StandardLink theme={p.theme.value} />);
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
