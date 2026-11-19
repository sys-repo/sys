import { Harness, Spec } from '../../-test.ui.ts';
import { D } from './common.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { Root } from './-ui.Root.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    debug.attach(ctx, {
      subject: {
        size: [p.width.value, null],
        display: 'grid',
        render: () => <Root debug={debug} />,
      },
      effects: [
        () => void Harness.Theme.background(ctx, p.theme.value, 1),
        () => void ctx.subject.size([p.width.value, null]),
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
