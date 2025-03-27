import { Dev, Signal, Spec } from '../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { MobileLayout } from './mod.ts';

export default Spec.describe('MobileLayout', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      p.theme.value;
      p.stage.value;
      ctx.redraw();
    });

    ctx.subject
      .size([390, 844]) // ← iPhone
      .display('grid')
      .render((e) => {
        const stage = p.stage.value;
        return <MobileLayout theme={p.theme.value} ctx={{ stage }} />;
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
