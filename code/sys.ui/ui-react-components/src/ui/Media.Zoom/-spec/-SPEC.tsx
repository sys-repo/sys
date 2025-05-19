import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { Media } from '../../Media/mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
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
      .size('fill', 150)
      .display('grid')
      .render(() => {
        return (
          <Media.Video.UI.Stream
            debug={p.debug.value}
            theme={p.theme.value}
            constraints={{
              audio: false,
              video: { deviceId: p.selectedCamera.value?.deviceId },
            }}
            onReady={(e) => {
              console.info(`⚡️ Media.Video.onReady:`, e);
              p.selectedCamera.value = e.device;
            }}
          />
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
