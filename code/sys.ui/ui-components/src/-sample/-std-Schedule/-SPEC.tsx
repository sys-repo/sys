import { Color, css, Dev, ObjectView, Signal, Spec } from '../-test.ui.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { D } from './common.ts';

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
        <ObjectView theme={v.theme} name={'timestamp markers'} data={v.marks} expand={1} />
        <div className={styles.label.class}>{'( hint: open console )'}</div>
      </div>
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size([400, null])
      .display('grid')
      .render(() => <Root />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
