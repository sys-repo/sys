import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Filters } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe('Media.Filters', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size([350, null])
      .display('grid')
      .render(() => (
        <Filters.UI.List
          debug={p.debug.value}
          theme={p.theme.value}
          values={p.values.value}
          debounce={p.debounce.value}
          onChange={(e) => {
            console.info(`⚡️ Filters.onChange:`, e);
            p.values.value = e.values;
          }}
          onChanged={(e) => {
            console.info(`🌳 Filters.onChanged:`, e);
          }}
        />
      ));
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
