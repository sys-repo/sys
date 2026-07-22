import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { VideoDecks } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    return (
      <VideoDecks.UI
        debug={v.debug}
        theme={v.theme}
        style={{ width: v.width }}
        show={v.show}
        decks={debug.decks}
        active={v.active}
        aspectRatio={v.aspectRatio}
        muted={v.muted}
      />
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    update();
    function update() {
      debug.listen();
      ctx.redraw();
    }

    Signal.effect(update);
    Dev.Theme.signalEffect(ctx, p.theme, 1);
    ctx.subject.display('grid').render(() => <Root />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
