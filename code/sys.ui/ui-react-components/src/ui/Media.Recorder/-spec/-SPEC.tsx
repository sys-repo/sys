import { css, Dev, Signal, Spec } from '../../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { Media } from '../../Media/mod.ts';

export default Spec.describe('MediaRecorder', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    const updateSize = () => {
      const fit = p.fit.value;
      if (fit === 'responsive') ctx.subject.size('fill-x', 150);
      else ctx.subject.size('fill', 150);
      ctx.redraw();
    };

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      updateSize();
    });

    ctx.subject.display('grid').render(() => {
      const waveHeight = 100;
      const styles = {
        base: css({ display: 'grid' }),
        waveform: css({
          Absolute: [null, 0, -(waveHeight + 10), 0],
          height: waveHeight,
        }),
      };
      return (
        <div className={styles.base.class}>
          <Media.Video
            debug={p.debug.value}
            theme={p.theme.value}
            fit={p.fit.value}
            onReady={(e) => {
              console.info(`⚡️ onReady:`, e);
              p.stream.value = e.stream;
            }}
          />
          <Media.AudioWaveform
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
