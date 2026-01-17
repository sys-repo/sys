import { Dev, Signal, Spec } from '../../-test.ui.ts';

import { css, D } from '../common.ts';
import { SlugSheetStack } from '../mod.ts';
import { createDebugSignals, Debug } from './-SPEC.Debug.tsx';

export default Spec.describe(D.displayName, async (e) => {
  const debug = await createDebugSignals();
  const p = debug.props;
  const fixture = debug.fixture;

  /**
   * Root Test Subject
   */
  function Root() {
    const v = Signal.toObject(debug.props);
    const stackProps = fixture.stackController.props();

    const styles = {
      base: css({
        display: 'grid',
        position: 'relative',
        minHeight: 520,
      }),
    };

    return (
      <div className={styles.base.class}>
        <SlugSheetStack.UI {...stackProps} debug={v.debug} theme={v.theme} />
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
