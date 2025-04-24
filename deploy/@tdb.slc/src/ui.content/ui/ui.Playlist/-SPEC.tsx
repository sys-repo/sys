import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { Playlist } from './mod.ts';

export default Spec.describe('Playlist', (e) => {
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
      .size([390, 500])
      .render(() => (
        <Playlist
          theme={p.theme.value}
          debug={p.debug.value}
          items={p.items.value}
          selected={p.selected.value}
          filled={p.filled.value}
          paddingTop={50}
          style={{ Margin: [0, 30, 30, 30] }}
        />
      ));
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
