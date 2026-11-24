import { Harness, Spec } from '../../-test.ui.ts';
import { Spinners } from '../../Spinners/mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { D, Signal } from './common.ts';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    return <Spinners.Circular {...Signal.toObject(p)} />;
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    debug.attach(ctx, {
      subject: { size: undefined, display: 'grid', render: () => <Root /> },
      effects: [
        () => Harness.Theme.background(ctx, p.theme.value ?? 'Dark'),
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
