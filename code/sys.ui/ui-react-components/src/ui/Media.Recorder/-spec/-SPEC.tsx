import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { MediaRecorder } from '../mod.ts';
import { MediaVideo } from '../common.ts';

export default Spec.describe('MediaRecorder', (e) => {
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
      .size('fill-x', 150)
      .display('grid')
      .render(() => (
        <MediaVideo
          debug={p.debug.value}
          theme={p.theme.value}
          onReady={(e) => {
            console.info(`⚡️ onReady:`, e);
            p.stream.value = e.stream;
          }}
        />
      ));
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
