import { Harness, Spec } from '../../-test.ui.ts';
import { Config } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe('Media.Config.Filters', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    return (
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
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    debug.attach(ctx, {
      subject: { size: [350, null], display: 'grid', render: () => <Root /> },
      effects: [
        () => void Harness.Theme.background(ctx, p.theme.value),
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
