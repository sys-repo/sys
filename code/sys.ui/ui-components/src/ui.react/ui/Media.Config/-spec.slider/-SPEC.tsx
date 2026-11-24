import { Harness, Spec } from '../../-test.ui.ts';
import { Config } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe('Media.Config.Slider', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    return (
      <Config.UI.Slider
        label={p.label.value}
        value={p.value.value}
        unit={p.unit.value}
        range={p.range.value}
        debug={p.debug.value}
        theme={p.theme.value}
        onChange={(e) => {
          console.info(`⚡️ Slider.onChange:`, e);
          p.value.value = e.value;
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
