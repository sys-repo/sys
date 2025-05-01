import { Dev, Is, Signal, Spec, asArray } from '../../-test.ui.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';
import { MenuList } from './mod.ts';

export default Spec.describe('MenuList', (e) => {
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
      .size('fill-y')
      .display('grid')
      .render(() => (
        <MenuList
          style={{ width: 390, Padding: [20, 40] }}
          theme={p.theme.value}
          debug={p.debug.value}
          items={p.items.value}
          selected={p.selected.value}
          onSelect={(e) => {
            console.info(`⚡️ onSelect:`, e);
            const isStateful = p.debugStateful.value;
            const isMultiselect = p.debugMultiselect.value;
            if (isStateful) {
              if (!isMultiselect) {
                debug.props.selected.value = e.index;
              } else {
                const current = asArray(p.selected.value).filter((m) => !Is.nil(m));
                const next = [...current, e.index];
                debug.props.selected.value = next;
              }
            }
          }}
        />
      ));
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
