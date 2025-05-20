import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Config } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe('Media.Config.Filters', (e) => {
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
        <Config.Zoom.UI.List
          debug={p.debug.value}
          theme={p.theme.value}
          values={p.values.value}
          debounce={p.debounce.value}
          onChange={(e) => {
            console.info(`⚡️ Zoom.onChange:`, e);
            p.values.value = e.values;
          }}
          onChanged={(e) => {
            console.info(`🌳 Zoom.onChanged:`, e);
            debug.localstore.change((d) => (d.values = e.values));
          }}
        />
      ));
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
