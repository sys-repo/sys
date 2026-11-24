import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { D } from './common.ts';
import { Admonition } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    return <Admonition.UI debug={v.debug} theme={v.theme} />;
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    debug.attach(ctx, {
      subject: { size: [360, null], display: 'grid', render: () => <Root /> },
      effects: [
        () => void Harness.Theme.background(ctx, p.theme.value, 1),
        () => {
          debug.listen();
          void ctx.redraw();
        },
      ],
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
