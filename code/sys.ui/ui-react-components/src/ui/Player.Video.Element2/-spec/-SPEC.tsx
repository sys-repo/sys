import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Player } from '../../Player/m.Player.ts';
import { type t, D } from '../common.ts';
import { VideoElement2 } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function UncontrolledSubject() {
    const v = Signal.toObject(p);
    return (
      <VideoElement2
        style={{ width: v.width }}
        src={v.src}
        debug={v.debug}
        theme={v.theme}
        muted={v.muted}
        loop={v.loop}
        cornerRadius={v.cornerRadius}
        aspectRatio={v.aspectRatio}
        //
        playing={v.playing}
        autoPlay={v.autoPlay}
        //
        onPlayingChange={(e) => {
          console.info(`⚡️ onPlayingChange:`, e);
          p.playing.value = e.playing;
        }}
        onMutedChange={(e) => {
          console.info(`⚡️ onMutedChange:`, e);
          p.muted.value = e.muted;
        }}
        onEnded={(e) => {
          console.info('⚡️ onEnded:', e);
        }}
      />
    );
  }

  function ControlledSubject() {
    const v = Signal.toObject(p);
    const signals = debug.controlled.signals;
    const controller = Player.Video.useSignals(signals, { silent: false });
    return <VideoElement2 style={{ width: v.width }} {...controller.props} />;
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject.display('grid').render(() => {
      const controlled = p.controlled.value;
      return controlled ? <ControlledSubject /> : <UncontrolledSubject />;
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
