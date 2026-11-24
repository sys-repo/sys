import { Harness, Spec } from '../../-test.ui.ts';
import { D } from './common.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { Root } from './-ui.Root.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;
  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    debug.attach(ctx, {
      subject: { size: undefined, display: 'grid', render: () => <Root debug={debug} /> },
      effects: [
        () => void Harness.Theme.background(ctx, p.theme.value, 1),
        () => void ctx.host.tracelineColor(0.03),
        () => {
          debug.listen();
          ctx.subject.size([320, null]);
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
