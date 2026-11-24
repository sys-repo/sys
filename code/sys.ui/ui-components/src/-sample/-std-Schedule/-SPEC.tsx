import { Color, css, Harness, Signal, Spec } from '../-test.ui.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { D, Dev } from './common.ts';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    const theme = Color.theme(v.theme);
    const styles = {
      base: css({ padding: 20, color: theme.fg }),
      label: css({ Absolute: [-25, 0, null, 0], fontSize: 11, textAlign: 'center', opacity: 0.3 }),
    };
    return (
      <div className={styles.base.class}>
        <Dev.ObjectView theme={v.theme} name={'timestamp markers'} data={v.marks} expand={1} />
        <div className={styles.label.class}>{'( hint: open console )'}</div>
      </div>
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    debug.attach(ctx, {
      subject: { size: [400, null], display: 'grid', render: () => <Root /> },
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
