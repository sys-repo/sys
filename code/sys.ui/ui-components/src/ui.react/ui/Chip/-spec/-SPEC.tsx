import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { D } from './common.ts';
import { Chip } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { Overflow } from './-ui.Overflow.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    if (v.examples) return <Overflow {...v} />;
    return (
      <div style={{ fontSize: v.fontSize, width: v.truncate ? v.width : undefined }}>
        <Chip.UI
          debug={v.debug}
          theme={v.theme}
          size={v.size}
          mono={v.mono}
          truncate={v.truncate}
        >
          {v.text}
        </Chip.UI>
      </div>
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    debug.attach(ctx, {
      subject: { display: 'grid', render: () => <Root /> },
      effects: [
        () => void Harness.Theme.background(ctx, p.theme.value, 1),
        () => {
          debug.listen();
          ctx.redraw();
        },
      ],
    });
    ctx.host.tracelineColor(0.03);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
