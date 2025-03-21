import { Dev, Signal, Spec } from '../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { VimeoBackground } from './mod.ts';

export default Spec.describe('VimeoBackground', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      // 🐷 TODO: hook into signals here.
      ctx.redraw();
    });

    ctx.subject
      .size([224, null])
      .display('grid')
      .render((e) => <VimeoBackground theme={p.theme.value} />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug ctx={{ debug }} />);
  });
});
