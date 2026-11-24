import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { D } from '../common.ts';
import { IconSwatches } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    return (
      <IconSwatches.View
        debug={v.debug}
        theme={v.theme}
        items={v.items}
        minSize={v.minSize}
        maxSize={v.maxSize}
        percent={v.percent}
        selected={v.selected}
        onSizeChange={(e) => {
          console.info(`⚡️ onSizeChange:`, e);
          p.percent.value = e.percent;
        }}
        onSelect={(e) => {
          console.info(`⚡️ onSelect:`, e);
          p.selected.value = e.path;
        }}
      />
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    debug.attach(ctx, {
      subject: { size: 'fill', display: 'grid', render: () => <Root /> },
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
