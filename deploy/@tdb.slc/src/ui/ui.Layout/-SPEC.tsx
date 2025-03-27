import { Dev, Signal, Spec } from '../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { LayoutMobile } from './mod.ts';

export default Spec.describe('MobileLayout', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.signals.theme, 1);
    Signal.effect(() => {
      p.signals.listen();
      ctx.redraw();
    });

    ctx.subject
      .size([390, 844]) // ← iPhone
      .display('grid')
      .render((e) => {
        return <LayoutMobile signals={p.signals} />;
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
