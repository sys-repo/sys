import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { VideoDecks } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

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
    debug.attach(ctx, {
      subject: { display: 'grid', render: () => <Root /> },
      effects: [
        () => void Harness.Theme.background(ctx, p.theme.value, 1),
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
