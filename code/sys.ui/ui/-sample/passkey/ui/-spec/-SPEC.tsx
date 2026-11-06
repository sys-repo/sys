import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { D } from './common.ts';
import { Passkey } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    return (
      <Passkey.UI
        snapshot={v.fixture.snapshot}
        {...(v.callbacksEnabled ? debug.actions : {})}
        debug={v.debug}
        theme={v.theme}
      />
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    const stopRedraw = Signal.effect(() => {
      debug.listen();
      void ctx.redraw();
    });
    ctx.dispose$.subscribe(() => {
      stopRedraw();
      debug.dispose();
    });
    Harness.Theme.signalEffect(ctx, p.theme, 1);

    ctx.subject
      .size([360, null])
      .display('grid')
      .render(() => <Root />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
