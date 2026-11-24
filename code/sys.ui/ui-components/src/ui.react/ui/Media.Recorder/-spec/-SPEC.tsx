import { css, Harness, Is, Spec } from '../../-test.ui.ts';
import { Media } from '../../Media/mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe('MediaRecorder', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
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
          zoom={Media.Config.Zoom.toRatio(p.zoom.value)}
          constraints={{
            audio: {
              deviceId: p.selectedAudio.value?.deviceId,
              channelCount: { ideal: 2 },
              sampleRate: { ideal: 48_000 },
              sampleSize: { ideal: 16 },
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
            video: {
              deviceId: p.selectedCamera.value?.deviceId,
              width: { ideal: 1280 }, // 1280×720 HD
              height: { ideal: 720 },
              frameRate: { ideal: 30 }, // 30 fps
            },
          }}
          onReady={(e) => {
            console.info(`⚡️ Video.Stream.onReady:`, e);
            p.stream.value = e.stream.filtered;
            p.selectedCamera.value = e.device;
          }}
        />
        <Media.AudioWaveform.UI
          stream={p.stream.value}
          style={styles.waveform}
          theme={p.theme.value}
        />
      </div>
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    debug.attach(ctx, {
      subject: { display: 'grid', render: () => <Root /> },
      effects: [
        () => void Harness.Theme.background(ctx, p.theme.value, 1),
        () => {
          if (Is.nil(p.aspectRatio.value)) ctx.subject.size('fill', 100);
          else ctx.subject.size('fill-x', 150);
        },
        () => {
          debug.listen();
          ctx.redraw();
        },
      ],
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
