import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { type t, D } from '../common.ts';
import { VideoElement2 } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

type P = t.VideoElement2Props;

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  /**
   * 🐷 Signal/State Controller:
   */
  const createSignalController = () => {
    const onPlayingChange: P['onPlayingChange'] = (e) => {
      console.info(`⚡️ onPlayingChange:`, e);
      p.playing.value = e.playing;
    };
    const onMutedChange: P['onMutedChange'] = (e) => {
      console.info(`⚡️ onPlayingChange:`, e);
      p.muted.value = e.muted;
    };
    const onEnded: P['onEnded'] = (e) => {
      console.info('⚡️ onEnded:', e);
    };

    return { onPlayingChange, onMutedChange, onEnded };
  };

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    const controller = createSignalController();

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject.display('grid').render(() => {
      const v = Signal.toObject(p);
      return (
        <VideoElement2
          style={{ width: v.width }}
          src={v.src}
          debug={v.debug}
          theme={v.theme}
          muted={v.muted}
          loop={v.loop}
          borderRadius={v.borderRadius}
          aspectRatio={v.aspectRatio}
          //
          playing={v.playing}
          autoPlay={v.autoPlay}
          //
          onPlayingChange={controller.onPlayingChange}
          onMutedChange={controller.onMutedChange}
          onEnded={controller.onEnded}
        />
      );
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
