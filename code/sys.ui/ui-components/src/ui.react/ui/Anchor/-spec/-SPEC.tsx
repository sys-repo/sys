import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { D } from './common.ts';
import { Anchor } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { FocusExamples } from './-ui.FocusExamples.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    if (v.focusExamples) return <FocusExamples theme={v.theme} enabled={v.enabled} />;
    return (
      <Anchor.UI
        theme={v.theme}
        href={v.href}
        enabled={v.enabled}
        target={v.target}
        download={v.download}
      >
        {v.children}
      </Anchor.UI>
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

    ctx.host.tracelineColor(0.05);
    ctx.subject
      .size()
      .display('grid')
      .render(() => <Root />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
