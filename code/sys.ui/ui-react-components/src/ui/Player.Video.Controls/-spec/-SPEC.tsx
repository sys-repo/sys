import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { PlayerControls } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

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

    ctx.subject
      .size()
      .display('grid')
      .render(() => {
        return (
          <PlayerControls
            debug={p.debug.value}
            theme={p.theme.value}
            maskOpacity={p.maskOpacity.value}
            maskHeight={p.maskHeight.value}
            buffering={v.buffering.value}
            buffered={v.buffered.value}
            playing={v.playing.value}
            muted={v.muted.value}
            currentTime={v.currentTime.value}
            duration={v.duration.value}
            onClick={(e) => {
              console.info(`⚡️ onClick:`, e);
              if (e.control === 'Play') Signal.toggle(v.playing);
              if (e.control === 'Mute') Signal.toggle(v.muted);
            }}
            onSeeking={(e) => {
              console.info(`⚡️ onSeeking:`, e);
              v.currentTime.value = e.currentTime;
            }}
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
