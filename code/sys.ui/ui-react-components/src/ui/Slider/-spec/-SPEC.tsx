import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Slider } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe('Slider', (e) => {
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
      .size([350, null])
      .display('grid')
      .render(() => (
        <Slider
          debug={p.debug.value}
          theme={p.theme.value}
          enabled={p.enabled.value}
          percent={p.percent.value}
          thumb={p.thumb.value}
          track={p.track.value}
          ticks={p.ticks.value}
          onChange={(e) => {
            console.info('⚡️ onChange', e);
            p.percent.value = e.percent;
          }}
        />
      ));
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
