import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { Item } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    const width = 350;
    return (
      <Item.UI
        debug={v.debug}
        theme={v.theme}
        style={{ width }}
        label={v.label}
        description={v.description}
        active={v.active}
        enabled={v.enabled}
        selected={v.selected}
        chevron={v.chevron}
        padding={debug.padding}
        // onPointer={(e) => console.info(`⚡️ onPointer:`, e)}
        onPressDown={(e) => console.info(`⚡️ onPressDown:`, e)}
        onPressUp={(e) => console.info(`⚡️ onPressUp:`, e)}
      />
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    debug.attach(ctx, {
      subject: { size: undefined, display: 'grid', render: () => <Root /> },
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
