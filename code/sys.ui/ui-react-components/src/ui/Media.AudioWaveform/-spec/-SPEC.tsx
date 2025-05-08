import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { AudioWaveform } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe('Audio', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size('fill-x')
      .display('grid')
      .render(() => {
        return (
          <AudioWaveform
            //
            debug={p.debug.value}
            theme={p.theme.value}
            stream={p.stream.value}
            style={{ height: 100 }}
          />
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
