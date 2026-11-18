import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { Root as ButtonRoot } from './-ui.Root.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    return (
      <ButtonRoot
        view={v.view}
        debug={v.debug}
        theme={v.theme}
        enabled={v.enabled}
        active={v.active}
        opacity={v.opacity}
        onClick={(e) => console.info(`⚡️ onClick:`, e)}
        onMouse={(e) => console.info('⚡️ onMouse', e)}
      />
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    debug.attach(ctx, {
      subject: { size: undefined, display: 'grid', render: () => <Root /> },
      effects: [
        () => void Harness.Theme.background(ctx, p.theme.value, 1),
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
