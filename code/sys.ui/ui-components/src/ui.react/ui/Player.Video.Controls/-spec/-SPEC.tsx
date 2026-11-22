import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { PlayerControls } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    const video = debug.video.props;
    return (
      <PlayerControls.UI
        debug={v.debug}
        theme={v.theme}
        enabled={v.enabled}
        //
        buffering={video.buffering.value}
        buffered={video.buffered.value}
        playing={video.playing.value}
        muted={video.muted.value}
        currentTime={video.currentTime.value}
        duration={video.duration.value}
        //
        maskOpacity={v.maskOpacity}
        maskHeight={v.maskHeight}
        padding={v.padding}
        margin={v.margin}
        background={v.background}
        //
        onClick={(e) => {
          console.info(`⚡️ onClick:`, e);
          if (e.button === 'Play') Signal.toggle(video.playing);
          if (e.button === 'Mute') Signal.toggle(video.muted);
        }}
        onSeeking={(e) => {
          console.info(`⚡️ onSeeking:`, e);
          video.currentTime.value = e.currentTime;
        }}
      />
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    debug.attach(ctx, {
      subject: { size: undefined, display: 'grid', render: () => <Root /> },
      effects: [
        () => void Harness.Theme.background(ctx, p.theme.value),
        () => void ctx.subject.size([p.width.value, null]),
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
