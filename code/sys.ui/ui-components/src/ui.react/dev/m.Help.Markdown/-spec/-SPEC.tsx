import { Dev, Signal, Spec } from '../../../-test.ui.ts';
import { D } from './common.ts';
import { DevHelpMarkdown } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { Sample } from './-u.sample.ts';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    return <DevHelpMarkdown.UI debug={v.debug} theme={v.theme} value={Sample.value(v.sample)} />;
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

    ctx.host.tracelineColor(0.03);
    ctx.subject
      .size([440, null])
      .display('grid')
      .render(() => <Root />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
