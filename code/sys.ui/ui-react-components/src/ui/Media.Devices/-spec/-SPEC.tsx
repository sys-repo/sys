import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { Devices } from '../mod.ts';

export default Spec.describe('Devices', (e) => {
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
      .size([400, null])
      .display('grid')
      .render(() => (
        <Devices.UI.List
          debug={p.debug.value}
          theme={p.theme.value}
          selected={p.selected.value}
          rowGap={p.rowGap.value}
          filter={(e) => {
            if (!p.filter.value) return true;
            return e.kind === 'videoinput';
          }}
          onSelect={(e) => {
            console.info(`⚡️ onSelect:`, e);
            p.selected.value = e.index;
          }}
        />
      ));
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
