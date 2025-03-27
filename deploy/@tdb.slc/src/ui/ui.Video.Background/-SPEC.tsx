import { Dev, Signal, Spec } from '../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { VideoBackground } from './mod.ts';

export default Spec.describe('VideoBackground', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      p.theme.value;
      p.opacity.value;
      ctx.redraw();
    });

    ctx.subject
      .size('fill')
      .display('grid')
      .render((e) => <VideoBackground theme={p.theme.value} opacity={p.opacity.value} />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug ctx={{ debug }} />);
  });
});
