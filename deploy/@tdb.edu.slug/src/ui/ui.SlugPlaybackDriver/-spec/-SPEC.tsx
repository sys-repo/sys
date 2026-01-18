import { Dev, Signal, Spec } from '../../-test.ui.ts';
import { css, D } from '../common.ts';
import { SlugPlaybackDriver } from '../mod.ts';
import { TreeHost } from '../../ui.TreeHost/mod.ts';
import { BackButton } from '../../ui.TreeHost/-spec/mod.ts';
import { Debug, createDebugSignals } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
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
          // selectedPath={v.selectedPath}
          // onBack={(e) => (p.selectedPath.value = e.next)}
        />
        <TreeHost.UI debug={v.debug} theme={v.theme} />
      </div>
    );
  }

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    update();
    function update() {
      debug.listen();
      ctx.redraw();
    }

    Signal.effect(update);
    Dev.Theme.signalEffect(ctx, p.theme, 1);

    ctx.subject
      .size('fill', 80)
      .display('grid')
      .render(() => <Root />);
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    ctx.debug.row(<Debug debug={debug} />);
  });
});
