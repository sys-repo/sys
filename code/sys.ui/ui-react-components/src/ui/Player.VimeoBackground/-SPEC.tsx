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
      p.video.value;
      p.opacity.value;
      p.blur.value;
      ctx.redraw();
    });

    ctx.subject
      .size('fill')
      .display('grid')
      .render((e) => (
        <VimeoBackground
          theme={p.theme.value}
          video={p.video.value}
          opacity={p.opacity.value}
          blur={p.blur.value}
        />
      ));
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug ctx={{ debug }} />);
  });
});
