import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { Devices } from '../mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe('Devices', (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    function updateSize() {
      const isNarrow = p.debugNarrow.value;
      ctx.subject.size([isNarrow ? 400 : 240, null]);
      ctx.redraw();
    }
    updateSize(); // Iniital seed.

    Dev.Theme.signalEffect(ctx, p.theme);
    Signal.effect(() => {
      debug.listen();
      updateSize();
    });

    ctx.subject.display('grid').render(() => (
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
