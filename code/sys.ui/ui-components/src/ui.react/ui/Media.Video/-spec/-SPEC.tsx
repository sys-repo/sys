import { Harness, Is, Signal, Spec } from '../../-test.ui.ts';
import { Media } from '../../Media/mod.ts';
import { Video } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe('MediaVideoFiltered', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    const selectedVideo = v.selectedVideo?.deviceId;
    const selectedAudio = v.selectedAudio?.deviceId;

    return (
      <Video.UI.Stream
        debug={v.debug}
        // debugFilter={(e) => e.key.startsWith('raw.')}
        theme={v.theme}
        filter={v.filter}
        borderRadius={v.borderRadius}
        aspectRatio={v.aspectRatio}
        muted={v.muted}
        zoom={Media.Config.Zoom.toRatio(v.zoom)}
        stream={v.stream}
        constraints={{
          video: selectedVideo ? { deviceId: { exact: selectedVideo } } : true,
          audio: selectedAudio ? { deviceId: { exact: selectedAudio } } : true,
        }}
        onReady={(e) => {
          console.info(`⚡️ Media.Video.onReady:`, e);
          Media.Log.tracks('- stream.raw', e.stream.raw);
          Media.Log.tracks('- stream.filtered', e.stream.filtered);
        }}
        onError={(e) => {
          console.info(`⚡️ Media.Video.onError:`, e);
        }}
      />
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    debug.attach(ctx, {
      subject: { size: undefined, display: 'grid', render: () => <Root /> },
      effects: [
        () => void Harness.Theme.background(ctx, p.theme.value, 1),
        () => {
          if (Is.nil(p.aspectRatio.value)) ctx.subject.size('fill', 150);
          else ctx.subject.size('fill-x', 200);
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
