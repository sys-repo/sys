import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { D } from './common.ts';
import { ProseMarkdown } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { Sample } from './-ui.Sample.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    const renderers = Sample.renderersFor(v.sample, v.theme);
    return (
      <ProseMarkdown.UI debug={v.debug} theme={v.theme} value={v.value} renderers={renderers} />
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    update();
    function update() {
      debug.listen();
      ctx.redraw();
    }

    Signal.effect(update);
    Harness.Theme.signalEffect(ctx, p.theme, 1);

    ctx.subject
      .size([450, null])
      .display('grid')
      .render(() => <Root />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
