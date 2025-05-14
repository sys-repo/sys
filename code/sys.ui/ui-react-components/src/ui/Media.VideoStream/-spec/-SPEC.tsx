import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { VideoStream } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe('MediaVideoFiltered', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    const updateSize = () => {
      const aspectRatio = p.aspectRatio.value;
      if (aspectRatio == null) ctx.subject.size('fill', 150);
      else ctx.subject.size('fill-x', 200);
      ctx.redraw();
    };

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      updateSize();
    });

    ctx.subject.display('grid').render(() => {
      return (
        <VideoStream.View
          debug={p.debug.value}
          theme={p.theme.value}
          filter={p.filter.value}
          borderRadius={p.borderRadius.value}
          aspectRatio={p.aspectRatio.value}
          onReady={(e) => {
            console.info(`⚡️ VideoStream.onReady:`, e);
            // p.aspectRatio.value = e.aspectRatio;
          }}
        />
      );
    });

    /**
     * Initial state:
     */
    updateSize();
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
