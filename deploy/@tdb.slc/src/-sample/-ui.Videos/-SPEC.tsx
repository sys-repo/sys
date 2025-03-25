import { Dev, Signal, Spec } from '../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { VideosIndex } from './mod.ts';

export default Spec.describe('VideosIndex', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      p.theme.value;
      ctx.redraw();
    });

    ctx.subject
      .size([null, null])
      .display('grid')
      .render((e) => <VideosIndex theme={p.theme.value} signals={p.video} />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug ctx={{ debug }} />);
  });
});
