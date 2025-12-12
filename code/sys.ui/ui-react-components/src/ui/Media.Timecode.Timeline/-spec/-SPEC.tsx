import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { MediaTimecode } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    update();
    function update() {
      debug.listen();
      ctx.redraw();
    }

    Signal.effect(update);
    Dev.Theme.signalEffect(ctx, p.theme, 1);

    ctx.subject
      .size('fill')
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        return (
          <MediaTimecode.Dev.Harness
            debug={v.debug}
            theme={v.theme}
            video={debug.video}
            bundle={v.bundle}
          />
        );
      });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
