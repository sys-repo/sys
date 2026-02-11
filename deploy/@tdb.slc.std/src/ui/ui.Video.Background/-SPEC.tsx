import { Dev, Signal, Spec } from '../-test.ui.ts';
import { D } from './common.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { VideoBackground } from './mod.ts';

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
      .size('fill')
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        return (
          <VideoBackground
            video={v.video}
            playing={v.playing}
            opacity={v.opacity}
            blur={v.blur}
            theme={v.theme}
          />
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
