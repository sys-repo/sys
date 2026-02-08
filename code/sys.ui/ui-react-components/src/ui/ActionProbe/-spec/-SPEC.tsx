import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { ActionProbe } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    return (
      <ActionProbe.Result
        style={{ width: 420 }}
        debug={v.debug}
        theme={v.theme}
        spinning={v.spinning}
        items={v.result.items}
        response={v.result.response}
        obj={v.result.obj}
        sizeMode={v.sizeMode}
      />
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    update();
    function update() {
      const mode = p.sizeMode.value;
      if (mode === 'fill') ctx.subject.size('fill-y', 100);
      if (mode === 'auto') ctx.subject.size([null, null]);
      debug.listen();
      ctx.redraw();
    }

    Signal.effect(update);
    Dev.Theme.signalEffect(ctx, p.theme, 1);

    ctx.debug.width(420);
    ctx.subject.display('grid').render(() => <Root />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
