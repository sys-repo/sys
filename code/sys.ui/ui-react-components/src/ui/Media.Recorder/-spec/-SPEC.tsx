import { css, Dev, Signal, Spec } from '../../-test.ui.ts';
import { Media } from '../../Media/mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe('MediaRecorder', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    const updateSize = () => {
      const aspectRatio = p.aspectRatio.value;
      if (aspectRatio == null) ctx.subject.size('fill', 100);
      else ctx.subject.size('fill-x', 150);
      ctx.redraw();
    };

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      updateSize();
    });

    ctx.subject.display('grid').render(() => {
      const height = 100;
      const styles = {
        base: css({ display: 'grid' }),
        waveform: css({
          Absolute: [null, 0, -(height + 10), 0],
          height,
        }),
      };
      return (
        <div className={styles.base.class}>
          <Media.Video.UI.Stream
            debug={p.debug.value}
            theme={p.theme.value}
            filter={p.filter.value}
            aspectRatio={p.aspectRatio.value}
            constraints={{
              audio: true,
              video: { deviceId: p.selectedCamera.value?.deviceId },
            }}
            onReady={(e) => {
              console.info(`⚡️ Video.Stream.onReady:`, e);
              p.stream.value = e.stream.filtered;
              p.selectedCamera.value = e.device;
            }}
          />
          <Media.UI.AudioWaveform
            stream={p.stream.value}
            style={styles.waveform}
            theme={p.theme.value}
          />
        </div>
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
