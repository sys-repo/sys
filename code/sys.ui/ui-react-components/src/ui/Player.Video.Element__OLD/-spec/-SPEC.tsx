import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { VideoElement__OLD } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;
  const v = debug.video.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    const updateSize = () => {
      const width = debug.props.width.value;
      ctx.subject.size([width, null]);
      ctx.redraw();
    };

    Dev.Theme.signalEffect(ctx, p.theme);
    Signal.effect(() => {
      debug.listen();
      updateSize();
    });

    ctx.subject.display('grid').render(() => {
      if (!p.render.value) return null;
      return (
        <VideoElement__OLD
          debug={p.debug.value}
          theme={p.theme.value}
          video={debug.video}
          onEnded={(e) => console.info(`⚡️ onEnded:`, e)}
          onSeek={(e) => (v.currentTime.value = e.currentTime)}
        />
      );
    });

    // Initialize:
    updateSize();
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
