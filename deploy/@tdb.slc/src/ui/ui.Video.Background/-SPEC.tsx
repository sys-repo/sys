import { Dev, Signal, Spec } from '../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { VideoBackground } from './mod.ts';

export default Spec.describe('VideoBackground', (e) => {
  const debug = createDebugSignals();
  const app = debug.app;
  const p = app.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, debug.props.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size('fill')
      .display('grid')
      .render((e) => <VideoBackground state={app} fadeDuration={debug.props.fadeDuration.value} />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
