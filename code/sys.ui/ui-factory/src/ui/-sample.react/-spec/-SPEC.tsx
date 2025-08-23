import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { css, D } from '../common.ts';
import { SampleReact } from '../ui.tsx';
import { type Sample, createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function DebugTitle(props: { value?: Sample; label?: string }) {
    const { label = 'Sample', value } = props;
    const hasValue = !!value;

    const styles = {
      base: css({
        fontSize: 11,
        Absolute: [-30, null, null, -44],
        display: 'grid',
        gridAutoFlow: 'column',
        alignItems: 'center',
        columnGap: 4,
      }),
      key: css({ opacity: 0.4 }),
      value: css({ opacity: hasValue ? 1 : 0.4 }),
    };

    return (
      <div className={styles.base.class}>
        <span className={styles.key.class}>{`${label}:`}</span>
        <span className={styles.value.class}>{value || '(none)'}</span>
      </div>
    );
  }

  e.it('init', async (e) => {
    const ctx = Spec.ctx(e);

    Dev.Theme.signalEffect(ctx, p.theme, 1);
    Signal.effect(() => {
      debug.listen();
      ctx.redraw();
    });

    ctx.subject
      .size([500, 400])
      .display('grid')
      .render(() => {
        const v = Signal.toObject(p);
        return (
          <div className={css({ display: 'grid' }).class}>
            <DebugTitle value={v.sample} />
            <SampleReact
              debug={v.debug}
              theme={v.theme}
              //
              plan={v.plan}
              factory={v.factory}
            />
          </div>
        );
      });

    // Init:
    await debug.loadSample();
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
