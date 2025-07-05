import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Media } from '../../Media/mod.ts';
import { Video } from '../mod.ts';
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

    ctx.subject
      .size()
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        return (
          <Video.UI.Stream
            debug={v.debug}
            theme={v.theme}
            filter={v.filter}
            borderRadius={v.borderRadius}
            aspectRatio={v.aspectRatio}
            muted={v.muted}
            zoom={Media.Config.Zoom.toRatio(v.zoom)}
            stream={v.stream}
            constraints={{
              audio: true,
              video: { deviceId: v.selectedCamera?.deviceId },
            }}
            onReady={(e) => {
              console.info(`⚡️ Media.Video.onReady:`, e);
              Media.Log.tracks('- stream.raw', e.stream.raw);
              Media.Log.tracks('- stream.filtered', e.stream.filtered);

              // Update signal state:
              p.selectedCamera.value = e.device;
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
