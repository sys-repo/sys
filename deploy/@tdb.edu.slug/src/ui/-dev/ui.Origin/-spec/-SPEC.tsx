import { Dev, Signal, Spec } from '../../../-test.ui.ts';
import { D } from '../common.ts';
import { DevOrigin } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    return (
      <DevOrigin.UI.Uncontrolled
        //
        debug={v.debug}
        theme={v.theme}
        {...debug.controller.view()}
      />
    );
  }

  function RootControlled() {
    const v = Signal.toObject(p);
    return <DevOrigin.UI.Controlled debug={v.debug} theme={v.theme} origin={p.origin} />;
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    update();
    function update() {
      debug.listen();
      ctx.redraw();
    }

    Signal.effect(update);
    Dev.Theme.signalEffect(ctx, p.theme, 1);

    ctx.subject
      .size([350, null])
      .display('grid')
      .render(() => (p.controlled.value ? <RootControlled /> : <Root />));
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
