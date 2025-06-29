import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D, Media } from '../common.ts';
import { Avatar } from '../mod.ts';
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
      .size([120, null])
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        return (
          <Avatar
            debug={v.debug}
            theme={v.theme}
            flipped={v.flipped}
            muted={v.muted}
            onReady={(e) => {
              console.info(`⚡️ MediaStream.onReady:`, e);
              Media.Log.tracks('⚡️ MediaStream.raw:', e.stream.raw);
              Media.Log.tracks('⚡️ MediaStream.filtered:', e.stream.filtered);
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
