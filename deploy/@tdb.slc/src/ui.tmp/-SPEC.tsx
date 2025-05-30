import { Dev, Signal, Spec } from '../ui/-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { MyMandelbrot } from './mod.ts';
import { D } from './common.ts';

export default Spec.describe('MyMandelbrot', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size([D.canvasWidth, D.canvasHeight])
      .display('grid')
      .render(() => (
        <MyMandelbrot debug={p.debug.value} theme={p.theme.value} running={p.running.value} />
      ));
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
