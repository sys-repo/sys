import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { CompositeVideo } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    function update() {
      ctx.redraw();
    }

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      update();
    });

    ctx.subject
      .size([420, null])
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        v.videos;
        return (
          <CompositeVideo.View
            debug={v.debug}
            theme={v.theme}
            videos={v.videos}
            onTimeUpdate={(e) => console.info(`⚡️ onTimeUpdate`, e)}
          />
        );
      });

    update();
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
