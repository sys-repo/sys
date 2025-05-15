import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Filters } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe('Media.Filter', (e) => {
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
        <Filters.UI.Filter
          name={p.name.value}
          label={p.label.value}
          value={p.value.value}
          unit={p.unit.value}
          range={p.range.value}
          debug={p.debug.value}
          theme={p.theme.value}
          onChange={(e) => {
            console.info(`⚡️ Filter.onChange:`, e);
            p.value.value = e.value;
          }}
        />
      ));
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
