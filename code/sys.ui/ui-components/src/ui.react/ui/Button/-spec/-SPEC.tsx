import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { Root } from './-ui.Root.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Harness.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size()
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        return (
          <Root
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
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
