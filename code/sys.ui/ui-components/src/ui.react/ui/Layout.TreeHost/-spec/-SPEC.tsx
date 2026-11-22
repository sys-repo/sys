import { Harness, Signal, Spec } from '../../-test.ui.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';
import { SpecRoot } from './-SPEC.ui.Root.tsx';
import { BackButton } from './-ui.BackButton.tsx';
import { css, D } from './common.ts';

export default Spec.describe(D.displayName, async (e) => {
  const debug = createDebugSignals();
  const p = debug.props;

  function Root() {
    const v = Signal.toObject(p);
    const styles = {
      base: css({ position: 'relative', display: 'grid' }),
      back: css({ Absolute: [-35, null, null, -35] }),
    };

    return (
      <div className={styles.base.class}>
        <BackButton
          style={styles.back}
          theme={v.theme}
          selectedPath={v.selectedPath}
          onBack={(e) => (p.selectedPath.value = e.next)}
        />
        <SpecRoot debug={debug} />
      </div>
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);
    debug.attach(ctx, {
      subject: { size: 'fill', margin: 80, display: 'grid', render: () => <Root /> },
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
